/**
 * הטופס של חברה שמחפשת הכשרה לעובדים (/companies): מה מקבלים, ואיך. אותם גבולות כמו ב-company_requests
 * (20261115233001_company_requests.sql), ואותו ניקוי כמו private.clean_line ו-private.clean_text שם, כדי
 * שההודעה ליד השדה תופיע כאן ולא כשגיאה כללית מהמסד.
 */
import { EMAIL } from '@/lib/institutions/join';

export type CompanyField = 'needs' | 'companyName' | 'contactName' | 'email' | 'phone' | 'teamSize' | 'format' | 'timing';

export const NEEDS_MAX = 1000;
export const NEEDS_MIN = 3;

export const TEAM_SIZES = [
  { value: '1-10', label: 'עד 10' },
  { value: '11-50', label: '11 עד 50' },
  { value: '51-200', label: '51 עד 200' },
  { value: '201-1000', label: '201 עד 1,000' },
  { value: '1000+', label: 'יותר מ-1,000' },
] as const;

export const FORMATS = [
  { value: 'course', label: 'קורס' },
  { value: 'lecture', label: 'הרצאה' },
  { value: 'workshop', label: 'סדנה' },
  { value: 'unsure', label: 'עוד לא בטוחים' },
] as const;

export const TIMINGS = [
  { value: 'month', label: 'בחודש הקרוב' },
  { value: 'quarter', label: 'בשלושת החודשים הקרובים' },
  { value: 'half_year', label: 'בחצי השנה הקרובה' },
  { value: 'unknown', label: 'עוד לא יודעים' },
] as const;

export type TeamSize = (typeof TEAM_SIZES)[number]['value'];
export type TrainingFormat = (typeof FORMATS)[number]['value'];
export type Timing = (typeof TIMINGS)[number]['value'];

export interface CompanyRequestValues {
  needs: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string | null;
  teamSize: TeamSize | null;
  format: TrainingFormat | null;
  timing: Timing | null;
}

export type CompanyRequestParse =
  | { ok: true; values: CompanyRequestValues }
  | { ok: false; errors: Partial<Record<CompanyField, string>> };

/** סימני כיווניות (הטבעה, עקיפה ובידוד): בממשק הניהול הם היו יכולים להפוך את סדר הטקסט. */
const BIDI_CONTROLS = /[‪-‮⁦-⁩]/g;

/** שורה אחת: בלי סימני כיווניות, וכל רצף של רווחים ותווי בקרה הופך לרווח אחד. כמו private.clean_line. */
export function cleanLine(text: string): string {
  return text
    .replace(BIDI_CONTROLS, '')
    .replace(/[\s\p{Cc}]+/gu, ' ')
    .trim();
}

/** טקסט חופשי: אותו ניקוי, אבל מעברי שורה נשארים, עד שורה ריקה אחת ברצף. כמו private.clean_text. */
export function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[‪-‮⁦-⁩\x01-\x09\x0b-\x1f\x7f]/g, ' ')
    .replace(/[  ]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^[ \n]+|[ \n]+$/g, '');
}

/** אורך בתווים כמו שהמסד סופר (char_length): אימוג'י הוא תו אחד, ולא שניים. */
export const charCount = (text: string) => [...text].length;

/** "050-123 4567" הופך ל-0501234567. null: לא טלפון. */
export function normalizePhone(input: string): string | null {
  const digits = input.trim().replace(/[\s().-]/g, '');
  return /^\+?[0-9]{9,15}$/.test(digits) ? digits : null;
}

const field = (form: FormData, name: string) => {
  const value = form.get(name);
  return typeof value === 'string' ? value : '';
};

/** בחירה מתוך רשימה סגורה. ריק: לא נבחר (שדה רשות). undefined: ערך שאינו ברשימה, כלומר מישהו שינה את הטופס. */
function choice<T extends string>(raw: string, options: readonly { value: T }[]): T | null | undefined {
  if (raw === '') return null;
  return options.find((o) => o.value === raw)?.value;
}

export function parseCompanyRequest(form: FormData): CompanyRequestParse {
  const errors: Partial<Record<CompanyField, string>> = {};

  const needs = cleanText(field(form, 'needs'));
  const needsLength = charCount(needs);
  if (needsLength < NEEDS_MIN) errors.needs = 'כתבו בכמה מילים מה אתם מחפשים: מה העובדים צריכים ללמוד, ולמי.';
  else if (needsLength > NEEDS_MAX) {
    errors.needs = `עד ${NEEDS_MAX.toLocaleString('en-US')} תווים. כרגע ${needsLength.toLocaleString('en-US')}.`;
  }

  const companyName = cleanLine(field(form, 'companyName'));
  if (charCount(companyName) < 2) errors.companyName = 'כתבו את שם החברה.';
  else if (charCount(companyName) > 120) errors.companyName = 'עד 120 תווים.';

  const contactName = cleanLine(field(form, 'contactName'));
  if (charCount(contactName) < 2) errors.contactName = 'כתבו את השם שלכם, שנדע למי לחזור.';
  else if (charCount(contactName) > 80) errors.contactName = 'עד 80 תווים.';

  const email = field(form, 'email').trim().toLowerCase();
  if (email === '') errors.email = 'כתבו מייל שנוכל לחזור אליו.';
  // הכתובת בדוגמה מבודדת לכיוון שמאל-לימין (LRI ו-PDI), כדי שלא תתהפך בתוך משפט בעברית.
  else if (email.length > 254 || !EMAIL.test(email)) errors.email = 'המייל לא נראה תקין. למשל: ⁦name@company.co.il⁩';

  const rawPhone = field(form, 'phone');
  const phone = rawPhone.trim() === '' ? null : normalizePhone(rawPhone);
  if (rawPhone.trim() !== '' && phone === null) {
    errors.phone = 'הטלפון לא נראה תקין. מספיקות הספרות, למשל: ⁦050-1234567⁩';
  }

  const teamSize = choice(field(form, 'teamSize'), TEAM_SIZES);
  if (teamSize === undefined) errors.teamSize = 'לבחור מהרשימה.';
  const format = choice(field(form, 'format'), FORMATS);
  if (format === undefined) errors.format = 'לבחור אחת מהאפשרויות.';
  const timing = choice(field(form, 'timing'), TIMINGS);
  if (timing === undefined) errors.timing = 'לבחור מהרשימה.';

  if (Object.keys(errors).length > 0 || teamSize === undefined || format === undefined || timing === undefined) {
    return { ok: false, errors };
  }
  return { ok: true, values: { needs, companyName, contactName, email, phone, teamSize, format, timing } };
}

/** התווית בעברית של בחירה שנשמרה, לממשק הניהול. null: לא נבחר, או ערך שכבר לא ברשימה. */
export function choiceLabel(options: readonly { value: string; label: string }[], value: string | null): string | null {
  return options.find((o) => o.value === value)?.label ?? null;
}
