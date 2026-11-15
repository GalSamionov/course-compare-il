'use server';

import { refresh } from 'next/cache';
import { requireAdmin } from '@/lib/admin/gate';
import { BULK_BATCH, batches, parseIds, stillEligible } from '@/lib/admin/new-course-groups';
import { refreshCourses } from '@/lib/cache/refresh';
import { isUuid } from '@/lib/reviews/types';
import type { DecisionState } from './actions';

function fail(message: string): DecisionState {
  return { status: 'error', message };
}

const fmt = (n: number) => new Intl.NumberFormat('he-IL').format(n);

/** "קורס אחד פורסם", "12 קורסים פורסמו". */
const courses = (n: number, one: string, many: string) => (n === 1 ? `קורס אחד ${one}` : `${fmt(n)} קורסים ${many}`);

/**
 * אישור או דחייה של הקורסים החדשים של מוסד אחד, בבת אחת. רק אחרי לחיצה של גל ושלב אישור עם המספר:
 * קורס חדש עדיין עובר אישור (סעיף 5), ושום דבר לא מאושר לבד.
 *
 * מהטופס מגיעים המוסד והמזהים שגל ראה. כאן הם נבדקים שוב מול המסד, ונשאר רק מה שעדיין עומד בתנאי:
 * באישור, רק מה שעדיין בטוח; בדחייה, מה שעדיין ממתין. פריט שנכנס לתור אחרי שגל טען את העמוד לא נכלל.
 * המסד מקבל 100 בכל קריאה (approve_course_changes, reject_course_changes), וכל קריאה היא טרנזקציה משלה:
 * אם קריאה נכשלת באמצע, מה שכבר הוחלט נשאר, והשאר נשאר בתור. היומן נכתב במסד, שורה לכל פריט.
 * אחרי אישור: הקטלוג ועמודי הקורסים מתרעננים מיד. קורס חדש לא משנה ציונים, ולכן אין חישוב מחדש.
 */
export async function decideInstitutionCourses(_previous: DecisionState, form: FormData): Promise<DecisionState> {
  const gate = await requireAdmin();
  if (typeof gate === 'string') return fail(gate);

  const institutionId = form.get('institutionId');
  const decision = form.get('decision');
  const posted = parseIds(form.get('ids'));
  if (!isUuid(institutionId) || (decision !== 'approve' && decision !== 'reject') || posted === null) {
    return fail('הבקשה לא תקינה.');
  }

  const { data: current, error: readError } = await gate.db.rpc('course_queue_new_course_items', {
    p_filter: decision === 'approve' ? 'safe' : 'all',
    p_institution_id: institutionId,
    p_limit: 1000,
  });
  if (readError) return fail('לא הצלחנו לקרוא את התור. לא השתנה כלום.');
  const { ids } = stillEligible(
    posted,
    current.map((row) => row.queue_id),
  );
  if (ids.length === 0) {
    return fail(
      decision === 'approve'
        ? 'אף קורס מהרשימה כבר לא בטוח או ממתין. אולי כבר הוחלט עליהם בלשונית אחרת: לרענן את הדף.'
        : 'אף קורס מהרשימה כבר לא ממתין. אולי כבר הוחלט עליהם בלשונית אחרת: לרענן את הדף.',
    );
  }

  const slugs: string[] = [];
  let failed = false;
  for (const batch of batches(ids, BULK_BATCH)) {
    const { data, error } =
      decision === 'approve'
        ? await gate.db.rpc('approve_course_changes', { p_ids: batch, p_admin_id: gate.userId })
        : await gate.db.rpc('reject_course_changes', { p_ids: batch, p_admin_id: gate.userId });
    if (error) {
      console.error('bulk course decision failed', error.code);
      failed = true;
      break;
    }
    slugs.push(...data.map((row) => row.course_slug));
  }

  // אישור: הקורסים עולים לקטלוג, לעמוד המוסד ולעמודים שלהם, מיד (updateTag.md). זה גם מרנדר את התור מחדש.
  // דחייה: שום דבר ציבורי לא משתנה, רק התור.
  if (decision === 'approve' && slugs.length > 0) refreshCourses(slugs);
  else refresh();

  const done = slugs.length;
  if (failed && done === 0) return fail('ההחלטה לא נשמרה. לא השתנה כלום. נסו שוב.');
  const left = posted.length - done;
  let message: string;
  if (decision === 'approve') message = `${courses(done, 'פורסם בקטלוג', 'פורסמו בקטלוג')}.`;
  else if (done === 1) message = 'קורס אחד נדחה. הוא נשאר טיוטה, והדף שלו לא ייקרא יותר.';
  else message = `${fmt(done)} קורסים נדחו. הם נשארים טיוטה, והדפים שלהם לא ייקראו יותר.`;
  if (failed) {
    return { status: 'done', message, warning: `משהו נכשל באמצע: ${courses(left, 'נשאר', 'נשארו')} בתור. אפשר לנסות שוב.` };
  }
  if (left === 0) return { status: 'done', message };
  const stale =
    decision === 'approve'
      ? courses(left, 'כבר לא היה בטוח או ממתין, ולא השתנה', 'כבר לא היו בטוחים או ממתינים, ולא השתנו')
      : courses(left, 'כבר לא המתין, ולא השתנה', 'כבר לא המתינו, ולא השתנו');
  return { status: 'done', message: `${message} ${stale}.` };
}
