import type { Metadata } from 'next';
import { NotebookPage } from '@/components/notebook/notebook-page';
import { SubjectsToc } from '@/components/site/subjects-toc';
import { getCatalog } from '@/lib/data/catalog';
import { EMPTY_QUERY } from '@/lib/search/types';

export const ensureStatic = 'navigation';

export const metadata: Metadata = {
  title: 'כל הקורסים | [שם האתר]',
  description: 'כל הקורסים באתר, לפי ציון של בוגרים מאומתים בלבד. אף מוכר לא משלם לנו.',
};

/** אותה מחברת כמו בדף הבית, בלי אף שורה ממולאת, והרשימה המלאה מתחת. */
export default async function CoursesPage() {
  const catalog = await getCatalog();
  return (
    <NotebookPage
      catalog={catalog}
      base={EMPTY_QUERY}
      fixedWhat={false}
      alwaysShowResults
      heading="כל הקורסים"
      intro="כל הקורסים באתר, לפי ציון הבוגרים. אפשר לצמצם בארבע השורות."
      after={<SubjectsToc categories={catalog.categories} heading="לפי תחום" />}
    />
  );
}
