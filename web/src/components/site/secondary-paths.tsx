import Link from 'next/link';

const pathLink = 'flex min-h-11 items-center underline underline-offset-[3px] hover:text-link-hover';

/**
 * "או" והמסלולים מתחת לכפתור: בוגרים, מוסדות וחברות (3א.8). בסבב 2 כולם מובילים לעמודי "בקרוב".
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
          סיימתי קורס, רוצה לכתוב עליו
        </Link>
        <Link href="/institutions/join" className={pathLink}>
          אני מוסד או מרצה, רוצה להוסיף קורס
        </Link>
        <Link href="/companies" className={pathLink}>
          אנחנו חברה, מחפשים קורס או הרצאה לעובדים
        </Link>
      </div>
    </nav>
  );
}
