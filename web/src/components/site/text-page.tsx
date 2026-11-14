import { Sheet } from './sheet';

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
    <Sheet narrow>
      <main className="text-page pt-[22px] lg:pt-12">
        <h1 className="text-[30px] leading-tight font-bold text-balance lg:text-[48px]">{title}</h1>
        {draft && (
          <p className="mt-2 inline-block border border-ink px-2 py-0.5 font-sans text-[13px] font-bold">
            טיוטה, לפני בדיקה של עורך דין
          </p>
        )}
        <div className="max-w-[65ch] lg:text-[17px]">{children}</div>
      </main>
    </Sheet>
  );
}
