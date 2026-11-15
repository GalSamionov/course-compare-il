import type { CoursePageData } from '@/lib/data/course-page';
import { PAID_RANGE_LEAD, formatIls, formatPaidRange, invoiceCountText, outcomeHeadline } from '@/lib/format';
import { Mark } from './marks';

/** עבר ל-lib/format.ts, כי גם ההשוואה משתמשת בו. מיוצא מכאן בשביל about-section.tsx. */
export { outcomeHeadline };

/** החולשה הבולטת: הסיכום של הבוגרים, ואם אין, פרק שסומן כחלש בסילבוס. */
function topWeakness(course: CoursePageData): { label: string; text: string } | null {
  if (course.summaryWeak) return { label: 'חלש:', text: course.summaryWeak };
  const chapter = course.syllabus.find((item) => item.weak);
  return chapter ? { label: 'פרק חלש:', text: chapter.title } : null;
}

const sub = 'block text-[13px] leading-snug text-ink-soft lg:text-sm';

/**
 * "בקצרה": עד שלוש שורות מתחת לציון, כל אחת בצבע המקור שלה. מה שילמו בפועל (ירוק, מחשבוניות),
 * מה קרה לבוגרים (צהוב, במספר אנשים כשהנתונים מאפשרים), והחולשה הבולטת (ורוד).
 * בנייד מיד אחרי הציון, ובמחשב בעמודה הצדדית שנשארת במקום. הפירוט המלא נשאר בחלקים של העמוד.
 */
export function AtAGlance({ course }: { course: CoursePageData }) {
  const weak = topWeakness(course);
  return (
    <section aria-labelledby="glance-title" className="mt-6 font-sans lg:mt-8">
      <h2 id="glance-title" className="text-[15px] font-bold lg:text-base">
        בקצרה
      </h2>
      <ul className="mt-1.5 space-y-2.5 text-[15px] leading-relaxed lg:text-base">
        <li>
          {course.paid ? (
            <>
              <Mark source="verified">
                {PAID_RANGE_LEAD} <bdi dir="rtl">{formatPaidRange(course.paid)}</bdi>
              </Mark>
              <span className={sub}>
                {invoiceCountText(course.paid)}
                {course.sitePrice !== null && (
                  <>
                    . באתר המוסד: <bdi dir="rtl">{formatIls(course.sitePrice)}</bdi>
                  </>
                )}
              </span>
            </>
          ) : (
            <>
              {course.sitePrice !== null ? (
                <>
                  באתר המוסד: <bdi dir="rtl">{formatIls(course.sitePrice)}</bdi>
                </>
              ) : (
                'המוסד לא מפרסם מחיר.'
              )}
              <span className={sub}>עוד אין מספיק חשבוניות כדי לדעת כמה שילמו בפועל.</span>
            </>
          )}
        </li>
        {course.outcome && (
          <li>
            <Mark source="grads">{outcomeHeadline(course.outcome)}</Mark>
            {course.outcome.kind === 'after_3m' && (
              <span className={sub}>בממוצע הם נתנו לתוצאה {course.outcome.mean.toFixed(1)} מתוך 5.</span>
            )}
          </li>
        )}
        {weak && (
          <li>
            <span className="font-bold">{weak.label}</span> <Mark source="weak">{weak.text}</Mark>
          </li>
        )}
      </ul>
    </section>
  );
}
