import { cn } from '@/lib/utils';

/** הערה של האתר בשוליים: עט, עם חץ, מוטה (מסמך העיצוב, סעיף 8). */
export const marginNote = '-rotate-3 pe-1.5 font-pen text-sm leading-snug font-medium text-pen';
/** כפתור שנראה כמו קישור, בגובה 44. */
export const textButton =
  'inline-flex h-11 items-center px-1 font-sans text-[15px] font-semibold underline underline-offset-[3px] hover:text-link-hover';

/** חלק באזור האישי: כותרת עם קו קצר מתחתיה ושורת הסבר, מימין לקו השוליים, כמו בציור (Me.dc.html). */
export function MeSection({
  id,
  title,
  sub,
  className,
  children,
}: {
  id: string;
  title: string;
  sub?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className={cn('scroll-mt-4', className)}>
      <div className="ms-[70px] ps-3">
        <h2 id={`${id}-h`} className="inline-block border-b-2 border-ink pb-0.5 text-[21px] leading-snug font-bold">
          {title}
        </h2>
        {sub && <p className="mt-2 font-sans text-[13px] leading-normal text-ink-soft">{sub}</p>}
      </div>
      {children}
    </section>
  );
}
