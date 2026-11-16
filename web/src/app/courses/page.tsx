import type { Metadata } from 'next';
import { PenNote } from '@/components/course/marks';
import { NotebookPage } from '@/components/notebook/notebook-page';
import { SubjectsToc } from '@/components/site/subjects-toc';
import { getCatalog } from '@/lib/data/catalog';
import { EMPTY_QUERY } from '@/lib/search/types';
import { SITE_NAME } from '@/lib/site';

export const ensureStatic = 'navigation';

/** "ל-3 מהם כבר יש ציון בוגרים", עם הדקדוק של אחד ושל אפס. */
function scoredText(n: number): string {
  if (n === 0) return 'לאף אחד מהם עוד אין ציון בוגרים.';
  if (n === 1) return 'לאחד מהם כבר יש ציון בוגרים.';
  return `ל-${n} מהם כבר יש ציון בוגרים.`;
}

export const metadata: Metadata = {
  title: `כל הקורסים | ${SITE_NAME}`,
  alternates: { canonical: '/courses' },
  description: 'כל הקורסים באתר, לפי ציון של בוגרים מאומתים בלבד. אף מוכר לא משלם לנו.',
};

/** אותה מחברת כמו בדף הבית, בלי אף שורה ממולאת, והרשימה המלאה מתחת. */
export default async function CoursesPage() {
  const catalog = await getCatalog();
  const subjects = catalog.categories.filter((c) => c.isLeaf && c.courseCount > 0).length;
  const scored = catalog.courses.filter((c) => c.score.status === 'scored').length;
  return (
    <NotebookPage
      catalog={catalog}
      base={EMPTY_QUERY}
      fixedWhat={false}
      alwaysShowResults
      heading="כל הקורסים"
      intro="כל הקורסים באתר, לפי ציון הבוגרים. אפשר לצמצם בארבע השורות."
      headSide={
        <PenNote arrow className="text-base font-medium lg:text-lg">
          {catalog.courses.length} קורסים ב-{subjects} תחומים. {scoredText(scored)}
        </PenNote>
      }
      after={<SubjectsToc categories={catalog.categories} heading="לפי תחום" className="lg:max-w-[620px]" />}
    />
  );
}
