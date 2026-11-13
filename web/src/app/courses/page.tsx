import type { Metadata } from 'next';
import { Results, allCoursesTitle } from '@/components/notebook/results';
import { SiteFooter } from '@/components/site/site-footer';
import { SiteHeader } from '@/components/site/site-header';
import { SubjectsToc } from '@/components/site/subjects-toc';
import { getCatalog } from '@/lib/data/catalog';
import { matchCourses } from '@/lib/search/match';
import { EMPTY_QUERY } from '@/lib/search/types';

export const ensureStatic = 'navigation';

export const metadata: Metadata = {
  title: 'כל הקורסים | [שם האתר]',
  description: 'כל הקורסים באתר, לפי ציון של בוגרים מאומתים בלבד. אף מוכר לא משלם לנו.',
};

export default async function CoursesPage() {
  const catalog = await getCatalog();
  const results = matchCourses(catalog.courses, EMPTY_QUERY);
  return (
    <div className="mx-auto max-w-[680px] px-[22px]">
      <SiteHeader />
      <main>
        <h1 className="mt-[22px] text-[30px] leading-tight font-bold text-balance">כל הקורסים</h1>
        <p className="mt-2 font-sans text-[15px] leading-normal text-ink-soft">כל הקורסים באתר, לפי ציון הבוגרים.</p>
        <Results heading={allCoursesTitle(results.length)} results={results} />
        <SubjectsToc categories={catalog.categories} heading="לפי תחום" />
      </main>
      <SiteFooter />
    </div>
  );
}
