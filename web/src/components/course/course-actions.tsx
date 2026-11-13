import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * כתיבת ביקורת נבנית בתוכנית 2, והשוואה בתוכנית 4.
 * ה-Button של shadcn בנוי על Base UI ואין לו asChild, ולכן הקישורים מקבלים את המחלקות של הכפתור.
 */
export function CourseActions({ slug }: { slug: string }) {
  return (
    <div className="mt-6 flex gap-2.5 font-sans">
      <Link href={`/courses/${slug}/review`} className={cn(buttonVariants(), 'h-[50px] flex-1 text-base font-bold')}>
        כתיבת ביקורת
      </Link>
      <Link
        href={`/compare?add=${slug}`}
        className={cn(
          buttonVariants({ variant: 'outline' }),
          'h-[50px] flex-1 border-[1.5px] border-ink text-base font-bold',
        )}
      >
        להשוואה (עד 3)
      </Link>
    </div>
  );
}
