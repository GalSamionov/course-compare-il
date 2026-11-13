import type { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin-client';
import { createServerSupabase } from '@/lib/supabase/server-client';

/**
 * רק דף מהאתר עצמו יכול לבקש מחיקה (הגנה מ-CSRF): הדפדפן שולח Origin בכל POST של fetch,
 * ואתר אחר לא יכול לזייף אותו. עוגיית ההתחברות היא גם SameSite=Lax, ולא נשלחת ב-POST מאתר אחר.
 */
function fromThisSite(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/**
 * מוחק את המשתמש המחובר מ-Supabase Auth. המסד מוחק איתו את הקורסים השמורים, ההשוואה והתשובות
 * (on delete cascade). המפתח הסודי נקרא רק כאן, בשרת.
 */
export async function POST(request: NextRequest) {
  if (!fromThisSite(request)) return Response.json({ error: 'forbidden' }, { status: 403 });

  const db = await createServerSupabase();
  // getUser בודק את ההתחברות מול Supabase, ולא רק את העוגייה.
  const { data, error } = await db.auth.getUser();
  if (error || !data.user) return Response.json({ error: 'signed_out' }, { status: 401 });

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    // SUPABASE_SECRET_KEY חסר בסביבה (למשל ב-Vercel, לפני שגל הוסיף אותו).
    return Response.json({ error: 'not_configured' }, { status: 503 });
  }
  const { error: deleteError } = await admin.auth.admin.deleteUser(data.user.id);
  if (deleteError) {
    console.error('Deleting a user failed', deleteError.message);
    return Response.json({ error: 'failed' }, { status: 500 });
  }
  // גם הרישום של Supabase Auth, שבו המייל נשאר אחרי המחיקה. החשבון כבר נמחק, ולכן כישלון כאן
  // רק נרשם ביומן של השרת.
  const { error: logError } = await admin.rpc('forget_auth_log', { p_user_id: data.user.id });
  if (logError) console.error('Clearing the auth log failed', logError.message);
  return Response.json({ ok: true });
}
