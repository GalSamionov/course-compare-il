import { Suspense } from 'react';
import { SiteFooter } from '@/components/site/site-footer';
import { SiteHeader } from '@/components/site/site-header';
import { Notebook, NotebookFromUrl, type NotebookProps } from './notebook';

/**
 * הדף של המחברת: דף הבית, עמוד תחום וכל הקורסים.
 * הדף סטטי. התשובות שבכתובת נקראות בדפדפן, בתוך <Suspense>.
 * עד אז מוצגת אותה מחברת עם מה שממולא מראש, כך שבכתובת בלי תשובות אין קפיצה.
 */
export function NotebookPage({
  heading,
  tagline,
  intro,
  before,
  after,
  ...props
}: NotebookProps & {
  heading: string;
  /** מתחת לכותרת, מה האתר. בדף הבית (מסמך העיצוב, 3א.1). */
  tagline?: string;
  intro: string;
  /** לפני הכותרת. בעמוד תחום: פירורי הלחם. */
  before?: React.ReactNode;
  /** אחרי הרשימה. בדף הבית: הבוגרים, התחומים ואיך האימות עובד. */
  after?: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[680px] px-[22px]">
      <SiteHeader />
      <main>
        {before}
        <h1 className="mt-[22px] text-[30px] leading-tight font-bold text-balance">{heading}</h1>
        {tagline && <p className="mt-2 font-sans text-[15px] leading-normal font-semibold text-pretty">{tagline}</p>}
        <p className={`${tagline ? 'mt-1' : 'mt-2'} font-sans text-[15px] leading-normal text-ink-soft`}>{intro}</p>
        {/* קו השוליים ב-70 פיקסלים: לאורך המחברת, הרשימה והחלקים שאחריה, כמו בציור (HomeB). */}
        <div className="relative mt-4">
          <div aria-hidden="true" className="absolute inset-y-0 start-[70px] w-px bg-rule" />
          <Suspense fallback={<Notebook {...props} query={props.base} />}>
            <NotebookFromUrl {...props} />
          </Suspense>
          {after}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
