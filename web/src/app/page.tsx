import { HomeHero } from '@/components/home/home-hero';
import { NotebookPage } from '@/components/notebook/notebook-page';
import { GraduatesCall } from '@/components/site/graduates-call';
import { SecondaryPaths } from '@/components/site/secondary-paths';
import { SubjectsToc } from '@/components/site/subjects-toc';
import { getCatalog } from '@/lib/data/catalog';
import { getCoursePage } from '@/lib/data/course-page';
import { compareCourses } from '@/lib/search/match';
import { EMPTY_QUERY } from '@/lib/search/types';

/** הדף כולו סטטי. התשובות מהכתובת נקראות בדפדפן, ולכן הדף לא נבנה מחדש לכל בקשה. */
export const ensureStatic = 'navigation';

export default async function HomePage() {
  const catalog = await getCatalog();
  // הסיכום לדוגמה: מבין הקורסים עם ציון, זה שהכי הרבה בוגרים מאומתים כתבו עליו (הדוגמה המלאה ביותר),
  // והעמוד שלו מהמטמון. בלי קורס עם ציון, אין דוגמה.
  const top =
    catalog.courses
      .filter((c) => c.score.status === 'scored')
      .sort((a, b) => b.verifiedCount - a.verifiedCount || compareCourses(a, b))[0] ?? null;
  const example = top ? { course: top, page: await getCoursePage(top.slug) } : null;
  return (
    <NotebookPage
      catalog={catalog}
      base={EMPTY_QUERY}
      fixedWhat={false}
      alwaysShowResults={false}
      saveAnswers
      hero={<HomeHero example={example} />}
      heading="מה אתם רוצים ללמוד, ולמה?"
      headingLevel={2}
      intro="ארבע שורות, ונראה רק קורסים שמתאימים לכם. אפשר לכתוב במילים שלכם."
      afterForm={<SecondaryPaths />}
      after={
        <div className="lg:ms-(--margin) lg:grid lg:grid-cols-2 lg:gap-x-16 lg:ps-3">
          <GraduatesCall courses={catalog.courses} />
          <SubjectsToc categories={catalog.categories} className="lg:ms-0 lg:ps-0" />
        </div>
      }
    />
  );
}
