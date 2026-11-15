import { isUuid } from '@/lib/reviews/types';

/**
 * דיווח על ביקורת: הסיבות, מה מקבלים מהטופס, ומה הכותב קורא כשהביקורת מוסרת.
 * אותם קודים כמו ב-reports.reason וב-decide_review_reports (20261115230001_reports_and_transparency.sql).
 */
export const REPORT_REASONS = ['privacy', 'illegal', 'false_fact', 'not_graduate', 'other'] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];
export const isReportReason = (value: unknown): value is ReportReason =>
  typeof value === 'string' && (REPORT_REASONS as readonly string[]).includes(value);

/** מה המדווח בוחר, ומה גל רואה בתור. */
export const REPORT_REASON_LABEL: Record<ReportReason, string> = {
  privacy: 'יש בה פרטים של אדם פרטי (שם מלא, טלפון, מייל)',
  illegal: 'יש בה תוכן פוגעני או לא חוקי',
  false_fact: 'כתובה בה עובדה לא נכונה על הקורס',
  not_graduate: 'נראה שמי שכתב לא למד בקורס',
  other: 'סיבה אחרת',
};

/** רק בגלל אלה מסתירים ביקורת עד ההחלטה (מסמך העיצוב של חלק 1, סעיף 6). המסד אוכף את אותו כלל (LM032). */
export const HIDE_REASONS: readonly ReportReason[] = ['privacy', 'illegal'];
export const isUrgent = (reason: ReportReason) => HIDE_REASONS.includes(reason);

/** ההודעה לכותב כשהביקורת מוסרת. מופיעה ב"הביקורות שלי" (reviews.decision_note). */
export const REMOVE_NOTE: Record<ReportReason, string> = {
  privacy: 'הסרנו את הביקורת: היו בה פרטים של אדם פרטי, כמו שם מלא או טלפון.',
  illegal: 'הסרנו את הביקורת: היה בה תוכן שאסור לפרסם.',
  false_fact: 'הסרנו את הביקורת: עובדה שנכתבה בה לא התאימה לסילבוס או לדף הקורס.',
  not_graduate: 'הסרנו את הביקורת: לא הצלחנו לוודא שהיא נכתבה בידי בוגר של הקורס.',
  other: 'הסרנו את הביקורת אחרי בירור.',
};

/** הנימוק, ואחריו מה שגל הוסיף, בשורה אחת ועד 600 תווים. כמו decisionNote בתור הביקורות. */
export function removalNote(reason: ReportReason, extra: string): string {
  const more = extra.trim().replace(/\s+/g, ' ').slice(0, 600);
  return [REMOVE_NOTE[reason], more].filter(Boolean).join(' ');
}

/** אותו גבול כמו reports.details. */
export const DETAILS_MAX = 1000;

export type ReportField = 'reason' | 'details';

export type ReportParse =
  | { ok: true; values: { reviewId: string; reason: ReportReason; details: string | null } }
  | { ok: false; field: ReportField | null; message: string };

/** מה שהטופס שולח, אחרי אותן בדיקות כמו ב-submit_review_report. field: null כשהבעיה לא בשדה שהמבקר ממלא. */
export function parseReportForm(form: FormData): ReportParse {
  const reviewId = form.get('reviewId');
  if (!isUuid(reviewId)) return { ok: false, field: null, message: 'הדיווח לא נשלח. רעננו את הדף ונסו שוב.' };
  const reason = form.get('reason');
  if (!isReportReason(reason)) return { ok: false, field: 'reason', message: 'בחרו מה הבעיה.' };
  const raw = form.get('details');
  const details = (typeof raw === 'string' ? raw : '').replace(/\s+/g, ' ').trim();
  if (details.length > DETAILS_MAX) return { ok: false, field: 'details', message: 'עד 1,000 תווים.' };
  if (reason === 'other' && details === '') return { ok: false, field: 'details', message: 'כתבו בכמה מילים מה הבעיה.' };
  return { ok: true, values: { reviewId, reason, details: details === '' ? null : details } };
}
