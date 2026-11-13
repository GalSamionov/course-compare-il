import {
  COURSE_FORMATS,
  EMPTY_QUERY,
  FORMAT_LABEL,
  LINE_KEYS,
  TIME_SLOTS,
  TIME_SLOT_LABEL,
  type CourseFormat,
  type LineKey,
  type SearchQuery,
  type TimeSlot,
  type Understanding,
  type WhyKey,
} from './types';
import { WHY_OPTIONS } from './why';

/** אורך מקסימלי לשורה 1, גם בכתובת וגם בנתיב ההבנה. */
export const MAX_Q_LENGTH = 120;

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const WHY_KEYS: readonly string[] = WHY_OPTIONS.map((o) => o.key);

/** URLSearchParams, או ReadonlyURLSearchParams של Next. */
interface ParamSource {
  get(name: string): string | null;
}

/** רשימה מהכתובת, רק עם ערכים מוכרים, בסדר הקבוע של הרשימה. בלי המפתח: הערך הממולא מראש. */
function listFrom<T extends string>(raw: string | null, allowed: readonly T[], fallback: readonly T[]): T[] {
  if (raw === null) return [...fallback];
  const given = new Set(raw.split(',').map((s) => s.trim()));
  return allowed.filter((value) => given.has(value));
}

/** מספר שלם וחיובי. פסיקים, רווחים ו-₪ מותרים. כל השאר: null. */
export function parsePrice(raw: string): number | null {
  const digits = raw.replace(/[,\s₪]/g, '');
  if (!/^\d{1,7}$/.test(digits)) return null;
  const value = Number(digits);
  return value > 0 ? value : null;
}

/** התשובות מהכתובת. מפתח שחסר בכתובת לוקח את הערך הממולא מראש (base). */
export function parseQuery(params: ParamSource, base: SearchQuery = EMPTY_QUERY): SearchQuery {
  const q = params.get('q');
  const cat = params.get('cat');
  const why = params.get('why');
  const max = params.get('max');
  return {
    q: q === null ? base.q : q.trim().slice(0, MAX_Q_LENGTH),
    cats:
      cat === null
        ? [...base.cats]
        : [...new Set(cat.split(',').map((s) => s.trim()).filter((s) => SLUG.test(s)))].slice(0, 5),
    why: why === null ? base.why : WHY_KEYS.includes(why) ? (why as WhyKey) : null,
    when: listFrom(params.get('when'), TIME_SLOTS, base.when),
    how: listFrom(params.get('how'), COURSE_FORMATS, base.how),
    maxPrice: max === null ? base.maxPrice : parsePrice(max),
    off: listFrom(params.get('off'), LINE_KEYS, base.off),
  };
}

/** התשובות לכתובת, בלי '?'. ערך ששווה לממולא מראש לא נכתב. */
export function serializeQuery(query: SearchQuery, base: SearchQuery = EMPTY_QUERY): string {
  const params = new URLSearchParams();
  const put = (key: string, value: string, baseValue: string) => {
    if (value !== baseValue) params.set(key, value);
  };
  put('q', query.q, base.q);
  put('cat', query.cats.join(','), base.cats.join(','));
  put('why', query.why ?? '', base.why ?? '');
  put('when', query.when.join(','), base.when.join(','));
  put('how', query.how.join(','), base.how.join(','));
  put('max', query.maxPrice === null ? '' : String(query.maxPrice), base.maxPrice === null ? '' : String(base.maxPrice));
  put('off', query.off.join(','), base.off.join(','));
  return params.toString();
}

/** יש תשובה שיכולה לסנן. מילים בשורה 1 בלי תחום שהבנו לא מסננות. */
export function hasAnswer(query: SearchQuery, line: LineKey): boolean {
  switch (line) {
    case 'what':
      return query.cats.length > 0;
    case 'why':
      return query.why !== null;
    case 'whenhow':
      return query.when.length > 0 || query.how.length > 0;
    case 'budget':
      return query.maxPrice !== null;
  }
}

/** השורות שמסננות עכשיו: יש בהן תשובה, והווי שלהן לא הוסר. */
export function activeLines(query: SearchQuery): LineKey[] {
  return LINE_KEYS.filter((line) => hasAnswer(query, line) && !query.off.includes(line));
}

/** מוריד או מחזיר את הווי של שורה. */
export function toggleLine(query: SearchQuery, line: LineKey): SearchQuery {
  return {
    ...query,
    off: query.off.includes(line) ? query.off.filter((l) => l !== line) : [...query.off, line],
  };
}

/** מוסיף או מוריד ערך מרשימה, ושומר על הסדר הקבוע. */
export function toggleIn<T extends string>(list: readonly T[], value: T, order: readonly T[]): T[] {
  const has = list.includes(value);
  return order.filter((v) => (v === value ? !has : list.includes(v)));
}

/**
 * מכניס את מה שהבנו מהמילים לתשובות.
 * "מתי ואיך" מתמלאת רק כשהיא ריקה: שורה שהמבקר כבר ענה עליה לא נדרסת.
 */
export function applyUnderstanding(current: SearchQuery, text: string, found: Understanding): SearchQuery {
  // המבקר כבר כתב משהו אחר בזמן שחיכינו. התשובה הזאת כבר לא רלוונטית.
  if (current.q !== text) return current;
  const answered = current.when.length > 0 || current.how.length > 0;
  return {
    ...current,
    cats: found.categories,
    when: answered ? current.when : found.when,
    how: answered ? current.how : found.how,
    off: current.off.filter((line) => line !== 'what'),
  };
}

/**
 * המילים של שורה 3, והאות שלפניהן.
 * ב׳ נכתבת רק לפני זמן ("בערבים"). "אונליין" לא מקבלת ב׳, ו"בכיתה" כבר מתחילה בה.
 */
export function whenHowWords(
  when: readonly TimeSlot[],
  how: readonly CourseFormat[],
): { prefix: 'ב' | ''; words: string[] } {
  const words = [
    ...TIME_SLOTS.filter((t) => when.includes(t)).map((t) => TIME_SLOT_LABEL[t]),
    ...COURSE_FORMATS.filter((f) => how.includes(f)).map((f) => FORMAT_LABEL[f]),
  ];
  return { prefix: when.length > 0 ? 'ב' : '', words };
}
