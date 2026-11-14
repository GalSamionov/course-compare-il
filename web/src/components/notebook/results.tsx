import Link from 'next/link';
import { SaveButton } from '@/components/account/save-button';
import { Mark, PenNote } from '@/components/course/marks';
import { PenArrow } from '@/components/site/pen';
import { Soon } from '@/components/site/soon';
import { MAX_COURSES } from '@/lib/advisor/types';
import { formatIls } from '@/lib/format';
import type { MatchResult } from '@/lib/search/match';
import { marginNotes } from '@/lib/search/notes';
import { PRODUCT_TYPE_LABEL } from '@/lib/search/types';
import { cn } from '@/lib/utils';
import { Advisor } from './advisor';

/** כותרת הרשימה כשלפחות שורה אחת מסננת. */
export function coursesTitle(n: number): string {
  if (n === 0) return 'אין קורסים מתאימים';
  if (n === 1) return 'קורס אחד מתאים';
  return `${n} קורסים מתאימים`;
}

/** כותרת הרשימה כשאף שורה לא מסננת. */
export function allCoursesTitle(n: number): string {
  return n === 1 ? 'קורס אחד' : `${n} קורסים`;
}

const verifiedText = (n: number) =>
  n === 0 ? 'עוד אין בוגרים מאומתים' : n === 1 ? 'בוגר מאומת אחד' : `${n} בוגרים מאומתים`;
const missingText = (n: number) => (n === 1 ? 'חסרה עוד ביקורת אחת.' : `חסרות עוד ${n} ביקורות.`);

/**
 * העמודות של שורת התוצאה ברשימה רחבה (מחשב): השוליים, הקורס, הציון, הבוגרים והמחיר, והכפתורים.
 * כך הציונים והמחירים עומדים זה מתחת לזה, ואפשר להשוות בעין.
 */
const ledgerCols = '@3xl:grid-cols-[var(--margin)_minmax(0,1.7fr)_8.5rem_minmax(0,1fr)_6.5rem] @3xl:gap-x-6';

/**
 * שורת תוצאה בסגנון הסיכום: ההערה בעט בשוליים מימין, והקורס משמאלה.
 * ברוחב של 768 פיקסלים ומעלה (של הרשימה, לא של המסך) השורה נפרשת לעמודות, כמו בספר חשבונות.
 * באזור האישי, בעמודה צרה, היא נשארת כמו בנייד.
 * note: ההערה בשוליים, כשהרשימה כבר כתבה את ההערה המשותפת פעם אחת (ראו marginNotes).
 * actions: הכפתורים בסוף השורה ("לשמור", ובאזור האישי גם "להשוואה").
 * highlight: באזור האישי השורה בלי העובדה המודגשת, כמו בציור (Me.dc.html).
 */
export function ResultRow({
  result,
  note = result.note,
  highlight = true,
  actions,
}: {
  result: MatchResult;
  note?: string;
  highlight?: boolean;
  actions?: React.ReactNode;
}) {
  const { course } = result;
  const product = PRODUCT_TYPE_LABEL[course.productType];
  return (
    <div className="@container">
      <article
        className={cn(
          'ruled-row grid grid-cols-[var(--margin)_minmax(0,1fr)] pt-4',
          actions ? 'pb-3' : 'pb-[18px]',
          ledgerCols,
          '@3xl:pt-5 @3xl:pb-5',
        )}
      >
        {/* הקורס ראשון בקוד, כדי שקורא מסך יקרא את השם לפני ההערה. העמודות קובעות את המיקום. */}
        <div className="col-start-2 row-start-1 ps-3 @3xl:contents">
          <h3 className="text-[19px] leading-snug font-bold @3xl:col-start-2 @3xl:row-start-1 @3xl:ps-3 @3xl:text-[21px]">
            {/* יעד מגע של 44 פיקסלים, בלי להגדיל את השורה: השוליים השליליים מחזירים את הגובה. */}
            <Link
              href={`/courses/${course.slug}`}
              className="-my-2.5 inline-flex min-h-11 items-center decoration-[1.5px] underline-offset-4 hover:text-link-hover hover:underline"
            >
              {course.title}
            </Link>
          </h3>
          <p className="mt-0.5 font-sans text-sm leading-normal text-ink-soft @3xl:col-start-2 @3xl:row-start-2 @3xl:ps-3 @3xl:text-[15px]">
            {course.institutionName}
            {product && ` · ${product}`}
          </p>
          {course.score.status === 'scored' ? (
            <p className="mt-2 flex items-baseline gap-1.5 font-sans text-sm leading-tight @3xl:col-start-3 @3xl:row-span-3 @3xl:row-start-1 @3xl:mt-0 @3xl:flex-col @3xl:items-start @3xl:gap-1">
              <span aria-hidden="true" className="font-serif text-[26px] leading-none font-bold @3xl:text-[34px]">
                {course.score.value.toFixed(1)}
              </span>
              <span aria-hidden="true" className="@3xl:text-[13px] @3xl:text-ink-soft">
                ציון בוגרים מתוך 10
              </span>
              <span className="sr-only">ציון בוגרים {course.score.value.toFixed(1)} מתוך 10</span>
            </p>
          ) : (
            <p className="mt-2 font-sans text-[15px] leading-snug @3xl:col-start-3 @3xl:row-span-3 @3xl:row-start-1 @3xl:mt-1 @3xl:text-sm">
              <strong>עוד אין ציון בוגרים.</strong>
              {course.score.status === 'not_enough_reviews' && course.score.reviewsNeeded > 0 && (
                <>
                  {' '}
                  <span className="text-ink-soft">{missingText(course.score.reviewsNeeded)}</span>
                </>
              )}
            </p>
          )}
          <p className="mt-1.5 font-sans text-[15px] leading-normal tabular-nums @3xl:col-start-4 @3xl:row-span-3 @3xl:row-start-1 @3xl:mt-1">
            <span className="@3xl:block">{verifiedText(course.verifiedCount)}</span>
            <span className="@3xl:hidden"> · </span>
            {course.sitePrice !== null ? (
              <strong className="@3xl:mt-1 @3xl:block @3xl:text-[17px]">
                <bdi dir="rtl">{formatIls(course.sitePrice)}</bdi>
                <span className="hidden font-normal text-ink-soft @3xl:inline @3xl:text-[13px]"> באתר המוסד</span>
              </strong>
            ) : (
              <span className="text-ink-soft @3xl:mt-1 @3xl:block">המוסד לא מפרסם מחיר</span>
            )}
          </p>
          {highlight && course.highlight && (
            <p className="mt-1.5 font-sans text-[15px] leading-normal @3xl:col-start-2 @3xl:row-start-3 @3xl:mt-2 @3xl:ps-3">
              <Mark source="grads">
                {course.highlight.label}: {course.highlight.text}
              </Mark>
            </p>
          )}
          {actions && (
            <div className="mt-2.5 flex flex-wrap items-center gap-x-3.5 gap-y-2 @3xl:col-start-5 @3xl:row-span-3 @3xl:row-start-1 @3xl:mt-0 @3xl:self-start">
              {actions}
            </div>
          )}
        </div>
        <p className="col-start-1 row-start-1 -rotate-3 pt-1.5 pe-2 font-pen text-sm leading-snug font-medium text-pen @3xl:row-span-3 lg:text-[15px]">
          {note && (
            <>
              <PenArrow />
              {note}
            </>
          )}
        </p>
      </article>
    </div>
  );
}

/** שורת הכותרות של העמודות, רק כשהרשימה רחבה. קישוט: כל שורה אומרת את אותו דבר במילים. */
function LedgerHead() {
  return (
    <div className="@container">
      <div
        aria-hidden="true"
        className={cn(
          'hidden pt-5 pb-1.5 font-sans text-[13px] leading-tight font-semibold text-ink-soft @3xl:grid',
          ledgerCols,
        )}
      >
        <span />
        <span className="ps-3">קורס</span>
        <span>ציון בוגרים</span>
        <span>בוגרים ומחיר</span>
        <span />
      </div>
    </div>
  );
}

/**
 * רשימת התוצאות. כל השורות מוצגות: בנתוני הדוגמה יש 15 קורסים. עימוד יגיע כשיהיו מאות.
 * typeFirst: שם הסוג שהשורה "למה" מעלה לראש, כדי שההסבר יגיד את זה.
 * הערה שנכונה לכל הקורסים המתאימים נכתבת פעם אחת מעל הרשימה (marginNotes).
 * advisor: "לשאול על הקורסים האלה" אחרי הרשימה, מחוץ ל-#results. רק בדף הבית, ורק כשיש מפתח בשרת.
 */
export function Results({
  heading,
  results,
  typeFirst = null,
  advisor = false,
}: {
  heading: string;
  results: MatchResult[];
  typeFirst?: string | null;
  advisor?: boolean;
}) {
  const partial = results.some((r) => !r.full);
  const { shared, sharedCount, notes } = marginNotes(results);
  return (
    <>
      <section id="results" aria-labelledby="results-title" className="mt-[30px] scroll-mt-4 lg:mt-16 lg:scroll-mt-8">
        <div className="ms-(--margin) ps-3">
          <h2 id="results-title" className="pen-rule text-[21px] leading-snug font-bold lg:text-[30px]">
            {heading}
          </h2>
          <p className="mt-2 max-w-[70ch] font-sans text-[13px] leading-normal text-ink-soft lg:text-[15px]">
            מסודר לפי ציון בוגרים. סופרים רק בוגרים שהעלו הוכחה, ואף מוכר לא שילם על מקום ברשימה.
            {typeFirst && ` קורסים מסוג ${typeFirst} מופיעים קודם.`}
            {partial && ' קורס שמתאים חוץ מדבר אחד מופיע בסוף, וההערה בשוליים אומרת מה לא מתאים.'}
          </p>
          {shared && (
            <PenNote arrow className="mt-2 text-base font-medium lg:text-lg">
              {sharedCount === results.length
                ? `כל הקורסים ברשימה: ${shared}`
                : `${sharedCount} הקורסים הראשונים: ${shared}`}
            </PenNote>
          )}
        </div>
        {results.length === 0 ? (
          <p className="ms-(--margin) mt-4 ps-3 font-sans text-[15px]">
            אין קורס שמתאים לכל השורות. אפשר להוריד סימון משורה, והיא לא תסנן.
          </p>
        ) : (
          <>
            <LedgerHead />
            <div className="ruled-top">
              {results.map((result, i) => (
                <ResultRow
                  key={result.course.slug}
                  result={result}
                  note={notes[i]}
                  actions={<SaveButton courseId={result.course.id} title={result.course.title} />}
                />
              ))}
            </div>
          </>
        )}
        {/* למי שלא מצא (מסמך העיצוב, 3א.6). הבקשה עוד לא נבנתה, וההערה בעט אומרת את זה לפני הלחיצה. */}
        <p className="ms-(--margin) mt-2 ps-3 font-sans text-[15px] font-semibold">
          <Link
            href="/request-course"
            className="inline-flex min-h-11 flex-wrap items-center gap-x-2.5 hover:text-link-hover"
          >
            <span className="underline underline-offset-[3px]">לא מצאתם? בקשו שנבדוק קורס</span>
            <Soon />
          </Link>
        </p>
      </section>
      {advisor && results.length > 0 && (
        // רשימה אחרת מתחילה שאלה חדשה: תשובה על הרשימה הקודמת כבר לא נכונה לזו.
        <Advisor
          key={results
            .slice(0, MAX_COURSES)
            .map((r) => r.course.slug)
            .join(',')}
          courses={results.map((r) => r.course)}
        />
      )}
    </>
  );
}
