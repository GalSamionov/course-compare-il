import type { Database } from '../database.types';

export type ProofKind = Database['public']['Enums']['proof_kind'];
export type AuthorTitle = Database['public']['Enums']['author_title'];
export type DisplayMode = Database['public']['Enums']['display_name_mode'];
export type ReviewStatus = Database['public']['Enums']['review_status'];
export type CourseType = Database['public']['Enums']['course_type'];

/** אורך הביקורת. המסד אוכף אותו מרגע שהביקורת יוצאת מטיוטה (reviews_body_length). */
export const BODY_MIN = 80;
export const BODY_MAX = 2000;
/** אורך השם לתצוגה (reviews_display_name_length). */
export const NAME_MAX = 60;

/** עד שני קבצים: הוכחה, ולפעמים עוד אחת שמחזקת אותה. */
export const MAX_PROOF_FILES = 2;
/** כמו file_size_limit של ה-bucket. */
export const MAX_PROOF_BYTES = 10 * 1024 * 1024;
export const PROOF_MIMES = ['image/jpeg', 'image/png', 'application/pdf'] as const;
export type ProofMime = (typeof PROOF_MIMES)[number];
export const PROOF_EXTENSION: Record<ProofMime, 'jpg' | 'png' | 'pdf'> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'application/pdf': 'pdf',
};
export const isProofMime = (value: string): value is ProofMime => (PROOF_MIMES as readonly string[]).includes(value);

/** הוכחה שמספיקה לבד (מסמך העיצוב של חלק 1, סעיף 6). רשימת בוגרים מגיעה מהמוסד, ולא עולה מכאן. */
export const SUFFICIENT_KINDS: readonly ProofKind[] = ['invoice', 'certificate', 'enrollment_email', 'employer_letter'];
/** רק יחד עם הוכחה נוספת. */
export const SUPPORTING_KINDS: readonly ProofKind[] = ['screenshot', 'project'];
export const UPLOAD_KINDS: readonly ProofKind[] = [...SUFFICIENT_KINDS, ...SUPPORTING_KINDS];
export const isUploadKind = (value: string): value is ProofKind => (UPLOAD_KINDS as readonly string[]).includes(value);

export const PROOF_KIND_LABEL: Record<ProofKind, string> = {
  invoice: 'חשבונית או קבלה',
  certificate: 'תעודת סיום',
  enrollment_email: 'מייל אישור הרשמה',
  employer_letter: 'אישור מהמעסיק או מקרן ההשתלמות',
  screenshot: 'צילום מסך ממערכת הקורס',
  project: 'פרויקט שהגשתי',
  graduate_list: 'רשימת בוגרים מהמוסד',
};

export const AUTHOR_TITLES: readonly AuthorTitle[] = ['graduate_m', 'graduate_f', 'none'];
export const AUTHOR_TITLE_LABEL: Record<AuthorTitle, string> = { graduate_m: 'בוגר', graduate_f: 'בוגרת', none: 'בלי' };

/** מה כתוב ליד השם בפתק. בלי מין דקדוקי: "ביקורת מאומתת", כמו לפני סבב 3. */
export function verifiedLabel(title: AuthorTitle): string {
  if (title === 'graduate_m') return 'בוגר מאומת';
  if (title === 'graduate_f') return 'בוגרת מאומתת';
  return 'ביקורת מאומתת';
}

export const DISPLAY_MODES: readonly DisplayMode[] = ['full', 'first_initial', 'anonymous'];
export const DISPLAY_MODE_LABEL: Record<DisplayMode, string> = {
  full: 'שם מלא',
  first_initial: 'שם פרטי ואות',
  anonymous: 'בלי שם',
};
/** השם השמור של ביקורת אנונימית (האילוץ reviews_anonymous_display_name). בעמוד מוצגת התווית, לא השם הזה. */
export const ANONYMOUS_NAME = 'בוגר מאומת';

/** "כן" נשמר כ-5 ו"לא" כ-1, כדי שכל השאלות יהיו בסולם אחד (score/compute.ts). */
export const YES = 5;
export const NO = 1;
export const LIKERT_LOW = 'חלש מאוד';
export const LIKERT_HIGH = 'מצוין';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export const isUuid = (value: unknown): value is string => typeof value === 'string' && UUID.test(value);
