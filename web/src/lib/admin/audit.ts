import { REPORT_REASON_LABEL, isReportReason } from '@/lib/reports/reasons';
import { PROOF_KIND_LABEL, type ProofKind } from '@/lib/reviews/types';
import { fieldLabel } from './course-fields';
import { REJECT_REASONS, isRejectReason } from './reasons';

/** כל הפעולות ש-audit_log מקבל (audit_log_action_check ב-20261115230001_reports_and_transparency.sql). */
export const AUDIT_ACTIONS = [
  'approve',
  'reject',
  'request_more',
  'author_delete',
  'cleanup_delete',
  'course_approve',
  'course_edit',
  'course_reject',
  'join_request_approve',
  'join_request_reject',
  'report_keep',
  'report_hide',
  'report_remove',
  'vendor_response',
  'vendor_response_remove',
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

const isAuditAction = (action: string): action is AuditAction => (AUDIT_ACTIONS as readonly string[]).includes(action);

const LABEL: Record<AuditAction, string> = {
  approve: 'ביקורת אושרה ופורסמה',
  reject: 'ביקורת נדחתה והוחזרה לכותב',
  request_more: 'התבקשה הוכחה נוספת',
  author_delete: 'הכותב מחק ביקורת',
  cleanup_delete: 'טיוטה ישנה נמחקה',
  course_approve: 'שינוי בקורס אושר',
  course_edit: 'קורס תוקן ידנית',
  course_reject: 'שינוי בקורס נדחה',
  join_request_approve: 'בקשה של מוסד אושרה',
  join_request_reject: 'בקשה של מוסד נדחתה',
  report_keep: 'דיווח נסגר, והביקורת נשארה',
  report_hide: 'ביקורת הוסתרה עד בירור',
  report_remove: 'ביקורת הוסרה אחרי דיווח',
  vendor_response: 'תגובת מוסד פורסמה',
  vendor_response_remove: 'תגובת מוסד הוסרה',
};

/** מה קרה, בעברית. פעולה שעוד אין לה מילים מוצגת כמו שהיא, כדי שלא תיעלם מהיומן. */
export const actionLabel = (action: string) => (isAuditAction(action) ? LABEL[action] : action);

/** יש מנהל אחד, ולכן התפקיד ולא המייל. null הוא הניקוי היומי (cleanup_delete). */
export function actorLabel(action: string, actorId: string | null): string {
  if (actorId === null) return 'הניקוי האוטומטי';
  if (action === 'author_delete') return 'הכותב';
  return 'מנהל';
}

const COURSE_KIND: Record<string, string> = {
  new_course: 'קורס חדש',
  maybe_inactive: 'ייתכן שאינו פעיל',
  fetch_failed: 'דף שלא נטען',
};
const text = (value: unknown) => (typeof value === 'string' ? value : null);

/** הקודים מ-details, במילים. ב-details אין טקסט חופשי (החלטה 8 בתוכנית), ולכן אין כאן מה לחתוך. */
export function detailLabel(action: string, details: Record<string, unknown>): string | null {
  switch (action) {
    case 'approve': {
      const kind = text(details.proof_kind);
      const label = kind && Object.hasOwn(PROOF_KIND_LABEL, kind) ? PROOF_KIND_LABEL[kind as ProofKind] : null;
      return [label, details.has_amount === true ? 'עם סכום' : null].filter(Boolean).join(', ') || null;
    }
    case 'reject': {
      const reason = text(details.reason);
      return reason && isRejectReason(reason) ? REJECT_REASONS[reason] : null;
    }
    case 'course_approve':
    case 'course_edit':
    case 'course_reject': {
      const field = text(details.field);
      if (field) return fieldLabel(field);
      const kind = text(details.kind);
      return kind ? (COURSE_KIND[kind] ?? null) : null;
    }
    case 'report_hide':
    case 'report_remove': {
      const reason = details.reason;
      return isReportReason(reason) ? REPORT_REASON_LABEL[reason] : null;
    }
    case 'report_keep':
      return details.was_hidden === true ? 'הביקורת חזרה לאתר' : null;
    default:
      return null;
  }
}

/** שורה ביומן, כמו ש-/admin/log מציג אותה. */
export interface AuditEntry {
  id: number;
  action: string;
  actorId: string | null;
  createdAt: string;
  details: Record<string, unknown>;
  /** על מה: הקורס, או שם המוסד בבקשה. null: הרשומה כבר נמחקה. */
  target: { title: string; href: string | null } | null;
}
