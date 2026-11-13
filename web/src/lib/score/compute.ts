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
import type { MetricKey, MetricMeans, MetricResult, ReviewForScore, ScoreInput, ScoreResult } from './types';

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
const round1 = (x: number) => Math.round(x * 10) / 10;

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

  const prior = input.categoryReviewCount >= CATEGORY_PRIOR_MIN_REVIEWS ? input.categoryPrior : input.typePrior;
  const perMetric = metricResults(reviews);

  let weighted = 0;
  let weightSum = 0;
  for (const [key, weight] of Object.entries(WEIGHTS[input.courseType]) as [MetricKey, number][]) {
    const result = perMetric[key];
    const n = result?.n ?? 0;
    if (key === 'outcome_3m' && n < MIN_OUTCOME_ANSWERS) continue;
    const priorMean = prior[key] ?? NEUTRAL_MEAN;
    const shrunk = (n * (result?.mean ?? 0) + PRIOR_WEIGHT * priorMean) / (n + PRIOR_WEIGHT);
    weighted += weight * toTen(shrunk);
    weightSum += weight;
  }

  const recommend = perMetric.recommend;
  const recommendPct = recommend
    ? Math.round((reviews.filter((r) => r.answers.recommend === 5).length / recommend.n) * 100)
    : null;

  const newest = Math.max(...reviews.map((r) => r.publishedAt.getTime()));
  const stale = newest < monthsBefore(input.now, STALE_MONTHS).getTime();

  return {
    status: 'scored',
    value: round1(weighted / weightSum),
    reviewCount: reviews.length,
    recommendPct,
    perMetric,
    stale,
    methodVersion: METHOD_VERSION,
  };
}
