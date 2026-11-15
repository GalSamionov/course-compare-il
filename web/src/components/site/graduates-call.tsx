import Link from 'next/link';
import { PenNote } from '@/components/course/marks';
import { moreReviewsText } from '@/lib/format';
import { MIN_REVIEWS } from '@/lib/score/constants';
import { closestToScore } from '@/lib/search/match';
import type { CourseSummary } from '@/lib/search/types';

/** חמישה קווי ספירה ביד: ארבעה עומדים, מימין לשמאל, והחמישי חוצה אותם. */
const TALLY = [
  'M30.6 4.6C30.2 10.8 30.4 17.4 30.9 23.6',
  'M23.4 4.2C23.1 10.6 23.3 17 23.7 23.8',
  'M16.2 4.8C15.8 11 16 17.4 16.4 23.4',
  'M9.1 4.4C8.8 10.8 9 17 9.4 23.6',
  'M4.4 20.6C13.4 16.2 24 11.6 35.6 7.4',
];

/**
 * כמה ביקורות כבר יש וכמה חסרות עד לציון: חמישה קווי ספירה בעט, קו לכל ביקורת שיש,
 * והחסרים קווקוו בהיר. קווי ספירה ולא תיבות סימון: תיבה עם וי היא הסימון של שורה במחברת,
 * וכאן אין מה ללחוץ. מאותו צד של שם הקורס, ולא מספר בקצה השני של השורה, כדי שהרשימה לא תיקרא כמו תפריט.
 */
export function ReviewTally({ have }: { have: number }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 40 28"
      className="h-[22px] w-[32px] flex-none overflow-visible text-pen"
    >
      {TALLY.slice(0, MIN_REVIEWS).map((d, i) =>
        i < have ? (
          <path
            key={d}
            d={d}
            pathLength={1}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        ) : (
          <path key={d} d={d} fill="none" stroke="currentColor" strokeOpacity=".3" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="2.4 3" />
        ),
      )}
    </svg>
  );
}

/**
 * "סיימתם קורס?" (מסמך העיצוב, 3א.5): שלושת הקורסים שהכי קרובים לציון.
 * כתיבת ביקורת נפתחת בסבב 3, וההערה בעט אומרת את זה. עד אז כל קישור מוביל לעמוד הקורס עצמו,
 * שעובד היום ומראה כמה ביקורות חסרות. מתחת לכל קורס: קווי ספירה בעט, קו לכל ביקורת שיש.
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
        אלה הקורסים שהכי קרובים לציון. לוחצים על קורס וכותבים:
      </PenNote>
      <ul className="mt-2 space-y-1 font-sans text-[15px] leading-snug lg:mt-3 lg:text-base">
        {closest.map((course) => {
          const needed = course.score.status === 'not_enough_reviews' ? course.score.reviewsNeeded : 0;
          return (
            <li key={course.slug}>
              <Link
                href={`/courses/${course.slug}/review`}
                className="group flex min-h-11 flex-col justify-center gap-1 py-1.5 transition-colors duration-150 hover:text-link-hover"
              >
                <span className="min-w-0 underline underline-offset-[3px]">{course.title}</span>
                <span className="flex items-center gap-2.5">
                  <ReviewTally have={Math.max(0, MIN_REVIEWS - needed)} />
                  <span className="inline-block font-pen text-[15px] font-medium whitespace-nowrap text-pen lg:text-base">
                    {moreReviewsText(needed)}
                  </span>
                  <span className="sr-only"> עד לציון</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
