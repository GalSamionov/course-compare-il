import type { CoursePageData } from '@/lib/data/course-page';
import { formatPaidRange } from '@/lib/format';
import { SAMPLE_DATA } from '@/lib/site';

/**
 * הטקסט של קישור לעמוד קורס, כמו שהוא מופיע בוואטסאפ ובפייסבוק: כותרת, תיאור, ושורות התמונה.
 * הניסוח זהה בתיאור ובתמונה, כדי שמי שמקבל קישור יקרא את אותם מספרים בשני המקומות.
 */

export const verifiedText = (n: number) => (n === 1 ? 'בוגר מאומת אחד' : `${n} בוגרים מאומתים`);
export const reviewsText = (n: number) => (n === 1 ? 'ביקורת מאומתת אחת' : `${n} ביקורות מאומתות`);
export const neededText = (n: number) => (n === 1 ? 'עוד ביקורת אחת עד לציון' : `עוד ${n} ביקורות עד לציון`);

/** כותרת הקישור: הקורס והמוסד. שם האתר מגיע בנפרד (og:site_name). */
export function courseShareTitle(course: Pick<CoursePageData, 'title' | 'institutionName'>): string {
  return course.institutionName ? `${course.title}, ${course.institutionName}` : course.title;
}

/** תיאור הקישור: קודם הציון ומספר המאומתים, אחר כך מה ששולם בפועל, ובסוף מי משלם לנו. */
export function courseShareDescription(course: Pick<CoursePageData, 'score' | 'paid'>): string {
  const { score } = course;
  const parts: string[] = [];
  if (score.status === 'scored') {
    parts.push(`ציון בוגרים ${score.value.toFixed(1)} מתוך 10, לפי ${verifiedText(score.reviewCount)}.`);
  } else if (score.status === 'not_enough_reviews' && score.reviewCount > 0) {
    parts.push(`עוד אין ציון בוגרים: ${reviewsText(score.reviewCount)}, ${neededText(score.reviewsNeeded)}.`);
  } else {
    parts.push('עוד אין ביקורות מאומתות על הקורס.');
  }
  if (course.paid) parts.push(`שילמו בפועל ${formatPaidRange(course.paid)}, לפי ${course.paid.count} חשבוניות.`);
  parts.push('אף מוכר לא משלם לנו.');
  if (SAMPLE_DATA) parts.push('נתוני דוגמה.');
  return parts.join(' ');
}
