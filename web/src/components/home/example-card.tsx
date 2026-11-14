import Link from 'next/link';
import { SourceLegend } from '@/components/course/source-legend';
import { Claim, Mark, PenNote, StickyNote, Tape } from '@/components/course/marks';
import { Stamp } from '@/components/course/stamp';
import type { CoursePageData } from '@/lib/data/course-page';
import { PAID_RANGE_LEAD, formatIls, formatPaidRange, invoiceCountText } from '@/lib/format';
import { verifiedLabel } from '@/lib/reviews/types';
import type { CourseSummary } from '@/lib/search/types';

/** המשפט הראשון של ביקורת, לציטוט קצר על הפתק. */
function firstSentence(text: string): string {
  const end = text.search(/[.!?](\s|$)/);
  return end === -1 ? text : text.slice(0, end + 1);
}

const cohort = (iso: string) =>
  new Intl.DateTimeFormat('he-IL', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(iso));

/**
 * סיכום לדוגמה של קורס אחד, מסומן במרקרים, מודבק על הדף בסלוטייפ עם תווית "לדוגמה".
 * המבקר לומד את שפת הצבעים מהדוגמה לפני שהוא קורא הסבר (חוזה דף הבית, FIRST VIEWPORT).
 * כל מספר מגיע מהמסד: הקורס עם הציון הגבוה בקטלוג, והעמוד שלו. אין כאן מספר שכתוב ביד.
 */
export function ExampleCard({ course, page, className }: { course: CourseSummary; page: CoursePageData | null; className?: string }) {
  const score = page?.score ?? null;
  const value = score?.status === 'scored' ? score.value : course.score.status === 'scored' ? course.score.value : null;
  const review = page?.reviews[0] ?? null;
  return (
    <figure aria-labelledby="example-caption" className={className}>
      <div className="relative -rotate-[1.2deg] bg-white px-5 pt-8 pb-6 shadow-[0_1px_2px_rgb(0_0_0/0.18),0_18px_30px_-16px_rgb(0_0_0/0.45)] ring-1 ring-black/[0.06] lg:px-8 lg:pt-9 lg:pb-8">
        {/* במחשב הפתק של הבוגר מחזיק את הפינה, ולכן הסלוטייפ באמצע רק בנייד. */}
        <Tape width={92} tilt={-2} className="lg:hidden" />
        <Tape side="top-start" width={96} tilt={-24} className="font-sans text-[14px] font-extrabold tracking-wide text-ink">
          לדוגמה
        </Tape>

        {/*
          הכותרת קודם, ומתחתיה חותמת המוסד והתחום, כמו בראש עמוד הקורס. בלי שורה מעל הכותרת.
          במחשב הפתק של הבוגר תלוי על הפינה השמאלית העליונה. המרווח הצף שומר לו מקום בשורה הראשונה של הכותרת,
          כך שכותרת ארוכה נשברת לשורה שנייה במקום להיעלם מתחת לפתק.
        */}
        {review && <span aria-hidden="true" className="hidden lg:float-left lg:block lg:h-9 lg:w-[150px]" />}
        <p className="font-serif text-[22px] leading-tight font-bold lg:text-[30px]">{course.title}</p>
        <p className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-sans text-[13px] leading-tight text-ink-soft lg:mt-2.5 lg:text-sm">
          <Stamp className="px-2 py-0.5 text-[13px] lg:px-2.5 lg:py-1 lg:text-[15px]">{course.institutionName}</Stamp>
          {course.categoryName && <span>{course.categoryName}</span>}
        </p>

        {value !== null && (
          <div className="mt-3.5 flex items-center gap-3.5 border-[1.5px] border-ink px-3.5 py-2.5 lg:mt-5 lg:gap-5 lg:px-5 lg:py-3.5">
            <span aria-hidden="true" className="font-serif text-[40px] leading-none font-bold lg:text-[56px]">
              {value.toFixed(1)}
            </span>
            <span className="sr-only">ציון בוגרים {value.toFixed(1)} מתוך 10.</span>
            <div className="font-sans text-[13px] leading-snug lg:text-[15px]">
              <p className="font-bold">ציון בוגרים מתוך 10</p>
              {score?.status === 'scored' && (
                <p>
                  {score.reviewCount} בוגרים מאומתים
                  {score.recommendPct !== null && ` · ${Math.round(score.recommendPct)}% ממליצים`}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="mt-3.5 space-y-2 text-[15px] leading-relaxed lg:mt-5 lg:space-y-2.5 lg:text-[17px]">
          {page?.paid ? (
            <p>
              <Mark source="verified" swipe={350}>
                {PAID_RANGE_LEAD} <bdi dir="rtl">{formatPaidRange(page.paid)}</bdi>, {invoiceCountText(page.paid)}
              </Mark>
            </p>
          ) : null}
          {page?.paid && page.sitePrice !== null ? (
            <p className="-mt-1 font-sans text-[13px] text-ink-soft lg:text-sm">
              באתר המוסד: <bdi dir="rtl">{formatIls(page.sitePrice)}</bdi>
            </p>
          ) : (
            course.sitePrice !== null && (
              <p>
                <bdi dir="rtl">{formatIls(course.sitePrice)}</bdi> באתר המוסד.
              </p>
            )
          )}
          {page?.institutionPromises && (
            <p>
              <span className="font-sans font-bold">המוסד מבטיח:</span> <Claim>{page.institutionPromises}</Claim>
            </p>
          )}
          {page?.summaryWeak && (
            <p>
              <span className="font-sans font-bold">חלש:</span>{' '}
              <Mark source="weak" swipe={800}>
                {page.summaryWeak}
              </Mark>
            </p>
          )}
        </div>

        {review && (
          // במחשב הפתק מודבק על הפינה השמאלית העליונה, ליד שם הקורס, שם אין טקסט שהוא מסתיר.
          <StickyNote
            tone="grad"
            tilt={3}
            className="mt-5 ms-6 -me-2.5 px-3.5 pt-5 pb-3 lg:absolute lg:-top-10 lg:-left-14 lg:m-0 lg:w-[236px]"
          >
            <p className="font-serif text-[15px] leading-snug">״{firstSentence(review.body)}״</p>
            <p className="mt-1.5">
              <strong>{review.displayName ?? verifiedLabel(review.authorTitle)}</strong>
              {review.displayName && `, ${verifiedLabel(review.authorTitle)}`}, מחזור {cohort(review.cohortMonth)}
            </p>
          </StickyNote>
        )}
      </div>

      <figcaption id="example-caption" className="mt-6 lg:mt-8 lg:max-w-[420px]">
        <PenNote className="text-base font-medium lg:text-lg">כל צבע אומר מאיפה המידע. כאן הכול נתוני דמה.</PenNote>
        <SourceLegend variant="inline" />
        <p className="mt-1 font-sans text-[15px] font-semibold">
          <Link
            href={`/courses/${course.slug}`}
            className="inline-flex min-h-11 items-center underline underline-offset-[3px] hover:text-link-hover"
          >
            לסיכום המלא של הקורס לדוגמה
          </Link>
        </p>
      </figcaption>
    </figure>
  );
}
