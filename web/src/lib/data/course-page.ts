import { createPublicClient } from '@/lib/supabase/public-client';
import { costPerHandsOnHour, type PaidRange } from '@/lib/format';
import { MIN_OUTCOME_ANSWERS } from '@/lib/score/constants';
import { safeHttpUrl } from '@/lib/safe-url';
import type { Database } from '@/lib/database.types';

export interface SyllabusItem {
  title: string;
  weak: boolean;
}

export interface MetricRow {
  key: string;
  label: string;
  mean: number;
  n: number;
}

export interface ReviewView {
  id: string;
  /** null כשהבוגר בחר להישאר אנונימי. */
  displayName: string | null;
  cohortMonth: string;
  body: string;
  followUp: string | null;
  vendorResponse: string | null;
}

export interface LecturerView {
  slug: string;
  name: string;
  role: string | null;
  /** טענה של המוסד, לא נבדקה. */
  institutionBio: string | null;
  /** רק מה שבדקנו בעצמנו, עם קישור למקור. */
  verifiedFacts: { text: string; sourceUrl: string }[];
  otherCoursesCount: number;
}

export type ScoreView =
  | { status: 'scored'; value: number; reviewCount: number; recommendPct: number | null; stale: boolean }
  | { status: 'not_enough_reviews'; reviewCount: number; reviewsNeeded: number }
  | { status: 'none' };

export interface CoursePageData {
  slug: string;
  title: string;
  status: Exclude<Database['public']['Enums']['course_status'], 'draft'>;
  institutionName: string;
  categoryName: string;
  categorySlug: string;
  region: string | null;
  formats: string[];
  sitePrice: number | null;
  totalHours: number | null;
  handsOnHours: number | null;
  durationMonths: number | null;
  schedule: string | null;
  nextCohortDate: string | null;
  syllabus: SyllabusItem[];
  lecturersNote: string | null;
  admission: string | null;
  classSizeNote: string | null;
  certificate: string | null;
  institutionPromises: string | null;
  videoUrl: string | null;
  summaryGood: string | null;
  summaryWeak: string | null;
  lecturers: LecturerView[];
  lecturersSummary: string | null;
  lastCheckedAt: string | null;
  score: ScoreView;
  metrics: MetricRow[];
  outcome: { n: number; mean: number } | null;
  paid: PaidRange | null;
  costPerHandsOnHour: number | null;
  /** הביקורות הראשונות שמוצגות בעמוד. */
  reviews: ReviewView[];
  /** כל הביקורות שפורסמו לקורס, לא רק אלה שבעמוד. */
  reviewTotal: number;
}

const REVIEWS_ON_PAGE = 5;

function queryError(what: string, error: { message: string }): Error {
  return new Error(`${what} query failed: ${error.message}`, { cause: error });
}

export async function getCoursePage(slug: string): Promise<CoursePageData | null> {
  const db = createPublicClient();

  // השאילתה לא תלויה בקורס, אז מתחילים אותה לפני שממתינים לקורס.
  const metricsPromise = db.from('metrics').select('key, label, sort_order').order('sort_order');

  const { data: course, error } = await db
    .from('courses')
    .select(
      'id, slug, title, status, region, formats, site_price_ils, total_hours, hands_on_hours, duration_months, schedule, next_cohort_date, syllabus, lecturers_note, admission, class_size_note, certificate, institution_promises, video_url, summary_good, summary_weak, lecturers_summary, last_checked_at, institutions(name), categories(name, slug)',
    )
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw queryError('course', error);
  if (!course) {
    await metricsPromise;
    return null;
  }

  const [scoreRes, metricsRes, reviewsRes, lecturersRes, paidRes] = await Promise.all([
    db
      .from('scores')
      .select('status, value, review_count, reviews_needed, recommend_pct, stale, per_metric')
      .eq('course_id', course.id)
      .eq('kind', 'graduate')
      .order('computed_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle(),
    metricsPromise,
    // רק הביקורות שבעמוד, עם הספירה של כולן. כך לא מושכים מאות שורות כדי להציג חמש.
    db
      .from('reviews')
      .select('id, display_name, display_mode, cohort_month, body, follow_up_text, published_at, vendor_responses(body)', {
        count: 'exact',
      })
      .eq('course_id', course.id)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(REVIEWS_ON_PAGE),
    db
      .from('course_lecturers')
      .select('role, sort_order, lecturers(slug, name, institution_bio, verified_facts, course_lecturers(count))')
      .eq('course_id', course.id)
      .order('sort_order')
      .order('lecturer_id'),
    // הסכום של כל בוגר לא חשוף. המסד מחזיר רק טווח, ורק משלוש חשבוניות.
    db.rpc('course_paid_range', { p_course_id: course.id }),
  ]);

  // שאילתה שנכשלה זורקת שגיאה. אחרת העמוד היה מציג בשקט "אין ציון" או "אין ביקורות".
  if (scoreRes.error) throw queryError('score', scoreRes.error);
  if (metricsRes.error) throw queryError('metrics', metricsRes.error);
  if (reviewsRes.error) throw queryError('reviews', reviewsRes.error);
  if (lecturersRes.error) throw queryError('lecturers', lecturersRes.error);
  if (paidRes.error) throw queryError('paid range', paidRes.error);
  const scoreRow = scoreRes.data;
  const metricDefs = metricsRes.data;
  const lecturerRows = lecturersRes.data;
  const paidRows = paidRes.data;

  const one = <T,>(ref: T | T[] | null): T | null => (Array.isArray(ref) ? (ref[0] ?? null) : ref);
  const institution = one(course.institutions as { name: string } | { name: string }[] | null);
  const category = one(course.categories as { name: string; slug: string } | { name: string; slug: string }[] | null);

  type LecturerRef = {
    slug: string;
    name: string;
    institution_bio: string | null;
    verified_facts: unknown;
    course_lecturers: { count: number }[];
  };
  const lecturers: LecturerView[] = (lecturerRows ?? [])
    .map((row) => ({ role: row.role, lecturer: one(row.lecturers as unknown as LecturerRef | LecturerRef[] | null) }))
    .filter((x): x is { role: string | null; lecturer: LecturerRef } => x.lecturer !== null)
    .map(({ role, lecturer }) => ({
      slug: lecturer.slug,
      name: lecturer.name,
      role,
      institutionBio: lecturer.institution_bio,
      // עובדה בלי טקסט או בלי קישור תקין למקור לא מוצגת: ההבטחה היא שלכל עובדה שנבדקה יש מקור.
      verifiedFacts: (Array.isArray(lecturer.verified_facts) ? (lecturer.verified_facts as unknown[]) : []).flatMap(
        (f) => {
          const fact = f as { text?: unknown; source_url?: unknown } | null;
          const sourceUrl = safeHttpUrl(fact?.source_url);
          return typeof fact?.text === 'string' && fact.text !== '' && sourceUrl
            ? [{ text: fact.text, sourceUrl }]
            : [];
        },
      ),
      // ההרשאות סופרות רק קורסים שאינם טיוטה, כולל הקורס הזה. לכן מורידים 1.
      otherCoursesCount: Math.max(0, (lecturer.course_lecturers[0]?.count ?? 1) - 1),
    }));

  let score: ScoreView = { status: 'none' };
  if (scoreRow?.status === 'scored' && scoreRow.value !== null) {
    score = {
      status: 'scored',
      value: Number(scoreRow.value),
      reviewCount: scoreRow.review_count,
      recommendPct: scoreRow.recommend_pct,
      stale: scoreRow.stale,
    };
  } else if (scoreRow?.status === 'not_enough_reviews') {
    score = {
      status: 'not_enough_reviews',
      reviewCount: scoreRow.review_count,
      reviewsNeeded: scoreRow.reviews_needed ?? 0,
    };
  }

  const perMetric = (scoreRow?.per_metric ?? {}) as Record<string, { mean: number; n: number }>;
  const valid = (key: string) => {
    const m = perMetric[key];
    return m && Number.isFinite(m.mean) && Number.isFinite(m.n) ? m : null;
  };
  const metrics: MetricRow[] = (metricDefs ?? [])
    .filter((m) => {
      const entry = valid(m.key);
      if (m.key === 'recommend' || !entry) return false;
      // תוצאה אחרי שלושה חודשים מוצגת רק מ-MIN_OUTCOME_ANSWERS תשובות.
      return m.key !== 'outcome_3m' || entry.n >= MIN_OUTCOME_ANSWERS;
    })
    .map((m) => ({ key: m.key, label: m.label, mean: perMetric[m.key].mean, n: perMetric[m.key].n }));
  const outcomeResult = valid('outcome_3m');

  const paidRow = paidRows?.[0];
  const paid: PaidRange | null = paidRow
    ? { min: paidRow.min_ils, max: paidRow.max_ils, count: paidRow.invoice_count }
    : null;

  return {
    slug: course.slug,
    title: course.title,
    status: course.status as CoursePageData['status'],
    institutionName: institution?.name ?? '',
    categoryName: category?.name ?? '',
    categorySlug: category?.slug ?? '',
    region: course.region,
    formats: course.formats,
    sitePrice: course.site_price_ils,
    totalHours: course.total_hours,
    handsOnHours: course.hands_on_hours,
    durationMonths: course.duration_months === null ? null : Number(course.duration_months),
    schedule: course.schedule,
    nextCohortDate: course.next_cohort_date,
    syllabus: (Array.isArray(course.syllabus) ? (course.syllabus as unknown as SyllabusItem[]) : [])
      .filter((i) => typeof i?.title === 'string')
      .map((i) => ({ title: i.title, weak: i.weak === true })),
    lecturersNote: course.lecturers_note,
    admission: course.admission,
    classSizeNote: course.class_size_note,
    certificate: course.certificate,
    institutionPromises: course.institution_promises,
    videoUrl: safeHttpUrl(course.video_url),
    summaryGood: course.summary_good,
    summaryWeak: course.summary_weak,
    lecturers,
    lecturersSummary: course.lecturers_summary,
    lastCheckedAt: course.last_checked_at,
    score,
    metrics,
    outcome: outcomeResult && outcomeResult.n >= MIN_OUTCOME_ANSWERS ? outcomeResult : null,
    paid,
    costPerHandsOnHour: costPerHandsOnHour(course.site_price_ils, course.hands_on_hours),
    reviewTotal: reviewsRes.count ?? 0,
    reviews: (reviewsRes.data ?? []).map((r) => ({
      id: r.id,
      // אנונימי: השם השמור אף פעם לא עובר הלאה.
      displayName: r.display_mode === 'anonymous' ? null : r.display_name,
      cohortMonth: r.cohort_month,
      body: r.body,
      followUp: r.follow_up_text,
      vendorResponse: one(r.vendor_responses as { body: string } | { body: string }[] | null)?.body ?? null,
    })),
  };
}
