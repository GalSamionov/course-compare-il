import Link from 'next/link';
import { Claim, Mark } from '@/components/course/marks';
import { PenNumber } from '@/components/site/pen';
import type { CompareCell, CompareCourse, CompareSection } from '@/lib/compare/rows';
import { keepShekelWithAmount } from '@/lib/format';
import { cn } from '@/lib/utils';

/**
 * בנייד: עמודה לכל קורס, והתווית של כל שורה בשורה משלה מעליה.
 * במחשב: עמודת תוויות מימין, ועמודה לכל קורס, עד 22rem כל אחת: עם קורס אחד או שניים הטקסט לא נמתח
 * לרוחב כל הדף, והשורות עדיין נמשכות עד קצה הנייר. --cols: כמה קורסים בהשוואה.
 */
const grid =
  'grid grid-cols-[repeat(var(--cols),minmax(0,1fr))] gap-x-3 lg:grid-cols-[11rem_repeat(var(--cols),minmax(0,22rem))] lg:gap-x-8';
const smallLink = 'underline decoration-1 underline-offset-[3px] transition-colors duration-150 hover:text-link-hover';

/** תא אחד, עם אותו סימון כמו בעמוד הקורס. בלי "מנצח": שום ערך לא מסומן כטוב יותר. */
function CellView({ cell }: { cell: CompareCell }) {
  if (cell.text === null) return <span className="text-[13px] leading-snug text-ink-soft">{cell.missing ?? 'אין נתון'}</span>;
  if (cell.bar !== undefined) {
    // כמו בטבלה של "מה הבוגרים אומרים": פס במרקר הצהוב באורך הממוצע מתוך 5. הפס קישוט, המספר נקרא.
    // המספר בתחילת התא ואחריו הפס: בעמודות צמודות, מספר בסוף התא היה נצמד לפס של הקורס הבא.
    return (
      <span className="flex items-center gap-2 tabular-nums">
        <span className="w-7 flex-none text-[15px] font-bold">{cell.text}</span>
        <span aria-hidden="true" className="relative h-[15px] flex-1">
          <span
            className="hl hl-grads absolute inset-y-0 start-0 block p-0"
            data-tilt="a"
            style={{ width: `${Math.max(4, Math.min(100, (cell.bar / 5) * 100))}%` }}
          />
        </span>
      </span>
    );
  }
  const value = cell.links ? (
    <span className="flex flex-col gap-1.5">
      {cell.links.map((link) => (
        <span key={link.href}>
          {/* יעד מגע של 44 פיקסלים בלי להגדיל את השורה. */}
          <Link href={link.href} className={cn('-my-2.5 inline-flex min-h-11 items-center font-semibold', smallLink)}>
            {link.label}
          </Link>
          {link.sub && <span className="block text-[13px] leading-snug text-ink-soft">{link.sub}</span>}
        </span>
      ))}
    </span>
  ) : cell.source === 'claim' ? (
    <Claim>{keepShekelWithAmount(cell.text)}</Claim>
  ) : cell.source ? (
    // ₪ צמוד לסכום: בעמודה צרה (שני קורסים ב-375) הוא לא יורד לבד לשורה, גם עם הסימן בעט בתחילת המרקר.
    <Mark source={cell.source}>{keepShekelWithAmount(cell.text)}</Mark>
  ) : (
    keepShekelWithAmount(cell.text)
  );
  return (
    <span className="block">
      {cell.lead && <span className="font-bold">{cell.lead} </span>}
      <span
        className={
          cell.big
            ? 'text-[30px] leading-none font-bold tabular-nums lg:text-[40px]'
            : 'text-[15px] leading-relaxed text-pretty tabular-nums lg:text-base'
        }
      >
        {value}
      </span>
      {cell.sub && <span className="mt-1 block text-[13px] leading-snug text-ink-soft">{cell.sub}</span>}
    </span>
  );
}

const tableName = (n: number) => (n === 1 ? 'השוואה של קורס אחד' : `השוואה של ${n} קורסים`);

/**
 * הטבלה: ראש דביק עם מספר מוקף ושם לכל קורס, שורה עם המוסד ו"להוציא", וחלק לכל נושא.
 * role על div ולא <table>: רשת CSS על רכיבי טבלה מוחקת את הסמנטיקה בחלק מהדפדפנים.
 * שורת figure נשארת בעמודות גם בנייד. בשורת text כל תא יורד לשורה משלו בנייד, עם המספר של הקורס
 * (עם קורס אחד אין צורך במספר).
 * הראש הדביק בלי צל (The Objects Only Rule): קו דיו מתחתיו, שנמשך עד קצה הנייר כמו קווי השורות,
 * והרקע שלו מכסה גם את הקווים שעוברים מתחתיו בשוליים.
 */
export function CompareTable({
  courses,
  sections,
  busy,
  onRemove,
}: {
  courses: readonly CompareCourse[];
  sections: readonly CompareSection[];
  /** הקורס שהפעולה עליו עוד רצה. */
  busy: string | null;
  onRemove: (course: CompareCourse) => void;
}) {
  const numbered = courses.length > 1;
  return (
    <div
      role="table"
      aria-label={tableName(courses.length)}
      style={{ '--cols': courses.length } as React.CSSProperties}
      className="mt-5 font-sans lg:mt-8"
    >
      <div
        role="rowgroup"
        className="sticky top-0 z-[2] -ms-(--sheet-pad) border-b-[1.5px] border-ink bg-paper ps-(--sheet-pad) pt-2.5 pb-2.5 lg:pt-3 lg:pb-3"
      >
        <div role="row" className={grid}>
          <span role="columnheader" className="sr-only lg:not-sr-only lg:self-end lg:text-sm lg:text-ink-soft">
            מה משווים
          </span>
          {courses.map((course, i) => (
            <div role="columnheader" key={course.id} className="min-w-0">
              {/* בנייד המספר מעל השם, כדי שלשם יהיה כל רוחב העמודה גם עם שלושה קורסים. במחשב הם זה לצד זה. */}
              <span className="flex flex-col items-start gap-1 lg:flex-row lg:gap-2">
                <PenNumber n={i + 1} className="size-[26px] text-[15px] lg:size-[30px] lg:text-[17px]" />
                <Link
                  href={`/courses/${course.slug}`}
                  className="line-clamp-3 text-[15px] leading-snug font-bold transition-colors duration-150 hover:text-link-hover hover:underline lg:pt-0.5 lg:text-[17px]"
                >
                  {course.title}
                </Link>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div role="rowgroup">
        <div role="row" data-row="institution" className={cn(grid, 'ruled-row pt-2.5 pb-1 lg:pt-3')}>
          <span role="rowheader" className="sr-only lg:not-sr-only lg:text-[15px] lg:font-bold">
            המוסד
          </span>
          {courses.map((course) => (
            <div role="cell" key={course.id} className="flex min-w-0 flex-col items-start justify-between">
              {/* לפחות 24 פיקסלים לגובה: הקישור צמוד ל"להוציא", ושני יעדים קטנים וצמודים קשים ללחיצה (WCAG 2.5.8). */}
              <Link
                href={`/institutions/${course.institutionSlug}`}
                className={cn('inline-flex min-h-6 items-center text-sm leading-snug', smallLink)}
              >
                {course.institutionName}
              </Link>
              <button
                type="button"
                disabled={busy === course.id}
                onClick={() => onRemove(course)}
                data-compare-remove={course.id}
                aria-label={`להוציא את ${course.title} מההשוואה`}
                className="flex h-11 cursor-pointer items-center text-sm font-semibold underline decoration-1 underline-offset-[3px] transition-colors duration-150 hover:text-link-hover disabled:cursor-wait disabled:text-ink-soft"
              >
                להוציא
              </button>
            </div>
          ))}
        </div>
      </div>

      {sections.map((section) => (
        <div role="rowgroup" key={section.key}>
          <div role="row" className="mt-9 lg:mt-12">
            <span role="rowheader" aria-colspan={courses.length + 1} className="block">
              <h2 className="pen-rule text-[21px] leading-snug font-bold lg:text-[28px]">{section.title}</h2>
            </span>
          </div>
          {section.rows.map((row) => (
            <div role="row" key={row.key} data-row={row.key} data-anim="ink" className={cn(grid, 'ruled-row py-3 lg:py-4')}>
              <span role="rowheader" className="col-span-full text-[13px] leading-snug font-bold lg:col-span-1 lg:pt-0.5 lg:text-[15px]">
                {row.label}
              </span>
              {row.cells.map((cell, i) => (
                <div
                  role="cell"
                  key={courses[i].id}
                  className={cn(
                    'mt-1.5 min-w-0 lg:mt-0',
                    row.kind === 'text' &&
                      numbered &&
                      'max-lg:col-span-full max-lg:mt-2.5 max-lg:grid max-lg:grid-cols-[24px_minmax(0,1fr)] max-lg:items-baseline max-lg:gap-x-2.5',
                    row.kind === 'text' && !numbered && 'max-lg:col-span-full',
                  )}
                >
                  {row.kind === 'text' && numbered && (
                    <PenNumber n={i + 1} className="size-[22px] text-[13px] lg:hidden" />
                  )}
                  <CellView cell={cell} />
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
