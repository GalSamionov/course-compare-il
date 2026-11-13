import { createPublicClient } from '@/lib/supabase/public-client';
import { costPerHandsOnHour, type PaidRange } from '@/lib/format';

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
  displayName: string;
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

export async function getCoursePage(slug: string): Promise<CoursePageData | null> {
  const db = createPublicClient();

  const { data: course, error } = await db
    .from('courses')
    .select('*, institutions(name), categories(name, slug)')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  if (!course) return null;

  const [scoreRes, metricsRes, reviewsRes, lecturersRes, paidRes] = await Promise.all([
    db
      .from('scores')
      .select('*')
      .eq('course_id', course.id)
      .eq('kind', 'graduate')
      .order('computed_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle(),
    db.from('metrics').select('key, label, sort_order').order('sort_order'),
    // רק הביקורות שבעמוד, עם הספירה של כולן. כך לא מושכים מאות שורות כדי להציג חמש.
    db
      .from('reviews')
      .select('id, display_name, cohort_month, body, follow_up_text, published_at, vendor_responses(body)', {
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
      .order('sort_order'),
    // הסכום של כל בוגר לא חשוף. המסד מחזיר רק טווח, ורק משלוש חשבוניות.
    db.rpc('course_paid_range', { p_course_id: course.id }),
  ]);

  // שאילתה שנכשלה זורקת שגיאה. אחרת העמוד היה מציג בשקט "אין ציון" או "אין ביקורות".
  for (const res of [scoreRes, metricsRes, reviewsRes, lecturersRes, paidRes]) {
    if (res.error) throw res.error;
  }
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
      verifiedFacts: ((lecturer.verified_facts ?? []) as { text: string; source_url: string }[]).map((f) => ({
        text: f.text,
        sourceUrl: f.source_url,
      })),
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
  const metrics: MetricRow[] = (metricDefs ?? [])
    .filter((m) => m.key !== 'recommend' && perMetric[m.key])
    .map((m) => ({ key: m.key, label: m.label, mean: perMetric[m.key].mean, n: perMetric[m.key].n }));
  const outcomeResult = perMetric.outcome_3m;

  const paidRow = paidRows?.[0];
  const paid: PaidRange | null = paidRow
    ? { min: paidRow.min_ils, max: paidRow.max_ils, count: paidRow.invoice_count }
    : null;

  return {
    slug: course.slug,
    title: course.title,
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
    syllabus: (course.syllabus as unknown as SyllabusItem[]) ?? [],
    lecturersNote: course.lecturers_note,
    admission: course.admission,
    classSizeNote: course.class_size_note,
    certificate: course.certificate,
    institutionPromises: course.institution_promises,
    videoUrl: course.video_url,
    summaryGood: course.summary_good,
    summaryWeak: course.summary_weak,
    lecturers,
    lecturersSummary: course.lecturers_summary,
    lastCheckedAt: course.last_checked_at,
    score,
    metrics,
    outcome: outcomeResult && outcomeResult.n >= 3 ? outcomeResult : null,
    paid,
    costPerHandsOnHour: costPerHandsOnHour(course.site_price_ils, course.hands_on_hours),
    reviewTotal: reviewsRes.count ?? 0,
    reviews: (reviewsRes.data ?? []).map((r) => ({
      id: r.id,
      displayName: r.display_name,
      cohortMonth: r.cohort_month,
      body: r.body,
      followUp: r.follow_up_text,
      vendorResponse: one(r.vendor_responses as { body: string } | { body: string }[] | null)?.body ?? null,
    })),
  };
}
