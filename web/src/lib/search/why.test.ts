import { describe, expect, it } from 'vitest';
import { WHY_OPTIONS, courseTypeForWhy, highlightFor } from './why';

describe('courseTypeForWhy', () => {
  it.each([
    ['switch', 'career'],
    ['advance', 'career'],
    ['certificate', 'exam'],
    ['exam', 'exam'],
    ['fun', 'hobby'],
  ] as const)('%s is a %s course', (why, type) => {
    expect(courseTypeForWhy(why)).toBe(type);
  });

  it('writes "כדי" before every answer except "בשביל הכיף"', () => {
    expect(WHY_OPTIONS.filter((o) => o.prefix === '').map((o) => o.key)).toEqual(['fun']);
  });
});

describe('highlightFor', () => {
  it('career: the outcome three months later', () => {
    expect(highlightFor('career', { outcome_3m: { mean: 52 / 14, n: 14 } })).toEqual({
      label: 'אחרי 3 חודשים',
      text: '3.7 מתוך 5, לפי 14 בוגרים',
    });
  });

  it('exam: the share who passed', () => {
    expect(highlightFor('exam', { passed_exam: { mean: 37 / 9, n: 9 } })).toEqual({
      label: 'עברו את המבחן',
      text: '78% מתוך 9 בוגרים',
    });
  });

  it('hobby: the share who gained the skill', () => {
    expect(highlightFor('hobby', { skill_gained: { mean: 5, n: 8 } })).toEqual({
      label: 'מה למדו בפועל',
      text: '100% אומרים שרכשו את המיומנות (8 בוגרים)',
    });
  });

  it('shows nothing below 3 answers, or when the question belongs to another type', () => {
    expect(highlightFor('career', { outcome_3m: { mean: 4, n: 2 } })).toBeNull();
    expect(highlightFor('exam', { outcome_3m: { mean: 4, n: 10 } })).toBeNull();
    expect(highlightFor('hobby', {})).toBeNull();
  });
});
