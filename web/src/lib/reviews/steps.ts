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

export function proofErrors(files: readonly ProofChoice[]): string[] {
  if (files.length === 0) return ['צריך לפחות קובץ אחד.'];
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

function whenErrors(draft: DraftFields, thisMonth: string): string[] {
  if (!draft.cohortMonth) return ['בחרו את חודש ההתחלה.'];
  // חודשים בצורה '2026-03-01' משתווים נכון כמחרוזות.
  if (draft.cohortMonth > thisMonth) return ['חודש ההתחלה עוד לא הגיע.'];
  if (draft.finishedMonth && draft.finishedMonth < draft.cohortMonth) return ['חודש הסיום לפני חודש ההתחלה.'];
  if (draft.finishedMonth && draft.finishedMonth > thisMonth) return ['חודש הסיום עוד לא הגיע.'];
  return [];
}

function answerErrors(answers: Record<string, number>, questions: readonly Question[]): string[] {
  const missing = questions.filter((q) => answers[q.key] === undefined);
  if (missing.length > 0) return [`חסרות תשובות: ${missing.map((q) => q.label).join(', ')}.`];
  const invalid = questions.filter((q) => {
    const value = answers[q.key];
    return q.scale === 'yes_no' ? value !== YES && value !== NO : !(Number.isInteger(value) && value >= 1 && value <= 5);
  });
  return invalid.length > 0 ? [`תשובה לא תקינה: ${invalid.map((q) => q.label).join(', ')}.`] : [];
}

function wordsErrors(body: string): string[] {
  const n = length(body);
  if (n < BODY_MIN) return [`עוד ${chars(BODY_MIN - n)} לפחות.`];
  if (n > BODY_MAX) return [`ארוך ב${n - BODY_MAX === 1 ? 'תו אחד' : `-${n - BODY_MAX} תווים`} מהמותר.`];
  return [];
}

function nameErrors(draft: DraftFields): string[] {
  if (draft.displayMode === 'anonymous') return [];
  const name = draft.displayName.trim();
  if (name === '') return ['כתבו איך להציג את השם.'];
  if (name.length > NAME_MAX) return ['השם ארוך מדי.'];
  return [];
}

/** ההודעות של צעד אחד, בעברית. רשימה ריקה: אפשר להמשיך. */
export function stepErrors(
  step: StepId,
  draft: DraftFields,
  ctx: StepContext,
  proofs: readonly ProofChoice[] = [],
): string[] {
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
      return proofErrors(proofs);
  }
}

/** מאיפה ממשיכים טיוטה: הצעד הראשון שלא הושלם, או ההוכחה. */
export function firstIncompleteStep(draft: DraftFields, ctx: StepContext): StepId {
  for (const step of ['when', 'questions', 'words', 'name'] as const) {
    if (stepErrors(step, draft, ctx).length > 0) return step;
  }
  return 'proof';
}
