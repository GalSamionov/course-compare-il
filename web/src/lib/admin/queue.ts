import 'server-only';
import { connection } from 'next/server';
import { one } from '@/lib/data/shared';
import { PROOF_BUCKET } from '@/lib/reviews/files';
import type { CheckResult } from '@/lib/reviews/proof-check';
import type { AuthorTitle, DisplayMode, ProofKind } from '@/lib/reviews/types';
import type { AdminDb } from './gate';

/** קישור זמני להוכחה (מסמך העיצוב, סעיף 4). */
export const SIGNED_URL_SECONDS = 600;

export interface QueueProof {
  id: string;
  claimedKind: ProofKind;
  mime: string;
  sizeBytes: number;
  url: string | null;
  checkStatus: string;
  check: CheckResult | null;
  flags: string[];
}

export interface QueueItem {
  reviewId: string;
  submittedAt: string | null;
  /** כמה שעות שלמות הביקורת מחכה, ברגע שהתור נטען. */
  waitingHours: number | null;
  courseSlug: string;
  courseTitle: string;
  institutionName: string;
  sitePrice: number | null;
  cohortMonth: string;
  finishedMonth: string | null;
  body: string;
  displayName: string;
  displayMode: DisplayMode;
  authorTitle: AuthorTitle;
  answers: { label: string; value: number; scale: 'likert5' | 'yes_no' }[];
  proofs: QueueProof[];
}

type CourseRef = {
  slug: string;
  title: string;
  site_price_ils: number | null;
  institutions: { name: string } | { name: string }[] | null;
};

/** הביקורות שממתינות, הישנה ראשונה. רק עם המפתח הסודי: ההוכחות סגורות לכל השאר. */
export async function loadQueue(db: AdminDb): Promise<QueueItem[]> {
  const [reviewsRes, metricsRes] = await Promise.all([
    db
      .from('reviews')
      .select(
        'id, submitted_at, cohort_month, finished_month, body, display_name, display_mode, author_title, review_answers(metric_key, value), courses(slug, title, site_price_ils, institutions(name)), proofs(id, claimed_kind, mime_type, size_bytes, storage_path, check_status, check_result, flags, status)',
      )
      .eq('status', 'pending')
      .order('submitted_at', { ascending: true }),
    db.from('metrics').select('key, label, scale, sort_order').order('sort_order'),
  ]);
  if (reviewsRes.error) throw new Error(`queue: ${reviewsRes.error.message}`);
  if (metricsRes.error) throw new Error(`queue metrics: ${metricsRes.error.message}`);

  // השעה של הבקשה, ולא של הבנייה (08-caching.md, "Random values and timestamps"). העמוד כבר כולו בבקשה.
  await connection();
  const now = Date.now();
  const metrics = new Map(metricsRes.data.map((m) => [m.key, m]));
  const rows = reviewsRes.data;
  const paths = rows.flatMap((r) =>
    r.proofs.flatMap((p) => (p.status === 'pending' && p.storage_path ? [p.storage_path] : [])),
  );
  const urls = new Map<string, string>();
  if (paths.length > 0) {
    // קישור שנכשל לא מפיל את התור: ההוכחה מוצגת בלי קישור, ורענון של הדף מנסה שוב.
    const { data, error } = await db.storage.from(PROOF_BUCKET).createSignedUrls(paths, SIGNED_URL_SECONDS);
    if (error) console.error('queue: signed urls failed', error.message);
    for (const signed of data ?? []) if (signed.path && signed.signedUrl) urls.set(signed.path, signed.signedUrl);
  }

  return rows.map((row) => {
    const course = one(row.courses as unknown as CourseRef | CourseRef[] | null);
    return {
      reviewId: row.id,
      submittedAt: row.submitted_at,
      waitingHours: row.submitted_at ? Math.floor((now - new Date(row.submitted_at).getTime()) / 3_600_000) : null,
      courseSlug: course?.slug ?? '',
      courseTitle: course?.title ?? '',
      institutionName: one(course?.institutions ?? null)?.name ?? '',
      sitePrice: course?.site_price_ils ?? null,
      cohortMonth: row.cohort_month,
      finishedMonth: row.finished_month,
      body: row.body,
      displayName: row.display_name,
      displayMode: row.display_mode,
      authorTitle: row.author_title,
      answers: row.review_answers
        .flatMap((a) => {
          const metric = metrics.get(a.metric_key);
          return metric ? [{ label: metric.label, value: a.value, scale: metric.scale, order: metric.sort_order }] : [];
        })
        .sort((a, b) => a.order - b.order)
        .map(({ label, value, scale }) => ({ label, value, scale })),
      proofs: row.proofs
        .filter((p) => p.status === 'pending')
        .map((p) => ({
          id: p.id,
          claimedKind: p.claimed_kind,
          mime: p.mime_type,
          sizeBytes: p.size_bytes,
          url: p.storage_path ? (urls.get(p.storage_path) ?? null) : null,
          checkStatus: p.check_status,
          check: (p.check_result ?? null) as unknown as CheckResult | null,
          flags: p.flags,
        })),
    };
  });
}
