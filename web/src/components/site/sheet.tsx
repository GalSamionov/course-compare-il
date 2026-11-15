import { cn } from '@/lib/utils';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';

/**
 * הדף: נייר מודפס לבן. בנייד הוא ממלא את המסך. מ-1024 פיקסלים הוא מונח על שולחן בהיר,
 * עם דף נוסף מתחתיו (globals.css, .sheet). בלי תפס: דף בתפס על משטח כהה נקרא כמו תפריט של מסעדה.
 * narrow: לעמודי טקסט, שבהם עמודת קריאה אחת.
 */
export function Sheet({
  narrow = false,
  className,
  children,
}: {
  narrow?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('mx-auto w-full lg:w-[calc(100%-64px)]', narrow ? 'lg:max-w-[960px]' : 'lg:max-w-[1184px]')}>
      <div className={cn('sheet px-(--sheet-pad)', className)}>
        <SiteHeader />
        {children}
        <SiteFooter />
      </div>
    </div>
  );
}
