export type CourseType = 'career' | 'hobby' | 'exam';

export type MetricKey =
  | 'teaching'
  | 'hands_on'
  | 'up_to_date'
  | 'value'
  | 'outcome_3m'
  | 'skill_gained'
  | 'passed_exam'
  | 'recommend';

/** תשובות בסולם 1 עד 5. בשאלות כן או לא: כן = 5, לא = 1. */
export interface ReviewForScore {
  publishedAt: Date;
  excluded: boolean;
  answers: Partial<Record<MetricKey, number>>;
}

export type MetricMeans = Partial<Record<MetricKey, number>>;

export interface MetricResult {
  mean: number;
  n: number;
}

export interface ScoreInput {
  courseType: CourseType;
  reviews: ReviewForScore[];
  categoryPrior: MetricMeans;
  categoryReviewCount: number;
  typePrior: MetricMeans;
  now: Date;
}

export type ScoreResult =
  | {
      status: 'not_enough_reviews';
      reviewCount: number;
      reviewsNeeded: number;
      methodVersion: string;
    }
  | {
      status: 'scored';
      value: number;
      reviewCount: number;
      recommendPct: number | null;
      perMetric: Partial<Record<MetricKey, MetricResult>>;
      stale: boolean;
      methodVersion: string;
    };
