import { MIN_OUTCOME_ANSWERS } from '@/lib/score/constants';
import type { CourseType, MetricKey } from '@/lib/score/types';
import type { Highlight, WhyKey } from './types';

export interface WhyOption {
  key: WhyKey;
  label: string;
  /** מה שמודפס לפני התשובה. "בשביל הכיף" עומד לבד, כי "כדי בשביל הכיף" לא עברית. */
  prefix: 'כדי' | '';
  courseType: CourseType;
}

/** התשובות לשורה "למה?", והסוג שכל אחת קובעת. מסמך העיצוב של סבב 2, סעיף 3. */
export const WHY_OPTIONS: readonly WhyOption[] = [
  { key: 'switch', label: 'להחליף מקצוע', prefix: 'כדי', courseType: 'career' },
  { key: 'advance', label: 'להתקדם בעבודה', prefix: 'כדי', courseType: 'career' },
  { key: 'certificate', label: 'לקבל תעודה מקצועית', prefix: 'כדי', courseType: 'exam' },
  { key: 'exam', label: 'לעבור מבחן', prefix: 'כדי', courseType: 'exam' },
  { key: 'fun', label: 'בשביל הכיף', prefix: '', courseType: 'hobby' },
];

export const COURSE_TYPE_LABEL: Record<CourseType, string> = {
  career: 'קריירה',
  exam: 'מבחן ותעודה',
  hobby: 'תחביב',
};

export function whyOption(key: WhyKey): WhyOption {
  const option = WHY_OPTIONS.find((o) => o.key === key);
  if (!option) throw new Error(`Unknown why answer: ${key}`);
  return option;
}

export function courseTypeForWhy(key: WhyKey): CourseType {
  return whyOption(key).courseType;
}

/** השאלה מהשאלון שמודגשת בשורת התוצאה, לפי סוג הקורס. */
const HIGHLIGHT_METRIC: Record<CourseType, MetricKey> = {
  career: 'outcome_3m',
  exam: 'passed_exam',
  hobby: 'skill_gained',
};

const HIGHLIGHT_LABEL: Record<CourseType, string> = {
  career: 'אחרי 3 חודשים',
  exam: 'עברו את המבחן',
  hobby: 'מה למדו בפועל',
};

/**
 * העובדה המודגשת בשורת התוצאה, מתוך הממוצעים שנשמרו עם הציון.
 * null כשענו פחות מ-MIN_OUTCOME_ANSWERS בוגרים: אותו סף כמו בעמוד הקורס.
 */
export function highlightFor(
  type: CourseType,
  perMetric: Partial<Record<MetricKey, { mean: number; n: number }>>,
): Highlight | null {
  const metric = perMetric[HIGHLIGHT_METRIC[type]];
  if (!metric || !Number.isFinite(metric.mean) || !Number.isFinite(metric.n) || metric.n < MIN_OUTCOME_ANSWERS) {
    return null;
  }
  const label = HIGHLIGHT_LABEL[type];
  if (type === 'career') return { label, text: `${metric.mean.toFixed(1)} מתוך 5, לפי ${metric.n} בוגרים` };
  // בשאלות כן או לא, "כן" נשמר כ-5 ו"לא" כ-1. לכן הממוצע הופך לאחוז ה"כן".
  const pct = Math.round(((metric.mean - 1) / 4) * 100);
  if (type === 'exam') return { label, text: `${pct}% מתוך ${metric.n} בוגרים` };
  return { label, text: `${pct}% אומרים שרכשו את המיומנות (${metric.n} בוגרים)` };
}
