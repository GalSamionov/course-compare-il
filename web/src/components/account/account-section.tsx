'use client';

import { useEffect, useRef, useState } from 'react';
import { buttonVariants } from '@/components/ui/button';
import { deleteAccount, signOut } from '@/lib/account/store';
import { cn } from '@/lib/utils';
import { MeSection, textButton } from './me-section';

/**
 * "החשבון": המייל, התנתקות, ומחיקת החשבון עם שלב אישור בתוך העמוד.
 * onLeave נקרא לפני שההתחברות נמחקת, כדי שהאזור לא ישלח להתחברות אלא יראה מה קרה.
 */
export function AccountSection({
  email,
  onLeave,
}: {
  email: string;
  onLeave: (reason: 'signed-out' | 'deleted') => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const question = useRef<HTMLParagraphElement>(null);

  // שלב האישור נפתח: הפוקוס עובר לשאלה, כדי שקורא מסך יקרא אותה.
  useEffect(() => {
    if (confirming) question.current?.focus();
  }, [confirming]);

  async function onSignOut() {
    setBusy(true);
    onLeave('signed-out');
    if ((await signOut()) !== 'ok') {
      setBusy(false);
      setError('לא הצלחנו לנתק. נסו שוב.');
    }
  }

  async function onDelete() {
    setBusy(true);
    setError(null);
    if ((await deleteAccount()) === 'ok') {
      // קודם מודיעים לאזור, ורק אז מנתקים: אחרת ההתנתקות הייתה שולחת להתחברות.
      onLeave('deleted');
      await signOut('local');
      return;
    }
    setBusy(false);
    setError('לא הצלחנו למחוק את החשבון. לא נמחק כלום. נסו שוב בעוד כמה דקות.');
  }

  return (
    <MeSection id="account" title="החשבון" className="mt-[34px]">
      <div className="mt-3 grid min-h-[54px] grid-cols-[70px_minmax(0,1fr)] items-center border-y border-line">
        <span className="font-sans text-[13px] leading-tight text-ink-soft">מחוברים עם</span>
        <p dir="ltr" className="pr-3 text-right font-sans text-base leading-snug font-semibold">
          {email}
        </p>
      </div>
      <div className="ms-[70px] ps-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => void onSignOut()}
          className={cn(
            buttonVariants({ variant: 'outline' }),
            'mt-4 h-[50px] w-full border-[1.5px] border-ink font-sans text-base font-bold',
          )}
        >
          להתנתק
        </button>
        {confirming ? (
          <div role="group" aria-labelledby="delete-question" className="mt-3.5 border-t-2 border-ink pt-3 font-sans">
            <p id="delete-question" ref={question} tabIndex={-1} className="text-[15px] font-bold outline-none">
              למחוק את החשבון לצמיתות?
            </p>
            <p className="mt-1 text-[13px] leading-normal text-pretty text-ink-soft">
              המייל, הקורסים ששמרתם, ההשוואה והתשובות יימחקו עכשיו. אי אפשר לבטל את זה.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void onDelete()}
                className={cn(buttonVariants(), 'h-[50px] px-4 text-base font-bold')}
              >
                {busy ? 'מוחקים…' : 'כן, למחוק הכול'}
              </button>
              <button type="button" disabled={busy} onClick={() => setConfirming(false)} className={textButton}>
                לא, להשאיר
              </button>
            </div>
          </div>
        ) : (
          <>
            <button type="button" onClick={() => setConfirming(true)} className={cn(textButton, 'mt-3.5 px-0 font-bold')}>
              למחוק את החשבון
            </button>
            <p className="font-sans text-[13px] leading-normal text-pretty text-ink-soft">
              מוחק לצמיתות את המייל, הקורסים ששמרתם, ההשוואה והתשובות. אי אפשר לשחזר אותם.
            </p>
          </>
        )}
        {error && (
          <p role="alert" className="mt-2 font-sans text-[15px] font-bold">
            {error}
          </p>
        )}
      </div>
    </MeSection>
  );
}
