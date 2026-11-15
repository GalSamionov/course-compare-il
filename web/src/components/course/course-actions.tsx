'use client';

import Link from 'next/link';
import { useState } from 'react';
import { SaveButton } from '@/components/account/save-button';
import { PenNote } from '@/components/course/marks';
import { TickMark } from '@/components/notebook/tick';
import { buttonVariants } from '@/components/ui/button';
import { toggleCompare, useAccount } from '@/lib/account/store';
import { cn } from '@/lib/utils';
import { ShareLinks } from './share-links';

type Note = 'added-local' | 'added' | 'full' | 'error' | null;

/** הקישור לעמוד ההשוואה בהערה: בשורה משלו, עם יעד מגע של 44 פיקסלים. */
const compareLink =
  'inline-flex min-h-11 items-center underline decoration-1 underline-offset-[3px] transition-colors duration-150 hover:text-link-hover';

/**
 * שני הכפתורים מהציור (Chosen.dc.html), ומתחתם "לשמור".
 * "להשוואה" הוא הכפתור הראשי, כי הוא עובד היום: מכניס את הקורס להשוואה או מוציא אותו.
 * מבקר לא מחובר: ההשוואה נשמרת בדפדפן.
 * "כתיבת ביקורת" הוא כפתור משני, ומוביל למסלול הכתיבה (סבב 3).
 * ה-Button של shadcn בנוי על Base UI ואין לו asChild, ולכן הקישור מקבל את המחלקות של הכפתור.
 */
export function CourseActions({
  courseId,
  slug,
  title,
  share,
  stacked = false,
}: {
  courseId: string;
  slug: string;
  title: string;
  /** "לשלוח בוואטסאפ": ההודעה והכתובת, מהשרת (share-text.ts). */
  share?: { text: string; url: string };
  /** בעמודה הצדדית במחשב: הכפתורים זה מתחת לזה. */
  stacked?: boolean;
}) {
  const account = useAccount();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<Note>(null);
  const inCompare =
    (account.status === 'signed-in' && account.compare.some((slot) => slot.courseId === courseId)) ||
    (account.status === 'signed-out' && account.compare.includes(courseId));

  async function onCompare() {
    if (account.status !== 'signed-in' && account.status !== 'signed-out') return;
    const adding = !inCompare;
    setBusy(true);
    const result = await toggleCompare(courseId);
    setBusy(false);
    if (result !== 'ok') setNote(result);
    else if (!adding) setNote(null);
    else setNote(account.status === 'signed-out' ? 'added-local' : 'added');
  }

  return (
    <div className={cn('mt-6 font-sans', stacked && 'mt-9')}>
      <div className={cn('flex gap-2.5', stacked && 'flex-col gap-3')}>
        {/* הפעולה הראשית היא מה שעובד היום: להוסיף להשוואה. הריבוע מסמן שהקורס כבר בפנים. */}
        <button
          type="button"
          role="checkbox"
          aria-checked={inCompare}
          disabled={busy}
          onClick={() => void onCompare()}
          className={cn(
            buttonVariants(),
            'h-[50px] flex-1 gap-2.5 text-base font-bold',
            stacked && 'flex-none',
            busy && 'cursor-wait',
          )}
        >
          <span aria-hidden="true" className="relative size-4 flex-none rounded-[2px] border-[1.5px] border-white/90">
            {inCompare && <TickMark strokeWidth={2.6} className="absolute -top-[9px] -left-0.5 size-[23px] text-white" />}
          </span>
          להשוואה (עד 3)
        </button>
        <Link
          href={`/courses/${slug}/review`}
          className={cn(
            buttonVariants({ variant: 'outline' }),
            'h-[50px] flex-1 border-[1.5px] border-ink text-base font-bold',
            stacked && 'flex-none',
          )}
        >
          כתיבת ביקורת
        </Link>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-3.5 gap-y-2">
        <SaveButton courseId={courseId} title={title} />
        {share && <ShareLinks text={share.text} url={share.url} />}
      </div>
      <div role="status">
        {note === 'added-local' && (
          <PenNote arrow className="mt-2.5">
            נוסף להשוואה. היא נשמרת בדפדפן הזה, ואחרי התחברות תעבור לאזור שלכם.
            <br />
            <Link href="/compare" className={compareLink}>
              לעמוד ההשוואה
            </Link>
          </PenNote>
        )}
        {note === 'added' && (
          <PenNote arrow className="mt-2.5">
            נוסף להשוואה ולשמורים.
            <br />
            <Link href="/compare" className={compareLink}>
              לעמוד ההשוואה
            </Link>
          </PenNote>
        )}
        {note === 'full' && (
          <PenNote arrow className="mt-2.5">
            בהשוואה כבר יש 3 קורסים.
            <br />
            <Link href="/compare" className={compareLink}>
              להוציא אחד בעמוד ההשוואה
            </Link>
          </PenNote>
        )}
        {note === 'error' && <p className="mt-2.5 text-[13px] text-ink-soft">לא הצלחנו לעדכן את ההשוואה. נסו שוב.</p>}
      </div>
    </div>
  );
}
