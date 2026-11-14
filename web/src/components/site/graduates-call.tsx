import Link from 'next/link';
import { PenNote } from '@/components/course/marks';
import { MIN_REVIEWS } from '@/lib/score/constants';
import { closestToScore } from '@/lib/search/match';
import type { CourseSummary } from '@/lib/search/types';

const missingText = (n: number) => (n === 1 ? 'עוד ביקורת אחת' : `עוד ${n} ביקורות`);

/**
 * קו בעט שנמתח מהשם של הקורס אל מה שחסר לו, כמו קו מנקד בתוכן עניינים, אבל ביד.
 * הקו נמתח לרוחב שנשאר בשורה, והראש של החץ נשאר באותו גודל.
 */
function PenLeader() {
  return (
    <span aria-hidden="true" className="mx-2 flex min-w-7 flex-1 items-center text-pen">
      <svg viewBox="0 0 100 8" preserveAspectRatio="none" className="h-2 w-full overflow-visible">
        <path
          d="M99 4.8C74 3.4 52 5.6 30 4.4 18 3.8 8 4.2 1.5 4.6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <svg viewBox="0 0 8 10" className="-ms-1.5 h-2.5 w-2 flex-none overflow-visible">
        <path d="M6.8 1 1 5 6.6 9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

/**
 * "סיימתם קורס?" (מסמך העיצוב, 3א.5): שלושת הקורסים שהכי קרובים לציון.
 * כתיבת ביקורת נפתחת בסבב 3, וההערה בעט אומרת את זה. עד אז כל קישור מוביל לעמוד הקורס עצמו,
 * שעובד היום ומראה כמה ביקורות חסרות. חץ בעט קושר כל קורס למה שחסר לו.
 */
export function GraduatesCall({ courses }: { courses: CourseSummary[] }) {
  const closest = closestToScore(courses, 3);
  if (closest.length === 0) return null;
  return (
    <section aria-labelledby="graduates-title" className="mt-10 ms-(--margin) ps-3 lg:ms-0 lg:mt-16 lg:ps-0">
      <h2 id="graduates-title" className="pen-rule text-[21px] leading-snug font-bold lg:text-[28px]">
        סיימתם קורס?
      </h2>
      <p className="mt-2 font-sans text-[15px] leading-normal lg:text-[17px]">
        ביקורת שלכם יכולה לתת לקורס ציון. מספיקות {MIN_REVIEWS} ביקורות מאומתות.
      </p>
      <PenNote arrow className="mt-1.5 lg:text-base">
        כתיבת ביקורת נפתחת בקרוב. בינתיים, אלה הקורסים שהכי קרובים לציון:
      </PenNote>
      <ul className="mt-1 font-sans text-[15px] leading-snug lg:mt-2 lg:text-base">
        {closest.map((course) => {
          const needed = course.score.status === 'not_enough_reviews' ? course.score.reviewsNeeded : 0;
          return (
            <li key={course.slug}>
              <Link href={`/courses/${course.slug}`} className="group flex min-h-11 items-center py-0.5 hover:text-link-hover">
                <span className="min-w-0 underline underline-offset-[3px]">{course.title}</span>
                <PenLeader />
                <span className="inline-block flex-none -rotate-1 font-pen text-[15px] font-medium whitespace-nowrap text-pen lg:text-base">
                  {missingText(needed)}
                </span>
                <span className="sr-only"> עד לציון</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
