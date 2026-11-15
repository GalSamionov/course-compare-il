import type { Json } from '@/lib/database.types';
import { isUuid } from '@/lib/reviews/types';

/**
 * קורסים חדשים בתור, לפי מוסד (20261116000001_course_queue_bulk.sql). מה "בטוח" נקבע במסד, במקום אחד
 * (private.new_course_queue): קורס בלי שום סיבה. כאן: הקריאה של מה שהמסד מחזיר, המסננים, והמזהים שגל מאשר.
 */

/** הסיבות שבגללן קורס חדש לא בטוח לאישור בבת אחת. אחרי "בגלל": "40 בגלל שדה בביטחון לא גבוה". */
export const CAUSE_LABEL: Record<string, string> = {
  low_confidence: 'שדה בביטחון לא גבוה',
  quote_not_found: 'משפט שלא נמצא בדף',
  cohort_in_past: 'מחזור שכבר עבר',
  cohort_far_future: 'מחזור רחוק מאוד',
  price_out_of_range: 'מחיר לא סביר',
  hours_out_of_range: 'שעות לא סבירות',
  hours_exceed_total: 'יותר שעות מסך השעות',
  duration_out_of_range: 'משך לא סביר',
  bad_date: 'תאריך לא תקין',
  video_url_invalid: 'סרטון לא תקין',
  duplicate_title: 'אותו שם כמו קורס אחר בתור',
  duplicate_url: 'אותו קישור כמו קורס אחר בתור',
  duplicate_existing: 'קורס כזה שכבר באתר',
  not_draft: 'קורס שכבר אינו טיוטה',
};

export const DUPLICATE_CAUSES = ['duplicate_title', 'duplicate_url', 'duplicate_existing'] as const;

/** חשד לכפילות, לשורה ליד פריט אחד בתור. */
export const DUPLICATE_LABEL: Record<string, string> = {
  duplicate_title: 'יש בתור קורס חדש נוסף של המוסד באותו שם.',
  duplicate_url: 'יש בתור קורס חדש נוסף עם אותו קישור.',
  duplicate_existing: 'כבר יש באתר קורס באותו שם של המוסד, או עם אותו קישור.',
};

export const causeLabel = (cause: string) => CAUSE_LABEL[cause] ?? cause;

/** "40 בגלל שדה בביטחון לא גבוה", הנפוצה ראשונה. פריט יכול להופיע ביותר מסיבה אחת. */
export function causeSummary(causes: Record<string, number>): string[] {
  return Object.entries(causes)
    .filter(([, n]) => n > 0)
    .sort(([a, x], [b, y]) => y - x || causeLabel(a).localeCompare(causeLabel(b), 'he'))
    .map(([cause, n]) => `${new Intl.NumberFormat('he-IL').format(n)} בגלל ${causeLabel(cause)}`);
}

export interface NewCourseSample {
  id: number;
  title: string;
  price: number | null;
  url: string | null;
  safe: boolean;
}

export interface NewCourseGroup {
  institutionId: string;
  institutionSlug: string;
  institutionName: string;
  total: number;
  safe: number;
  unsafe: number;
  duplicates: number;
  /** כמה פריטים יש לכל סיבה. */
  causes: Record<string, number>;
  /** מה שגל רואה, ומה שהפעולה תאשר או תדחה. השרת בודק שוב לפני כל החלטה. */
  safeIds: number[];
  allIds: number[];
  samples: NewCourseSample[];
}

/** שורה מ-course_queue_new_course_groups. */
export interface NewCourseGroupRow {
  institution_id: string;
  institution_slug: string;
  institution_name: string;
  total: number;
  safe: number;
  duplicates: number;
  causes: Json;
  safe_ids: number[] | null;
  all_ids: number[] | null;
  samples: Json;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function toSample(value: unknown): NewCourseSample | null {
  if (!isObject(value) || typeof value.id !== 'number' || typeof value.title !== 'string') return null;
  return {
    id: value.id,
    title: value.title,
    price: typeof value.price === 'number' ? value.price : null,
    url: typeof value.url === 'string' && /^https?:\/\//i.test(value.url) ? value.url : null,
    safe: value.safe === true,
  };
}

export function toGroup(row: NewCourseGroupRow): NewCourseGroup {
  const causes = isObject(row.causes)
    ? Object.fromEntries(Object.entries(row.causes).filter((e): e is [string, number] => typeof e[1] === 'number'))
    : {};
  return {
    institutionId: row.institution_id,
    institutionSlug: row.institution_slug,
    institutionName: row.institution_name,
    total: row.total,
    safe: row.safe,
    unsafe: row.total - row.safe,
    duplicates: row.duplicates,
    causes,
    safeIds: row.safe_ids ?? [],
    allIds: row.all_ids ?? [],
    samples: (Array.isArray(row.samples) ? row.samples : []).flatMap((s) => toSample(s) ?? []),
  };
}

/** הסיכום של כל המוסדות, לשורת המסננים. */
export function groupTotals(groups: NewCourseGroup[]): { total: number; safe: number; unsafe: number; duplicates: number } {
  return groups.reduce(
    (sum, g) => ({
      total: sum.total + g.total,
      safe: sum.safe + g.safe,
      unsafe: sum.unsafe + g.unsafe,
      duplicates: sum.duplicates + g.duplicates,
    }),
    { total: 0, safe: 0, unsafe: 0, duplicates: 0 },
  );
}

// ===== המסננים: בכתובת, כדי שקישור מ"לעבור על הלא בטוחים" של מוסד יפתח את הרשימה שלו =====

/** groups: הסיכום לפי מוסד. unsafe ו-duplicates: הפריטים עצמם, אחד אחד, בממשק הרגיל של התור. */
export type NewCourseFilter = 'groups' | 'unsafe' | 'duplicates';

export interface CourseQueueView {
  filter: NewCourseFilter;
  /** רק כשהמסנן הוא רשימה. */
  institutionId: string | null;
}

type SearchParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** ?cq=unsafe|duplicates ו-&inst=<uuid>. כל השאר: הסיכום לפי מוסד. */
export function parseQueueView(params: SearchParams): CourseQueueView {
  const cq = first(params.cq);
  const filter: NewCourseFilter = cq === 'unsafe' || cq === 'duplicates' ? cq : 'groups';
  const inst = first(params.inst);
  return { filter, institutionId: filter !== 'groups' && isUuid(inst) ? inst : null };
}

export function queueHref(view: CourseQueueView): string {
  if (view.filter === 'groups') return '/admin#courses';
  const query = new URLSearchParams({ cq: view.filter });
  if (view.institutionId) query.set('inst', view.institutionId);
  return `/admin?${query}#courses`;
}

// ===== המזהים שגל מאשר או דוחה =====

/** כמה פריטים בכל קריאה למסד. 100 אישורים לוקחים פחות משנייה, והמסד מקבל עד 500. */
export const BULK_BATCH = 100;
/** יותר ממה שיש בפועל במוסד אחד (57 בריצה הראשונה), ופחות ממה שמכביד על טופס. */
export const BULK_MAX = 1000;

/** "12,13,14" מהטופס. null: ריק, לא תקין, או יותר מ-max. בלי כפילויות, בסדר שהגיע. */
export function parseIds(value: FormDataEntryValue | null, max = BULK_MAX): number[] | null {
  if (typeof value !== 'string' || value.trim() === '') return null;
  const parts = value.split(',').map((p) => p.trim());
  if (parts.length > max || parts.some((p) => !/^[1-9]\d{0,14}$/.test(p))) return null;
  return [...new Set(parts.map(Number))];
}

export function batches<T>(items: readonly T[], size: number): T[][] {
  if (!Number.isInteger(size) || size < 1) throw new Error('batch size must be a positive integer');
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/**
 * רק מה שגל ראה ועדיין עומד בתנאי עכשיו (בטוח, או ממתין), ולא שום דבר שנוסף מאז.
 * dropped: כמה מהרשימה של גל כבר לא עומדים בו.
 */
export function stillEligible(posted: readonly number[], current: readonly number[]): { ids: number[]; dropped: number } {
  const now = new Set(current);
  const ids = posted.filter((id) => now.has(id));
  return { ids, dropped: posted.length - ids.length };
}
