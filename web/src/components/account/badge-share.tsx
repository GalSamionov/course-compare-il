'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { TickMark } from '@/components/notebook/tick';
import { buttonVariants } from '@/components/ui/button';
import { badgeHeadline, badgePath, badgeUrl, linkedInShareHref } from '@/lib/badges/badge';
import { shareBadge, unshareBadge, type MyBadge } from '@/lib/badges/browser';
import type { MyReview } from '@/lib/reviews/browser';
import { cn } from '@/lib/utils';
import { textButton } from './me-section';

const noSubscribe = () => () => {};

const link = 'inline-flex min-h-11 items-center font-sans text-[15px] font-semibold underline underline-offset-[3px] hover:text-link-hover';

/**
 * "לשתף ב-LinkedIn" בביקורת שפורסמה: קודם רואים בדיוק מה הכרטיס יראה, ורק אחר כך נוצר הקישור.
 * ברירת המחדל: בלי שם ובלי מה שכתבתם. שם רק אם בוחרים, ורק אם בביקורת עצמה לא בחרתם "בלי שם".
 * הקישור ל-LinkedIn הוא קישור רגיל, שנלחץ ביד: חלון שנפתח אחרי פעולה באתר נחסם בדפדפנים רבים.
 * זו הכרה ולא תגמול: אין כאן ספירה של שיתופים או של צפיות.
 */
export function BadgeShare({
  review,
  courseTitle,
  badge,
  onChange,
  onClose,
}: {
  review: MyReview;
  courseTitle: string;
  badge: MyBadge | undefined;
  onChange: (badge: MyBadge | null) => void;
  onClose: () => void;
}) {
  const heading = useRef<HTMLParagraphElement>(null);
  const [showName, setShowName] = useState(badge?.showName ?? false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // הכתובת של האתר רק בדפדפן. בשרת ובהידרציה ריקה, ומיד אחר כך הערך האמיתי (כמו ShareLinks).
  const origin = useSyncExternalStore(noSubscribe, () => window.location.origin, () => '');
  const canName = review.displayMode !== 'anonymous';

  // הפוקוס עובר לכותרת של החלק שנפתח, כדי שקורא מסך יקרא אותה.
  useEffect(() => {
    heading.current?.focus();
  }, []);

  const preview = badgeHeadline({
    courseTitle,
    shownName: showName && canName ? review.displayName : null,
    shownTitle: showName && canName ? review.authorTitle : null,
  });

  async function save(nextShowName: boolean) {
    setBusy(true);
    setError(null);
    const token = await shareBadge(review.id, nextShowName);
    setBusy(false);
    if (!token) {
      setError('לא הצלחנו ליצור קישור. נסו שוב בעוד דקה.');
      return false;
    }
    onChange({ reviewId: review.id, token, showName: nextShowName && canName });
    return true;
  }

  async function toggleName() {
    const next = !showName;
    setShowName(next);
    // כשכבר יש קישור, הבחירה נשמרת מיד: הכרטיס שכבר שותף משתנה, והקישור נשאר אותו קישור.
    if (badge && !(await save(next))) setShowName(!next);
  }

  async function stop() {
    setBusy(true);
    setError(null);
    const ok = await unshareBadge(review.id);
    setBusy(false);
    if (!ok) {
      setError('לא הצלחנו להפסיק לשתף. נסו שוב.');
      return;
    }
    onChange(null);
  }

  const url = badge && origin ? badgeUrl(origin, badge.token) : null;

  return (
    <div
      role="group"
      aria-labelledby={`badge-${review.id}`}
      className="mt-2.5 mb-1 max-w-[56ch] border-t-2 border-ink pt-2.5 font-sans"
    >
      <p id={`badge-${review.id}`} ref={heading} tabIndex={-1} className="text-[15px] leading-snug font-bold outline-none">
        לשתף ב-LinkedIn שאתם בוגרים מאומתים
      </p>
      <p className="mt-1 text-[15px] leading-normal text-pretty">
        הכרטיס יראה: <strong>{preview}</strong>, ואת שם המוסד. לא את מה שכתבתם.
      </p>
      <p className="mt-0.5 text-[13px] leading-normal text-pretty text-ink-soft">
        מי שיראה אותו יידע שכתבתם ביקורת על הקורס. אפשר להפסיק לשתף מתי שרוצים, והקישור יפסיק לעבוד מיד.{' '}
        <Link href="/privacy#badges" className="underline underline-offset-[3px] hover:text-link-hover">
          מה נשמר
        </Link>
      </p>

      {canName ? (
        <button
          type="button"
          role="checkbox"
          aria-checked={showName}
          disabled={busy}
          onClick={() => void toggleName()}
          className="group mt-1.5 flex min-h-11 items-center gap-2.5 text-start text-[15px] disabled:cursor-wait"
        >
          <span
            aria-hidden="true"
            className="relative size-[22px] flex-none rounded-[2px] border-[1.5px] border-ink transition-colors group-hover:border-pen"
          >
            {showName && <TickMark className="absolute -top-[11px] -left-0.5 size-8" />}
          </span>
          <span>
            להראות בכרטיס את השם שלי: <strong>{review.displayName}</strong>
          </span>
        </button>
      ) : (
        <p className="mt-1.5 text-[13px] leading-normal text-ink-soft">בביקורת בחרתם בלי שם, ולכן גם בכרטיס אין שם.</p>
      )}

      {badge ? (
        <>
          <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1">
            {url && (
              <a
                href={linkedInShareHref(url)}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants(), 'h-[50px] px-5 text-base font-bold')}
              >
                לשתף ב-LinkedIn<span className="sr-only"> (נפתח בחלון חדש)</span>
              </a>
            )}
            <a href={badgePath(badge.token)} target="_blank" rel="noopener" className={link}>
              לראות את הכרטיס<span className="sr-only"> (נפתח בחלון חדש)</span>
            </a>
          </div>
          <div className="flex flex-wrap items-center gap-x-4">
            <button type="button" disabled={busy} onClick={() => void stop()} className={cn(textButton, 'px-0 text-sm font-normal text-ink-soft')}>
              להפסיק לשתף
            </button>
            <button type="button" onClick={onClose} className={cn(textButton, 'px-0 text-sm font-normal text-ink-soft')}>
              לסגור
            </button>
          </div>
        </>
      ) : (
        <div className="mt-2 flex flex-wrap items-center gap-x-4">
          <button
            type="button"
            disabled={busy}
            onClick={() => void save(showName)}
            className={cn(buttonVariants(), 'h-[50px] px-5 text-base font-bold', busy && 'cursor-wait')}
          >
            {busy ? 'יוצרים קישור…' : 'ליצור קישור לשיתוף'}
          </button>
          <button type="button" disabled={busy} onClick={onClose} className={textButton}>
            לא עכשיו
          </button>
        </div>
      )}
      <div role="status">{error && <p className="mt-1 text-[15px] leading-normal font-bold">{error}</p>}</div>
    </div>
  );
}
