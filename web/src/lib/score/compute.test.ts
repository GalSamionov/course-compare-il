import { describe, expect, it } from 'vitest';
import { computeGraduateScore } from './compute';
import type { MetricKey, MetricMeans, ReviewForScore, ScoreInput } from './types';

const now = new Date('2026-11-13T00:00:00Z');
const daysAgo = (days: number) => new Date(now.getTime() - days * 86_400_000);

function review(
  answers: Partial<Record<MetricKey, number>>,
  opts: { daysAgo?: number; excluded?: boolean } = {},
): ReviewForScore {
  return { publishedAt: daysAgo(opts.daysAgo ?? 10), excluded: opts.excluded ?? false, answers };
}

const flatPrior: MetricMeans = {
  teaching: 3, hands_on: 3, up_to_date: 3, value: 3, outcome_3m: 3, skill_gained: 3, passed_exam: 3,
};
const perfectCareer = { teaching: 5, hands_on: 5, up_to_date: 5, value: 5, outcome_3m: 5, recommend: 5 };

function input(reviews: ReviewForScore[], overrides: Partial<ScoreInput> = {}): ScoreInput {
  return {
    courseType: 'career',
    reviews,
    categoryPrior: flatPrior,
    categoryReviewCount: 100,
    typePrior: flatPrior,
    now,
    ...overrides,
  };
}

const times = <T>(n: number, make: (i: number) => T): T[] => Array.from({ length: n }, (_, i) => make(i));

describe('computeGraduateScore', () => {
  it('returns not_enough_reviews below five reviews', () => {
    const result = computeGraduateScore(input(times(4, () => review(perfectCareer))));
    expect(result).toEqual({
      status: 'not_enough_reviews',
      reviewCount: 4,
      reviewsNeeded: 1,
      methodVersion: '2026-11-13.1',
    });
  });

  it('pulls five perfect reviews toward the prior', () => {
    // כל שאלה: (5×5 + 5×3) / 10 = 4, ובסולם 10: 7.5
    const result = computeGraduateScore(input(times(5, () => review(perfectCareer))));
    expect(result.status).toBe('scored');
    if (result.status !== 'scored') return;
    expect(result.value).toBe(7.5);
    expect(result.reviewCount).toBe(5);
    expect(result.recommendPct).toBe(100);
  });

  it('ignores excluded reviews and reviews older than 24 months', () => {
    const reviews = [
      ...times(5, () => review(perfectCareer)),
      review({ ...perfectCareer, teaching: 1 }, { excluded: true }),
      review({ ...perfectCareer, teaching: 1 }, { daysAgo: 800 }),
    ];
    const result = computeGraduateScore(input(reviews));
    if (result.status !== 'scored') throw new Error('expected scored');
    expect(result.reviewCount).toBe(5);
    expect(result.value).toBe(7.5);
  });

  it('drops the outcome metric when fewer than three graduates answered it', () => {
    // הוראה ועשייה: 7.5. עדכניות וערך: (5×1 + 5×3) / 10 = 2, ובסולם 10: 2.5
    // (0.25×7.5 + 0.25×7.5 + 0.15×2.5 + 0.15×2.5) / 0.8 = 5.625, מעוגל ל-5.6
    const base = { teaching: 5, hands_on: 5, up_to_date: 1, value: 1 };
    const reviews = [
      review({ ...base, outcome_3m: 1 }),
      review({ ...base, outcome_3m: 1 }),
      ...times(3, () => review(base)),
    ];
    const result = computeGraduateScore(input(reviews));
    if (result.status !== 'scored') throw new Error('expected scored');
    expect(result.value).toBe(5.6);
  });

  it('uses the category prior only when the category has at least 30 reviews', () => {
    const reviews = times(5, () => review(perfectCareer));
    const highPrior: MetricMeans = { teaching: 5, hands_on: 5, up_to_date: 5, value: 5, outcome_3m: 5 };
    const lowPrior: MetricMeans = { teaching: 1, hands_on: 1, up_to_date: 1, value: 1, outcome_3m: 1 };

    const thin = computeGraduateScore(
      input(reviews, { categoryPrior: highPrior, typePrior: lowPrior, categoryReviewCount: 29 }),
    );
    const rich = computeGraduateScore(
      input(reviews, { categoryPrior: highPrior, typePrior: lowPrior, categoryReviewCount: 30 }),
    );
    if (thin.status !== 'scored' || rich.status !== 'scored') throw new Error('expected scored');
    expect(thin.value).toBe(5); // (25 + 5) / 10 = 3, ובסולם 10: 5
    expect(rich.value).toBe(10);
  });

  it('scores hobby courses with yes/no answers mapped to 5 and 1', () => {
    // מיומנות: ממוצע 4.2, ואחרי משיכה לממוצע 3.6, ובסולם 10: 6.5. הוראה וערך: 7.5
    // 0.4×6.5 + 0.35×7.5 + 0.25×7.5 = 7.1
    const yes = { skill_gained: 5, teaching: 5, value: 5 };
    const reviews = [...times(4, () => review(yes)), review({ ...yes, skill_gained: 1 })];
    const result = computeGraduateScore(input(reviews, { courseType: 'hobby' }));
    if (result.status !== 'scored') throw new Error('expected scored');
    expect(result.value).toBe(7.1);
  });

  it('computes the share of graduates who recommend the course', () => {
    const reviews = [...times(4, () => review(perfectCareer)), review({ ...perfectCareer, recommend: 1 })];
    const result = computeGraduateScore(input(reviews));
    if (result.status !== 'scored') throw new Error('expected scored');
    expect(result.recommendPct).toBe(80);
  });

  it('marks the score stale when the newest review is older than 12 months', () => {
    const old = computeGraduateScore(input(times(5, () => review(perfectCareer, { daysAgo: 400 }))));
    const fresh = computeGraduateScore(input(times(5, () => review(perfectCareer, { daysAgo: 10 }))));
    if (old.status !== 'scored' || fresh.status !== 'scored') throw new Error('expected scored');
    expect(old.stale).toBe(true);
    expect(fresh.stale).toBe(false);
  });
});
