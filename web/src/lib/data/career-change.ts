import { cacheLife, cacheTag } from 'next/cache';
import type { CourseType } from '@/lib/score/types';
import { createPublicClient } from '@/lib/supabase/public-client';
import { compareByScore } from './course-order';
import { getCoursePage, type CoursePageData } from './course-page';
import { queryError } from './shared';

/**
 * "הסבה להייטק" (/career-change): הקורסים מגיעים מהנתונים ולא מרשימה ביד, כדי שקורס חדש מהאוסף השבועי
 * ייכנס לעמוד לבד. הכלל, שגם כתוב בעמוד:
 * - בתחום "טכנולוגיה" או באחד התחומים שמתחתיו;
 * - תחום מסוג קריירה;
 * - קורס, ולא סדנה או הרצאה;
 * - פעיל (גם "אולי לא פעיל", כמו ברשימות של האתר);
 * - ארוך מספיק כדי לפתוח דלת: 100 שעות ומעלה. בלי מספר שעות: 3 חודשים ומעלה. בלי שניהם: נכנס,
 *   כי אנחנו לא מסתירים קורס רק כי המוסד לא פרסם כמה זמן הוא נמשך.
 */
export const TECH_ROOT_SLUG = 'technology';
export const MIN_HOURS = 100;
export const MIN_MONTHS = 3;

export interface CategoryRow {
  id: string;
  slug: string;
  parentId: string | null;
  courseType: CourseType;
}

export interface CourseCandidate {
  slug: string;
  categoryId: string;
  productType: string;
  status: string;
  totalHours: number | null;
  durationMonths: number | null;
}

/** התחום "טכנולוגיה" וכל מי שמתחתיו, בכל עומק. בלי התחום: רשימה ריקה. */
export function techCategoryIds(categories: readonly CategoryRow[], rootSlug = TECH_ROOT_SLUG): Set<string> {
  const root = categories.find((c) => c.slug === rootSlug);
  const ids = new Set<string>();
  if (!root) return ids;
  ids.add(root.id);
  // עד שאין מה להוסיף. הגבול בגודל הרשימה מגן מלולאה, אם במסד יש מעגל שלא אמור להיות.
  for (let pass = 0; pass < categories.length; pass++) {
    const before = ids.size;
    for (const c of categories) if (c.parentId && ids.has(c.parentId)) ids.add(c.id);
    if (ids.size === before) break;
  }
  return ids;
}

/** האם הקורס ארוך מספיק להסבה. מה שלא ידוע לא מוציא קורס מהרשימה. */
export function longEnough(course: Pick<CourseCandidate, 'totalHours' | 'durationMonths'>): boolean {
  if (course.totalHours !== null) return course.totalHours >= MIN_HOURS;
  if (course.durationMonths !== null) return course.durationMonths >= MIN_MONTHS;
  return true;
}

/** אילו קורסים נכנסים לעמוד, לפי הכלל למעלה. הסדר כאן לא חשוב: העמוד ממיין לפי ציון. */
export function selectCareerChange(categories: readonly CategoryRow[], courses: readonly CourseCandidate[]): string[] {
  const tech = techCategoryIds(categories);
  const byId = new Map(categories.map((c) => [c.id, c]));
  return courses
    .filter(
      (course) =>
        tech.has(course.categoryId) &&
        byId.get(course.categoryId)?.courseType === 'career' &&
        course.productType === 'course' &&
        (course.status === 'active' || course.status === 'maybe_inactive') &&
        longEnough(course),
    )
    .map((course) => course.slug);
}

export interface CareerChangePage {
  /** לפי ציון הבוגרים, כמו בעמוד מוסד (compareByScore). */
  courses: CoursePageData[];
  /** כל הבוגרים המאומתים בקורסים האלה. */
  graduates: number;
  /** בכמה קורסים יש טווח של מה ששולם בפועל (מ-5 חשבוניות). */
  withPaid: number;
  /** בכמה קורסים יש תשובות של בוגרים 3 חודשים אחרי. */
  withOutcome: number;
}

/**
 * העמוד, מהמטמון של Next. נשמר לשעה, ומתרענן עם הקטלוג (revalidateTag('catalog')).
 * כל קורס נטען מהמטמון של העמוד שלו, כך שהמספרים כאן זהים למה שבעמוד הקורס.
 */
export async function getCareerChangePage(): Promise<CareerChangePage> {
  'use cache';
  cacheLife('hours');
  cacheTag('catalog');
  return loadCareerChangePage(getCoursePage);
}

/** הטעינה עצמה. load: איך לטעון עמוד של קורס (במטמון בעמוד, וישר מהמסד בסקריפטים). */
export async function loadCareerChangePage(
  load: (slug: string) => Promise<CoursePageData | null>,
): Promise<CareerChangePage> {
  const db = createPublicClient();
  const [categoriesRes, coursesRes] = await Promise.all([
    db.from('categories').select('id, slug, parent_id, course_type'),
    db
      .from('courses')
      .select('slug, category_id, product_type, status, total_hours, duration_months')
      .in('status', ['active', 'maybe_inactive']),
  ]);
  if (categoriesRes.error) throw queryError('career categories', categoriesRes.error);
  if (coursesRes.error) throw queryError('career courses', coursesRes.error);

  const slugs = selectCareerChange(
    categoriesRes.data.map((c) => ({ id: c.id, slug: c.slug, parentId: c.parent_id, courseType: c.course_type })),
    // רק טיוטה יכולה להיות בלי תחום, וכאן אין טיוטות.
    coursesRes.data.flatMap((c) =>
      c.category_id === null
        ? []
        : [
            {
              slug: c.slug,
              categoryId: c.category_id,
              productType: c.product_type,
              status: c.status,
              totalHours: c.total_hours,
              durationMonths: c.duration_months === null ? null : Number(c.duration_months),
            },
          ],
    ),
  );
  const courses = (await Promise.all(slugs.map((slug) => load(slug))))
    .filter((course): course is CoursePageData => course !== null)
    .sort(compareByScore);
  return {
    courses,
    graduates: courses.reduce((sum, course) => sum + course.reviewTotal, 0),
    withPaid: courses.filter((course) => course.paid !== null).length,
    withOutcome: courses.filter((course) => course.outcome !== null).length,
  };
}

/**
 * האם תחום שייך להייטק: "טכנולוגיה" או אחד התחומים שמתחתיו. עמוד תחום משתמש בזה כדי לקשר לעמוד ההסבה.
 * parents: מתחום לתחום שמעליו, לפי slug, כמו בקטלוג.
 */
export function isTechCategory(slug: string, parentOf: (slug: string) => string | null): boolean {
  let current: string | null = slug;
  for (let depth = 0; current && depth < 20; depth++) {
    if (current === TECH_ROOT_SLUG) return true;
    current = parentOf(current);
  }
  return false;
}
