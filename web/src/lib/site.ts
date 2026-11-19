/**
 * הכתובת הציבורית של האתר. הכתובת הקנונית של כל עמוד, מפת האתר, robots.txt והקישורים בתמונת השיתוף (og:image)
 * נבנים ממנה. כשהדומיין עובר: SITE_URL ב-Vercel, ו-301 מהכתובת הישנה (docs/sessions/2026-11-16-launch-prep.md).
 */
export const SITE_URL = process.env.SITE_URL ?? 'https://course-compare-il.vercel.app';

/** שם האתר (PRODUCT.md, Brand Commitments). כל מקום בקוד שמציג את השם משתמש בזה. */
export const SITE_NAME = 'למדתי';

/**
 * ההתחברות פתוחה לכל מבקר? באתר החי עוד לא (גל, 17.11.2026). בלי SMTP משלנו, Supabase שולח את מייל ההתחברות
 * רק למיילים של הצוות, ומבקר אחר היה נתקע. לכן באתר החי לא מוצגים "התחברות", "לשמור" והשאלות הנוספות ביועץ,
 * ובכתיבת ביקורת כתוב שהיא נפתחת בקרוב. מי שכבר מחובר (גל) רואה הכול, ו-/login עצמו פתוח, בשביל /admin.
 * מקומית וב-CI הכול פתוח, כי הבדיקות עוברות דרך ההתחברות. NEXT_PUBLIC_VERCEL_ENV נקבע ב-Vercel בבנייה.
 * כשמגדירים SMTP ב-Supabase (למשל Gmail): מחליפים ל-true.
 */
export const ACCOUNTS_OPEN = process.env.NEXT_PUBLIC_VERCEL_ENV !== 'production';

/**
 * הכתובת היחידה לפניות: פרטיות, נגישות ותנאי השימוש. גל אישר לפרסם אותה (16.11.2026).
 * רכז הנגישות והאחראי על המידע הוא גל, בשם הפרטי בלבד.
 */
export const CONTACT_EMAIL = 'samisimyonov@gmail.com';
