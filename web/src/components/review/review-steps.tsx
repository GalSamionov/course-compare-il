'use client';

import { PenNote, StickyNote } from '@/components/course/marks';
import { ChoiceChip } from '@/components/notebook/choice-chip';
import { PenLoop } from '@/components/site/pen';
import { displayNameFor, monthKey, type Question } from '@/lib/reviews/steps';
import {
  AUTHOR_TITLES,
  AUTHOR_TITLE_LABEL,
  BODY_MAX,
  BODY_MIN,
  DISPLAY_MODES,
  DISPLAY_MODE_LABEL,
  LIKERT_HIGH,
  LIKERT_LOW,
  NO,
  YES,
  verifiedLabel,
  type AuthorTitle,
  type DisplayMode,
} from '@/lib/reviews/types';
import { cn } from '@/lib/utils';

export const fieldLabel = 'font-sans text-[15px] font-semibold';
/** בחירה מתוך רשימה נשארת הפקד של המכשיר (מצב Operate), במסגרת דיו כמו שאר הפקדים. */
export const selectClass =
  'mt-2 block h-11 w-full max-w-[300px] rounded-[4px] border border-ink bg-white px-2.5 font-sans text-[15px] text-ink';
/**
 * שורה במחברת: הטקסט בעט כחול על הקו, ובפוקוס הקו מתעבה לדיו (DESIGN.md, Inputs).
 * הקו הוא צל פנימי ולא מסגרת, כדי שההתעבות לא תזיז את השורה.
 */
export const lineInput =
  'block h-11 w-full bg-transparent font-pen text-[21px] font-medium text-pen caret-pen shadow-[inset_0_-1px_0_var(--color-ruled)] outline-none focus:shadow-[inset_0_-2px_0_var(--color-ink)]';

export const monthLabel = (iso: string) =>
  new Intl.DateTimeFormat('he-IL', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(iso));

/** החודשים, מהחודש הנוכחי אחורה. */
function monthsBack(fromMonth: string, count: number): string[] {
  const [year, month] = fromMonth.split('-').map(Number);
  const start = year * 12 + (month - 1);
  return Array.from({ length: count }, (_, i) => monthKey(Math.floor((start - i) / 12), ((start - i) % 12) + 1));
}

/** צעד 1. רשימה אחת של חודשים לכל תאריך: פקד אחד, ובנייד הבורר של המכשיר. */
export function WhenStep({
  cohortMonth,
  finishedMonth,
  thisMonth,
  onChange,
}: {
  cohortMonth: string | null;
  finishedMonth: string | null;
  thisMonth: string;
  onChange: (change: { cohortMonth?: string | null; finishedMonth?: string | null }) => void;
}) {
  const months = monthsBack(thisMonth, 96);
  const finishMonths = cohortMonth ? months.filter((m) => m >= cohortMonth) : months;
  return (
    <div className="space-y-6">
      <label className="block">
        <span className={fieldLabel}>חודש ההתחלה</span>
        <select
          className={selectClass}
          value={cohortMonth ?? ''}
          onChange={(e) => onChange({ cohortMonth: e.target.value || null })}
        >
          <option value="">לבחור חודש</option>
          {months.map((m) => (
            <option key={m} value={m}>
              {monthLabel(m)}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className={fieldLabel}>חודש הסיום</span>
        <span className="ms-2 font-sans text-[13px] text-ink-soft">רשות</span>
        <select
          className={selectClass}
          value={finishedMonth ?? ''}
          onChange={(e) => onChange({ finishedMonth: e.target.value || null })}
        >
          <option value="">לא זוכר/ת</option>
          {finishMonths.map((m) => (
            <option key={m} value={m}>
              {monthLabel(m)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

/**
 * תשובה בשאלון מודפס: הכותב מקיף אותה בעט, כמו בשאלון על נייר. הכפתור עצמו נשאר מודפס ושקט.
 * data-value לבדיקת הקצה.
 */
function AnswerButton({
  value,
  pressed,
  label,
  className,
  onClick,
  children,
}: {
  value: number;
  pressed: boolean;
  label?: string;
  className?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      data-value={value}
      aria-pressed={pressed}
      aria-label={label}
      onClick={onClick}
      className={cn(
        // leading-none: העיגול בעט נמדד לפי השורה, וכך הוא עגול ולא אליפסה גבוהה.
        'inline-flex h-11 items-center justify-center rounded-[4px] border border-ink bg-white font-sans text-[15px] leading-none transition-colors hover:border-pen',
        pressed ? 'font-bold text-pen' : 'font-semibold text-ink',
        className,
      )}
    >
      {pressed ? <PenLoop>{children}</PenLoop> : children}
    </button>
  );
}

/** צעד 2. כן או לא נשמר כ-5 או כ-1 (המסד לא מקבל ערך אחר). */
export function QuestionsStep({
  questions,
  answers,
  onAnswer,
}: {
  questions: readonly Question[];
  answers: Record<string, number>;
  onAnswer: (key: string, value: number) => void;
}) {
  return (
    // בנייד: שאלה ומתחתיה התשובות. במחשב: שאלון מודפס, שורה לכל שאלה, השאלה מימין והתשובות משמאל.
    // fieldset עם aria-labelledby ולא legend, כי legend לא נכנס לרשת.
    <div className="space-y-7 lg:max-w-[620px] lg:space-y-0 lg:border-t lg:border-ruled">
      {questions.map((q) => (
        <fieldset
          key={q.key}
          data-question={q.key}
          aria-labelledby={`q-${q.key}`}
          className="lg:grid lg:grid-cols-[minmax(0,1fr)_252px] lg:items-center lg:gap-x-10 lg:border-b lg:border-ruled lg:py-4"
        >
          <p id={`q-${q.key}`} className={cn(fieldLabel, 'leading-snug text-pretty lg:text-base')}>
            {q.label}
          </p>
          {q.scale === 'yes_no' ? (
            <div className="mt-2.5 flex gap-2.5 lg:mt-0">
              {[
                { value: YES, text: 'כן' },
                { value: NO, text: 'לא' },
              ].map((option) => (
                <AnswerButton
                  key={option.value}
                  value={option.value}
                  pressed={answers[q.key] === option.value}
                  className="min-w-16 px-3"
                  onClick={() => onAnswer(q.key, option.value)}
                >
                  {option.text}
                </AnswerButton>
              ))}
            </div>
          ) : (
            // חמש עמודות שוות: ב-375 כל כפתור 44 על 44, ובטלפון צר הן מצטמצמות מעט במקום לגלוש.
            <div className="max-w-[252px]">
              <div className="mt-2.5 grid grid-cols-5 gap-1.5 lg:mt-0">
                {[1, 2, 3, 4, 5].map((v) => (
                  <AnswerButton
                    key={v}
                    value={v}
                    label={`${v} מתוך 5`}
                    pressed={answers[q.key] === v}
                    className="w-full tabular-nums"
                    onClick={() => onAnswer(q.key, v)}
                  >
                    {v}
                  </AnswerButton>
                ))}
              </div>
              <p aria-hidden="true" className="mt-1 flex justify-between font-sans text-[13px] text-ink-soft">
                <span>{LIKERT_LOW}</span>
                <span>{LIKERT_HIGH}</span>
              </p>
            </div>
          )}
        </fieldset>
      ))}
    </div>
  );
}

/** צעד 3. הטקסט נכתב בעט על שורות המחברת. */
export function WordsStep({ body, onChange }: { body: string; onChange: (body: string) => void }) {
  const count = [...body.trim()].length;
  return (
    <div>
      <ul className="list-disc space-y-1 ps-5 font-sans text-[15px] text-ink-soft">
        <li>מה היה טוב?</li>
        <li>מה היה חלש?</li>
        <li>למי הייתם ממליצים?</li>
      </ul>
      <label className="mt-4 block">
        <span className="sr-only">במילים שלך</span>
        {/* השורות הן רקע שגולל עם הטקסט (bg-local), ושורת הכתיבה האחרונה מתעבה לדיו בפוקוס. */}
        <textarea
          value={body}
          rows={9}
          maxLength={BODY_MAX + 200}
          onChange={(e) => onChange(e.target.value)}
          className="block w-full max-w-[640px] resize-y bg-transparent bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_33px,var(--color-ruled)_33px,var(--color-ruled)_34px)] bg-local font-pen text-[19px] leading-[34px] font-medium text-pen caret-pen shadow-[inset_0_1px_0_var(--color-ruled)] outline-none focus:shadow-[inset_0_1px_0_var(--color-ruled),inset_0_-2px_0_var(--color-ink)]"
        />
      </label>
      <p
        className={cn('mt-2 font-sans text-[13px] tabular-nums', count > BODY_MAX ? 'font-bold text-ink' : 'text-ink-soft')}
        aria-live="polite"
      >
        {count.toLocaleString('en-US')} מתוך {BODY_MAX.toLocaleString('en-US')} תווים
        {count < BODY_MIN ? `, לפחות ${BODY_MIN}` : ''}
      </p>
    </div>
  );
}

/** הפתק הצהוב, כמו שיופיע בעמוד הקורס (reviews-section.tsx). */
export function NotePreview({
  name,
  title,
  cohortMonth,
  body,
}: {
  name: string | null;
  title: AuthorTitle;
  cohortMonth: string | null;
  body: string;
}) {
  const label = verifiedLabel(title);
  return (
    <StickyNote tone="grad" tilt={0.6} className="mt-5 max-w-[340px] px-4 pt-5 pb-3.5 lg:px-5">
      <p className="text-[13px]">
        {name ? (
          <>
            <strong>{name}</strong>, {label}
          </>
        ) : (
          <strong>{label}</strong>
        )}
        {cohortMonth && <>, מחזור {monthLabel(cohortMonth)}</>}
      </p>
      <p className="mt-1.5 line-clamp-6 font-serif text-[15px] leading-relaxed lg:text-base">{body.trim()}</p>
    </StickyNote>
  );
}

/** צעד 4. רק הצורה שתוצג נשמרת: "נועה ר." ולא השם המלא (notes-for-plan-2.md, פרטיות). */
export function NameStep({
  displayMode,
  typedName,
  authorTitle,
  cohortMonth,
  body,
  onChange,
}: {
  displayMode: DisplayMode;
  typedName: string;
  authorTitle: AuthorTitle;
  cohortMonth: string | null;
  body: string;
  onChange: (change: { displayMode?: DisplayMode; typedName?: string; authorTitle?: AuthorTitle }) => void;
}) {
  const shown = displayNameFor(displayMode, typedName);
  return (
    <div className="space-y-7">
      <fieldset>
        <legend className={fieldLabel}>השם</legend>
        <div className="mt-2.5 flex flex-wrap gap-2.5">
          {DISPLAY_MODES.map((mode) => (
            <ChoiceChip key={mode} pressed={displayMode === mode} onClick={() => onChange({ displayMode: mode })}>
              {DISPLAY_MODE_LABEL[mode]}
            </ChoiceChip>
          ))}
        </div>
        {displayMode !== 'anonymous' && (
          <label className="mt-5 block max-w-[320px]">
            <span className={fieldLabel}>השם שלכם</span>
            <input
              value={typedName}
              maxLength={80}
              autoComplete="name"
              onChange={(e) => onChange({ typedName: e.target.value })}
              className={cn(lineInput, 'mt-1')}
            />
          </label>
        )}
        {displayMode === 'first_initial' && shown && (
          <PenNote arrow className="mt-2.5">
            נשמר רק כך: {shown}
          </PenNote>
        )}
      </fieldset>
      <fieldset>
        <legend className={fieldLabel}>איך לכתוב עליכם</legend>
        <div className="mt-2.5 flex flex-wrap gap-2.5">
          {AUTHOR_TITLES.map((title) => (
            <ChoiceChip key={title} pressed={authorTitle === title} onClick={() => onChange({ authorTitle: title })}>
              {AUTHOR_TITLE_LABEL[title]}
            </ChoiceChip>
          ))}
        </div>
      </fieldset>
      <div>
        <p className="font-sans text-[13px] text-ink-soft">כך זה ייראה בעמוד הקורס:</p>
        <NotePreview
          name={displayMode === 'anonymous' ? null : shown}
          title={authorTitle}
          cohortMonth={cohortMonth}
          body={body}
        />
      </div>
    </div>
  );
}
