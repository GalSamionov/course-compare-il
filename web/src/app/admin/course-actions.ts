'use server';

import { refresh, updateTag } from 'next/cache';
import { COURSE_FIELDS, parseEdit } from '@/lib/admin/course-fields';
import { requireAdmin } from '@/lib/admin/gate';
import { one } from '@/lib/data/shared';
import type { Json } from '@/lib/database.types';
import { isUuid } from '@/lib/reviews/types';
import type { DecisionState } from './actions';

function fail(message: string): DecisionState {
  return { status: 'error', message };
}

/** מזהה של שורה (bigint), כמחרוזת ספרות בלבד. */
function rowId(value: FormDataEntryValue | null): number | null {
  return typeof value === 'string' && /^[1-9]\d{0,14}$/.test(value) ? Number(value) : null;
}

const NOT_PENDING = 'הפריט כבר לא ממתין. אולי כבר הוחלט עליו בלשונית אחרת: לרענן את הדף.';

/** קודי השגיאה מהמסד (20261115210001_course_queue_admin.sql, ובדיקות של courses), בעברית לגל. */
function dbMessage(code: string | undefined, fallback: string): string {
  switch (code) {
    case 'P0002':
      return NOT_PENDING;
    case 'LM020':
      return 'תיקון ידני רק לשדה, לא לקורס חדש או לקורס שנעלם.';
    case 'LM010':
      return 'הקישור לא באתר של המוסד שנבחר. האוסף קורא רק מהאתר של המוסד עצמו.';
    case 'LM011':
      return 'למוסד שנבחר אין אתר במסד, ולכן אי אפשר לבדוק שהקישור שלו.';
    case 'LM012':
      return 'הקישור כבר אצל האוסף, תחת מוסד אחר.';
    case '23514':
    case '22P02':
    case '22007':
    case '22008':
      return 'המסד לא קיבל את הערך (טווח או סוג). לא השתנה כלום.';
    default:
      return fallback;
  }
}

type Decision = 'approve' | 'edit' | 'reject';
const isDecision = (value: unknown): value is Decision => value === 'approve' || value === 'edit' || value === 'reject';

type ItemCourse = { slug: string; title: string; syllabus: Json };

/** מה כל החלטה אומרת לגל, לפי סוג הפריט. */
function doneMessage(kind: string, decision: Decision): string {
  if (decision === 'edit') return 'התיקון נשמר ועלה לאתר.';
  if (kind === 'new_course') return decision === 'approve' ? 'הקורס פורסם.' : 'נדחה. הקורס לא יעלה, והדף שלו לא ייקרא יותר.';
  if (kind === 'maybe_inactive') return decision === 'approve' ? 'הקורס הוסר מהקטלוג.' : 'נשאר פעיל.';
  if (kind === 'fetch_failed') return 'סומן כנראה. הדף ממשיך להיבדק כל שבוע.';
  return decision === 'approve' ? 'אושר ועלה לאתר.' : 'נדחה. מה שבאתר נשאר.';
}

/**
 * החלטה על פריט בתור של הקורסים (מסמך העיצוב, סעיף 10): אישור, תיקון ידני או דחייה.
 * המזהה בלבד מגיע מהטופס. הסוג, השדה והקורס נקראים שוב מהמסד, ורק פריט שעדיין ממתין משתנה.
 * היומן (audit_log) נכתב בתוך הפונקציה במסד, באותה טרנזקציה.
 * אחרי החלטה: עמוד הקורס והקטלוג מתרעננים מיד (updateTag.md), והתור מרונדר מחדש באותה תשובה.
 */
export async function decideCourseChange(_previous: DecisionState, form: FormData): Promise<DecisionState> {
  const gate = await requireAdmin();
  if (typeof gate === 'string') return fail(gate);

  const queueId = rowId(form.get('queueId'));
  const decision = form.get('decision');
  if (queueId === null || !isDecision(decision)) return fail('הבקשה לא תקינה.');

  const { data: item, error: readError } = await gate.db
    .from('course_change_queue')
    .select('kind, field, status, courses(slug, title, syllabus)')
    .eq('id', queueId)
    .maybeSingle();
  if (readError) return fail('לא הצלחנו לקרוא את הפריט. לא השתנה כלום.');
  if (!item || item.status !== 'pending') return fail(NOT_PENDING);
  const course = one(item.courses as unknown as ItemCourse | ItemCourse[] | null);

  let value: Json | null = null;
  if (decision === 'edit') {
    if (item.kind !== 'field' || !item.field || !COURSE_FIELDS[item.field]) return fail('אי אפשר לתקן את הפריט הזה ידנית.');
    const raw = COURSE_FIELDS[item.field].kind === 'choices' ? form.getAll('value').map(String) : String(form.get('value') ?? '');
    const parsed = parseEdit(item.field, raw, course?.syllabus ?? null);
    if (!parsed.ok) return fail(parsed.message);
    value = parsed.value;
  }

  const { error } =
    decision === 'reject'
      ? await gate.db.rpc('reject_course_change', { p_queue_id: queueId, p_admin_id: gate.userId })
      : await gate.db.rpc('approve_course_change', {
          p_queue_id: queueId,
          p_admin_id: gate.userId,
          p_edit: decision === 'edit',
          ...(decision === 'edit' ? { p_value: value } : {}),
        });
  if (error) {
    if (!['P0002', 'LM020', '23514', '22P02', '22007', '22008'].includes(error.code)) {
      console.error('course decision failed', error.code);
    }
    return fail(dbMessage(error.code, 'ההחלטה לא נשמרה. נסו שוב.'));
  }

  // הקורס והקטלוג: מחיר, מועד, קורס חדש שעלה או קורס שהוסר (סבב 5, פריט 36). דחייה של קורס חדש לא משנה
  // שום דבר ציבורי, אבל רענון של טיוטה לא עולה כלום.
  if (course?.slug) updateTag(`course:${course.slug}`);
  updateTag('catalog');
  return { status: 'done', message: doneMessage(item.kind, decision) };
}

/**
 * בקשה של מוסד להוסיף קורס (/institutions/join): אישור עם מוסד קיים, שהקישור באתר שלו, או דחייה.
 * אחרי אישור הקישור נכנס לדפים של האוסף, וייקרא בריצה הבאה של המוסד. שום דבר ציבורי לא משתנה עכשיו.
 */
export async function decideJoinRequest(_previous: DecisionState, form: FormData): Promise<DecisionState> {
  const gate = await requireAdmin();
  if (typeof gate === 'string') return fail(gate);

  const requestId = rowId(form.get('requestId'));
  const decision = form.get('decision');
  const institutionId = form.get('institutionId');
  if (requestId === null || (decision !== 'approve' && decision !== 'reject')) return fail('הבקשה לא תקינה.');
  if (decision === 'approve' && !isUuid(institutionId)) return fail('לבחור מוסד קודם.');

  const { error } =
    decision === 'approve'
      ? await gate.db.rpc('approve_institution_request', {
          p_request_id: requestId,
          p_admin_id: gate.userId,
          p_institution_id: institutionId as string,
        })
      : await gate.db.rpc('reject_institution_request', { p_request_id: requestId, p_admin_id: gate.userId });
  if (error) {
    if (!['P0002', 'LM010', 'LM011', 'LM012'].includes(error.code)) console.error('join request decision failed', error.code);
    return fail(dbMessage(error.code, 'ההחלטה לא נשמרה. נסו שוב.'));
  }
  // התור לא במטמון: refresh מרנדר אותו מחדש, והבקשה יורדת מהרשימה.
  refresh();
  return {
    status: 'done',
    message: decision === 'approve' ? 'אושר. הקישור ייקרא בריצה הבאה של האוסף.' : 'נדחתה.',
  };
}
