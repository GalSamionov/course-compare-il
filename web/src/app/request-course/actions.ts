'use server';

import { createHmac } from 'node:crypto';
import { headers } from 'next/headers';
import { runAdCheck } from '@/lib/ad-check/check';
import type { AdCheckResult } from '@/lib/ad-check/quotes';
import { adCheckDeps, verifiedReviewCount } from '@/lib/ad-check/server';
import { parseCourseRequestForm, type RequestField } from '@/lib/course-links/form';
import { EXPECTED_SUBMIT_CODES, submitMessage } from '@/lib/course-links/messages';
import { formatHebrewDate } from '@/lib/format';
import { createAdminClient } from '@/lib/supabase/admin-client';

/** מה קרה לבקשה עצמה ("בקשו שנבדוק קורס"), ליד תוצאת הבדיקה. */
export type RequestOutcome =
  | { kind: 'sent' }
  | { kind: 'existing'; slug: string; title: string; verifiedReviews: number | null }
  /** הבקשה לא נשמרה (מגבלה או תקלה). ההודעה בעברית, משלנו. */
  | { kind: 'failed'; message: string };

/** מה יצא מבדיקת הדף. checkedOn: התאריך, כבר בעברית. */
export type CheckView =
  | { kind: 'result'; result: AdCheckResult; checkedOn: string }
  | { kind: 'social' }
  | { kind: 'quota' }
  | { kind: 'unreadable' };

export type RequestState =
  | { status: 'idle' }
  | { status: 'invalid'; errors: Partial<Record<RequestField, string>>; message?: string }
  | { status: 'sent' }
  | { status: 'existing'; slug: string; title: string }
  | { status: 'checked'; url: string; request: RequestOutcome; check: CheckView };

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

type Db = ReturnType<typeof createAdminClient>;

/** הבקשה, דרך submit_course_request: 3 ביממה לכל כתובת, 50 בסך הכול. קורס שכבר באתר חוזר עם הקישור אליו. */
async function submitRequest(
  db: Db,
  values: { url: string; name: string | null; note: string | null },
  clientHash: string,
): Promise<RequestOutcome> {
  const { data, error } = await db.rpc('submit_course_request', {
    p_url: values.url,
    // null של PostgREST מגיע ל-SQL כ-NULL: בלי שם ובלי הערה.
    p_name: values.name as string,
    p_note: values.note as string,
    p_client_hash: clientHash,
  });
  if (error) {
    if (!EXPECTED_SUBMIT_CODES.includes(error.code)) console.error('course request failed', error.code);
    return { kind: 'failed', message: submitMessage(error.code) };
  }
  const result = (data ?? {}) as { outcome?: unknown; course_slug?: unknown; course_title?: unknown };
  if (result.outcome === 'existing' && typeof result.course_slug === 'string' && SLUG.test(result.course_slug)) {
    return { kind: 'existing', slug: result.course_slug, title: String(result.course_title ?? ''), verifiedReviews: null };
  }
  return { kind: 'sent' };
}

/**
 * "בקשו שנבדוק קורס" (/request-course): כל אחד, בלי התחברות. לאורח אין שום הרשאה: הכתיבה עוברת כאן, עם המפתח
 * הסודי. Next בודק ש-Origin תואם ל-Host (server-actions.md, Security). שדה המלכודת עוצר בוטים פשוטים.
 *
 * עם ANTHROPIC_API_KEY ו-check=1 בטופס, זו גם בדיקת הקישור (docs/superpowers/specs/2026-11-15-ad-check-design.md):
 * הבקשה נשמרת כמו תמיד, ובמקביל השרת קורא את הדף ומוצא בו את הדגלים של המדריך (lib/ad-check). בלי מפתח,
 * הטופס עובד כמו קודם.
 */
export async function submitCourseRequest(_previous: RequestState, form: FormData): Promise<RequestState> {
  // שדה שבן אדם לא רואה ולא ממלא. בוט שממלא אותו מקבל את אותה תשובה, ושום דבר לא נשמר.
  if (String(form.get('website') ?? '') !== '') return { status: 'sent' };

  const parsed = parseCourseRequestForm(form);
  if (!parsed.ok) return { status: 'invalid', errors: parsed.errors };

  const secret = process.env.SUPABASE_SECRET_KEY;
  let db: Db;
  try {
    if (!secret) throw new Error('missing key');
    db = createAdminClient();
  } catch {
    return { status: 'invalid', errors: {}, message: 'אי אפשר לשלוח עכשיו. נסו שוב מאוחר יותר.' };
  }

  // כמו בטופס למוסדות: רק טביעה של הכתובת, HMAC עם המפתח הסודי, ובתחילית משלה לכל שימוש.
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  const clientHash = createHmac('sha256', secret).update(`request-course:${ip}`).digest('hex');

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey || form.get('check') !== '1') {
    const request = await submitRequest(db, parsed.values, clientHash);
    if (request.kind === 'failed') return { status: 'invalid', errors: {}, message: request.message };
    if (request.kind === 'existing') return { status: 'existing', slug: request.slug, title: request.title };
    return { status: 'sent' };
  }

  const url = parsed.values.url;
  const checkHash = createHmac('sha256', secret).update(`ad-check:${ip}`).digest('hex');
  const [request, outcome] = await Promise.all([
    submitRequest(db, parsed.values, clientHash),
    runAdCheck(url, adCheckDeps(db, apiKey, checkHash)).catch((error: unknown) => {
      console.error('ad check failed', error instanceof Error ? error.name : 'unknown');
      return { kind: 'unreadable' as const };
    }),
  ]);
  if (request.kind === 'existing') request.verifiedReviews = await verifiedReviewCount(db, request.slug).catch(() => null);

  const check: CheckView =
    outcome.kind === 'checked'
      ? { kind: 'result', result: outcome.result, checkedOn: formatHebrewDate(outcome.checkedAt) }
      : outcome;
  return { status: 'checked', url, request, check };
}
