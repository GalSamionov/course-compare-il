'use server';

import { redirect } from 'next/navigation';
import { parseCourseLinkForm, type LinkField } from '@/lib/course-links/form';
import { EXPECTED_SUBMIT_CODES, submitMessage } from '@/lib/course-links/messages';
import { isUuid } from '@/lib/reviews/types';
import { createAdminClient } from '@/lib/supabase/admin-client';
import { createServerSupabase } from '@/lib/supabase/server-client';

export type AddLinkState =
  | { status: 'idle' }
  | { status: 'invalid'; errors: Partial<Record<LinkField, string>>; message?: string }
  | { status: 'signed-out' }
  | { status: 'existing'; slug: string; title: string };

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const failed = (message: string): AddLinkState => ({ status: 'invalid', errors: {}, message });

/**
 * "הקורס לא ברשימה?" ב-/review: בוגר מחובר מדביק קישור לדף הקורס או למודעה.
 * הסדר: הטופס, מי המשתמש (getUser בודק מול Supabase, ולא רק את העוגייה), ורק אז submit_course_link עם המפתח הסודי.
 * המסד בודק כפילות ומגבלת קצב (3 ביממה) בנעילה אחת. למשתמש אין שום הרשאה על הטבלה עצמה.
 * Next בודק ש-Origin תואם ל-Host (server-actions.md, Security).
 * - הקורס כבר באתר: מחזירים אותו, והבוגר כותב עליו.
 * - אחרת: קורס טיוטה (חדש, או שבוגר אחר כבר הוסיף), והבוגר עובר לכתוב עליו.
 */
export async function addCourseFromLink(_previous: AddLinkState, form: FormData): Promise<AddLinkState> {
  const parsed = parseCourseLinkForm(form);
  if (!parsed.ok) return { status: 'invalid', errors: parsed.errors };

  const supabase = await createServerSupabase();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) return { status: 'signed-out' };

  let db: ReturnType<typeof createAdminClient>;
  try {
    db = createAdminClient();
  } catch {
    return failed('אי אפשר להוסיף קורס עכשיו. נסו שוב מאוחר יותר.');
  }

  const { categorySlug } = parsed.values;
  let categoryId: string | null = null;
  if (categorySlug) {
    const { data: category, error } = await db.from('categories').select('id').eq('slug', categorySlug).maybeSingle();
    if (error) return failed(submitMessage(undefined));
    if (!category) return { status: 'invalid', errors: { courseKind: submitMessage('LM044') } };
    categoryId = category.id;
  }

  const { data, error } = await db.rpc('submit_course_link', {
    p_user_id: auth.user.id,
    p_url: parsed.values.url,
    p_title: parsed.values.title,
    p_institution_name: parsed.values.institutionName,
    ...(categoryId ? { p_category_id: categoryId } : { p_course_type: parsed.values.courseType ?? undefined }),
  });
  if (error) {
    if (!EXPECTED_SUBMIT_CODES.includes(error.code)) console.error('course link failed', error.code);
    return failed(submitMessage(error.code));
  }

  const result = (data ?? {}) as { outcome?: unknown; course_id?: unknown; course_slug?: unknown; course_title?: unknown };
  if (result.outcome === 'existing' && typeof result.course_slug === 'string' && SLUG.test(result.course_slug)) {
    return { status: 'existing', slug: result.course_slug, title: String(result.course_title ?? '') };
  }
  if (result.outcome !== 'draft' || !isUuid(result.course_id)) {
    console.error('course link: unexpected result');
    return failed(submitMessage(undefined));
  }
  // מחוץ ל-try: redirect זורק בכוונה (redirect.md).
  redirect(`/review/new?course=${result.course_id}`);
}
