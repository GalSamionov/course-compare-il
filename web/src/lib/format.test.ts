import { describe, expect, it } from 'vitest';
import {
  costPerHandsOnHour,
  formatHebrewDate,
  formatIls,
  invoiceCountText,
  missingReviewsText,
  moreReviewsText,
  outcomeBasis,
  outcomeHeadline,
  paidRangeSentence,
  reviewsToScoreText,
  verifiedGraduatesText,
  verifiedReviewsText,
} from './format';

describe('counts in Hebrew', () => {
  it('puts "one" after the noun, without a digit', () => {
    expect(verifiedReviewsText(1)).toBe('ביקורת מאומתת אחת');
    expect(verifiedGraduatesText(1)).toBe('בוגר מאומת אחד');
    expect(moreReviewsText(1)).toBe('עוד ביקורת אחת');
    expect(reviewsToScoreText(1)).toBe('עוד ביקורת אחת עד לציון');
    expect(missingReviewsText(1)).toBe('חסרה עוד ביקורת אחת');
  });
  it('puts any other number before the plural noun', () => {
    expect(verifiedReviewsText(3)).toBe('3 ביקורות מאומתות');
    expect(verifiedGraduatesText(23)).toBe('23 בוגרים מאומתים');
    expect(moreReviewsText(2)).toBe('עוד 2 ביקורות');
    expect(reviewsToScoreText(2)).toBe('עוד 2 ביקורות עד לציון');
    expect(missingReviewsText(5)).toBe('חסרות עוד 5 ביקורות');
  });
});

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

describe('what happened to graduates', () => {
  it('leads with the result of the follow-up question, and names the question', () => {
    const outcome = { kind: 'after_3m', n: 14, mean: 3.7, question: 'אחרי 3 חודשים' } as const;
    expect(outcomeHeadline(outcome)).toBe('3.7 מתוך 5 בשאלה ״אחרי 3 חודשים״');
    expect(outcomeBasis(outcome)).toBe('14 בוגרים ענו 3 חודשים אחרי הסיום');
  });
  it('says how many said yes, with the count already in the line', () => {
    const skill = { kind: 'skill_gained', yes: 8, n: 8 } as const;
    expect(outcomeHeadline(skill)).toBe('8 מתוך 8 אומרים שרכשו את המיומנות');
    expect(outcomeBasis(skill)).toBeNull();
    expect(outcomeHeadline({ kind: 'passed_exam', yes: 5, n: 7 })).toBe('5 מתוך 7 אומרים שעברו את המבחן');
  });
});
