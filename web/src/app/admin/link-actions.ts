'use server';

import { refresh } from 'next/cache';
import { requireAdmin } from '@/lib/admin/gate';
import { refreshCourses } from '@/lib/cache/refresh';
import { EXPECTED_ADMIN_CODES, adminMessage } from '@/lib/course-links/messages';
import { isUuid } from '@/lib/reviews/types';
import { recomputeAllScores } from '@/lib/score/recompute';
import type { DecisionState } from './actions';

const fail = (message: string): DecisionState => ({ status: 'error', message });

/** מזהה של שורה (bigint), כמחרוזת ספרות בלבד. */
function rowId(value: FormDataEntryValue | null): number | null {
  return typeof value === 'string' && /^[1-9]\d{0,14}$/.test(value) ? Number(value) : null;
}

const text = (form: FormData, name: string) => {
  const value = form.get(name);
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
};

const KINDS = ['independent', 'school', 'college', 'university', 'other'];
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

type Decided = { course_slug?: unknown; published_reviews?: unknown; social?: unknown; page_id?: unknown };

/**
 * ביקורת שכבר אומתה על הטיוטה נכנסת לציון כשהקורס עולה (או עוברת לקורס אחר במיזוג). ממוצע התחום משותף,
 * ולכן כל הקורסים, כמו באישור של ביקורת. חישוב שנכשל לא מבטל את ההחלטה: היא כבר קרתה.
 */
async function recomputeAfter(db: Parameters<typeof recomputeAllScores>[0], slug: string): Promise<string | undefined> {
  try {
    const { failures, slugs } = await recomputeAllScores(db, new Date());
    refreshCourses([slug, ...slugs]);
    if (failures.length > 0) return `חישוב הציונים נכשל ב-${failures.length} קורסים. להריץ pnpm --dir web score:recompute.`;
  } catch (error) {
    console.error('recompute after course link failed', error instanceof Error ? error.message : 'unknown');
    refreshCourses([slug]);
    return 'חישוב הציונים נכשל. להריץ pnpm --dir web score:recompute.';
  }
  return undefined;
}

/**
 * החלטה על קורס מקישור (20261116010001_course_links.sql): אישור, מיזוג לקורס שכבר באתר, או דחייה עם סיבה.
 * המזהה והבחירות בלבד מגיעים מהטופס. הכול נבדק שוב במסד, ורק פריט שעדיין ממתין משתנה. היומן (audit_log) נכתב
 * בתוך הפונקציה במסד, באותה טרנזקציה. כל פעולת שרת בודקת שוב שזה מנהל (requireAdmin), גם אחרי ה-proxy.
 */
export async function decideCourseLink(_previous: DecisionState, form: FormData): Promise<DecisionState> {
  const gate = await requireAdmin();
  if (typeof gate === 'string') return fail(gate);

  const submissionId = rowId(form.get('submissionId'));
  const decision = form.get('decision');
  if (submissionId === null || (decision !== 'approve' && decision !== 'merge' && decision !== 'reject')) {
    return fail('הבקשה לא תקינה.');
  }

  if (decision === 'reject') {
    const reason = String(form.get('reason') ?? '').trim();
    if (reason.length === 0) return fail('לכתוב סיבה קודם. בוגר רואה אותה בעמוד הכתיבה.');
    if ([...reason].length > 300) return fail('הסיבה עד 300 תווים.');
    const { error } = await gate.db.rpc('reject_course_submission', {
      p_submission_id: submissionId,
      p_admin_id: gate.userId,
      p_reason: reason,
    });
    if (error) {
      if (!EXPECTED_ADMIN_CODES.includes(error.code)) console.error('course link reject failed', error.code);
      return fail(adminMessage(error.code));
    }
    // שום דבר ציבורי לא השתנה. התור לא במטמון: refresh מרנדר אותו מחדש.
    refresh();
    return { status: 'done', message: 'נדחה. הקורס לא יעלה.' };
  }

  if (decision === 'merge') {
    let target = form.get('targetCourseId');
    const slug = text(form, 'targetSlug').toLowerCase();
    if (slug) {
      if (!SLUG.test(slug)) return fail('ה-slug לא תקין.');
      const { data, error } = await gate.db.from('courses').select('id').eq('slug', slug).maybeSingle();
      if (error) return fail('לא הצלחנו לקרוא את הקורס. לא השתנה כלום.');
      if (!data) return fail('אין קורס עם ה-slug הזה.');
      target = data.id;
    }
    if (!isUuid(target)) return fail('לבחור את הקורס שכבר באתר קודם.');
    const { data, error } = await gate.db.rpc('merge_course_submission', {
      p_submission_id: submissionId,
      p_admin_id: gate.userId,
      p_target_course_id: target,
    });
    if (error) {
      if (!EXPECTED_ADMIN_CODES.includes(error.code)) console.error('course link merge failed', error.code);
      return fail(adminMessage(error.code));
    }
    const result = (data ?? {}) as Decided;
    const targetSlug = typeof result.course_slug === 'string' ? result.course_slug : null;
    let warning: string | undefined;
    // ביקורת שכבר אומתה עברה לקורס שבאתר: הציון שלו משתנה. אחרת שום דבר ציבורי לא השתנה.
    if (targetSlug && Number(result.published_reviews) > 0) warning = await recomputeAfter(gate.db, targetSlug);
    else refresh();
    return { status: 'done', message: 'מוזג לקורס שכבר באתר. הביקורות עברו אליו.', warning };
  }

  // אישור. כל השדות לא חובה: מה שלא נשלח נשאר כמו שהבוגר כתב. המסד דורש תחום כשאין.
  const categoryId = form.get('categoryId');
  const institutionId = form.get('institutionId');
  const institutionKind = text(form, 'institutionKind');
  const title = text(form, 'title');
  const institutionName = text(form, 'institutionName');
  if (categoryId && !isUuid(categoryId)) return fail('הבקשה לא תקינה.');
  if (institutionId && !isUuid(institutionId)) return fail('הבקשה לא תקינה.');
  if (institutionKind && !KINDS.includes(institutionKind)) return fail('הבקשה לא תקינה.');

  const { data, error } = await gate.db.rpc('approve_course_submission', {
    p_submission_id: submissionId,
    p_admin_id: gate.userId,
    ...(isUuid(categoryId) ? { p_category_id: categoryId } : {}),
    ...(title ? { p_title: title } : {}),
    ...(isUuid(institutionId) ? { p_institution_id: institutionId } : {}),
    ...(institutionName ? { p_institution_name: institutionName } : {}),
    ...(institutionKind ? { p_institution_kind: institutionKind } : {}),
  });
  if (error) {
    if (!EXPECTED_ADMIN_CODES.includes(error.code)) console.error('course link approve failed', error.code);
    return fail(adminMessage(error.code));
  }
  const result = (data ?? {}) as Decided;
  const slug = typeof result.course_slug === 'string' ? result.course_slug : null;
  const intoScraper = result.page_id !== null && result.page_id !== undefined;
  const scraperLine = result.social
    ? 'הדף ברשת חברתית, ולכן לא נכנס לאוסף.'
    : intoScraper
      ? 'הקישור ייקרא בריצה הבאה של האוסף, אם המוסד ב-scraper/institutions.yaml.'
      : '';

  if (!slug) {
    refresh();
    return { status: 'done', message: `אושר. ${scraperLine || 'נשמר.'}` };
  }
  // קורס חדש באתר: עמוד הקורס והקטלוג מתרעננים מיד, וגם התור מרונדר מחדש באותה תשובה.
  let warning: string | undefined;
  if (Number(result.published_reviews) > 0) warning = await recomputeAfter(gate.db, slug);
  else refreshCourses([slug]);
  return { status: 'done', message: `הקורס פורסם. ${scraperLine}`.trim(), warning };
}
