import Link from 'next/link';
import { PenNote } from '@/components/course/marks';
import { Sheet } from './sheet';

/** עמוד של חלק שעוד לא נבנה: כותרת, ושורה אחת בעט שמסבירה מה יהיה כאן. */
export function ComingSoon({ title, line }: { title: string; line: string }) {
  return (
    <Sheet narrow>
      <main id="main" className="pt-[22px] pb-6 lg:pt-12">
        <h1 className="text-[30px] leading-tight font-bold text-balance lg:text-[48px]">{title}</h1>
        <PenNote arrow className="mt-4 max-w-[34ch] text-lg lg:text-xl">
          בקרוב: {line}
        </PenNote>
        <p className="mt-6 font-sans text-[15px]">
          <Link href="/" className="inline-flex min-h-11 items-center underline underline-offset-[3px] hover:text-link-hover">
            לדף הבית
          </Link>
        </p>
      </main>
    </Sheet>
  );
}
