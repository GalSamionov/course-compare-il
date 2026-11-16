import Link from 'next/link';
import { PenArrow } from '@/components/site/pen';
import { Soon } from '@/components/site/soon';
import { cn } from '@/lib/utils';

/**
 * soon: המסלול עוד לא נבנה, ולכן "נפתח בקרוב" על המסגרת. כתיבת ביקורת פתוחה מסבב 3, והוספת קורס והפנייה של חברות מסבב 5.
 * ההסבה להייטק ראשונה: זה המסלול שממנו מגיעים המשתמשים הראשונים (docs/b2b/2026-11-15-go-to-market.md, מסלול 2).
 */
const PATHS = [
  { href: '/career-change', label: 'רוצה לעבור להייטק, ולבחור קורס הסבה', soon: false },
  { href: '/review', label: 'סיימתי קורס, רוצה לכתוב עליו', soon: false },
  { href: '/institutions/join', label: 'אני מוסד או מרצה, רוצה להוסיף קורס', soon: false },
  { href: '/companies', label: 'אנחנו חברה, מחפשים קורס או הרצאה לעובדים', soon: false },
  { href: '/guides', label: 'עוד לא בחרתי, רוצה לדעת מה לבדוק לפני שמשלמים', soon: false },
];

/**
 * "או" והמסלולים מתחת לכפתור: בוגרים, מוסדות וחברות (3א.8).
 * כל מסלול הוא מסגרת דקה ושקטה. מסלול שעוד לא נפתח מקבל "נפתח בקרוב" בעט על הקו העליון, לפני הלחיצה,
 * כמו "כתיבת ביקורת" בעמוד הקורס. ההערה בתוך הקישור, ולכן גם קורא מסך שומע אותה.
 * לא רשימה של קישורים עם קו תחתון: שלוש שורות טקסט זו מתחת לזו נקראו כמו תפריט (משוב מ-14.11.2026).
 * בריחוף המסגרת והטקסט עוברים לעט. במחשב הם עומדים ליד המחברת, בלי שוליים משלהם.
 */
export function SecondaryPaths() {
  return (
    <nav
      aria-label="לא מחפשים קורס"
      className="mt-6 grid grid-cols-[var(--margin)_minmax(0,1fr)] font-sans lg:mt-12 lg:block lg:border-s lg:border-rule lg:ps-8"
    >
      <span className="pt-[15px] text-[13px] leading-snug text-ink-soft lg:block lg:pt-0 lg:font-pen lg:text-lg lg:font-medium lg:text-pen">
        או
      </span>
      <ul className="flex flex-col gap-4 ps-3 lg:mt-3 lg:ps-0">
        {PATHS.map((p) => (
          <li key={p.href}>
            <Link
              href={p.href}
              className={cn(
                'group relative flex min-h-11 items-center gap-2.5 rounded-[4px] border border-ruled bg-white px-3 py-2',
                'text-[14px] leading-snug text-ink lg:text-[15px]',
                'transition-[color,border-color] duration-150 hover:border-pen hover:text-link-hover focus-visible:border-pen',
                'active:translate-y-px',
              )}
            >
              <span className="min-w-0 flex-1 text-pretty">{p.label}</span>
              <PenArrow className="me-0 h-[0.7em] w-[1.3em] flex-none text-ink-soft transition-colors duration-150 group-hover:text-pen" />
              {/* "נפתח בקרוב" יושב על הקו העליון, על רקע הנייר, כמו הערה שנכתבה על המסגרת. */}
              {p.soon && <Soon className="absolute -top-[8px] end-2.5 bg-white px-1 text-[12px] lg:text-[13px]" />}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
