import Link from 'next/link';
import { PenNote } from '@/components/course/marks';
import { TickMark } from '@/components/notebook/tick';
import { PenBox } from '@/components/site/pen';
import { moreReviewsText } from '@/lib/format';
import { MIN_REVIEWS } from '@/lib/score/constants';
import { closestToScore } from '@/lib/search/match';
import type { CourseSummary } from '@/lib/search/types';
import { cn } from '@/lib/utils';

/**
 * כמה ביקורות כבר יש וכמה חסרות עד לציון: חמש תיבות בעט, וי בכל ביקורת שיש.
 * מאותו צד של שם הקורס, ולא מספר בקצה השני של השורה, כדי שהרשימה לא תיקרא כמו תפריט.
 * הווי נמשך כשהשורה נכנסת למסך, אחד אחרי השני.
 */
function ReviewBoxes({ have }: { have: number }) {
  return (
    <span aria-hidden="true" className="flex items-center gap-[3px]">
      {Array.from({ length: MIN_REVIEWS }, (_, i) => (
        <span key={i} className="relative size-[18px] flex-none">
          <PenBox className={cn('absolute inset-0 size-full', i % 2 ? 'rotate-2' : '-rotate-2', i >= have && 'opacity-55')} />
          {i < have && (
            <span className="absolute -top-[5px] -left-[1px] size-[22px]" style={{ '--d': `${i * 140}ms` } as React.CSSProperties}>
              <TickMark className="size-full" strokeWidth={2.2} />
            </span>
          )}
        </span>
      ))}
    </span>
  );
}

/**
 * "סיימתם קורס?" (מסמך העיצוב, 3א.5): שלושת הקורסים שהכי קרובים לציון.
 * כתיבת ביקורת נפתחת בסבב 3, וההערה בעט אומרת את זה. עד אז כל קישור מוביל לעמוד הקורס עצמו,
 * שעובד היום ומראה כמה ביקורות חסרות. מתחת לכל קורס: חמש תיבות בעט, עם וי לכל ביקורת שיש.
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
      <ul className="mt-2 space-y-1 font-sans text-[15px] leading-snug lg:mt-3 lg:text-base">
        {closest.map((course) => {
          const needed = course.score.status === 'not_enough_reviews' ? course.score.reviewsNeeded : 0;
          return (
            <li key={course.slug}>
              <Link
                href={`/courses/${course.slug}`}
                className="group flex min-h-11 flex-col justify-center gap-1 py-1.5 transition-colors duration-150 hover:text-link-hover"
              >
                <span className="min-w-0 underline underline-offset-[3px]">{course.title}</span>
                <span className="flex items-center gap-2.5">
                  <ReviewBoxes have={Math.max(0, MIN_REVIEWS - needed)} />
                  <span className="inline-block -rotate-1 font-pen text-[15px] font-medium whitespace-nowrap text-pen lg:text-base">
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
