import { formatAmount } from '../format';

/** הסכום נשמר במדרגות של 500, למטה (מסמך העיצוב של חלק 1, סעיף 6). */
export const PAID_STEP = 500;

/** null: סכום לא תקין. */
export function paidBucket(amount: number): number | null {
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) return null;
  return Math.floor(amount / PAID_STEP) * PAID_STEP;
}

/**
 * הסכום כמו שגל מקליד אותו בתור ("3,200", "3200 ₪"): השרת שומר לפיו (admin/actions.ts), והטופס מראה מראש
 * מה יישמר (decide-form.tsx). null: השדה ריק, ואז נשמר בלי סכום. 'invalid': לא סכום בשקלים.
 */
export function paidBucketFromInput(text: string): number | null | 'invalid' {
  const clean = text.replace(/[\s,₪]/g, '');
  if (clean === '') return null;
  return paidBucket(Number(clean)) ?? 'invalid';
}

/** "3,000–3,500 ₪": המדרגה שתישמר. סימן הכיוון שומר את הטווח משמאל לימין גם בתוך משפט בעברית. */
export function paidBucketLabel(bucket: number): string {
  return `\u200E${formatAmount(bucket)}–${formatAmount(bucket + PAID_STEP)} ₪`;
}
