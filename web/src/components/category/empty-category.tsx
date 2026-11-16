import Link from 'next/link';
import { Sheet } from '@/components/site/sheet';
import { SubjectsToc } from '@/components/site/subjects-toc';
import type { CategoryEntry } from '@/lib/search/types';

const actionLink = 'inline-flex min-h-11 items-center underline underline-offset-[3px] hover:text-link-hover';

/**
 * תחום שעוד אין בו קורס ברשימות (למשל אחרי שקורסי הדוגמה הוסתרו, או לפני שגל אישר קורס מהאוסף).
 * בלי המחברת: שורות שמסננות רשימה ריקה רק היו מבטיחות תוצאות. במקומה דף ריק במחברת שאומר למה הוא ריק,
 * מה אפשר לעשות (לבקש שנבדוק קורס, או לכל הקורסים), והתחומים האחרים כפתקים, כמו בעמוד תחום רגיל.
 * התחום לא מופיע בניווט ולא במפת האתר, והעמוד noindex (lib/seo/indexing.ts). הוא קיים בשביל קישור ישן.
 */
export function EmptyCategory({
  category,
  categories,
  before,
}: {
  category: Pick<CategoryEntry, 'slug' | 'name' | 'description'>;
  categories: CategoryEntry[];
  /** פירורי הלחם, כמו בעמוד תחום עם קורסים. */
  before?: React.ReactNode;
}) {
  return (
    <Sheet>
      <main id="main">
        <div className="lg:mt-4">
          {before}
          <h1 className="mt-[22px] text-[30px] leading-tight font-bold text-balance lg:mt-8 lg:text-[54px] lg:leading-[1.08]">
            {category.name}
          </h1>
          <p className="mt-2 max-w-[60ch] font-sans text-[15px] leading-normal text-ink-soft lg:mt-3 lg:text-lg">
            {category.description && <span className="text-ink">{category.description} </span>}
            עוד אין בתחום קורס באתר.
          </p>
        </div>
        {/* קו השוליים, כמו מתחת למחברת בעמוד תחום. השורות הריקות הן הדף שעוד לא כתבו בו. */}
        <div className="margin-rule mt-4 lg:mt-8">
          <section aria-label="למה אין כאן קורסים" className="pt-1">
            <p className="ms-(--margin) max-w-[60ch] ps-3 text-base leading-[1.7] text-pretty lg:text-[17px]">
              קורס עולה לאתר רק אחרי שבדקנו את הפרטים שלו מול האתר של המוסד. קורס בתחום הזה יופיע כאן אחרי הבדיקה.
            </p>
            <div aria-hidden="true" className="ruled-row h-[30px]" />
            <div aria-hidden="true" className="ruled-row h-[38px]" />
            <ul className="ms-(--margin) mt-2 ps-3 font-sans text-[15px] font-semibold">
              <li>
                <Link href="/request-course" className={actionLink}>
                  ראיתם קורס בתחום? בקשו שנבדוק אותו
                </Link>
              </li>
              <li>
                <Link href="/courses" className={actionLink}>
                  לכל הקורסים באתר
                </Link>
              </li>
            </ul>
          </section>
          <SubjectsToc
            categories={categories}
            heading="תחומים שיש בהם קורסים"
            exclude={category.slug}
            className="lg:max-w-[620px]"
          />
        </div>
      </main>
    </Sheet>
  );
}
