import type { CSSProperties } from 'react';
import { Tape } from '@/components/course/marks';
import { type GuideRef, sectionLabel, shortSourceName } from '@/lib/guides/guides';
import { cn } from '@/lib/utils';

/** איקס בעט, לסגירת הכרטיס. אותו קו כמו בכרטיס ההיכרות (first-visit.tsx). */
function PenCross() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-[16px] overflow-visible">
      <path d="M5 5.6C9.4 9.8 13.6 14.2 18.8 18.6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M18.6 5.2C14.4 9.4 9.6 14 5.2 18.8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * הכרטיס של המקור: כרטיס לבן מודבק בסלוטייפ, כמו מקרא הסימונים (popover של הדפדפן, בלי JavaScript).
 * בנייד, ובדפדפן שלא יודע למקם לפי עוגן: בתחתית המסך, ברוחב הדף.
 * במחשב, כשהדפדפן יודע: מעל המספר שנלחץ, כך שהעין לא עוזבת את השורה.
 * כשהוא נפתח הוא יורד מעט ונלחץ, כמו פתק.
 * Tailwind ולא CSS module: כלל ה-CSS של turbopack ב-next.config הופך כל קובץ CSS לגלובלי.
 */
const CARD = cn(
  'fixed inset-auto inset-x-4 bottom-4 m-0 mx-auto h-auto w-auto max-w-[420px] overflow-visible border-0 bg-white px-[18px] pt-[22px] pb-3',
  'font-sans text-[14px] leading-normal text-ink -rotate-[0.6deg] backdrop:bg-transparent',
  'shadow-[0_0_0_1px_rgb(0_0_0/0.05),0_1px_2px_rgb(0_0_0/0.16),0_12px_22px_-12px_rgb(0_0_0/0.45),0_26px_40px_-24px_rgb(0_0_0/0.4)]',
  'lg:supports-[position-area:top]:[position-anchor:var(--anchor)] lg:supports-[position-area:top]:[position-area:top]',
  'lg:supports-[position-area:top]:[position-try-fallbacks:flip-block] lg:supports-[position-area:top]:inset-auto',
  'lg:supports-[position-area:top]:m-0 lg:supports-[position-area:top]:mb-3.5 lg:supports-[position-area:top]:w-[340px]',
  'lg:supports-[position-area:top]:max-w-none lg:supports-[position-area:top]:rotate-[0.8deg]',
  'motion-safe:transition-[opacity,translate,scale] motion-safe:duration-[260ms] motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)]',
  'motion-safe:starting:open:-translate-y-2.5 motion-safe:starting:open:scale-[1.03] motion-safe:starting:open:opacity-0',
);

/**
 * המספר של המקור אחרי עובדה ירוקה. הקשה פותחת כרטיס עם שם המקור, הסעיף, קישור ותאריך הבדיקה,
 * בלי לעזוב את המקום בטקסט (גל בחר ב-15.11.2026). ה-popover של הדפדפן: נסגר בהקשה מחוץ לכרטיס או ב-Esc.
 * המספר מודפס בדיו ולא בעט: הוא הפניה של המסמך, לא הערה של האתר.
 * רכיב שורה (span ו-button): יושב בתוך הפסקה, מיד אחרי המרקר.
 */
export function SourceRef({ refData }: { refData: GuideRef }) {
  const id = `source-ref-${refData.index + 1}`;
  const anchor = { '--anchor': `--${id}` } as CSSProperties;
  const [first] = refData.sources;
  const label = refData.sources
    .map((s) => `מקור ${s.n}: ${shortSourceName(s.title)}${s === first && refData.sec ? `, ${sectionLabel(refData.sec)}` : ''}`)
    .join('; ');
  return (
    <>
      <button
        type="button"
        popoverTarget={id}
        aria-label={label}
        style={anchor}
        className={cn(
          // העוגן של הכרטיס במחשב. המספר של הכרטיס הפתוח עובר לעט: זה המקום שהכרטיס מדבר עליו.
          '[anchor-name:var(--anchor)] has-[+:popover-open]:text-pen has-[+:popover-open]:[&>span]:border-pen',
          // המספר קטן ומורם מעט, אבל יעד המגע שלו רחב (after): בנייד מקישים עליו באצבע.
          'relative ms-1 inline-flex -translate-y-[0.35em] gap-0.5 font-sans text-[11px] leading-none font-semibold text-ink-soft tabular-nums lg:text-[12px]',
          'cursor-pointer transition-colors duration-150 hover:text-link-hover hover:[&>span]:border-link-hover',
          "after:absolute after:-inset-x-2 after:-inset-y-3 after:content-['']",
        )}
      >
        {/* כל מקור בתיבה משלו, מהקטן לגדול: "2" ו-"4" ולא "2,4", שנקרא כמו מספר עשרוני. */}
        {refData.sources
          .map((s) => s.n)
          .sort((a, b) => a - b)
          .map((n) => (
            <span
              key={n}
              className="inline-flex h-[1.5em] min-w-[1.5em] items-center justify-center rounded-[2px] border border-ink-soft/45 px-[0.3em] transition-colors duration-150"
            >
              {n}
            </span>
          ))}
      </button>
      <span id={id} popover="auto" style={anchor} className={CARD}>
        <Tape width={70} tilt={-3} />
        {refData.sources.map((s, i) => (
          <span key={s.id} className={cn('block pe-8', i > 0 && 'mt-3 border-t border-rule pt-3')}>
            <span className="block font-bold text-pretty">
              <span className="tabular-nums">{s.n}.</span> {s.title}
            </span>
            {s === first && refData.sec && <span className="mt-0.5 block">{sectionLabel(refData.sec)}</span>}
            <span className="flex flex-wrap items-center gap-x-4 text-ink-soft">
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center font-semibold text-ink underline decoration-1 underline-offset-[3px] hover:text-link-hover"
              >
                לפתוח את המקור<span className="sr-only"> (בחלון חדש)</span>
              </a>
              {s.checked && <span>נבדק ב-{s.checked}</span>}
            </span>
          </span>
        ))}
        <button
          type="button"
          popoverTarget={id}
          popoverTargetAction="hide"
          aria-label="לסגור את המקור"
          className="absolute end-0.5 top-0.5 inline-flex size-11 cursor-pointer items-center justify-center text-pen hover:text-link-hover"
        >
          <PenCross />
        </button>
      </span>
    </>
  );
}
