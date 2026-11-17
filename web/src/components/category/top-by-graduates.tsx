import Link from 'next/link';
import { PenNote } from '@/components/course/marks';
import { PenNumber } from '@/components/site/pen';
import { verifiedGraduatesText } from '@/lib/format';
import { MIN_REVIEWS } from '@/lib/score/constants';
import { topByGraduates } from '@/lib/search/top';
import type { CourseSummary } from '@/lib/search/types';

/**
 * "המובילים לפי בוגרים": עד שלושה קורסים בתחום, לפי ציון הבוגרים, רק מתוך קורסים שיש להם ציון
 * (5 ביקורות מאומתות ומעלה), עם מספר הבוגרים המאומתים ליד כל אחד (החלטה של גל, 15.11.2026).
 * אף פעם לא לפי מספר נרשמים. בלי קורס עם ציון בתחום, החלק לא מוצג בכלל (מסמך העיצוב 2026-11-17).
 *
 * כל פריט מאותו צד (The Not A Menu Rule): מספר מוקף בעט, השם, ומתחתיו הציון ומספר המאומתים.
 * בלי מרקר על הציון: זה האתר שמונה, לא מקור. השורה נכתבת אל הדף כשהיא נכנסת למסך (data-anim="ink"),
 * ובריחוף העט מותח קו מתחת לשם (.pen-under).
 * במחשב הרכיב עומד ליד הכותרת, בעמודה שמיושרת לראש, מול פירורי הלחם (NotebookPage, headSide). לכן במחשב הוא
 * צפוף יותר. ההערה על הכלל מתחת לרשימה רק במחשב: בנייד היא עוד שורה בעט בין הכותרת לרשימת הקורסים.
 */
export function TopByGraduates({ courses, categorySlug }: { courses: readonly CourseSummary[]; categorySlug: string }) {
  const top = topByGraduates(courses, categorySlug);
  if (top.length === 0) return null;
  return (
    <section aria-labelledby="top-title" className="mt-6 font-sans lg:mt-3">
      <h2 id="top-title" className="pen-rule text-[19px] leading-snug font-bold">
        המובילים לפי בוגרים
      </h2>
      <ol className="mt-3 space-y-3 lg:mt-2 lg:space-y-2.5">
        {top.map((course, i) => (
          <li key={course.slug} data-anim="ink" className="grid grid-cols-[30px_minmax(0,1fr)] items-start gap-x-2.5">
            <PenNumber n={i + 1} className="mt-0.5" />
            <div className="min-w-0">
              {/* יעד מגע של 44 פיקסלים בלי להגדיל את השורה: השוליים השליליים מחזירים את הגובה, כמו ברשימת הקורסים. */}
              <Link
                href={`/courses/${course.slug}`}
                className="-my-2.5 inline-flex min-h-11 items-center text-base leading-snug font-bold transition-colors duration-150 hover:text-link-hover"
              >
                <span className="pen-under">{course.title}</span>
              </Link>
              <p className="mt-0.5 text-sm leading-snug text-ink-soft tabular-nums lg:mt-0">
                <span className="text-[17px] font-bold text-ink">{course.score.value.toFixed(1)}</span> ציון בוגרים,{' '}
                {verifiedGraduatesText(course.verifiedCount)}
              </p>
            </div>
          </li>
        ))}
      </ol>
      <PenNote arrow className="mt-2 hidden text-sm lg:block">
        רק קורסים עם {MIN_REVIEWS} ביקורות מאומתות ומעלה. לא לפי מספר נרשמים.
      </PenNote>
    </section>
  );
}
