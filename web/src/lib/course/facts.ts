import { formatHebrewDate, formatIls } from '@/lib/format';

/**
 * "העובדות" של קורס (מסמך העיצוב 2026-11-17, שלב 1): שישה שדות שהמוסד מפרסם, או לא מפרסם.
 * אותה פונקציה בונה את התיבה בעמוד הקורס, את השורה הקצרה ברשימות, את השאלות ואת הסדר ברשימות,
 * כדי שאף אחד מהם לא יסתור את האחרים.
 * טהורה: בלי מסד ובלי התאריך של היום. מחזור שהתאריך שלו עבר נספר כידוע, כמו בשאר האתר: האוסף קורא כל דף פעם בשבוע.
 */

/** הסדר בתיבה. */
export const FACT_KEYS = ['price', 'duration', 'format', 'location', 'certificate', 'nextCohort'] as const;
export type FactKey = (typeof FACT_KEYS)[number];

/** מה שצריך מקורס. גם CourseSummary (הרשימות) וגם CoursePageData (עמוד הקורס) מתאימים. */
export interface FactSource {
  sitePrice: number | null;
  totalHours: number | null;
  durationMonths: number | null;
  formats: readonly string[];
  region: string | null;
  certificate: string | null;
  nextCohortDate: string | null;
}

/**
 * עובדה ידועה: הטקסט והמקור שלו. claim: המוסד אומר (קו כחול). verified: נבדק (ירוק).
 * עובדה חסרה: מה כותבים במקום (עיקרון 3, "מה שלא ידוע, כתוב").
 */
export type Fact =
  | { key: FactKey; label: string; known: true; text: string; source: 'claim' | 'verified' }
  | { key: FactKey; label: string; known: false; missing: string };

export const FACT_LABEL: Record<FactKey, string> = {
  price: 'מחיר',
  duration: 'משך',
  format: 'מתכונת',
  location: 'מיקום',
  certificate: 'תעודה',
  nextCohort: 'מחזור הבא',
};

export const NOT_WRITTEN = 'לא כתוב בדף';
export const NO_PRICE = 'המוסד לא מפרסם מחיר';
/** בשורה הקצרה ברשימה (מסמך העיצוב, "הרשימות ועמודי התחומים"). */
export const NO_PRICE_SHORT = 'מחיר לא מפורסם';

/** המילים של כל מתכונת, כמו ב"על הקורס". ערך שהקוד לא מכיר לא מוצג. */
const FORMAT_WORDS = new Map<string, string>([
  ['online', 'אונליין'],
  ['in_person', 'בכיתה'],
  ['hybrid', 'משולב'],
  ['recorded', 'מוקלט'],
]);
/** מתכונות בלי מקום. קורס שכולו כאלה נלמד אונליין, וזה המיקום שלו. */
const REMOTE = new Set(['online', 'recorded']);

/** טקסט מהמסד בלי רווחים בקצוות. טקסט ריק נחשב חסר. */
function present(text: string | null): string | null {
  const trimmed = text?.trim() ?? '';
  return trimmed === '' ? null : trimmed;
}

function durationText(c: FactSource): string | null {
  const parts: string[] = [];
  if (c.durationMonths !== null) parts.push(c.durationMonths === 1 ? 'חודש אחד' : `${c.durationMonths} חודשים`);
  if (c.totalHours !== null) parts.push(`${c.totalHours} שעות`);
  return parts.length > 0 ? parts.join(', ') : null;
}

function formatText(c: FactSource): string | null {
  const words = c.formats.flatMap((f) => FORMAT_WORDS.get(f) ?? []);
  return words.length > 0 ? words.join(' או ') : null;
}

function locationText(c: FactSource): string | null {
  const region = present(c.region);
  if (region) return region;
  const known = c.formats.filter((f) => FORMAT_WORDS.has(f));
  return known.length > 0 && known.every((f) => REMOTE.has(f)) ? 'אונליין' : null;
}

function fact(key: FactKey, text: string | null, source: 'claim' | 'verified' = 'claim'): Fact {
  const label = FACT_LABEL[key];
  return text === null
    ? { key, label, known: false, missing: key === 'price' ? NO_PRICE : NOT_WRITTEN }
    : { key, label, known: true, text, source };
}

/**
 * שש העובדות, בסדר של FACT_KEYS.
 * המשך (חודשים ושעות) בירוק, כמו ב"על הקורס", בהשוואה ובהנחיות של היועץ. כל השאר טענה של המוסד, בקו כחול.
 */
export function courseFacts(c: FactSource): Fact[] {
  return [
    fact('price', c.sitePrice === null ? null : formatIls(c.sitePrice)),
    fact('duration', durationText(c), 'verified'),
    fact('format', formatText(c)),
    fact('location', locationText(c)),
    fact('certificate', present(c.certificate)),
    fact('nextCohort', c.nextCohortDate === null ? null : formatHebrewDate(c.nextCohortDate)),
  ];
}

/**
 * כמה מששת השדות ידועים. ממנו מתחיל הסדר ברשימות (search/match.ts, compareCourses).
 * בלי לעצב מחירים ותאריכים: המיון קורא לזה אלפי פעמים. הבדיקה מוודאת שזה מסכים עם courseFacts.
 */
export function knownFactsCount(c: FactSource): number {
  return [
    c.sitePrice !== null,
    durationText(c) !== null,
    formatText(c) !== null,
    locationText(c) !== null,
    present(c.certificate) !== null,
    c.nextCohortDate !== null,
  ].filter(Boolean).length;
}

export interface LinePart {
  key: 'price' | 'duration' | 'format' | 'location';
  text: string;
}

/**
 * השורה הקצרה ברשימה, לקורס בלי ביקורות (מסמך העיצוב, "הרשימות ועמודי התחומים"):
 * מחיר או "מחיר לא מפורסם", משך, מתכונת ומיקום, ורק מה שידוע.
 * מיקום "אונליין" שבא מהמתכונת לא נכתב פעמיים: המתכונת כבר אומרת אותו.
 */
export function factsLine(c: FactSource): LinePart[] {
  const parts: LinePart[] = [{ key: 'price', text: c.sitePrice === null ? NO_PRICE_SHORT : formatIls(c.sitePrice) }];
  const duration = durationText(c);
  if (duration) parts.push({ key: 'duration', text: duration });
  const format = formatText(c);
  if (format) parts.push({ key: 'format', text: format });
  const region = present(c.region);
  if (region) parts.push({ key: 'location', text: region });
  return parts;
}
