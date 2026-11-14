import type { CoursePageData } from '@/lib/data/course-page';
import { formatHebrewDate, formatIls, formatPaidRange } from '@/lib/format';
import type { AdviceSource } from './types';

const FORMAT_WORDS: Record<string, string> = {
  online: 'אונליין',
  in_person: 'בכיתה',
  hybrid: 'משולב',
  recorded: 'מוקלט',
};

/**
 * טקסט מהמסד נכנס להנחיה כנתון. בלי < ו-> הוא לא יכול לסגור את <course>, או לפתוח תגית משלו.
 * גם ירידות שורה הופכות לרווח: כל עובדה היא שורה אחת, עם המקור בתחילתה.
 */
export function asData(text: string): string {
  return text.replace(/[<>]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * העובדות על קורס אחד, כל אחת בשורה עם המקור שלה. המקור הוא הסימון של אותה עובדה בעמוד הקורס,
 * כדי שאותה עובדה לא תהיה ירוקה אצל היועץ ורגילה בעמוד הקורס:
 * - verified (מרקר ירוק): רק מה שירוק בעמוד הקורס. המשך והשעות (about-section), הטווח ששולם לפי
 *   חשבוניות (price-section, at-a-glance), ועובדות שבדקנו על מרצים (lecturers-section).
 * - institution (קו כחול): כל השאר שמגיע מהמוסד, גם מה שבעמוד הקורס בלי סימון. שעות העשייה, מתי, איך
 *   ואיפה, המחזור הבא, המחיר באתר, תנאי קבלה, תעודה, הפרקים, ההבטחות, הערות על המרצים ועל גודל הכיתה,
 *   מה שהמוסד אומר על מרצה, ותגובות המוסד לביקורות.
 * - graduates (מרקר צהוב): בוגרים מאומתים. הציון, הציונים לפי שאלה, מה קרה אחרי הקורס, הסיכומים והביקורות.
 * "פרק חלש" בסילבוס לא נכנס: לא ברור מאיזה מקור הוא, וליועץ אין ורוד.
 * סימון ירוק שנוסף לעמוד הקורס, או שירד ממנו, משתנה גם כאן.
 */
function factLines(course: CoursePageData): string[] {
  const lines: string[] = [];
  const add = (source: AdviceSource, label: string, value: string | null) => {
    if (value) lines.push(`[${source}] ${label}: ${asData(value)}`);
  };
  const join = (parts: (string | null)[], separator = ', ') => parts.filter(Boolean).join(separator) || null;

  add(
    'verified',
    'משך',
    join([
      course.durationMonths === null ? null : course.durationMonths === 1 ? 'חודש אחד' : `${course.durationMonths} חודשים`,
      course.totalHours !== null ? `${course.totalHours} שעות` : null,
    ]),
  );
  add(
    'verified',
    'שילמו בפועל',
    course.paid ? `${formatPaidRange(course.paid)}, לפי ${course.paid.count} חשבוניות` : null,
  );
  for (const lecturer of course.lecturers) {
    for (const fact of lecturer.verifiedFacts) add('verified', `על המרצה ${lecturer.name}`, fact.text);
  }

  add('institution', 'שעות עשייה', course.handsOnHours !== null ? String(course.handsOnHours) : null);
  add('institution', 'מתי', course.schedule);
  add('institution', 'איך', join([join(course.formats.map((f) => FORMAT_WORDS[f] ?? f), ' או '), course.region]));
  add('institution', 'המחזור הבא', course.nextCohortDate ? formatHebrewDate(course.nextCohortDate) : null);
  add('institution', 'המחיר באתר המוסד', course.sitePrice !== null ? formatIls(course.sitePrice) : null);
  add('institution', 'תנאי קבלה', course.admission);
  add('institution', 'תעודה', course.certificate);
  add('institution', 'מה לומדים', join(course.syllabus.map((item) => item.title), '; '));
  add('institution', 'המוסד מבטיח', course.institutionPromises);
  add('institution', 'על המרצים', course.lecturersNote);
  add('institution', 'על גודל הכיתה', course.classSizeNote);
  for (const lecturer of course.lecturers) add('institution', `על המרצה ${lecturer.name}`, lecturer.institutionBio);

  const { score } = course;
  add(
    'graduates',
    'ציון בוגרים',
    score.status === 'scored'
      ? `${score.value.toFixed(1)} מתוך 10, לפי ${score.reviewCount} ביקורות מאומתות` +
          (score.recommendPct !== null ? `. ${score.recommendPct}% ממליצים` : '')
      : score.status === 'not_enough_reviews'
        ? `עוד אין. ${score.reviewCount === 0 ? 'אין עדיין ביקורות מאומתות' : `יש ${score.reviewCount} ביקורות מאומתות`}, וחסרות עוד ${score.reviewsNeeded}`
        : 'עוד אין',
  );
  add(
    'graduates',
    'ציונים לפי שאלה, מתוך 5',
    join(course.metrics.map((m) => `${m.label} ${m.mean.toFixed(1)} (${m.n} ענו)`), '; '),
  );
  const { outcome } = course;
  add(
    'graduates',
    'מה קרה אחרי הקורס',
    !outcome
      ? null
      : outcome.kind === 'after_3m'
        ? `${outcome.n} בוגרים ענו 3 חודשים אחרי הסיום, ובממוצע נתנו לתוצאה ${outcome.mean.toFixed(1)} מתוך 5`
        : `${outcome.yes} מתוך ${outcome.n} אומרים ש${outcome.kind === 'passed_exam' ? 'עברו את המבחן' : 'רכשו את המיומנות'}`,
  );
  add('graduates', 'מה טוב', course.summaryGood);
  add('graduates', 'מה חלש', course.summaryWeak);
  add('graduates', 'על המרצים', course.lecturersSummary);
  add(
    'graduates',
    'ביקורות מאומתות שפורסמו',
    `${course.reviewTotal}${course.reviews.length > 0 ? `. כאן ${course.reviews.length} האחרונות` : ''}`,
  );
  for (const review of course.reviews) {
    add('graduates', `ביקורת, מחזור ${review.cohortMonth.slice(0, 7)}`, review.body);
    add('graduates', 'אותו בוגר, 3 חודשים אחרי הסיום', review.followUp);
    add('institution', 'תגובת המוסד לביקורת הזו', review.vendorResponse);
  }
  return lines;
}

/** קורס אחד, בתגית משלו. ה-slug נבדק מול התבנית של המסד, ולכן בטוח בתוך התגית. */
export function buildCourseContext(course: CoursePageData): string {
  return [
    `<course slug="${course.slug}">`,
    `שם: ${asData(course.title)}`,
    `מוסד: ${asData(course.institutionName)}`,
    `תחום: ${asData(course.categoryName)}`,
    ...factLines(course),
    '</course>',
  ].join('\n');
}

/** כל הקורסים ברשימה, כמו שהם במסד. זה כל מה שהיועץ יודע. */
export function buildContext(courses: readonly CoursePageData[]): string {
  return ['<courses>', ...courses.map(buildCourseContext), '</courses>'].join('\n');
}
