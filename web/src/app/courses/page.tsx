import type { Metadata } from 'next';
import { NotebookPage } from '@/components/notebook/notebook-page';
import { SubjectsToc } from '@/components/site/subjects-toc';
import { getCatalog } from '@/lib/data/catalog';
import { EMPTY_QUERY } from '@/lib/search/types';
import { SITE_NAME } from '@/lib/site';

export const ensureStatic = 'navigation';

export const metadata: Metadata = {
  title: `כל הקורסים | ${SITE_NAME}`,
  alternates: { canonical: '/courses' },
  description: 'כל הקורסים באתר: מה כל מוסד מפרסם ומה הוא לא כותב, ומה לשאול לפני שמשלמים. אף מוכר לא משלם לנו.',
};

/**
 * אותה מחברת כמו בדף הבית, בלי אף שורה ממולאת, והרשימה המלאה מתחת.
 * בלי ספירה של כל הקורסים ובלי "עוד אין ציון" (מסמך העיצוב 2026-11-17, עיקרון 4): מספר מופיע רק כשהוא עוזר לבחור.
 */
export default async function CoursesPage() {
  const catalog = await getCatalog();
  return (
    <NotebookPage
      catalog={catalog}
      base={EMPTY_QUERY}
      fixedWhat={false}
      alwaysShowResults
      heading="כל הקורסים"
      intro="כל הקורסים באתר. אפשר לצמצם בארבע השורות."
      after={<SubjectsToc categories={catalog.categories} heading="לפי תחום" className="lg:max-w-[620px]" />}
    />
  );
}
