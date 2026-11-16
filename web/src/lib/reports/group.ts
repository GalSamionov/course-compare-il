import type { AuthorTitle } from '@/lib/reviews/types';
import { isUrgent, type ReportReason } from './reasons';

export interface ReportEntry {
  id: number;
  reason: ReportReason;
  details: string | null;
  createdAt: string;
}

/** ביקורת שיש עליה דיווח פתוח, כמו שגל רואה אותה בתור. */
export interface ReportedReview {
  reviewId: string;
  /** published: באתר, בזמן הבדיקה. disputed: מוסתרת עד בירור. */
  status: 'published' | 'disputed';
  courseSlug: string;
  courseTitle: string;
  institutionName: string;
  cohortMonth: string;
  publishedAt: string | null;
  body: string;
  /** null: הבוגר בחר להישאר אנונימי. */
  displayName: string | null;
  authorTitle: AuthorTitle;
  vendorResponse: string | null;
}

export interface ReportQueueItem extends ReportedReview {
  /** הדחופים קודם (פרטים אישיים, תוכן לא חוקי), ובתוך כל קבוצה הישן קודם. */
  reports: ReportEntry[];
  /** יש דיווח שמצדיק הסתרה עד בירור, והביקורת עדיין באתר. */
  urgent: boolean;
  /** מתי הגיע הדיווח הראשון. */
  since: string;
}

const byTime = (a: { createdAt: string }, b: { createdAt: string }) => a.createdAt.localeCompare(b.createdAt);

/**
 * פריט אחד לכל ביקורת: ההחלטה של גל היא על הביקורת, וסוגרת את כל הדיווחים הפתוחים שלה (decide_review_reports).
 * הסדר: קודם ביקורת שעוד באתר ויש עליה דיווח דחוף, ואחר כך כל השאר, הישנה ראשונה.
 * דיווח בלי ביקורת ברשימה (היא נמחקה, או ירדה מהאתר בדרך אחרת) לא נכנס.
 * הזמנים ב-ISO מ-PostgREST, באותו פורמט, ולכן השוואה של מחרוזות מסדרת לפי זמן.
 */
export function groupReports(
  reviews: readonly ReportedReview[],
  reports: readonly (ReportEntry & { reviewId: string })[],
): ReportQueueItem[] {
  const byReview = new Map<string, ReportEntry[]>();
  for (const { reviewId, ...entry } of reports) {
    const list = byReview.get(reviewId);
    if (list) list.push(entry);
    else byReview.set(reviewId, [entry]);
  }
  const items = reviews.flatMap((review): ReportQueueItem[] => {
    const list = byReview.get(review.reviewId);
    if (!list || list.length === 0) return [];
    const sorted = [...list].sort((a, b) => Number(isUrgent(b.reason)) - Number(isUrgent(a.reason)) || byTime(a, b));
    return [
      {
        ...review,
        reports: sorted,
        urgent: review.status === 'published' && list.some((r) => isUrgent(r.reason)),
        since: [...list].sort(byTime)[0].createdAt,
      },
    ];
  });
  return items.sort((a, b) => Number(b.urgent) - Number(a.urgent) || a.since.localeCompare(b.since));
}
