import { courseFacts, type FactKey, type FactSource } from './facts';

/** כמה שאלות לכל קורס, לכל היותר. */
export const MAX_QUESTIONS = 3;

/** השאלות, במילים של מסמך העיצוב (2026-11-17). הסדר כאן הוא הסדר שבו הן מוצגות. */
export const QUESTIONS = {
  price: 'כמה עולה הקורס, כולל כל התשלומים? אפשר לקבל את זה בכתב?',
  duration: 'כמה שעות לימוד יש בפועל, וכמה מהן תרגול?',
  place: 'איפה הלימודים, ומה קורה אם מפספסים מפגש?',
  cohort: 'מתי המחזור הבא, ומה התנאים לביטול?',
  /** מהמדריך לדגלים אדומים. שאלה קבועה, כשיש מקום. */
  graduates: 'אפשר לדבר עם שני בוגרים מהמחזור הקודם?',
} as const;

/**
 * "מה לשאול לפני שמשלמים": עד שלוש שאלות, לפי כללים קבועים בקוד ובלי מודל, כדי שלא יומצא כלום.
 * מחיר לא מפורסם, משך לא ידוע, מיקום או מתכונת לא ידועים, ואין מחזור הבא. אחריהן, כשנשאר מקום, השאלה על בוגרים.
 * "ידוע" כאן הוא בדיוק מה ש"העובדות" מראות (facts.ts), ולכן שאלה אף פעם לא שואלת על משהו שכתוב בתיבה.
 */
export function askBeforePaying(c: FactSource): string[] {
  const known = new Set<FactKey>(courseFacts(c).flatMap((f) => (f.known ? [f.key] : [])));
  const questions: string[] = [];
  if (!known.has('price')) questions.push(QUESTIONS.price);
  if (!known.has('duration')) questions.push(QUESTIONS.duration);
  if (!known.has('location') || !known.has('format')) questions.push(QUESTIONS.place);
  if (!known.has('nextCohort')) questions.push(QUESTIONS.cohort);
  questions.push(QUESTIONS.graduates);
  return questions.slice(0, MAX_QUESTIONS);
}
