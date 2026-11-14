import { describe, expect, it } from 'vitest';
import {
  displayNameFor,
  firstIncompleteStep,
  proofErrors,
  questionsFor,
  stepErrors,
  type DraftFields,
  type MetricDef,
  type StepContext,
} from './steps';

const METRICS: MetricDef[] = [
  { key: 'recommend', label: 'ממליץ', scale: 'yes_no', course_types: ['career', 'hobby', 'exam'], sort_order: 8 },
  { key: 'teaching', label: 'איכות הוראה', scale: 'likert5', course_types: ['career', 'hobby', 'exam'], sort_order: 1 },
  { key: 'hands_on', label: 'עשייה בפועל', scale: 'likert5', course_types: ['career'], sort_order: 2 },
  { key: 'value', label: 'ערך לכסף', scale: 'likert5', course_types: ['career', 'hobby', 'exam'], sort_order: 4 },
  { key: 'outcome_3m', label: 'אחרי 3 חודשים', scale: 'likert5', course_types: ['career'], sort_order: 5 },
  { key: 'skill_gained', label: 'רכשתי את המיומנות', scale: 'yes_no', course_types: ['hobby'], sort_order: 6 },
];

const ctx: StepContext = { questions: questionsFor('hobby', METRICS), thisMonth: '2026-11-01' };

const done: DraftFields = {
  cohortMonth: '2026-03-01',
  finishedMonth: '2026-06-01',
  answers: { teaching: 4, value: 3, skill_gained: 5, recommend: 1 },
  body: 'א'.repeat(80),
  displayMode: 'first_initial',
  displayName: 'נועה ר.',
  authorTitle: 'graduate_f',
};

describe('questionsFor', () => {
  it('asks the questions of the course type, in order, without the 3-month follow-up', () => {
    expect(questionsFor('hobby', METRICS).map((q) => q.key)).toEqual(['teaching', 'value', 'skill_gained', 'recommend']);
    expect(questionsFor('career', METRICS).map((q) => q.key)).toEqual(['teaching', 'hands_on', 'value', 'recommend']);
  });
});

describe('stepErrors', () => {
  it('needs a start month that already came, and a finish month after it', () => {
    expect(stepErrors('when', { ...done, cohortMonth: null }, ctx)).toEqual(['בחרו את חודש ההתחלה.']);
    expect(stepErrors('when', { ...done, cohortMonth: '2026-12-01', finishedMonth: null }, ctx)).toEqual([
      'חודש ההתחלה עוד לא הגיע.',
    ]);
    expect(stepErrors('when', { ...done, finishedMonth: '2026-01-01' }, ctx)).toEqual(['חודש הסיום לפני חודש ההתחלה.']);
    expect(stepErrors('when', { ...done, finishedMonth: null }, ctx)).toEqual([]);
  });

  it('needs every question, and a yes or no answer is only 1 or 5', () => {
    expect(stepErrors('questions', { ...done, answers: { teaching: 4 } }, ctx)).toEqual([
      'חסרות תשובות: ערך לכסף, רכשתי את המיומנות, ממליץ.',
    ]);
    expect(stepErrors('questions', { ...done, answers: { ...done.answers, skill_gained: 3 } }, ctx)).toEqual([
      'תשובה לא תקינה: רכשתי את המיומנות.',
    ]);
    expect(stepErrors('questions', done, ctx)).toEqual([]);
  });

  it('counts the review between 80 and 2,000 characters, without the spaces around it', () => {
    expect(stepErrors('words', { ...done, body: ` ${'א'.repeat(79)} ` }, ctx)).toEqual(['עוד תו אחד לפחות.']);
    expect(stepErrors('words', { ...done, body: 'א'.repeat(70) }, ctx)).toEqual(['עוד 10 תווים לפחות.']);
    expect(stepErrors('words', { ...done, body: 'א'.repeat(2005) }, ctx)).toEqual(['ארוך ב-5 תווים מהמותר.']);
    expect(stepErrors('words', done, ctx)).toEqual([]);
  });

  it('needs a name unless the review is anonymous', () => {
    expect(stepErrors('name', { ...done, displayName: ' ' }, ctx)).toEqual(['כתבו איך להציג את השם.']);
    expect(stepErrors('name', { ...done, displayMode: 'anonymous', displayName: 'בוגר מאומת' }, ctx)).toEqual([]);
  });
});

describe('displayNameFor', () => {
  it('stores only what the page will show', () => {
    expect(displayNameFor('first_initial', '  נועה   רוזן ')).toBe('נועה ר.');
    expect(displayNameFor('first_initial', 'נועה ר.')).toBe('נועה ר.');
    expect(displayNameFor('first_initial', 'נועה')).toBe('נועה');
    expect(displayNameFor('full', 'נועה  רוזן')).toBe('נועה רוזן');
    expect(displayNameFor('anonymous', 'נועה רוזן')).toBe('בוגר מאומת');
  });
});

describe('proofErrors', () => {
  const pdf = { mime: 'application/pdf', size: 1000 };
  it('takes a screenshot or a project only together with a proof that stands alone', () => {
    expect(proofErrors([])).toEqual(['צריך לפחות קובץ אחד.']);
    expect(proofErrors([{ kind: 'screenshot', ...pdf }])).toHaveLength(1);
    expect(proofErrors([{ kind: 'screenshot', ...pdf }, { kind: 'invoice', ...pdf }])).toEqual([]);
  });

  it('stops a third file, a big file and a file of another type', () => {
    const three = [{ kind: 'invoice' as const, ...pdf }, { kind: 'certificate' as const, ...pdf }, { kind: 'project' as const, ...pdf }];
    expect(proofErrors(three)).toEqual(['אפשר להעלות עד שני קבצים.']);
    expect(proofErrors([{ kind: 'invoice', mime: 'application/pdf', size: 10 * 1024 * 1024 + 1 }])).toHaveLength(1);
    expect(proofErrors([{ kind: 'invoice', mime: 'image/gif', size: 1000 }])).toHaveLength(1);
  });
});

describe('firstIncompleteStep', () => {
  it('continues a draft from the first step that is not done', () => {
    expect(firstIncompleteStep({ ...done, body: '' }, ctx)).toBe('words');
    expect(firstIncompleteStep(done, ctx)).toBe('proof');
  });
});
