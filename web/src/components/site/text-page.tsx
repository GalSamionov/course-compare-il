import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';

/** עמוד טקסט: אותו דף סיכום, עם עמודת קריאה אחת. */
export function TextPage({
  title,
  draft = false,
  children,
}: {
  title: string;
  /** תווית "טיוטה" לפרטיות ולתנאי השימוש, עד הבדיקה המשפטית. */
  draft?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[680px] px-[22px]">
      <SiteHeader />
      <main className="text-page pt-[22px]">
        <h1 className="text-[30px] leading-tight font-bold text-balance">{title}</h1>
        {draft && (
          <p className="inline-block border border-ink px-2 py-0.5 font-sans text-[13px] font-bold">
            טיוטה, לפני בדיקה של עורך דין
          </p>
        )}
        <div className="max-w-[65ch]">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}
