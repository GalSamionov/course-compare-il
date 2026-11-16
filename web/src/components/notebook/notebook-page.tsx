import { Suspense } from 'react';
import { Sheet } from '@/components/site/sheet';
import { cn } from '@/lib/utils';
import { Notebook, NotebookFromUrl, type NotebookProps } from './notebook';

/**
 * הדף של המחברת: דף הבית, עמוד תחום וכל הקורסים.
 * הדף סטטי. התשובות שבכתובת נקראות בדפדפן, בתוך <Suspense>.
 * עד אז מוצגת אותה מחברת עם מה שממולא מראש, כך שבכתובת בלי תשובות אין קפיצה.
 *
 * במחשב: הכותרת מימין והערה בעט משמאלה, המחברת על שורות שנמשכות עד קצה הנייר,
 * והרשימה רחבה, בעמודות.
 */
export function NotebookPage({
  heading,
  headingLevel = 1,
  intro,
  before,
  hero,
  headSide,
  headSideAlign = 'end',
  after,
  ...props
}: NotebookProps & {
  heading: string;
  /** בדף הבית הכותרת הראשית היא ההבטחה, והמחברת מקבלת כותרת משנה. */
  headingLevel?: 1 | 2;
  intro: string;
  /** לפני הכותרת. בעמוד תחום: פירורי הלחם. */
  before?: React.ReactNode;
  /** בדף הבית: ההבטחה, הסיכום לדוגמה ושלושת הצעדים, לפני המחברת. */
  hero?: React.ReactNode;
  /** ליד הכותרת, משמאל במחשב ומתחתיה בנייד: הערה קצרה בעט על מה שברשימה. */
  headSide?: React.ReactNode;
  /**
   * במחשב, איפה headSide עומד מול הכותרת. end: מול סוף הפתיח (הערה קצרה).
   * start: מול ראש העמודה, כשהוא גבוה מהכותרת, כדי שלא יעלה מעל פירורי הלחם (עמוד תחום עם המובילים).
   */
  headSideAlign?: 'end' | 'start';
  /** אחרי הרשימה. בדף הבית: הבוגרים והתחומים. */
  after?: React.ReactNode;
}) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  return (
    <Sheet>
      <main id="main">
        {hero}
        <div
          className={cn(
            'lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)] lg:gap-x-16',
            headSideAlign === 'start' ? 'lg:items-start' : 'lg:items-end',
            hero ? 'mt-12 lg:mt-11' : 'lg:mt-4',
          )}
        >
          <div>
            {before}
            <Heading
              id="notebook-title"
              className={cn(
                'leading-tight font-bold text-balance',
                headingLevel === 1
                  ? 'mt-[22px] text-[30px] lg:mt-8 lg:text-[54px] lg:leading-[1.08] lg:font-bold'
                  : 'pen-rule text-[26px] lg:text-[38px]',
              )}
            >
              {heading}
            </Heading>
            <p className="mt-2 max-w-[60ch] font-sans text-[15px] leading-normal text-ink-soft lg:mt-3 lg:text-lg">
              {intro}
            </p>
          </div>
          {headSide && <div className="mt-3 lg:mt-0 lg:pb-1">{headSide}</div>}
        </div>
        {/* קו השוליים: לאורך המחברת, הרשימה והחלקים שאחריה, כמו בציור (HomeB). */}
        <div className="margin-rule mt-4 lg:mt-8">
          <Suspense fallback={<Notebook {...props} query={props.base} />}>
            <NotebookFromUrl {...props} />
          </Suspense>
          {after}
        </div>
      </main>
    </Sheet>
  );
}
