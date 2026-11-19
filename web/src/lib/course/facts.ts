import { formatHebrewDate, formatIls } from '@/lib/format';
import { FORMAT_LABEL } from '@/lib/search/types';

/**
 * "העובדות" של קורס (מסמך העיצוב 2026-11-17, שלב 1): שישה שדות שהמוסד מפרסם, או לא מפרסם.
 * אותה פונקציה בונה את התיבה בעמוד הקורס, את השורה הקצרה ברשימות, את השאלות ואת הסדר ברשימות,
 * כדי שאף אחד מהם לא יסתור את האחרים.
 * טהורה: בלי מסד ובלי התאריך של היום. מחזור שהתאריך שלו עבר נספר כידוע, כמו בשאר האתר: האוסף קורא כל דף פעם בשבוע.
 * מיקום (שלב 3, "אזור לפי המוסד"): מה שהקורס כותב; אחרת "אונליין" כשכל המתכונות בלי מקום; אחרת העיר של המוסד,
 * עם תווית המקור "לפי כתובת המוסד". מוסד שמלמד רק אונליין נותן "אונליין", עם "לפי המוסד".
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
  /**
   * העיר של המוסד (institutions.city), או "אונליין" למוסד שמלמד רק אונליין. null: כמה סניפים, או שלא מצאנו.
   * משמשת רק כשהקורס עצמו לא כותב איפה הוא.
   */
  institutionCity: string | null;
  certificate: string | null;
  nextCohortDate: string | null;
}

/**
 * עובדה ידועה: הטקסט והמקור שלו. claim: המוסד אומר (קו כחול). verified: נבדק (ירוק).
 * note: תווית מקור קטנה ליד הערך, כשהוא לא בא מהדף של הקורס ("לפי כתובת המוסד").
 * עובדה חסרה: מה כותבים במקום (עיקרון 3, "מה שלא ידוע, כתוב").
 */
export type Fact =
  | { key: FactKey; label: string; known: true; text: string; source: 'claim' | 'verified'; note?: string }
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
/** המיקום של קורס שנלמד אונליין. אותה מילה כמו ב-courses.region וב-institutions.city. */
export const ONLINE = 'אונליין';
/** מיקום שבא מהעיר של המוסד, ולא מהדף של הקורס. */
export const BY_INSTITUTION_ADDRESS = 'לפי כתובת המוסד';
/** "אונליין" שבא מהמוסד (מוסד שמלמד רק אונליין), ולא מהדף של הקורס. */
export const BY_INSTITUTION = 'לפי המוסד';

/** המילים של כל מתכונת (search/types.ts). ערך שהקוד לא מכיר לא מוצג. */
const FORMAT_WORDS = new Map<string, string>(Object.entries(FORMAT_LABEL));
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

function formatWords(c: FactSource): string[] {
  return c.formats.flatMap((f) => FORMAT_WORDS.get(f) ?? []);
}

function formatText(c: FactSource): string | null {
  const words = formatWords(c);
  return words.length > 0 ? words.join(' או ') : null;
}

/** איפה הקורס, ומאיפה זה ידוע. note: null כשזה מהקורס עצמו (האזור, או מתכונות בלי מקום). */
interface Place {
  text: string;
  note: string | null;
}

function placeOf(c: FactSource): Place | null {
  const region = present(c.region);
  if (region) return { text: region, note: null };
  const known = c.formats.filter((f) => FORMAT_WORDS.has(f));
  if (known.length > 0 && known.every((f) => REMOTE.has(f))) return { text: ONLINE, note: null };
  const city = present(c.institutionCity);
  if (city === null) return null;
  if (city !== ONLINE) return { text: city, note: BY_INSTITUTION_ADDRESS };
  // מוסד שמלמד רק אונליין, אבל הקורס הזה כותב שהוא בכיתה או משולב: לא מנחשים.
  return known.length > 0 ? null : { text: ONLINE, note: BY_INSTITUTION };
}

function fact(key: FactKey, text: string | null, source: 'claim' | 'verified' = 'claim', note: string | null = null): Fact {
  const label = FACT_LABEL[key];
  if (text === null) return { key, label, known: false, missing: key === 'price' ? NO_PRICE : NOT_WRITTEN };
  return note === null ? { key, label, known: true, text, source } : { key, label, known: true, text, source, note };
}

/**
 * שש העובדות, בסדר של FACT_KEYS.
 * המשך (חודשים ושעות) בירוק, כמו ב"על הקורס", בהשוואה ובהנחיות של היועץ. כל השאר טענה של המוסד, בקו כחול.
 */
export function courseFacts(c: FactSource): Fact[] {
  const place = placeOf(c);
  return [
    fact('price', c.sitePrice === null ? null : formatIls(c.sitePrice)),
    fact('duration', durationText(c), 'verified'),
    fact('format', formatText(c)),
    fact('location', place?.text ?? null, 'claim', place?.note ?? null),
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
    placeOf(c) !== null,
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
 * מיקום: מה שהקורס כותב, אלא אם המתכונת כבר אומרת אותו ("אונליין" לא נכתב פעמיים). "אונליין" שבא רק מהמתכונת
 * לא נכתב בכלל. מיקום מהמוסד נכתב עם המקור שלו בסוגריים, כי בשורה אין מקום לתווית נפרדת.
 */
export function factsLine(c: FactSource): LinePart[] {
  const parts: LinePart[] = [{ key: 'price', text: c.sitePrice === null ? NO_PRICE_SHORT : formatIls(c.sitePrice) }];
  const duration = durationText(c);
  if (duration) parts.push({ key: 'duration', text: duration });
  const format = formatText(c);
  if (format) parts.push({ key: 'format', text: format });
  const place = placeOf(c);
  if (place?.note) parts.push({ key: 'location', text: `${place.text} (${place.note})` });
  else if (place && present(c.region) !== null && !formatWords(c).includes(place.text)) {
    parts.push({ key: 'location', text: place.text });
  }
  return parts;
}
