import type { CoursePageData } from '@/lib/data/course-page';
import { formatIls, formatPaidRange } from '@/lib/format';
import { Mark } from './marks';

/**
 * "בקצרה": המחיר באתר מול מה ששולם בפועל, ליד הציון. בנייד מתחת לציון, ובמחשב בעמודה הצדדית.
 * הפירוט המלא נשאר בחלק "מחיר".
 */
export function PaidLine({ course }: { course: CoursePageData }) {
  if (!course.paid && course.sitePrice === null) return null;
  return (
    <div className="mt-11 font-sans text-[15px] leading-relaxed lg:mt-14">
      {course.paid ? (
        <p>
          <span className="font-bold">שילמו בפועל:</span>{' '}
          <Mark source="verified">
            <bdi dir="rtl">{formatPaidRange(course.paid)}</bdi>, לפי {course.paid.count} חשבוניות
          </Mark>
        </p>
      ) : (
        <p className="text-ink-soft">עוד אין מספיק חשבוניות כדי להראות כמה שילמו בפועל.</p>
      )}
      <p className="text-ink-soft">
        {course.sitePrice !== null ? (
          <>
            באתר המוסד: <bdi dir="rtl">{formatIls(course.sitePrice)}</bdi>
          </>
        ) : (
          'המוסד לא מפרסם מחיר.'
        )}
      </p>
    </div>
  );
}
