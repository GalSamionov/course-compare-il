/**
 * לאן לחזור אחרי ההתחברות. נשמר בעוגייה קצרה, ולא בקישור שבמייל, כדי שכתובת החזרה ב-Supabase
 * תהיה כתובת אחת מדויקת (/auth/callback), כמו ש-Supabase ממליצים לאתר באוויר.
 * העוגייה נשלחת רק לנתיב ההתחברות, ונמחקת שם.
 */
export const NEXT_COOKIE = 'login_next';
export const CALLBACK_PATH = '/auth/callback';

/** כתובת חזרה ארוכה מזה היא כנראה לא מהאתר שלנו. */
const MAX_LENGTH = 1000;
const BASE = 'https://site.invalid';

/**
 * לאן לחזור אחרי ההתחברות. רק נתיב באתר הזה. כל השאר, ובכלל זה כתובת של אתר אחר, הופך ל-'/'.
 * כך אי אפשר לשלוח מישהו לקישור התחברות שמחזיר אותו לאתר זר (open redirect).
 */
export function safeNextPath(raw: string | null | undefined): string {
  if (!raw || raw.length > MAX_LENGTH || !raw.startsWith('/')) return '/';
  // '//x' ו-'/\x' הם כתובת של אתר אחר בדפדפן.
  if (raw.startsWith('//') || raw.includes('\\')) return '/';
  // תווי בקרה (טאב, שורה חדשה) הדפדפן מוחק מהכתובת, ואז '/\t/x' הופך ל-'//x'.
  for (const char of raw) {
    const code = char.charCodeAt(0);
    if (code < 0x20 || code === 0x7f) return '/';
  }
  let url: URL;
  try {
    url = new URL(raw, BASE);
  } catch {
    return '/';
  }
  // הנירמול יכול לייצר '//' מחדש: '/.//x' הופך ל-'//x'.
  if (url.origin !== BASE || url.pathname.startsWith('//')) return '/';
  // לא חוזרים לעמוד ההתחברות, או לנתיב שמסיים אותה.
  if (url.pathname === '/login' || url.pathname.startsWith('/auth/')) return '/';
  return `${url.pathname}${url.search}${url.hash}`;
}
