import type { CoursePageData } from '@/lib/data/course-page';
import { formatIls, formatPaidRange } from '@/lib/format';
import { Mark, PenNote } from './marks';

export function PriceSection({ course }: { course: CoursePageData }) {
  return (
    <section id="price" className="mt-10 scroll-mt-6 lg:mt-14">
      <h2 className="pen-rule text-[21px] font-bold lg:text-[28px]">מחיר</h2>
      <p className="mt-3">
        {course.sitePrice !== null ? (
          <>
            <bdi dir="rtl">{formatIls(course.sitePrice)}</bdi> באתר המוסד
            {/* בלי טווח ששולם, העלות לשעה ממשיכה את אותו משפט: "באתר המוסד, כלומר כ-181 ₪ לשעת עשייה". */}
            {course.paid || course.costPerHandsOnHour === null ? '.' : ''}
          </>
        ) : (
          'המוסד לא מפרסם מחיר.'
        )}
        {course.paid && (
          <>
            {' '}
            <Mark source="verified">
              לפי {course.paid.count} חשבוניות, בוגרים שילמו בפועל <bdi dir="rtl">{formatPaidRange(course.paid)}</bdi>
            </Mark>
          </>
        )}
        {course.costPerHandsOnHour !== null && (
          <>
            , כלומר כ-<bdi dir="rtl">{formatIls(course.costPerHandsOnHour)}</bdi> לשעת עשייה.
          </>
        )}
      </p>
      {course.paid && <PenNote arrow className="mt-1">שווה לשאול על הנחה לפני שנרשמים</PenNote>}
    </section>
  );
}
