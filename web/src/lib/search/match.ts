import { knownFactsCount } from '@/lib/course/facts';
import { MIN_REVIEWS } from '@/lib/score/constants';
import { activeLines } from './query';
import { FORMAT_LABEL, TIME_SLOT_LABEL, type CourseFormat, type CourseSummary, type SearchFormat, type SearchQuery, type TimeSlot } from './types';
import { courseTypeForWhy } from './why';

export interface MatchResult {
  course: CourseSummary;
  /** מתאים לכל השורות הפעילות. קורס שמתאים חוץ מדבר אחד נשאר ברשימה, אחרי המתאימים. */
  full: boolean;
  /** הערת העט בשוליים, בלי החץ: למה הקורס מתאים, ומה לא. ריקה כשאין מה להוסיף. */
  note: string;
}

const timeWords = (slots: readonly TimeSlot[]) => slots.map((t) => TIME_SLOT_LABEL[t]);

/** משולב הוא גם בכיתה וגם אונליין, ומוקלט הוא אונליין. כך קורס כזה לא נופל מהחיפוש של "בכיתה" או "אונליין". */
const COVERS: Record<CourseFormat, readonly SearchFormat[]> = {
  online: ['online'],
  in_person: ['in_person'],
  hybrid: ['online', 'in_person'],
  recorded: ['online'],
};

export function coversFormat(formats: readonly CourseFormat[], wanted: SearchFormat): boolean {
  return formats.some((f) => COVERS[f].includes(wanted));
}

/** הקורס בתחום, או בתחום שמתחתיו. */
export function inCategories(course: CourseSummary, cats: readonly string[]): boolean {
  return (
    cats.includes(course.categorySlug) ||
    (course.categoryParentSlug !== null && cats.includes(course.categoryParentSlug))
  );
}

/**
 * הסדר ברשימות (מסמך העיצוב 2026-11-17, "הסדר"):
 * - קודם קורסים שהמוסד מפרסם בהם יותר פרטים: כמה מששת השדות של "העובדות" ידועים (lib/course/facts.ts);
 * - אחר כך קורס עם ציון לפני קורס בלי ציון, ובין קורסים עם ציון הציון קובע, כמו קודם;
 * - בלי ציון: החדש יותר קודם, ובסוף לפי slug.
 * עמודי מוסד ומרצה מסודרים אחרת (data/course-order.ts).
 */
export function compareCourses(a: CourseSummary, b: CourseSummary): number {
  const facts = knownFactsCount(b) - knownFactsCount(a);
  if (facts !== 0) return facts;
  const scoreA = a.score.status === 'scored' ? a.score.value : null;
  const scoreB = b.score.status === 'scored' ? b.score.value : null;
  if (scoreA !== null && scoreB !== null) {
    if (scoreA !== scoreB) return scoreB - scoreA;
  } else if (scoreA !== null) {
    return -1;
  } else if (scoreB !== null) {
    return 1;
  } else {
    const newer = Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
    if (newer !== 0) return newer;
  }
  return a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0;
}

export function matchCourses(courses: readonly CourseSummary[], query: SearchQuery): MatchResult[] {
  const active = activeLines(query);
  const cats = active.includes('what') ? query.cats : [];
  // "למה" לא מסנן: קורסים מהסוג שהוא קובע באים קודם בתוך כל קבוצה (מסמך העיצוב, 3א.3).
  const type = active.includes('why') && query.why ? courseTypeForWhy(query.why) : null;
  const when = active.includes('whenhow') ? query.when : [];
  const how = active.includes('whenhow') ? query.how : [];
  const maxPrice = active.includes('budget') ? query.maxPrice : null;

  const results: MatchResult[] = [];
  for (const course of courses) {
    if (cats.length > 0 && !inCategories(course, cats)) continue;

    const hits: string[] = [];
    const misses: string[] = [];
    if (when.length > 0) {
      const shared = when.filter((t) => course.timeSlots.includes(t));
      if (shared.length > 0) hits.push(timeWords(shared).join(', '));
      else
        misses.push(
          course.timeSlots.length > 0 ? `רק ב${timeWords(course.timeSlots).join(' וב')}` : 'בלי מידע על השעות',
        );
    }
    if (how.length > 0) {
      const shared = how.filter((f) => coversFormat(course.formats, f));
      if (shared.length > 0) hits.push(shared.map((f) => FORMAT_LABEL[f]).join(', '));
      else
        misses.push(
          course.formats.length > 0
            ? `רק ${course.formats.map((f) => FORMAT_LABEL[f]).join(' ו')}`
            : 'בלי מידע על הפורמט',
        );
    }
    if (maxPrice !== null) {
      if (course.sitePrice !== null && course.sitePrice <= maxPrice) hits.push('בתקציב');
      else misses.push(course.sitePrice === null ? 'בלי מחיר באתר' : 'מעל התקציב');
    }
    // שני דברים שלא מתאימים: הקורס יוצא מהרשימה.
    if (misses.length > 1) continue;

    let note = '';
    if (misses.length === 1) note = hits.length > 0 ? `${hits.join(', ')}, אבל ${misses[0]}` : misses[0];
    else if (hits.length > 0) note = hits.join(', ');
    // רק "מה": שם התחום, חוץ מכשיש תחום אחד והקורס בדיוק בו.
    else if (cats.length > 0 && !(cats.length === 1 && course.categorySlug === cats[0])) {
      note = course.categoryName;
    }

    results.push({ course, full: misses.length === 0, note });
  }
  const typeRank = (course: CourseSummary) => (type !== null && course.courseType === type ? 0 : 1);
  return results.sort(
    (a, b) =>
      Number(b.full) - Number(a.full) || typeRank(a.course) - typeRank(b.course) || compareCourses(a.course, b.course),
  );
}

/**
 * "סיימתם קורס?": הקורסים שהכי קרובים לציון. קודם הכי מעט ביקורות חסרות, אחר כך יותר בוגרים, ואז slug.
 * רק קורס שכבר יש לו ביקורת שנספרת: כשלאף קורס עוד אין, כולם רחוקים באותה מידה, ושלושה מהם לפי האלף-בית
 * לא היו "הכי קרובים" (כך ביום העלייה לאוויר). אז הרשימה ריקה, ו-GraduatesCall מזמין לבחור קורס.
 */
export function closestToScore(courses: readonly CourseSummary[], limit: number): CourseSummary[] {
  const missing = (c: CourseSummary) => (c.score.status === 'not_enough_reviews' ? c.score.reviewsNeeded : 0);
  return courses
    .filter((c) => missing(c) > 0 && missing(c) < MIN_REVIEWS)
    .sort(
      (a, b) =>
        missing(a) - missing(b) ||
        b.verifiedCount - a.verifiedCount ||
        (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0),
    )
    .slice(0, limit);
}

/** "קורסים דומים": מאותו תחום כמו הראשון ברשימה, בלי הקורסים שכבר ברשימה, בסדר הרגיל. */
export function similarTo(
  picked: readonly CourseSummary[],
  courses: readonly CourseSummary[],
  limit = 3,
): CourseSummary[] {
  const first = picked[0];
  if (!first) return [];
  const taken = new Set(picked.map((c) => c.slug));
  return courses
    .filter((c) => c.categorySlug === first.categorySlug && !taken.has(c.slug))
    .sort(compareCourses)
    .slice(0, limit);
}
