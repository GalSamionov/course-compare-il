'use client';

import Link from 'next/link';
import { useActionState, useEffect, useId, useMemo, useRef, useState } from 'react';
import { addCourseFromLink, type AddLinkState } from '@/app/review/actions';
import { PenArrow } from '@/components/site/pen';
import { buttonVariants } from '@/components/ui/button';
import { useAccount } from '@/lib/account/store';
import { COURSE_KINDS, type LinkField } from '@/lib/course-links/form';
import { findLikelyCourse, type KnownCourse } from '@/lib/course-links/match';
import type { CourseType } from '@/lib/reviews/types';
import { cn } from '@/lib/utils';
import { RadioGroup, selectClass } from './review-steps';
import { ACCOUNTS_OPEN } from '@/lib/site';

const IDLE: AddLinkState = { status: 'idle' };

/** התחומים שאפשר לבחור: מהקטלוג. */
export interface PickerCategory {
  slug: string;
  name: string;
  parentSlug: string | null;
  isLeaf: boolean;
}

const marginLabel = 'font-sans text-[13px] leading-tight text-ink-soft lg:text-[15px]';
/** הערה של האתר בשוליים: עט כחול, עם חץ (כמו בהתחברות ובטופס למוסדות). */
const marginNote = 'pe-1.5 font-pen text-sm leading-snug font-medium text-pen lg:text-base';
const smallLink = 'inline-flex min-h-11 items-center underline underline-offset-[3px] hover:text-link-hover';
/**
 * מה שהבוגר כותב מודפס בדיו (Plex 17 ב-600), כמו השם והגוף בכתיבת ביקורת: זה הקול שלו, ולא העט של האתר
 * (DESIGN.md, The One Pen Rule). התשובה על הקו, בלי תיבת קלט.
 */
const answer = cn(
  'min-h-16 min-w-0 self-stretch bg-transparent pt-5 pr-3 pb-1 pl-1 text-right outline-none lg:min-h-[72px]',
  'font-sans text-[17px] font-semibold text-ink caret-ink',
  'placeholder:text-[15px] placeholder:font-normal placeholder:text-ink-soft',
);
const primary = cn(
  buttonVariants(),
  'h-[50px] w-full font-sans text-base font-bold',
  'disabled:border-[1.5px] disabled:border-line disabled:bg-white disabled:text-ink-soft disabled:opacity-100',
);

/** האנקור שההתחברות חוזרת אליו: הטופס נפתח לבד. */
export const ADD_COURSE_HASH = 'add-course';

type TextField = Exclude<LinkField, 'courseKind'>;
const ROWS: { name: TextField; label: string; placeholder: string; ltr: boolean; max: number }[] = [
  { name: 'url', label: 'הקישור', placeholder: 'למשל: facebook.com/… או דף ההרשמה', ltr: true, max: 500 },
  { name: 'title', label: 'שם הקורס', placeholder: 'כמו שהוא מופיע במודעה', ltr: false, max: 160 },
  { name: 'institutionName', label: 'מי מלמד', placeholder: 'שם המרצה, העסק או המוסד', ltr: false, max: 120 },
];

/** תחומים שאין מתחתיהם תחום אחר, בקבוצות לפי התחום שמעליהם. */
function categoryGroups(categories: readonly PickerCategory[]) {
  const leaves = categories.filter((c) => c.isLeaf);
  const tops = categories.filter((c) => c.parentSlug === null);
  return tops
    .map((top) => ({
      label: top.name,
      options: top.isLeaf ? [top] : leaves.filter((c) => c.parentSlug === top.slug),
    }))
    .filter((g) => g.options.length > 0);
}

/**
 * "הקורס לא ברשימה?": הבוגר מדביק קישור לדף הקורס או למודעה, ממשיך לכתוב עליו, והקורס נבדק לפני שהוא עולה.
 * שורות במחברת כמו בטופס למוסדות. בלי תנועה חדשה (DESIGN.md, Motion): רק העיגול בעט של הבחירה, שכבר קיים.
 */
export function AddCourseLink({
  initialTitle,
  categories,
  courses,
}: {
  initialTitle: string;
  categories: readonly PickerCategory[];
  courses: readonly KnownCourse[];
}) {
  const account = useAccount();
  const [state, dispatch, pending] = useActionState(addCourseFromLink, IDLE);
  const [values, setValues] = useState<Record<TextField, string>>({ url: '', title: initialTitle, institutionName: '' });
  const [category, setCategory] = useState('');
  const [kind, setKind] = useState<CourseType | undefined>(undefined);
  const ids = { url: useId(), title: useId(), institutionName: useId() };
  const headingId = useId();
  const categoryId = useId();
  const kindLabelId = useId();
  const hintId = useId();
  const firstField = useRef<HTMLInputElement>(null);
  // הודעה של שדה יורדת כשמתקנים אותו, ולא נשארת עד השליחה הבאה. שליחה חדשה מתחילה מחדש.
  const [edited, setEdited] = useState<{ after: AddLinkState; fields: LinkField[] }>({ after: IDLE, fields: [] });
  const editedFields = edited.after === state ? edited.fields : [];
  const edit = (field: LinkField) => setEdited({ after: state, fields: [...editedFields, field] });
  const allErrors = state.status === 'invalid' ? state.errors : {};
  const errors = Object.fromEntries(
    Object.entries(allErrors).filter(([field]) => !editedFields.includes(field as LinkField)),
  ) as typeof allErrors;
  const groups = useMemo(() => categoryGroups(categories), [categories]);
  const likely = state.status === 'existing' ? null : findLikelyCourse(values, courses);

  useEffect(() => {
    firstField.current?.focus();
  }, []);

  const signedOut = account.status === 'signed-out' || state.status === 'signed-out';

  return (
    <section id={ADD_COURSE_HASH} aria-labelledby={headingId} className="mt-10 scroll-mt-4 lg:mt-14">
      <h2 id={headingId} className="pen-rule text-[21px] leading-snug font-bold lg:text-[28px]">
        הקורס לא ברשימה?
      </h2>
      <p className="mt-2 max-w-[60ch] font-sans text-[15px] leading-normal text-ink-soft lg:text-base">
        הדביקו קישור לדף הקורס: מודעה בפייסבוק או באינסטגרם, דף הרשמה, או האתר של המרצה. אפשר לכתוב עליו כבר עכשיו.
        הקורס והביקורת עולים לאתר רק אחרי שנבדוק אותם.
      </p>

      {signedOut ? (
        <div className="margin-rule mt-4">
          <div className="ruled-top ruled-row grid min-h-16 grid-cols-[var(--margin)_minmax(0,1fr)] items-center">
            <p className={marginNote}>
              <PenArrow />
              קודם
            </p>
            <p className="ps-3 font-sans text-[15px] leading-normal">
              {ACCOUNTS_OPEN ? (
                <>
                  כדי להוסיף קורס צריך להתחבר, כמו בכתיבת ביקורת.{' '}
                  <Link href={`/login?next=${encodeURIComponent(`/review#${ADD_COURSE_HASH}`)}`} className={cn(smallLink, 'font-semibold')}>
                    להתחבר
                  </Link>
                </>
              ) : (
                // ההתחברות עוד לא פתוחה באתר החי (ACCOUNTS_OPEN). בקשה לבדוק קורס לא צריכה חשבון.
                <>
                  הוספה מקישור נפתחת בקרוב, יחד עם כתיבת הביקורות. בינתיים אפשר{' '}
                  <Link href="/request-course" className={cn(smallLink, 'font-semibold')}>
                    לבקש שנבדוק קורס
                  </Link>
                </>
              )}
            </p>
          </div>
        </div>
      ) : state.status === 'existing' ? (
        <div className="margin-rule mt-4">
          <div className="ruled-top ruled-row grid min-h-16 grid-cols-[var(--margin)_minmax(0,1fr)] items-center" role="status">
            <p className={marginNote}>
              <PenArrow />
              כבר באתר
            </p>
            <p className="ps-3 font-sans text-[15px] leading-normal">
              <span className="font-bold">{state.title}</span> כבר באתר, ולא הוספנו אותו שוב.{' '}
              <Link href={`/courses/${state.slug}/review`} className={cn(smallLink, 'font-semibold')}>
                לכתוב עליו
              </Link>
            </p>
          </div>
        </div>
      ) : (
        <form action={dispatch} aria-labelledby={headingId} noValidate className="margin-rule mt-4">
          <div className="ruled-top">
            {ROWS.map((row, i) => {
              const error = errors[row.name];
              const errorId = `${ids[row.name]}-error`;
              const describedBy = [error ? errorId : null, row.name === 'institutionName' && likely ? hintId : null]
                .filter(Boolean)
                .join(' ');
              return (
                <div key={row.name} className="ruled-row ruled-active grid grid-cols-[var(--margin)_minmax(0,1fr)] items-center">
                  <label htmlFor={ids[row.name]} className={cn(marginLabel, 'flex min-h-16 items-center lg:min-h-[72px]')}>
                    {row.label}
                  </label>
                  <input
                    ref={i === 0 ? firstField : undefined}
                    id={ids[row.name]}
                    name={row.name}
                    type={row.name === 'url' ? 'url' : 'text'}
                    dir={row.ltr ? 'ltr' : undefined}
                    required
                    maxLength={row.max}
                    autoComplete="off"
                    inputMode={row.name === 'url' ? 'url' : undefined}
                    autoCapitalize={row.ltr ? 'none' : undefined}
                    spellCheck={row.ltr ? false : undefined}
                    enterKeyHint="next"
                    placeholder={row.placeholder}
                    value={values[row.name]}
                    onChange={(e) => {
                      setValues((v) => ({ ...v, [row.name]: e.target.value }));
                      edit(row.name);
                    }}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={describedBy || undefined}
                    className={answer}
                  />
                  {error && (
                    <p id={errorId} className="col-start-2 pr-3 pb-2.5 font-sans text-[13px] leading-snug font-bold lg:text-[15px]">
                      {error}
                    </p>
                  )}
                  {row.name === 'institutionName' && likely && (
                    <p id={hintId} className="col-start-2 pr-3 pb-2.5 font-sans text-[13px] leading-snug lg:text-[15px]">
                      נראה שהקורס כבר באתר: <span className="font-bold">{likely.title}</span>, {likely.institutionName}.{' '}
                      <Link href={`/courses/${likely.slug}/review`} className={cn(smallLink, 'min-h-0 font-semibold')}>
                        לכתוב עליו
                      </Link>
                    </p>
                  )}
                </div>
              );
            })}
            <div className="ruled-row grid grid-cols-[var(--margin)_minmax(0,1fr)] items-start py-3">
              <label htmlFor={categoryId} className={cn(marginLabel, 'pt-3')}>
                תחום
              </label>
              <div className="ps-3">
                <select
                  id={categoryId}
                  name="category"
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    edit('courseKind');
                  }}
                  className={cn(selectClass, 'mt-0 max-w-[340px]')}
                >
                  <option value="">אין כאן תחום מתאים</option>
                  {groups.map((group) => (
                    <optgroup key={group.label} label={group.label}>
                      {group.options.map((c) => (
                        <option key={c.slug} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {category === '' && (
                  <div className="mt-4">
                    <p id={kindLabelId} className="font-sans text-[15px] font-semibold">
                      אז מה סוג הקורס?
                    </p>
                    <p className="mt-0.5 font-sans text-[13px] leading-normal text-ink-soft">
                      לפי זה נשאל אתכם את השאלות שמתאימות לו.
                    </p>
                    <input type="hidden" name="courseKind" value={kind ?? ''} />
                    <RadioGroup
                      options={COURSE_KINDS.map((k) => ({ value: k.value, text: k.label }))}
                      value={kind}
                      onChange={(value) => {
                        setKind(value);
                        edit('courseKind');
                      }}
                      labelledBy={kindLabelId}
                      className="mt-2 flex flex-wrap gap-2"
                      itemClassName="px-3.5"
                    />
                    {errors.courseKind && (
                      <p className="mt-2 font-sans text-[13px] leading-snug font-bold lg:text-[15px]">{errors.courseKind}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
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
              עד שנבדוק
            </p>
            <div className="ps-3">
              <button type="submit" disabled={pending || account.status === 'loading'} className={primary}>
                {pending ? 'שומרים…' : 'להמשיך לכתוב עליו'}
              </button>
            </div>
          </div>
          <p className="ms-(--margin) mt-3 ps-3 font-sans text-[13px] leading-normal text-ink-soft text-pretty">
            עד שנבדוק, הקורס לא מופיע באתר. את הקישור אנחנו לא פותחים עכשיו.{' '}
            <Link href="/privacy#course-links" className={smallLink}>
              מה נשמר
            </Link>
          </p>
        </form>
      )}
    </section>
  );
}
