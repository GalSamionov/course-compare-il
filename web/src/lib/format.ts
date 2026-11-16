import type { OutcomeView } from '@/lib/data/course-page';

const ilsNumber = new Intl.NumberFormat('he-IL', { maximumFractionDigits: 0 });

/** מספר עם מפרידי אלפים, בלי ₪. לשורת התקציב במחברת. */
export function formatAmount(amount: number): string {
  return ilsNumber.format(amount);
}

export function formatIls(amount: number): string {
  return `${formatAmount(amount)} ₪`;
}

/**
 * לתצוגה בעמוד: הרווח בין סכום ל-₪ לא נשבר, כדי ש-₪ לא יישאר לבד בתחילת שורה (בעמודה צרה בהשוואה).
 * רק בעמוד: תמונות השיתוף מפרקות שורה לפי רווחים רגילים (lib/og/bidi.ts).
 */
export function keepShekelWithAmount(text: string): string {
  return text.replace(/(\d) ₪/g, '$1\u00A0₪');
}

/**
 * מה ששולם בפועל, מהמסד (course_paid_range): החצי האמצעי של החשבוניות, מעוגל החוצה ל-2,000 ₪, ורק מ-5 חשבוניות.
 * זה לא המינימום והמקסימום. count מעוגל למטה ל-5 (5, 10, 15...), ולכן אף פעם לא המספר המדויק.
 * בלי הקצוות ובלי מספר מדויק: ביקורת אחת שמתפרסמת לא מזיזה מספר שממנו המוסד יזהה את הבוגר.
 */
export interface PaidRange {
  min: number;
  max: number;
  count: number;
}

/** "בין 12,000 ל-16,000 ₪". הקצה העליון תמיד גבוה מהתחתון (המסד מעגל אותם לכיוונים הפוכים). */
export function formatPaidRange(range: PaidRange): string {
  return `בין ${ilsNumber.format(range.min)} ל-${ilsNumber.format(range.max)} ₪`;
}

/** תחילת המשפט, לפני הטווח: "חצי מהבוגרים שילמו בין 12,000 ל-16,000 ₪". אותו ניסוח בכל מקום שמציג אותו. */
export const PAID_RANGE_LEAD = 'חצי מהבוגרים שילמו';

export function paidRangeSentence(range: PaidRange): string {
  return `${PAID_RANGE_LEAD} ${formatPaidRange(range)}`;
}

/** "לפי 5 חשבוניות ומעלה": המספר מהמסד כבר מעוגל למטה ל-5. */
export function invoiceCountText(range: PaidRange): string {
  return `לפי ${range.count} חשבוניות ומעלה`;
}

/** למה רק חצי: ליד הטווח בחלק המחיר. */
export const PAID_RANGE_NOTE = 'את הקצוות לא מראים, כדי שאף אחד לא יזוהה לפי הסכום ששילם.';

/**
 * ספירה בעברית: "אחת" ו"אחד" באים אחרי שם העצם ובלי ספרה ("ביקורת מאומתת אחת"), ושאר המספרים לפניו
 * ובספרות ("3 ביקורות מאומתות"). אפס הוא לא ספירה: כל מקום שמציג אותו כותב "עוד אין" בניסוח שלו.
 */
const counted = (n: number, one: string, many: string) => (n === 1 ? one : `${n} ${many}`);

/** "ביקורת מאומתת אחת", "3 ביקורות מאומתות". */
export function verifiedReviewsText(n: number): string {
  return counted(n, 'ביקורת מאומתת אחת', 'ביקורות מאומתות');
}

/** "בוגר מאומת אחד", "23 בוגרים מאומתים". */
export function verifiedGraduatesText(n: number): string {
  return counted(n, 'בוגר מאומת אחד', 'בוגרים מאומתים');
}

/** כמה ביקורות חסרות לציון: "עוד ביקורת אחת", "עוד 2 ביקורות". */
export function moreReviewsText(n: number): string {
  return `עוד ${counted(n, 'ביקורת אחת', 'ביקורות')}`;
}

/** "עוד ביקורת אחת עד לציון", "עוד 2 ביקורות עד לציון". */
export function reviewsToScoreText(n: number): string {
  return `${moreReviewsText(n)} עד לציון`;
}

/** עם הפועל, שמתאים למספר: "חסרה עוד ביקורת אחת", "חסרות עוד 5 ביקורות". */
export function missingReviewsText(n: number): string {
  return `${n === 1 ? 'חסרה' : 'חסרות'} ${moreReviewsText(n)}`;
}

// מחיר 0 או null אומר "לא מציגים" (לקורס חינם אין עלות לשעה), ולכן מחזירים null.
export function costPerHandsOnHour(price: number | null, handsOnHours: number | null): number | null {
  if (!price || !handsOnHours) return null;
  return Math.round(price / handsOnHours);
}

const israelDate = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Jerusalem',
  day: 'numeric',
  month: 'numeric',
  year: 'numeric',
});

// תאריך לא תקין זורק שגיאה בכוונה, והקוראים מעבירים רק ערכים שאינם null.
export function formatHebrewDate(iso: string): string {
  const parts = israelDate.formatToParts(new Date(iso));
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value);
  return `${get('day')}.${get('month')}.${get('year')}`;
}

/**
 * מה קרה לבוגרים, במילים של אנשים: קודם התוצאה. אותו ניסוח ב"בקצרה", בפתק של "על הקורס" ובהשוואה.
 * בשאלת ההמשך נשמר רק ממוצע מתוך 5, ולכן השורה אומרת על איזו שאלה הוא. כמה ענו: outcomeBasis.
 */
export function outcomeHeadline(outcome: OutcomeView): string {
  switch (outcome.kind) {
    case 'after_3m':
      return `${outcome.mean.toFixed(1)} מתוך 5 בשאלה ״${outcome.question}״`;
    case 'skill_gained':
      return `${outcome.yes} מתוך ${outcome.n} אומרים שרכשו את המיומנות`;
    case 'passed_exam':
      return `${outcome.yes} מתוך ${outcome.n} אומרים שעברו את המבחן`;
  }
}

/** כמה ענו, כשזה לא כתוב בתוצאה עצמה: "14 בוגרים ענו 3 חודשים אחרי הסיום". בשאלת כן או לא המספר כבר בשורה. */
export function outcomeBasis(outcome: OutcomeView): string | null {
  return outcome.kind === 'after_3m' ? `${outcome.n} בוגרים ענו 3 חודשים אחרי הסיום` : null;
}
