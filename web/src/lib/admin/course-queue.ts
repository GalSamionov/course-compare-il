import 'server-only';
import { one } from '@/lib/data/shared';
import type { Json } from '@/lib/database.types';
import type { AdminDb } from './gate';
import { suggestInstitution, urlHost } from './institution-match';
import { toGroup, type CourseQueueView, type NewCourseGroup } from './new-course-groups';

export type CourseQueueKind = 'new_course' | 'field' | 'maybe_inactive' | 'fetch_failed';

/** שדה אחד בקורס חדש, כמו שהאוסף קרא אותו (decide.py, new_course: summary). */
export interface NewCourseField {
  field: string;
  value: Json;
  quote: string | null;
  confidence: string | null;
  issues: string[];
}

export interface CourseQueueItem {
  id: number;
  kind: CourseQueueKind;
  field: string | null;
  oldValue: Json | null;
  newValue: Json | null;
  /** הערך באתר עכשיו, ולא מה שהאוסף ראה כשהכניס לתור: גל אולי תיקן בינתיים. */
  currentValue: Json | null;
  quote: string | null;
  confidence: string | null;
  reasons: string[];
  createdAt: string;
  course: {
    slug: string;
    title: string;
    status: string;
    institutionName: string;
    categoryName: string;
  } | null;
  pageUrl: string | null;
  pageError: string | null;
  /** רק בקורס חדש. */
  newFields: NewCourseField[];
  /** רק בקורס חדש, ברשימה מסוננת: למה הוא לא בטוח לאישור בבת אחת (מהמסד). */
  causes: string[];
}

type CourseRef = {
  slug: string;
  title: string;
  status: string;
  institutions: { name: string } | { name: string }[] | null;
  categories: { name: string } | { name: string }[] | null;
} & Record<string, unknown>;

type PageRef = { url: string; last_error: string | null };

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function newCourseFields(value: Json | null): NewCourseField[] {
  if (!isObject(value)) return [];
  return Object.entries(value).flatMap(([field, item]) => {
    if (!isObject(item)) return [];
    return [
      {
        field,
        value: (item.value ?? null) as Json,
        quote: typeof item.quote === 'string' && item.quote ? item.quote : null,
        confidence: typeof item.confidence === 'string' ? item.confidence : null,
        issues: Array.isArray(item.issues) ? item.issues.filter((i): i is string => typeof i === 'string') : [],
      },
    ];
  });
}

/** כל השדות של הקורס שהתור צריך: השדה שהשתנה, לערך הנוכחי. */
const COURSE_COLUMNS =
  'slug, title, status, site_price_ils, total_hours, lecture_hours, hands_on_hours, duration_months, schedule, formats, region, time_slots, next_cohort_date, syllabus, admission, class_size_note, certificate, institution_promises, video_url, institutions(name), categories(name)';

/**
 * כמה פריטים בעמוד: החלק העליון של הערימה. ריצה ראשונה של מוסד מכניסה עשרות קורסים חדשים, ועמוד עם כולם
 * כבד לטעינה ולסריקה. אחרי כל החלטה הפריט יורד, והבא בתור עולה.
 */
export const COURSE_QUEUE_PAGE = 30;

/**
 * מה שממתין, חוץ מקורסים חדשים: שינוי בשדה, קורס שנעלם ודף שלא נטען. הישן ראשון (מסמך העיצוב, סעיף 10,
 * "קורסים לאישור"). קורסים חדשים מוצגים לפי מוסד (loadNewCourseGroups), כי ריצה ראשונה מכניסה מאות.
 * total: כמה ממתינים בסך הכול, כולל קורסים חדשים. others: כמה מהם אינם קורסים חדשים.
 */
export async function loadCourseQueue(db: AdminDb): Promise<{ items: CourseQueueItem[]; total: number; others: number }> {
  const [{ data, error }, countRes, othersRes] = await Promise.all([
    loadCourseQueueRows(db),
    db.from('course_change_queue').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    db
      .from('course_change_queue')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .neq('kind', 'new_course'),
  ]);
  if (error) throw new Error(`course queue: ${error.message}`);
  if (countRes.error) throw new Error(`course queue count: ${countRes.error.message}`);
  if (othersRes.error) throw new Error(`course queue count: ${othersRes.error.message}`);
  return {
    items: data.map(toQueueItem),
    total: countRes.count ?? data.length,
    others: othersRes.count ?? data.length,
  };
}

/** כל השדות של פריט בתור, עם הקורס והדף. */
function queueRows(db: AdminDb) {
  return db
    .from('course_change_queue')
    .select(
      `id, kind, field, old_value, new_value, quote, confidence, reasons, created_at, courses(${COURSE_COLUMNS}), scrape_pages(url, last_error)`,
    );
}

function loadCourseQueueRows(db: AdminDb) {
  return queueRows(db)
    .eq('status', 'pending')
    .neq('kind', 'new_course')
    .order('created_at', { ascending: true })
    .order('id', { ascending: true })
    .limit(COURSE_QUEUE_PAGE);
}

/** הקורסים החדשים בתור, שורה לכל מוסד. הסיכום נעשה במסד: העמוד לא טוען מאות פריטים. */
export async function loadNewCourseGroups(db: AdminDb): Promise<NewCourseGroup[]> {
  const { data, error } = await db.rpc('course_queue_new_course_groups');
  if (error) throw new Error(`new course groups: ${error.message}`);
  return data.map(toGroup);
}

/**
 * רשימה מסוננת של קורסים חדשים (לא בטוחים, או חשד לכפילות), אולי של מוסד אחד: עד COURSE_QUEUE_PAGE
 * הראשונים, בממשק הרגיל של פריט בתור. המסד בוחר ומסדר, וכאן נטענים רק הפריטים שבעמוד.
 */
export async function loadNewCourseItems(
  db: AdminDb,
  view: CourseQueueView,
): Promise<{ items: CourseQueueItem[]; total: number }> {
  const { data: picked, error } = await db.rpc('course_queue_new_course_items', {
    p_filter: view.filter === 'duplicates' ? 'duplicates' : 'unsafe',
    ...(view.institutionId ? { p_institution_id: view.institutionId } : {}),
    p_limit: COURSE_QUEUE_PAGE,
  });
  if (error) throw new Error(`new course items: ${error.message}`);
  if (picked.length === 0) return { items: [], total: 0 };
  const { data, error: rowsError } = await queueRows(db).in(
    'id',
    picked.map((p) => p.queue_id),
  );
  if (rowsError) throw new Error(`new course items: ${rowsError.message}`);
  const rows = new Map(data.map((row) => [row.id, row]));
  return {
    // הסדר של המסד: בכפילויות, הפריטים של אותה קבוצה זה ליד זה.
    items: picked.flatMap((p) => {
      const row = rows.get(p.queue_id);
      return row ? [{ ...toQueueItem(row), causes: p.causes }] : [];
    }),
    total: Number(picked[0].total),
  };
}

type QueueRow = NonNullable<Awaited<ReturnType<typeof loadCourseQueueRows>>['data']>[number];

function toQueueItem(row: QueueRow): CourseQueueItem {
  const course = one(row.courses as unknown as CourseRef | CourseRef[] | null);
  const page = one(row.scrape_pages as unknown as PageRef | PageRef[] | null);
  const kind = row.kind as CourseQueueKind;
  return {
    id: row.id,
    kind,
    field: row.field,
    oldValue: row.old_value,
    newValue: row.new_value,
    currentValue: course && row.field ? ((course[row.field] ?? null) as Json) : null,
    quote: row.quote,
    confidence: row.confidence,
    reasons: row.reasons,
    createdAt: row.created_at,
    course: course
      ? {
          slug: course.slug,
          title: course.title,
          status: course.status,
          institutionName: one(course.institutions)?.name ?? '',
          categoryName: one(course.categories)?.name ?? '',
        }
      : null,
    pageUrl: page?.url ?? null,
    pageError: page?.last_error ?? null,
    newFields: kind === 'new_course' ? newCourseFields(row.new_value) : [],
    causes: [],
  };
}

export interface ScrapeRunReport {
  id: number;
  startedAt: string;
  finishedAt: string | null;
  status: 'running' | 'completed' | 'aborted' | 'failed';
  trigger: string;
  abortReason: string | null;
  pagesChecked: number;
  pagesUnchanged: number;
  pagesChanged: number;
  pagesNew: number;
  pagesFailed: number;
  pagesSkipped: number;
  changesAuto: number;
  changesQueued: number;
  coursesMissing: number;
  /** לכל מוסד: מה נמצא ומה נכשל (run.py, report["institutions"]). */
  institutions: { slug: string; discovered: number | null; checked: number | null; failed: number | null; errors: string[] }[];
  skipped: { slug: string; reason: string }[];
}

const num = (value: unknown) => (typeof value === 'number' ? value : null);

/** דוח הריצה האחרונה של האוסף (סעיף 5, "סיכום הריצה"). null: עוד לא הייתה ריצה. */
export async function loadLatestRun(db: AdminDb): Promise<ScrapeRunReport | null> {
  const { data, error } = await db
    .from('scrape_runs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`latest run: ${error.message}`);
  if (!data) return null;
  const report = isObject(data.report) ? data.report : {};
  const institutions = isObject(report.institutions) ? report.institutions : {};
  const skipped = isObject(report.skipped_institutions) ? report.skipped_institutions : {};
  return {
    id: data.id,
    startedAt: data.started_at,
    finishedAt: data.finished_at,
    status: data.status as ScrapeRunReport['status'],
    trigger: data.trigger,
    abortReason: data.abort_reason,
    pagesChecked: data.pages_checked,
    pagesUnchanged: data.pages_unchanged,
    pagesChanged: data.pages_changed,
    pagesNew: data.pages_new,
    pagesFailed: data.pages_failed,
    pagesSkipped: data.pages_skipped,
    changesAuto: data.changes_auto,
    changesQueued: data.changes_queued,
    coursesMissing: data.courses_missing,
    institutions: Object.entries(institutions)
      .map(([slug, item]) => {
        const entry = isObject(item) ? item : {};
        const errors = Array.isArray(entry.errors) ? entry.errors.filter((e): e is string => typeof e === 'string') : [];
        if (typeof entry.error === 'string') errors.unshift(entry.error);
        return {
          slug,
          discovered: num(entry.discovered),
          checked: num(entry.pages_checked),
          failed: num(entry.pages_failed),
          errors,
        };
      })
      .sort((a, b) => a.slug.localeCompare(b.slug)),
    skipped: Object.entries(skipped).map(([slug, reason]) => ({ slug, reason: String(reason) })),
  };
}

export interface JoinRequest {
  id: number;
  institutionName: string;
  courseUrl: string;
  host: string;
  contactEmail: string | null;
  createdAt: string;
  /** המוסד שהאתר שלו באותו מארח. רק הצעה: גל בוחר. */
  suggestedInstitutionId: string | null;
  /** הקישור כבר מוכר לאוסף (דף שנמצא, או קורס עם אותה כתובת). */
  knownPage: boolean;
}

export interface InstitutionOption {
  id: string;
  name: string;
  host: string | null;
}

/** הבקשות של מוסדות שממתינות, הישנה ראשונה, והמוסדות שאפשר לשייך אליהם קישור (רק עם אתר). */
export async function loadJoinRequests(db: AdminDb): Promise<{ requests: JoinRequest[]; institutions: InstitutionOption[] }> {
  const [requestsRes, institutionsRes] = await Promise.all([
    db
      .from('institution_requests')
      .select('id, institution_name, course_url, contact_email, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: true }),
    db.from('institutions').select('id, name, website').not('website', 'is', null).order('name'),
  ]);
  if (requestsRes.error) throw new Error(`join requests: ${requestsRes.error.message}`);
  if (institutionsRes.error) throw new Error(`institutions: ${institutionsRes.error.message}`);
  const institutions = institutionsRes.data.map((i) => ({ id: i.id, name: i.name, host: urlHost(i.website) }));
  const withSites = institutionsRes.data;
  const urls = requestsRes.data.map((r) => r.course_url);
  const [pagesRes, coursesRes] = urls.length
    ? await Promise.all([
        db.from('scrape_pages').select('url').in('url', urls),
        db.from('courses').select('page_url').in('page_url', urls),
      ])
    : [{ data: [], error: null }, { data: [], error: null }];
  const known = new Set([
    ...(pagesRes.data ?? []).map((p) => p.url),
    ...(coursesRes.data ?? []).flatMap((c) => (c.page_url ? [c.page_url] : [])),
  ]);
  return {
    institutions,
    requests: requestsRes.data.map((r) => {
      const host = urlHost(r.course_url) ?? '';
      return {
        id: r.id,
        institutionName: r.institution_name,
        courseUrl: r.course_url,
        host,
        contactEmail: r.contact_email,
        createdAt: r.created_at,
        suggestedInstitutionId: suggestInstitution({ institutionName: r.institution_name, courseUrl: r.course_url }, withSites),
        knownPage: known.has(r.course_url),
      };
    }),
  };
}
