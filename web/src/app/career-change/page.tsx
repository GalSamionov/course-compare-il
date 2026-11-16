import type { Metadata } from 'next';
import Link from 'next/link';
import { CourseRow } from '@/components/course/course-row';
import { Mark, PenNote, StickyNote, type WashiTone } from '@/components/course/marks';
import { ShareLinks } from '@/components/course/share-links';
import { SourceLegend } from '@/components/course/source-legend';
import { buttonVariants } from '@/components/ui/button';
import { ReviewTally } from '@/components/site/graduates-call';
import { PenArrow, PenLoop, PenNumber } from '@/components/site/pen';
import { Sheet } from '@/components/site/sheet';
import { resolveQuestions } from '@/lib/career/questions';
import { MIN_HOURS, MIN_MONTHS, getCareerChangePage, type CareerChangePage } from '@/lib/data/career-change';
import type { CoursePageData } from '@/lib/data/course-page';
import { moreReviewsText, outcomeBasis, outcomeHeadline, verifiedGraduatesText } from '@/lib/format';
import { getGuide } from '@/lib/guides/guides';
import {
  CAREER_CHANGE_TITLE,
  careerChangeCounts,
  careerChangeDescription,
  careerChangeShareMessage,
} from '@/lib/og/share-text';
import { MIN_REVIEWS } from '@/lib/score/constants';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import { cn } from '@/lib/utils';

/** העמוד כולו סטטי: הקורסים מהמטמון של הקטלוג, והמדריכים מהדיסק בזמן הבנייה. */
export const ensureStatic = 'navigation';

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCareerChangePage();
  return {
    title: `${CAREER_CHANGE_TITLE} | ${SITE_NAME}`,
    description: careerChangeDescription(page),
    alternates: { canonical: '/career-change' },
    openGraph: { type: 'website', locale: 'he_IL', siteName: SITE_NAME, url: '/career-change' },
  };
}

const textLink = 'underline decoration-1 underline-offset-[3px] transition-colors duration-150 hover:text-link-hover';
const navLink = `inline-flex min-h-11 items-center ${textLink}`;
const chapterTitle = 'pen-rule text-[21px] leading-snug font-bold lg:text-[28px]';

/** "ב-1 מתוך 3 הקורסים", "בקורס אחד מתוך 2", או "בכל 3 הקורסים". */
function inHowMany(count: number, total: number): string {
  if (count === total) return total === 1 ? 'בקורס' : `בכל ${total} הקורסים`;
  return count === 1 ? `בקורס אחד מתוך ${total}` : `ב-${count} מתוך ${total} הקורסים`;
}

/** הפרקים של החוברת, עם הנתון של כל פרק מתחת לשם שלו (The Not A Menu Rule). */
function chapters(page: CareerChangePage, questions: number) {
  const total = page.courses.length;
  const closest = page.courses.filter((c) => c.score.status !== 'scored');
  return [
    {
      id: 'courses',
      label: 'הקורסים, לפי ציון הבוגרים',
      data:
        total === 0 ? (
          'עוד אין קורסים בעמוד'
        ) : (
          <>
            {total === 1 ? 'קורס אחד' : `${total} קורסים`},{' '}
            {page.graduates === 0 ? (
              'עוד בלי בוגרים מאומתים'
            ) : (
              <PenLoop>{verifiedGraduatesText(page.graduates)}</PenLoop>
            )}
            {page.withPaid > 0 && `. מחיר לפי חשבוניות ${inHowMany(page.withPaid, total)}`}
          </>
        ),
    },
    {
      id: 'outcomes',
      label: 'מה קרה לבוגרים',
      data:
        page.withOutcome === 0
          ? 'עוד אין תשובות של בוגרים 3 חודשים אחרי הסיום'
          : `תשובות 3 חודשים אחרי הסיום, ${inHowMany(page.withOutcome, total)}`,
    },
    { id: 'questions', label: 'מה לשאול לפני שמשלמים', data: `${questions} שאלות, וכל אחת עם המדריך שמסביר אותה` },
    {
      id: 'graduates',
      label: 'סיימתם קורס הסבה?',
      data:
        closest.length === 0
          ? '3 דקות של ביקורת, עם חשבונית או תעודה'
          : `${closest.length === 1 ? 'לקורס אחד' : `ל-${closest.length} קורסים`} חסרות עוד ביקורות עד לציון`,
    },
  ];
}

/** מה קרה לבוגרים של קורס: התוצאה 3 חודשים אחרי (צהוב), ומה הבוגרים אמרו שטוב ושחלש. */
function hasOutcomeNotes(course: CoursePageData): boolean {
  return Boolean(course.outcome || course.summaryGood || course.summaryWeak);
}

const WASHI: WashiTone[] = ['teal', 'peach'];

/**
 * "הסבה להייטק": עמוד ששולחים בקבוצה (docs/b2b/2026-11-15-go-to-market.md, מסלול 2). החוזה בסקירה של Impeccable
 * (.impeccable/surfaces). העמוד בנוי כמו עמוד הפתיחה של חוברת סיכום: תוכן עניינים שכבר עונה, עם הנתון של כל פרק
 * מתחת לשם שלו, ואחריו הפרקים. הוא לא מוכר כלום: אין כאן "השאירו פרטים", ואף מוסד לא משלם לנו.
 * במחשב, כמו עמוד הקורס: הפרקים מימין, ומשמאל עמודה שנשארת במקום, עם השיתוף בוואטסאפ ומקרא הסימונים.
 */
export default async function CareerChangePage() {
  const page = await getCareerChangePage();
  const questions = resolveQuestions();
  const guides = ['questions-before-signing-up', 'funding-and-vouchers'].flatMap((slug) => getGuide(slug) ?? []);
  const toc = chapters(page, questions.length);
  const share = { text: careerChangeShareMessage(page), url: `${SITE_URL}/career-change` };
  const withNotes = page.courses.filter(hasOutcomeNotes);
  const withoutNotes = page.courses.filter((c) => !hasOutcomeNotes(c));
  const closest = page.courses.filter((c) => c.score.status !== 'scored');

  return (
    <Sheet>
      <main id="main">
        <nav aria-label="מיקום" className="mt-2 font-sans text-[13px] text-ink-soft lg:mt-6 lg:text-sm">
          <Link href="/courses" className={navLink}>
            קורסים
          </Link>
          {' › '}
          <Link href="/categories/technology" className={navLink}>
            טכנולוגיה
          </Link>
        </nav>

        {/* במחשב: הכותרת ותוכן העניינים מימין, ומשמאל ההערה בעט, השיתוף והמקרא. הפרקים מתחת, ברוחב הדף. */}
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-x-20">
          <header>
            <h1 className="mt-0.5 max-w-[20ch] text-[30px] leading-tight font-bold text-balance lg:text-[54px] lg:leading-[1.06]">
              {CAREER_CHANGE_TITLE}
            </h1>
            <p className="mt-3 max-w-[54ch] font-sans text-[17px] leading-normal text-pretty lg:mt-5 lg:text-xl">
              ציון רק מבוגרים שהוכיחו שלמדו בקורס, בחשבונית או בתעודת סיום. כמה שילמו בפועל, מה קרה להם אחרי, ומה
              לשאול לפני שמשלמים.
            </p>
            <PenNote arrow className="mt-2.5 text-base font-medium lg:hidden">
              אף מוסד לא משלם לנו, ואף אחד לא קונה מקום ברשימה.
            </PenNote>

            {/* תוכן העניינים: שורות מחברת, המספר בעט בשוליים, השם קישור לפרק, ומתחתיו הנתון של הפרק. */}
            <nav aria-labelledby="toc-title" className="mt-6 lg:mt-10">
              <h2 id="toc-title" className="font-sans text-[15px] font-bold lg:text-base">
                בחוברת
              </h2>
              <div className="margin-rule mt-2">
                <ol className="ruled-top">
                  {toc.map((chapter, i) => (
                    <li
                      key={chapter.id}
                      data-anim="ink"
                      className="ruled-row grid grid-cols-[var(--margin)_minmax(0,1fr)] items-start py-2.5 lg:py-3.5"
                    >
                      <span className="flex justify-center pt-0.5">
                        <PenNumber n={i + 1} />
                      </span>
                      <div className="min-w-0 ps-3">
                        <a
                          href={`#${chapter.id}`}
                          className="group -my-2 inline-flex min-h-11 items-center gap-1.5 text-[17px] leading-snug font-bold transition-colors duration-150 hover:text-link-hover lg:text-[19px]"
                        >
                          <span className="pen-under">{chapter.label}</span>
                          <PenArrow className="me-0 h-[0.6em] w-[1.2em] flex-none opacity-0 transition-[opacity,translate] duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 motion-safe:translate-x-1.5 motion-safe:group-hover:translate-x-0" />
                        </a>
                        <p className="mt-0.5 font-sans text-sm leading-snug text-pretty text-ink-soft tabular-nums lg:text-[15px]">
                          {chapter.data}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </nav>
          </header>

          <aside aria-label="לשלוח הלאה" className="lg:pt-3">
            <div>
              <PenNote arrow className="hidden text-lg font-medium lg:block">
                אף מוסד לא משלם לנו, ואף אחד לא קונה מקום ברשימה.
              </PenNote>
              <p className="mt-1 hidden font-sans text-sm lg:block">
                <Link href="/who-pays-us" className={navLink}>
                  מי משלם לנו, ועל מה אף אחד לא יכול לשלם
                </Link>
              </p>
              <div className="hidden lg:mt-6 lg:block lg:border-t lg:border-rule lg:pt-4">
                <p className="font-sans text-[15px] font-bold">מישהו בקבוצה שואל איזה קורס?</p>
                <ShareLinks text={share.text} url={share.url} />
              </div>
              <SourceLegend />
            </div>
          </aside>
        </div>

        <div>
            {/* ===== 1. הקורסים ===== */}
            <section id="courses" aria-labelledby="courses-title" className="mt-10 scroll-mt-6 lg:mt-14">
              <h2 id="courses-title" className={chapterTitle}>
                הקורסים, לפי ציון הבוגרים
              </h2>
              <p className="mt-2 max-w-[62ch] font-sans text-[13px] leading-normal text-pretty text-ink-soft lg:text-sm">
                כל קורס בתחומי הטכנולוגיה שאורכו {MIN_HOURS} שעות ומעלה, או {MIN_MONTHS} חודשים ומעלה כשהמוסד לא מפרסם
                שעות. קודם קורסים עם ציון, מהגבוה לנמוך, ואחריהם מי שהכי קרוב לציון. ציון מוצג רק מ-{MIN_REVIEWS} ביקורות
                מאומתות.
              </p>
              {page.courses.length === 0 ? (
                <>
                  <p className="mt-4 max-w-[60ch] text-base leading-relaxed text-pretty">
                    עוד אין באתר קורס הסבה להייטק. האוסף השבועי מכניס קורסים חדשים, וקורס בתחומי הטכנולוגיה שאורכו{' '}
                    {MIN_HOURS} שעות ומעלה יופיע כאן לבד.
                  </p>
                  <div aria-hidden="true" className="ruled-row h-[30px]" />
                </>
              ) : (
                <ol className="mt-3">
                  {page.courses.map((course) => (
                    <li key={course.slug}>
                      <CourseRow course={course} showInstitution />
                    </li>
                  ))}
                </ol>
              )}
            </section>

            {/* ===== 2. מה קרה לבוגרים ===== */}
            <section id="outcomes" aria-labelledby="outcomes-title" className="mt-12 scroll-mt-6 lg:mt-16">
              <h2 id="outcomes-title" className={chapterTitle}>
                מה קרה לבוגרים
              </h2>
              <p className="mt-2 max-w-[62ch] font-sans text-[13px] leading-normal text-pretty text-ink-soft lg:text-sm">
                שלושה חודשים אחרי הסיום אנחנו שואלים את הבוגרים מה יצא להם מהקורס. התוצאה מוצגת רק כשענו לפחות 3.
              </p>
              {withNotes.length > 0 && (
                <ul className="mt-3">
                  {withNotes.map((course) => (
                    <li key={course.slug} data-anim="ink" className="ruled-row pt-3.5 pb-4 lg:pt-4 lg:pb-5">
                      <h3 className="text-[17px] leading-snug font-bold lg:text-[19px]">
                        <Link
                          href={`/courses/${course.slug}`}
                          className="-my-2.5 inline-flex min-h-11 items-center transition-colors duration-150 hover:text-link-hover"
                        >
                          <span className="pen-under">{course.title}</span>
                        </Link>
                      </h3>
                      <div className="mt-1.5 max-w-[64ch] space-y-1.5 text-[15px] leading-relaxed text-pretty lg:text-base">
                        {course.outcome ? (
                          <p>
                            <strong className="font-sans">אחרי 3 חודשים:</strong>{' '}
                            <Mark source="grads">{outcomeHeadline(course.outcome)}</Mark>
                            {outcomeBasis(course.outcome) && (
                              <span className="block font-sans text-[13px] text-ink-soft lg:text-sm">
                                {outcomeBasis(course.outcome)}.
                              </span>
                            )}
                          </p>
                        ) : (
                          <p className="font-sans text-[13px] text-ink-soft lg:text-sm">
                            עוד אין מספיק תשובות 3 חודשים אחרי הסיום.
                          </p>
                        )}
                        {course.summaryGood && (
                          <p>
                            <strong className="font-sans">טוב:</strong> <Mark source="grads">{course.summaryGood}</Mark>
                          </p>
                        )}
                        {course.summaryWeak && (
                          <p>
                            <strong className="font-sans">חלש:</strong> <Mark source="weak">{course.summaryWeak}</Mark>
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {withoutNotes.length > 0 && (
                <p className="mt-3 max-w-[62ch] text-[15px] leading-relaxed text-pretty lg:text-base">
                  <span className="font-sans font-bold">עוד אין תשובות על </span>
                  {withoutNotes.map((course, i) => (
                    <span key={course.slug}>
                      {i > 0 && (i === withoutNotes.length - 1 ? ' ו' : ', ')}
                      <Link href={`/courses/${course.slug}`} className={textLink}>
                        {course.title}
                      </Link>
                    </span>
                  ))}
                  .
                </p>
              )}
              {page.courses.length > 0 && withNotes.length === 0 && (
                <PenNote arrow className="mt-2">
                  כאן יופיעו התשובות, כשיהיו. ביקורת שלכם מקרבת את זה.
                </PenNote>
              )}
            </section>

            {/* ===== 3. מה לשאול לפני שמשלמים ===== */}
            <section id="questions" aria-labelledby="questions-title" className="mt-12 scroll-mt-6 lg:mt-16">
              <h2 id="questions-title" className={chapterTitle}>
                מה לשאול לפני שמשלמים
              </h2>
              <p className="mt-2 max-w-[62ch] font-sans text-[15px] leading-normal text-pretty lg:text-base">
                בשיחה עם נציג, לפני שחותמים. בקשו את התשובות בכתב.
              </p>
              <div className="margin-rule mt-3 lg:mt-4">
                <ol className="ruled-top">
                  {questions.map((q, i) => (
                    <li
                      key={q.text}
                      data-anim="ink"
                      className="ruled-row grid grid-cols-[var(--margin)_minmax(0,1fr)] items-start"
                    >
                      <span
                        aria-hidden="true"
                        className="pt-3 text-center font-sans text-[15px] leading-tight font-bold text-ink-soft tabular-nums lg:pt-[15px]"
                      >
                        {i + 1}
                      </span>
                      <div className="min-w-0 ps-3 pt-2.5 pb-2 lg:pt-3">
                        <p className="max-w-[64ch] text-base leading-normal font-semibold text-pretty lg:text-lg">{q.text}</p>
                        <p className="font-sans text-[13px] text-ink-soft lg:text-sm">
                          <Link href={q.href} className={cn(navLink, '-my-2')}>
                            במדריך: {q.section}
                          </Link>
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
              {/* המדריכים עצמם: פתקים לבנים עם מסקינג טייפ, כי הם מקום באתר (The White Note Rule). */}
              <ul className="mt-9 grid gap-x-6 gap-y-7 sm:grid-cols-2 lg:mt-10 lg:max-w-[760px]">
                {guides.map((g, i) => (
                  <li key={g.slug} className="flex">
                    <Link href={`/guides/${g.slug}`} className="group flex w-full text-ink">
                      <StickyNote
                        tone="paper"
                        tilt={i % 2 ? 1.1 : -1.3}
                        washi={WASHI[i % WASHI.length]}
                        className={cn(
                          'flex min-h-[92px] w-full flex-col px-4 pt-4 pb-3',
                          'transition-[translate,box-shadow] duration-200 ease-out group-hover:-translate-y-1 group-focus-visible:-translate-y-1',
                          'group-hover:shadow-[0_0_0_1px_rgb(30_36_44/0.08),0_2px_3px_rgb(30_36_44/0.08),0_18px_20px_-12px_rgb(30_36_44/0.42)]',
                        )}
                      >
                        <span className="text-[16px] leading-snug font-bold text-balance group-hover:text-link-hover lg:text-[17px]">
                          <span className="pen-under">{g.title}</span>
                        </span>
                        <span className="mt-auto pt-2 text-[13px] leading-tight text-ink-soft lg:text-sm">
                          {g.refs.length} עובדות שנבדקו מול מסמך, כל אחת עם המקור
                        </span>
                      </StickyNote>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            {/* ===== 4. סיימתם קורס הסבה? ===== */}
            <section id="graduates" aria-labelledby="graduates-title" className="mt-14 scroll-mt-6 lg:mt-20">
              <h2 id="graduates-title" className={chapterTitle}>
                סיימתם קורס הסבה?
              </h2>
              <p className="mt-2.5 max-w-[52ch] text-[17px] leading-normal text-pretty lg:text-xl">
                3 דקות של ביקורת, עם חשבונית או תעודה, יעזרו למי ששוקל עכשיו.
              </p>
              <p className="mt-2 max-w-[60ch] font-sans text-[13px] leading-normal text-pretty text-ink-soft lg:text-sm">
                ההוכחה נמחקת מיד אחרי הבדיקה. אין כאן פרסים או נקודות: אחרי שהביקורת מתפרסמת, אפשר לשתף ב-LinkedIn
                שאתם בוגרים מאומתים.
              </p>
              {closest.length > 0 && (
                <>
                  <PenNote arrow className="mt-3 lg:text-base">
                    לקורסים האלה חסרות עוד ביקורות עד לציון:
                  </PenNote>
                  <ul className="mt-1.5 space-y-1 font-sans text-[15px] leading-snug lg:text-base">
                    {closest.map((course) => {
                      const needed =
                        course.score.status === 'not_enough_reviews' ? course.score.reviewsNeeded : MIN_REVIEWS;
                      return (
                        <li key={course.slug}>
                          <Link
                            href={`/courses/${course.slug}/review`}
                            className="group flex min-h-11 flex-col justify-center gap-1 py-1.5 transition-colors duration-150 hover:text-link-hover"
                          >
                            <span className="min-w-0 underline underline-offset-[3px]">
                              לכתוב על {course.title}
                            </span>
                            <span className="flex items-center gap-2.5">
                              <ReviewTally have={Math.max(0, MIN_REVIEWS - needed)} />
                              <span className="inline-block font-pen text-[15px] font-medium whitespace-nowrap text-pen lg:text-base">
                                {moreReviewsText(needed)}
                              </span>
                              <span className="sr-only"> עד לציון</span>
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
              <Link
                href="/review"
                className={cn(buttonVariants(), 'mt-5 h-[50px] px-5 text-base font-bold lg:mt-6')}
              >
                לכתוב ביקורת על קורס שסיימתי
              </Link>
            </section>

            {/* הסוף: לשלוח את העמוד הלאה. בנייד זה המקום היחיד של השיתוף; במחשב הוא גם בעמודה שבצד. */}
            <section aria-labelledby="share-title" className="mt-14 border-t border-rule pt-5 lg:mt-20 lg:pt-7">
              <h2 id="share-title" className="text-[19px] leading-snug font-bold lg:text-[21px]">
                מישהו בקבוצה שואל איזה קורס?
              </h2>
              <p className="mt-1 font-sans text-[15px] leading-normal text-pretty lg:text-base">
                שלחו לו את העמוד הזה: {careerChangeCounts(page)}, ומה לשאול לפני שמשלמים.
              </p>
              <ShareLinks text={share.text} url={share.url} prominent className="mt-3" />
              <p className="font-sans text-[13px] lg:hidden">
                <Link href="/who-pays-us" className={navLink}>
                  מי משלם לנו, ועל מה אף אחד לא יכול לשלם
                </Link>
              </p>
            </section>
        </div>
      </main>
    </Sheet>
  );
}
