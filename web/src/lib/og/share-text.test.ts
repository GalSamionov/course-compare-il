import { describe, expect, it } from 'vitest';
import { courseShareDescription } from './share-text';

describe('courseShareDescription', () => {
  it('leads with the score and the verified count, then what people paid', () => {
    expect(
      courseShareDescription({
        score: { status: 'scored', value: 7.9, reviewCount: 23, recommendPct: 91, stale: false },
        paid: { min: 12000, max: 16000, count: 5 },
      }),
    ).toBe(
      'ציון בוגרים 7.9 מתוך 10, לפי 23 בוגרים מאומתים. חצי מהבוגרים שילמו בין 12,000 ל-16,000 ₪, לפי 5 חשבוניות ומעלה. אף מוכר לא משלם לנו. נתוני דוגמה.',
    );
  });

  it('says how many reviews are missing when there is no score yet', () => {
    expect(
      courseShareDescription({ score: { status: 'not_enough_reviews', reviewCount: 3, reviewsNeeded: 2 }, paid: null }),
    ).toBe('עוד אין ציון בוגרים: 3 ביקורות מאומתות, עוד 2 ביקורות עד לציון. אף מוכר לא משלם לנו. נתוני דוגמה.');
  });
});
