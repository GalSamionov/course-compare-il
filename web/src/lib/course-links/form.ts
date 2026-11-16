/**
 * שני הטפסים של קורס מקישור: בוגר ב-/review, וכל אחד ב-/request-course. אותם גבולות כמו ב-course_submissions
 * (20261116010001_course_links.sql). הקישור לא נפתח בשרת: רק נשמר, וגל מחליט.
 */
import type { CourseType } from '@/lib/reviews/types';
import { normalizeCourseLink } from './url';

/** כשאין תחום מתאים באתר, הבוגר בוחר רק את סוג הקורס: ממנו נגזר השאלון (סבב 3). */
export const COURSE_KINDS: readonly { value: CourseType; label: string }[] = [
  { value: 'career', label: 'למקצוע ולעבודה' },
  { value: 'hobby', label: 'לתחביב או למיומנות' },
  { value: 'exam', label: 'הכנה למבחן או לרישיון' },
];
const isKind = (value: string): value is CourseType => COURSE_KINDS.some((k) => k.value === value);

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export type LinkField = 'url' | 'title' | 'institutionName' | 'courseKind';

export interface LinkValues {
  url: string;
  title: string;
  institutionName: string;
  /** התחום מהרשימה. null: אין תחום מתאים, ואז courseType. */
  categorySlug: string | null;
  courseType: CourseType | null;
}

export type LinkParse = { ok: true; values: LinkValues } | { ok: false; errors: Partial<Record<LinkField, string>> };

const field = (form: FormData, name: string) => {
  const value = form.get(name);
  return typeof value === 'string' ? value : '';
};
/**
 * תווים בלתי נראים (כיווניות, רוחב אפס): שם ב-/admin היה נראה אחרת ממה שהוא, ושני שמות זהים לא היו נחשבים כפולים.
 * סקירת האבטחה של הסשן.
 */
const visible = (text: string) => text.replace(/\p{Cf}/gu, '');
const oneLine = (text: string) => visible(text).replace(/\s+/g, ' ').trim();
/** אורך כמו char_length במסד: לפי תווים, ולא לפי יחידות של UTF-16. */
const length = (text: string) => [...text].length;

/** הכתובת בדוגמה מבודדת לכיוון שמאל-לימין (LRI ו-PDI), כדי שלא תתהפך בתוך משפט בעברית. */
const URL_EXAMPLE = '⁦www.example.co.il/course⁩';

function urlError(raw: string, url: string | null): string | undefined {
  if (raw.trim() === '') return 'הדביקו את הקישור לדף הקורס או למודעה.';
  if (!url) return `זה לא נראה כמו קישור לדף. למשל: ${URL_EXAMPLE}`;
  return undefined;
}

/** בוגר ב-/review: קישור, שם הקורס, שם המרצה או המוסד, ותחום או סוג קורס. */
export function parseCourseLinkForm(form: FormData): LinkParse {
  const errors: Partial<Record<LinkField, string>> = {};
  const rawUrl = field(form, 'url');
  const url = normalizeCourseLink(rawUrl);
  const urlProblem = urlError(rawUrl, url);
  if (urlProblem) errors.url = urlProblem;

  const title = oneLine(field(form, 'title'));
  if (length(title) < 2) errors.title = 'כתבו את שם הקורס, כמו שהוא מופיע במודעה או בדף.';
  else if (length(title) > 160) errors.title = 'עד 160 תווים.';

  const institutionName = oneLine(field(form, 'institutionName'));
  if (length(institutionName) < 2) errors.institutionName = 'כתבו מי מלמד: שם המרצה, העסק או המוסד.';
  else if (length(institutionName) > 120) errors.institutionName = 'עד 120 תווים.';

  const category = field(form, 'category').trim();
  const kind = field(form, 'courseKind');
  const categorySlug = SLUG.test(category) ? category : null;
  const courseType = categorySlug === null && isKind(kind) ? kind : null;
  if (categorySlug === null && courseType === null) errors.courseKind = 'בחרו תחום, או מה סוג הקורס.';

  if (Object.keys(errors).length > 0 || !url) return { ok: false, errors };
  return { ok: true, values: { url, title, institutionName, categorySlug, courseType } };
}

export type RequestField = 'url' | 'name' | 'note';

export interface RequestValues {
  url: string;
  name: string | null;
  note: string | null;
}

export type RequestParse =
  | { ok: true; values: RequestValues }
  | { ok: false; errors: Partial<Record<RequestField, string>> };

/** כל אחד ב-/request-course: קישור, ושם והערה אם רוצים. */
export function parseCourseRequestForm(form: FormData): RequestParse {
  const errors: Partial<Record<RequestField, string>> = {};
  const rawUrl = field(form, 'url');
  const url = normalizeCourseLink(rawUrl);
  const urlProblem = urlError(rawUrl, url);
  if (urlProblem) errors.url = urlProblem;

  const name = oneLine(field(form, 'name'));
  if (name !== '' && length(name) < 2) errors.name = 'לפחות 2 תווים, או להשאיר ריק.';
  else if (length(name) > 160) errors.name = 'עד 160 תווים.';

  // שורות נשמרות, אבל לא יותר משתי שורות ריקות ברצף.
  const note = visible(field(form, 'note')).replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  if (length(note) > 500) errors.note = 'עד 500 תווים.';

  if (Object.keys(errors).length > 0 || !url) return { ok: false, errors };
  return { ok: true, values: { url, name: name || null, note: note || null } };
}
