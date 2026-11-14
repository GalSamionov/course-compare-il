import Link from 'next/link';
import { SITE_NAME } from '@/lib/site';
import { cn } from '@/lib/utils';

/**
 * שם האתר על תווית של כריכת מחברת. התווית מודפסת בדיו: מסגרת כפולה עם פינות קעורות (globals.css, .label-frame).
 * השם כתוב בה ביד, בעט הכחול של האתר, כמו שתלמיד כותב את שמו על המחברת. "למדתי" הוא מה שאומר מי שכבר למד.
 * העט כאן בולט מעט יותר משאר הערות העט (600 ולא 500), כדי שהשם יחזיק מול המסגרת השחורה גם בגודל של נייד.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        'label-frame inline-flex min-h-11 items-center bg-white px-2.5 font-pen text-[24px] leading-none font-semibold text-pen',
        'hover:text-link-hover lg:px-3.5 lg:text-[30px]',
        className,
      )}
    >
      <span className="-rotate-1">{SITE_NAME}</span>
    </Link>
  );
}
