import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { CompanyRequestItem } from '@/components/admin/company-request-item';
import { CourseLinkItemView } from '@/components/admin/course-link-item';
import { textLink } from '@/components/admin/controls';
import { CourseQueueItemView } from '@/components/admin/course-queue-item';
import { DecisionLog } from '@/components/admin/decision-log';
import { counted } from '@/components/admin/format';
import { JoinRequestItem } from '@/components/admin/join-request-item';
import { NewCourseGroups } from '@/components/admin/new-course-groups';
import { QueueItemView } from '@/components/admin/queue-item';
import { ScrapeRunReportView } from '@/components/admin/scrape-run-report';
import { PenArrow } from '@/components/site/pen';
import { Sheet } from '@/components/site/sheet';
import { COMPANY_REQUESTS_PAGE, loadCompanyRequests } from '@/lib/admin/company-requests';
import { COURSE_LINKS_PAGE, loadCourseLinks } from '@/lib/admin/course-links';
import {
  COURSE_QUEUE_PAGE,
  loadCourseQueue,
  loadJoinRequests,
  loadLatestRun,
  loadNewCourseGroups,
  loadNewCourseItems,
  type CourseQueueItem,
} from '@/lib/admin/course-queue';
import { adminGate, keyProblemMessage, type AdminGate } from '@/lib/admin/gate';
import {
  groupTotals,
  parseQueueView,
  queueHref,
  type CourseQueueView,
  type NewCourseFilter,
  type NewCourseGroup,
} from '@/lib/admin/new-course-groups';
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

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function AdminPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={null}>
      <AdminQueues searchParams={searchParams} />
    </Suspense>
  );
}

function reviewsLine(count: number): string {
  if (count === 0) return 'אין ביקורות שמחכות לבדיקה. ביקורת חדשה מופיעה כאן כשבוגר שולח אותה עם הוכחה.';
  if (count === 1) return 'ביקורת אחת מחכה. היעד: תשובה תוך 48 שעות.';
  return `${count} ביקורות מחכות, הישנה ראשונה. היעד: תשובה תוך 48 שעות.`;
}

const fmt = (n: number) => new Intl.NumberFormat('he-IL').format(n);

/** "764 קורסים חדשים מ-49 מוסדות", ובמוסד אחד: "ממוסד אחד". */
function newCoursesPhrase(total: number, institutions: number): string {
  const from = institutions === 1 ? 'ממוסד אחד' : `מ-${fmt(institutions)} מוסדות`;
  return `${counted(total, 'קורס חדש אחד', 'קורסים חדשים')} ${from}`;
}

/** השורה מתחת לכותרת של התור: מה מחכה, ומה "בטוח" אומר. */
function coursesLine(total: number, groups: NewCourseGroup[], others: number): string {
  if (total === 0) return 'אין שינויים שמחכים. שינוי שגרתי עולה לבד, וקורס חדש או שינוי חריג מגיעים לכאן אחרי ריצה של האוסף.';
  const parts: string[] = [];
  if (groups.length > 0) {
    const sums = groupTotals(groups);
    const safe = sums.safe === 1 ? 'אחד מהם בטוח' : `${fmt(sums.safe)} מהם בטוחים`;
    parts.push(
      `${newCoursesPhrase(sums.total, groups.length)}. ${safe}: כל השדות בביטחון גבוה, בלי סימון בבדיקת הסבירות ובלי חשד לכפילות.`,
    );
  }
  if (others > 0) {
    const shown = Math.min(others, COURSE_QUEUE_PAGE);
    const head = others === 1 ? 'שינוי אחד בקורס קיים מחכה' : `${fmt(others)} שינויים בקורסים קיימים מחכים`;
    parts.push(shown < others ? `${head}. כאן ${shown} הישנים, ואחרי כל החלטה עולה הבא בתור.` : `${head}, הישן ראשון.`);
  }
  return parts.join(' ');
}

/** מעל הרשימה המסוננת: כמה, של מי, ומה בעמוד. */
function filteredLine(view: CourseQueueView, total: number, shown: number, institution: string | null): string {
  const of = institution ? `${institution}: ` : '';
  if (total === 0) {
    return view.filter === 'duplicates' ? `${of}אין קורסים חדשים בחשד לכפילות.` : `${of}אין קורסים חדשים שאינם בטוחים.`;
  }
  const head =
    view.filter === 'duplicates'
      ? `${of}${counted(total, 'קורס חדש אחד', 'קורסים חדשים')} בחשד לכפילות. הכפילויות של אותו קורס עומדות זו ליד זו.`
      : `${of}${total === 1 ? 'קורס חדש אחד לא בטוח' : `${fmt(total)} קורסים חדשים לא בטוחים`}, הישן ראשון.`;
  return shown < total ? `${head} כאן ${shown} הראשונים, ואחרי כל החלטה עולה הבא.` : head;
}

const FILTER_LABEL: Record<NewCourseFilter, string> = {
  groups: 'לפי מוסד',
  unsafe: 'רק לא בטוחים',
  duplicates: 'חשד לכפילות',
};

/** איך להציג את הקורסים החדשים: לפי מוסד, או רשימה מסוננת. המסנן הנוכחי מודגש ואינו קישור. */
function CourseFilters({ view, groups }: { view: CourseQueueView; groups: NewCourseGroup[] }) {
  const sums = groupTotals(groups);
  const counts: Record<NewCourseFilter, number> = { groups: groups.length, unsafe: sums.unsafe, duplicates: sums.duplicates };
  return (
    <nav aria-label="איך להציג את הקורסים החדשים" className="mt-3 flex flex-wrap items-center gap-x-5 font-sans text-[15px]">
      {(['groups', 'unsafe', 'duplicates'] as const).map((filter) => {
        const content = (
          <>
            {FILTER_LABEL[filter]}
            <span className="ms-1.5 font-bold tabular-nums">{fmt(counts[filter])}</span>
          </>
        );
        return view.filter === filter && view.institutionId === null ? (
          <span key={filter} aria-current="page" className="inline-flex min-h-11 items-center font-bold">
            {content}
          </span>
        ) : (
          <Link key={filter} href={queueHref({ filter, institutionId: null })} className={`${textLink} font-semibold`}>
            {content}
          </Link>
        );
      })}
    </nav>
  );
}

/** קורסים שבוגרים הוסיפו מקישור, ובקשות מ-/request-course. */
function linksLine(total: number, shown: number): string {
  if (total === 0) return '';
  const head = total === 1 ? 'פריט אחד מחכה.' : `${fmt(total)} פריטים מחכים, הישן ראשון.`;
  return shown < total ? `${head} כאן ${shown} הראשונים, ואחרי כל החלטה עולה הבא.` : head;
}

function requestsLine(count: number): string {
  if (count === 1) return 'בקשה אחת מחכה.';
  return `${count} בקשות מחכות, הישנה ראשונה.`;
}

/** הפניות הפתוחות, וכמה מהן עוד מחכות שנחזור אליהן. היעד בעמוד לחברות: תוך 2 ימי עבודה. */
function companiesLine(open: number, waiting: number, shown: number): string {
  const wait = waiting === 0 ? 'חזרנו לכולן.' : waiting === 1 ? 'אחת עוד מחכה שנחזור אליה.' : `${waiting} עוד מחכות שנחזור אליהן.`;
  const head = open === 1 ? 'פנייה אחת פתוחה.' : shown < open ? `${open} פניות פתוחות. כאן ${shown} החדשות.` : `${open} פניות פתוחות, החדשה ראשונה.`;
  return `${head} ${wait} היעד: תשובה תוך 2 ימי עבודה.`;
}

/** מה גל עושה כשאין מפתח סודי שעובד. המפתח עצמו לא מוצג אף פעם, גם לא חלק ממנו. */
function keyProblemFix(gate: Extract<AdminGate, { kind: 'no-key' | 'bad-key' }>): string {
  if (gate.kind === 'no-key') return 'אחרי שמוסיפים אותו ב-Vercel, צריך לפרוס מחדש.';
  if (gate.reason === 'public') {
    return 'מחליפים אותו ב-Vercel במפתח שמתחיל ב-sb_secret_ (ב-Supabase: Project Settings, API Keys), ופורסים מחדש.';
  }
  return 'בודקים ב-Vercel שזה המפתח הסודי של הפרויקט הזה ושהוא לא בוטל, ופורסים מחדש. אם המפתח נכון, אולי המסד לא ענה: לרענן בעוד דקה.';
}

const sectionTitle = 'pen-rule text-[21px] leading-snug font-bold lg:text-[28px]';
const countText = 'mt-2 font-sans text-[15px] leading-normal text-ink-soft';

const NO_ITEMS: { items: CourseQueueItem[]; total: number } = { items: [], total: 0 };

async function AdminQueues({ searchParams }: { searchParams: SearchParams }) {
  // הכול בבקשה, לפני שנוגעים בשעון: getUser של Supabase בודק תפוגה עם Date.now(), והתור מחשב כמה זמן כל
  // ביקורת מחכה (08-caching.md, "Random values and timestamps").
  await connection();
  const gate = await adminGate({ readOnly: true });
  if (gate.kind === 'not-admin') notFound();
  // ?cq=unsafe|duplicates ו-&inst: רשימה מסוננת של קורסים חדשים, במקום הסיכום לפי מוסד.
  const view = parseQueueView(await searchParams);
  const [reviews, courses, groups, filtered, run, join, companies, links] =
    gate.kind === 'ok'
      ? await Promise.all([
          loadQueue(gate.db),
          loadCourseQueue(gate.db),
          loadNewCourseGroups(gate.db),
          view.filter === 'groups' ? NO_ITEMS : loadNewCourseItems(gate.db, view),
          loadLatestRun(gate.db),
          loadJoinRequests(gate.db),
          loadCompanyRequests(gate.db),
          loadCourseLinks(gate.db),
        ])
      : [
          [],
          { items: [], total: 0, others: 0 },
          [],
          NO_ITEMS,
          null,
          { requests: [], institutions: [] },
          { requests: [], open: 0, waiting: 0 },
          { items: [], total: 0, institutions: [], categories: [] },
        ];
  const filteredInstitution = view.institutionId
    ? (groups.find((g) => g.institutionId === view.institutionId)?.institutionName ?? 'המוסד')
    : null;
  const queues = [
    { id: 'reviews', label: 'ביקורות לאימות', count: reviews.length },
    { id: 'courses', label: 'קורסים לאישור', count: courses.total },
    { id: 'links', label: 'קורסים מקישורים', count: links.total },
    { id: 'requests', label: 'בקשות של מוסדות', count: join.requests.length },
    { id: 'companies', label: 'פניות מחברות', count: companies.open },
  ];

  return (
    <Sheet className="sheet-long">
      <main className="pb-10 lg:pb-14">
        <h1 className="mt-[22px] text-[30px] leading-tight font-bold lg:mt-12 lg:text-[48px]">מה מחכה להחלטה</h1>
        {gate.kind === 'no-key' || gate.kind === 'bad-key' ? (
          <div role="alert" className="mt-4 max-w-[60ch] space-y-2 font-sans text-[15px] leading-normal">
            <p className="font-bold">{keyProblemMessage(gate)}</p>
            <p>{keyProblemFix(gate)} עד אז שום ביקורת לא מתפרסמת ושום קובץ לא נמחק.</p>
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
                <p className={`${countText} max-w-[68ch]`}>{coursesLine(courses.total, groups, courses.others)}</p>
                {groups.length > 0 && <CourseFilters view={view} groups={groups} />}
                {view.filter === 'groups' ? (
                  <>
                    <NewCourseGroups groups={groups} />
                    {courses.items.length > 0 && (
                      <div className="mt-6">
                        {courses.items.map((item) => (
                          <CourseQueueItemView key={item.id} item={item} />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <p className={`${countText} max-w-[68ch]`}>
                      {filteredLine(view, filtered.total, Math.min(filtered.items.length, COURSE_QUEUE_PAGE), filteredInstitution)}
                    </p>
                    {filteredInstitution && (
                      <p className="font-sans text-[15px]">
                        <Link href={queueHref({ filter: view.filter, institutionId: null })} className={textLink}>
                          {view.filter === 'duplicates' ? 'כל החשד לכפילות, מכל המוסדות' : 'כל הלא בטוחים, מכל המוסדות'}
                        </Link>
                      </p>
                    )}
                    <div className="mt-6">
                      {filtered.items.map((item) => (
                        <CourseQueueItemView key={item.id} item={item} />
                      ))}
                    </div>
                  </>
                )}
              </section>

              <section id="links" aria-labelledby="links-title" className="mt-10 scroll-mt-4 lg:mt-16 lg:scroll-mt-8">
                <h2 id="links-title" className={sectionTitle}>
                  קורסים מקישורים
                </h2>
                <p className={`${countText} max-w-[68ch]`}>
                  {links.total === 0 ? (
                    <>
                      אין קורסים שמחכים. בוגר מוסיף קורס מקישור כשהוא לא מוצא אותו ב
                      <Link href="/review" className={textLink}>
                        כתיבת ביקורת
                      </Link>
                      , וכל אחד יכול לבקש ב
                      <Link href="/request-course" className={textLink}>
                        בקשו שנבדוק קורס
                      </Link>
                      .
                    </>
                  ) : (
                    linksLine(links.total, Math.min(links.items.length, COURSE_LINKS_PAGE))
                  )}
                </p>
                <div className="mt-6">
                  {links.items.map((item) => (
                    <CourseLinkItemView
                      key={item.id}
                      item={item}
                      choices={{ institutions: links.institutions, categories: links.categories }}
                    />
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

              <section id="companies" aria-labelledby="companies-title" className="mt-10 scroll-mt-4 lg:mt-16 lg:scroll-mt-8">
                <h2 id="companies-title" className={sectionTitle}>
                  פניות מחברות
                </h2>
                <p className={countText}>
                  {companies.open === 0 ? (
                    <>
                      אין פניות פתוחות. חברה פונה מ
                      <Link href="/companies" className={textLink}>
                        העמוד לחברות
                      </Link>
                      .
                    </>
                  ) : (
                    companiesLine(companies.open, companies.waiting, Math.min(companies.requests.length, COMPANY_REQUESTS_PAGE))
                  )}
                </p>
                <div className="mt-6">
                  {companies.requests.map((request) => (
                    <CompanyRequestItem key={request.id} request={request} />
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
