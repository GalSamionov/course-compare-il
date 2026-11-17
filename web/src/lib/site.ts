/**
 * הכתובת הציבורית של האתר. הכתובת הקנונית של כל עמוד, מפת האתר, robots.txt והקישורים בתמונת השיתוף (og:image)
 * נבנים ממנה. כשהדומיין עובר: SITE_URL ב-Vercel, ו-301 מהכתובת הישנה (docs/sessions/2026-11-16-launch-prep.md).
 */
export const SITE_URL = process.env.SITE_URL ?? 'https://course-compare-il.vercel.app';

/** שם האתר (PRODUCT.md, Brand Commitments). כל מקום בקוד שמציג את השם משתמש בזה. */
export const SITE_NAME = 'למדתי';

/**
 * הכתובת היחידה לפניות: פרטיות, נגישות ותנאי השימוש. גל אישר לפרסם אותה (16.11.2026).
 * רכז הנגישות והאחראי על המידע הוא גל, בשם הפרטי בלבד.
 */
export const CONTACT_EMAIL = 'samisimyonov@gmail.com';
