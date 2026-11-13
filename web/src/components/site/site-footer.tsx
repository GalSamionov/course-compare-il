import Link from 'next/link';

const footerLink = 'inline-flex min-h-11 items-center underline underline-offset-[3px] hover:text-link-hover';

/** שורת האמון מהציור, והקישורים לשיטה, ל"מי משלם לנו" ולטיוטות. */
export function SiteFooter() {
  return (
    <footer className="mt-8 border-t border-rule pt-4 pb-[30px] font-sans text-[13px] leading-normal text-ink-soft">
      <p className="text-[15px] font-bold text-balance text-ink">
        אף מוכר לא משלם לנו. לא על מקום, לא על ציון ולא על הסרת ביקורת.
      </p>
      <p className="mt-1 text-pretty">ביקורת מתפרסמת רק מבוגר שהעלה הוכחה: חשבונית, קבלה או תעודת סיום.</p>
      <p className="mt-1 flex flex-wrap gap-x-3">
        <Link href="/method" className={footerLink}>
          איך אנחנו מדרגים
        </Link>
        <Link href="/who-pays-us" className={footerLink}>
          מי משלם לנו
        </Link>
        <Link href="/privacy" className={footerLink}>
          פרטיות
        </Link>
        <Link href="/terms" className={footerLink}>
          תנאי שימוש
        </Link>
      </p>
      <p className="mt-1">עד ההשקה, כל הקורסים, המוסדות והביקורות באתר הם לדוגמה.</p>
    </footer>
  );
}
