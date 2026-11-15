import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin-client';
import { secretKeyShape } from '@/lib/supabase/secret-key';
import { createServerSupabase } from '@/lib/supabase/server-client';

export type AdminDb = ReturnType<typeof createAdminClient>;

/**
 * no-key: אין מפתח סודי בשרת. bad-key: יש משהו, אבל הוא לא עובד: מפתח ציבורי (public), או ש-Supabase דחה
 * את הבדיקה ב-admins (rejected, עם קוד השגיאה של המסד בלבד).
 */
export type AdminGate =
  | { kind: 'not-admin' }
  | { kind: 'no-key' }
  | { kind: 'bad-key'; reason: 'public' | 'rejected'; code: string | null }
  | { kind: 'ok'; userId: string; db: AdminDb };

/**
 * מי מנהל. getUser מאמת את ההתחברות מול Supabase, ולא רק את העוגייה. עם המפתח הסודי, הבדיקה ב-admins
 * עוברת דרכו, ורק אחריה מותר להשתמש בו (מסמך העיצוב, סעיף 2).
 * בלי מפתח סודי שעובד: is_admin() עם ההתחברות של המשתמש, רק כדי להגיד למנהל מה לא בסדר במפתח. שום פעולה לא
 * רצה, ומי שאינו מנהל מקבל 404 כרגיל. הבדיקה לא זורקת: ב-15.11.2026 מפתח ציבורי ב-Vercel הפיל את /admin
 * בשגיאת שרת בלי הסבר.
 * readOnly: ברכיב שרת אי אפשר לכתוב עוגיות. ה-proxy כבר רענן את ההתחברות.
 */
export async function adminGate({ readOnly = false }: { readOnly?: boolean } = {}): Promise<AdminGate> {
  const supabase = await createServerSupabase({ readOnly });
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return { kind: 'not-admin' };

  /** רק מנהל שומע שהמפתח חסר או שגוי. כל השאר מקבלים 404. */
  const forAdmin = async (problem: Exclude<AdminGate, { kind: 'ok' } | { kind: 'not-admin' }>): Promise<AdminGate> => {
    const { data: isAdmin } = await supabase.rpc('is_admin');
    return isAdmin === true ? problem : { kind: 'not-admin' };
  };

  const shape = secretKeyShape(process.env.SUPABASE_SECRET_KEY);
  if (shape === 'missing') return forAdmin({ kind: 'no-key' });
  if (shape === 'public') {
    console.error('admin gate: SUPABASE_SECRET_KEY holds a public key, not the secret key');
    return forAdmin({ kind: 'bad-key', reason: 'public', code: null });
  }

  let db: AdminDb;
  try {
    db = createAdminClient();
  } catch {
    return forAdmin({ kind: 'no-key' });
  }
  const { data: row, error: adminError } = await db
    .from('admins')
    .select('user_id')
    .eq('user_id', data.user.id)
    .maybeSingle();
  if (adminError) {
    // רק הקוד: מפתח שבוטל, מפתח של פרויקט אחר, או מסד שלא ענה.
    console.error('admin gate: admins lookup failed', adminError.code);
    return forAdmin({ kind: 'bad-key', reason: 'rejected', code: adminError.code || null });
  }
  return row ? { kind: 'ok', userId: data.user.id, db } : { kind: 'not-admin' };
}

export const NO_KEY_MESSAGE = 'חסר SUPABASE_SECRET_KEY בשרת. בלעדיו אי אפשר לפתוח הוכחות או להחליט.';
export const PUBLIC_KEY_MESSAGE =
  'ב-SUPABASE_SECRET_KEY בשרת יש מפתח ציבורי (sb_publishable_), ולא המפתח הסודי. בלעדיו אי אפשר לפתוח הוכחות או להחליט.';
export const rejectedKeyMessage = (code: string | null) =>
  `Supabase לא קיבל את הבדיקה עם SUPABASE_SECRET_KEY${code ? ` (קוד ${code})` : ''}. בלעדיו אי אפשר לפתוח הוכחות או להחליט.`;

/** ההודעה לגל כשאין מפתח סודי שעובד. */
export function keyProblemMessage(gate: Extract<AdminGate, { kind: 'no-key' | 'bad-key' }>): string {
  if (gate.kind === 'no-key') return NO_KEY_MESSAGE;
  return gate.reason === 'public' ? PUBLIC_KEY_MESSAGE : rejectedKeyMessage(gate.code);
}

/**
 * בכל פעולת שרת מחדש: getUser, ו-admins דרך המפתח הסודי. ה-proxy הוא לא ההגנה היחידה (server-actions.md, Security).
 * מחזיר את השער, או את ההודעה לגל.
 */
export async function requireAdmin(): Promise<Extract<AdminGate, { kind: 'ok' }> | string> {
  const gate = await adminGate();
  if (gate.kind === 'ok') return gate;
  return gate.kind === 'not-admin' ? 'אין הרשאה.' : keyProblemMessage(gate);
}
