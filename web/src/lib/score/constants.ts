import type { CourseType, ScoredMetricKey } from './types';

export const METHOD_VERSION = '2026-11-13.1';
export const MIN_REVIEWS = 5;
export const PRIOR_WEIGHT = 5;
export const WINDOW_MONTHS = 24;
export const STALE_MONTHS = 12;
export const MIN_OUTCOME_ANSWERS = 3;
export const CATEGORY_PRIOR_MIN_REVIEWS = 30;
export const NEUTRAL_MEAN = 3;

/** משקלות לפי סוג קורס. "ממליץ" לא נכנס לציון. */
export const WEIGHTS: Record<CourseType, Partial<Record<ScoredMetricKey, number>>> = {
  career: { teaching: 0.25, hands_on: 0.25, outcome_3m: 0.2, up_to_date: 0.15, value: 0.15 },
  hobby: { skill_gained: 0.4, teaching: 0.35, value: 0.25 },
  exam: { passed_exam: 0.45, teaching: 0.3, value: 0.25 },
};
