/** בהשוואה יש שלושה מקומות בדיוק. גם המסד לא מאפשר יותר (compare_items.position בין 1 ל-3). */
export const MAX_COMPARE = 3;

/** קורס בהשוואה, והמקום שלו (1 עד 3). מקום שהתפנה נשאר ריק עד שמוסיפים קורס. */
export interface CompareSlot {
  courseId: string;
  position: number;
}

/** התשובות מדף הבית, באותה צורה כמו בכתובת: { cat: 'cooking', when: 'evening' }. */
export type AnswerParams = Record<string, string>;

/**
 * מה שמבקר שלא התחבר שומר בדפדפן (localStorage): ההשוואה, וקורס או תשובות שביקש לשמור
 * רגע לפני שנשלח להתחבר. כשהוא מתחבר, הכול עובר לחשבון ונמחק מהדפדפן.
 */
export interface LocalLists {
  compare: string[];
  save: string | null;
  answers: AnswerParams | null;
}

export const EMPTY_LOCAL: LocalLists = { compare: [], save: null, answers: null };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const isCourseId = (value: unknown): value is string => typeof value === 'string' && UUID.test(value);

/** תשובות ממקור שלא כתבנו (הדפדפן או המסד): רק מחרוזות. parseQuery מסנן אחר כך כל ערך לא מוכר. */
export function toAnswerParams(value: unknown): AnswerParams | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const params: AnswerParams = {};
  for (const [key, item] of Object.entries(value)) if (typeof item === 'string') params[key] = item;
  return params;
}

/** מה ששמור בדפדפן. תוכן שגוי או ישן לא שובר את האתר: מה שלא מתאים נזרק. */
export function parseLocal(raw: string | null): LocalLists {
  if (!raw) return EMPTY_LOCAL;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return EMPTY_LOCAL;
  }
  if (typeof data !== 'object' || data === null) return EMPTY_LOCAL;
  const { compare, save, answers } = data as Record<string, unknown>;
  return {
    compare: Array.isArray(compare) ? [...new Set(compare.filter(isCourseId))].slice(0, MAX_COMPARE) : [],
    save: isCourseId(save) ? save : null,
    answers: toAnswerParams(answers),
  };
}

/** המקום הפנוי הראשון בהשוואה, או null כשהיא מלאה. */
export function firstFreePosition(slots: readonly CompareSlot[]): number | null {
  for (let position = 1; position <= MAX_COMPARE; position++) {
    if (!slots.some((slot) => slot.position === position)) return position;
  }
  return null;
}

/**
 * מה להוסיף לחשבון כשמבקר מתחבר.
 * - כל קורס מההשוואה שבדפדפן נשמר, כי קורס בהשוואה תמיד שמור (המפתח הזר ב-compare_items).
 * - הקורס שביקש לשמור לפני ההתחברות נשמר גם הוא.
 * - ההשוואה שבחשבון לא זזה. קורסים מהדפדפן נכנסים למקומות הפנויים, לפי הסדר.
 *   מה שלא נכנס נשאר בשמורים, ואפשר להחליף אותו באזור האישי.
 */
export function mergeIntoAccount(
  account: { saved: readonly string[]; compare: readonly CompareSlot[] },
  local: LocalLists,
): { save: string[]; compare: CompareSlot[] } {
  const wanted = local.save ? [...local.compare, local.save] : local.compare;
  const save = [...new Set(wanted)].filter((id) => !account.saved.includes(id));
  const taken = [...account.compare];
  const compare: CompareSlot[] = [];
  for (const courseId of local.compare) {
    if (taken.some((slot) => slot.courseId === courseId)) continue;
    const position = firstFreePosition(taken);
    if (position === null) break;
    taken.push({ courseId, position });
    compare.push({ courseId, position });
  }
  return { save, compare };
}
