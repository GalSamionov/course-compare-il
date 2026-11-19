import { showsScore } from '@/lib/course/score-shown';
import type { CoursePageData } from '@/lib/data/course-page';
import { PAID_RANGE_LEAD, formatIls, formatPaidRange, invoiceCountText, outcomeBasis, outcomeHeadline } from '@/lib/format';
import { Mark } from './marks';

/** החולשה הבולטת: הסיכום של הבוגרים, ואם אין, פרק שסומן כחלש בסילבוס. */
function topWeakness(course: CoursePageData): { label: string; text: string } | null {
  if (course.summaryWeak) return { label: 'חלש:', text: course.summaryWeak };
  const chapter = course.syllabus.find((item) => item.weak);
  return chapter ? { label: 'פרק חלש:', text: chapter.title } : null;
}

const sub = 'block text-[13px] leading-snug text-ink-soft lg:text-sm';

/**
 * "בקצרה": רק שורות שיש להן ערך (מסמך העיצוב 2026-11-17), כל אחת בצבע המקור שלה. מה שילמו בפועל (ירוק, מחמש
 * חשבוניות, כמו היום), מה קרה לבוגרים (צהוב) והחולשה הבולטת (ורוד). בלי אף אחת מהן, אין "בקצרה".
 * המחיר באתר המוסד מופיע כאן רק לקורס עם ביקורות ובלי חשבוניות. בלי ביקורות הוא כבר ב"העובדות".
 * בנייד מיד אחרי הציון, ובמחשב בעמודה הצדדית. הפירוט המלא נשאר בחלקים של העמוד.
 */
export function AtAGlance({ course }: { course: CoursePageData }) {
  const weak = topWeakness(course);
  const sitePrice = !course.paid && showsScore(course.reviewTotal) ? course.sitePrice : null;
  if (!course.paid && sitePrice === null && !course.outcome && !weak) return null;
  return (
    <section aria-labelledby="glance-title" className="mt-6 font-sans lg:mt-8">
      <h2 id="glance-title" className="text-[15px] font-bold lg:text-base">
        בקצרה
      </h2>
      <ul className="mt-1.5 space-y-2.5 text-[15px] leading-relaxed lg:text-base">
        {course.paid && (
          <li>
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
          </li>
        )}
        {sitePrice !== null && (
          <li>
            באתר המוסד: <bdi dir="rtl">{formatIls(sitePrice)}</bdi>
          </li>
        )}
        {course.outcome && (
          <li>
            <Mark source="grads">{outcomeHeadline(course.outcome)}</Mark>
            {outcomeBasis(course.outcome) && <span className={sub}>{outcomeBasis(course.outcome)}.</span>}
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
