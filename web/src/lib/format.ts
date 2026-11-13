const ilsNumber = new Intl.NumberFormat('he-IL', { maximumFractionDigits: 0 });

/** מספר עם מפרידי אלפים, בלי ₪. לשורת התקציב במחברת. */
export function formatAmount(amount: number): string {
  return ilsNumber.format(amount);
}

export function formatIls(amount: number): string {
  return `${formatAmount(amount)} ₪`;
}

/**
 * טווח מה ששולם בפועל. המסד מחשב אותו בפונקציה course_paid_range,
 * ומחזיר אותו רק כשיש לפחות 3 חשבוניות, כדי שאי אפשר יהיה לזהות אף אחד.
 */
export interface PaidRange {
  min: number;
  max: number;
  count: number;
}

export function formatPaidRange(range: PaidRange): string {
  if (range.min === range.max) return formatIls(range.min);
  return `${ilsNumber.format(range.min)}–${ilsNumber.format(range.max)} ₪`;
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
