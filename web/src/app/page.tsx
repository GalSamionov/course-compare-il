import type { Metadata } from 'next';
import { ExampleCard } from '@/components/home/example-card';
import { HomeHero } from '@/components/home/home-hero';
import { WhatYouSee } from '@/components/home/what-you-see';
import { NotebookPage } from '@/components/notebook/notebook-page';
import { GraduatesCall } from '@/components/site/graduates-call';
import { SecondaryPaths } from '@/components/site/secondary-paths';
import { SubjectsToc } from '@/components/site/subjects-toc';
import { advisorEnabled } from '@/lib/advisor/enabled';
import { getCatalog } from '@/lib/data/catalog';
import { getCoursePage } from '@/lib/data/course-page';
import { compareCourses } from '@/lib/search/match';
import { EMPTY_QUERY } from '@/lib/search/types';
import { cn } from '@/lib/utils';

/** הכותרת והתיאור מ-layout.tsx. הכתובת הקנונית בלי התשובות שבכתובת (?cat=...), שמשתנות לכל מבקר. */
export const metadata: Metadata = { alternates: { canonical: '/' } };

/** הדף כולו סטטי. התשובות מהכתובת נקראות בדפדפן, ולכן הדף לא נבנה מחדש לכל בקשה. */
export const ensureStatic = 'navigation';

export default async function HomePage() {
  const catalog = await getCatalog();
  // הסיכום לדוגמה: מבין הקורסים עם ציון, זה שהכי הרבה בוגרים מאומתים כתבו עליו (הדוגמה המלאה ביותר),
  // והעמוד שלו מהמטמון. בלי קורס עם ציון, אין דוגמה. הוא מוצג אחרי הרשימה, ליד "מה רואים כאן", ורק במחשב.
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
      whatBox
      advisor={advisorEnabled()}
      hero={<HomeHero />}
      afterForm={<SecondaryPaths />}
      after={
        <>
          {/*
            אחרי הרשימה: "מה רואים כאן" ו"סיימתם קורס?". כשיש קורס עם ציון, במחשב הם זה מתחת לזה מימין,
            והסיכום לדוגמה משמאל, כדי שהמבקר יראה את הסימונים על סיכום אמיתי. הוא כבר לא בפתיחה: שם הוא דחף
            את התיבה אל מתחת למסך הראשון. בנייד הסיכום לא מוצג, כמו קודם.
          */}
          <div
            className={cn(
              'lg:ms-(--margin) lg:grid lg:ps-3',
              example ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1.12fr)] lg:gap-x-20' : 'lg:grid-cols-2 lg:gap-x-16',
            )}
          >
            {example ? (
              <>
                <div>
                  <WhatYouSee example />
                  <GraduatesCall courses={catalog.courses} />
                </div>
                <ExampleCard
                  course={example.course}
                  page={example.page}
                  className="hidden lg:mt-[4.75rem] lg:block lg:self-start"
                />
              </>
            ) : (
              <>
                <WhatYouSee />
                <GraduatesCall courses={catalog.courses} />
              </>
            )}
          </div>
          <SubjectsToc categories={catalog.categories} />
        </>
      }
    />
  );
}
