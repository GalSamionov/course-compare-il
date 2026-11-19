import { describe, expect, it } from 'vitest';
import { QUESTIONS, askBeforePaying } from './ask-before-paying';
import type { FactSource } from './facts';

const course = (over: Partial<FactSource> = {}): FactSource => ({
  sitePrice: 2600,
  totalHours: 30,
  durationMonths: 2,
  formats: ['in_person'],
  region: 'חיפה',
  institutionCity: null,
  certificate: null,
  nextCohortDate: '2027-01-11',
  ...over,
});

describe('askBeforePaying', () => {
  it('asks only about graduates when the institution publishes price, length, place and next cohort', () => {
    expect(askBeforePaying(course())).toEqual(['אפשר לדבר עם שני בוגרים מהמחזור הקודם?']);
  });

  it('asks in the order of the list, in the words of the design document', () => {
    expect(askBeforePaying(course({ sitePrice: null, totalHours: null, durationMonths: null }))).toEqual([
      'כמה עולה הקורס, כולל כל התשלומים? אפשר לקבל את זה בכתב?',
      'כמה שעות לימוד יש בפועל, וכמה מהן תרגול?',
      'אפשר לדבר עם שני בוגרים מהמחזור הקודם?',
    ]);
  });

  it('shows at most three, so the graduates question waits for room', () => {
    const nothing = course({ sitePrice: null, totalHours: null, durationMonths: null, formats: [], region: null, nextCohortDate: null });
    expect(askBeforePaying(nothing)).toEqual([QUESTIONS.price, QUESTIONS.duration, QUESTIONS.place]);
  });

  it('asks where when the place or the format is missing, but not for a course that is only online', () => {
    expect(askBeforePaying(course({ region: null }))).toEqual([QUESTIONS.place, QUESTIONS.graduates]);
    expect(askBeforePaying(course({ formats: [] }))).toEqual([QUESTIONS.place, QUESTIONS.graduates]);
    expect(askBeforePaying(course({ region: null, formats: ['online'] }))).toEqual([QUESTIONS.graduates]);
  });

  it('asks about the next cohort when there is none', () => {
    expect(askBeforePaying(course({ nextCohortDate: null }))).toEqual([
      'מתי המחזור הבא, ומה התנאים לביטול?',
      QUESTIONS.graduates,
    ]);
  });

  it('does not ask where when the institution has one city', () => {
    expect(askBeforePaying(course({ region: null, institutionCity: 'רמת גן' }))).toEqual([QUESTIONS.graduates]);
  });
});
