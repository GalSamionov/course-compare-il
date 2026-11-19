import type { Json } from '@/lib/database.types';
import { formatIls } from '@/lib/format';
import { COURSE_FORMATS, FORMAT_LABEL, TIME_SLOTS, TIME_SLOT_LABEL } from '@/lib/search/types';

/**
 * השדות שהאוסף ממלא ב-courses, כמו ב-scraper/lamadti_scraper/fields.py וב-private.scraper_set_course_field.
 * כאן: איך כל שדה מוצג בתור, ואיך התיקון הידני של גל נקרא לערך שנשמר.
 */
export type FieldKind = 'text' | 'int' | 'number' | 'date' | 'choices' | 'syllabus';

interface FieldSpec {
  label: string;
  kind: FieldKind;
  /** שדה שהמסד לא מקבל בו null: רשימה ריקה. */
  choices?: readonly string[];
  choiceLabel?: Record<string, string>;
  maxChars?: number;
  /** הטווח שהמסד מקבל (בדיקות ב-courses). */
  min?: number;
  max?: number;
  unit?: string;
}

export const COURSE_FIELDS: Record<string, FieldSpec> = {
  title: { label: 'שם הקורס', kind: 'text', maxChars: 120 },
  site_price_ils: { label: 'מחיר באתר', kind: 'int', min: 50, max: 100_000 },
  total_hours: { label: 'סך השעות', kind: 'int', min: 1, max: 3000, unit: 'שעות' },
  lecture_hours: { label: 'שעות הרצאה', kind: 'int', min: 0, max: 3000, unit: 'שעות' },
  hands_on_hours: { label: 'שעות עשייה', kind: 'int', min: 0, max: 3000, unit: 'שעות' },
  duration_months: { label: 'משך בחודשים', kind: 'number', min: 0.1, max: 999, unit: 'חודשים' },
  session_count: { label: 'מספר מפגשים', kind: 'int', min: 1, max: 1000, unit: 'מפגשים' },
  schedule: { label: 'ימים ושעות', kind: 'text', maxChars: 200 },
  formats: { label: 'פורמט', kind: 'choices', choices: COURSE_FORMATS, choiceLabel: FORMAT_LABEL },
  region: { label: 'אזור', kind: 'text', maxChars: 120 },
  time_slots: { label: 'מתי', kind: 'choices', choices: TIME_SLOTS, choiceLabel: TIME_SLOT_LABEL },
  next_cohort_date: { label: 'המחזור הבא', kind: 'date' },
  syllabus: { label: 'סילבוס', kind: 'syllabus' },
  admission: { label: 'תנאי קבלה', kind: 'text', maxChars: 200 },
  class_size_note: { label: 'גודל כיתה', kind: 'text', maxChars: 200 },
  certificate: { label: 'תעודה', kind: 'text', maxChars: 200 },
  institution_promises: { label: 'הבטחות המוסד', kind: 'text', maxChars: 200 },
  video_url: { label: 'סרטון', kind: 'text', maxChars: 300 },
};

export const fieldLabel = (field: string) => COURSE_FIELDS[field]?.label ?? field;

/** למה הפריט בתור (decide.py, sanity.py, והמיגרציה של האוסף). מה שלא כאן מוצג כמו שהוא. */
export const QUEUE_REASON: Record<string, string> = {
  new_course: 'קורס חדש באתר של המוסד',
  grouped_pages: 'אוחד מכמה דפים באתר: מפגשים, מחזורים, מסלולים או דף הרשמה',
  price_jump: 'המחיר זז ביותר מ-20%',
  price_new: 'מחיר ראשון לקורס',
  low_confidence: 'המודל לא היה בטוח',
  quote_not_found: 'המשפט לא נמצא בדף כמו שהוא',
  not_on_page: 'הנתון כבר לא מופיע בדף',
  syllabus_changed: 'הסילבוס השתנה',
  promise_changed: 'ההבטחות של המוסד השתנו',
  title_changed: 'שם הקורס השתנה',
  changed_since_read: 'הערך באתר השתנה מאז שהאוסף קרא אותו',
  price_out_of_range: 'מחיר מחוץ לטווח (50 עד 100,000 ₪)',
  hours_out_of_range: 'שעות מחוץ לטווח (1 עד 3,000)',
  hours_exceed_total: 'יותר שעות מסך השעות',
  duration_out_of_range: 'משך לא סביר',
  sessions_out_of_range: 'מספר מפגשים מחוץ לטווח (1 עד 1,000)',
  bad_date: 'תאריך לא תקין',
  cohort_in_past: 'מועד המחזור כבר עבר',
  cohort_far_future: 'מועד המחזור רחוק מאוד',
  video_url_invalid: 'הסרטון לא ב-YouTube או ב-Vimeo',
  page_not_course: 'הדף כבר לא נראה כמו דף של קורס',
  missing_twice: 'הדף לא נמצא באתר פעמיים ברציפות',
  failed_3_times: 'הדף לא נטען שלוש פעמים ברציפות',
};

/** "site_price_ils:low_confidence" (בקורס חדש) הופך ל"מחיר באתר: המודל לא היה בטוח". */
export function reasonText(reason: string): string {
  const [field, issue] = reason.includes(':') ? reason.split(':', 2) : [null, reason];
  const text = QUEUE_REASON[issue] ?? issue;
  return field ? `${fieldLabel(field)}: ${text}` : text;
}

/** "2026-13-01" עובר את התבנית, אבל Intl זורק על תאריך לא תקין, והתור כולו נופל. אז: הטקסט כמו שהוא. */
const dateLabel = (iso: string) => {
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(date);
};

/** ערך שאינו בצורה שהשדה מצפה לה: טקסט קריא, ולא "[object Object]". */
const asText = (value: Json) => (typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value));

const isObject = (value: Json): value is { [key: string]: Json | undefined } =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** נושאי הסילבוס, מהמסד ({ title, weak }) או מהחילוץ (מחרוזות). */
export function syllabusTitles(value: Json | null | undefined): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item === 'string') return [item];
    if (item && isObject(item) && typeof item.title === 'string') return [item.title];
    return [];
  });
}

/** הערך כמו שגל קורא אותו. null: "ריק". */
export function displayValue(field: string, value: Json | null | undefined): string | null {
  const spec = COURSE_FIELDS[field];
  if (value === null || value === undefined || value === '') return null;
  if (!spec) return typeof value === 'string' ? value : JSON.stringify(value);
  switch (spec.kind) {
    case 'int':
    case 'number': {
      const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
      if (!Number.isFinite(n)) return asText(value);
      if (field === 'site_price_ils') return formatIls(n);
      return `${new Intl.NumberFormat('he-IL').format(n)}${spec.unit ? ` ${spec.unit}` : ''}`;
    }
    case 'date':
      return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? dateLabel(value) : asText(value);
    case 'choices':
      if (!Array.isArray(value)) return asText(value);
      if (value.length === 0) return null;
      return value.map((v) => (typeof v === 'string' ? (spec.choiceLabel?.[v] ?? v) : asText(v))).join(', ');
    case 'syllabus': {
      const titles = syllabusTitles(value);
      if (titles.length > 0) return titles.join(' · ');
      return Array.isArray(value) && value.length === 0 ? null : asText(value);
    }
    default:
      return asText(value);
  }
}

/** בשינוי מחיר: בכמה אחוזים הוא זז. null כשאין מה להשוות. */
export function priceChange(oldValue: Json | null | undefined, newValue: Json | null | undefined): string | null {
  if (typeof oldValue !== 'number' || typeof newValue !== 'number' || oldValue <= 0) return null;
  const percent = Math.round(((newValue - oldValue) / oldValue) * 100);
  if (percent === 0) return null;
  return `${percent > 0 ? '+' : '−'}${Math.abs(percent)}%`;
}

/** מה שמופיע בשדה התיקון כשהוא נפתח: הערך מהדף, בצורה שאפשר לערוך. */
export function editText(field: string, value: Json | null | undefined): string {
  const spec = COURSE_FIELDS[field];
  if (value === null || value === undefined || !spec) return '';
  if (spec.kind === 'syllabus') return syllabusTitles(value).join('\n');
  if (spec.kind === 'choices') return Array.isArray(value) ? value.map(String).join(',') : '';
  return String(value);
}

export type EditResult = { ok: true; value: Json } | { ok: false; message: string };

/**
 * התיקון של גל, מהטופס, לערך שהמסד מקבל. אותם טווחים כמו בבדיקות של courses, כדי שגל יקבל הודעה ברורה
 * ולא שגיאה של המסד. ריק: אין ערך (ברשימות: רשימה ריקה).
 * current: הערך הנוכחי באתר. בסילבוס נשמר הסימון "חלש" של נושא שכבר היה, כמו ב-to_db של האוסף.
 */
export function parseEdit(field: string, raw: string | string[], current?: Json | null): EditResult {
  const spec = COURSE_FIELDS[field];
  if (!spec) return { ok: false, message: 'אי אפשר לתקן את השדה הזה מכאן.' };
  if (spec.kind === 'choices') {
    const picked = (Array.isArray(raw) ? raw : raw.split(',')).map((v) => v.trim()).filter(Boolean);
    if (picked.some((v) => !spec.choices?.includes(v))) return { ok: false, message: 'בחירה לא מוכרת.' };
    return { ok: true, value: spec.choices!.filter((c) => picked.includes(c)) };
  }
  const text = (Array.isArray(raw) ? raw.join('\n') : raw).trim();
  if (spec.kind === 'syllabus') {
    const titles = text
      .split(/\r?\n/)
      .map((line) => line.replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    if (titles.some((t) => t.length > 200)) return { ok: false, message: 'נושא בסילבוס ארוך מ-200 תווים.' };
    if (titles.length > 80) return { ok: false, message: 'יותר מ-80 נושאים בסילבוס.' };
    const weak = new Map(
      (Array.isArray(current) ? current : []).flatMap((item) =>
        item && isObject(item) && typeof item.title === 'string' ? [[item.title.trim(), item.weak === true] as const] : [],
      ),
    );
    return { ok: true, value: titles.map((title) => ({ title, weak: weak.get(title) ?? false })) };
  }
  if (text === '') return { ok: true, value: null };
  if (spec.kind === 'text') {
    const value = text.replace(/\s+/g, ' ');
    if (spec.maxChars && value.length > spec.maxChars) return { ok: false, message: `עד ${spec.maxChars} תווים.` };
    if (field === 'video_url' && !/^https:\/\/(www\.)?(youtube\.com|youtu\.be|vimeo\.com|player\.vimeo\.com)\//.test(value)) {
      return { ok: false, message: 'רק קישור של YouTube או Vimeo, שמתחיל ב-https.' };
    }
    return { ok: true, value };
  }
  if (spec.kind === 'date') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || Number.isNaN(Date.parse(`${text}T00:00:00Z`))) {
      return { ok: false, message: 'תאריך לא תקין.' };
    }
    return { ok: true, value: text };
  }
  // מספר: בלי מפרידי אלפים, ₪ או רווחים.
  const cleaned = text.replace(/[\s,₪]/g, '');
  const n = Number(cleaned);
  if (cleaned === '' || !Number.isFinite(n)) return { ok: false, message: 'רק מספר.' };
  if (spec.kind === 'int' && !Number.isInteger(n)) return { ok: false, message: 'רק מספר שלם.' };
  if ((spec.min !== undefined && n < spec.min) || (spec.max !== undefined && n > spec.max)) {
    return { ok: false, message: `מספר בין ${spec.min} ל-${new Intl.NumberFormat('he-IL').format(spec.max!)}.` };
  }
  return { ok: true, value: n };
}
