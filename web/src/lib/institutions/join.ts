/**
 * הטופס של מוסד שרוצה להוסיף קורס (/institutions/join): מה מקבלים, ואיך. אותם גבולות כמו ב-institution_requests
 * (20261115210001_course_queue_admin.sql). הקישור לא נפתח בשרת: רק נשמר, וגל מחליט אם להכניס אותו לאוסף.
 */

export type JoinField = 'institutionName' | 'courseUrl' | 'contactEmail';

export interface JoinValues {
  institutionName: string;
  courseUrl: string;
  contactEmail: string;
}

export type JoinParse = { ok: true; values: JoinValues } | { ok: false; errors: Partial<Record<JoinField, string>> };

/**
 * מייל פשוט בלבד, בלי ? & = או #: הכתובת הופכת לקישור mailto ב-/admin, ותווים כאלה היו מוסיפים לו נושא
 * וגוף שהשולח בחר (סקירת האבטחה של תוכנית 5ב). אותה בדיקה במסד (institution_requests.contact_email,
 * ו-company_requests.email).
 */
export const EMAIL =/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

/** "www.example.co.il/course" הופך ל-https://www.example.co.il/course. null: לא קישור שאפשר לקבל. */
export function normalizeCourseUrl(input: string): string | null {
  const text = input.trim();
  if (text === '' || /\s/.test(text) || text.includes('@')) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(text) ? text : `https://${text}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  if (url.username || url.password) return null;
  const host = url.hostname.toLowerCase();
  // רק אתר של מוסד: שם עם נקודה, לא כתובת IP ולא localhost.
  if (!host.includes('.') || /^[\d.]+$/.test(host) || host.startsWith('[') || host === 'localhost' || host.endsWith('.localhost')) {
    return null;
  }
  url.hash = '';
  const href = url.href;
  return href.length <= 500 ? href : null;
}

const field = (form: FormData, name: string) => {
  const value = form.get(name);
  return typeof value === 'string' ? value : '';
};

export function parseJoinForm(form: FormData): JoinParse {
  const errors: Partial<Record<JoinField, string>> = {};
  const institutionName = field(form, 'institutionName').replace(/\s+/g, ' ').trim();
  if (institutionName.length < 2) errors.institutionName = 'כתבו את שם המוסד.';
  else if (institutionName.length > 120) errors.institutionName = 'עד 120 תווים.';

  const rawUrl = field(form, 'courseUrl');
  const courseUrl = normalizeCourseUrl(rawUrl);
  if (rawUrl.trim() === '') errors.courseUrl = 'הדביקו את הקישור לדף הקורס באתר שלכם.';
  // הכתובת בדוגמה מבודדת לכיוון שמאל-לימין (LRI ו-PDI), כדי שלא תתהפך בתוך משפט בעברית.
  else if (!courseUrl) errors.courseUrl = 'זה לא נראה כמו קישור לדף באתר. למשל: \u2066www.example.co.il/courses/design\u2069';

  const contactEmail = field(form, 'contactEmail').trim().toLowerCase();
  if (contactEmail === '') errors.contactEmail = 'כתבו מייל שנוכל לחזור אליו.';
  else if (contactEmail.length > 254 || !EMAIL.test(contactEmail)) errors.contactEmail = 'המייל לא נראה תקין.';

  if (Object.keys(errors).length > 0 || !courseUrl) return { ok: false, errors };
  return { ok: true, values: { institutionName, courseUrl, contactEmail } };
}
