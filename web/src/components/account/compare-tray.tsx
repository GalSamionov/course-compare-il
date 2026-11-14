'use client';

import { PenArrow } from '@/components/site/pen';
import Link from 'next/link';
import { useState } from 'react';
import { MAX_COMPARE } from '@/lib/account/lists';
import { toggleCompare } from '@/lib/account/store';
import { formatIls } from '@/lib/format';
import type { CourseSummary } from '@/lib/search/types';
import { cn } from '@/lib/utils';
import { MeSection, marginNote } from './me-section';

const chosenText = (n: number) => (n === 0 ? 'עוד לא בחרתם.' : n === 1 ? 'בחרתם אחד.' : `בחרתם ${n}.`);
const smallLink = 'underline underline-offset-[3px] hover:text-link-hover';

/**
 * "ההשוואה שלי": שלושה מקומות בדיוק, זה לצד זה, כמו בציור (Me.dc.html).
 * מקום שהתפנה נשאר ריק במקום שלו. עמוד ההשוואה עצמו נבנה בסבב 4, ולכן ליד הקישור אליו כתוב בעט "נפתח בקרוב".
 */
export function CompareTray({ slots }: { slots: { position: number; course: CourseSummary }[] }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  async function remove(courseId: string) {
    setBusy(courseId);
    const result = await toggleCompare(courseId);
    setBusy(null);
    setFailed(result !== 'ok');
  }

  return (
    <MeSection
      id="compare"
      title="ההשוואה שלי"
      sub={`יש בה מקום ל-3 קורסים בדיוק, זה לצד זה. ${chosenText(slots.length)}`}
      className="mt-9 lg:mt-0"
    >
      <ol
        aria-label={`${slots.length} מתוך ${MAX_COMPARE} מקומות תפוסים`}
        className="relative z-[1] mt-3.5 grid grid-cols-3 border-[1.5px] border-ink bg-white"
      >
        {Array.from({ length: MAX_COMPARE }, (_, i) => i + 1).map((position) => {
          const slot = slots.find((s) => s.position === position);
          const divider = position < MAX_COMPARE && 'border-e border-ink';
          if (!slot) {
            return (
              <li key={position} className={cn('flex p-1.5', divider)}>
                <div className="flex flex-1 flex-col rounded-[2px] border-[1.5px] border-dashed border-leader pt-[3px] ps-1.5 pe-1">
                  <span className="font-sans text-base leading-tight font-bold text-ink-soft">{position}</span>
                  <p className="mt-2 font-sans text-sm leading-snug text-ink-soft">מקום פנוי</p>
                  <a
                    href="#saved"
                    className={cn('mt-auto flex min-h-11 items-center font-sans text-sm leading-tight font-bold', smallLink)}
                  >
                    להוסיף מהשמורים
                  </a>
                </div>
              </li>
            );
          }
          const { course } = slot;
          return (
            <li key={position} className={cn('flex flex-col pt-2.5 ps-2.5 pe-2 pb-1', divider)}>
              <span className="font-sans text-base leading-tight font-bold">{position}</span>
              <Link
                href={`/courses/${course.slug}`}
                className="mt-1 flex min-h-11 items-center text-[15px] leading-snug font-bold hover:text-link-hover hover:underline"
              >
                {course.title}
              </Link>
              {course.score.status === 'scored' ? (
                <p className="mt-1 flex flex-wrap items-baseline gap-x-1 font-sans text-[13px] leading-tight text-ink-soft">
                  <span className="font-serif text-xl leading-none font-bold text-ink">
                    {course.score.value.toFixed(1)}
                  </span>
                  ציון בוגרים
                </p>
              ) : (
                <p className="mt-1 font-sans text-[13px] leading-tight text-ink-soft">עוד אין ציון</p>
              )}
              <p className="mt-1 font-sans text-[15px] leading-snug font-bold tabular-nums">
                {course.sitePrice !== null ? (
                  <bdi dir="rtl">{formatIls(course.sitePrice)}</bdi>
                ) : (
                  <span className="text-[13px] font-normal text-ink-soft">בלי מחיר באתר</span>
                )}
              </p>
              <button
                type="button"
                disabled={busy === course.id}
                onClick={() => void remove(course.id)}
                aria-label={`להוציא את ${course.title} מההשוואה`}
                className="mt-1.5 inline-flex h-11 min-w-11 items-center self-start px-1 font-sans text-sm font-semibold underline underline-offset-[3px] hover:text-link-hover"
              >
                להוציא
              </button>
            </li>
          );
        })}
      </ol>
      {failed && (
        <p role="status" className="ms-(--margin) mt-2 ps-3 font-sans text-[13px] text-ink-soft">
          לא הצלחנו לעדכן. נסו שוב.
        </p>
      )}
      <div className="mt-2.5 grid grid-cols-[var(--margin)_minmax(0,1fr)] items-center">
        <p className={marginNote}>
          <PenArrow />נפתח בקרוב
        </p>
        <div className="ps-3 font-sans text-[15px] font-semibold">
          <Link href="/compare" className={cn('inline-flex min-h-11 items-center', smallLink)}>
            לעמוד ההשוואה
          </Link>
        </div>
      </div>
    </MeSection>
  );
}
