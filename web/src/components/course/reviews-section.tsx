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
          <div key={r.id}>
            <StickyNote
              tone="grad"
              tilt={i % 2 === 0 ? 0.6 : -0.8}
              className={`relative px-4 pt-3.5 ${r.followUp ? 'pb-8' : 'pb-3.5'}`}
            >
              <article>
                <p className="text-[13px]">
                  {/* לשם יש מין דקדוקי שאנחנו לא יודעים עדיין, ולכן ליד שם לא כותבים "בוגר" או "בוגרת". */}
                  <strong>{r.displayName ?? 'בוגר מאומת'}</strong>, מחזור {cohortLabel(r.cohortMonth)}
                </p>
                <p className="mt-1.5 font-serif text-[15px] leading-relaxed">{r.body}</p>
              </article>
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
          </div>
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
