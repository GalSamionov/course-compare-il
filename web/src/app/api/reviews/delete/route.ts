import { revalidateTag } from 'next/cache';
import type { NextRequest } from 'next/server';
import { listReviewFiles, removeProofFiles } from '@/lib/reviews/files';
import { isUuid } from '@/lib/reviews/types';
import { recomputeAllScores } from '@/lib/score/recompute';
import { fromThisSite } from '@/lib/server/same-origin';
import { createAdminClient } from '@/lib/supabase/admin-client';
import { createServerSupabase } from '@/lib/supabase/server-client';

/** חישוב הציונים של כל הקורסים, אחרי מחיקה של ביקורת שפורסמה. */
export const maxDuration = 60;

/**
 * POST /api/reviews/delete עם { reviewId }. הכותב מוחק ביקורת שלו, בכל מצב (מסמך העיצוב, סעיף 5).
 * קודם הקבצים, דרך ה-API של Storage. אחר כך delete_review(), שמוחקת את הביקורת ואת התשובות, משאירה רק את הטביעה,
 * ורושמת ב-audit_log. ביקורת שפורסמה יוצאת גם מהציון: חישוב מחדש, ורענון של עמוד הקורס ושל הקטלוג.
 */
export async function POST(request: NextRequest) {
  if (!fromThisSite(request)) return Response.json({ error: 'forbidden' }, { status: 403 });

  const supabase = await createServerSupabase();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) return Response.json({ error: 'signed_out' }, { status: 401 });
  const userId = auth.user.id;

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return Response.json({ error: 'not_configured' }, { status: 503 });
  }

  const raw = await request.text();
  let reviewId: unknown;
  try {
    reviewId = raw.length <= 200 ? (JSON.parse(raw) as { reviewId?: unknown } | null)?.reviewId : null;
  } catch {
    reviewId = null;
  }
  if (!isUuid(reviewId)) return Response.json({ error: 'bad_request' }, { status: 400 });

  const { data: review, error: reviewError } = await admin
    .from('reviews')
    .select('id, author_id')
    .eq('id', reviewId)
    .maybeSingle();
  if (reviewError) return Response.json({ error: 'failed' }, { status: 500 });
  if (!review || review.author_id !== userId) return Response.json({ error: 'not_found' }, { status: 404 });

  try {
    const [proofs, uploaded] = await Promise.all([
      admin.from('proofs').select('storage_path').eq('review_id', reviewId),
      listReviewFiles(admin, userId, reviewId),
    ]);
    if (proofs.error) throw proofs.error;
    const paths = new Set([...proofs.data.flatMap((p) => (p.storage_path ? [p.storage_path] : [])), ...uploaded]);
    await removeProofFiles(admin, [...paths]);
  } catch (error) {
    console.error('deleting review files failed', error instanceof Error ? error.message : 'unknown error');
    return Response.json({ error: 'failed' }, { status: 500 });
  }

  const { data: deleted, error: deleteError } = await admin.rpc('delete_review', {
    p_review_id: reviewId,
    p_action: 'author_delete',
    p_actor_id: userId,
  });
  if (deleteError) {
    console.error('delete_review failed', deleteError.message);
    return Response.json({ error: 'failed' }, { status: 500 });
  }

  const row = deleted?.[0];
  if (row?.was_published) {
    // הביקורת כבר נמחקה. חישוב שנכשל לא מחזיר שגיאה לכותב: נרשם ביומן, ו-`pnpm score:recompute` משלים.
    try {
      const { failures } = await recomputeAllScores(admin, new Date());
      if (failures.length > 0) console.error(`recompute after delete: ${failures.length} course(s) failed`);
    } catch (error) {
      console.error('recompute after delete failed', error instanceof Error ? error.message : 'unknown error');
    }
    // { expire: 0 }: הבקשה הבאה מחכה לנתונים חדשים (revalidateTag.md). הצורה בלי פרופיל היא deprecated.
    revalidateTag(`course:${row.course_slug}`, { expire: 0 });
    revalidateTag('catalog', { expire: 0 });
  }
  return Response.json({ ok: true });
}
