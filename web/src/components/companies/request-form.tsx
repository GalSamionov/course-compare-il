'use client';

import Link from 'next/link';
import { useActionState, useEffect, useId, useRef, useState } from 'react';
import { submitCompanyRequest, type CompanyRequestState } from '@/app/companies/actions';
import { TickMark } from '@/components/notebook/tick';
import { PenArrow, PenLoop } from '@/components/site/pen';
import { buttonVariants } from '@/components/ui/button';
import { FORMATS, NEEDS_MAX, TEAM_SIZES, TIMINGS, charCount, type CompanyField } from '@/lib/companies/request';
import { cn } from '@/lib/utils';

const IDLE: CompanyRequestState = { status: 'idle' };

type Values = Record<CompanyField, string>;
const EMPTY: Values = { needs: '', companyName: '', contactName: '', email: '', phone: '', teamSize: '', format: '', timing: '' };
/** סדר השדות בטופס: אחרי שליחה עם בעיות, הפוקוס עובר לראשון שיש בו בעיה. */
const ORDER: CompanyField[] = ['needs', 'companyName', 'contactName', 'email', 'phone', 'teamSize', 'format', 'timing'];

const marginLabel = 'font-sans text-[13px] leading-tight text-ink-soft lg:text-[15px]';
const optionalNote = 'mt-0.5 block text-[12px] lg:text-[13px]';
/** הערה של האתר בשוליים: עט כחול (כמו בטופס למוסדות). */
const marginNote = 'font-pen text-sm leading-snug font-medium text-pen lg:text-base';
const smallLink = 'inline-flex min-h-11 items-center underline underline-offset-[3px] hover:text-link-hover';
/**
 * מה שהחברה כותבת מודפס בדיו (Plex 17 ב-600), כמו בטופס למוסדות: זה הקול שלה, ולא העט של האתר
 * (DESIGN.md, The One Pen Rule). התשובה על הקו, בלי תיבת קלט.
 */
const answer = cn(
  'min-w-0 self-stretch bg-transparent pr-3 pl-1 text-right outline-none',
  'font-sans text-[17px] font-semibold text-ink caret-ink',
  'placeholder:text-[15px] placeholder:font-normal placeholder:text-ink-soft',
);
const row = 'ruled-row ruled-active grid grid-cols-[var(--margin)_minmax(0,1fr)]';
const rowHeight = 'min-h-16 lg:min-h-[72px]';
const errorText = 'col-start-2 pr-3 pb-2.5 font-sans text-[13px] leading-snug font-bold lg:text-[15px]';

/**
 * "מה אתם מחפשים" נכתב על קווי מחברת בתוך השדה: קו בתחתית כל שורת טקסט (36 פיקסלים, 40 במחשב).
 * הגובה קצר בפיקסל אחד מחמש שורות, כדי שהקו החמישי לא ייפול על הקו של השורה עצמה. הקווים זזים עם הטקסט בגלילה.
 * גובה השורה אחרי גודל הגופן: cn ממזג כמו tailwind-merge, וגודל שבא אחרי leading מוחק אותו.
 */
const ruledArea = cn(
  'mt-2 block h-[179px] w-full resize-none bg-transparent pt-0 pr-3 pb-0 pl-1 lg:h-[199px]',
  'bg-[repeating-linear-gradient(to_bottom,transparent_0_35px,var(--color-ruled)_35px_36px)] [background-attachment:local]',
  'lg:bg-[repeating-linear-gradient(to_bottom,transparent_0_39px,var(--color-ruled)_39px_40px)]',
  'font-sans text-[17px] leading-[36px] font-semibold text-ink caret-ink outline-none lg:leading-[40px]',
  'placeholder:text-[15px] placeholder:leading-[36px] placeholder:font-normal placeholder:text-ink-soft lg:placeholder:leading-[40px]',
);

/** חץ קטן מצויר בדיו רכה, בצד של ה-select: יש כאן רשימה לפתוח. לא סימן של האתר, ולכן לא בעט. */
function SelectCaret() {
  return (
    <svg aria-hidden="true" viewBox="0 0 14 10" className="pointer-events-none absolute top-1/2 left-2 h-2.5 w-3.5 -translate-y-1/2 text-ink-soft">
      <path d="M1.6 2.4C4 4.6 5.6 6.4 7.2 8.2 8.8 6.2 10.4 4.4 12.6 1.8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * הטופס לחברות (חוזה העמוד: שורות במחברת, השאלה בשוליים והתשובה על הקו, כמו הטופס למוסדות).
 * אחרי השליחה הכותרת של הטופס מתחלפת ל"קיבלנו", העט מסמן וי, והפוקוס עובר לכותרת כדי שקורא מסך יקרא את המצב.
 */
export function CompanyRequestForm({ className }: { className?: string }) {
  const [round, setRound] = useState(0);
  return <FormRound key={round} className={className} onAnother={() => setRound((r) => r + 1)} />;
}

function FormRound({ className, onAnother }: { className?: string; onAnother: () => void }) {
  const [state, dispatch, pending] = useActionState(submitCompanyRequest, IDLE);
  const [values, setValues] = useState<Values>(EMPTY);
  // שדה שתוקן אחרי שליחה עם בעיות: ההודעה שלו יורדת מיד, ולא נשארת עד השליחה הבאה. מתאפס בכל תשובה חדשה.
  const [answered, setAnswered] = useState(state);
  const [edited, setEdited] = useState<Partial<Record<CompanyField, true>>>({});
  if (answered !== state) {
    setAnswered(state);
    setEdited({});
  }
  const heading = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const base = useId();
  const id = (name: CompanyField) => `${base}-${name}`;
  const errId = (name: CompanyField) => `${base}-${name}-error`;
  const counterId = `${base}-needs-count`;
  const privacyHint = `${base}-privacy`;
  const formatLabel = `${base}-format-label`;
  const sent = state.status === 'sent';
  const errors: Partial<Record<CompanyField, string>> =
    state.status === 'invalid'
      ? Object.fromEntries(Object.entries(state.errors).filter(([name]) => !edited[name as CompanyField]))
      : {};
  const set = (name: CompanyField) => (value: string) => {
    setValues((v) => ({ ...v, [name]: value }));
    setEdited((e) => (e[name] ? e : { ...e, [name]: true }));
  };
  const needsCount = charCount(values.needs.trim());

  useEffect(() => {
    if (sent) {
      heading.current?.focus();
      return;
    }
    if (state.status !== 'invalid') return;
    // כמו בכתיבת ביקורת: הפוקוס עובר לשדה הראשון שיש בו בעיה, וקורא המסך קורא את ההודעה ממנו.
    const first = ORDER.find((name) => state.errors[name]);
    if (!first) return;
    const target =
      first === 'format'
        ? formRef.current?.querySelector<HTMLInputElement>('input[name="format"]:checked, input[name="format"]')
        : document.getElementById(id(first));
    target?.focus();
    // id נבנה מ-useId ולא משתנה בין רינדורים.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, sent]);

  /** aria-invalid ו-aria-describedby לשדה, עם עוד תיאור קבוע אם יש. */
  const describe = (name: CompanyField, more?: string) => {
    const invalid = Boolean(errors[name]);
    const by = [invalid ? errId(name) : null, more].filter(Boolean).join(' ');
    return { 'aria-invalid': invalid || undefined, 'aria-describedby': by || undefined };
  };
  const fieldError = (name: CompanyField) =>
    errors[name] ? (
      <p id={errId(name)} className={errorText}>
        {errors[name]}
      </p>
    ) : null;

  const textRows: { name: Exclude<CompanyField, 'needs' | 'teamSize' | 'format' | 'timing'>; label: string; optional?: boolean; type: 'text' | 'email' | 'tel'; placeholder: string; ltr?: boolean; max: number; autoComplete: string }[] = [
    { name: 'companyName', label: 'שם החברה', type: 'text', placeholder: 'למשל: חברה לדוגמה בע״מ', max: 120, autoComplete: 'organization' },
    { name: 'contactName', label: 'השם שלכם', type: 'text', placeholder: 'שם מלא', max: 80, autoComplete: 'name' },
    { name: 'email', label: 'מייל', type: 'email', placeholder: 'name@company.co.il', ltr: true, max: 254, autoComplete: 'email' },
    { name: 'phone', label: 'טלפון', optional: true, type: 'tel', placeholder: '050-1234567', ltr: true, max: 24, autoComplete: 'tel' },
  ];

  const selectRow = (name: 'teamSize' | 'timing', label: string, options: readonly { value: string; label: string }[]) => (
    <div className={row}>
      <label htmlFor={id(name)} className={cn(marginLabel, 'flex flex-col justify-center', rowHeight)}>
        {label}
        <span className={optionalNote}>לא חובה</span>
      </label>
      <div className="relative min-w-0">
        <select
          id={id(name)}
          name={name}
          value={values[name]}
          onChange={(e) => set(name)(e.target.value)}
          {...describe(name)}
          className={cn(
            answer,
            rowHeight,
            'w-full cursor-pointer appearance-none pt-4 pl-8',
            values[name] === '' && 'text-[15px] font-normal text-ink-soft',
          )}
        >
          <option value="">לבחור</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <SelectCaret />
      </div>
      {fieldError(name)}
    </div>
  );

  return (
    <section id="request" aria-labelledby={`${base}-title`} className={cn('scroll-mt-4 lg:scroll-mt-8', className)}>
      <h2
        ref={heading}
        id={`${base}-title`}
        tabIndex={-1}
        className="pen-rule text-[21px] leading-snug font-bold text-balance outline-none lg:text-[28px]"
      >
        {sent ? 'קיבלנו. נחזור אליכם תוך 2 ימי עבודה.' : 'ספרו לנו מה אתם מחפשים'}
      </h2>

      <div className="margin-rule mt-4 lg:mt-6">
        {sent ? (
          <div className="ruled-top">
            <div className="ruled-row grid grid-cols-[var(--margin)_minmax(0,1fr)] items-start">
              <p className={cn(marginNote, 'flex items-center gap-1.5 pt-3.5 lg:pt-4')}>
                <TickMark className="size-5 flex-none lg:size-6" />
                נשלח
              </p>
              <div className="ps-3 pt-3 pb-3 lg:pt-3.5">
                <p className="text-base leading-normal text-pretty lg:text-lg">
                  נקרא את מה שכתבתם, ונחזור אליכם למייל או לטלפון שהשארתם כדי לקבוע שיחת היכרות. השיחה בלי התחייבות.
                </p>
                <div className="mt-1 flex flex-wrap gap-x-6 font-sans text-[15px] font-semibold">
                  <button type="button" onClick={onAnother} className={smallLink}>
                    לשלוח פנייה נוספת
                  </button>
                  <Link href="/courses#subjects" className={smallLink}>
                    לקטלוג
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form ref={formRef} action={dispatch} aria-label="פנייה של חברה" noValidate>
            <div className="ruled-top">
              {/* מה מחפשים: השאלה החשובה, ראשונה. השגיאה והמונה בתוך השורה, מעל הקו שלה. */}
              <div className={cn(row, 'items-start')}>
                <label htmlFor={id('needs')} className={cn(marginLabel, 'pt-4 lg:pt-5')}>
                  מה אתם מחפשים
                </label>
                <div className="min-w-0">
                  <textarea
                    id={id('needs')}
                    name="needs"
                    required
                    rows={5}
                    // 200 תווים מעבר למגבלה: מי שמדביק טקסט ארוך רואה כמה לקצר, במקום שהטקסט ייחתך בשקט.
                    maxLength={NEEDS_MAX + 200}
                    enterKeyHint="next"
                    placeholder="למשל: סדנה על אקסל לצוות הכספים, או הרצאה על בינה מלאכותית לכל החברה"
                    value={values.needs}
                    onChange={(e) => set('needs')(e.target.value)}
                    {...describe('needs', counterId)}
                    className={ruledArea}
                  />
                  <p
                    id={counterId}
                    className={cn(
                      'pt-1 pr-3 pb-2 font-sans text-[13px] tabular-nums',
                      needsCount > NEEDS_MAX ? 'font-bold text-ink' : 'text-ink-soft',
                    )}
                  >
                    {needsCount.toLocaleString('en-US')} מתוך {NEEDS_MAX.toLocaleString('en-US')} תווים
                  </p>
                </div>
                {fieldError('needs')}
              </div>

              {textRows.map((r) => (
                <div key={r.name} className={cn(row, 'items-center')}>
                  <label htmlFor={id(r.name)} className={cn(marginLabel, 'flex flex-col justify-center', rowHeight)}>
                    {r.label}
                    {r.optional && <span className={optionalNote}>לא חובה</span>}
                  </label>
                  <input
                    id={id(r.name)}
                    name={r.name}
                    type={r.type}
                    dir={r.ltr ? 'ltr' : undefined}
                    required={!r.optional}
                    maxLength={r.max}
                    autoComplete={r.autoComplete}
                    inputMode={r.type === 'email' ? 'email' : r.type === 'tel' ? 'tel' : undefined}
                    autoCapitalize={r.ltr ? 'none' : undefined}
                    spellCheck={r.ltr ? false : undefined}
                    enterKeyHint="next"
                    placeholder={r.placeholder}
                    value={values[r.name]}
                    onChange={(e) => set(r.name)(e.target.value)}
                    {...describe(r.name, r.name === 'email' || r.name === 'phone' ? privacyHint : undefined)}
                    className={cn(answer, rowHeight, 'pt-5 pb-1')}
                  />
                  {fieldError(r.name)}
                </div>
              ))}

              {selectRow('teamSize', 'כמה עובדים ישתתפו', TEAM_SIZES)}

              {/* בחירה אחת: קבוצת רדיו אמיתית (חצים עוברים בין האפשרויות), והבחירה מוקפת בעט (DESIGN.md, Chips). */}
              <div className={cn(row, 'items-center')}>
                <span id={formatLabel} className={cn(marginLabel, 'flex flex-col justify-center py-3', rowHeight)}>
                  סוג ההכשרה
                  <span className={optionalNote}>לא חובה</span>
                </span>
                <div
                  role="radiogroup"
                  aria-labelledby={formatLabel}
                  {...describe('format')}
                  className="flex flex-wrap gap-2 py-3 ps-3"
                >
                  {FORMATS.map((o) => {
                    const on = values.format === o.value;
                    return (
                      <label
                        key={o.value}
                        className={cn(
                          'inline-flex h-11 cursor-pointer items-center justify-center rounded-[4px] border border-ink bg-white px-3 font-sans text-[15px] leading-none transition-colors hover:border-pen',
                          'outline-ring has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2',
                          on ? 'font-bold text-pen' : 'font-semibold text-ink',
                        )}
                      >
                        <input
                          type="radio"
                          name="format"
                          value={o.value}
                          checked={on}
                          onChange={() => set('format')(o.value)}
                          className="sr-only"
                        />
                        {on ? <PenLoop draw>{o.label}</PenLoop> : o.label}
                      </label>
                    );
                  })}
                </div>
                {fieldError('format')}
              </div>

              {selectRow('timing', 'מתי בערך', TIMINGS)}
            </div>

            <div id={privacyHint} className="ms-(--margin) mt-3 ps-3 font-sans text-[13px] leading-normal text-ink-soft">
              <p className="text-pretty">המייל והטלפון לא מוצגים באתר. רק אנחנו רואים אותם, כדי לחזור אליכם.</p>
            </div>
            <p className="ms-(--margin) ps-3 font-sans text-[13px]">
              <Link href="/privacy#companies" className={cn(smallLink, 'text-ink-soft')}>
                מה אנחנו שומרים, וכמה זמן
              </Link>
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
              {/* בנייד, ב-70 פיקסלים, בלי החץ. במחשב השוליים רחבים, והחץ חוזר (כמו בטופס למוסדות). */}
              <p className={cn(marginNote, 'text-[13px] leading-snug lg:pe-1.5 lg:text-base')}>
                <span className="hidden lg:inline">
                  <PenArrow />
                </span>
                בלי התחייבות
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
                  {pending ? 'שולחים…' : 'לשלוח את הפנייה'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
