'use server';

import { createHmac } from 'node:crypto';
import { headers } from 'next/headers';
import { parseCourseRequestForm, type RequestField } from '@/lib/course-links/form';
import { EXPECTED_SUBMIT_CODES, submitMessage } from '@/lib/course-links/messages';
import { createAdminClient } from '@/lib/supabase/admin-client';

export type RequestState =
  | { status: 'idle' }
  | { status: 'invalid'; errors: Partial<Record<RequestField, string>>; message?: string }
  | { status: 'sent' }
  | { status: 'existing'; slug: string; title: string };

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * "בקשו שנבדוק קורס" (/request-course): כל אחד, בלי התחברות. לאורח אין שום הרשאה: הכתיבה עוברת כאן, עם המפתח
 * הסודי, דרך submit_course_request, שבודקת את מגבלת הקצב במסד (3 ביממה לכל כתובת, 50 בסך הכול).
 * Next בודק ש-Origin תואם ל-Host (server-actions.md, Security). שדה המלכודת עוצר בוטים פשוטים.
 * קורס שכבר באתר: מחזירים אותו (זה מידע ציבורי). קישור שכבר ממתין: אותה תשובה כמו בקשה חדשה.
 */
export async function submitCourseRequest(_previous: RequestState, form: FormData): Promise<RequestState> {
  // שדה שבן אדם לא רואה ולא ממלא. בוט שממלא אותו מקבל את אותה תשובה, ושום דבר לא נשמר.
  if (String(form.get('website') ?? '') !== '') return { status: 'sent' };

  const parsed = parseCourseRequestForm(form);
  if (!parsed.ok) return { status: 'invalid', errors: parsed.errors };

  const secret = process.env.SUPABASE_SECRET_KEY;
  let db: ReturnType<typeof createAdminClient>;
  try {
    if (!secret) throw new Error('missing key');
    db = createAdminClient();
  } catch {
    return { status: 'invalid', errors: {}, message: 'אי אפשר לשלוח עכשיו. נסו שוב מאוחר יותר.' };
  }

  // כמו בטופס למוסדות: רק טביעה של הכתובת, HMAC עם המפתח הסודי, ובתחילית משלה.
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  const clientHash = createHmac('sha256', secret).update(`request-course:${ip}`).digest('hex');

  const { data, error } = await db.rpc('submit_course_request', {
    p_url: parsed.values.url,
    // null של PostgREST מגיע ל-SQL כ-NULL: בלי שם ובלי הערה.
    p_name: parsed.values.name as string,
    p_note: parsed.values.note as string,
    p_client_hash: clientHash,
  });
  if (error) {
    if (!EXPECTED_SUBMIT_CODES.includes(error.code)) console.error('course request failed', error.code);
    return { status: 'invalid', errors: {}, message: submitMessage(error.code) };
  }
  const result = (data ?? {}) as { outcome?: unknown; course_slug?: unknown; course_title?: unknown };
  if (result.outcome === 'existing' && typeof result.course_slug === 'string' && SLUG.test(result.course_slug)) {
    return { status: 'existing', slug: result.course_slug, title: String(result.course_title ?? '') };
  }
  return { status: 'sent' };
}
