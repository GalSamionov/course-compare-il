'use client';

import Link from 'next/link';
import { useActionState, useEffect, useId, useRef, useState } from 'react';
import { submitCourseRequest, type RequestState } from '@/app/request-course/actions';
import { PenArrow } from '@/components/site/pen';
import { buttonVariants } from '@/components/ui/button';
import type { RequestField } from '@/lib/course-links/form';
import { cn } from '@/lib/utils';

const IDLE: RequestState = { status: 'idle' };

const marginLabel = 'font-sans text-[13px] leading-tight text-ink-soft lg:text-[15px]';
/** הערה של האתר בשוליים: עט כחול, עם חץ (כמו בהתחברות ובטופס למוסדות). */
const marginNote = 'pe-1.5 font-pen text-sm leading-snug font-medium text-pen lg:text-base';
const smallLink = 'inline-flex min-h-11 items-center underline underline-offset-[3px] hover:text-link-hover';
/** מה שהמבקר כותב מודפס בדיו על הקו, בלי תיבת קלט (כמו בטופס למוסדות). */
const answer = cn(
  'min-w-0 self-stretch bg-transparent pt-5 pr-3 pb-1 pl-1 text-right outline-none',
  'font-sans text-[17px] font-semibold text-ink caret-ink',
  'placeholder:text-[15px] placeholder:font-normal placeholder:text-ink-soft',
);

const FACTS = [
  'קוראים את הדף ובודקים מה הקורס, מי מלמד וכמה הוא עולה. קורס עולה לקטלוג רק אחרי שאישרנו אותו.',
  'מודעה בפייסבוק או באינסטגרם אנחנו קוראים בעצמנו. האוסף האוטומטי שלנו לא נכנס לרשתות החברתיות.',
  'מי שמוכר את הקורס לא משלם לנו, ולא יודע מי ביקש שנבדוק.',
];

const ROWS: { name: Exclude<RequestField, 'note'>; label: string; placeholder: string; ltr: boolean; max: number }[] = [
  { name: 'url', label: 'הקישור', placeholder: 'מודעה, דף נחיתה או דף בפייסבוק', ltr: true, max: 500 },
  { name: 'name', label: 'שם (לא חובה)', placeholder: 'שם הקורס או המרצה', ltr: false, max: 160 },
];

/**
 * "בקשו שנבדוק קורס": קישור, ושם והערה אם רוצים. שורות במחברת, כמו בטופס למוסדות. אחרי השליחה הכותרת
 * מתחלפת, והפוקוס עובר אליה כדי שקורא מסך יקרא את המצב החדש. בלי תנועה חדשה (DESIGN.md, Motion).
 */
export function RequestCourseForm() {
  const [round, setRound] = useState(0);
  return <RequestRound key={round} onAnother={() => setRound((r) => r + 1)} />;
}

function RequestRound({ onAnother }: { onAnother: () => void }) {
  const [state, dispatch, pending] = useActionState(submitCourseRequest, IDLE);
  const [values, setValues] = useState({ url: '', name: '', note: '' });
  const heading = useRef<HTMLHeadingElement>(null);
  const ids = { url: useId(), name: useId(), note: useId() };
  const done = state.status === 'sent' || state.status === 'existing';
  const errors = state.status === 'invalid' ? state.errors : {};

  useEffect(() => {
    if (done) heading.current?.focus();
  }, [done]);

  return (
    <>
      <h1
        ref={heading}
        tabIndex={-1}
        className="mt-[22px] text-[30px] leading-tight font-bold text-balance outline-none lg:mt-12 lg:text-[54px] lg:leading-[1.06]"
      >
        {state.status === 'sent' ? 'קיבלנו את הקישור' : state.status === 'existing' ? 'הקורס כבר באתר' : 'בקשו שנבדוק קורס'}
      </h1>
      <p className="mt-2 max-w-[60ch] font-sans text-[15px] leading-normal text-ink-soft lg:mt-3 lg:text-lg">
        {state.status === 'sent'
          ? 'נקרא את הדף ונבדוק את הקורס. אם הוא מתאים, הוא יעלה לקטלוג. אין צורך לשלוח שוב.'
          : state.status === 'existing'
            ? 'לא הוספנו אותו שוב. אפשר לראות מה כבר ידוע עליו.'
            : 'ראיתם קורס במודעה, בדף נחיתה או אצל מרצה עצמאי, והוא לא באתר? הדביקו את הקישור, ונבדוק אותו.'}
      </p>

      <div className="mt-[18px] lg:mt-12 lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-20">
        <div className="margin-rule">
          {done ? (
            <div className="ruled-top">
              <div className="ruled-row grid min-h-16 grid-cols-[var(--margin)_minmax(0,1fr)] items-center">
                <p className={marginNote}>
                  <PenArrow />
                  {state.status === 'existing' ? 'כבר באתר' : 'נשלח'}
                </p>
                <div className="flex flex-wrap gap-x-6 ps-3 font-sans text-[15px] font-semibold">
                  {state.status === 'existing' && (
                    <Link href={`/courses/${state.slug}`} className={smallLink}>
                      {state.title || 'לעמוד הקורס'}
                    </Link>
                  )}
                  <button type="button" onClick={onAnother} className={cn(smallLink, 'cursor-pointer')}>
                    לשלוח קישור נוסף
                  </button>
                  <Link href="/" className={smallLink}>
                    לדף הבית
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <form action={dispatch} aria-label="בקשה לבדוק קורס" noValidate>
              <div className="ruled-top">
                {ROWS.map((row) => {
                  const error = errors[row.name];
                  const errorId = `${ids[row.name]}-error`;
                  return (
                    <div key={row.name} className="ruled-row ruled-active grid grid-cols-[var(--margin)_minmax(0,1fr)] items-center">
                      <label htmlFor={ids[row.name]} className={cn(marginLabel, 'flex min-h-16 items-center lg:min-h-[72px]')}>
                        {row.label}
                      </label>
                      <input
                        id={ids[row.name]}
                        name={row.name}
                        type={row.name === 'url' ? 'url' : 'text'}
                        dir={row.ltr ? 'ltr' : undefined}
                        required={row.name === 'url'}
                        maxLength={row.max}
                        autoComplete="off"
                        inputMode={row.name === 'url' ? 'url' : undefined}
                        autoCapitalize={row.ltr ? 'none' : undefined}
                        spellCheck={row.ltr ? false : undefined}
                        enterKeyHint="next"
                        placeholder={row.placeholder}
                        value={values[row.name]}
                        onChange={(e) => setValues((v) => ({ ...v, [row.name]: e.target.value }))}
                        aria-invalid={error ? true : undefined}
                        aria-describedby={error ? errorId : undefined}
                        className={cn(answer, 'min-h-16 lg:min-h-[72px]')}
                      />
                      {error && (
                        <p id={errorId} className="col-start-2 pr-3 pb-2.5 font-sans text-[13px] leading-snug font-bold lg:text-[15px]">
                          {error}
                        </p>
                      )}
                    </div>
                  );
                })}
                <div className="ruled-row ruled-active grid grid-cols-[var(--margin)_minmax(0,1fr)] items-start">
                  <label htmlFor={ids.note} className={cn(marginLabel, 'flex min-h-16 items-center lg:min-h-[72px]')}>
                    הערה (לא חובה)
                  </label>
                  <textarea
                    id={ids.note}
                    name="note"
                    rows={3}
                    maxLength={500}
                    placeholder="למשל: ראיתי את המודעה באינסטגרם, ושילמו עליו הרבה"
                    value={values.note}
                    onChange={(e) => setValues((v) => ({ ...v, note: e.target.value }))}
                    aria-invalid={errors.note ? true : undefined}
                    aria-describedby={errors.note ? `${ids.note}-error` : undefined}
                    className={cn(answer, 'min-h-24 resize-y pt-5 leading-normal')}
                  />
                  {errors.note && (
                    <p id={`${ids.note}-error`} className="col-start-2 pr-3 pb-2.5 font-sans text-[13px] leading-snug font-bold lg:text-[15px]">
                      {errors.note}
                    </p>
                  )}
                </div>
              </div>
              {/* מלכודת לבוטים: מוסתרת מהעין ומקורא מסך, בלי טאב ובלי מילוי אוטומטי (actions.ts). */}
              <div aria-hidden="true" className="sr-only">
                <label>
                  האתר שלכם
                  <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
                </label>
              </div>
              {state.status === 'invalid' && state.message && (
                <p role="alert" className="ms-(--margin) mt-2 ps-3 font-sans text-[15px] leading-normal font-bold">
                  {state.message}
                </p>
              )}
              <div className="mt-3.5 grid grid-cols-[var(--margin)_minmax(0,1fr)] items-center">
                <p className={cn(marginNote, 'pe-0 text-[13px] whitespace-nowrap lg:pe-1.5 lg:text-base')}>
                  <span className="hidden lg:inline">
                    <PenArrow />
                  </span>
                  בלי התחברות
                </p>
                <div className="ps-3">
                  <button
                    type="submit"
                    disabled={pending}
                    className={cn(
                      buttonVariants(),
                      'h-[50px] w-full font-sans text-base font-bold',
                      'disabled:border-[1.5px] disabled:border-line disabled:bg-white disabled:text-ink-soft disabled:opacity-100',
                    )}
                  >
                    {pending ? 'שולחים…' : 'לשלוח לבדיקה'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        <div className="margin-rule mt-10 lg:mt-0 lg:[--bleed:0px]">
          <ul className="ruled-top">
            {FACTS.map((fact, i) => (
              <li key={fact} className="ruled-row grid grid-cols-[var(--margin)_minmax(0,1fr)] items-start">
                <span className={cn(marginLabel, 'pt-3')}>{i === 0 ? 'מה קורה אחרי?' : ''}</span>
                <p className="pt-2.5 ps-3 pb-[7px] text-base leading-normal text-pretty lg:pt-3.5 lg:pb-2 lg:text-lg">{fact}</p>
              </li>
            ))}
            <li className="ruled-row grid grid-cols-[var(--margin)_minmax(0,1fr)] items-start">
              <span className={cn(marginLabel, 'pt-3')}>סיימתם אותו?</span>
              <p className="pt-2.5 ps-3 pb-[7px] text-base leading-normal text-pretty lg:pt-3.5 lg:pb-2 lg:text-lg">
                אפשר להוסיף אותו מכתיבת ביקורת, ולכתוב עליו כבר עכשיו.{' '}
                <Link href="/review#add-course" className={cn(smallLink, 'font-sans text-[15px] font-semibold')}>
                  לכתוב ביקורת
                </Link>
              </p>
            </li>
          </ul>
          <div className="ms-(--margin) mt-4 ps-3 font-sans text-[13px] leading-normal text-ink-soft">
            <p className="text-pretty">שומרים רק את מה שבטופס. בלי מייל ובלי שם שלכם.</p>
            <Link href="/privacy#course-links" className={smallLink}>
              מדיניות הפרטיות
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
