import { cn } from '@/lib/utils';

/**
 * שם המוסד כחותמת דיו על הסיכום: מסגרת כפולה, מוטה מעט, עם כתמים שחסרים בהטבעה (globals.css, .stamp).
 * בדיו כהה ולא בכחול של המוסד: שם המוסד הוא עובדה, לא טענה שלו.
 */
export function Stamp({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'stamp inline-block -rotate-2 rounded-[3px] border-[2.5px] border-double border-ink/85 px-2.5 py-1 font-sans text-[15px] leading-none font-bold tracking-[0.02em] text-ink/85 lg:px-3.5 lg:py-1.5 lg:text-lg',
        className,
      )}
    >
      {children}
    </span>
  );
}
