'use server';

import { refresh, updateTag } from 'next/cache';
import { adminGate, type AdminDb } from '@/lib/admin/gate';
import { decisionNote, isRejectReason } from '@/lib/admin/reasons';
import { removeProofFiles } from '@/lib/reviews/files';
import { paidBucket } from '@/lib/reviews/proof-check';
import { isUploadKind, isUuid } from '@/lib/reviews/types';
import { recomputeAllScores } from '@/lib/score/recompute';

export type DecisionState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'done'; message: string; warning?: string };

const NO_KEY = 'חסר SUPABASE_SECRET_KEY בשרת. בלעדיו אי אפשר לפתוח הוכחות או להחליט.';

function fail(message: string): DecisionState {
  return { status: 'error', message };
}

/** בכל פעולה מחדש: getUser, ו-admins דרך המפתח הסודי. ה-proxy הוא לא ההגנה היחידה (server-actions.md, Security). */
async function requireAdmin() {
  const gate = await adminGate();
  if (gate.kind === 'ok') return gate;
  return gate.kind === 'no-key' ? NO_KEY : 'אין הרשאה.';
}

type Pending = { authorId: string | null; paths: string[] };

/** הביקורת, רק אם היא עדיין ממתינה, והקבצים של ההוכחות שעוד מחכות להחלטה. null: הקריאה נכשלה. */
async function loadPending(db: AdminDb, reviewId: string): Promise<Pending | 'not-pending' | null> {
  const [review, proofs] = await Promise.all([
    db.from('reviews').select('status, author_id').eq('id', reviewId).maybeSingle(),
    db.from('proofs').select('storage_path').eq('review_id', reviewId).eq('status', 'pending'),
  ]);
  if (review.error || proofs.error) return null;
  if (!review.data || review.data.status !== 'pending') return 'not-pending';
  return {
    authorId: review.data.author_id,
    paths: proofs.data.flatMap((p) => (p.storage_path ? [p.storage_path] : [])),
  };
}

const NOT_PENDING = 'הביקורת כבר לא ממתינה. אולי כבר הוחלט עליה בלשונית אחרת: לרענן את הדף.';

/**
 * אישור (מסמך העיצוב, סעיף 4): קודם הקבצים נמחקים מהאחסון. אם זה נכשל, לא מפרסמים.
 * אחר כך publish_review() בטרנזקציה אחת, חישוב מחדש של כל הציונים, ורענון מיידי של עמוד הקורס ושל הקטלוג.
 * חישוב שנכשל לא מבטל ולא מסתיר את הפרסום: הוא כבר קרה, וגל רואה מה להריץ.
 */
export async function approveReview(_previous: DecisionState, form: FormData): Promise<DecisionState> {
  const gate = await requireAdmin();
  if (typeof gate === 'string') return fail(gate);

  const reviewId = form.get('reviewId');
  const kind = String(form.get('proofKind') ?? '');
  if (!isUuid(reviewId) || !isUploadKind(kind)) return fail('הבקשה לא תקינה.');
  const amountText = String(form.get('amount') ?? '').replace(/[\s,₪]/g, '');
  let bucket: number | null = null;
  if (kind === 'invoice' && amountText !== '') {
    bucket = paidBucket(Number(amountText));
    if (bucket === null) return fail('הסכום לא תקין. רק מספר בשקלים, או להשאיר ריק.');
  }

  const pending = await loadPending(gate.db, reviewId);
  if (pending === null) return fail('לא הצלחנו לקרוא את הביקורת. לא פורסם כלום.');
  if (pending === 'not-pending') return fail(NOT_PENDING);
  // publish_review מסרבת לביקורת בלי כותב (החשבון נמחק): אף אחד לא יוכל למחוק אותה. בודקים לפני שמוחקים קבצים.
  if (pending.authorId === null) return fail('החשבון של הכותב נמחק, ולכן אי אפשר לפרסם. הניקוי היומי ימחק את הביקורת.');
  try {
    await removeProofFiles(gate.db, pending.paths);
  } catch {
    return fail('מחיקת הקבצים נכשלה. לא פורסם כלום. נסו שוב.');
  }

  const { data: slug, error } = await gate.db.rpc('publish_review', {
    p_review_id: reviewId,
    p_admin_id: gate.userId,
    p_proof_kind: kind,
    ...(bucket === null ? {} : { p_paid_bucket: bucket }),
  });
  if (error || !slug) return fail('הפרסום נכשל. הקבצים כבר נמחקו, ואפשר לנסות שוב.');

  // ממוצע התחום משתנה, ולכן כל הקורסים, כמו score:recompute.
  let warning: string | undefined;
  try {
    const { failures } = await recomputeAllScores(gate.db, new Date());
    if (failures.length > 0) {
      console.error(`recompute after approve: ${failures.length} course(s) failed`);
      warning = `חישוב הציונים נכשל ב-${failures.length} קורסים. להריץ pnpm --dir web score:recompute.`;
    }
  } catch (recomputeError) {
    console.error('recompute after approve failed', recomputeError instanceof Error ? recomputeError.message : 'unknown');
    warning = 'חישוב הציונים נכשל. להריץ pnpm --dir web score:recompute.';
  }
  // מיד, ולא ברקע: הבקשה הבאה לעמוד הקורס מחכה לנתונים החדשים (updateTag.md). גם מרנדר מחדש את התור
  // באותה תשובה (server-actions.md, "A single response carries data and UI").
  updateTag(`course:${slug}`);
  updateTag('catalog');
  return { status: 'done', message: 'פורסם.', warning };
}

/** דחייה, או בקשה להוכחה נוספת: הקבצים נמחקים, והביקורת חוזרת לטיוטה עם ההודעה. */
export async function returnReview(_previous: DecisionState, form: FormData): Promise<DecisionState> {
  const gate = await requireAdmin();
  if (typeof gate === 'string') return fail(gate);

  const reviewId = form.get('reviewId');
  const action = form.get('action');
  const note = String(form.get('note') ?? '');
  const reasonValue = String(form.get('reason') ?? 'other');
  if (!isUuid(reviewId) || (action !== 'reject' && action !== 'request_more')) return fail('הבקשה לא תקינה.');
  if (action === 'request_more' && note.trim() === '') return fail('כתבו לכותב מה חסר.');
  const reason = isRejectReason(reasonValue) ? reasonValue : 'other';

  const pending = await loadPending(gate.db, reviewId);
  if (pending === null) return fail('לא הצלחנו לקרוא את הביקורת. לא הוחזר כלום.');
  if (pending === 'not-pending') return fail(NOT_PENDING);
  try {
    await removeProofFiles(gate.db, pending.paths);
  } catch {
    return fail('מחיקת הקבצים נכשלה. לא הוחזר כלום. נסו שוב.');
  }

  const { error } = await gate.db.rpc('return_review', {
    p_review_id: reviewId,
    p_admin_id: gate.userId,
    p_action: action,
    p_reason: action === 'reject' ? reason : 'more_proof',
    p_note: decisionNote(action, reason, note),
  });
  if (error) return fail('ההחזרה נכשלה. הקבצים כבר נמחקו, ואפשר לנסות שוב.');
  // התור לא במטמון: refresh מרנדר אותו מחדש באותה תשובה, והפריט יורד מהרשימה.
  refresh();
  return { status: 'done', message: action === 'reject' ? 'נדחתה והוחזרה לכותב.' : 'הוחזרה לכותב, עם בקשה להוכחה נוספת.' };
}
