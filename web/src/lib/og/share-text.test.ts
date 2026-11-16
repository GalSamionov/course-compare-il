import { describe, expect, it } from 'vitest';
import {
  careerChangeCounts,
  careerChangeShareMessage,
  compareShareMessage,
  courseShareDescription,
  courseShareMessage,
  whatsappHref,
} from './share-text';

describe('courseShareDescription', () => {
  it('leads with the score and the verified count, then what people paid', () => {
    expect(
      courseShareDescription({
        score: { status: 'scored', value: 7.9, reviewCount: 23, recommendPct: 91, stale: false },
        paid: { min: 12000, max: 16000, count: 5 },
      }),
    ).toBe(
      'ציון בוגרים 7.9 מתוך 10, לפי 23 בוגרים מאומתים. חצי מהבוגרים שילמו בין 12,000 ל-16,000 ₪, לפי 5 חשבוניות ומעלה. אף מוכר לא משלם לנו.',
    );
  });

  it('says how many reviews are missing when there is no score yet', () => {
    expect(
      courseShareDescription({ score: { status: 'not_enough_reviews', reviewCount: 3, reviewsNeeded: 2 }, paid: null }),
    ).toBe('עוד אין ציון בוגרים: 3 ביקורות מאומתות, עוד 2 ביקורות עד לציון. אף מוכר לא משלם לנו.');
  });
});

describe('courseShareMessage', () => {
  it('puts the title of the link above its description', () => {
    expect(courseShareMessage({ title: 'אפייה', institutionName: 'סדנה לדוגמה', score: { status: 'none' }, paid: null })).toBe(
      'אפייה, סדנה לדוגמה\nעוד אין ביקורות מאומתות על הקורס. אף מוכר לא משלם לנו.',
    );
  });
});

describe('whatsappHref', () => {
  it('sends the message and then the address, as one encoded text', () => {
    const href = whatsappHref('שורה ראשונה, עם & ו-?', 'https://example.com/compare?c=a,b');
    expect(href.startsWith('https://wa.me/?text=')).toBe(true);
    expect(new URL(href).searchParams.get('text')).toBe('שורה ראשונה, עם & ו-?\nhttps://example.com/compare?c=a,b');
  });
});

describe('compareShareMessage', () => {
  it('names the courses and who pays us', () => {
    expect(compareShareMessage(['פיתוח Full Stack', 'אפייה ביתית'])).toBe(
      'השוואה בלמדתי: פיתוח Full Stack, אפייה ביתית. אף מוכר לא משלם לנו.',
    );
  });
});

describe('careerChangeShareMessage', () => {
  it('says how many courses and verified graduates the page has, and who pays us', () => {
    expect(careerChangeShareMessage({ courses: [1, 2, 3], graduates: 26 })).toBe(
      'קורסי הסבה להייטק, לפי מי שכבר סיים אותם\n3 קורסים, 26 בוגרים מאומתים. ציון רק מבוגרים שהוכיחו שלמדו, כמה שילמו בפועל לפי חשבוניות, ומה לשאול לפני שמשלמים. אף מוסד לא משלם לנו.',
    );
  });

  it('counts in Hebrew, and says so when there is nothing yet', () => {
    expect(careerChangeCounts({ courses: [1], graduates: 1 })).toBe('קורס אחד, בוגר מאומת אחד');
    expect(careerChangeCounts({ courses: [1, 2], graduates: 0 })).toBe('2 קורסים, עוד בלי בוגרים מאומתים');
    expect(careerChangeCounts({ courses: [], graduates: 0 })).toBe('עוד אין קורסים');
  });
});
