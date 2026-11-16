import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * POST /api/revalidate (סבב 5, פריט 36): מה הנתיב מקבל, ואיך הוא בודק את הטוקן. טהור, עם בדיקות יחידה.
 * הנתיב עצמו: web/src/app/api/revalidate/route.ts. מי ששולח: web/src/lib/cache/revalidate-client.ts.
 */

/** כמה קורסים בבקשה אחת. הלקוח שולח בחלקים. */
export const MAX_COURSES_PER_REQUEST = 500;
/** הגוף, בבתים: 500 כתובות של עד 120 תווים, עם מרווח. */
export const MAX_REVALIDATE_BODY = 80_000;
/** טוקן בשרת קצר מזה: הנתיב סגור (503), כדי שטעות בהגדרה לא תפתח אותו. */
export const MIN_TOKEN_LENGTH = 32;
/** תמיד: הקטלוג (הציונים ברשימות, ועמודי מוסד ומרצה) ומספרי השקיפות. */
export const ALWAYS_TAGS = ['catalog', 'transparency'] as const;

/** אותו כלל כמו courses.slug במסד. תגית עד 256 תווים (revalidateTag.md), ולכן slug עד 120. */
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const SLUG_MAX = 120;

/** { courses: [slug, ...] } → התגיות לרענון, כל אחת פעם אחת. null: גוף לא תקין. */
export function tagsFromBody(raw: string): string[] | null {
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return null;
  }
  const courses = (body as { courses?: unknown } | null)?.courses;
  if (!Array.isArray(courses) || courses.length > MAX_COURSES_PER_REQUEST) return null;
  if (!courses.every((slug) => typeof slug === 'string' && slug.length <= SLUG_MAX && SLUG.test(slug))) return null;
  return [...ALWAYS_TAGS, ...new Set(courses.map((slug: string) => `course:${slug}`))];
}

/**
 * השוואה בזמן קבוע: SHA-256 של שני הצדדים, באותו אורך, ואז timingSafeEqual. כך גם האורך של הטוקן לא דולף.
 * טוקן צפוי קצר מ-32 תווים לא מתאים לאף טוקן.
 */
export function tokenMatches(given: string, expected: string): boolean {
  if (expected.length < MIN_TOKEN_LENGTH) return false;
  const a = createHash('sha256').update(given).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

/** הטוקן מ-"Authorization: Bearer <טוקן>". '' כשאין, או בכל צורה אחרת. */
export function bearerToken(header: string | null): string {
  const match = header?.match(/^Bearer (\S+)$/);
  return match ? match[1] : '';
}
