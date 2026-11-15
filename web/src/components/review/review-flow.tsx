'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { TickMark } from '@/components/notebook/tick';
import { PenNumber } from '@/components/site/pen';
import { buttonVariants } from '@/components/ui/button';
import { useAccount } from '@/lib/account/store';
import {
  SUBMIT_MESSAGE,
  loadMyReviews,
  readAttached,
  saveAnswers,
  saveFields,
  startDraft,
  submitReview,
  writeAttached,
  type AttachedProof,
  type MyReview,
} from '@/lib/reviews/browser';
import type { ReviewFormData } from '@/lib/reviews/review-form';
import {
  STEPS,
  STEP_TITLE,
  displayNameFor,
  firstIncompleteStep,
  stepErrors,
  thisMonthOf,
  type DraftFields,
  type ErrorField,
  type StepError,
  type StepId,
} from '@/lib/reviews/steps';
import { cn } from '@/lib/utils';
import { ProofStep, primaryButton } from './proof-step';
import { NameStep, QuestionsStep, WhenStep, WordsStep, fieldId } from './review-steps';

/** הטופס: השדות, מזהה הטיוטה (אחרי צעד 1), ההודעה של גל אם חזרה, והשם כפי שהוקלד. */
interface Draft extends DraftFields {
  reviewId: string | null;
  decisionNote: string | null;
  typedName: string;
}

const EMPTY: Draft = {
  reviewId: null,
  decisionNote: null,
  cohortMonth: null,
  finishedMonth: null,
  answers: {},
  body: '',
  displayMode: 'first_initial',
  displayName: '',
  typedName: '',
  authorTitle: 'none',
};

const SAVE_FAILED = 'לא הצלחנו לשמור. בדקו את החיבור, ונסו שוב.';
const DUPLICATE = 'כבר יש לכם ביקורת על המחזור הזה. אפשר לראות אותה ב"הביקורות שלי".';

function fromReview(review: MyReview): Draft {
  return {
    reviewId: review.id,
    decisionNote: review.decisionNote,
    cohortMonth: review.cohortMonth,
    finishedMonth: review.finishedMonth,
    answers: review.answers,
    body: review.body,
    displayMode: review.displayMode,
    displayName: review.displayName,
    typedName: review.displayMode === 'anonymous' ? '' : review.displayName,
    authorTitle: review.authorTitle,
  };
}

/** אילו הודעות יורדות כששדה בטיוטה משתנה. שני החודשים נבדקים יחד, ולכן כל אחד מוריד את שתיהן. */
const CLEARS: Partial<Record<keyof Draft, readonly ErrorField[]>> = {
  cohortMonth: ['cohortMonth', 'finishedMonth'],
  finishedMonth: ['cohortMonth', 'finishedMonth'],
  body: ['body'],
  displayMode: ['displayName'],
  typedName: ['displayName'],
};

/** פוקוס לשדה הראשון שיש בו בעיה. בקבוצת רדיו: לתשובה שבסדר הטאב, הנבחרת או הראשונה. */
function focusField(field: ErrorField) {
  const element = document.getElementById(fieldId(field));
  if (!element) return;
  const target =
    element.getAttribute('role') === 'radiogroup' ? element.querySelector<HTMLElement>('[tabindex="0"]') : element;
  (target ?? element).focus();
}

/** השדות כמו שיישמרו: השם לתצוגה נגזר ממה שהוקלד. */
const fieldsOf = (draft: Draft): DraftFields => ({
  ...draft,
  displayName: displayNameFor(draft.displayMode, draft.typedName),
});

type Phase =
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'done-before'; review: MyReview }
  | { kind: 'intro' }
  | { kind: 'step'; step: StepId }
  | { kind: 'sent' };

const secondary = cn(
  buttonVariants({ variant: 'outline' }),
  'h-[50px] border-[1.5px] border-ink px-6 font-sans text-base font-bold',
);
const textLink = 'inline-flex min-h-11 items-center underline underline-offset-[3px] hover:text-link-hover';
const sectionTitle = 'pen-rule text-[21px] leading-snug font-bold outline-none lg:text-[28px]';
/** דף מחברת: עמודת שוליים עם קו כפול, והתוכן אחריה (globals.css, .margin-rule). */
const notebookPage = 'margin-rule grid grid-cols-[var(--margin)_minmax(0,1fr)]';
/** הערה של האתר בשוליים: עט כחול (כמו בעמוד ההתחברות). */
const marginNote = ' pe-1.5 font-pen text-sm leading-snug font-medium text-pen lg:text-base';

/** לפני הצעד הראשון: מה צריך ובכמה זמן (מסמך העיצוב, סעיף 3). החמישה צעדים כשורות במחברת, ממוספרים בעט. */
function Intro({ note, children }: { note?: string | null; children: React.ReactNode }) {
  return (
    <section aria-labelledby="intro-h" className="mt-8 lg:mt-12">
      <h2 id="intro-h" className={sectionTitle}>
        לפני שמתחילים
      </h2>
      <p className="mt-3 max-w-[60ch] text-base leading-[1.8] lg:text-[17px]">
        חמש דקות, וחשבונית, קבלה או תעודת סיום. בלי הוכחה הביקורת לא מתפרסמת. רק אנחנו רואים את ההוכחה, והיא נמחקת
        אחרי הבדיקה.
      </p>
      {/* קו השוליים ושורת הפתיחה הם שני ::before, ולכן על שני אלמנטים (כמו בעמוד ההתחברות). */}
      <div className="margin-rule mt-4">
        <ol aria-label="הצעדים" className="ruled-top">
          {STEPS.map((step, i) => (
            <li key={step} className="ruled-row grid min-h-10 grid-cols-[var(--margin)_minmax(0,1fr)] items-center">
              <PenNumber n={i + 1} className="ms-2 size-[26px] text-[15px] lg:ms-3" />
              <span className="ps-3 font-sans text-[15px] lg:text-base">{STEP_TITLE[step]}</span>
            </li>
          ))}
        </ol>
      </div>
      {note && (
        <div role="note" className="mt-6 border-s border-ink ps-3 font-sans text-[15px] leading-normal">
          <p className="font-bold">הביקורת חזרה אליכם:</p>
          <p className="mt-1">{note}</p>
        </div>
      )}
      <div className="mt-6">{children}</div>
    </section>
  );
}

/**
 * מסלול הכתיבה. העמוד סטטי, וכל זה נטען בדפדפן: ההתחברות, הטיוטה של הקורס הזה (my_reviews),
 * והקבצים שכבר הועלו (localStorage). הטיוטה נשמרת בכל מעבר צעד, במסד.
 */
export function ReviewFlow({ form }: { form: ReviewFormData }) {
  const account = useAccount();
  const userId = account.status === 'signed-in' ? account.userId : null;
  const [phase, setPhase] = useState<Phase>({ kind: 'loading' });
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [proofs, setProofs] = useState<AttachedProof[]>([]);
  const [thisMonth, setThisMonth] = useState('');
  /** הודעות של שדה, כל אחת מתחת לשדה שלה. */
  const [fieldErrors, setFieldErrors] = useState<StepError[]>([]);
  /** הודעה שאינה של שדה אחד: שמירה שנכשלה, ביקורת כפולה, שליחה שנכשלה. */
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  /** לאיזה כיוון מדפדפים לצעד הבא. */
  const [turn, setTurn] = useState<'next' | 'back'>('next');
  const [uploading, setUploading] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const focusAfterErrors = useRef<ErrorField | null>(null);

  // הטיוטה הפתוחה של הקורס הזה, אם יש. ביקורת שכבר נשלחה או פורסמה: הודעה, ואפשר לכתוב על מחזור אחר.
  useEffect(() => {
    if (!userId) return;
    let alive = true;
    loadMyReviews().then(
      (list) => {
        if (!alive) return;
        const mine = list.filter((r) => r.courseId === form.courseId);
        const open = mine.find((r) => r.status === 'draft');
        setThisMonth(thisMonthOf(new Date()));
        if (open) {
          setDraft(fromReview(open));
          setProofs(readAttached(open.id));
        }
        const before = mine.find((r) => r.status !== 'draft');
        setPhase(!open && before ? { kind: 'done-before', review: before } : { kind: 'intro' });
      },
      () => {
        if (alive) setPhase({ kind: 'error' });
      },
    );
    return () => {
      alive = false;
    };
  }, [userId, form.courseId]);

  // צעד חדש: הפוקוס עובר לכותרת שלו, כדי שקורא מסך יקרא איפה הוא.
  useEffect(() => {
    if (phase.kind === 'step' || phase.kind === 'sent') heading.current?.focus();
  }, [phase]);

  // הודעות חדשות על שדות: הפוקוס עובר לשדה הראשון, וקורא המסך קורא את ההודעה שמתחתיו (aria-describedby).
  useEffect(() => {
    const field = focusAfterErrors.current;
    focusAfterErrors.current = null;
    if (field) focusField(field);
  }, [fieldErrors]);

  const ctx = { questions: form.questions, thisMonth };

  function clearErrors(fields: readonly ErrorField[]) {
    setFieldErrors((current) =>
      current.some((e) => fields.includes(e.field)) ? current.filter((e) => !fields.includes(e.field)) : current,
    );
    setFormError(null);
  }

  function showFieldErrors(errors: StepError[]) {
    focusAfterErrors.current = errors[0]?.field ?? null;
    setFieldErrors(errors);
    setFormError(null);
  }

  function showFormError(message: string) {
    setFieldErrors([]);
    setFormError(message);
  }

  function update(change: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...change }));
    clearErrors((Object.keys(change) as (keyof Draft)[]).flatMap((key) => CLEARS[key] ?? []));
  }

  function answer(key: string, value: number) {
    setDraft((current) => ({ ...current, answers: { ...current.answers, [key]: value } }));
    clearErrors([`question:${key}`]);
  }

  function go(step: StepId) {
    setFieldErrors([]);
    setFormError(null);
    // קדימה הדף החדש נכנס משמאל, אחורה מימין: כמו לדפדף במחברת בעברית (globals.css, page-turn).
    setTurn(phase.kind === 'step' && STEPS.indexOf(step) < STEPS.indexOf(phase.step) ? 'back' : 'next');
    setPhase({ kind: 'step', step });
  }

  function start() {
    if (!draft.reviewId) go('when');
    else go(draft.decisionNote ? 'proof' : firstIncompleteStep(fieldsOf(draft), ctx));
  }

  /** שומר את הצעד. מחזיר הודעה, או null כשנשמר. */
  async function save(step: StepId): Promise<string | null> {
    if (!userId) return SUBMIT_MESSAGE.signed_out;
    if (step === 'when' && draft.cohortMonth) {
      if (!draft.reviewId) {
        const started = await startDraft({
          courseId: form.courseId,
          authorId: userId,
          cohortMonth: draft.cohortMonth,
          finishedMonth: draft.finishedMonth,
        });
        if ('error' in started) return started.error === 'duplicate' ? DUPLICATE : SAVE_FAILED;
        setDraft((current) => ({ ...current, reviewId: started.id }));
        return null;
      }
      const saved = await saveFields(draft.reviewId, { cohort_month: draft.cohortMonth, finished_month: draft.finishedMonth });
      return saved === 'ok' ? null : saved === 'duplicate' ? DUPLICATE : SAVE_FAILED;
    }
    if (!draft.reviewId) return SAVE_FAILED;
    let saved: 'ok' | 'duplicate' | 'error' = 'ok';
    if (step === 'questions') saved = await saveAnswers(draft.reviewId, draft.answers);
    if (step === 'words') saved = await saveFields(draft.reviewId, { body: draft.body.trim() });
    if (step === 'name') {
      saved = await saveFields(draft.reviewId, {
        display_mode: draft.displayMode,
        display_name: displayNameFor(draft.displayMode, draft.typedName),
        author_title: draft.authorTitle,
      });
    }
    return saved === 'ok' ? null : SAVE_FAILED;
  }

  async function next(step: StepId) {
    const problems = stepErrors(step, fieldsOf(draft), ctx, proofs);
    if (problems.length > 0) {
      showFieldErrors(problems);
      return;
    }
    setBusy(true);
    const failed = await save(step);
    setBusy(false);
    if (failed) {
      showFormError(failed);
      return;
    }
    go(STEPS[STEPS.indexOf(step) + 1]);
  }

  async function send() {
    if (!draft.reviewId) return;
    const problems = stepErrors('proof', fieldsOf(draft), ctx, proofs);
    if (problems.length > 0) {
      showFieldErrors(problems);
      return;
    }
    setFieldErrors([]);
    setFormError(null);
    setBusy(true);
    const result = await submitReview(draft.reviewId, proofs);
    setBusy(false);
    if (result === 'ok') {
      writeAttached(draft.reviewId, []);
      setPhase({ kind: 'sent' });
      return;
    }
    // קובץ שכבר לא אצלנו או שלא נפתח: ההודעה מתחת לבחירת הקובץ, שחוזרת כשהרשימה מתרוקנת.
    if (result === 'file_missing' || result === 'bad_file') {
      writeAttached(draft.reviewId, []);
      setProofs([]);
      showFieldErrors([{ field: 'proofs', message: SUBMIT_MESSAGE[result] }]);
      return;
    }
    if (result === 'incomplete') setPhase({ kind: 'step', step: firstIncompleteStep(fieldsOf(draft), ctx) });
    showFormError(SUBMIT_MESSAGE[result]);
  }

  // לפני שידוע מי המבקר: ההקדמה כבר על הדף, והמקום של הכפתור שמור, כדי שהדף לא יקפוץ.
  if (account.status === 'loading' || (account.status === 'signed-in' && phase.kind === 'loading')) {
    return (
      <Intro>
        <p role="status" className="sr-only">
          טוענים
        </p>
        <div aria-hidden="true" className="h-[50px]" />
      </Intro>
    );
  }
  if (account.status === 'error' || phase.kind === 'error') {
    return (
      <p role="alert" className="mt-8 font-sans text-[15px] font-bold">
        לא הצלחנו לטעון את הטיוטה. נסו לרענן את הדף.
      </p>
    );
  }
  if (account.status === 'signed-out' || !userId) {
    return (
      <Intro>
        <Link href={`/login?next=${encodeURIComponent(`/courses/${form.slug}/review`)}`} className={primaryButton}>
          להתחבר ולהתחיל
        </Link>
        <p className="mt-3 font-sans text-[13px] text-ink-soft">ההתחברות בקישור למייל, בלי סיסמה.</p>
      </Intro>
    );
  }

  if (phase.kind === 'done-before') {
    const pending = phase.review.status === 'pending';
    return (
      <Intro>
        <p className="font-sans text-[15px] font-bold">
          {pending
            ? 'הביקורת שלכם על הקורס הזה ממתינה לבדיקה. נבדוק תוך 48 שעות.'
            : 'כבר כתבתם ביקורת על הקורס הזה.'}
        </p>
        {/* ביקורת אחת לכל מחזור: מי שחוזר לכאן רוצה בדרך כלל לראות את מה ששלח. */}
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/me#reviews" className={primaryButton}>
            לביקורות שלי
          </Link>
          <button
            type="button"
            className={secondary}
            onClick={() => {
              setDraft(EMPTY);
              setProofs([]);
              go('when');
            }}
          >
            ביקורת על מחזור אחר
          </button>
        </div>
      </Intro>
    );
  }

  if (phase.kind === 'sent') {
    return (
      <section aria-labelledby="sent-h" className={cn(notebookPage, 'mt-8 lg:mt-12')}>
        <p className={cn(marginNote, 'flex flex-col items-start gap-1 pt-1')}>
          <TickMark className="size-8" />
          נשלח
        </p>
        <div className="min-w-0 ps-3">
          <h2 id="sent-h" ref={heading} tabIndex={-1} className={sectionTitle}>
            קיבלנו
          </h2>
          <p className="mt-3 max-w-[60ch] text-base leading-[1.8] lg:text-[17px]">
            נבדוק תוך 48 שעות, ותראו את התשובה ב&quot;הביקורות שלי&quot;. אחרי ההחלטה הקובץ נמחק.
          </p>
          <p className="mt-2 font-sans text-[15px] font-semibold">
            <Link href="/me#reviews" className={textLink}>
              לביקורות שלי
            </Link>
          </p>
        </div>
      </section>
    );
  }

  if (phase.kind === 'intro') {
    return (
      <Intro note={draft.decisionNote}>
        <button type="button" className={primaryButton} onClick={start}>
          {draft.reviewId ? 'להמשיך מאיפה שעצרתם' : 'להתחיל'}
        </button>
      </Intro>
    );
  }

  // כאן נשאר רק צעד: את 'loading' סיננו למעלה, אבל TypeScript לא מצמצם דרך התנאי המורכב.
  if (phase.kind !== 'step') return null;
  const step = phase.step;
  const index = STEPS.indexOf(step);
  const body =
    step === 'when' ? (
      <WhenStep
        cohortMonth={draft.cohortMonth}
        finishedMonth={draft.finishedMonth}
        thisMonth={thisMonth}
        errors={fieldErrors}
        onChange={update}
      />
    ) : step === 'questions' ? (
      <QuestionsStep questions={form.questions} answers={draft.answers} errors={fieldErrors} onAnswer={answer} />
    ) : step === 'words' ? (
      <WordsStep body={draft.body} errors={fieldErrors} onChange={(text) => update({ body: text })} />
    ) : step === 'name' ? (
      <NameStep
        displayMode={draft.displayMode}
        typedName={draft.typedName}
        authorTitle={draft.authorTitle}
        cohortMonth={draft.cohortMonth}
        body={draft.body}
        errors={fieldErrors}
        onChange={update}
      />
    ) : draft.reviewId ? (
      <ProofStep
        userId={userId}
        reviewId={draft.reviewId}
        proofs={proofs}
        decisionNote={draft.decisionNote}
        uploading={uploading}
        errors={fieldErrors}
        onUploading={setUploading}
        onChange={(next) => {
          setProofs(next);
          clearErrors(['proofs']);
        }}
      />
    ) : null;

  return (
    <section aria-labelledby="step-h" className={cn(notebookPage, 'mt-8 lg:mt-12')}>
      {/* ההתקדמות בעט, בשוליים (מסמך העיצוב, סעיף 9). */}
      <p className={cn(marginNote, 'pt-1.5')}>
        צעד {index + 1} מתוך {STEPS.length}
      </p>
      {/* key: כל צעד הוא דף חדש, והוא נכנס בדפדוף (globals.css, page-turn). */}
      <div key={step} data-turn={turn} className="page-turn min-w-0 ps-3">
        <h2 id="step-h" ref={heading} tabIndex={-1} className={sectionTitle}>
          {STEP_TITLE[step]}
        </h2>
        <div className="mt-5">{body}</div>
        {formError && (
          <p role="alert" className="mt-4 font-sans text-[15px] leading-normal font-bold">
            {formError}
          </p>
        )}
        <div className={cn('flex flex-wrap gap-3', step === 'proof' ? 'mt-10' : 'mt-8')}>
          {step === 'proof' ? (
            <button type="button" className={primaryButton} disabled={busy || uploading} onClick={() => void send()}>
              {busy ? 'שולחים…' : 'לשלוח לבדיקה'}
            </button>
          ) : (
            <button type="button" className={primaryButton} disabled={busy} onClick={() => void next(step)}>
              {busy ? 'שומרים…' : 'הבא'}
            </button>
          )}
          {index > 0 && (
            <button type="button" className={secondary} disabled={busy} onClick={() => go(STEPS[index - 1])}>
              חזרה
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
