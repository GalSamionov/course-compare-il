import { NotebookPage } from '@/components/notebook/notebook-page';
import { GraduatesCall } from '@/components/site/graduates-call';
import { SecondaryPaths } from '@/components/site/secondary-paths';
import { SubjectsToc } from '@/components/site/subjects-toc';
import { VerificationSteps } from '@/components/site/verification-steps';
import { getCatalog } from '@/lib/data/catalog';
import { EMPTY_QUERY } from '@/lib/search/types';

/** הדף כולו סטטי. התשובות מהכתובת נקראות בדפדפן, ולכן הדף לא נבנה מחדש לכל בקשה. */
export const ensureStatic = 'navigation';

export default async function HomePage() {
  const catalog = await getCatalog();
  return (
    <NotebookPage
      catalog={catalog}
      base={EMPTY_QUERY}
      fixedWhat={false}
      alwaysShowResults={false}
      saveAnswers
      heading="מה אתם רוצים ללמוד, ולמה?"
      tagline="השוואת קורסים לפי בוגרים שהעלו הוכחה. אף מוכר לא משלם לנו."
      intro="ארבע שורות, ונראה רק קורסים שמתאימים לכם. אפשר לכתוב במילים שלכם."
      afterForm={<SecondaryPaths />}
      after={
        <>
          <GraduatesCall courses={catalog.courses} />
          <SubjectsToc categories={catalog.categories} />
          <VerificationSteps />
        </>
      }
    />
  );
}
