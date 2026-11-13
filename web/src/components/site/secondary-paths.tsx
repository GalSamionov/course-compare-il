import Link from 'next/link';

const pathLink = 'flex min-h-11 items-center underline underline-offset-[3px] hover:text-link-hover';

/** "או" והמסלולים מתחת לכפתור: בוגרים, מוסדות וחברות (3א.8). בסבב 2 כולם מובילים לעמודי "בקרוב". */
export function SecondaryPaths() {
  return (
    <nav aria-label="לא מחפשים קורס" className="mt-3 grid grid-cols-[70px_minmax(0,1fr)] font-sans">
      <span className="pt-[11px] text-[13px] leading-snug text-ink-soft">או</span>
      <div className="ps-3 text-[15px] leading-snug">
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
