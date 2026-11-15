import Link from 'next/link';
import { SITE_NAME } from '@/lib/site';
import { cn } from '@/lib/utils';
import { LogoMark } from './logo-mark';

/**
 * הלוגו בראש כל עמוד: הסימן (ל מוקפת בעט כחול, logo-mark.tsx) והשם "למדתי" בדיו מודפסת, ב-Plex מודגש.
 * החליף ב-14.11.2026 את תווית המחברת עם השם בכתב יד: "הלוגו לא נראה כמו לוגו", וגל בחר בעיגול בעט.
 * הסימן עומד לבד גם באייקון ובכרטיס השיתוף (lib/logo.ts). "למדתי" הוא מה שאומר מי שכבר למד.
 * בריחוף השם והאות מתכהים לכחול של קישור.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        'logo inline-flex min-h-11 items-center gap-2 text-ink transition-colors duration-150 hover:text-link-hover lg:gap-2.5',
        className,
      )}
    >
      <LogoMark className="size-[34px] lg:size-10" />
      <span className="text-[25px] leading-none font-bold tracking-[-0.015em] lg:text-[29px]">{SITE_NAME}</span>
    </Link>
  );
}
