import type { PostgrestError } from '@supabase/supabase-js';
import { createBrowserSupabase } from '@/lib/supabase/browser-client';
import { FILE_REJECTED, checkFile } from './steps';
import {
  PROOF_EXTENSION,
  isProofMime,
  isUploadKind,
  type AuthorTitle,
  type DisplayMode,
  type ProofKind,
  type ProofMime,
  type ReviewStatus,
} from './types';

/** ביקורת של המשתמש המחובר, עם מה שרק הוא רואה (my_reviews). */
export interface MyReview {
  id: string;
  courseId: string;
  status: ReviewStatus;
  cohortMonth: string;
  finishedMonth: string | null;
  body: string;
  displayName: string;
  displayMode: DisplayMode;
  authorTitle: AuthorTitle;
  /** ההודעה של גל, כשהביקורת חזרה לטיוטה. */
  decisionNote: string | null;
  readCount: number;
  helpfulCount: number;
  updatedAt: string;
  submittedAt: string | null;
  publishedAt: string | null;
  answers: Record<string, number>;
}

function toAnswers(value: unknown): Record<string, number> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, number] => typeof entry[1] === 'number'));
}

/** כל הביקורות של המשתמש המחובר, מהחדשה לישנה. השדות שיכולים להיות null מטופלים ככאלה גם אם הטיפוסים לא אומרים. */
export async function loadMyReviews(): Promise<MyReview[]> {
  const { data, error } = await createBrowserSupabase().rpc('my_reviews');
  if (error) throw error;
  // `?? null`: הטיפוסים שנוצרים ל-my_reviews מסמנים את finished_month, decision_note, submitted_at ו-published_at
  // כלא-null (משימה 1, צעד 9), אבל המסד מחזיר בהם null.
  return (data ?? []).map((row) => ({
    id: row.id,
    courseId: row.course_id,
    status: row.status,
    cohortMonth: row.cohort_month,
    finishedMonth: row.finished_month ?? null,
    body: row.body,
    displayName: row.display_name,
    displayMode: row.display_mode,
    authorTitle: row.author_title,
    decisionNote: row.decision_note ?? null,
    readCount: row.read_count,
    helpfulCount: row.helpful_count,
    updatedAt: row.updated_at,
    submittedAt: row.submitted_at ?? null,
    publishedAt: row.published_at ?? null,
    answers: toAnswers(row.answers),
  }));
}

/** קורס שהמשתמש הוסיף מקישור, ועדיין טיוטה (my_course_links). קורס שאושר כבר בקטלוג. */
export interface MyCourseLink {
  courseId: string;
  title: string;
  institutionName: string;
  status: 'pending' | 'rejected';
  decisionReason: string | null;
}

export async function loadMyCourseLinks(): Promise<MyCourseLink[]> {
  const { data, error } = await createBrowserSupabase().rpc('my_course_links');
  if (error) throw error;
  return (data ?? []).flatMap((row) =>
    row.status === 'pending' || row.status === 'rejected'
      ? [
          {
            courseId: row.course_id,
            title: row.course_title,
            institutionName: row.institution_name,
            status: row.status,
            decisionReason: row.decision_reason ?? null,
          },
        ]
      : [],
  );
}

/** 'duplicate': כבר יש ביקורת של המשתמש על אותו קורס ומחזור (reviews_one_per_cohort). */
export type SaveResult = 'ok' | 'duplicate' | 'error';

const saveResult = (error: PostgrestError | null): SaveResult =>
  !error ? 'ok' : error.code === '23505' ? 'duplicate' : 'error';

/** צעד 1 בפעם הראשונה: הטיוטה נוצרת. המסד מתיר רק טיוטה, רק בשם המשתמש, ורק לקורס שאינו טיוטה. */
export async function startDraft(input: {
  courseId: string;
  authorId: string;
  cohortMonth: string;
  finishedMonth: string | null;
}): Promise<{ id: string } | { error: 'duplicate' | 'error' }> {
  const { data, error } = await createBrowserSupabase()
    .from('reviews')
    .insert({
      course_id: input.courseId,
      author_id: input.authorId,
      cohort_month: input.cohortMonth,
      finished_month: input.finishedMonth,
    })
    .select('id')
    .single();
  if (error) return { error: saveResult(error) === 'duplicate' ? 'duplicate' : 'error' };
  return { id: data.id };
}

/** שמירה של צעד. רק העמודות שהמסד מתיר לכותב, ורק בטיוטה: אחרת אף שורה לא משתנה, וזו שגיאה. */
export async function saveFields(
  reviewId: string,
  fields: {
    cohort_month?: string;
    finished_month?: string | null;
    body?: string;
    display_name?: string;
    display_mode?: DisplayMode;
    author_title?: AuthorTitle;
  },
): Promise<SaveResult> {
  const { data, error } = await createBrowserSupabase().from('reviews').update(fields).eq('id', reviewId).select('id');
  if (error) return saveResult(error);
  return data.length === 1 ? 'ok' : 'error';
}

export async function saveAnswers(reviewId: string, answers: Record<string, number>): Promise<SaveResult> {
  const rows = Object.entries(answers).map(([metric_key, value]) => ({ review_id: reviewId, metric_key, value }));
  if (rows.length === 0) return 'ok';
  const { error } = await createBrowserSupabase()
    .from('review_answers')
    .upsert(rows, { onConflict: 'review_id,metric_key' });
  return saveResult(error);
}

/** הוכחה שכבר באחסון, ועוד לא נשלחה. נשמרת בדפדפן עד השליחה: עוד אין לה שורה במסד. */
export interface AttachedProof {
  path: string;
  kind: ProofKind;
  name: string;
  size: number;
  mime: ProofMime;
}

const attachedKey = (reviewId: string) => `review-proofs:v1:${reviewId}`;

export function readAttached(reviewId: string): AttachedProof[] {
  try {
    const data: unknown = JSON.parse(window.localStorage.getItem(attachedKey(reviewId)) ?? '[]');
    if (!Array.isArray(data)) return [];
    return data.filter((item): item is AttachedProof => {
      const p = item as Partial<AttachedProof> | null;
      return (
        typeof p?.path === 'string' &&
        typeof p.kind === 'string' &&
        isUploadKind(p.kind) &&
        typeof p.name === 'string' &&
        typeof p.size === 'number' &&
        typeof p.mime === 'string' &&
        isProofMime(p.mime)
      );
    });
  } catch {
    return [];
  }
}

export function writeAttached(reviewId: string, proofs: readonly AttachedProof[]) {
  try {
    if (proofs.length === 0) window.localStorage.removeItem(attachedKey(reviewId));
    else window.localStorage.setItem(attachedKey(reviewId), JSON.stringify(proofs));
  } catch {
    // גלישה פרטית או אחסון חסום: הרשימה נשארת בזיכרון של הדף בלבד.
  }
}

export type UploadResult = { ok: true; proof: AttachedProof } | { ok: false; message: string };

/**
 * ישר מהדפדפן לאחסון, בלי לעבור ב-Vercel (גוף בקשה שם מוגבל ל-4.5MB). המדיניות של האחסון מתירה רק
 * להעלות, ורק לתיקייה של המשתמש: '<uid>/<reviewId>/<uuid>.<סיומת>'. קובץ גדול או מסוג אחר נעצר כאן, לפני ההעלאה.
 */
export async function uploadProof(userId: string, reviewId: string, file: File, kind: ProofKind): Promise<UploadResult> {
  const mime = file.type;
  if (checkFile(file) || !isProofMime(mime)) return { ok: false, message: FILE_REJECTED };
  const path = `${userId}/${reviewId}/${crypto.randomUUID()}.${PROOF_EXTENSION[mime]}`;
  const { error } = await createBrowserSupabase()
    .storage.from('proofs')
    // cacheControl '0': הקישור הזמני של גל לא משאיר את ההוכחה במטמון של הדפדפן שלו (ברירת המחדל: שעה).
    .upload(path, file, { contentType: mime, upsert: false, cacheControl: '0' });
  if (error) return { ok: false, message: FILE_REJECTED };
  return { ok: true, proof: { path, kind, name: file.name.slice(0, 120), size: file.size, mime } };
}

export type SubmitResult =
  | 'ok'
  | 'not_configured'
  | 'file_missing'
  | 'bad_file'
  | 'incomplete'
  | 'signed_out'
  | 'not_draft'
  | 'course_closed'
  | 'changed'
  | 'error';

const KNOWN: readonly SubmitResult[] = [
  'not_configured',
  'file_missing',
  'bad_file',
  'incomplete',
  'signed_out',
  'not_draft',
  'course_closed',
  'changed',
];

/** מה הכותב רואה כשהשליחה נכשלה. בכל מקרה הטיוטה נשארת שמורה. */
export const SUBMIT_MESSAGE: Record<Exclude<SubmitResult, 'ok'>, string> = {
  not_configured: 'שליחה לבדיקה עוד לא פתוחה באתר. הטיוטה שמורה, ואפשר לחזור אליה.',
  file_missing: 'הקובץ כבר לא אצלנו. העלו אותו שוב, ושלחו.',
  bad_file: 'הקובץ לא נפתח כ-JPG, PNG או PDF. העלו קובץ אחר.',
  incomplete: 'חסר משהו באחד הצעדים. חזרנו אליו.',
  signed_out: 'ההתחברות פגה. התחברו שוב, והטיוטה תחכה.',
  not_draft: 'הביקורת כבר נשלחה לבדיקה.',
  course_closed: 'הקורס הזה לא נוסף לאתר, ולכן אי אפשר לשלוח עליו ביקורת.',
  changed: 'הטיוטה השתנתה בזמן השליחה. נסו לשלוח שוב.',
  error: 'לא הצלחנו לשלוח. הטיוטה שמורה. נסו שוב בעוד דקה.',
};

/** שליחה לבדיקה. רק המזהה, הנתיבים והסוג נשלחים: השרת קורא את כל השאר בעצמו. */
export async function submitReview(reviewId: string, proofs: readonly AttachedProof[]): Promise<SubmitResult> {
  try {
    const response = await fetch('/api/reviews/submit', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ reviewId, files: proofs.map(({ path, kind }) => ({ path, kind })) }),
    });
    if (response.ok) return 'ok';
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    const code = body?.error as SubmitResult | undefined;
    return code && KNOWN.includes(code) ? code : 'error';
  } catch {
    return 'error';
  }
}

/** מחיקה של ביקורת שלי, בכל מצב. ביקורת שפורסמה יוצאת גם מהציון. */
export async function deleteReview(reviewId: string): Promise<'ok' | 'not_configured' | 'error'> {
  try {
    const response = await fetch('/api/reviews/delete', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ reviewId }),
    });
    if (response.ok) return 'ok';
    return response.status === 503 ? 'not_configured' : 'error';
  } catch {
    return 'error';
  }
}
