import {
  CATEGORY_PRIOR_MIN_REVIEWS,
  METHOD_VERSION,
  MIN_OUTCOME_ANSWERS,
  MIN_REVIEWS,
  NEUTRAL_MEAN,
  PRIOR_WEIGHT,
  STALE_MONTHS,
  WEIGHTS,
  WINDOW_MONTHS,
} from './constants';
import type {
  MetricBreakdown,
  MetricKey,
  MetricMeans,
  MetricResult,
  ReviewForScore,
  ScoredMetricKey,
  ScoreInput,
  ScoreResult,
} from './types';

export function monthsBefore(date: Date, months: number): Date {
  const d = new Date(date.getTime());
  d.setUTCMonth(d.getUTCMonth() - months);
  return d;
}

/** ביקורות שנספרות: לא הוצאו מהציון, ופורסמו ב-24 החודשים האחרונים. */
export function eligibleReviews(reviews: ReviewForScore[], now: Date): ReviewForScore[] {
  const cutoff = monthsBefore(now, WINDOW_MONTHS);
  return reviews.filter((r) => !r.excluded && r.publishedAt >= cutoff);
}

export function metricResults(reviews: ReviewForScore[]): Partial<Record<MetricKey, MetricResult>> {
  const sums = new Map<MetricKey, { total: number; n: number }>();
  for (const review of reviews) {
    for (const [key, value] of Object.entries(review.answers) as [MetricKey, number][]) {
      const s = sums.get(key) ?? { total: 0, n: 0 };
      s.total += value;
      s.n += 1;
      sums.set(key, s);
    }
  }
  const result: Partial<Record<MetricKey, MetricResult>> = {};
  for (const [key, s] of sums) result[key] = { mean: s.total / s.n, n: s.n };
  return result;
}

export function metricMeans(reviews: ReviewForScore[]): MetricMeans {
  const means: MetricMeans = {};
  for (const [key, r] of Object.entries(metricResults(reviews)) as [MetricKey, MetricResult][]) {
    means[key] = r.mean;
  }
  return means;
}

const toTen = (mean: number) => ((mean - 1) / 4) * 10;
/** עיגול לספרה אחת. האפסילון מונע מ-5.95, שמחושב כ-5.9499999, להתעגל ל-5.9. */
const round1 = (x: number) => Math.round(x * 10 + 1e-9) / 10;

export function computeGraduateScore(input: ScoreInput): ScoreResult {
  const reviews = eligibleReviews(input.reviews, input.now);
  if (reviews.length < MIN_REVIEWS) {
    return {
      status: 'not_enough_reviews',
      reviewCount: reviews.length,
      reviewsNeeded: MIN_REVIEWS - reviews.length,
      methodVersion: METHOD_VERSION,
    };
  }

  const useCategory = input.categoryReviewCount >= CATEGORY_PRIOR_MIN_REVIEWS;
  const priorFor = (key: ScoredMetricKey) =>
    (useCategory ? input.categoryPrior[key] : undefined) ?? input.typePrior[key] ?? NEUTRAL_MEAN;
  const perMetric = metricResults(reviews);

  // שאלה שאף בוגר לא ענה עליה, או שאלת התוצאה עם פחות מ-3 תשובות, לא נכנסת לציון,
  // והמשקל שלה מתחלק בין שאר השאלות.
  const counted: { key: ScoredMetricKey; weight: number; result: MetricResult }[] = [];
  for (const [key, weight] of Object.entries(WEIGHTS[input.courseType]) as [ScoredMetricKey, number][]) {
    const result = perMetric[key];
    if (!result) continue;
    if (key === 'outcome_3m' && result.n < MIN_OUTCOME_ANSWERS) continue;
    counted.push({ key, weight, result });
  }
  const weightSum = counted.reduce((sum, c) => sum + c.weight, 0);
  if (weightSum === 0) {
    throw new Error('No scored metric has answers. Check review_answers for this course.');
  }

  const breakdown: Partial<Record<ScoredMetricKey, MetricBreakdown>> = {};
  let value = 0;
  for (const { key, weight, result } of counted) {
    const prior = priorFor(key);
    const shrunk = (result.n * result.mean + PRIOR_WEIGHT * prior) / (result.n + PRIOR_WEIGHT);
    const score10 = toTen(shrunk);
    const effectiveWeight = weight / weightSum;
    breakdown[key] = { mean: result.mean, n: result.n, prior, shrunk, score10, weight: effectiveWeight };
    value += effectiveWeight * score10;
  }

  const recommend = perMetric.recommend;
  const recommendPct = recommend
    ? Math.round((reviews.filter((r) => r.answers.recommend === 5).length / recommend.n) * 100)
    : null;

  const newest = Math.max(...reviews.map((r) => r.publishedAt.getTime()));
  const stale = newest < monthsBefore(input.now, STALE_MONTHS).getTime();

  return {
    status: 'scored',
    value: round1(value),
    reviewCount: reviews.length,
    recommendPct,
    perMetric,
    priorSource: useCategory ? 'category' : 'type',
    breakdown,
    stale,
    methodVersion: METHOD_VERSION,
  };
}
