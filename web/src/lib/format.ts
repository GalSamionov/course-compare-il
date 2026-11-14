const ilsNumber = new Intl.NumberFormat('he-IL', { maximumFractionDigits: 0 });

/** מספר עם מפרידי אלפים, בלי ₪. לשורת התקציב במחברת. */
export function formatAmount(amount: number): string {
  return ilsNumber.format(amount);
}

export function formatIls(amount: number): string {
  return `${formatAmount(amount)} ₪`;
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
