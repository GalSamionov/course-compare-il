import Link from 'next/link';
import { PenNote } from '@/components/course/marks';
import { buttonVariants } from '@/components/ui/button';
import type { CompareCourse } from '@/lib/compare/rows';
import { cn } from '@/lib/utils';

/**
 * בתחתית העמוד: קורסים שהוצאו בביקור הזה, עם "להחזיר", ולמחובר גם מה ששמר ולא בהשוואה, עם "להוסיף".
 * כשההשוואה מלאה הכפתורים מושבתים, וכתוב בעט שצריך להוציא קורס קודם.
 * כל פריט מאותו צד (The Not A Menu Rule): השם ומתחתיו המוסד, והכפתור אחריהם. השורה נכתבת אל הדף (data-anim="ink").
 */
export function CompareShelf({
  removed,
  saved,
  full,
  busy,
  onAdd,
}: {
  removed: readonly CompareCourse[];
  saved: readonly CompareCourse[];
  full: boolean;
  busy: string | null;
  onAdd: (course: CompareCourse) => void;
}) {
  const items = [
    ...removed.map((course) => ({ course, verb: 'להחזיר' })),
    ...saved.map((course) => ({ course, verb: 'להוסיף' })),
  ];
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="shelf-title" className="mt-12 font-sans lg:mt-16">
      <h2 id="shelf-title" className="pen-rule text-[21px] leading-snug font-bold lg:text-[28px]">
        {removed.length > 0 ? 'מה שהוצאתם' : 'מה ששמרתם'}
      </h2>
      {full && (
        <PenNote arrow className="mt-2">
          ההשוואה מלאה. כדי להחזיר קורס, מוציאים אחד מלמעלה.
        </PenNote>
      )}
      <ul className="mt-3 lg:max-w-[760px]">
        {items.map(({ course, verb }) => (
          <li key={course.id} data-anim="ink" className="ruled-row flex flex-wrap items-center gap-x-4 gap-y-2 py-3.5">
            <span className="min-w-0 flex-1 basis-[12rem]">
              <Link
                href={`/courses/${course.slug}`}
                className="-my-2.5 inline-flex min-h-11 items-center text-base leading-snug font-bold transition-colors duration-150 hover:text-link-hover"
              >
                <span className="pen-under">{course.title}</span>
              </Link>
              <span className="block text-sm text-ink-soft">{course.institutionName}</span>
            </span>
            <button
              type="button"
              disabled={full || busy === course.id}
              onClick={() => onAdd(course)}
              aria-label={`${verb} את ${course.title} להשוואה`}
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'h-11 cursor-pointer border-[1.5px] border-ink px-4 text-[15px] font-bold disabled:border-line disabled:text-ink-soft disabled:opacity-100',
              )}
            >
              {verb}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
