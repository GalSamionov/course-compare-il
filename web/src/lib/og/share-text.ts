import { factsLine, type FactSource } from '@/lib/course/facts';
import { showsScore } from '@/lib/course/score-shown';
import type { CoursePageData } from '@/lib/data/course-page';
import {
  invoiceCountText,
  paidRangeSentence,
  reviewsToScoreText,
  verifiedGraduatesText,
  verifiedReviewsText,
} from '@/lib/format';
import { SITE_NAME } from '@/lib/site';

/**
 * הטקסט של קישור לעמוד קורס, כמו שהוא מופיע בוואטסאפ ובפייסבוק: כותרת, תיאור, ושורות התמונה.
 * הניסוח זהה בתיאור ובתמונה, כדי שמי שמקבל קישור יקרא את אותם מספרים בשני המקומות.
 */

/** כותרת הקישור: הקורס והמוסד. שם האתר מגיע בנפרד (og:site_name). */
export function courseShareTitle(course: Pick<CoursePageData, 'title' | 'institutionName'>): string {
  return course.institutionName ? `${course.title}, ${course.institutionName}` : course.title;
}

/** מה שהתיאור צריך מקורס: הציון, מה ששולם, כמה ביקורות פורסמו, והעובדות. */
type ShareCourse = Pick<CoursePageData, 'score' | 'paid' | 'reviewTotal'> & FactSource;

/**
 * תיאור הקישור. קורס עם ביקורות: הציון ומספר המאומתים, אחר כך מה ששולם בפועל. בלי ביקורות (מסמך העיצוב 2026-11-17):
 * העובדות שהמוסד מפרסם, כמו השורה ברשימה, ולא "עוד אין". בסוף, מי משלם לנו.
 */
export function courseShareDescription(course: ShareCourse): string {
  const { score } = course;
  const parts: string[] = [];
  if (!showsScore(course.reviewTotal)) {
    parts.push(`${factsLine(course).map((part) => part.text).join(' · ')}.`);
  } else if (score.status === 'scored') {
    parts.push(`ציון בוגרים ${score.value.toFixed(1)} מתוך 10, לפי ${verifiedGraduatesText(score.reviewCount)}.`);
  } else if (score.status === 'not_enough_reviews' && score.reviewCount > 0) {
    parts.push(`עוד אין ציון בוגרים: ${verifiedReviewsText(score.reviewCount)}, ${reviewsToScoreText(score.reviewsNeeded)}.`);
  } else {
    parts.push(`${verifiedReviewsText(course.reviewTotal)}.`);
  }
  if (course.paid) parts.push(`${paidRangeSentence(course.paid)}, ${invoiceCountText(course.paid)}.`);
  parts.push('אף מוכר לא משלם לנו.');
  return parts.join(' ');
}

/** ההודעה בוואטסאפ: הכותרת של הקישור, ומתחתיה התיאור. אותו ניסוח כמו בתצוגה של הקישור עצמו. */
export function courseShareMessage(course: ShareCourse & Pick<CoursePageData, 'title' | 'institutionName'>): string {
  return `${courseShareTitle(course)}\n${courseShareDescription(course)}`;
}

/** הודעה על השוואה: שמות הקורסים, ומי משלם לנו. */
export function compareShareMessage(titles: readonly string[]): string {
  return `השוואה ב${SITE_NAME}: ${titles.join(', ')}. אף מוכר לא משלם לנו.`;
}

/** הכותרת של עמוד ההסבה להייטק: בעמוד עצמו, בתצוגה של הקישור ובתמונת השיתוף. */
export const CAREER_CHANGE_TITLE = 'קורסי הסבה להייטק, לפי מי שכבר סיים אותם';

/** "3 קורסים, 26 בוגרים מאומתים": מה יש בעמוד, במספרים מהמסד. */
export function careerChangeCounts(page: { courses: readonly unknown[]; graduates: number }): string {
  const n = page.courses.length;
  const courses = n === 0 ? 'עוד אין קורסים' : n === 1 ? 'קורס אחד' : `${n} קורסים`;
  if (n === 0) return courses;
  return `${courses}, ${page.graduates === 0 ? 'עוד בלי בוגרים מאומתים' : verifiedGraduatesText(page.graduates)}`;
}

/** תיאור הקישור לעמוד ההסבה, וגם השורה השנייה בהודעה בוואטסאפ. */
export function careerChangeDescription(page: { courses: readonly unknown[]; graduates: number }): string {
  return [
    `${careerChangeCounts(page)}.`,
    'ציון רק מבוגרים שהוכיחו שלמדו, כמה שילמו בפועל לפי חשבוניות, ומה לשאול לפני שמשלמים.',
    'אף מוסד לא משלם לנו.',
  ].join(' ');
}

/** ההודעה בוואטסאפ: הכותרת, ומתחתיה התיאור. */
export function careerChangeShareMessage(page: { courses: readonly unknown[]; graduates: number }): string {
  return `${CAREER_CHANGE_TITLE}\n${careerChangeDescription(page)}`;
}

/**
 * קישור ששולח הודעה בוואטסאפ, בלי נמען מראש (wa.me/?text=). הכתובת בשורה האחרונה:
 * וואטסאפ מציג ממנה את תמונת השיתוף (opengraph-image.tsx).
 */
export function whatsappHref(message: string, url: string): string {
  return `https://wa.me/?text=${encodeURIComponent(`${message}\n${url}`)}`;
}
