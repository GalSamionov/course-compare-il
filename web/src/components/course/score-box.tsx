import { cn } from '@/lib/utils';
import type { ScoreView } from '@/lib/data/course-page';
import { StickyNote } from './marks';

export function ScoreBox({ score }: { score: ScoreView }) {
  return (
    <section
      aria-label="ציון בוגרים"
      className={cn(
        'relative mt-5 flex items-center gap-4 border-[1.5px] border-ink bg-white px-4 py-3 lg:mt-0 lg:gap-5 lg:px-5 lg:py-4',
        // שורת "ייתכן שהתיישן" מאריכה את הטקסט, ולכן מפנים מקום לפתק שתלוי למטה.
        score.status === 'scored' && score.stale && 'pb-8',
      )}
    >
      {score.status === 'scored' ? (
        <>
          <span aria-hidden="true" data-testid="score-value" className="text-[52px] leading-none font-bold lg:text-[64px]">
            {score.value.toFixed(1)}
          </span>
          <span className="sr-only">ציון בוגרים {score.value.toFixed(1)} מתוך 10.</span>
          <div className="font-sans text-sm leading-snug lg:text-[15px]">
            <p className="font-bold">ציון בוגרים מתוך 10</p>
            <p>{score.reviewCount} בוגרים מאומתים</p>
            {score.recommendPct !== null && <p>{Math.round(score.recommendPct)}% ממליצים</p>}
            {score.stale && <p className="text-ink-soft">ייתכן שהתיישן: אין ביקורת חדשה כבר שנה</p>}
          </div>
        </>
      ) : (
        // הפתק תלוי בפינה השמאלית, ולכן הטקסט לא נכנס מתחתיו.
        <div className="pe-[112px] font-sans text-sm leading-snug lg:text-[15px]">
          <p className="font-bold">עוד אין ציון בוגרים</p>
          {score.status === 'not_enough_reviews' && (
            <>
              <p>{score.reviewCount} ביקורות מאומתות.</p>
              {score.reviewsNeeded > 0 && <p>עוד {score.reviewsNeeded} ביקורות עד לציון.</p>}
            </>
          )}
        </div>
      )}
      <StickyNote tone="grad" tilt={-4} className="absolute -bottom-8 -left-2 w-[122px] px-2 pt-4 pb-1.5 lg:-bottom-10 lg:-left-6 lg:w-[132px] lg:text-sm">
        את הקורס עצמו עוד לא בדקנו
      </StickyNote>
    </section>
  );
}
