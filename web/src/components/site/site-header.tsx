import Link from 'next/link';
import { AccountLink } from './account-link';
import { Wordmark } from './wordmark';

const navLink =
  'inline-flex min-h-11 items-center underline-offset-[5px] decoration-pen decoration-[1.5px] hover:text-link-hover hover:underline';

/**
 * הכותרת של כל עמוד: שם האתר, "אף מוכר לא משלם לנו", והתפריט (מסמך העיצוב, 3א.1).
 * הקישור האחרון: "התחברות", או "האזור שלי" למי שמחובר (סעיף 5).
 * במחשב הכול בשורה אחת, כמו כותרת של דף מודפס.
 */
export function SiteHeader() {
  return (
    <header className="flex flex-wrap items-center gap-x-4 border-b border-rule pt-3.5 pb-1 font-sans lg:gap-x-6 lg:pt-10 lg:pb-4">
      <Wordmark />
      <p className="ms-auto text-xs leading-tight font-semibold text-ink-soft lg:ms-0 lg:text-sm">אף מוכר לא משלם לנו</p>
      <nav aria-label="ראשי" className="mt-1 flex basis-full flex-wrap gap-x-5 text-sm lg:ms-auto lg:mt-0 lg:basis-auto lg:gap-x-7 lg:text-[15px] lg:font-semibold">
        <Link href="/courses#subjects" className={navLink}>
          תחומים
        </Link>
        <Link href="/method" className={navLink}>
          איך אנחנו מדרגים
        </Link>
        <AccountLink className={navLink} />
      </nav>
    </header>
  );
}
