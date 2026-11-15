import Link from 'next/link';
import { StickyNote, type WashiTone } from '@/components/course/marks';
import { PenArrow } from '@/components/site/pen';
import type { Guide } from '@/lib/guides/guides';
import { cn } from '@/lib/utils';

const TILTS = [-1.4, 1.1, -0.8];
const WASHI: WashiTone[] = ['teal', 'peach', 'lilac'];

/**
 * המדריכים הקשורים, בסוף המדריך: פתקים לבנים עם מסקינג טייפ, כמו התחומים.
 * פתק לבן הוא מקום באתר ולא קול של אף אחד (DESIGN.md, The White Note Rule): כאן, מדריך אחר בסדרה.
 * מתחת לשם, מאותו צד, המקום שלו בסדרה.
 */
export function RelatedGuides({ guides, total }: { guides: Guide[]; total: number }) {
  if (guides.length === 0) return null;
  return (
    <section aria-labelledby="related-title" className="mt-14 lg:mt-20">
      <h2 id="related-title" className="pen-rule text-[21px] leading-snug font-bold lg:text-[28px]">
        עוד מדריכים לפני שמשלמים
      </h2>
      <ul className="mt-8 grid gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-8">
        {guides.map((g, i) => (
          <li key={g.slug} className="flex">
            <Link href={`/guides/${g.slug}`} className="group flex w-full text-ink">
              <StickyNote
                tone="paper"
                tilt={TILTS[i % TILTS.length]}
                washi={WASHI[i % WASHI.length]}
                className={cn(
                  'flex min-h-[96px] w-full flex-col px-4 pt-4 pb-3',
                  'transition-[translate,box-shadow] duration-200 ease-out group-hover:-translate-y-1 group-focus-visible:-translate-y-1',
                  'group-hover:shadow-[0_0_0_1px_rgb(30_36_44/0.08),0_2px_3px_rgb(30_36_44/0.08),0_18px_20px_-12px_rgb(30_36_44/0.42)]',
                )}
              >
                <span className="text-[16px] leading-snug font-bold text-balance group-hover:text-link-hover lg:text-[17px]">
                  <span className="pen-under">{g.title}</span>
                </span>
                <span className="mt-auto flex items-end justify-between gap-2 pt-2 text-[13px] leading-tight text-ink-soft lg:text-sm">
                  <span>
                    מדריך {g.order} מתוך {total}
                  </span>
                  <PenArrow className="me-0 h-[0.75em] w-[1.4em] flex-none opacity-0 transition-[opacity,translate] duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 motion-safe:translate-x-1 motion-safe:group-hover:translate-x-0" />
                </span>
              </StickyNote>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
