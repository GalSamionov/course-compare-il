import type { CoursePageData } from './course-page';

type Orderable = Pick<CoursePageData, 'title' | 'status' | 'score' | 'reviewTotal'>;

/**
 * הסדר של הקורסים בעמוד מוסד ובעמוד מרצה:
 * - קודם קורסים עם ציון, מהגבוה לנמוך;
 * - אחריהם קורסים בלי ציון, מי שיש לו יותר ביקורות מאומתות קודם (הוא הכי קרוב לציון);
 * - ובסוף קורסים שכבר לא מוצעים.
 * בתיקו לפי השם. זה סדר של קורסים, לא ציון למוסד או למרצה.
 */
export function compareByScore(a: Orderable, b: Orderable): number {
  const removed = Number(a.status === 'removed') - Number(b.status === 'removed');
  if (removed !== 0) return removed;
  const scoreA = a.score.status === 'scored' ? a.score.value : null;
  const scoreB = b.score.status === 'scored' ? b.score.value : null;
  if (scoreA !== null && scoreB === null) return -1;
  if (scoreA === null && scoreB !== null) return 1;
  if (scoreA !== null && scoreB !== null && scoreA !== scoreB) return scoreB - scoreA;
  if (a.reviewTotal !== b.reviewTotal) return b.reviewTotal - a.reviewTotal;
  return a.title.localeCompare(b.title, 'he');
}
