import type { ScoreView } from '@/lib/data/course-page';
import { PenLoop } from '@/components/site/pen';
import { PenNote } from './marks';

/**
 * תיבת הציון, ומתחתיה הערה בעט שתלויה על הפינה התחתונה: את הקורס עצמו עוד לא בדקנו.
 * זה האתר שמדבר, ולכן עט כחול ולא פתק: פתק צהוב הוא קול של בוגר (מקרא הצבעים). כמו בתמונת השיתוף (_og/card.tsx).
 * ההערה מופיעה גם כשיש ציון וגם כשאין.
 */
export function ScoreBox({ score }: { score: ScoreView }) {
  return (
    <section aria-label="ציון בוגרים" className="mt-5 lg:mt-0">
      <div className="flex items-center gap-4 border-[1.5px] border-ink bg-white px-4 py-3 lg:gap-5 lg:px-5 lg:py-4">
        {score.status === 'scored' ? (
          <>
            {/* העט מקיף את הציון כשהתיבה נכנסת למסך, ואחר כך כותב מתחתיה שעוד לא בדקנו. */}
            <PenLoop
              delay={300}
              className="mx-2.5 my-2"
              loopClassName="-inset-x-[16px] -inset-y-[12px] h-[calc(100%+24px)] w-[calc(100%+32px)]"
            >
              <span aria-hidden="true" data-testid="score-value" className="text-[52px] leading-none font-bold lg:text-[64px]">
                {score.value.toFixed(1)}
              </span>
            </PenLoop>
            <span className="sr-only">ציון בוגרים {score.value.toFixed(1)} מתוך 10.</span>
            <div className="font-sans text-sm leading-snug lg:text-[15px]">
              <p className="font-bold">ציון בוגרים מתוך 10</p>
              <p>{score.reviewCount} בוגרים מאומתים</p>
              {score.recommendPct !== null && <p>{Math.round(score.recommendPct)}% ממליצים</p>}
              {score.stale && <p className="text-ink-soft">ייתכן שהתיישן: אין ביקורת חדשה כבר שנה</p>}
            </div>
          </>
        ) : (
          <div className="font-sans text-sm leading-snug lg:text-[15px]">
            <p className="font-bold">עוד אין ציון בוגרים</p>
            {score.status === 'not_enough_reviews' && (
              <>
                <p>{score.reviewCount} ביקורות מאומתות.</p>
                {score.reviewsNeeded > 0 && <p>עוד {score.reviewsNeeded} ביקורות עד לציון.</p>}
              </>
            )}
          </div>
        )}
      </div>
      {/* ms-auto: ההערה נצמדת לפינה השמאלית התחתונה של התיבה, והחץ עולה ממנה אל הציון. */}
      <PenNote arrow="up" delay={score.status === 'scored' ? 1050 : 300} className="ms-auto mt-2 w-fit pe-1 lg:-me-2 lg:text-base">
        את הקורס עצמו עוד לא בדקנו
      </PenNote>
    </section>
  );
}
