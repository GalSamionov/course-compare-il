import Link from 'next/link';

/** הכותרת של כל עמוד: שם האתר, והשורה "אף מוכר לא משלם לנו". */
export function SiteHeader() {
  return (
    <header className="flex items-center justify-between border-b border-rule pt-4 pb-3 font-sans">
      <Link href="/" className="text-[19px] font-bold hover:text-link-hover">
        [שם האתר]
      </Link>
      <span className="text-xs text-ink-soft">אף מוכר לא משלם לנו</span>
    </header>
  );
}
