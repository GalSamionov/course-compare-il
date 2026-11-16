import { PenArrow } from '@/components/site/pen';
import { VerificationSteps } from '@/components/site/verification-steps';
import type { CoursePageData } from '@/lib/data/course-page';
import type { CourseSummary } from '@/lib/search/types';
import { cn } from '@/lib/utils';
import { ExampleCard } from './example-card';

/**
 * הפתיחה של דף הבית (חוזה דף הבית, FIRST VIEWPORT).
 * במחשב: ההבטחה ושלושת הצעדים מימין, הסיכום של קורס מהאתר משמאל.
 * בנייד: ההבטחה, הסיכום, ואז הצעדים. הסדר בקוד הוא סדר הקריאה בנייד.
 * בלי קורס עם ציון (כמו ביום העלייה לאוויר) אין סיכום להראות, ואין עמודה ריקה: ההבטחה ברוחב קריאה,
 * והצעדים מתחתיה לכל רוחב הדף, עם החצים ביניהם.
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
          לפני שמשלמים על קורס: מה אומרים בוגרים שהוכיחו שלמדו בו
        </h1>
        <p className="mt-4 max-w-[46ch] font-sans text-[17px] leading-normal text-pretty lg:mt-6 lg:text-xl">
          השוואת קורסים בכל התחומים. ביקורת מתפרסמת רק מבוגר שהעלה חשבונית, קבלה או תעודת סיום,
          <strong className="font-bold"> ואף מוכר קורסים לא משלם לנו.</strong>
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
          className="mt-9 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-2"
        />
      )}
      <VerificationSteps
        className={cn('mt-12', example ? 'lg:col-start-1 lg:row-start-2 lg:mt-8 lg:self-end' : 'lg:mt-14')}
      />
    </section>
  );
}
