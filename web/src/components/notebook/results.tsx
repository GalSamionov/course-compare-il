import Link from 'next/link';
import { Mark } from '@/components/course/marks';
import { formatIls } from '@/lib/format';
import type { MatchResult } from '@/lib/search/match';
import { PRODUCT_TYPE_LABEL } from '@/lib/search/types';

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

/** שורת תוצאה בסגנון הסיכום: ההערה בעט בשוליים מימין, והקורס משמאלה. */
export function ResultRow({ result }: { result: MatchResult }) {
  const { course, note } = result;
  const product = PRODUCT_TYPE_LABEL[course.productType];
  return (
    <article className="grid grid-cols-[70px_minmax(0,1fr)] border-b border-rule pt-4 pb-[18px]">
      {/* הקורס ראשון בקוד, כדי שקורא מסך יקרא את השם לפני ההערה. העמודות קובעות את המיקום. */}
      <div className="col-start-2 row-start-1 ps-3">
        <h3 className="text-[19px] leading-snug font-bold">
          <Link href={`/courses/${course.slug}`} className="hover:text-link-hover hover:underline">
            {course.title}
          </Link>
        </h3>
        <p className="mt-0.5 font-sans text-sm leading-normal text-ink-soft">
          {course.institutionName}
          {product && ` · ${product}`}
        </p>
        {course.score.status === 'scored' ? (
          <p className="mt-2 flex items-baseline gap-1.5 font-sans text-sm leading-tight">
            <span aria-hidden="true" className="font-serif text-[26px] leading-none font-bold">
              {course.score.value.toFixed(1)}
            </span>
            <span aria-hidden="true">ציון בוגרים מתוך 10</span>
            <span className="sr-only">ציון בוגרים {course.score.value.toFixed(1)} מתוך 10</span>
          </p>
        ) : (
          <p className="mt-2 font-sans text-[15px] leading-snug">
            <strong>עוד אין ציון בוגרים.</strong>
            {course.score.status === 'not_enough_reviews' && course.score.reviewsNeeded > 0 && (
              <>
                {' '}
                <span className="text-ink-soft">{missingText(course.score.reviewsNeeded)}</span>
              </>
            )}
          </p>
        )}
        <p className="mt-1.5 font-sans text-[15px] leading-normal tabular-nums">
          {verifiedText(course.verifiedCount)} ·{' '}
          {course.sitePrice !== null ? (
            <strong>
              <bdi dir="rtl">{formatIls(course.sitePrice)}</bdi>
            </strong>
          ) : (
            <span className="text-ink-soft">המוסד לא מפרסם מחיר</span>
          )}
        </p>
        {course.highlight && (
          <p className="mt-1.5 font-sans text-[15px] leading-normal">
            <Mark source="grads">
              {course.highlight.label}: {course.highlight.text}
            </Mark>
          </p>
        )}
      </div>
      <p className="col-start-1 row-start-1 -rotate-3 pt-1.5 pe-2 font-pen text-sm leading-snug font-medium text-pen">
        {note && (
          <>
            <span aria-hidden="true">← </span>
            {note}
          </>
        )}
      </p>
    </article>
  );
}

/**
 * רשימת התוצאות. כל השורות מוצגות: בנתוני הדוגמה יש 15 קורסים. עימוד יגיע כשיהיו מאות.
 * typeFirst: שם הסוג שהשורה "למה" מעלה לראש, כדי שההסבר יגיד את זה.
 */
export function Results({
  heading,
  results,
  typeFirst = null,
}: {
  heading: string;
  results: MatchResult[];
  typeFirst?: string | null;
}) {
  const partial = results.some((r) => !r.full);
  return (
    <section id="results" aria-labelledby="results-title" className="mt-[30px] scroll-mt-4">
      <div className="ms-[70px] ps-3">
        <h2
          id="results-title"
          className="inline-block border-b-2 border-ink pb-0.5 text-[21px] leading-snug font-bold"
        >
          {heading}
        </h2>
        <p className="mt-2 font-sans text-[13px] leading-normal text-ink-soft">
          מסודר לפי ציון בוגרים. סופרים רק בוגרים שהעלו הוכחה, ואף מוכר לא שילם על מקום ברשימה.
          {typeFirst && ` קורסים מסוג ${typeFirst} מופיעים קודם.`}
          {partial && ' קורס שמתאים חוץ מדבר אחד מופיע בסוף, וההערה בשוליים אומרת מה לא מתאים.'}
        </p>
      </div>
      {results.length === 0 ? (
        <p className="ms-[70px] mt-4 ps-3 font-sans text-[15px]">
          אין קורס שמתאים לכל השורות. אפשר להוריד סימון משורה, והיא לא תסנן.
        </p>
      ) : (
        results.map((result) => <ResultRow key={result.course.slug} result={result} />)
      )}
      {/* למי שלא מצא (מסמך העיצוב, 3א.6). */}
      <p className="ms-[70px] mt-3.5 ps-3 font-sans text-[15px] font-semibold">
        <Link href="/request-course" className="underline underline-offset-[3px] hover:text-link-hover">
          לא מצאתם? בקשו שנבדוק קורס
        </Link>
      </p>
    </section>
  );
}
