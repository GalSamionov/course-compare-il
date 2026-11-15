'use client';

import { useSyncExternalStore } from 'react';
import { whatsappHref } from '@/lib/og/share-text';
import { cn } from '@/lib/utils';

/** שיתוף של המערכת: רק בטלפון (מסך מגע), ורק כשהדפדפן תומך. במחשב נשאר וואטסאפ בלבד. */
function canShareNatively(): boolean {
  return typeof navigator.share === 'function' && window.matchMedia('(pointer: coarse)').matches;
}
const noSubscribe = () => () => {};

/** קישור בדיו, כמו שאר הקישורים בטקסט: בלי לוגו, בלי אייקון ובלי צל. יעד מגע של 44 פיקסלים, כמו "לשמור". */
const linkClass =
  'inline-flex min-h-11 items-center font-sans text-[15px] font-semibold underline decoration-1 underline-offset-[3px] transition-colors duration-150 hover:text-link-hover';

/**
 * "לשלוח בוואטסאפ": קישור ל-wa.me עם ההודעה של קישור משותף והכתובת. וואטסאפ הוא ברירת המחדל,
 * כי שם שואלים על קורסים (PRODUCT.md). בטלפון שתומך בשיתוף של המערכת יש גם "שיתוף אחר".
 * false בשרת ובהידרציה, ומיד אחר כך הערך האמיתי: כך ה-HTML והדפדפן מסכימים.
 */
export function ShareLinks({ text, url, className }: { text: string; url: string; className?: string }) {
  const native = useSyncExternalStore(noSubscribe, canShareNatively, () => false);

  async function share() {
    try {
      await navigator.share({ text, url });
    } catch {
      // המבקר סגר את חלון השיתוף, או שהדפדפן חסם. אין מה לעשות.
    }
  }

  return (
    <span className={cn('inline-flex flex-wrap items-center gap-x-3.5', className)}>
      <a href={whatsappHref(text, url)} target="_blank" rel="noopener noreferrer" className={linkClass}>
        לשלוח בוואטסאפ<span className="sr-only"> (נפתח בחלון חדש)</span>
      </a>
      {native && (
        <button type="button" onClick={() => void share()} className={cn(linkClass, 'cursor-pointer')}>
          שיתוף אחר
        </button>
      )}
    </span>
  );
}
