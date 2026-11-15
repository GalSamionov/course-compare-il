import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin-client';
import { createServerSupabase } from '@/lib/supabase/server-client';

export type AdminDb = ReturnType<typeof createAdminClient>;

export type AdminGate = { kind: 'not-admin' } | { kind: 'no-key' } | { kind: 'ok'; userId: string; db: AdminDb };

/**
 * מי מנהל. getUser מאמת את ההתחברות מול Supabase, ולא רק את העוגייה. עם המפתח הסודי, הבדיקה ב-admins
 * עוברת דרכו, ורק אחריה מותר להשתמש בו (מסמך העיצוב, סעיף 2).
 * בלי המפתח: is_admin() עם ההתחברות של המשתמש, רק כדי להגיד למנהל שהמפתח חסר. שום פעולה לא רצה.
 * readOnly: ברכיב שרת אי אפשר לכתוב עוגיות. ה-proxy כבר רענן את ההתחברות.
 */
export async function adminGate({ readOnly = false }: { readOnly?: boolean } = {}): Promise<AdminGate> {
  const supabase = await createServerSupabase({ readOnly });
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return { kind: 'not-admin' };

  let db: AdminDb;
  try {
    db = createAdminClient();
  } catch {
    const { data: isAdmin } = await supabase.rpc('is_admin');
    return isAdmin === true ? { kind: 'no-key' } : { kind: 'not-admin' };
  }
  const { data: row, error: adminError } = await db
    .from('admins')
    .select('user_id')
    .eq('user_id', data.user.id)
    .maybeSingle();
  if (adminError) throw new Error(`admins lookup failed: ${adminError.message}`);
  return row ? { kind: 'ok', userId: data.user.id, db } : { kind: 'not-admin' };
}

export const NO_KEY_MESSAGE = 'חסר SUPABASE_SECRET_KEY בשרת. בלעדיו אי אפשר לפתוח הוכחות או להחליט.';

/**
 * בכל פעולת שרת מחדש: getUser, ו-admins דרך המפתח הסודי. ה-proxy הוא לא ההגנה היחידה (server-actions.md, Security).
 * מחזיר את השער, או את ההודעה לגל.
 */
export async function requireAdmin(): Promise<Extract<AdminGate, { kind: 'ok' }> | string> {
  const gate = await adminGate();
  if (gate.kind === 'ok') return gate;
  return gate.kind === 'no-key' ? NO_KEY_MESSAGE : 'אין הרשאה.';
}
