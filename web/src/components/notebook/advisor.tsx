'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Fragment, useEffect, useId, useRef, useState } from 'react';
import { Claim, Mark, MarkSample } from '@/components/course/marks';
import { PenArrow, PenArrowDown } from '@/components/site/pen';
import { buttonVariants } from '@/components/ui/button';
import { loginHref, useAccount } from '@/lib/account/store';
import { filterAdvice } from '@/lib/advisor/filter';
import {
  ADVISOR_LIMITS,
  MAX_COURSES,
  MAX_QUESTION_LENGTH,
  type Advice,
  type AdviceSentence,
  type AdviseError,
} from '@/lib/advisor/types';
import type { CourseSummary } from '@/lib/search/types';
import { createBrowserSupabase } from '@/lib/supabase/browser-client';
import { cn } from '@/lib/utils';
import { PenAnswer } from './answer-line';

/** 'empty': לחצו "לשאול" בלי לכתוב שאלה. הבדיקה בדפדפן, והשאלה לא נשלחת. */
type AskError = AdviseError | 'network' | 'empty';

/** שגיאות בדיו מודגשת, בלי צבע חדש. כל אחת אומרת מה קרה ומה אפשר לעשות. */
const ERROR_TEXT: Record<AskError, string> = {
  empty: 'כתבו שאלה, ואז לשאול.',
  not_configured: 'היועץ לא זמין כרגע.',
  bad_json: 'לא הצלחנו לשלוח את השאלה. אפשר לנסות שוב.',
  bad_question: `אפשר לשאול עד ${MAX_QUESTION_LENGTH} תווים.`,
  bad_courses: 'לא הצלחנו לשלוח את הרשימה. אפשר לרענן את הדף ולנסות שוב.',
  no_courses: 'הקורסים ברשימה כבר לא באתר. אפשר לרענן את הדף.',
  too_fast: 'יותר מדי שאלות בדקה אחת. אפשר לשאול שוב בעוד דקה.',
  limit: 'נגמרו השאלות להיום. אפשר לשאול שוב מחר.',
  failed: 'לא הצלחנו לענות הפעם, והשאלה לא נספרה. אפשר לנסות שוב.',
  network: 'השאלה לא הגיעה לשרת. בודקים את החיבור ומנסים שוב.',
};

const leftText = (n: number) =>
  n === 0 ? 'נגמרו השאלות להיום' : n === 1 ? 'נשארה שאלה אחת היום' : `נשארו ${n} שאלות היום`;

const EXAMPLE = 'למשל: מה ההבדל ביניהם למי שעובד במשרה מלאה?';
const ASKING_TEXT = 'כותבים תשובה מהנתונים של הקורסים…';

/** השדה של "מה לשאול?". יש רק אחד בדף, והקישור בראש הרשימה מעביר אליו את הפוקוס. */
const ASK_FIELD_ID = 'ask-question';
/** התשובה לשאלה מהשורה הראשונה, מעל הרשימה. הגלילה אחרי "לראות קורסים" מגיעה אליה. */
export const FIRST_ANSWER_ID = 'first-answer';

/**
 * שורות המחברת בשדה: קו בראש כל שורה של 44 פיקסלים, וקו שסוגר למטה. הקווים נמשכים עד קצה הנייר,
 * כמו שורות המחברת למעלה (globals.css, .ruled-row). כשכותבים, הקווים בדיו (DESIGN.md, Inputs).
 */
const ruledField =
  '-ms-(--sheet-pad) ps-(--sheet-pad) border-b border-(--ask-line) bg-[repeating-linear-gradient(to_bottom,var(--ask-line)_0,var(--ask-line)_1px,transparent_1px,transparent_44px)] [--ask-line:var(--color-ruled)] focus-within:[--ask-line:var(--color-ink)]';

/** תווית בשוליים, מול שורה של תשובה: "שאלתם", "התשובה". */
const marginLabel = 'font-sans text-[13px] leading-tight font-normal text-ink-soft lg:text-[15px]';

/** הדפדפן יודע אם המבקר מחובר. השרת בודק את הטוקן בעצמו, ולכן כאן רק שולחים אותו. */
async function accessToken(): Promise<string | null> {
  try {
    const { data } = await createBrowserSupabase().auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

/** הקורסים שהיועץ נשאל עליהם: הראשונים ברשימה, ומזהה אחד לכולם יחד. */
function askedOf(courses: readonly CourseSummary[]) {
  const asked = courses.slice(0, MAX_COURSES);
  const slugs = asked.map((c) => c.slug);
  return { asked, slugs, key: slugs.join(',') };
}

/** "רשימה אחרת מתחילה שאלה חדשה": תשובה על רשימה אחת לא נכונה לרשימה אחרת. */
export function askKey(courses: readonly CourseSummary[]): string {
  return askedOf(courses).key;
}

type AskOutcome = { advice: Advice; error: null } | { advice: null; error: AskError };

/** התשובה לשאלה שנכתבה בשורה הראשונה. key: הרשימה שעליה נשאלה. */
export interface FirstAnswer {
  question: string;
  key: string;
  slugs: string[];
  asking: boolean;
  advice: Advice | null;
  error: AskError | null;
}

export interface AdvisorApi {
  /** כמה שאלות נשארו היום, לפי התשובה האחרונה מהשרת. null: עוד לא שאלו. */
  remaining: number | null;
  send: (question: string, slugs: readonly string[]) => Promise<AskOutcome>;
  /** התשובות לשאלות מהשורה הראשונה, לפי הטקסט של השאלה. */
  first: Readonly<Record<string, FirstAnswer>>;
  /** שולח שאלה מהשורה הראשונה, פעם אחת לכל טקסט. */
  askFirst: (question: string, courses: readonly CourseSummary[]) => void;
  /** שוב, אחרי שגיאה: רק כשהמבקר לוחץ. */
  retryFirst: (question: string) => void;
}

/**
 * היועץ של הדף: השאלות שנשלחות, ומה שנשאר היום. המחברת מחזיקה אותו, כי שאלה יכולה להגיע משני מקומות:
 * מהשורה הראשונה (התשובה מעל הרשימה) ומ"לשאול על הקורסים האלה" אחרי הרשימה. המכסה משותפת לשניהם.
 * שום דבר לא נשמר בשרת.
 */
export function useAdvisor(): AdvisorApi {
  const account = useAccount();
  const [remaining, setRemaining] = useState<number | null>(null);
  // אותו מספר, לשימוש בתוך אירוע: התשובה מהשרת יכולה להגיע אחרי שהאירוע כבר התחיל.
  const left = useRef<number | null>(null);
  const [first, setFirst] = useState<Record<string, FirstAnswer>>({});
  // שאלות מהשורה הראשונה שכבר נשלחו. כך אותה שאלה לא נשלחת פעמיים, גם אם הרשימה התחלפה וחזרה.
  const askedFirst = useRef(new Set<string>());

  async function send(question: string, slugs: readonly string[]): Promise<AskOutcome> {
    try {
      const headers: Record<string, string> = { 'content-type': 'application/json' };
      const token = account.status === 'signed-in' ? await accessToken() : null;
      if (token) headers.authorization = `Bearer ${token}`;
      const response = await fetch('/api/advise', {
        method: 'POST',
        headers,
        body: JSON.stringify({ question, courseSlugs: slugs }),
      });
      const body = (await response.json().catch(() => null)) as {
        advice?: unknown;
        remaining?: unknown;
        error?: AdviseError;
      } | null;
      if (typeof body?.remaining === 'number') {
        left.current = body.remaining;
        setRemaining(body.remaining);
      }
      if (!response.ok || !body?.advice) {
        return { advice: null, error: body?.error && body.error in ERROR_TEXT ? body.error : 'failed' };
      }
      // גם כאן: משפט בלי מקור מוכר, או על קורס שלא ברשימה, לא מוצג.
      return { advice: filterAdvice(body.advice, slugs), error: null };
    } catch {
      return { advice: null, error: 'network' };
    }
  }

  function runFirst(question: string, key: string, slugs: string[]) {
    const base = { question, key, slugs };
    // כבר ידוע שהשאלות להיום נגמרו: לא שולחים, ומראים את ההודעה על המכסה.
    if (left.current === 0) {
      setFirst((all) => ({ ...all, [question]: { ...base, asking: false, advice: null, error: 'limit' } }));
      return;
    }
    setFirst((all) => ({ ...all, [question]: { ...base, asking: true, advice: null, error: null } }));
    void send(question, slugs).then((outcome) =>
      setFirst((all) => ({ ...all, [question]: { ...base, asking: false, ...outcome } })),
    );
  }

  function askFirst(question: string, courses: readonly CourseSummary[]) {
    if (askedFirst.current.has(question)) return;
    askedFirst.current.add(question);
    const { slugs, key } = askedOf(courses);
    runFirst(question, key, slugs);
  }

  function retryFirst(question: string) {
    const answer = first[question];
    if (answer && !answer.asking) runFirst(question, answer.key, answer.slugs);
  }

  return { remaining, send, first, askFirst, retryFirst };
}

/**
 * שם קורס עד האורך הזה נשאר בשורה אחת, כמו בציור. ארוך ממנו כבר לא נכנס ב-390 לצד השוליים,
 * ולכן הוא נשבר כמו שאר הטקסט במקום לחרוג מהדף.
 */
const MAX_UNBROKEN_TITLE = 28;

/**
 * משפט אחד בתשובה, בסימון של המקור שלו. שם הקורס לפניו, כשהוא עובר לקורס אחר.
 * continues: אותו מקור כמו המשפט הקודם, על אותו קורס. הסימן בעט עומד רק בתחילת הרצף, ולא בכל משפט.
 */
function Sentence({ sentence, title, continues }: { sentence: AdviceSentence; title: string | null; continues: boolean }) {
  const text =
    sentence.source === 'institution' ? (
      <Claim>{sentence.text}</Claim>
    ) : (
      <Mark source={sentence.source === 'verified' ? 'verified' : 'grads'} cue={!continues}>
        {sentence.text}
      </Mark>
    );
  if (!title || !sentence.courseSlug) return text;
  return (
    <>
      {/* שם הקורס בגופן המודפס, מודגש וכקישור, כמו בציור. יעד מגע של 44 פיקסלים בתוך השורה: הריפוד לא מזיז את הטקסט. */}
      <Link
        href={`/courses/${sentence.courseSlug}`}
        className={cn(
          'py-3 font-sans font-bold underline decoration-1 underline-offset-[3px] hover:text-link-hover',
          title.length <= MAX_UNBROKEN_TITLE && 'whitespace-nowrap',
        )}
      >
        {title}
      </Link>
      {': '}
      {text}
    </>
  );
}

/**
 * התשובה, כמו עוד שורות בסיכום (Advisor.dc.html): המשפטים, מה חסר, המקרא, ועל מה התשובה מבוססת.
 * busy: שאלה חדשה בדרך. התשובה הקודמת מתעמעמת, כדי שלא תיקרא כתשובה לשאלה החדשה.
 * sheetRef: אחרי "לשאול" הפוקוס עובר לתשובה. התשובה שמעל הרשימה לא לוקחת את הפוקוס,
 * כי היא נשלחת כשיוצאים מהשורה, ואולי המבקר כבר כותב בשורה אחרת.
 */
function AnswerSheet({
  advice,
  busy,
  titleOf,
  sheetRef,
  className,
}: {
  advice: Advice;
  busy: boolean;
  titleOf: (slug: string) => string | null;
  sheetRef?: React.RefObject<HTMLElement | null>;
  className?: string;
}) {
  const titleId = useId();
  const { sentences } = advice;
  const missing =
    advice.missing ??
    (sentences.length === 0
      ? 'לא מצאנו תשובה בנתונים של הקורסים האלה.'
      : advice.notEnoughInfo
        ? 'על חלק מהשאלה אין לנו מספיק נתונים.'
        : null);
  return (
    <section
      ref={sheetRef}
      tabIndex={sheetRef ? -1 : undefined}
      aria-labelledby={titleId}
      aria-busy={busy || undefined}
      className={cn(
        'ruled-top scroll-mt-4 outline-none transition-opacity duration-200 ease-out motion-reduce:transition-none',
        busy && 'opacity-40',
        className ?? 'mt-6 lg:mt-8',
      )}
    >
      <div className="grid grid-cols-[var(--margin)_minmax(0,1fr)] pt-3">
        <h3 id={titleId} className={cn(marginLabel, 'pt-1')}>
          התשובה
        </h3>
        <div className="ps-3">
          {sentences.length > 0 && (
            <p className="max-w-[68ch] text-base leading-[1.85] text-pretty lg:text-[17px]">
              {sentences.map((sentence, i) => {
                const previous = sentences[i - 1];
                const title =
                  sentence.courseSlug && sentence.courseSlug !== previous?.courseSlug ? titleOf(sentence.courseSlug) : null;
                return (
                  <Fragment key={i}>
                    {i > 0 && ' '}
                    <Sentence
                      sentence={sentence}
                      title={title}
                      continues={!title && previous?.source === sentence.source}
                    />
                  </Fragment>
                );
              })}
            </p>
          )}
          {missing && (
            <p className={cn('max-w-[68ch] text-base leading-[1.85] lg:text-[17px]', sentences.length > 0 && 'mt-3')}>
              <strong className="font-sans">חסר לנו:</strong> {missing}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3.5 grid grid-cols-[var(--margin)_minmax(0,1fr)] items-start">
        <p className=" pt-0.5 pe-1.5 font-pen text-sm leading-snug font-medium text-pen lg:text-[15px]">
          <PenArrow />
          הצבע הוא המקור
        </p>
        <section
          aria-label="מקרא הסימונים"
          className="grid gap-y-1 ps-3 font-sans text-[13px] leading-normal lg:flex lg:flex-wrap lg:gap-x-5 lg:text-sm"
        >
          <span>
            <MarkSample source="verified">ירוק</MarkSample> נבדק מול מסמך
          </span>
          <span>
            <MarkSample source="grads">צהוב</MarkSample> מה שבוגרים אמרו
          </span>
          <span>
            <Claim>קו כחול</Claim> המוסד אומר, לא&nbsp;נבדק
          </span>
        </section>
      </div>

      <div className="ms-(--margin) mt-3.5 border-t border-rule pt-2.5 ps-3">
        <p className="max-w-[70ch] font-sans text-[13px] leading-normal text-pretty text-ink-soft lg:text-sm">
          התשובה נכתבה רק ממה שיש באתר על הקורסים ברשימה, בלי מידע מבחוץ. היא לא ממליצה איפה להירשם.
        </p>
      </div>
    </section>
  );
}

/** כשנגמרו השאלות למבקר שלא מחובר: מחוברים מקבלים יותר. חוזרים לרשימה הזו אחרי ההתחברות. */
function MoreQuestions() {
  const router = useRouter();
  return (
    <p className="font-sans text-sm">
      <Link
        href="/login"
        onClick={(event) => {
          // חוזרים לרשימה הזו אחרי ההתחברות, עם התשובות שבכתובת.
          event.preventDefault();
          router.push(loginHref());
        }}
        className="inline-flex min-h-11 items-center underline underline-offset-[3px] hover:text-link-hover"
      >
        משתמשים מחוברים יכולים לשאול עד {ADVISOR_LIMITS.userPerDay} שאלות ביום
      </Link>
    </p>
  );
}

/** הכותרת של רשימה שהיועץ ענה עליה: על כמה קורסים מתוכה. */
function scopeText(asked: number, total: number, where: 'below' | 'list'): string {
  const list = where === 'below' ? 'ברשימה למטה' : 'ברשימה';
  if (asked === 1) return `על הקורס ${list}`;
  if (total > MAX_COURSES) return `על ${MAX_COURSES} הקורסים הראשונים ${list}`;
  return `על ${asked} הקורסים ${list}`;
}

/**
 * התשובה לשאלה שנכתבה בשורה הראשונה, מעל הרשימה. השאלה כתובה בעט, כמו שנכתבה בשורה,
 * והתשובה מתחתיה בשורות של הסיכום. אין כאן טופס: שאלת המשך נשאלת ב"לשאול על הקורסים האלה" אחרי הרשימה.
 */
export function FirstAnswerSheet({
  answer,
  courses,
  onRetry,
}: {
  answer: FirstAnswer;
  courses: readonly CourseSummary[];
  onRetry: () => void;
}) {
  const account = useAccount();
  const headingId = useId();
  const { asked } = askedOf(courses);
  const titleOf = (slug: string) => asked.find((c) => c.slug === slug)?.title ?? null;
  const { asking, advice, error } = answer;
  const canRetry = !asking && (error === 'failed' || error === 'network' || error === 'too_fast');
  return (
    <section
      id={FIRST_ANSWER_ID}
      aria-labelledby={headingId}
      className="mt-[30px] scroll-mt-4 lg:mt-16 lg:scroll-mt-8"
    >
      {/* השאלה על שורה של המחברת: "שאלתם" בשוליים, והשאלה בעט על הקו. */}
      <h2
        id={headingId}
        className="ruled-top ruled-row grid min-h-[62px] grid-cols-[var(--margin)_minmax(0,1fr)] items-center font-normal lg:min-h-[68px]"
      >
        <span className={marginLabel}>
          שאלתם<span className="sr-only">: </span>
        </span>
        <span className="min-w-0 ps-3 pt-3.5 pb-1.5 text-start leading-[1.45] break-words">
          <PenAnswer>{answer.question}</PenAnswer>
        </span>
      </h2>
      <div className="ms-(--margin) ps-3">
        <p
          role="status"
          className={cn(
            'mt-2 min-h-[1lh] font-sans text-sm leading-snug lg:text-[15px]',
            error ? 'font-bold' : 'text-ink-soft',
          )}
        >
          {asking ? ASKING_TEXT : error ? ERROR_TEXT[error] : `התשובה ${scopeText(asked.length, courses.length, 'below')}.`}
        </p>
        {error === 'limit' && account.status === 'signed-out' && <MoreQuestions />}
        {canRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex min-h-11 items-center font-sans text-sm font-semibold underline underline-offset-[3px] hover:text-link-hover"
          >
            לשאול שוב
          </button>
        )}
      </div>
      {advice && <AnswerSheet advice={advice} busy={asking} titleOf={titleOf} className="mt-3.5 lg:mt-4" />}
    </section>
  );
}

/** קופץ ל"לשאול על הקורסים האלה" ומעביר את הפוקוס לשדה. בלי השדה בדף, הקישור עובד כרגיל. */
function jumpToAsk(event: React.MouseEvent<HTMLAnchorElement>) {
  const section = document.getElementById('ask');
  const field = document.getElementById(ASK_FIELD_ID);
  if (!section || !field) return;
  event.preventDefault();
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  section.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  field.focus({ preventScroll: true });
}

/**
 * בראש הרשימה: הדרך אל היועץ שמחכה אחריה. גל לא מצא אותו בסוף הרשימה, ולכן הוא מוזכר כבר כאן.
 * החץ מצויר בעט, כמו כל סימן באתר.
 */
export function AskLink() {
  return (
    <p className="mt-1 font-sans text-[15px] font-semibold lg:text-base">
      <a
        href="#ask"
        onClick={jumpToAsk}
        className="inline-flex min-h-11 items-center gap-x-1.5 hover:text-link-hover"
      >
        <span className="underline underline-offset-[3px]">לשאול את היועץ על הקורסים האלה</span>
        <PenArrowDown className="translate-y-[1px]" />
      </a>
    </p>
  );
}

/**
 * "לשאול על הקורסים האלה": שאלה חופשית על הקורסים ברשימה, ותשובה עם מקור לכל משפט.
 * שאלה אחת, תשובה אחת, ואפשר לשאול שוב. שום דבר לא נשמר בשרת.
 * נשלחים רק 10 הקורסים הראשונים, והשרת טוען את הנתונים שלהם בעצמו.
 * Results נותן key לפי הרשימה, ולכן רשימה אחרת מתחילה מחדש. המכסה ב-api, משותפת לשאלה מהשורה הראשונה.
 */
export function Advisor({ courses, api }: { courses: readonly CourseSummary[]; api: AdvisorApi }) {
  const account = useAccount();
  const statusId = useId();
  const field = useRef<HTMLTextAreaElement>(null);
  const sheet = useRef<HTMLElement>(null);
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [advice, setAdvice] = useState<Advice | null>(null);
  const [error, setError] = useState<AskError | null>(null);

  const { asked, slugs } = askedOf(courses);
  const titleOf = (slug: string) => asked.find((c) => c.slug === slug)?.title ?? null;
  const intro =
    asked.length === 1
      ? 'במילים שלכם, על הקורס ברשימה. עונים רק ממה שיש עליו באתר.'
      : `במילים שלכם, ${scopeText(asked.length, courses.length, 'list')}. עונים רק ממה שיש עליהם באתר.`;
  const { remaining } = api;
  const perDay = account.status === 'signed-in' ? ADVISOR_LIMITS.userPerDay : ADVISOR_LIMITS.visitorPerDay;
  // עד שידוע אם המבקר מחובר, השורה ריקה (ובאותו גובה), כדי שלא תכתוב 10 ותתחלף ל-30.
  // 'error' נשאר 10: בלי חשבון טעון לא נשלח טוקן, והשרת סופר אותו כמבקר.
  const status = asking
    ? ASKING_TEXT
    : error
      ? ERROR_TEXT[error]
      : remaining !== null
        ? leftText(remaining)
        : account.status === 'loading'
          ? ''
          : `עד ${perDay} שאלות ביום`;
  const noneLeft = remaining === 0;

  // תשובה חדשה: הפוקוס עובר אליה, כדי שקורא מסך יקרא אותה, והיא נגללת לתצוגה.
  useEffect(() => {
    if (advice) sheet.current?.focus();
  }, [advice]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = question.trim();
    if (asking || noneLeft) return;
    if (text === '') {
      setError('empty');
      field.current?.focus();
      return;
    }
    setAsking(true);
    setError(null);
    const outcome = await api.send(text, slugs);
    setAsking(false);
    // אחרי שגיאה התשובה הקודמת יורדת, כדי שלא תיראה כתשובה לשאלה שלא נענתה.
    setAdvice(outcome.advice);
    setError(outcome.error);
  }

  return (
    <section id="ask" aria-labelledby="ask-title" className="mt-[30px] scroll-mt-4 lg:mt-16">
      <div className="ms-(--margin) ps-3">
        <h2 id="ask-title" className="pen-rule text-[21px] leading-snug font-bold lg:text-[30px]">
          לשאול על הקורסים האלה
        </h2>
        <p className="mt-2 max-w-[70ch] font-sans text-[13px] leading-normal text-ink-soft lg:text-[15px]">{intro}</p>
      </div>

      <form aria-label="שאלה על הקורסים ברשימה" className="mt-3.5" onSubmit={(event) => void submit(event)}>
        <div className={cn('grid grid-cols-[var(--margin)_minmax(0,1fr)]', ruledField)}>
          <label htmlFor={ASK_FIELD_ID} className="pt-[13px] font-sans text-[13px] leading-tight text-ink-soft lg:text-[15px]">
            מה לשאול?
          </label>
          <textarea
            ref={field}
            id={ASK_FIELD_ID}
            name="question"
            rows={3}
            value={question}
            maxLength={MAX_QUESTION_LENGTH}
            placeholder={EXAMPLE}
            aria-describedby={statusId}
            aria-invalid={error === 'empty' || undefined}
            onChange={(event) => {
              setQuestion(event.currentTarget.value);
              if (error === 'empty') setError(null);
            }}
            className="field-sizing-content min-h-[132px] w-full min-w-0 resize-none bg-transparent ps-3 pe-1 font-pen text-[19px] leading-[44px] font-medium text-pen caret-pen outline-none placeholder:font-sans placeholder:text-[15px] placeholder:font-normal placeholder:text-ink-soft lg:max-w-[720px] lg:text-[21px] lg:placeholder:text-[17px]"
          />
        </div>
        <div className="ms-(--margin) ps-3">
          <button
            type="submit"
            disabled={asking || noneLeft}
            className={cn(
              buttonVariants(),
              'mt-3.5 h-[50px] w-full font-sans text-base font-bold lg:h-[54px] lg:max-w-[400px] lg:text-[17px]',
            )}
          >
            {asking ? 'שואלים…' : 'לשאול'}
          </button>
          <p
            id={statusId}
            role="status"
            className={cn(
              'mt-2 min-h-[1lh] font-sans text-sm leading-snug tabular-nums',
              asking ? 'text-ink-soft' : 'font-bold',
            )}
          >
            {status}
          </p>
          {(error === 'limit' || noneLeft) && account.status === 'signed-out' && <MoreQuestions />}
          {/* הודעה בנקודת האיסוף: לאן השאלה הולכת, ושהיא לא נשמרת (מדיניות הפרטיות, #advisor). */}
          <p className="mt-1 max-w-[60ch] font-sans text-[13px] leading-normal text-ink-soft">
            השאלה עוברת ל-Anthropic רק כדי לכתוב את התשובה, ולא נשמרת אצלנו.{' '}
            <Link href="/privacy#advisor" className="underline underline-offset-[3px] hover:text-link-hover">
              פרטיות
            </Link>
          </p>
        </div>
      </form>

      {advice && <AnswerSheet advice={advice} busy={asking} titleOf={titleOf} sheetRef={sheet} />}
    </section>
  );
}
