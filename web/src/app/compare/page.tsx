import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CompareFromUrl } from '@/components/compare/compare-from-url';
import { SourceLegend } from '@/components/course/source-legend';
import { Sheet } from '@/components/site/sheet';
import { getCompareCourses } from '@/lib/data/compare';
import { SITE_NAME, SITE_URL } from '@/lib/site';

/**
 * העמוד סטטי: הנתונים של כל הקורסים מהמטמון, והכתובת והמגש נקראים בדפדפן, בתוך <Suspense>.
 * קריאה של searchParams בשרת אסורה עם 'navigation' (ensureStatic.md), וזה גם לא נחוץ.
 */
export const ensureStatic = 'navigation';

export const metadata: Metadata = {
  title: `השוואה | ${SITE_NAME}`,
  description: 'עד שלושה קורסים זה לצד זה, באותו סימון מקור כמו בעמוד הקורס. אף מוכר לא משלם לנו.',
};

export default async function ComparePage() {
  const courses = await getCompareCourses();
  return (
    <Sheet>
      <main>
        <h1 className="mt-[22px] text-[30px] leading-tight font-bold text-balance lg:mt-12 lg:text-[54px] lg:leading-[1.06]">
          השוואה
        </h1>
        <p className="mt-2 max-w-[60ch] font-sans text-[15px] leading-normal text-ink-soft lg:mt-3 lg:text-lg">
          עד שלושה קורסים זה לצד זה, שורה לכל עובדה ולכל שאלה. בכל תא אותו סימון כמו בעמוד הקורס.
        </p>
        <SourceLegend variant="inline" />
        <Suspense
          fallback={
            <p role="status" className="mt-6 font-sans text-[15px] text-ink-soft">
              טוענים את ההשוואה
            </p>
          }
        >
          <CompareFromUrl courses={courses} siteUrl={SITE_URL} />
        </Suspense>
      </main>
    </Sheet>
  );
}
