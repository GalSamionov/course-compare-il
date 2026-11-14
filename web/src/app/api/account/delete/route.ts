import type { NextRequest } from 'next/server';
import { fromThisSite } from '@/lib/server/same-origin';
import { createAdminClient } from '@/lib/supabase/admin-client';
import { createServerSupabase } from '@/lib/supabase/server-client';

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
