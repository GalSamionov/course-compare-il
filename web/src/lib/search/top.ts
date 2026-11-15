import type { CourseSummary, RowScore } from './types';

/** כמה מובילים בעמוד תחום. */
export const TOP_LIMIT = 3;

export type ScoredSummary = CourseSummary & { score: Extract<RowScore, { status: 'scored' }> };

const isScored = (course: CourseSummary): course is ScoredSummary => course.score.status === 'scored';

/**
 * המובילים לפי בוגרים בתחום ובתחומי המשנה שלו (החלטה של גל, 15.11.2026):
 * - רק קורסים שיש להם ציון, כלומר 5 ביקורות מאומתות ומעלה (MIN_REVIEWS);
 * - מהציון הגבוה לנמוך, ובתיקו מי שיש לו יותר בוגרים מאומתים;
 * - אף פעם לא לפי מספר נרשמים: את המספר הזה רק המוסד יודע, ואי אפשר לבדוק אותו (ROADMAP, פריט 29).
 */
export function topByGraduates(courses: readonly CourseSummary[], categorySlug: string, limit = TOP_LIMIT): ScoredSummary[] {
  return courses
    .filter((c) => c.categorySlug === categorySlug || c.categoryParentSlug === categorySlug)
    .filter(isScored)
    .sort(
      (a, b) =>
        b.score.value - a.score.value ||
        b.verifiedCount - a.verifiedCount ||
        (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0),
    )
    .slice(0, limit);
}
