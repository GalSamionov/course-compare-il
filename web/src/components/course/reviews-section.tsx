import type { ReviewView } from '@/lib/data/course-page';
import { StickyNote } from './marks';

const cohortLabel = (iso: string) =>
  new Intl.DateTimeFormat('he-IL', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(iso));

export function ReviewsSection({ reviews, total }: { reviews: ReviewView[]; total: number }) {
  if (reviews.length === 0) return null;
  return (
    <section id="reviews" className="mt-7">
      <h2 className="mb-3.5 inline-block border-b-2 border-ink pb-0.5 text-[21px] font-bold">ביקורות</h2>
      <div className="flex flex-col gap-6">
        {reviews.map((r, i) => (
          // הביקורת כולה, כולל הפתק של שאלת ההמשך ותגובת המוסד, היא article אחד.
          // פתק ההמשך תלוי מתחת לפתק, ולכן בלי תגובת מוסד מפנים לו מקום לפני הביקורת הבאה.
          <article key={r.id} className={r.followUp && !r.vendorResponse ? 'pb-8' : undefined}>
            <StickyNote
              tone="grad"
              tilt={i % 2 === 0 ? 0.6 : -0.8}
              className={`relative px-4 pt-3.5 ${r.followUp ? 'pb-8' : 'pb-3.5'}`}
            >
              <p className="text-[13px]">
                {/* כל פתק אומר שהביקורת מאומתת: זו ההבטחה של האתר. אנחנו לא יודעים את המין הדקדוקי של הכותב, ולכן "ביקורת מאומתת" ולא "בוגר" או "בוגרת". */}
                {r.displayName ? (
                  <>
                    <strong>{r.displayName}</strong>, ביקורת מאומתת
                  </>
                ) : (
                  <strong>ביקורת מאומתת</strong>
                )}
                , מחזור {cohortLabel(r.cohortMonth)}
              </p>
              <p className="mt-1.5 font-serif text-[15px] leading-relaxed">{r.body}</p>
              {r.followUp && (
                <StickyNote tone="grad-light" tilt={-4} className="absolute -bottom-6 left-2.5 w-[164px] px-2.5 py-1.5">
                  <strong>אחרי 3 חודשים:</strong> {r.followUp}
                </StickyNote>
              )}
            </StickyNote>
            {r.vendorResponse && (
              <StickyNote tone="institution" tilt={-1.5} className="mt-8 mr-14 px-3 py-2">
                <strong>תגובת המוסד:</strong> {r.vendorResponse}
              </StickyNote>
            )}
          </article>
        ))}
      </div>
      {total > reviews.length && (
        <p className="mt-3.5 font-sans text-[15px] font-semibold">
          <a href="#all-reviews" className="underline underline-offset-4">
            לכל {total} הביקורות
          </a>
        </p>
      )}
    </section>
  );
}
