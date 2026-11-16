/**
 * קישור לדף של קורס, מבוגר או מבקשה (20261116010001_course_links.sql): מה מקבלים, ואיך משווים.
 * בלי גישה למסד, כדי שאפשר יהיה לבדוק בבדיקת יחידה. הכתובת לא נפתחת בשרת, רק נשמרת.
 */

/**
 * רשתות חברתיות: האוסף לא קורא אותן אף פעם (תנאי השימוש שלהן). אותה רשימה כמו private.is_social_url במסד.
 * גם תת-דומיין (m.facebook.com) נחשב.
 */
export const SOCIAL_HOSTS = [
  'facebook.com',
  'fb.com',
  'fb.me',
  'fb.watch',
  'instagram.com',
  'instagr.am',
  'threads.net',
  'threads.com',
  'whatsapp.com',
  'wa.me',
  'tiktok.com',
  'linkedin.com',
  'lnkd.in',
  'x.com',
  'twitter.com',
  't.co',
  'youtube.com',
  'youtu.be',
  'linktr.ee',
] as const;

/** פרמטרים של מעקב אחרי מי שלחץ על מודעה. לא משנים את הדף, ושומרים מידע על המפרסם ועל הלוחץ. */
const TRACKING =
  /^(utm_[a-z0-9_]+|fbclid|gclid|gbraid|wbraid|dclid|msclkid|igshid|igsh|mibextid|mc_cid|mc_eid|_hsenc|_hsmi|srsltid|ttclid|twclid|li_fat_id|yclid|_ga|_gl)$/i;

/** פייסבוק ואינסטגרם עוטפים קישור יוצא בדף מעבר (l.facebook.com/l.php?u=...). */
const REDIRECT_HOSTS = new Set(['l.facebook.com', 'lm.facebook.com', 'l.instagram.com']);

/** הגרסאות של פייסבוק לנייד: אותו דף, באותה כתובת. */
const FACEBOOK_MIRRORS = new Set(['m.facebook.com', 'mbasic.facebook.com', 'touch.facebook.com', 'web.facebook.com']);

/** המארח בלי www, כמו private.url_host במסד. */
export function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '') || null;
  } catch {
    return null;
  }
}

export function isSocialUrl(url: string): boolean {
  const host = hostOf(url);
  return host !== null && SOCIAL_HOSTS.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

function parse(text: string): URL | null {
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(text) ? text : `https://${text}`;
  try {
    return new URL(withScheme);
  } catch {
    return null;
  }
}

/**
 * מה שהודבק, כקישור שאפשר לשמור. null: לא קישור שמקבלים.
 * - רק http או https, בלי שם משתמש וסיסמה, ורק שם מארח עם נקודה (לא IP ולא localhost).
 * - "www.example.co.il/course" מקבל https://.
 * - דף מעבר של פייסבוק או אינסטגרם: הקישור שבתוכו. פייסבוק לנייד: www.facebook.com.
 * - בלי # ובלי פרמטרים של מעקב. @ בנתיב (tiktok.com/@name) מקודד, כי המסד לא מקבל @ בכלל.
 * - עד 500 תווים, כמו במסד.
 */
export function normalizeCourseLink(input: string, depth = 0): string | null {
  const text = input.trim();
  if (text === '' || text.length > 2000 || /\s/.test(text)) return null;
  const url = parse(text);
  if (!url) return null;
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  if (url.username || url.password) return null;
  // "facebook.com." ו-"localhost." הם אותו מארח: בלי הנקודה, לפני כל בדיקה.
  url.hostname = url.hostname.replace(/\.+$/, '');
  const host = url.hostname.toLowerCase();
  if (!host.includes('.') || /^[\d.]+$/.test(host) || host.startsWith('[') || host === 'localhost' || host.endsWith('.localhost')) {
    return null;
  }

  const inner = REDIRECT_HOSTS.has(host) ? url.searchParams.get('u') : null;
  if (inner !== null) return depth === 0 ? normalizeCourseLink(inner, 1) : null;
  if (FACEBOOK_MIRRORS.has(host)) url.hostname = 'www.facebook.com';

  for (const key of [...url.searchParams.keys()]) if (TRACKING.test(key)) url.searchParams.delete(key);
  url.hash = '';
  // שם משתמש כבר נדחה, ולכן כל @ שנשאר הוא בנתיב או בשאילתה.
  const href = url.href.replace(/@/g, '%40');
  return href.length <= 500 ? href : null;
}

function decode(text: string): string {
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
}

/**
 * קישור להשוואה, כמו private.course_url_key במסד: מפוענח, באותיות קטנות, בלי http(s)://, בלי www., בלי #
 * ובלי / בסוף הנתיב. השאילתה נשארת: באתרים מסוימים היא מה שמזהה את הקורס.
 */
export function courseUrlKey(url: string): string | null {
  const key = decode(url.split('#')[0])
    .toLowerCase()
    .replace(/^https?:\/\/(www\.)?/, '')
    .replace(/\/+(\?|$)/, '$1');
  return key || null;
}

/** שם להשוואה, כמו private.course_title_key: אותיות קטנות, וכל רצף שאינו אות או ספרה (גם בעברית) לרווח אחד. */
export function courseTitleKey(title: string): string | null {
  return title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim() || null;
}
