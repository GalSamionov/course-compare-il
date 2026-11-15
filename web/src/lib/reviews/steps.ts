import {
  ANONYMOUS_NAME,
  BODY_MAX,
  BODY_MIN,
  MAX_PROOF_BYTES,
  MAX_PROOF_FILES,
  NAME_MAX,
  NO,
  SUFFICIENT_KINDS,
  UPLOAD_KINDS,
  YES,
  isProofMime,
  type AuthorTitle,
  type CourseType,
  type DisplayMode,
  type ProofKind,
} from './types';

/** חמשת הצעדים, לפי הסדר במסמך העיצוב (סעיף 3): קודם הביקורת, ההוכחה בסוף. */
export const STEPS = ['when', 'questions', 'words', 'name', 'proof'] as const;
export type StepId = (typeof STEPS)[number];

export const STEP_TITLE: Record<StepId, string> = {
  when: 'מתי למדת',
  questions: 'השאלון',
  words: 'במילים שלך',
  name: 'איך תופיעו',
  proof: 'הוכחה',
};

export interface Question {
  key: string;
  label: string;
  scale: 'likert5' | 'yes_no';
}

/** שורה מטבלת metrics. */
export interface MetricDef extends Question {
  course_types: CourseType[];
  sort_order: number;
}

/** מה שנשמר בטיוטה. displayName הוא כבר הצורה שתוצג (displayNameFor). */
export interface DraftFields {
  cohortMonth: string | null;
  finishedMonth: string | null;
  answers: Record<string, number>;
  body: string;
  displayMode: DisplayMode;
  displayName: string;
  authorTitle: AuthorTitle;
}

export interface ProofChoice {
  kind: ProofKind;
  mime: string;
  size: number;
}

export interface StepContext {
  questions: readonly Question[];
  /** החודש הנוכחי, '2026-11-01'. נקבע מבחוץ, כדי שהבדיקה תהיה טהורה. */
  thisMonth: string;
}

/** השאלות לפי סוג הקורס, בלי "אחרי 3 חודשים": היא נשאלת בשאלת ההמשך (סבב 6). */
export function questionsFor(type: CourseType, metrics: readonly MetricDef[]): Question[] {
  return [...metrics]
    .filter((m) => m.course_types.includes(type) && m.key !== 'outcome_3m')
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(({ key, label, scale }) => ({ key, label, scale }));
}

/** חודש בצורה של המסד: '2026-03-01'. month בין 1 ל-12. */
export function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

export function thisMonthOf(date: Date): string {
  return monthKey(date.getFullYear(), date.getMonth() + 1);
}

/** אורך כמו char_length במסד: לפי תווים, ולא לפי יחידות של UTF-16. */
const length = (text: string) => [...text.trim()].length;
const chars = (n: number) => (n === 1 ? 'תו אחד' : `${n} תווים`);

/**
 * השם שנשמר הוא השם שיוצג (notes-for-plan-2.md, פרטיות): שם מלא רק כשהכותב בחר בו.
 * "שם פרטי ואות" נשמר כ"נועה ר.", ואפשר להריץ את זה שוב על התוצאה.
 */
export function displayNameFor(mode: DisplayMode, typed: string): string {
  if (mode === 'anonymous') return ANONYMOUS_NAME;
  const words = typed.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  if (mode === 'full' || words.length === 1) return words.join(' ').slice(0, NAME_MAX);
  const initial = [...words[words.length - 1]].find((ch) => /\p{L}/u.test(ch)) ?? '';
  return `${words[0]}${initial ? ` ${initial}.` : ''}`.slice(0, NAME_MAX);
}

/** ההודעה מהמסמך (סעיף 3, "כשמשהו נכשל"): גם לקובץ גדול או מסוג אחר, לפני ההעלאה. */
export const FILE_REJECTED = 'ההעלאה לא הצליחה. נסו שוב, או העלו קובץ קטן מ-10MB (JPG, PNG או PDF).';

/** בדיקה של קובץ אחד בדפדפן, לפני ההעלאה. null: אפשר להעלות. */
export function checkFile(file: { type: string; size: number }): string | null {
  return isProofMime(file.type) && file.size > 0 && file.size <= MAX_PROOF_BYTES ? null : FILE_REJECTED;
}

/** בלי קובץ אין מה לשלוח. גם השרת בודק את זה (proofErrors). */
export const NO_PROOF = 'צריך לצרף קובץ אחד לפחות.';

export function proofErrors(files: readonly ProofChoice[]): string[] {
  if (files.length === 0) return [NO_PROOF];
  const errors: string[] = [];
  if (files.length > MAX_PROOF_FILES) errors.push('אפשר להעלות עד שני קבצים.');
  for (const file of files) {
    if (!UPLOAD_KINDS.includes(file.kind)) errors.push('סוג ההוכחה לא מוכר.');
    if (checkFile({ type: file.mime, size: file.size })) errors.push(FILE_REJECTED);
  }
  if (!files.some((file) => SUFFICIENT_KINDS.includes(file.kind))) {
    errors.push('צילום מסך או פרויקט מתקבלים רק יחד עם חשבונית, תעודה, מייל הרשמה או אישור מהמעסיק.');
  }
  return [...new Set(errors)];
}

/**
 * השדה שההודעה שייכת לו: ההודעה מוצגת מתחתיו, והפוקוס עובר לשדה הראשון שיש בו בעיה.
 * `question:<key>` היא שאלה בשאלון. proofs: הקבצים שהוצמדו ובחירת הקובץ.
 */
export type ErrorField = 'cohortMonth' | 'finishedMonth' | `question:${string}` | 'body' | 'displayName' | 'proofs';

export interface StepError {
  field: ErrorField;
  message: string;
}

const err = (field: ErrorField, message: string): StepError => ({ field, message });

function whenErrors(draft: DraftFields, thisMonth: string): StepError[] {
  if (!draft.cohortMonth) return [err('cohortMonth', 'בחרו את חודש ההתחלה.')];
  // חודשים בצורה '2026-03-01' משתווים נכון כמחרוזות.
  if (draft.cohortMonth > thisMonth) return [err('cohortMonth', 'חודש ההתחלה עוד לא הגיע.')];
  if (draft.finishedMonth && draft.finishedMonth < draft.cohortMonth) {
    return [err('finishedMonth', 'חודש הסיום לפני חודש ההתחלה.')];
  }
  if (draft.finishedMonth && draft.finishedMonth > thisMonth) return [err('finishedMonth', 'חודש הסיום עוד לא הגיע.')];
  return [];
}

/** הודעה לכל שאלה, מתחת לתשובות שלה, לפי סדר השאלון. */
function answerErrors(answers: Record<string, number>, questions: readonly Question[]): StepError[] {
  return questions.flatMap((q) => {
    const value = answers[q.key];
    if (value === undefined) return [err(`question:${q.key}`, 'בחרו תשובה.')];
    const valid =
      q.scale === 'yes_no' ? value === YES || value === NO : Number.isInteger(value) && value >= 1 && value <= 5;
    return valid ? [] : [err(`question:${q.key}`, 'התשובה לא תקינה. בחרו שוב.')];
  });
}

function wordsErrors(body: string): StepError[] {
  const n = length(body);
  if (n < BODY_MIN) return [err('body', `עוד ${chars(BODY_MIN - n)} לפחות.`)];
  if (n > BODY_MAX) return [err('body', `ארוך ב${n - BODY_MAX === 1 ? 'תו אחד' : `-${n - BODY_MAX} תווים`} מהמותר.`)];
  return [];
}

function nameErrors(draft: DraftFields): StepError[] {
  if (draft.displayMode === 'anonymous') return [];
  const name = draft.displayName.trim();
  if (name === '') return [err('displayName', 'כתבו איך להציג את השם.')];
  if (name.length > NAME_MAX) return [err('displayName', 'השם ארוך מדי.')];
  return [];
}

/** ההודעות של צעד אחד, בעברית, כל אחת עם השדה שלה. רשימה ריקה: אפשר להמשיך. */
export function stepErrors(
  step: StepId,
  draft: DraftFields,
  ctx: StepContext,
  proofs: readonly ProofChoice[] = [],
): StepError[] {
  switch (step) {
    case 'when':
      return whenErrors(draft, ctx.thisMonth);
    case 'questions':
      return answerErrors(draft.answers, ctx.questions);
    case 'words':
      return wordsErrors(draft.body);
    case 'name':
      return nameErrors(draft);
    case 'proof':
      return proofErrors(proofs).map((message) => err('proofs', message));
  }
}

/** מאיפה ממשיכים טיוטה: הצעד הראשון שלא הושלם, או ההוכחה. */
export function firstIncompleteStep(draft: DraftFields, ctx: StepContext): StepId {
  for (const step of ['when', 'questions', 'words', 'name'] as const) {
    if (stepErrors(step, draft, ctx).length > 0) return step;
  }
  return 'proof';
}
