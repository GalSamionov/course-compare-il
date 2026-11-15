/**
 * מה יש ב-SUPABASE_SECRET_KEY, לפי הצורה בלבד, בלי לפנות למסד ובלי להדפיס את המפתח.
 * ב-15.11.2026 היה ב-Vercel מפתח ציבורי (sb_publishable_) במקום הסודי. החיבור "הסודי" רץ אז בהרשאות של
 * מבקר אנונימי, הבדיקה ב-admins נדחתה (42501), ו-/admin נפל בשגיאת שרת בלי הסבר.
 *
 * - secret: מפתח סודי (sb_secret_), או JWT ישן עם role=service_role.
 * - public: מפתח ציבורי (sb_publishable_), או JWT ישן של anon או authenticated. לא עוקף שום הרשאה.
 * - unknown: צורה אחרת. מנסים אותו, והמסד יגיד אם הוא עובד.
 */
export type SecretKeyShape = 'missing' | 'secret' | 'public' | 'unknown';

export function secretKeyShape(key: string | null | undefined): SecretKeyShape {
  const value = key?.trim();
  if (!value) return 'missing';
  if (value.startsWith('sb_secret_')) return 'secret';
  if (value.startsWith('sb_publishable_')) return 'public';
  const role = jwtRole(value);
  if (role === 'service_role') return 'secret';
  if (role === 'anon' || role === 'authenticated') return 'public';
  return 'unknown';
}

/** ה-role מתוך JWT, בלי לבדוק חתימה: רק כדי לזהות מפתח ציבורי שהודבק במקום הסודי. */
function jwtRole(token: string): string | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const payload: unknown = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    const role = (payload as { role?: unknown } | null)?.role;
    return typeof role === 'string' ? role : null;
  } catch {
    return null;
  }
}
