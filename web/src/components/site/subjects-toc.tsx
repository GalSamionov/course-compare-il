import Link from 'next/link';
import type { CategoryEntry } from '@/lib/search/types';
import { cn } from '@/lib/utils';

/**
 * תוכן עניינים של התחומים, עם מספר הקורסים ומספר הבוגרים המאומתים. כמו בציור.
 * id="subjects" הוא היעד של "תחומים" בתפריט העליון.
 */
export function SubjectsToc({
  categories,
  heading = 'או לפי תחום',
  exclude,
  className,
}: {
  categories: CategoryEntry[];
  heading?: string;
  /** תחום שלא מופיע ברשימה: בעמוד תחום, התחום של העמוד. */
  exclude?: string;
  className?: string;
}) {
  // רק תחומים בלי תחומי משנה, כדי שקורס לא ייספר פעמיים ברשימה.
  const rows = categories
    .filter((c) => c.isLeaf && c.courseCount > 0 && c.slug !== exclude)
    .sort((a, b) => b.courseCount - a.courseCount || a.name.localeCompare(b.name, 'he'));
  if (rows.length === 0) return null;
  return (
    <section
      id="subjects"
      aria-labelledby="subjects-title"
      className={cn('mt-10 ms-(--margin) scroll-mt-4 ps-3 lg:mt-16 lg:scroll-mt-8', className)}
    >
      <h2 id="subjects-title" className="pen-rule text-[21px] leading-snug font-bold lg:text-[28px]">
        {heading}
      </h2>
      <div aria-hidden="true" className="mt-2.5 flex justify-end font-sans text-xs leading-tight text-ink-soft lg:text-[13px]">
        <span className="w-11 text-end">קורסים</span>
        <span className="w-[52px] text-end">בוגרים</span>
      </div>
      <ol className="tabular-nums">
        {rows.map((c) => (
          <li key={c.slug}>
            <Link
              href={`/categories/${c.slug}`}
              className="flex min-h-11 items-baseline pt-1.5 text-ink hover:text-link-hover lg:text-lg"
            >
              <span>{c.name}</span>
              <span aria-hidden="true" className="mx-2 flex-1 border-b-2 border-dotted border-leader" />
              <span aria-hidden="true" className="w-11 text-end font-sans text-[15px] font-bold">
                {c.courseCount}
              </span>
              <span aria-hidden="true" className="w-[52px] text-end font-sans text-[15px]">
                {c.gradCount}
              </span>
              <span className="sr-only">
                : {c.courseCount} קורסים, {c.gradCount} בוגרים מאומתים
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
