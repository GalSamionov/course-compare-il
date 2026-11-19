import { describe, expect, it } from 'vitest';
import { topByGraduates } from './top';
import type { CourseSummary } from './types';

const course = (slug: string, overrides: Partial<CourseSummary> = {}): CourseSummary => ({
  id: slug,
  slug,
  title: slug,
  institutionName: 'מוסד לדוגמה',
  categorySlug: 'cooking',
  categoryName: 'בישול',
  categoryParentSlug: null,
  courseType: 'hobby',
  productType: 'course',
  score: { status: 'none' },
  verifiedCount: 0,
  sitePrice: null,
  totalHours: null,
  durationMonths: null,
  sessionCount: null,
  region: null,
  institutionCity: null,
  certificate: null,
  nextCohortDate: null,
  formats: [],
  timeSlots: [],
  updatedAt: '2026-11-01T00:00:00Z',
  highlight: null,
  ...overrides,
});
const scored = (value: number, verifiedCount: number) => ({ score: { status: 'scored' as const, value }, verifiedCount });

describe('topByGraduates', () => {
  it('ranks only courses with a score, highest first, from the category and its sub-categories', () => {
    const courses = [
      course('baking', scored(9, 8)),
      course('home', { score: { status: 'not_enough_reviews', reviewsNeeded: 5 }, verifiedCount: 40 }),
      course('italian', scored(7.1, 6)),
      course('python', { categorySlug: 'ai', categoryParentSlug: 'technology', ...scored(9.5, 12) }),
      course('fullstack', { categorySlug: 'programming', categoryParentSlug: 'technology', ...scored(7.9, 23) }),
    ];
    expect(topByGraduates(courses, 'cooking').map((c) => c.slug)).toEqual(['baking', 'italian']);
    expect(topByGraduates(courses, 'technology').map((c) => c.slug)).toEqual(['python', 'fullstack']);
    expect(topByGraduates(courses, 'photography')).toEqual([]);
  });

  it('breaks a tie by the number of verified graduates, and keeps at most 3', () => {
    const courses = ['a', 'b', 'c', 'd'].map((slug, i) => course(slug, scored(8, 10 + i)));
    expect(topByGraduates(courses, 'cooking').map((c) => c.slug)).toEqual(['d', 'c', 'b']);
  });
});
