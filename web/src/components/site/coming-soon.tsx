import Link from 'next/link';
import { PenNote } from '@/components/course/marks';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';

/** עמוד של חלק שעוד לא נבנה: כותרת, ושורה אחת בעט שמסבירה מה יהיה כאן. */
export function ComingSoon({ title, line }: { title: string; line: string }) {
  return (
    <div className="mx-auto max-w-[680px] px-[22px]">
      <SiteHeader />
      <main className="pt-[22px] pb-6">
        <h1 className="text-[30px] leading-tight font-bold text-balance">{title}</h1>
        <PenNote className="mt-4 max-w-[34ch] text-lg">← בקרוב: {line}</PenNote>
        <p className="mt-6 font-sans text-[15px]">
          <Link href="/" className="underline underline-offset-[3px] hover:text-link-hover">
            לדף הבית
          </Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
