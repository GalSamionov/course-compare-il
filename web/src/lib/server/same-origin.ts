/**
 * רק דף מהאתר עצמו יכול לשלוח POST לנתיבים שמשנים נתונים (הגנה מ-CSRF): הדפדפן שולח Origin בכל POST
 * של fetch, ואתר אחר לא יכול לזייף אותו. עוגיית ההתחברות היא גם SameSite=Lax, ולא נשלחת ב-POST מאתר אחר.
 * עבר לכאן מנתיב מחיקת החשבון, כי גם נתיבי הביקורות צריכים אותו.
 */
export function fromThisSite(request: Request): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
