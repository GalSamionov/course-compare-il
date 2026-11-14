import { describe, expect, it } from 'vitest';
import { courseShareDescription } from './share-text';

describe('courseShareDescription', () => {
  it('leads with the score and the verified count, then what people paid', () => {
    expect(
      courseShareDescription({
        score: { status: 'scored', value: 7.9, reviewCount: 23, recommendPct: 91, stale: false },
        paid: { min: 12500, max: 15000, count: 6 },
      }),
    ).toBe(
      'ציון בוגרים 7.9 מתוך 10, לפי 23 בוגרים מאומתים. שילמו בפועל 12,500–15,000 ₪, לפי 6 חשבוניות. אף מוכר לא משלם לנו. נתוני דוגמה.',
    );
  });

  it('says how many reviews are missing when there is no score yet', () => {
    expect(
      courseShareDescription({ score: { status: 'not_enough_reviews', reviewCount: 3, reviewsNeeded: 2 }, paid: null }),
    ).toBe('עוד אין ציון בוגרים: 3 ביקורות מאומתות, עוד 2 ביקורות עד לציון. אף מוכר לא משלם לנו. נתוני דוגמה.');
  });
});
