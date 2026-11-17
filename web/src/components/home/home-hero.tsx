import { PenArrow } from '@/components/site/pen';
import type { CoursePageData } from '@/lib/data/course-page';
import type { CourseSummary } from '@/lib/search/types';
import { cn } from '@/lib/utils';
import { ExampleCard } from './example-card';

/**
 * הפתיחה של דף הבית (מסמך העיצוב 2026-11-17): "לא יודעים למי לפנות?" ומשפט אחד, והתיבה מיד אחריהם (notebook.tsx).
 * "איך האימות עובד" ירד. במקומו "מה רואים כאן", אחרי הרשימה (what-you-see.tsx).
 * הסיכום לדוגמה מופיע רק כשיש קורס עם ציון, כמו קודם. במחשב: ההבטחה מימין והסיכום משמאל.
 * בנייד הסיכום לא מוצג: הוא עמד בין הכותרת לתיבה ודחף את התיבה אל מתחת למסך הראשון.
 */
export function HomeHero({ example }: { example: { course: CourseSummary; page: CoursePageData | null } | null }) {
  return (
    <section
      aria-labelledby="promise"
      className={cn('pt-6 lg:pt-11', example && 'lg:grid lg:grid-cols-[minmax(0,1.12fr)_minmax(0,1fr)] lg:gap-x-20')}
    >
      <div className={example ? 'lg:col-start-1 lg:row-start-1' : 'lg:max-w-[880px]'}>
        <h1
          id="promise"
          className="text-[33px] leading-[1.14] font-bold tracking-[-0.01em] text-balance lg:text-[54px] lg:leading-[1.08]"
        >
          לא יודעים למי לפנות? כתבו מה אתם צריכים.
        </h1>
        <p className="mt-4 max-w-[52ch] font-sans text-[17px] leading-normal text-pretty lg:mt-6 lg:text-xl">
          נראה לכם את האפשרויות זו לצד זו, מה כל אחד מפרסם ומה הוא לא כותב, ומה לשאול לפני שמשלמים.
          <strong className="font-bold"> אף מוכר לא משלם לנו.</strong>
        </p>
        {example && (
          <p className="mt-5 hidden font-pen text-lg font-medium text-pen lg:block">
            <PenArrow />
            ככה נראה סיכום של קורס אצלנו
          </p>
        )}
      </div>
      {example && (
        <ExampleCard
          course={example.course}
          page={example.page}
          className="hidden lg:col-start-2 lg:row-start-1 lg:mt-2 lg:block"
        />
      )}
    </section>
  );
}
