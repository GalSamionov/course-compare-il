import type { CoursePageData } from '@/lib/data/course-page';
import {
  invoiceCountText,
  paidRangeSentence,
  reviewsToScoreText,
  verifiedGraduatesText,
  verifiedReviewsText,
} from '@/lib/format';
import { SAMPLE_DATA } from '@/lib/site';

/**
 * הטקסט של קישור לעמוד קורס, כמו שהוא מופיע בוואטסאפ ובפייסבוק: כותרת, תיאור, ושורות התמונה.
 * הניסוח זהה בתיאור ובתמונה, כדי שמי שמקבל קישור יקרא את אותם מספרים בשני המקומות.
 */

/** כותרת הקישור: הקורס והמוסד. שם האתר מגיע בנפרד (og:site_name). */
export function courseShareTitle(course: Pick<CoursePageData, 'title' | 'institutionName'>): string {
  return course.institutionName ? `${course.title}, ${course.institutionName}` : course.title;
}

/** תיאור הקישור: קודם הציון ומספר המאומתים, אחר כך מה ששולם בפועל, ובסוף מי משלם לנו. */
export function courseShareDescription(course: Pick<CoursePageData, 'score' | 'paid'>): string {
  const { score } = course;
  const parts: string[] = [];
  if (score.status === 'scored') {
    parts.push(`ציון בוגרים ${score.value.toFixed(1)} מתוך 10, לפי ${verifiedGraduatesText(score.reviewCount)}.`);
  } else if (score.status === 'not_enough_reviews' && score.reviewCount > 0) {
    parts.push(`עוד אין ציון בוגרים: ${verifiedReviewsText(score.reviewCount)}, ${reviewsToScoreText(score.reviewsNeeded)}.`);
  } else {
    parts.push('עוד אין ביקורות מאומתות על הקורס.');
  }
  if (course.paid) parts.push(`${paidRangeSentence(course.paid)}, ${invoiceCountText(course.paid)}.`);
  parts.push('אף מוכר לא משלם לנו.');
  if (SAMPLE_DATA) parts.push('נתוני דוגמה.');
  return parts.join(' ');
}
