const ilsNumber = new Intl.NumberFormat('he-IL', { maximumFractionDigits: 0 });

export function formatIls(amount: number): string {
  return `${ilsNumber.format(amount)} ₪`;
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
  return `${ilsNumber.format(range.min)}–${ilsNumber.format(range.max)} ₪`;
}

export function costPerHandsOnHour(price: number | null, handsOnHours: number | null): number | null {
  if (!price || !handsOnHours) return null;
  return Math.round(price / handsOnHours);
}

export function formatHebrewDate(iso: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jerusalem',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${get('day')}.${get('month')}.${get('year')}`;
}
