/** מכמה ביקורות מפורסמות מוצג ציון, או "עוד X ביקורות עד לציון". */
export const MIN_PUBLISHED_FOR_SCORE = 1;

/**
 * אין ציון בלי ביקורות (מסמך העיצוב 2026-11-17, עיקרון 1). הכלל היחיד לכל מקום שמציג ציון:
 * תיבת הציון בעמוד הקורס, הציון בשורה ברשימה, בעמודי מוסד ומרצה, בהשוואה, בתיאור הקישור ובתמונת השיתוף.
 * בלי ביקורת מפורסמת: "העובדות" ושורת העובדות במקום. מביקורת אחת: הכול כמו היום, כולל "עוד X ביקורות עד לציון".
 * publishedReviews: ביקורות שפורסמו (CoursePageData.reviewTotal, CourseSummary.verifiedCount).
 */
export function showsScore(publishedReviews: number): boolean {
  return publishedReviews >= MIN_PUBLISHED_FOR_SCORE;
}
