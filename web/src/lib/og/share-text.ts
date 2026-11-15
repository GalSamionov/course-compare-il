import type { CoursePageData } from '@/lib/data/course-page';
import {
  invoiceCountText,
  paidRangeSentence,
  reviewsToScoreText,
  verifiedGraduatesText,
  verifiedReviewsText,
} from '@/lib/format';
import { SAMPLE_DATA, SITE_NAME } from '@/lib/site';

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

/** ההודעה בוואטסאפ: הכותרת של הקישור, ומתחתיה התיאור. אותו ניסוח כמו בתצוגה של הקישור עצמו. */
export function courseShareMessage(course: Pick<CoursePageData, 'title' | 'institutionName' | 'score' | 'paid'>): string {
  return `${courseShareTitle(course)}\n${courseShareDescription(course)}`;
}

/** הודעה על השוואה: שמות הקורסים, ומי משלם לנו. */
export function compareShareMessage(titles: readonly string[]): string {
  const parts = [`השוואה ב${SITE_NAME}: ${titles.join(', ')}.`, 'אף מוכר לא משלם לנו.'];
  if (SAMPLE_DATA) parts.push('נתוני דוגמה.');
  return parts.join(' ');
}

/**
 * קישור ששולח הודעה בוואטסאפ, בלי נמען מראש (wa.me/?text=). הכתובת בשורה האחרונה:
 * וואטסאפ מציג ממנה את תמונת השיתוף (opengraph-image.tsx).
 */
export function whatsappHref(message: string, url: string): string {
  return `https://wa.me/?text=${encodeURIComponent(`${message}\n${url}`)}`;
}
