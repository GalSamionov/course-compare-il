'use client';

import { useState, useSyncExternalStore } from 'react';
import { TickMark } from '@/components/notebook/tick';
import { helpfulSnapshot, parseIds, subscribeHelpful, toggleHelpful } from '@/lib/reviews/helpful';
import { cn } from '@/lib/utils';

const markedText = (n: number) => (n === 1 ? 'אדם אחד סימן' : `${n} סימנו`);

/**
 * "עזר לי": כל מבקר, פעם אחת לכל דפדפן, ולחיצה שנייה מבטלת (מסמך העיצוב, סעיף 6).
 * פקד ולא קול של בוגר, ולכן מחוץ לפתק: בגופן המודפס, עם הריבוע והווי בעט, כמו ChoiceChip.
 * הכרה לכותב ולא דירוג: המספר לא משנה את סדר הביקורות, ואין לו ניסוח של ניקוד.
 * המספר הראשוני מהמטמון של העמוד, ואחרי לחיצה מהשרת.
 * בזמן השמירה הכפתור לא מושבת אלא מתעלם מלחיצות, כדי שהפוקוס לא יברח ממנו.
 */
export function HelpfulButton({ reviewId, count }: { reviewId: string; count: number }) {
  const raw = useSyncExternalStore(subscribeHelpful, helpfulSnapshot, () => '');
  const marked = parseIds(raw).includes(reviewId);
  const [total, setTotal] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function onClick() {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    const result = await toggleHelpful(reviewId);
    setBusy(false);
    if (result) setTotal(result.total);
    else setFailed(true);
  }

  // המספר מהמטמון של העמוד יכול לפגר. מי שכבר סימן בדפדפן הזה יודע שיש לפחות אחד, ולא רואה "סימנתי, ואין מספר".
  const shown = total ?? (marked ? Math.max(count, 1) : count);
  return (
    <div className="flex flex-wrap items-center gap-x-3 font-sans">
      <button
        type="button"
        aria-pressed={marked}
        aria-busy={busy}
        onClick={() => void onClick()}
        className={cn(
          'group inline-flex h-11 items-center gap-2 text-sm text-ink hover:text-link-hover',
          marked ? 'font-bold' : 'font-semibold',
          busy && 'cursor-wait',
        )}
      >
        <span
          aria-hidden="true"
          className="relative size-4 flex-none rounded-[2px] border-[1.5px] border-ink transition-colors group-hover:border-pen"
        >
          {marked && <TickMark strokeWidth={2.6} className="absolute -top-[9px] -left-0.5 size-[23px]" />}
        </span>
        עזר לי
        {shown > 0 && (
          <>
            <span aria-hidden="true" className="font-normal text-ink-soft tabular-nums">
              · {shown}
            </span>
            <span className="sr-only">, {markedText(shown)}</span>
          </>
        )}
      </button>
      {failed && (
        <p role="status" className="text-[13px] text-ink-soft">
          לא נשמר. נסו שוב.
        </p>
      )}
    </div>
  );
}
