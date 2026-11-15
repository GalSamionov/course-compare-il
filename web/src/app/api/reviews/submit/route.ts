import type { NextRequest } from 'next/server';
import { one } from '@/lib/data/shared';
import type { Json } from '@/lib/database.types';
import { PROOF_BUCKET, isProofPathOf, mimeOfPath, sha256Hex, sniffMime } from '@/lib/reviews/files';
import { compareProof, type CheckResult, type ProofExpectations } from '@/lib/reviews/proof-check';
import { fitsForCheck, readProof } from '@/lib/reviews/proof-llm';
import { proofErrors, questionsFor, stepErrors, thisMonthOf, type DraftFields, type MetricDef } from '@/lib/reviews/steps';
import { MAX_PROOF_BYTES, MAX_PROOF_FILES, isUploadKind, isUuid, type CourseType, type ProofKind, type ProofMime } from '@/lib/reviews/types';
import { readCapped } from '@/lib/server/read-capped';
import { fromThisSite } from '@/lib/server/same-origin';
import { createAdminClient } from '@/lib/supabase/admin-client';
import { createServerSupabase } from '@/lib/supabase/server-client';

/** שני קבצים, כל אחד עם עד 25 שניות של בדיקה, במקביל. */
export const maxDuration = 60;

/**
 * כמה הוכחות של כותב אחד נבדקות במודל ב-24 שעות, לפי ההזמנות ב-proof_check_usage.
 * מעבר לזה הן נכנסות לתור בלי בדיקה מוקדמת.
 */
const CHECKS_PER_AUTHOR_PER_DAY = 6;
/** כל גוף הבקשה, בבתים: מזהה ושני נתיבים, עם מרווח. */
const MAX_BODY_BYTES = 2_000;

type SubmitError =
  | 'forbidden'
  | 'signed_out'
  | 'not_configured'
  | 'bad_request'
  | 'not_draft'
  | 'changed'
  | 'incomplete'
  | 'file_missing'
  | 'bad_file'
  | 'failed';

function fail(error: SubmitError, status: number, extra: Record<string, string> = {}): Response {
  return Response.json({ error, ...extra }, { status });
}

interface FileRequest {
  path: string;
  kind: ProofKind;
}

interface LoadedFile extends FileRequest {
  bytes: Uint8Array;
  mime: ProofMime;
  size: number;
  sha256: string;
}

interface Check {
  status: 'checked' | 'not_checked' | 'failed';
  result: CheckResult;
}

type CourseRef = {
  id: string;
  title: string;
  site_price_ils: number | null;
  institutions: { name: string; business_number: string | null } | { name: string; business_number: string | null }[] | null;
  categories: { course_type: CourseType } | { course_type: CourseType }[] | null;
};

/** מהדפדפן מגיעים רק המזהה, הנתיבים והסוג שנבחר לכל קובץ. כל השאר נקרא מהמסד ומהאחסון. */
function parseBody(raw: string): { reviewId: string; files: FileRequest[] } | null {
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return null;
  }
  const { reviewId, files } = (body ?? {}) as { reviewId?: unknown; files?: unknown };
  if (!isUuid(reviewId) || !Array.isArray(files) || files.length === 0 || files.length > MAX_PROOF_FILES) return null;
  const parsed: FileRequest[] = [];
  for (const file of files) {
    const { path, kind } = (file ?? {}) as { path?: unknown; kind?: unknown };
    if (typeof path !== 'string' || typeof kind !== 'string' || !isUploadKind(kind)) return null;
    parsed.push({ path, kind });
  }
  return { reviewId, files: parsed };
}

/**
 * כמה בדיקות מותרות עכשיו. ההזמנה נרשמת במסד לפני הקריאה למודל (take_proof_checks, בנעילה לכל כותב),
 * ולכן שליחות במקביל, או שליחה שנכשלת אחר כך (למשל 40001), לא עוקפות את המכסה.
 * כשההזמנה נכשלת: אפס (נכשל סגור), ושום קובץ לא נשלח למודל.
 */
async function takeChecks(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  want: number,
): Promise<number | 'error'> {
  if (want === 0) return 0;
  const { data, error } = await admin.rpc('take_proof_checks', {
    p_author_id: userId,
    p_want: want,
    p_per_day: CHECKS_PER_AUTHOR_PER_DAY,
  });
  if (error || typeof data !== 'number') {
    console.error('proof check quota:', error?.message ?? 'no number returned');
    return 'error';
  }
  return Math.max(0, Math.min(want, data));
}

/**
 * בדיקה של מודל השפה: פעם אחת לכל שליחה, לכל קובץ במקביל. בלי מפתח, מעל המכסה, לקובץ גדול,
 * או כשהמודל נכשל: "לא נבדק אוטומטית", והביקורת נכנסת לתור בכל זאת (מסמך העיצוב, סעיף 4).
 */
async function checkProofs(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  files: readonly LoadedFile[],
  expected: Omit<ProofExpectations, 'claimedKind'>,
): Promise<Check[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return files.map(() => ({ status: 'not_checked', result: { skipped: 'no_key' } }));

  // רק קבצים שנכנסים בגבולות נשלחים, ורק הם נספרים במכסה.
  const fits = files.map(fitsForCheck);
  const granted = await takeChecks(admin, userId, fits.filter(Boolean).length);
  // מי נבדק נקבע מראש, לפי הסדר, לפני שאף קריאה יוצאת.
  let left = granted === 'error' ? 0 : granted;
  const plan = fits.map((fit): 'check' | 'too_large' | 'quota' | 'error' => {
    if (!fit) return 'too_large';
    if (granted === 'error') return 'error';
    if (left <= 0) return 'quota';
    left -= 1;
    return 'check';
  });

  return Promise.all(
    files.map(async (file, i): Promise<Check> => {
      const step = plan[i];
      if (step === 'too_large' || step === 'quota') return { status: 'not_checked', result: { skipped: step } };
      if (step === 'error') return { status: 'failed', result: { skipped: 'error' } };
      try {
        const found = await readProof(apiKey, file);
        return { status: 'checked', result: { found, mismatches: compareProof(found, { ...expected, claimedKind: file.kind }) } };
      } catch (checkError) {
        // רק ההודעה נרשמת ביומן. שום דבר מהקובץ.
        console.error('proof check failed:', checkError instanceof Error ? checkError.message : 'unknown error');
        return { status: 'failed', result: { skipped: 'error' } };
      }
    }),
  );
}

/**
 * POST /api/reviews/submit עם { reviewId, files: [{ path, kind }] }.
 * הסדר: מאיפה הבקשה, מי שולח, המפתח הסודי, הגוף, הביקורת והצעדים מהמסד, הקבצים מהאחסון,
 * טביעה ובדיקה, ורק אז submit_review(), שמעבירה לבדיקה ומסמנת כפילות וקצב בטרנזקציה אחת.
 */
export async function POST(request: NextRequest) {
  if (!fromThisSite(request)) return fail('forbidden', 403);

  const supabase = await createServerSupabase();
  // getUser בודק את ההתחברות מול Supabase, ולא רק את העוגייה.
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) return fail('signed_out', 401);
  const userId = auth.user.id;

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    // SUPABASE_SECRET_KEY חסר (למשל ב-Vercel, לפני שגל הוסיף אותו). הטיוטה נשארת כמו שהיא.
    return fail('not_configured', 503);
  }

  // נקרא עד הגבול ולא יותר: גוף גדול נעצר לפני שהוא כולו בזיכרון.
  const raw = await readCapped(request, MAX_BODY_BYTES);
  if (raw === null) return fail('bad_request', 400);
  const input = parseBody(raw);
  if (
    !input ||
    new Set(input.files.map((f) => f.path)).size !== input.files.length ||
    !input.files.every((f) => isProofPathOf(f.path, userId, input.reviewId))
  ) {
    return fail('bad_request', 400);
  }

  const [reviewRes, metricsRes] = await Promise.all([
    admin
      .from('reviews')
      .select(
        'id, author_id, status, cohort_month, finished_month, body, display_name, display_mode, author_title, review_answers(metric_key, value), courses(id, title, site_price_ils, institutions(name, business_number), categories(course_type))',
      )
      .eq('id', input.reviewId)
      .maybeSingle(),
    admin.from('metrics').select('key, label, scale, course_types, sort_order'),
  ]);
  if (reviewRes.error || metricsRes.error) {
    console.error('submit: loading the review failed', (reviewRes.error ?? metricsRes.error)?.message);
    return fail('failed', 500);
  }
  const review = reviewRes.data;
  if (!review || review.author_id !== userId || review.status !== 'draft') return fail('not_draft', 409);

  const course = one(review.courses as unknown as CourseRef | CourseRef[] | null);
  const institution = one(course?.institutions ?? null);
  // קורס שבוגר הוסיף מקישור יכול להיות טיוטה בלי תחום. אז השאלון לפי הסוג שהבוגר בחר (course_link_type).
  let courseType = one(course?.categories ?? null)?.course_type ?? null;
  if (course && !courseType) {
    const { data: linked } = await admin.rpc('course_link_type', { p_course_id: course.id });
    courseType = linked ?? null;
  }
  if (!course || !institution || !courseType) return fail('failed', 500);

  // אותה בדיקה של הצעדים שהדפדפן הריץ, על מה שבאמת שמור במסד.
  const draft: DraftFields = {
    cohortMonth: review.cohort_month,
    finishedMonth: review.finished_month,
    answers: Object.fromEntries(review.review_answers.map((a) => [a.metric_key, a.value])),
    body: review.body,
    displayMode: review.display_mode,
    displayName: review.display_name,
    authorTitle: review.author_title,
  };
  const ctx = {
    questions: questionsFor(courseType, metricsRes.data as MetricDef[]),
    thisMonth: thisMonthOf(new Date()),
  };
  for (const step of ['when', 'questions', 'words', 'name'] as const) {
    if (stepErrors(step, draft, ctx).length > 0) return fail('incomplete', 400, { step });
  }

  // הקבצים מהאחסון, עם המפתח הסודי. הסוג לפי הבתים, והגודל לפי מה שהגיע בפועל.
  const files: LoadedFile[] = [];
  for (const file of input.files) {
    const { data, error } = await admin.storage.from(PROOF_BUCKET).download(file.path);
    // קובץ שהועלה לפני יותר מיום ולא נשלח נמחק בניקוי. הכותב מעלה שוב.
    if (error || !data) return fail('file_missing', 400);
    const bytes = new Uint8Array(await data.arrayBuffer());
    const mime = sniffMime(bytes);
    if (!mime || mime !== mimeOfPath(file.path) || bytes.length > MAX_PROOF_BYTES) return fail('bad_file', 400);
    files.push({ ...file, bytes, mime, size: bytes.length, sha256: sha256Hex(bytes) });
  }
  if (proofErrors(files).length > 0) return fail('incomplete', 400, { step: 'proof' });

  const checks = await checkProofs(admin, userId, files, {
    institutionName: institution.name,
    businessNumber: institution.business_number,
    cohortMonth: review.cohort_month,
    finishedMonth: review.finished_month,
    sitePrice: course.site_price_ils,
    displayName: review.display_name,
    displayMode: review.display_mode,
  });

  const { error: submitError } = await admin.rpc('submit_review', {
    p_review_id: input.reviewId,
    p_author_id: userId,
    p_proofs: files.map((file, i) => ({
      path: file.path,
      sha256: file.sha256,
      kind: file.kind,
      mime: file.mime,
      size: file.size,
      check_status: checks[i].status,
      check_result: checks[i].result,
    })) as unknown as Json,
    // בדיוק מה שנבדק בצעדים ונשלח למודל. המסד משווה לטיוטה אחרי שנעל אותה.
    p_validated: {
      cohort_month: draft.cohortMonth,
      finished_month: draft.finishedMonth,
      body: draft.body,
      display_name: draft.displayName,
      display_mode: draft.displayMode,
      author_title: draft.authorTitle,
      answers: draft.answers,
    },
  });
  if (submitError) {
    // P0002: הביקורת כבר לא טיוטה, למשל שליחה כפולה מאותו דף.
    if (submitError.code === 'P0002') return fail('not_draft', 409);
    // 40001: הכותב שינה את הטיוטה בזמן הבדיקה (למשל בלשונית אחרת). שום דבר לא נשלח.
    if (submitError.code === '40001') return fail('changed', 409);
    console.error('submit_review failed', submitError.message);
    return fail('failed', 500);
  }
  return Response.json({ ok: true });
}
