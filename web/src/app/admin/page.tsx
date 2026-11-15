import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { textLink } from '@/components/admin/controls';
import { CourseQueueItemView } from '@/components/admin/course-queue-item';
import { DecisionLog } from '@/components/admin/decision-log';
import { JoinRequestItem } from '@/components/admin/join-request-item';
import { QueueItemView } from '@/components/admin/queue-item';
import { ScrapeRunReportView } from '@/components/admin/scrape-run-report';
import { PenArrow } from '@/components/site/pen';
import { Sheet } from '@/components/site/sheet';
import { COURSE_QUEUE_PAGE, loadCourseQueue, loadJoinRequests, loadLatestRun } from '@/lib/admin/course-queue';
import { adminGate } from '@/lib/admin/gate';
import { loadQueue } from '@/lib/admin/queue';
import { SITE_NAME } from '@/lib/site';

export const metadata: Metadata = {
  title: `התורים | ${SITE_NAME}`,
  robots: { index: false, follow: false },
};

/**
 * הכול בבקשה: העמוד קורא את ההתחברות, ולכן אין לו מעטפת סטטית (instant.md, "Disabling instant").
 * ה-proxy כבר החזיר 404 לכל מי שאינו מנהל. כאן בודקים שוב, ומי שאינו מנהל מקבל את עמוד ה-404.
 * גם הכותרת בתוך Suspense: מי שאינו מנהל לא רואה שום דבר מהעמוד, אפילו אם ה-proxy לא רץ.
 */
export const instant = false;

export default function AdminPage() {
  return (
    <Suspense fallback={null}>
      <AdminQueues />
    </Suspense>
  );
}

function reviewsLine(count: number): string {
  if (count === 0) return 'אין ביקורות שמחכות לבדיקה. ביקורת חדשה מופיעה כאן כשבוגר שולח אותה עם הוכחה.';
  if (count === 1) return 'ביקורת אחת מחכה. היעד: תשובה תוך 48 שעות.';
  return `${count} ביקורות מחכות, הישנה ראשונה. היעד: תשובה תוך 48 שעות.`;
}

function coursesLine(total: number, shown: number): string {
  if (total === 0) return 'אין שינויים שמחכים. שינוי שגרתי עולה לבד, וקורס חדש או שינוי חריג מגיעים לכאן אחרי ריצה של האוסף.';
  if (total === 1) return 'פריט אחד מחכה.';
  if (shown < total) return `${total} פריטים מחכים. כאן ${shown} הישנים, ואחרי כל החלטה עולה הבא בתור.`;
  return `${total} פריטים מחכים, הישן ראשון.`;
}

function requestsLine(count: number): string {
  if (count === 1) return 'בקשה אחת מחכה.';
  return `${count} בקשות מחכות, הישנה ראשונה.`;
}

const sectionTitle = 'pen-rule text-[21px] leading-snug font-bold lg:text-[28px]';
const countText = 'mt-2 font-sans text-[15px] leading-normal text-ink-soft';

async function AdminQueues() {
  // הכול בבקשה, לפני שנוגעים בשעון: getUser של Supabase בודק תפוגה עם Date.now(), והתור מחשב כמה זמן כל
  // ביקורת מחכה (08-caching.md, "Random values and timestamps").
  await connection();
  const gate = await adminGate({ readOnly: true });
  if (gate.kind === 'not-admin') notFound();
  const [reviews, courses, run, join] =
    gate.kind === 'ok'
      ? await Promise.all([loadQueue(gate.db), loadCourseQueue(gate.db), loadLatestRun(gate.db), loadJoinRequests(gate.db)])
      : [[], { items: [], total: 0 }, null, { requests: [], institutions: [] }];
  const queues = [
    { id: 'reviews', label: 'ביקורות לאימות', count: reviews.length },
    { id: 'courses', label: 'קורסים לאישור', count: courses.total },
    { id: 'requests', label: 'בקשות של מוסדות', count: join.requests.length },
  ];

  return (
    <Sheet className="sheet-long">
      <main className="pb-10 lg:pb-14">
        <h1 className="mt-[22px] text-[30px] leading-tight font-bold lg:mt-12 lg:text-[48px]">מה מחכה להחלטה</h1>
        {gate.kind === 'no-key' ? (
          <div role="alert" className="mt-4 max-w-[60ch] space-y-2 font-sans text-[15px] leading-normal">
            <p className="font-bold">חסר SUPABASE_SECRET_KEY בשרת. בלעדיו אי אפשר לפתוח הוכחות או להחליט.</p>
            <p>אחרי שמוסיפים אותו ב-Vercel, צריך לפרוס מחדש. עד אז שום ביקורת לא מתפרסמת ושום קובץ לא נמחק.</p>
          </div>
        ) : (
          <>
            {/* כמו "N פרקים בעמוד" בעמוד הקורס: העט מסכם את הדף, והמונה ליד כל תור, בלי כרטיסי מונה. */}
            <nav
              aria-label="התורים בעמוד"
              className="mt-1.5 flex flex-wrap items-center gap-x-4 font-sans text-[15px] font-semibold lg:mt-4 lg:text-base"
            >
              <span className="inline-flex min-h-11 items-center font-pen text-[15px] font-medium text-pen lg:text-base">
                {queues.length} תורים בעמוד
                <PenArrow className="ms-1.5 me-0" />
              </span>
              {queues.map((q) => (
                <a key={q.id} href={`#${q.id}`} className={textLink}>
                  {q.label}
                  <span className="ms-1.5 font-bold tabular-nums">{q.count}</span>
                </a>
              ))}
            </nav>
            <DecisionLog>
              <section id="reviews" aria-labelledby="reviews-title" className="mt-8 scroll-mt-4 lg:mt-12 lg:scroll-mt-8">
                <h2 id="reviews-title" className={sectionTitle}>
                  ביקורות לאימות
                </h2>
                <p className={countText}>{reviewsLine(reviews.length)}</p>
                <div className="mt-6">
                  {reviews.map((item) => (
                    <QueueItemView key={item.reviewId} item={item} />
                  ))}
                </div>
              </section>

              <section id="courses" aria-labelledby="courses-title" className="mt-10 scroll-mt-4 lg:mt-16 lg:scroll-mt-8">
                <h2 id="courses-title" className={sectionTitle}>
                  קורסים לאישור
                </h2>
                <ScrapeRunReportView run={run} />
                <p className={countText}>{coursesLine(courses.total, Math.min(courses.items.length, COURSE_QUEUE_PAGE))}</p>
                <div className="mt-6">
                  {courses.items.map((item) => (
                    <CourseQueueItemView key={item.id} item={item} />
                  ))}
                </div>
              </section>

              <section id="requests" aria-labelledby="requests-title" className="mt-10 scroll-mt-4 lg:mt-16 lg:scroll-mt-8">
                <h2 id="requests-title" className={sectionTitle}>
                  בקשות של מוסדות
                </h2>
                <p className={countText}>
                  {join.requests.length === 0 ? (
                    <>
                      אין בקשות. מוסד או מרצה שולחים בקשה מ
                      <Link href="/institutions/join" className={textLink}>
                        הטופס להוספת קורס
                      </Link>
                      .
                    </>
                  ) : (
                    requestsLine(join.requests.length)
                  )}
                </p>
                <div className="mt-6">
                  {join.requests.map((request) => (
                    <JoinRequestItem key={request.id} request={request} institutions={join.institutions} />
                  ))}
                </div>
              </section>
            </DecisionLog>
          </>
        )}
      </main>
    </Sheet>
  );
}
