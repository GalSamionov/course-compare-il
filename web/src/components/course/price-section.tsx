import type { CoursePageData } from '@/lib/data/course-page';
import { PAID_RANGE_LEAD, PAID_RANGE_NOTE, formatIls, formatPaidRange, invoiceCountText } from '@/lib/format';
import { Mark, PenNote } from './marks';

export function PriceSection({ course }: { course: CoursePageData }) {
  return (
    <section id="price" className="mt-10 scroll-mt-6 lg:mt-14">
      <h2 className="pen-rule text-[21px] font-bold lg:text-[28px]">מחיר</h2>
      <p className="mt-3">
        {course.sitePrice !== null ? (
          <>
            <bdi dir="rtl">{formatIls(course.sitePrice)}</bdi> באתר המוסד
            {/* העלות לשעה מחושבת מהמחיר באתר, ולכן באותו משפט שלו, ולא אחרי הטווח ששולם. */}
            {course.costPerHandsOnHour !== null && (
              <>
                , כלומר כ-<bdi dir="rtl">{formatIls(course.costPerHandsOnHour)}</bdi> לשעת עשייה
              </>
            )}
            .
          </>
        ) : (
          'המוסד לא מפרסם מחיר.'
        )}
        {course.paid && (
          <>
            {' '}
            <Mark source="verified">
              {PAID_RANGE_LEAD} <bdi dir="rtl">{formatPaidRange(course.paid)}</bdi>
            </Mark>
            , {invoiceCountText(course.paid)}.
          </>
        )}
      </p>
      {course.paid && (
        <p className="mt-1 font-sans text-[13px] leading-snug text-ink-soft lg:text-sm">{PAID_RANGE_NOTE}</p>
      )}
      {course.paid && <PenNote arrow className="mt-1">שווה לשאול על הנחה לפני שנרשמים</PenNote>}
    </section>
  );
}
