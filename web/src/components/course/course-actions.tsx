'use client';

import Link from 'next/link';
import { useState } from 'react';
import { SaveButton } from '@/components/account/save-button';
import { PenNote } from '@/components/course/marks';
import { TickMark } from '@/components/notebook/tick';
import { buttonVariants } from '@/components/ui/button';
import { toggleCompare, useAccount } from '@/lib/account/store';
import { cn } from '@/lib/utils';

type Note = 'added-local' | 'added' | 'full' | 'error' | null;

/**
 * שני הכפתורים מהציור (Chosen.dc.html), ומתחתם "לשמור".
 * כתיבת ביקורת נבנית בסבב 3, ועד אז מובילה לעמוד "בקרוב".
 * "להשוואה" מכניס את הקורס להשוואה או מוציא אותו. מבקר לא מחובר: ההשוואה נשמרת בדפדפן.
 * ה-Button של shadcn בנוי על Base UI ואין לו asChild, ולכן הקישור מקבל את המחלקות של הכפתור.
 */
export function CourseActions({ courseId, slug, title }: { courseId: string; slug: string; title: string }) {
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
    <div className="mt-6 font-sans">
      <div className="flex gap-2.5">
        <Link href={`/courses/${slug}/review`} className={cn(buttonVariants(), 'h-[50px] flex-1 text-base font-bold')}>
          כתיבת ביקורת
        </Link>
        <button
          type="button"
          role="checkbox"
          aria-checked={inCompare}
          disabled={busy}
          onClick={() => void onCompare()}
          className={cn(
            buttonVariants({ variant: 'outline' }),
            'h-[50px] flex-1 gap-2 border-[1.5px] border-ink text-base font-bold',
            busy && 'cursor-wait',
          )}
        >
          {inCompare && (
            <span aria-hidden="true" className="relative size-4 flex-none rounded-[2px] border-[1.5px] border-ink">
              <TickMark strokeWidth={2.6} className="absolute -top-[9px] -left-0.5 size-[23px]" />
            </span>
          )}
          להשוואה (עד 3)
        </button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-3.5 gap-y-2">
        <SaveButton courseId={courseId} title={title} />
      </div>
      <div role="status">
        {note === 'added-local' && (
          <PenNote className="mt-2.5">← נוסף להשוואה. היא נשמרת בדפדפן הזה, ואחרי התחברות תעבור לאזור שלכם.</PenNote>
        )}
        {note === 'added' && (
          <PenNote className="mt-2.5">
            ← נוסף להשוואה ולשמורים.{' '}
            <Link href="/me#compare" className="underline underline-offset-[3px]">
              לאזור שלי
            </Link>
          </PenNote>
        )}
        {note === 'full' && (
          <PenNote className="mt-2.5">
            ← בהשוואה כבר יש 3 קורסים.{' '}
            {account.status === 'signed-in' ? (
              <Link href="/me#compare" className="underline underline-offset-[3px]">
                להוציא אחד באזור שלי
              </Link>
            ) : (
              'אפשר להוציא קורס מהעמוד שלו.'
            )}
          </PenNote>
        )}
        {note === 'error' && <p className="mt-2.5 text-[13px] text-ink-soft">לא הצלחנו לעדכן את ההשוואה. נסו שוב.</p>}
      </div>
    </div>
  );
}
