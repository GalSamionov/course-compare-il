import type { ScoreView } from '@/lib/data/course-page';
import { StickyNote } from './marks';

export function ScoreBox({ score }: { score: ScoreView }) {
  return (
    <section aria-label="ציון בוגרים" className="relative mt-5 flex items-center gap-4 border-[1.5px] border-ink px-4 py-3">
      {score.status === 'scored' ? (
        <>
          <span data-testid="score-value" className="text-[52px] font-bold leading-none">
            {score.value.toFixed(1)}
          </span>
          <div className="font-sans text-sm leading-snug">
            <p className="font-bold">ציון בוגרים מתוך 10</p>
            <p>{score.reviewCount} בוגרים מאומתים</p>
            {score.recommendPct !== null && <p>{score.recommendPct}% ממליצים</p>}
            {score.stale && <p className="text-ink-soft">ייתכן שהתיישן: אין ביקורת חדשה כבר שנה</p>}
          </div>
        </>
      ) : (
        <div className="font-sans text-sm leading-snug">
          <p className="font-bold">עוד אין ציון בוגרים</p>
          {score.status === 'not_enough_reviews' && (
            <p>
              {score.reviewCount} ביקורות מאומתות. עוד {score.reviewsNeeded} ביקורות עד לציון.
            </p>
          )}
        </div>
      )}
      <StickyNote tone="grad" tilt={-4} className="absolute -bottom-6 -left-1.5 w-[118px] px-2 py-1.5">
        את הקורס עצמו עוד לא בדקנו
      </StickyNote>
    </section>
  );
}
