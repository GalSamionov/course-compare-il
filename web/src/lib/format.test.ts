import { describe, expect, it } from 'vitest';
import { costPerHandsOnHour, formatHebrewDate, formatIls, invoiceCountText, paidRangeSentence } from './format';

describe('formatIls', () => {
  it('adds thousands separators and the shekel sign', () => {
    expect(formatIls(14900)).toBe('14,900 ₪');
    expect(formatIls(1500)).toBe('1,500 ₪');
  });
});

describe('the paid range', () => {
  // המסד מחזיר את החצי האמצעי, ומספר חשבוניות מעוגל ל-5. הניסוח לא מציג אותו כמינימום ומקסימום, ולא כמספר מדויק.
  it('says it is the middle half, between two amounts', () => {
    expect(paidRangeSentence({ min: 12000, max: 16000, count: 5 })).toBe('חצי מהבוגרים שילמו בין 12,000 ל-16,000 ₪');
  });
  it('gives the invoice count as a floor', () => {
    expect(invoiceCountText({ min: 12000, max: 16000, count: 10 })).toBe('לפי 10 חשבוניות ומעלה');
  });
});

describe('costPerHandsOnHour', () => {
  it('rounds the price per hands-on hour', () => {
    expect(costPerHandsOnHour(14900, 260)).toBe(57);
  });
  it('returns null when a value is missing', () => {
    expect(costPerHandsOnHour(null, 260)).toBeNull();
    expect(costPerHandsOnHour(14900, 0)).toBeNull();
  });
});

describe('formatHebrewDate', () => {
  it('writes day.month.year in Israel time', () => {
    expect(formatHebrewDate('2026-11-06T08:00:00Z')).toBe('6.11.2026');
  });
  it('uses Israel time near midnight', () => {
    expect(formatHebrewDate('2026-11-05T22:30:00Z')).toBe('6.11.2026');
    expect(formatHebrewDate('2026-12-31T22:30:00Z')).toBe('1.1.2027');
  });
  it('accepts a date-only string from a Postgres date column', () => {
    expect(formatHebrewDate('2027-01-10')).toBe('10.1.2027');
  });
});
