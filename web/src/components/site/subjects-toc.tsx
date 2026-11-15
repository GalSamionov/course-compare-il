import Link from 'next/link';
import { PenNote, StickyNote, type WashiTone } from '@/components/course/marks';
import { PenArrow, PenLoop } from '@/components/site/pen';
import type { CategoryEntry } from '@/lib/search/types';
import { cn } from '@/lib/utils';

const coursesText = (n: number) => (n === 1 ? 'קורס אחד' : `${n} קורסים`);
const gradsText = (n: number) => (n === 1 ? 'בוגר אחד' : `${n} בוגרים`);

/** הטיות לסירוגין, כדי שהפתקים ייראו מודבקים ביד ולא מסודרים ברשת. עד 2 מעלות. */
const TILTS = [-1.6, 1.2, -0.7, 1.8, -1.2, 0.8];
/** מסקינג טייפ בשלושה גוונים לסירוגין. */
const WASHI: WashiTone[] = ['lilac', 'teal', 'peach'];

/**
 * התחומים כפתקים לבנים מודבקים: שם התחום, ומתחתיו, מאותו צד, כמה קורסים וכמה בוגרים מאומתים.
 * לא שורה של שם ומספר בקצה השני: זה המבנה של תפריט מסעדה (משוב מ-14.11.2026).
 * לבן ולא צהוב: פתק צהוב הוא קול של בוגר (DESIGN.md), ותחום הוא מקום באתר.
 * id="subjects" הוא היעד של "תחומים" בתפריט העליון.
 * מספר הבוגרים הגדול ברשימה מוקף בעט, והערה בעט אומרת מה העיגול אומר. עט ולא מרקר:
 * מרקר הוא מקור (ירוק, צהוב, ורוד), ועיגול הוא האתר שמצביע על עובדה מהרשימה עצמה.
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
  // התחום עם הכי הרבה בוגרים מאומתים. בתיקו, הראשון ברשימה. בלי בוגרים בכלל, אין עיגול.
  const busiest = rows.reduce<CategoryEntry | null>((top, c) => (c.gradCount > (top?.gradCount ?? 0) ? c : top), null);
  return (
    <section
      id="subjects"
      aria-labelledby="subjects-title"
      className={cn('mt-10 ms-(--margin) scroll-mt-4 ps-3 lg:mt-16 lg:scroll-mt-8', className)}
    >
      <h2 id="subjects-title" className="pen-rule text-[21px] leading-snug font-bold lg:text-[28px]">
        {heading}
      </h2>
      <ol className="mt-7 grid grid-cols-2 gap-x-3 gap-y-6 tabular-nums lg:mt-8 lg:gap-x-5 lg:gap-y-7">
        {rows.map((c, i) => (
          <li key={c.slug} className="flex">
            <Link href={`/categories/${c.slug}`} className="group flex w-full text-ink">
              <StickyNote
                tone="paper"
                tilt={TILTS[i % TILTS.length]}
                washi={WASHI[i % WASHI.length]}
                className={cn(
                  'flex min-h-[84px] w-full flex-col px-3 pt-3.5 pb-2.5 text-[13px]',
                  // בריחוף הפתק מתרומם מעט מהדף, והעט מותח קו מתחת לשם.
                  'transition-[translate,box-shadow] duration-200 ease-out group-hover:-translate-y-1 group-focus-visible:-translate-y-1',
                  'group-hover:shadow-[0_0_0_1px_rgb(30_36_44/0.08),0_2px_3px_rgb(30_36_44/0.08),0_18px_20px_-12px_rgb(30_36_44/0.42)]',
                )}
              >
                <span className="text-[16px] leading-snug font-bold group-hover:text-link-hover lg:text-[17px]">
                  <span className="pen-under">{c.name}</span>
                </span>
                <span className="mt-auto flex items-end justify-between gap-1.5 pt-2 font-sans leading-tight text-ink-soft lg:text-sm">
                  {/* שתי שורות קבועות: קורסים, ומתחתם בוגרים. כך גם פתק צר בנייד לא שובר באמצע. */}
                  <span className="flex flex-col gap-0.5">
                    <span>
                      {coursesText(c.courseCount)}
                      <span className="sr-only">,</span>
                    </span>
                    <span>
                      {c === busiest ? (
                        <PenLoop className="font-bold text-ink">{gradsText(c.gradCount)}</PenLoop>
                      ) : (
                        gradsText(c.gradCount)
                      )}
                      <span className="sr-only"> מאומתים{c === busiest ? ', הכי הרבה בוגרים ברשימה' : ''}</span>
                    </span>
                  </span>
                  <PenArrow className="me-0 h-[0.75em] w-[1.4em] flex-none opacity-0 transition-[opacity,translate] duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 motion-safe:translate-x-1 motion-safe:group-hover:translate-x-0" />
                </span>
              </StickyNote>
            </Link>
          </li>
        ))}
      </ol>
      {busiest && (
        <PenNote className="ms-auto mt-4 w-fit lg:text-base">
          בעיגול: הכי הרבה בוגרים מאומתים
        </PenNote>
      )}
    </section>
  );
}
