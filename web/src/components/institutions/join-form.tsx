'use client';

import Link from 'next/link';
import { useActionState, useEffect, useId, useRef, useState } from 'react';
import { submitJoinRequest, type JoinState } from '@/app/institutions/join/actions';
import { PenArrow } from '@/components/site/pen';
import { buttonVariants } from '@/components/ui/button';
import type { JoinField } from '@/lib/institutions/join';
import { cn } from '@/lib/utils';

const IDLE: JoinState = { status: 'idle' };

const marginLabel = 'font-sans text-[13px] leading-tight text-ink-soft lg:text-[15px]';
/** הערה של האתר בשוליים: עט כחול, עם חץ (כמו בהתחברות). */
const marginNote = 'pe-1.5 font-pen text-sm leading-snug font-medium text-pen lg:text-base';
const smallLink = 'inline-flex min-h-11 items-center underline underline-offset-[3px] hover:text-link-hover';
/**
 * מה שהמוסד כותב מודפס בדיו (Plex 17 ב-600), כמו השם והגוף בכתיבת ביקורת: זה קול המוסד, ולא העט של האתר
 * (DESIGN.md, The One Pen Rule). התשובה על הקו, בלי תיבת קלט.
 */
const answer = cn(
  'min-w-0 self-stretch bg-transparent pt-5 pr-3 pb-1 pl-1 text-right outline-none',
  'font-sans text-[17px] font-semibold text-ink caret-ink',
  'placeholder:text-[15px] placeholder:font-normal placeholder:text-ink-soft',
);

const FACTS = [
  'קוראים את הדף שלכם ובודקים את הפרטים מולו. קורס עולה לקטלוג רק אחרי שאישרנו אותו.',
  'אחרי שהקורס עולה, הדף נקרא פעם בשבוע, והפרטים באתר מתעדכנים ממנו.',
  'אין תשלום: לא על הוספה, לא על מקום ולא על ציון.',
  'ביקורות כותבים רק בוגרים שהעלו הוכחה. מוסד לא מוסיף, לא מוחק ולא עורך ביקורת.',
];

const ROWS: { name: JoinField; label: string; type: 'text' | 'url' | 'email'; placeholder: string; ltr: boolean }[] = [
  { name: 'institutionName', label: 'שם המוסד', type: 'text', placeholder: 'למשל: מכללה לדוגמה', ltr: false },
  { name: 'courseUrl', label: 'דף הקורס', type: 'url', placeholder: 'www.example.co.il/courses/…', ltr: true },
  { name: 'contactEmail', label: 'מייל לחזרה', type: 'email', placeholder: 'name@example.co.il', ltr: true },
];

/**
 * הטופס של מוסד או מרצה (חוזה העמוד: שלוש שורות במחברת, כמו ההתחברות). אחרי השליחה הכותרת מתחלפת
 * ל"קיבלנו את הבקשה", והפוקוס עובר אליה כדי שקורא מסך יקרא את המצב החדש.
 */
export function JoinForm() {
  const [round, setRound] = useState(0);
  return <JoinFormRound key={round} onAnother={() => setRound((r) => r + 1)} />;
}

function JoinFormRound({ onAnother }: { onAnother: () => void }) {
  const [state, dispatch, pending] = useActionState(submitJoinRequest, IDLE);
  const [values, setValues] = useState<Record<JoinField, string>>({ institutionName: '', courseUrl: '', contactEmail: '' });
  const heading = useRef<HTMLHeadingElement>(null);
  const ids = { institutionName: useId(), courseUrl: useId(), contactEmail: useId() };
  const emailHint = useId();
  const sent = state.status === 'sent';
  const errors = state.status === 'invalid' ? state.errors : {};

  useEffect(() => {
    if (sent) heading.current?.focus();
  }, [sent]);

  return (
    <>
      <h1
        ref={heading}
        tabIndex={-1}
        className="mt-[22px] text-[30px] leading-tight font-bold text-balance outline-none lg:mt-12 lg:text-[54px] lg:leading-[1.06]"
      >
        {sent ? 'קיבלנו את הבקשה' : 'להוסיף קורס לקטלוג'}
      </h1>
      <p className="mt-2 max-w-[60ch] font-sans text-[15px] leading-normal text-ink-soft lg:mt-3 lg:text-lg">
        {sent
          ? 'נקרא את הדף ונבדוק את הפרטים מולו. אם הקורס מתאים, הוא יעלה לקטלוג. אם יחסר לנו משהו, נכתוב למייל שהשארתם.'
          : 'מוסד או מרצה? שולחים קישור לדף הקורס באתר שלכם. אנחנו קוראים את הדף, בודקים את הפרטים מולו, ורק אז הקורס עולה.'}
      </p>

      <div className="mt-[18px] lg:mt-12 lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-20">
        <div className="margin-rule">
          {sent ? (
            <div className="ruled-top">
              <div className="ruled-row grid min-h-16 grid-cols-[var(--margin)_minmax(0,1fr)] items-center">
                <p className={marginNote}>
                  <PenArrow />
                  נשלח
                </p>
                <div className="flex flex-wrap gap-x-6 ps-3 font-sans text-[15px] font-semibold">
                  <button type="button" onClick={onAnother} className={smallLink}>
                    לשלוח קורס נוסף
                  </button>
                  <Link href="/" className={smallLink}>
                    לדף הבית
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <form action={dispatch} aria-label="בקשה להוסיף קורס" noValidate>
              <div className="ruled-top">
                {ROWS.map((row) => {
                  const error = errors[row.name];
                  const errorId = `${ids[row.name]}-error`;
                  const describedBy = [error ? errorId : null, row.name === 'contactEmail' ? emailHint : null].filter(Boolean).join(' ');
                  return (
                    // השגיאה בתוך השורה שלה, מתחת לתשובה ולפני הקו, ולא בשורה הבאה (סקירת הסיום).
                    <div
                      key={row.name}
                      className="ruled-row ruled-active grid grid-cols-[var(--margin)_minmax(0,1fr)] items-center"
                    >
                      <label htmlFor={ids[row.name]} className={cn(marginLabel, 'flex min-h-16 items-center lg:min-h-[72px]')}>
                        {row.label}
                      </label>
                      <input
                        id={ids[row.name]}
                        name={row.name}
                        type={row.type}
                        dir={row.ltr ? 'ltr' : undefined}
                        required
                        maxLength={row.name === 'institutionName' ? 120 : row.name === 'courseUrl' ? 500 : 254}
                        autoComplete={row.name === 'contactEmail' ? 'email' : row.name === 'institutionName' ? 'organization' : 'url'}
                        inputMode={row.type === 'url' ? 'url' : row.type === 'email' ? 'email' : undefined}
                        autoCapitalize={row.ltr ? 'none' : undefined}
                        spellCheck={row.ltr ? false : undefined}
                        enterKeyHint={row.name === 'contactEmail' ? 'send' : 'next'}
                        placeholder={row.placeholder}
                        value={values[row.name]}
                        onChange={(e) => setValues((v) => ({ ...v, [row.name]: e.target.value }))}
                        aria-invalid={error ? true : undefined}
                        aria-describedby={describedBy || undefined}
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
              </div>
              <p id={emailHint} className="ms-(--margin) mt-3 ps-3 font-sans text-[13px] leading-normal text-ink-soft">
                המייל לא מוצג באתר. רק אנחנו רואים אותו, כדי לחזור אליכם על הבקשה.
              </p>
              {/* מלכודת לבוטים: מוסתרת מהעין ומקורא מסך, בלי טאב ובלי מילוי אוטומטי. מי שממלא אותה לא נשמר (actions.ts). */}
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
                {/* בשורה אחת ובתוך השוליים (סקירת הסיום): בנייד, ב-70 פיקסלים, בלי החץ. במחשב השוליים רחבים, והחץ חוזר. */}
                <p className={cn(marginNote, 'pe-0 text-[13px] whitespace-nowrap lg:pe-1.5 lg:text-base')}>
                  <span className="hidden lg:inline">
                    <PenArrow />
                  </span>
                  בלי תשלום
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
                    {pending ? 'שולחים…' : 'לשלוח את הבקשה'}
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
          </ul>
          <div className="ms-(--margin) mt-4 ps-3 font-sans text-[13px] leading-normal text-ink-soft">
            <p className="text-pretty">
              שומרים רק את מה שבטופס. המייל רק כדי לחזור אליכם, והוא נמחק 90 יום אחרי שהחלטנו על הבקשה.
            </p>
            <Link href="/privacy#institutions" className={smallLink}>
              מדיניות הפרטיות
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
