import { describe, expect, it } from 'vitest';
import { METHOD_VERSION, WEIGHTS } from './constants';
import { computeGraduateScore, metricResults, monthsBefore, yesCount } from './compute';
import type { MetricKey, MetricMeans, ReviewForScore, ScoreInput } from './types';

const now = new Date('2026-11-13T00:00:00Z');
const DAY = 86_400_000;
const daysAgo = (days: number) => new Date(now.getTime() - days * DAY);

function review(
  answers: Partial<Record<MetricKey, number>>,
  opts: { daysAgo?: number; excluded?: boolean; at?: Date } = {},
): ReviewForScore {
  return { publishedAt: opts.at ?? daysAgo(opts.daysAgo ?? 10), excluded: opts.excluded ?? false, answers };
}

const flatPrior: MetricMeans = {
  teaching: 3, hands_on: 3, up_to_date: 3, value: 3, outcome_3m: 3, skill_gained: 3, passed_exam: 3,
};
const careerNoRecommend = { teaching: 5, hands_on: 5, up_to_date: 5, value: 5, outcome_3m: 5 };
const perfectCareer = { ...careerNoRecommend, recommend: 5 };

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

function scored(i: ScoreInput) {
  const result = computeGraduateScore(i);
  if (result.status !== 'scored') throw new Error('expected scored');
  return result;
}

describe('computeGraduateScore', () => {
  it('returns not_enough_reviews below five reviews', () => {
    expect(computeGraduateScore(input(times(4, () => review(perfectCareer))))).toEqual({
      status: 'not_enough_reviews',
      reviewCount: 4,
      reviewsNeeded: 1,
      methodVersion: METHOD_VERSION,
    });
  });

  it('pulls five perfect reviews toward the prior', () => {
    // כל שאלה: (5×5 + 5×3) / 10 = 4, ובסולם 10: 7.5
    const result = scored(input(times(5, () => review(perfectCareer))));
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
    const result = scored(input(reviews));
    expect(result.reviewCount).toBe(5);
    expect(result.value).toBe(7.5);
  });

  it('counts a review published exactly 24 months ago, but not one a day earlier', () => {
    const cutoff = monthsBefore(now, 24);
    const recent = times(4, () => review(perfectCareer));
    expect(computeGraduateScore(input([...recent, review(perfectCareer, { at: cutoff })])).status).toBe('scored');
    expect(
      computeGraduateScore(input([...recent, review(perfectCareer, { at: new Date(cutoff.getTime() - DAY) })])).status,
    ).toBe('not_enough_reviews');
  });

  it('drops the outcome metric when fewer than three graduates answered it', () => {
    // הוראה ועשייה: 7.5. עדכניות וערך: (5×1 + 5×3) / 10 = 2, ובסולם 10: 2.5
    // (0.25×7.5 + 0.25×7.5 + 0.15×2.5 + 0.15×2.5) / 0.8 = 5.625, מעוגל ל-5.6
    const base = { teaching: 5, hands_on: 5, up_to_date: 1, value: 1 };
    const reviews = [review({ ...base, outcome_3m: 1 }), review({ ...base, outcome_3m: 1 }), ...times(3, () => review(base))];
    expect(scored(input(reviews)).value).toBe(5.6);
  });

  it('counts the outcome metric once exactly three graduates answered it', () => {
    // תוצאה: (3×1 + 5×3) / 8 = 2.25, ובסולם 10: 3.125. שאר השאלות: 7.5
    // 0.8×7.5 + 0.2×3.125 = 6.625, מעוגל ל-6.6 (בלי שאלת התוצאה היה יוצא 7.5)
    const base = { teaching: 5, hands_on: 5, up_to_date: 5, value: 5 };
    const reviews = [...times(3, () => review({ ...base, outcome_3m: 1 })), ...times(2, () => review(base))];
    expect(scored(input(reviews)).value).toBe(6.6);
  });

  it('drops a weighted metric nobody answered and redistributes its weight', () => {
    // בלי עדכניות: כל שאר השאלות 7.5, ולכן 7.5. אם הייתה נכנסת עם הממוצע (3, כלומר 5.0), היה יוצא 7.1.
    const { up_to_date: _skip, ...noUpToDate } = careerNoRecommend;
    void _skip;
    const result = scored(input(times(5, () => review(noUpToDate))));
    expect(result.value).toBe(7.5);
    expect(result.breakdown.up_to_date).toBeUndefined();
    const total = Object.values(result.breakdown).reduce((sum, b) => sum + (b?.weight ?? 0), 0);
    expect(total).toBeCloseTo(1, 10);
  });

  it('uses the category prior only when the category has at least 30 reviews', () => {
    const reviews = times(5, () => review(perfectCareer));
    const highPrior: MetricMeans = { teaching: 5, hands_on: 5, up_to_date: 5, value: 5, outcome_3m: 5 };
    const lowPrior: MetricMeans = { teaching: 1, hands_on: 1, up_to_date: 1, value: 1, outcome_3m: 1 };
    const thin = scored(input(reviews, { categoryPrior: highPrior, typePrior: lowPrior, categoryReviewCount: 29 }));
    const rich = scored(input(reviews, { categoryPrior: highPrior, typePrior: lowPrior, categoryReviewCount: 30 }));
    expect(thin.value).toBe(5); // (25 + 5) / 10 = 3, ובסולם 10: 5
    expect(thin.priorSource).toBe('type');
    expect(rich.value).toBe(10);
    expect(rich.priorSource).toBe('category');
  });

  it('falls back to the type prior for a metric missing from the category prior', () => {
    // הוראה: ממוצע הסוג 1, ולכן (25 + 5) / 10 = 3, ובסולם 10: 5. שאר השאלות: 7.5
    // 0.25×5 + 0.75×7.5 = 6.875, מעוגל ל-6.9 (עם ממוצע ניטרלי של 3 היה יוצא 7.5)
    const categoryPrior: MetricMeans = { hands_on: 3, up_to_date: 3, value: 3, outcome_3m: 3 };
    const typePrior: MetricMeans = { ...flatPrior, teaching: 1 };
    const result = scored(input(times(5, () => review(perfectCareer)), { categoryPrior, typePrior }));
    expect(result.value).toBe(6.9);
  });

  it('scores hobby courses with yes/no answers mapped to 5 and 1', () => {
    // מיומנות: ממוצע 4.2, ואחרי משיכה לממוצע 3.6, ובסולם 10: 6.5. הוראה וערך: 7.5
    // 0.4×6.5 + 0.35×7.5 + 0.25×7.5 = 7.1
    const yes = { skill_gained: 5, teaching: 5, value: 5 };
    const reviews = [...times(4, () => review(yes)), review({ ...yes, skill_gained: 1 })];
    expect(scored(input(reviews, { courseType: 'hobby' })).value).toBe(7.1);
  });

  it('weights exam courses by passing first', () => {
    // מבחן: 7.5, הוראה: (5×1 + 15) / 10 = 2, כלומר 2.5, ערך: 5
    // 0.45×7.5 + 0.30×2.5 + 0.25×5 = 5.375, מעוגל ל-5.4 (משקלות הפוכים היו נותנים 4.6)
    const reviews = times(5, () => review({ passed_exam: 5, teaching: 1, value: 3 }));
    expect(scored(input(reviews, { courseType: 'exam' })).value).toBe(5.4);
  });

  it('has weights that sum to 1 for every course type', () => {
    for (const row of Object.values(WEIGHTS)) {
      const total = Object.values(row).reduce((sum, w) => sum + (w ?? 0), 0);
      expect(total).toBeCloseTo(1, 10);
    }
  });

  it('explains every counted metric', () => {
    const result = scored(input(times(5, () => review(perfectCareer))));
    const teaching = result.breakdown.teaching!;
    expect(teaching.mean).toBe(5);
    expect(teaching.n).toBe(5);
    expect(teaching.prior).toBe(3);
    expect(teaching.shrunk).toBeCloseTo(4, 10);
    expect(teaching.score10).toBeCloseTo(7.5, 10);
    expect(teaching.weight).toBeCloseTo(0.25, 10);
  });

  it('computes the share of graduates who recommend the course', () => {
    const reviews = [...times(4, () => review(perfectCareer)), review({ ...perfectCareer, recommend: 1 })];
    expect(scored(input(reviews)).recommendPct).toBe(80);
  });

  it('computes the recommend share only over graduates who answered it', () => {
    const reviews = [...times(4, () => review(perfectCareer)), review(careerNoRecommend)];
    expect(scored(input(reviews)).recommendPct).toBe(100);
  });

  it('returns a null recommend share when nobody answered it', () => {
    expect(scored(input(times(5, () => review(careerNoRecommend)))).recommendPct).toBeNull();
  });

  it('marks the score stale when the newest review is older than 12 months', () => {
    expect(scored(input(times(5, () => review(perfectCareer, { daysAgo: 400 }))))).toMatchObject({ stale: true });
    expect(scored(input(times(5, () => review(perfectCareer, { daysAgo: 10 }))))).toMatchObject({ stale: false });
  });

  it('is not stale at exactly 12 months, and stale a day later', () => {
    const edge = monthsBefore(now, 12);
    expect(scored(input(times(5, () => review(perfectCareer, { at: edge }))))).toMatchObject({ stale: false });
    expect(
      scored(input(times(5, () => review(perfectCareer, { at: new Date(edge.getTime() - DAY) })))),
    ).toMatchObject({ stale: true });
  });
});

describe('yesCount', () => {
  it('recovers how many answered yes from the stored mean of a yes/no question', () => {
    const answers = [5, 5, 1, 5, 5, 5, 1, 5, 5]; // 7 כן מתוך 9
    const { mean, n } = metricResults(answers.map((v) => review({ passed_exam: v })))['passed_exam']!;
    expect(yesCount(mean, n)).toBe(7);
    expect(yesCount(5, 8)).toBe(8);
  });
});
