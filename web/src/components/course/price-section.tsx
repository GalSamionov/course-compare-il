import type { CoursePageData } from '@/lib/data/course-page';
import { formatIls, formatPaidRange } from '@/lib/format';
import { Mark, PenNote } from './marks';

export function PriceSection({ course }: { course: CoursePageData }) {
  return (
    <section id="price" className="mt-7">
      <h2 className="inline-block border-b-2 border-ink pb-0.5 text-[21px] font-bold">מחיר</h2>
      <p className="mt-2.5">
        {course.sitePrice !== null ? (
          <>
            <bdi dir="rtl">{formatIls(course.sitePrice)}</bdi> באתר המוסד.
          </>
        ) : (
          'המוסד לא מפרסם מחיר.'
        )}{' '}
        {course.paid && (
          <Mark source="verified">
            לפי {course.paid.count} חשבוניות, בוגרים שילמו בפועל <bdi dir="rtl">{formatPaidRange(course.paid)}</bdi>
          </Mark>
        )}
        {course.costPerHandsOnHour !== null && (
          <>
            , כלומר כ-<bdi dir="rtl">{formatIls(course.costPerHandsOnHour)}</bdi> לשעת עשייה.
          </>
        )}
      </p>
      {course.paid && <PenNote className="mt-1">← שווה לשאול על הנחה לפני שנרשמים</PenNote>}
    </section>
  );
}
