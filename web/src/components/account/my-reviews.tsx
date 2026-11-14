'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { PenArrow } from '@/components/site/pen';
import { deleteReview, loadMyReviews, writeAttached, type MyReview } from '@/lib/reviews/browser';
import { verifiedLabel } from '@/lib/reviews/types';
import type { Catalog, CourseSummary } from '@/lib/search/types';
import { cn } from '@/lib/utils';
import { MeSection, textButton } from './me-section';

type Load = { status: 'loading' } | { status: 'error' } | { status: 'ready'; reviews: MyReview[] };

const monthLabel = (iso: string) =>
  new Intl.DateTimeFormat('he-IL', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(iso));
const times = (n: number) => (n === 0 ? 'עוד לא קראו אותה' : n === 1 ? 'קראו אותה פעם אחת' : `קראו אותה ${n} פעמים`);
const people = (n: number) => (n === 0 ? 'עוד לא סימנו שהיא עזרה' : n === 1 ? 'היא עזרה לאדם אחד' : `היא עזרה ל-${n} אנשים`);
const isPublished = (review: MyReview) => review.status === 'published' || review.status === 'disputed';
const isReturned = (review: MyReview) => review.status === 'draft' && review.decisionNote !== null;

/** המצב בשוליים, במילה אחת ובגופן המודפס: כך אפשר לעבור על הרשימה בעין, כמו על עמודה בסיכום. */
function statusWord(review: MyReview): string {
  if (isReturned(review)) return 'הוחזרה';
  if (review.status === 'draft') return 'טיוטה';
  if (review.status === 'pending') return 'ממתינה לבדיקה';
  if (isPublished(review)) return 'פורסמה';
  return 'הוסרה';
}

const link = 'inline-flex min-h-11 items-center font-semibold underline underline-offset-[3px] hover:text-link-hover';

/** מה אפשר לעשות עכשיו עם הביקורת, אם בכלל. */
function nextStep(review: MyReview, course: CourseSummary | undefined): { href: string; label: string } | null {
  if (!course) return null;
  if (isReturned(review)) return { href: `/courses/${course.slug}/review`, label: 'להעלות הוכחה אחרת' };
  if (review.status === 'draft') return { href: `/courses/${course.slug}/review`, label: 'להמשיך לכתוב' };
  if (isPublished(review)) return { href: `/courses/${course.slug}#reviews`, label: 'לראות בעמוד הקורס' };
  return null;
}

/** מה שקורה עכשיו (מסמך העיצוב, סעיף 5). ההבטחה של האתר ("תוך 48 שעות") בעט. */
function Details({ review }: { review: MyReview }) {
  if (isReturned(review)) {
    return (
      <div className="mt-1.5 font-sans text-[15px] leading-normal">
        <p className="font-bold">החזרנו אותה אליכם.</p>
        <p className="mt-0.5 max-w-[52ch] text-pretty">{review.decisionNote}</p>
      </div>
    );
  }
  if (review.status === 'draft') return <p className="mt-1 font-sans text-[15px] leading-normal">עוד לא נשלחה לבדיקה.</p>;
  if (review.status === 'pending') {
    return (
      <p className="mt-1.5 -rotate-1 font-pen text-[15px] leading-snug font-medium text-pen">
        <PenArrow />
        נבדוק תוך 48 שעות
      </p>
    );
  }
  if (isPublished(review)) {
    return (
      <p className="mt-1 font-sans text-[15px] leading-normal text-pretty">
        {times(review.readCount)}, ו{people(review.helpfulCount)}.
      </p>
    );
  }
  return <p className="mt-1 font-sans text-[15px] leading-normal">היא כבר לא מופיעה באתר.</p>;
}

/** שורה במחברת לכל ביקורת: המצב בשוליים, הקורס, ומה אפשר לעשות. */
function ReviewRow({
  review,
  course,
  confirming,
  busy,
  error,
  onAsk,
  onCancel,
  onDelete,
}: {
  review: MyReview;
  course: CourseSummary | undefined;
  confirming: boolean;
  busy: boolean;
  /** למה המחיקה נכשלה, בתוך שלב האישור, ליד הכפתור שנלחץ. */
  error: string | null;
  onAsk: () => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const question = useRef<HTMLParagraphElement>(null);
  const title = course?.title ?? 'קורס שכבר לא באתר';
  const step = nextStep(review, course);

  // שלב האישור נפתח: הפוקוס עובר לשאלה, כדי שקורא מסך יקרא אותה.
  useEffect(() => {
    if (confirming) question.current?.focus();
  }, [confirming]);

  return (
    <li className="ruled-row grid grid-cols-[var(--margin)_minmax(0,1fr)] pt-3.5 pb-2">
      {/* השם ראשון בקוד, כדי שקורא מסך יקרא את הקורס לפני המצב. הרשת קובעת את המיקום. */}
      <h3 className="col-start-2 row-start-1 ps-3 text-[19px] leading-snug font-bold">
        {course ? (
          <Link
            href={`/courses/${course.slug}`}
            className="-my-2.5 inline-flex min-h-11 items-center decoration-[1.5px] underline-offset-4 hover:text-link-hover hover:underline"
          >
            {title}
          </Link>
        ) : (
          title
        )}
      </h3>
      <p className="col-start-1 row-span-2 row-start-1 pt-1 pe-2 font-sans text-[13px] leading-tight font-bold lg:text-[15px]">
        <span className="sr-only">מצב: </span>
        {statusWord(review)}
      </p>
      <div className="col-start-2 row-start-2 ps-3">
        <p className="mt-0.5 font-sans text-sm leading-normal text-ink-soft">מחזור {monthLabel(review.cohortMonth)}</p>
        <Details review={review} />
        {confirming ? (
          <div role="group" aria-labelledby={`delete-${review.id}`} className="mt-2.5 mb-1 border-t-2 border-ink pt-2.5 font-sans">
            <p id={`delete-${review.id}`} ref={question} tabIndex={-1} className="text-[15px] font-bold outline-none">
              למחוק את הביקורת?
            </p>
            <p className="mt-0.5 text-[13px] leading-normal text-pretty text-ink-soft">
              {isPublished(review) ? 'היא תוסר מעמוד הקורס ומהציון. ' : ''}אי אפשר לבטל את זה.
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-4">
              <button type="button" disabled={busy} onClick={onDelete} className={cn(textButton, 'px-0 font-bold')}>
                {busy ? 'מוחקים…' : 'כן, למחוק'}
              </button>
              <button type="button" disabled={busy} onClick={onCancel} className={textButton}>
                לא, להשאיר
              </button>
            </div>
            {error && (
              <p role="alert" className="mb-1 text-[15px] leading-normal font-bold">
                {error}
              </p>
            )}
          </div>
        ) : (
          // הצעד הבא והמחיקה בשורה אחת. המחיקה שקטה יותר: אפור, בלי הדגשה.
          <div className="flex flex-wrap items-center gap-x-5">
            {step && (
              <Link href={step.href} className={cn(link, 'font-sans text-[15px]')}>
                {step.label}
              </Link>
            )}
            <button type="button" onClick={onAsk} className={cn(textButton, 'px-0 text-sm font-normal text-ink-soft')}>
              למחוק<span className="sr-only"> את הביקורת על {title}</span>
            </button>
          </div>
        )}
      </div>
    </li>
  );
}

/**
 * "הביקורות שלי" ו"הקורסים שלי". נטען בדפדפן דרך my_reviews(): רק הכותב רואה את המצב, את מספר הקריאות
 * ואת ההודעה של גל. מחיקה עוברת בשרת (POST /api/reviews/delete), כי היא מוחקת קבצים ומעדכנת את הציון.
 * בלי נקודות ובלי תגמול על כמות (מסמך העיצוב, סעיף 5).
 */
export function MyReviews({ catalog, userId }: { catalog: Catalog; userId: string }) {
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const [confirming, setConfirming] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    loadMyReviews().then(
      (reviews) => {
        if (alive) setLoad({ status: 'ready', reviews });
      },
      () => {
        if (alive) setLoad({ status: 'error' });
      },
    );
    return () => {
      alive = false;
    };
  }, [userId]);

  const byId = new Map(catalog.courses.map((course) => [course.id, course]));
  const reviews = load.status === 'ready' ? load.reviews : [];
  const published = reviews.filter(isPublished);

  async function remove(review: MyReview) {
    setBusy(true);
    setError(null);
    setNotice(null);
    const result = await deleteReview(review.id);
    setBusy(false);
    if (result !== 'ok') {
      setError(result === 'not_configured' ? 'מחיקה עוד לא פתוחה באתר. לא נמחק כלום.' : 'לא הצלחנו למחוק. לא נמחק כלום. נסו שוב.');
      return;
    }
    setConfirming(null);
    // הקבצים שהועלו ולא נשלחו כבר נמחקו בשרת. גם הרשימה שלהם בדפדפן כבר לא צריכה להישמר.
    writeAttached(review.id, []);
    setLoad((current) =>
      current.status === 'ready' ? { status: 'ready', reviews: current.reviews.filter((r) => r.id !== review.id) } : current,
    );
    setNotice(`הביקורת על ${byId.get(review.courseId)?.title ?? 'הקורס'} נמחקה.`);
  }

  const emptyRows = (
    <>
      <div aria-hidden="true" className="ruled-row h-[30px]" />
      <div aria-hidden="true" className="ruled-row h-[38px]" />
    </>
  );

  return (
    <>
      <MeSection
        id="reviews"
        title="הביקורות שלי"
        sub="רק אתם רואים את המצב של כל ביקורת ואת המספרים."
        className="mt-8"
      >
        {/* מה שנמחק נאמר מעל הרשימה, במקום שבו השורה הייתה, ולא מתחת לשורות הריקות. */}
        <p role="status" className="ms-(--margin) mt-2.5 ps-3 font-sans text-[15px] leading-normal font-semibold empty:hidden">
          {notice}
        </p>
        {load.status === 'loading' && (
          <>
            <p role="status" className="sr-only">
              טוענים את הביקורות שלכם
            </p>
            {emptyRows}
          </>
        )}
        {load.status === 'error' && (
          <p role="alert" className="ms-(--margin) mt-2.5 ps-3 font-sans text-[15px] font-bold">
            לא הצלחנו לטעון את הביקורות. נסו לרענן את הדף.
          </p>
        )}
        {load.status === 'ready' && reviews.length === 0 && (
          <>
            <p className="ms-(--margin) mt-2.5 ps-3 text-base leading-[1.7]">
              עוד לא כתבתם ביקורת.{' '}
              <Link href="/review" className={cn(link, 'font-sans')}>
                לכתוב על קורס שסיימתם
              </Link>
            </p>
            {emptyRows}
          </>
        )}
        {reviews.length > 0 && (
          <ul className="ruled-top mt-3">
            {reviews.map((review) => (
              <ReviewRow
                key={review.id}
                review={review}
                course={byId.get(review.courseId)}
                confirming={confirming === review.id}
                busy={busy}
                error={confirming === review.id ? error : null}
                onAsk={() => {
                  setError(null);
                  setConfirming(review.id);
                }}
                onCancel={() => {
                  setError(null);
                  setConfirming(null);
                }}
                onDelete={() => void remove(review)}
              />
            ))}
          </ul>
        )}
      </MeSection>

      <MeSection
        id="courses"
        title="הקורסים שלי"
        sub="קורסים שכתבתם עליהם ביקורת שאומתה ופורסמה."
        className="mt-8"
      >
        {load.status === 'ready' && published.length === 0 && (
          <>
            <p className="ms-(--margin) mt-2.5 ps-3 text-base leading-[1.7]">
              כאן יופיעו הקורסים, אחרי שביקורת עליהם תאומת ותתפרסם.
            </p>
            <div aria-hidden="true" className="ruled-row h-[30px]" />
          </>
        )}
        {published.length > 0 && (
          <ul className="ruled-top mt-3">
            {published.map((review) => {
              const course = byId.get(review.courseId);
              return (
                <li
                  key={review.id}
                  className="ruled-row grid min-h-[54px] grid-cols-[var(--margin)_minmax(0,1fr)] items-center py-1"
                >
                  <p className="col-start-2 flex flex-wrap items-baseline gap-x-2.5 ps-3">
                    {course ? (
                      <Link
                        href={`/courses/${course.slug}`}
                        className="inline-flex min-h-11 items-center text-[17px] leading-snug font-bold decoration-[1.5px] underline-offset-4 hover:text-link-hover hover:underline"
                      >
                        {course.title}
                      </Link>
                    ) : (
                      <span className="text-[17px] leading-snug font-bold">קורס שכבר לא באתר</span>
                    )}
                    <span className="font-sans text-[13px] font-semibold">{verifiedLabel(review.authorTitle)}</span>
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </MeSection>
    </>
  );
}
