import Link from 'next/link';
import { AccountLink } from './account-link';

const navLink = 'inline-flex min-h-11 items-center underline-offset-[3px] hover:text-link-hover hover:underline';

/**
 * הכותרת של כל עמוד: שם האתר, "אף מוכר לא משלם לנו", והתפריט (מסמך העיצוב, 3א.1).
 * הקישור האחרון: "התחברות", או "האזור שלי" למי שמחובר (סעיף 5).
 */
export function SiteHeader() {
  return (
    // pt-[11px]: הקישור לשם האתר בגובה 44, והטקסט שלו נשאר 16 פיקסלים מראש הדף, כמו בציור.
    <header className="border-b border-rule pt-[11px] font-sans">
      <div className="flex items-center justify-between">
        <Link href="/" className="inline-flex min-h-11 items-center text-[19px] font-bold hover:text-link-hover">
          [שם האתר]
        </Link>
        <span className="text-xs text-ink-soft">אף מוכר לא משלם לנו</span>
      </div>
      <nav aria-label="ראשי" className="flex flex-wrap gap-x-4 text-sm">
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
