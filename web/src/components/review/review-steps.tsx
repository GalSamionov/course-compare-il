'use client';

import { useId, useRef } from 'react';
import { PenNote, StickyNote } from '@/components/course/marks';
import { PenLoop } from '@/components/site/pen';
import { displayNameFor, monthKey, type ErrorField, type Question, type StepError } from '@/lib/reviews/steps';
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
 * שורה במחברת שהכותב ממלא: דיו מודפסת על הקו, כי זה הקול של הבוגר ולא של האתר (DESIGN.md, The One Pen Rule).
 * השם מודפס כמו שיופיע בפתק, ב-Assistant מודגש. בפוקוס הקו מתעבה לדיו. הקו הוא צל פנימי ולא מסגרת,
 * כדי שההתעבות לא תזיז את השורה.
 */
export const lineInput =
  'block h-11 w-full bg-transparent font-sans text-[17px] font-semibold text-ink caret-ink shadow-[inset_0_-1px_0_var(--color-ruled)] outline-none focus:shadow-[inset_0_-2px_0_var(--color-ink)]';

export const monthLabel = (iso: string) =>
  new Intl.DateTimeFormat('he-IL', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(iso));

/** ה-id של השדה ושל ההודעה שמתחתיו. review-flow.tsx מעביר אליו את הפוקוס כשיש בו בעיה. */
export const fieldId = (field: ErrorField) => `field-${field.replace(':', '-')}`;
export const errorId = (field: ErrorField) => `${fieldId(field)}-error`;

const has = (errors: readonly StepError[], field: ErrorField) => errors.some((e) => e.field === field);

/** aria-invalid ו-aria-describedby לשדה שיש בו בעיה. more: עוד תיאור קבוע, כמו שורת הסבר. */
export function invalidProps(errors: readonly StepError[], field: ErrorField, more?: string) {
  const invalid = has(errors, field);
  const describedBy = [more, invalid ? errorId(field) : undefined].filter(Boolean).join(' ');
  return { 'aria-invalid': invalid || undefined, 'aria-describedby': describedBy || undefined };
}

/** ההודעה מתחת לשדה, בדיו מודגשת ובלי צבע (DESIGN.md, Inputs). הפוקוס בשדה, וקורא המסך קורא אותה ממנו. */
export function FieldError({ errors, field, className }: { errors: readonly StepError[]; field: ErrorField; className?: string }) {
  const messages = errors.filter((e) => e.field === field);
  if (messages.length === 0) return null;
  return (
    <div id={errorId(field)} className={cn('mt-2 space-y-0.5 font-sans text-[15px] leading-normal font-bold', className)}>
      {messages.map((e) => (
        <p key={e.message}>{e.message}</p>
      ))}
    </div>
  );
}

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
  errors,
  onChange,
}: {
  cohortMonth: string | null;
  finishedMonth: string | null;
  thisMonth: string;
  errors: readonly StepError[];
  onChange: (change: { cohortMonth?: string | null; finishedMonth?: string | null }) => void;
}) {
  const months = monthsBack(thisMonth, 96);
  const finishMonths = cohortMonth ? months.filter((m) => m >= cohortMonth) : months;
  // ההודעה מחוץ לתווית: אחרת היא הופכת לחלק מהשם של השדה.
  return (
    <div className="space-y-6">
      <div>
        <label htmlFor={fieldId('cohortMonth')} className={fieldLabel}>
          חודש ההתחלה
        </label>
        <select
          id={fieldId('cohortMonth')}
          className={selectClass}
          value={cohortMonth ?? ''}
          aria-required="true"
          {...invalidProps(errors, 'cohortMonth')}
          onChange={(e) => onChange({ cohortMonth: e.target.value || null })}
        >
          <option value="">לבחור חודש</option>
          {months.map((m) => (
            <option key={m} value={m}>
              {monthLabel(m)}
            </option>
          ))}
        </select>
        <FieldError errors={errors} field="cohortMonth" />
      </div>
      <div>
        <label htmlFor={fieldId('finishedMonth')}>
          <span className={fieldLabel}>חודש הסיום</span>
          <span className="ms-2 font-sans text-[13px] text-ink-soft">רשות</span>
        </label>
        <select
          id={fieldId('finishedMonth')}
          className={selectClass}
          value={finishedMonth ?? ''}
          {...invalidProps(errors, 'finishedMonth')}
          onChange={(e) => onChange({ finishedMonth: e.target.value || null })}
        >
          <option value="">לא זוכר/ת</option>
          {finishMonths.map((m) => (
            <option key={m} value={m}>
              {monthLabel(m)}
            </option>
          ))}
        </select>
        <FieldError errors={errors} field="finishedMonth" />
      </div>
    </div>
  );
}

interface RadioOption<T> {
  value: T;
  text: string;
  /** שם אחר לקורא מסך, כמו "4 מתוך 5" לספרה 4. */
  label?: string;
}

/**
 * תשובה אחת מתוך כמה, כמו בשאלון מודפס: הכותב מקיף את התשובה שבחר בעט. הכפתורים עצמם מודפסים ושקטים.
 * קבוצת רדיו אמיתית (WAI-ARIA, Radio Group): רק התשובה הנבחרת נכנסת לסדר הטאב, והחצים עוברים ובוחרים.
 * מימין לשמאל, חץ שמאלה הוא התשובה הבאה. data-value לבדיקת הקצה.
 */
function RadioGroup<T extends string | number>({
  options,
  value,
  onChange,
  labelledBy,
  field,
  errors,
  className,
  itemClassName,
}: {
  options: readonly RadioOption<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
  labelledBy: string;
  field?: ErrorField;
  errors?: readonly StepError[];
  className?: string;
  itemClassName?: string;
}) {
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const checked = options.findIndex((o) => o.value === value);
  // בלי תשובה: הטאב נכנס לראשונה.
  const tabStop = checked === -1 ? 0 : checked;

  function move(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = options.length - 1;
    const next = (i: number) => (i === last ? 0 : i + 1);
    const previous = (i: number) => (i === 0 ? last : i - 1);
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
    const target =
      event.key === 'ArrowDown' || event.key === (rtl ? 'ArrowLeft' : 'ArrowRight')
        ? next(index)
        : event.key === 'ArrowUp' || event.key === (rtl ? 'ArrowRight' : 'ArrowLeft')
          ? previous(index)
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : null;
    if (target === null) return;
    event.preventDefault();
    onChange(options[target].value);
    items.current[target]?.focus();
  }

  return (
    <div
      role="radiogroup"
      id={field ? fieldId(field) : undefined}
      aria-labelledby={labelledBy}
      aria-required="true"
      {...(field && errors ? invalidProps(errors, field) : {})}
      className={className}
    >
      {options.map((option, i) => {
        const on = i === checked;
        return (
          <button
            key={option.value}
            ref={(el) => {
              items.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={option.label}
            tabIndex={i === tabStop ? 0 : -1}
            data-value={option.value}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => move(event, i)}
            className={cn(
              // leading-none: העיגול בעט נמדד לפי השורה, וכך הוא עגול ולא אליפסה גבוהה.
              'inline-flex h-11 items-center justify-center rounded-[4px] border border-ink bg-white font-sans text-[15px] leading-none transition-colors hover:border-pen',
              on ? 'font-bold text-pen' : 'font-semibold text-ink',
              itemClassName,
            )}
          >
            {on ? <PenLoop>{option.text}</PenLoop> : option.text}
          </button>
        );
      })}
    </div>
  );
}

const YES_NO: readonly RadioOption<number>[] = [
  { value: YES, text: 'כן' },
  { value: NO, text: 'לא' },
];
const LIKERT: readonly RadioOption<number>[] = [1, 2, 3, 4, 5].map((v) => ({
  value: v,
  text: String(v),
  label: `${v} מתוך 5`,
}));

/** צעד 2. כן או לא נשמר כ-5 או כ-1 (המסד לא מקבל ערך אחר). */
export function QuestionsStep({
  questions,
  answers,
  errors,
  onAnswer,
}: {
  questions: readonly Question[];
  answers: Record<string, number>;
  errors: readonly StepError[];
  onAnswer: (key: string, value: number) => void;
}) {
  return (
    // בנייד: שאלה ומתחתיה התשובות. במחשב: שאלון מודפס, שורה לכל שאלה, השאלה מימין והתשובות משמאל.
    // השאלה היא השם של קבוצת הרדיו (aria-labelledby).
    <div className="space-y-7 lg:max-w-[620px] lg:space-y-0 lg:border-t lg:border-ruled">
      {questions.map((q) => {
        const field: ErrorField = `question:${q.key}`;
        return (
          <div
            key={q.key}
            data-question={q.key}
            className="lg:grid lg:grid-cols-[minmax(0,1fr)_252px] lg:items-center lg:gap-x-10 lg:border-b lg:border-ruled lg:py-4"
          >
            <p id={`q-${q.key}`} className={cn(fieldLabel, 'leading-snug text-pretty lg:text-base')}>
              {q.label}
            </p>
            {q.scale === 'yes_no' ? (
              <div>
                <RadioGroup
                  options={YES_NO}
                  value={answers[q.key]}
                  onChange={(value) => onAnswer(q.key, value)}
                  labelledBy={`q-${q.key}`}
                  field={field}
                  errors={errors}
                  className="mt-2.5 flex gap-2.5 lg:mt-0"
                  itemClassName="min-w-16 px-3"
                />
                <FieldError errors={errors} field={field} />
              </div>
            ) : (
              // חמש עמודות שוות: ב-375 כל כפתור 44 על 44, ובטלפון צר הן מצטמצמות מעט במקום לגלוש.
              <div className="max-w-[252px]">
                <RadioGroup
                  options={LIKERT}
                  value={answers[q.key]}
                  onChange={(value) => onAnswer(q.key, value)}
                  labelledBy={`q-${q.key}`}
                  field={field}
                  errors={errors}
                  className="mt-2.5 grid grid-cols-5 gap-1.5 lg:mt-0"
                  itemClassName="w-full tabular-nums"
                />
                <p aria-hidden="true" className="mt-1 flex justify-between font-sans text-[13px] text-ink-soft">
                  <span>{LIKERT_LOW}</span>
                  <span>{LIKERT_HIGH}</span>
                </p>
                <FieldError errors={errors} field={field} className="mt-1" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * צעד 3. הטקסט הוא הקול של הבוגר, ולכן הוא נכתב בדיו מודפסת על פתק צהוב שטוח: אותו פתק שיופיע בעמוד הקורס
 * (DESIGN.md, Sticky Note), בלי הטיה ובלי צל כי זה שדה ולא חפץ. קו דיו בתחתית מסמן את השדה, ומתעבה בפוקוס.
 */
export function WordsStep({
  body,
  errors,
  onChange,
}: {
  body: string;
  errors: readonly StepError[];
  onChange: (body: string) => void;
}) {
  const count = [...body.trim()].length;
  const countId = useId();
  return (
    <div>
      <ul className="list-disc space-y-1 ps-5 font-sans text-[15px] text-ink-soft">
        <li>מה היה טוב?</li>
        <li>מה היה חלש?</li>
        <li>למי הייתם ממליצים?</li>
      </ul>
      <label htmlFor={fieldId('body')} className="sr-only">
        במילים שלך
      </label>
      <textarea
        id={fieldId('body')}
        value={body}
        rows={9}
        maxLength={BODY_MAX + 200}
        aria-required="true"
        {...invalidProps(errors, 'body', countId)}
        onChange={(e) => onChange(e.target.value)}
        className="mt-4 block w-full max-w-[640px] resize-y bg-note-grad px-4 py-3 font-serif text-base leading-[1.75] text-ink caret-ink shadow-[inset_0_-1px_0_var(--color-ink)] outline-none focus:shadow-[inset_0_-2px_0_var(--color-ink)] lg:px-5 lg:py-4 lg:text-[17px]"
      />
      <FieldError errors={errors} field="body" />
      <p
        id={countId}
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

const MODE_OPTIONS = DISPLAY_MODES.map((mode) => ({ value: mode, text: DISPLAY_MODE_LABEL[mode] }));
const TITLE_OPTIONS = AUTHOR_TITLES.map((title) => ({ value: title, text: AUTHOR_TITLE_LABEL[title] }));

/** צעד 4. רק הצורה שתוצג נשמרת: "נועה ר." ולא השם המלא (notes-for-plan-2.md, פרטיות). */
export function NameStep({
  displayMode,
  typedName,
  authorTitle,
  cohortMonth,
  body,
  errors,
  onChange,
}: {
  displayMode: DisplayMode;
  typedName: string;
  authorTitle: AuthorTitle;
  cohortMonth: string | null;
  body: string;
  errors: readonly StepError[];
  onChange: (change: { displayMode?: DisplayMode; typedName?: string; authorTitle?: AuthorTitle }) => void;
}) {
  const shown = displayNameFor(displayMode, typedName);
  const modeId = useId();
  const titleId = useId();
  return (
    <div className="space-y-7">
      <div>
        <p id={modeId} className={fieldLabel}>
          השם
        </p>
        <RadioGroup
          options={MODE_OPTIONS}
          value={displayMode}
          onChange={(mode) => onChange({ displayMode: mode })}
          labelledBy={modeId}
          className="mt-2.5 flex flex-wrap gap-2.5"
          itemClassName="px-3.5"
        />
        {displayMode !== 'anonymous' && (
          <div className="mt-5 max-w-[320px]">
            <label htmlFor={fieldId('displayName')} className={fieldLabel}>
              השם שלכם
            </label>
            <input
              id={fieldId('displayName')}
              value={typedName}
              maxLength={80}
              autoComplete="name"
              aria-required="true"
              {...invalidProps(errors, 'displayName')}
              onChange={(e) => onChange({ typedName: e.target.value })}
              className={cn(lineInput, 'mt-1')}
            />
            <FieldError errors={errors} field="displayName" />
          </div>
        )}
        {displayMode === 'first_initial' && shown && (
          <PenNote arrow className="mt-2.5">
            נשמר רק כך: {shown}
          </PenNote>
        )}
      </div>
      <div>
        <p id={titleId} className={fieldLabel}>
          איך לכתוב עליכם
        </p>
        <RadioGroup
          options={TITLE_OPTIONS}
          value={authorTitle}
          onChange={(title) => onChange({ authorTitle: title })}
          labelledBy={titleId}
          className="mt-2.5 flex flex-wrap gap-2.5"
          itemClassName="min-w-16 px-3.5"
        />
      </div>
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
