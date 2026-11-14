import Link from 'next/link';
import { Soon } from '@/components/site/soon';
import type { ReviewView } from '@/lib/data/course-page';
import { cn } from '@/lib/utils';
import { StickyNote } from './marks';

/** הטיה של כל פתק במחשב, לסירוגין לשני הכיוונים, בין מעלה לשתיים. */
const DESK_TILTS = [1.4, -1.7, 1.1, -1.8];

const cohortLabel = (iso: string) =>
  new Intl.DateTimeFormat('he-IL', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(iso));

export function ReviewsSection({ slug, reviews, total }: { slug: string; reviews: ReviewView[]; total: number }) {
  if (reviews.length === 0) return null;
  return (
    <section id="reviews" className="mt-10 scroll-mt-6 lg:mt-14">
      <h2 className="pen-rule mb-4 text-[21px] font-bold lg:mb-6 lg:text-[28px]">ביקורות</h2>
      {/*
        בנייד כל פתק ברוחב מלא. במחשב הפתקים צרים (עד 340 פיקסלים), בשתי עמודות כשיש מקום לשתיים,
        וכל אחד מוטה קצת אחרת: פתקים שהודבקו על הדף, לא פסים של טבלה. מ-xl, שבו תמיד יש שתי עמודות, העמודה השנייה יורדת מעט.
      */}
      <div className="flex flex-col gap-7 lg:grid lg:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] lg:items-start lg:gap-x-9 lg:gap-y-11">
        {reviews.map((r, i) => (
          // הביקורת כולה, כולל הפתק של שאלת ההמשך ותגובת המוסד, היא article אחד.
          // פתק ההמשך תלוי מתחת לפתק, ולכן בלי תגובת מוסד מפנים לו מקום לפני הביקורת הבאה.
          <article
            key={r.id}
            className={cn('lg:max-w-[340px]', r.followUp && !r.vendorResponse && 'pb-8', i % 2 === 1 && 'xl:mt-8')}
          >
            <StickyNote
              tone="grad"
              tilt={i % 2 === 0 ? 0.6 : -0.8}
              tiltLg={DESK_TILTS[i % DESK_TILTS.length]}
              className={`px-4 pt-5 lg:px-5 ${r.followUp ? 'pb-8' : 'pb-3.5'}`}
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
              <p className="mt-1.5 font-serif text-[15px] leading-relaxed lg:text-base">{r.body}</p>
              {r.followUp && (
                <StickyNote tone="grad-light" tilt={-4} tape={false} className="absolute -bottom-6 left-2.5 w-[164px] px-2.5 py-1.5">
                  <strong>אחרי 3 חודשים:</strong> {r.followUp}
                </StickyNote>
              )}
            </StickyNote>
            {r.vendorResponse && (
              <StickyNote tone="institution" tilt={-1.5} className="mt-9 mr-14 px-3 pt-4 pb-2 lg:mr-10">
                <strong>תגובת המוסד:</strong> {r.vendorResponse}
              </StickyNote>
            )}
          </article>
        ))}
      </div>
      {total > reviews.length && (
        <p className="mt-3.5 font-sans text-[15px] font-semibold">
          {/* העמוד של כל הביקורות עוד לא נבנה. ההערה בעט אומרת את זה לפני הלחיצה. */}
          <Link href={`/courses/${slug}/reviews`} className="inline-flex min-h-11 flex-wrap items-center gap-x-2.5 hover:text-link-hover">
            <span className="underline underline-offset-4">לכל {total} הביקורות</span>
            <Soon />
          </Link>
        </p>
      )}
    </section>
  );
}
