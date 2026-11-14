'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Fragment, useEffect, useId, useRef, useState } from 'react';
import { Claim, Mark, PenNote } from '@/components/course/marks';
import { PenArrow } from '@/components/site/pen';
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

type AskError = AdviseError | 'network';

/** שגיאות בדיו מודגשת, בלי צבע חדש. כל אחת אומרת מה קרה ומה אפשר לעשות. */
const ERROR_TEXT: Record<AskError, string> = {
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

/**
 * שורות המחברת בשדה: קו בראש כל שורה של 44 פיקסלים, וקו שסוגר למטה. הקווים נמשכים עד קצה הנייר,
 * כמו שורות המחברת למעלה (globals.css, .ruled-row). כשכותבים, הקווים בדיו (DESIGN.md, Inputs).
 */
const ruledField =
  '-ms-(--sheet-pad) ps-(--sheet-pad) border-b border-(--ask-line) bg-[repeating-linear-gradient(to_bottom,var(--ask-line)_0,var(--ask-line)_1px,transparent_1px,transparent_44px)] [--ask-line:var(--color-ruled)] focus-within:[--ask-line:var(--color-ink)]';

/** הדפדפן יודע אם המבקר מחובר. השרת בודק את הטוקן בעצמו, ולכן כאן רק שולחים אותו. */
async function accessToken(): Promise<string | null> {
  try {
    const { data } = await createBrowserSupabase().auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

/** משפט אחד בתשובה, בסימון של המקור שלו. שם הקורס לפניו, כשהוא עובר לקורס אחר. */
function Sentence({ sentence, title }: { sentence: AdviceSentence; title: string | null }) {
  const text =
    sentence.source === 'institution' ? (
      <Claim>{sentence.text}</Claim>
    ) : (
      <Mark source={sentence.source === 'verified' ? 'verified' : 'grads'}>{sentence.text}</Mark>
    );
  if (!title || !sentence.courseSlug) return text;
  return (
    <>
      {/* שם הקורס בגופן המודפס, מודגש וכקישור, כמו בציור. יעד מגע של 44 פיקסלים בתוך השורה: הריפוד לא מזיז את הטקסט. */}
      <Link
        href={`/courses/${sentence.courseSlug}`}
        className="py-3 font-sans font-bold underline decoration-1 underline-offset-[3px] hover:text-link-hover"
      >
        {title}
      </Link>
      {': '}
      {text}
    </>
  );
}

/** התשובה, כמו עוד שורות בסיכום (Advisor.dc.html): המשפטים, מה חסר, המקרא, ועל מה התשובה מבוססת. */
function AnswerSheet({
  advice,
  titleOf,
  sheetRef,
}: {
  advice: Advice;
  titleOf: (slug: string) => string | null;
  sheetRef: React.RefObject<HTMLElement | null>;
}) {
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
      tabIndex={-1}
      aria-labelledby="advice-title"
      className="ruled-top mt-6 scroll-mt-4 outline-none lg:mt-8"
    >
      <div className="grid grid-cols-[var(--margin)_minmax(0,1fr)] pt-3">
        <h3 id="advice-title" className="pt-1 font-sans text-[13px] leading-tight font-normal text-ink-soft lg:text-[15px]">
          התשובה
        </h3>
        <div className="ps-3">
          {sentences.length > 0 && (
            <p className="max-w-[68ch] text-base leading-[1.85] text-pretty lg:text-[17px]">
              {sentences.map((sentence, i) => (
                <Fragment key={i}>
                  {i > 0 && ' '}
                  <Sentence
                    sentence={sentence}
                    title={
                      sentence.courseSlug && sentence.courseSlug !== sentences[i - 1]?.courseSlug
                        ? titleOf(sentence.courseSlug)
                        : null
                    }
                  />
                </Fragment>
              ))}
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
        <p className="-rotate-3 pt-0.5 pe-1.5 font-pen text-sm leading-snug font-medium text-pen lg:text-[15px]">
          <PenArrow />
          הצבע הוא המקור
        </p>
        <section
          aria-label="מקרא הסימונים"
          className="grid gap-y-1 ps-3 font-sans text-[13px] leading-normal lg:flex lg:flex-wrap lg:gap-x-5 lg:text-sm"
        >
          <span>
            <span className="hl hl-verified font-semibold">ירוק</span> נבדק מול מסמך
          </span>
          <span>
            <span className="hl hl-grads font-semibold">צהוב</span> מה שבוגרים אמרו
          </span>
          <span>
            <Claim>קו כחול</Claim> המוסד אומר, לא נבדק
          </span>
        </section>
      </div>

      <div className="ms-(--margin) mt-3.5 border-t border-rule pt-2.5 ps-3">
        <p className="max-w-[70ch] font-sans text-[13px] leading-normal text-pretty text-ink-soft lg:text-sm">
          התשובה נכתבה רק ממה שיש באתר על הקורסים ברשימה, בלי מידע מבחוץ. היא לא ממליצה איפה להירשם.
        </p>
        <PenNote arrow className="mt-1.5 font-medium">
          נתוני דוגמה: הקורסים, המספרים והביקורות כאן לדוגמה.
        </PenNote>
      </div>
    </section>
  );
}

/**
 * "לשאול על הקורסים האלה": שאלה חופשית על הקורסים ברשימה, ותשובה עם מקור לכל משפט.
 * שאלה אחת, תשובה אחת, ואפשר לשאול שוב. שום דבר לא נשמר בשרת.
 * נשלחים רק 10 הקורסים הראשונים, והשרת טוען את הנתונים שלהם בעצמו.
 * Results נותן key לפי הרשימה, ולכן רשימה אחרת מתחילה מחדש.
 */
export function Advisor({ courses }: { courses: readonly CourseSummary[] }) {
  const account = useAccount();
  const router = useRouter();
  const fieldId = useId();
  const statusId = useId();
  const field = useRef<HTMLTextAreaElement>(null);
  const sheet = useRef<HTMLElement>(null);
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [advice, setAdvice] = useState<Advice | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [error, setError] = useState<AskError | null>(null);

  const asked = courses.slice(0, MAX_COURSES);
  const slugs = asked.map((c) => c.slug);
  const titleOf = (slug: string) => asked.find((c) => c.slug === slug)?.title ?? null;
  const intro =
    asked.length === 1
      ? 'במילים שלכם, על הקורס ברשימה. עונים רק ממה שיש עליו באתר.'
      : courses.length > MAX_COURSES
        ? `במילים שלכם, על ${MAX_COURSES} הקורסים הראשונים ברשימה. עונים רק ממה שיש עליהם באתר.`
        : `במילים שלכם, על ${asked.length} הקורסים ברשימה. עונים רק ממה שיש עליהם באתר.`;
  const perDay = account.status === 'signed-in' ? ADVISOR_LIMITS.userPerDay : ADVISOR_LIMITS.visitorPerDay;
  const status = asking
    ? 'כותבים תשובה מהנתונים של הקורסים…'
    : error
      ? ERROR_TEXT[error]
      : remaining !== null
        ? leftText(remaining)
        : `עד ${perDay} שאלות ביום`;

  // תשובה חדשה: הפוקוס עובר אליה, כדי שקורא מסך יקרא אותה, והיא נגללת לתצוגה.
  useEffect(() => {
    if (advice) sheet.current?.focus();
  }, [advice]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = question.trim();
    if (asking) return;
    if (text === '') {
      field.current?.focus();
      return;
    }
    setAsking(true);
    setError(null);
    try {
      const headers: Record<string, string> = { 'content-type': 'application/json' };
      const token = account.status === 'signed-in' ? await accessToken() : null;
      if (token) headers.authorization = `Bearer ${token}`;
      const response = await fetch('/api/advise', {
        method: 'POST',
        headers,
        body: JSON.stringify({ question: text, courseSlugs: slugs }),
      });
      const body = (await response.json().catch(() => null)) as {
        advice?: unknown;
        remaining?: unknown;
        error?: AdviseError;
      } | null;
      if (typeof body?.remaining === 'number') setRemaining(body.remaining);
      if (!response.ok || !body?.advice) {
        setError(body?.error && body.error in ERROR_TEXT ? body.error : 'failed');
        return;
      }
      // גם כאן: משפט בלי מקור מוכר, או על קורס שלא ברשימה, לא מוצג.
      setAdvice(filterAdvice(body.advice, slugs));
    } catch {
      setError('network');
    } finally {
      setAsking(false);
    }
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
          <label htmlFor={fieldId} className="pt-[13px] font-sans text-[13px] leading-tight text-ink-soft lg:text-[15px]">
            מה לשאול?
          </label>
          <textarea
            ref={field}
            id={fieldId}
            name="question"
            rows={3}
            value={question}
            maxLength={MAX_QUESTION_LENGTH}
            placeholder={EXAMPLE}
            aria-describedby={statusId}
            onChange={(event) => setQuestion(event.currentTarget.value)}
            className="field-sizing-content min-h-[132px] w-full min-w-0 resize-none bg-transparent ps-3 pe-1 font-pen text-[19px] leading-[44px] font-medium text-pen caret-pen outline-none placeholder:font-sans placeholder:text-[15px] placeholder:font-normal placeholder:text-ink-soft lg:max-w-[720px] lg:text-[21px] lg:placeholder:text-[17px]"
          />
        </div>
        <div className="ms-(--margin) ps-3">
          <button
            type="submit"
            disabled={asking}
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
            className={cn('mt-2 font-sans text-sm leading-snug tabular-nums', asking ? 'text-ink-soft' : 'font-bold')}
          >
            {status}
          </p>
          {error === 'limit' && account.status === 'signed-out' && (
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
          )}
        </div>
      </form>

      {advice && <AnswerSheet advice={advice} titleOf={titleOf} sheetRef={sheet} />}
    </section>
  );
}
