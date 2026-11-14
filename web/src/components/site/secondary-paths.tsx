import Link from 'next/link';
import { PenNote } from '@/components/course/marks';

const pathLink = 'flex min-h-11 items-center underline underline-offset-[3px] hover:text-link-hover';

/** חלק משם הקישור לקורא מסך: אותו דבר שכתוב בעט מתחת לשלושת המסלולים. */
const soon = <span className="sr-only">, נפתח בקרוב</span>;

/**
 * "או" והמסלולים מתחת לכפתור: בוגרים, מוסדות וחברות (3א.8). שלושתם עוד לא נבנו ומובילים לעמוד
 * שמסביר מה יהיה שם. לכן מתחתם כתוב בעט שהם נפתחים בקרוב, לפני הלחיצה, ואותו דבר נמצא בשם של כל קישור.
 * במחשב הם עומדים ליד המחברת, בלי שוליים משלהם.
 */
export function SecondaryPaths() {
  return (
    <nav
      aria-label="לא מחפשים קורס"
      className="mt-3 grid grid-cols-[var(--margin)_minmax(0,1fr)] font-sans lg:mt-12 lg:block lg:border-s lg:border-rule lg:ps-8"
    >
      <span className="pt-[11px] text-[13px] leading-snug text-ink-soft lg:block lg:pt-0 lg:font-pen lg:text-lg lg:font-medium lg:text-pen">
        או
      </span>
      <div className="ps-3 text-[15px] leading-snug lg:mt-1 lg:ps-0 lg:text-base">
        <Link href="/review" className={pathLink}>
          סיימתי קורס, רוצה לכתוב עליו{soon}
        </Link>
        <Link href="/institutions/join" className={pathLink}>
          אני מוסד או מרצה, רוצה להוסיף קורס{soon}
        </Link>
        <Link href="/companies" className={pathLink}>
          אנחנו חברה, מחפשים קורס או הרצאה לעובדים{soon}
        </Link>
        <PenNote arrow className="mt-1 text-sm lg:text-[15px]">
          שלושת אלה נפתחים בקרוב
        </PenNote>
      </div>
    </nav>
  );
}
