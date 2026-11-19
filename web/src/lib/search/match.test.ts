import { describe, expect, it } from 'vitest';
import { closestToScore, matchCourses } from './match';
import { EMPTY_QUERY, type CourseSummary } from './types';

function course(over: Partial<CourseSummary> & { slug: string }): CourseSummary {
  return {
    id: over.slug,
    title: over.slug,
    institutionName: 'מוסד לדוגמה',
    categorySlug: 'cooking',
    categoryName: 'בישול',
    categoryParentSlug: null,
    courseType: 'hobby',
    productType: 'course',
    score: { status: 'none' },
    verifiedCount: 0,
    sitePrice: 2000,
    totalHours: 30,
    durationMonths: 2,
    region: 'חיפה',
    certificate: 'תעודת השתתפות',
    nextCohortDate: '2027-01-11',
    formats: ['in_person'],
    timeSlots: ['evening'],
    updatedAt: '2026-10-01T10:00:00+03:00',
    highlight: null,
    ...over,
  };
}

const rows = (courses: CourseSummary[], query = EMPTY_QUERY) =>
  matchCourses(courses, query).map((r) => [r.course.slug, r.full, r.note]);

describe('matchCourses', () => {
  it('puts scored courses first by score, then the rest by last update', () => {
    const courses = [
      course({ slug: 'old-unscored', updatedAt: '2026-09-01T10:00:00+03:00' }),
      course({ slug: 'low', score: { status: 'scored', value: 6.1 } }),
      course({
        slug: 'new-unscored',
        score: { status: 'not_enough_reviews', reviewsNeeded: 2 },
        updatedAt: '2026-10-20T10:00:00+03:00',
      }),
      course({ slug: 'high', score: { status: 'scored', value: 8.4 } }),
    ];
    expect(rows(courses)).toEqual([
      ['high', true, ''],
      ['low', true, ''],
      ['new-unscored', true, ''],
      ['old-unscored', true, ''],
    ]);
  });

  it('puts courses whose institution publishes more facts first, and only then scored before unscored', () => {
    const courses = [
      course({ slug: 'scored-few-facts', score: { status: 'scored', value: 9.1 }, certificate: null, nextCohortDate: null }),
      course({ slug: 'unscored-all-facts' }),
      course({ slug: 'scored-all-facts', score: { status: 'scored', value: 7 } }),
      course({ slug: 'no-price', sitePrice: null }),
    ];
    // 6, 6, 5 ו-4 עובדות ידועות. בין שני השישה, הציון קובע.
    expect(rows(courses).map((r) => r[0])).toEqual(['scored-all-facts', 'unscored-all-facts', 'no-price', 'scored-few-facts']);
  });

  it('filters by subject, including sub-subjects, and lets the reason for learning rank without hiding', () => {
    const courses = [
      course({ slug: 'react', categorySlug: 'programming', categoryName: 'תכנות', categoryParentSlug: 'technology', courseType: 'career' }),
      course({ slug: 'python', categorySlug: 'ai', categoryName: 'בינה מלאכותית', categoryParentSlug: 'technology', courseType: 'career' }),
      course({ slug: 'baking' }),
      course({ slug: 'psycho', categorySlug: 'psychometric', categoryName: 'פסיכומטרי', courseType: 'exam' }),
    ];
    expect(rows(courses, { ...EMPTY_QUERY, cats: ['technology'] })).toEqual([
      ['python', true, 'בינה מלאכותית'],
      ['react', true, 'תכנות'],
    ]);
    expect(rows(courses, { ...EMPTY_QUERY, cats: ['programming'] })).toEqual([['react', true, '']]);
    // "לעבור מבחן" מעלה את הפסיכומטרי לראש, ולא מסתיר את השאר.
    expect(rows(courses, { ...EMPTY_QUERY, why: 'exam' }).map((r) => r[0])).toEqual(['psycho', 'baking', 'python', 'react']);
    expect(rows(courses, { ...EMPTY_QUERY, cats: ['programming'], why: 'fun' })).toEqual([['react', true, '']]);
  });

  it('keeps a course that misses one answer after the full matches, and drops one that misses two', () => {
    const courses = [
      course({ slug: 'evening-class', score: { status: 'scored', value: 9.5 } }),
      course({ slug: 'evening-online', formats: ['online'] }),
      course({ slug: 'morning-class', timeSlots: ['morning'] }),
    ];
    expect(rows(courses, { ...EMPTY_QUERY, when: ['evening'], how: ['online'] })).toEqual([
      ['evening-online', true, 'ערבים, אונליין'],
      ['evening-class', false, 'ערבים, אבל רק בכיתה'],
    ]);
  });

  it('counts a missing price as a miss, and a line without a tick does not filter', () => {
    const courses = [
      course({ slug: 'cheap', sitePrice: 1500 }),
      course({ slug: 'pricey', sitePrice: 9000, score: { status: 'scored', value: 9 } }),
      course({ slug: 'no-price', sitePrice: null }),
    ];
    const budget = { ...EMPTY_QUERY, maxPrice: 2000 };
    expect(rows(courses, budget)).toEqual([
      ['cheap', true, 'בתקציב'],
      ['pricey', false, 'מעל התקציב'],
      ['no-price', false, 'בלי מחיר באתר'],
    ]);
    expect(rows(courses, { ...budget, off: ['budget'] })).toEqual([
      ['pricey', true, ''],
      ['cheap', true, ''],
      ['no-price', true, ''],
    ]);
  });

  it('finds a hybrid course for a classroom and for online, and a recorded one only for online', () => {
    const courses = [course({ slug: 'hybrid', formats: ['hybrid'] }), course({ slug: 'recorded', formats: ['recorded'] })];
    expect(rows(courses, { ...EMPTY_QUERY, how: ['in_person'] })).toEqual([
      ['hybrid', true, 'בכיתה'],
      ['recorded', false, 'רק מוקלט'],
    ]);
    expect(rows(courses, { ...EMPTY_QUERY, how: ['online'] })).toEqual([
      ['hybrid', true, 'אונליין'],
      ['recorded', true, 'אונליין'],
    ]);
  });
});

describe('closestToScore', () => {
  it('lists the courses with the fewest reviews missing, then by graduates and slug', () => {
    const courses = [
      course({ slug: 'scored', score: { status: 'scored', value: 8 } }),
      course({ slug: 'needs-5', score: { status: 'not_enough_reviews', reviewsNeeded: 5 } }),
      course({ slug: 'b-needs-2', score: { status: 'not_enough_reviews', reviewsNeeded: 2 }, verifiedCount: 3 }),
      course({ slug: 'a-needs-2', score: { status: 'not_enough_reviews', reviewsNeeded: 2 }, verifiedCount: 3 }),
      course({ slug: 'needs-1', score: { status: 'not_enough_reviews', reviewsNeeded: 1 }, verifiedCount: 4 }),
      course({ slug: 'no-score-row' }),
    ];
    expect(closestToScore(courses, 3).map((c) => c.slug)).toEqual(['needs-1', 'a-needs-2', 'b-needs-2']);
  });

  it('leaves out courses that no counted review has started, so a launch with no reviews lists nothing', () => {
    const courses = [
      course({ slug: 'a-none-yet', score: { status: 'not_enough_reviews', reviewsNeeded: 5 } }),
      course({ slug: 'b-old-reviews-only', score: { status: 'not_enough_reviews', reviewsNeeded: 5 }, verifiedCount: 2 }),
      course({ slug: 'needs-4', score: { status: 'not_enough_reviews', reviewsNeeded: 4 }, verifiedCount: 1 }),
    ];
    expect(closestToScore(courses, 3).map((c) => c.slug)).toEqual(['needs-4']);
    expect(closestToScore(courses.slice(0, 2), 3)).toEqual([]);
  });
});
