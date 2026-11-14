import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * שם האתר כתווית על כריכה של מחברת: מסגרת כפולה בדיו עם פינות קעורות (globals.css, .label-frame).
 * המסגרת נמתחת לפי אורך השם, ולכן מתאימה גם ל-[שם האתר] וגם לשם עברי קצר בעתיד.
 * בדיו שחורה בלבד: צבעי המקורות לא משמשים למותג.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        'label-frame inline-flex min-h-11 items-center bg-white px-2 font-serif text-[19px] leading-none font-extrabold tracking-[-0.01em] text-ink',
        'hover:text-link-hover lg:px-3 lg:text-[23px]',
        className,
      )}
    >
      [שם האתר]
    </Link>
  );
}
