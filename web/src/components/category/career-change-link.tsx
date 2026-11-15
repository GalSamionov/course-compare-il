import Link from 'next/link';
import { PenArrow } from '@/components/site/pen';
import { cn } from '@/lib/utils';

/**
 * בעמוד של תחום בהייטק: קישור לעמוד "הסבה להייטק", עם הקורסים הארוכים, מה ששולם בפועל ומה לשאול לפני שמשלמים.
 * אותה מסגרת שקטה כמו המסלולים המשניים בדף הבית (secondary-paths.tsx): קו מחברת, ובריחוף העט.
 */
export function CareerChangeLink({ className }: { className?: string }) {
  return (
    <Link
      href="/career-change"
      className={cn(
        'group relative flex min-h-11 items-center gap-2.5 rounded-[4px] border border-ruled bg-white px-3 py-2 font-sans',
        'text-[14px] leading-snug text-ink lg:text-[15px]',
        'transition-[color,border-color] duration-150 hover:border-pen hover:text-link-hover focus-visible:border-pen',
        'active:translate-y-px',
        className,
      )}
    >
      <span className="min-w-0 flex-1 text-pretty">
        <strong>שוקלים הסבה להייטק?</strong> הקורסים הארוכים, כמה שילמו בפועל, ומה לשאול לפני שמשלמים
      </span>
      <PenArrow className="me-0 h-[0.7em] w-[1.3em] flex-none text-ink-soft transition-[translate,color] duration-200 group-hover:text-pen motion-safe:group-hover:-translate-x-1" />
    </Link>
  );
}
