/**
 * מספרי השקיפות (סבב 5, פריט 33): מה עשינו בכל חודש שנגמר, לכל האתר יחד.
 * השורות באות מ-transparency_by_month (20261115230001_reports_and_transparency.sql, סעיף 7).
 */
export interface TransparencyMonth {
  /** היום הראשון של החודש, 'YYYY-MM-DD'. */
  month: string;
  reviewsPublished: number;
  reviewsReturned: number;
  proofsDeleted: number;
  courseChangesApproved: number;
  courseChangesRejected: number;
  reportedKept: number;
  reportedRemoved: number;
}

export type TransparencyCount = Exclude<keyof TransparencyMonth, 'month'>;

/** שורה מהמסד, כמו ש-PostgREST מחזיר אותה. */
export interface TransparencyRow {
  month: string;
  reviews_published: number;
  reviews_returned: number;
  proofs_deleted: number;
  course_changes_approved: number;
  course_changes_rejected: number;
  reported_reviews_kept: number;
  reported_reviews_removed: number;
}

export const toTransparencyMonth = (row: TransparencyRow): TransparencyMonth => ({
  month: row.month,
  reviewsPublished: row.reviews_published,
  reviewsReturned: row.reviews_returned,
  proofsDeleted: row.proofs_deleted,
  courseChangesApproved: row.course_changes_approved,
  courseChangesRejected: row.course_changes_rejected,
  reportedKept: row.reported_reviews_kept,
  reportedRemoved: row.reported_reviews_removed,
});

/** השורות בטבלה בעמוד השיטה, לפי הסדר. */
export const TRANSPARENCY_ROWS: readonly { key: TransparencyCount; label: string }[] = [
  { key: 'reviewsPublished', label: 'ביקורות שפרסמנו' },
  { key: 'reviewsReturned', label: 'ביקורות שהחזרנו לכותבים בלי לפרסם' },
  { key: 'proofsDeleted', label: 'קבצי הוכחה שמחקנו' },
  { key: 'courseChangesApproved', label: 'שינויים בקורסים שאישרנו' },
  { key: 'courseChangesRejected', label: 'שינויים בקורסים שדחינו' },
  { key: 'reportedKept', label: 'ביקורות שדווחו ונשארו' },
  { key: 'reportedRemoved', label: 'ביקורות שהוסרו אחרי דיווח' },
];

export const formatCount = (n: number) => new Intl.NumberFormat('he-IL').format(n);

/** "אוקטובר 2026". UTC, כי month הוא תאריך בלי שעה. */
export const monthName = (iso: string) =>
  new Intl.DateTimeFormat('he-IL', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(iso));

/** המשפט בראש: "באוקטובר 2026 פרסמנו 12 ביקורות, והחזרנו 37 לכותבים בלי לפרסם." */
export function transparencyLead(m: TransparencyMonth): string {
  const published =
    m.reviewsPublished === 0
      ? 'לא פרסמנו אף ביקורת'
      : m.reviewsPublished === 1
        ? 'פרסמנו ביקורת אחת'
        : `פרסמנו ${formatCount(m.reviewsPublished)} ביקורות`;
  const returned =
    m.reviewsReturned === 0
      ? 'ולא החזרנו אף אחת לכותבים'
      : m.reviewsReturned === 1
        ? 'והחזרנו אחת לכותב בלי לפרסם'
        : `והחזרנו ${formatCount(m.reviewsReturned)} לכותבים בלי לפרסם`;
  return `ב${monthName(m.month)} ${published}, ${returned}.`;
}
