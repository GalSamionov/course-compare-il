import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { secretKeyShape } from './secret-key';

/**
 * חיבור עם המפתח הסודי, שעוקף את כל ההרשאות. השרת בלבד: התור של גל, ההוכחות, הטפסים ומחיקת חשבון.
 * 'server-only': בנייה שמכניסה את הקובץ לקוד של הדפדפן נכשלת.
 * מפתח ציבורי במשתנה של הסודי נדחה כאן, כמו מפתח חסר: אחרת כל קריאה "סודית" רצה בשקט כמבקר אנונימי ונכשלת
 * בהרשאות. כל מי שקורא לפונקציה כבר תופס את השגיאה ומחזיר "לא מוגדר".
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY');
  if (secretKeyShape(secret) === 'public') {
    throw new Error('SUPABASE_SECRET_KEY holds a public key (sb_publishable_ or anon), not the secret key');
  }
  return createClient<Database>(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
}
