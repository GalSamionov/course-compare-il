import Link from 'next/link';
import type { CategoryEntry } from '@/lib/search/types';

/**
 * תוכן עניינים של התחומים, עם מספר הקורסים ומספר הבוגרים המאומתים. כמו בציור.
 * id="subjects" הוא היעד של "תחומים" בתפריט העליון.
 */
export function SubjectsToc({
  categories,
  heading = 'או לפי תחום',
}: {
  categories: CategoryEntry[];
  heading?: string;
}) {
  // רק תחומים בלי תחומי משנה, כדי שקורס לא ייספר פעמיים ברשימה.
  const rows = categories
    .filter((c) => c.isLeaf && c.courseCount > 0)
    .sort((a, b) => b.courseCount - a.courseCount || a.name.localeCompare(b.name, 'he'));
  if (rows.length === 0) return null;
  return (
    <section id="subjects" aria-labelledby="subjects-title" className="mt-9 ms-[70px] scroll-mt-4 ps-3">
      <h2 id="subjects-title" className="inline-block border-b-2 border-ink pb-0.5 text-[21px] leading-snug font-bold">
        {heading}
      </h2>
      <div aria-hidden="true" className="mt-2.5 flex justify-end font-sans text-xs leading-tight text-ink-soft">
        <span className="w-11 text-end">קורסים</span>
        <span className="w-[52px] text-end">בוגרים</span>
      </div>
      <ol className="tabular-nums">
        {rows.map((c) => (
          <li key={c.slug}>
            <Link
              href={`/categories/${c.slug}`}
              className="flex min-h-11 items-baseline pt-1.5 text-ink hover:text-link-hover"
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
