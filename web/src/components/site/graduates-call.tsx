import Link from 'next/link';
import { MIN_REVIEWS } from '@/lib/score/constants';
import { closestToScore } from '@/lib/search/match';
import type { CourseSummary } from '@/lib/search/types';

const missingText = (n: number) => (n === 1 ? 'חסרה עוד ביקורת אחת' : `חסרות עוד ${n} ביקורות`);

/**
 * "סיימתם קורס?" (מסמך העיצוב, 3א.5): שלושת הקורסים שהכי קרובים לציון.
 * עד סבב 3 כל קישור מוביל לעמוד "בקרוב" של כתיבת ביקורת על אותו קורס.
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
      <ul className="mt-1 font-sans text-[15px] leading-snug lg:mt-2 lg:text-base">
        {closest.map((course) => {
          const needed = course.score.status === 'not_enough_reviews' ? course.score.reviewsNeeded : 0;
          return (
            <li key={course.slug}>
              <Link
                href={`/courses/${course.slug}/review`}
                className="flex min-h-11 items-center underline underline-offset-[3px] hover:text-link-hover"
              >
                לקורס ״{course.title}״ {missingText(needed)} כדי לקבל ציון
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
