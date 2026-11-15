import Link from 'next/link';
import { PenArrow } from '@/components/site/pen';
import type { CoursePageData } from '@/lib/data/course-page';
import {
  PAID_RANGE_LEAD,
  formatIls,
  formatPaidRange,
  invoiceCountText,
  reviewsToScoreText,
  verifiedGraduatesText,
  verifiedReviewsText,
} from '@/lib/format';
import { PRODUCT_TYPE_LABEL } from '@/lib/search/types';
import { Mark } from './marks';

/** קישור בשורת הפרטים: יעד מגע של 44 פיקסלים, בלי להגדיל את השורה. */
const smallLink =
  '-my-3 inline-flex min-h-11 items-center underline decoration-1 underline-offset-[3px] transition-colors duration-150 hover:text-link-hover';

/**
 * קורס ברשימה של עמוד מוסד או מרצה. כל ציון כאן הוא של הקורס: אין ציון למוסד או למרצה (החלטה של גל).
 * בנייד הכול מאותו צד, זה מתחת לזה: השם, הציון עם מספר הבוגרים המאומתים, המחיר באתר ומה ששולם בפועל
 * (מרקר ירוק), ובסוף השורות הנוספות. במחשב השורה נפרשת לעמודות, כמו ברשימת הקורסים: השם והשורות הנוספות,
 * הציון, והמחיר. כך הציונים עומדים זה מתחת לזה, ואפשר להשוות בעין. בלי נקודות מובילות (The Not A Menu Rule).
 * השורה נכתבת אל הדף כשהיא נכנסת למסך (data-anim="ink"), ובריחוף העט מותח קו מתחת לשם (.pen-under).
 * children: שורות נוספות. בעמוד מוסד: מה המוסד מבטיח. בעמוד מרצה: התפקיד, ומה הבוגרים אומרים על המרצים.
 */
export function CourseRow({
  course,
  showInstitution = false,
  scoreLabel = 'ציון בוגרים מתוך 10',
  children,
}: {
  course: CoursePageData;
  /** בעמוד מרצה: שם המוסד, עם קישור לעמוד שלו. */
  showInstitution?: boolean;
  scoreLabel?: string;
  children?: React.ReactNode;
}) {
  const { score } = course;
  const product = PRODUCT_TYPE_LABEL[course.productType];
  const removed = course.status === 'removed';
  return (
    <article
      data-anim="ink"
      className="ruled-row grid gap-y-2.5 pt-4 pb-[18px] lg:grid-cols-[minmax(0,1.6fr)_11rem_minmax(0,1fr)] lg:gap-x-8 lg:gap-y-1 lg:py-5"
    >
      <div className="min-w-0 lg:col-start-1 lg:row-start-1">
        <h3 className="text-[19px] leading-snug font-bold lg:text-[21px]">
          {/* יעד מגע של 44 פיקסלים, בלי להגדיל את השורה: השוליים השליליים מחזירים את הגובה. כמו ברשימת הקורסים. */}
          <Link
            href={`/courses/${course.slug}`}
            className="group/title -my-2.5 inline-flex min-h-11 items-center gap-1.5 transition-colors duration-150 hover:text-link-hover"
          >
            <span className="pen-under">{course.title}</span>
            <PenArrow className="me-0 h-[0.6em] w-[1.2em] flex-none opacity-0 transition-[opacity,translate] duration-200 group-hover/title:opacity-100 group-focus-visible/title:opacity-100 motion-safe:translate-x-1.5 motion-safe:group-hover/title:translate-x-0" />
          </Link>
        </h3>
        {(showInstitution || product || removed) && (
          <p className="mt-0.5 font-sans text-sm leading-normal text-ink-soft lg:text-[15px]">
            {showInstitution &&
              (course.institutionSlug ? (
                <Link href={`/institutions/${course.institutionSlug}`} className={smallLink}>
                  {course.institutionName}
                </Link>
              ) : (
                course.institutionName
              ))}
            {showInstitution && product && ' · '}
            {product}
            {removed && (
              <span className="font-semibold text-ink">
                {showInstitution || product ? ' · ' : ''}הקורס כבר לא מוצע
              </span>
            )}
          </p>
        )}
      </div>

      {score.status === 'scored' ? (
        <p className="flex items-center gap-x-2.5 font-sans text-sm leading-snug lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:flex-col lg:items-start lg:gap-y-1 lg:pt-1">
          <span aria-hidden="true" className="text-[28px] leading-none font-bold tabular-nums lg:text-[34px]">
            {score.value.toFixed(1)}
          </span>
          <span className="sr-only">
            {scoreLabel}: {score.value.toFixed(1)}.{' '}
          </span>
          <span>
            <span aria-hidden="true" className="block">
              {scoreLabel}
            </span>
            <span className="block text-ink-soft">{verifiedGraduatesText(score.reviewCount)}</span>
          </span>
        </p>
      ) : (
        <p className="font-sans text-sm leading-snug lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:pt-1.5">
          <strong className="block text-[15px]">עוד אין ציון בוגרים</strong>
          {score.status === 'not_enough_reviews' && score.reviewCount > 0 && (
            <span className="block text-ink-soft">{verifiedReviewsText(score.reviewCount)}</span>
          )}
          {score.status === 'not_enough_reviews' && score.reviewsNeeded > 0 && (
            <span className="block text-ink-soft">{reviewsToScoreText(score.reviewsNeeded)}</span>
          )}
        </p>
      )}

      <p className="font-sans text-[15px] leading-normal tabular-nums lg:col-start-3 lg:row-span-2 lg:row-start-1 lg:pt-1.5">
        {course.sitePrice !== null ? (
          <>
            באתר המוסד: <bdi dir="rtl">{formatIls(course.sitePrice)}</bdi>
          </>
        ) : (
          <span className="text-ink-soft">המוסד לא מפרסם מחיר</span>
        )}
        {course.paid && (
          <span className="mt-1.5 block">
            <Mark source="verified">
              {PAID_RANGE_LEAD} <bdi dir="rtl">{formatPaidRange(course.paid)}</bdi>
            </Mark>
            <span className="mt-0.5 block text-[13px] text-ink-soft">{invoiceCountText(course.paid)}</span>
          </span>
        )}
      </p>

      {children && <div className="min-w-0 lg:col-start-1 lg:row-start-2">{children}</div>}
    </article>
  );
}
