import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CourseRow } from '@/components/course/course-row';
import { initials } from '@/components/course/lecturers-section';
import { PenNote, StickyNote } from '@/components/course/marks';
import { SourceLegend } from '@/components/course/source-legend';
import { LecturerAbout } from '@/components/lecturer/lecturer-about';
import { Sheet } from '@/components/site/sheet';
import { compareByScore } from '@/lib/data/course-order';
import { getCoursePage } from '@/lib/data/course-page';
import { getLecturerPage, getLecturerSlugs } from '@/lib/data/lecturer-page';
import { SITE_NAME } from '@/lib/site';

/** כמו עמוד הקורס ועמוד המוסד: סטטי, ו-404 אמיתי למרצה שלא קיים. */
export const ensureStatic = 'navigation';

export async function generateStaticParams() {
  const slugs = await getLecturerSlugs();
  return slugs.map((slug) => ({ slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const lecturer = await getLecturerPage(slug);
  if (!lecturer) return {};
  return {
    title: `${lecturer.name}: הקורסים באתר | ${SITE_NAME}`,
    description: `הקורסים באתר ש${lecturer.name} מלמד או מלמדת בהם, מה המוסד אומר ומה בדקנו. אף מוכר לא משלם לנו.`,
  };
}

const navLink =
  'inline-flex min-h-11 items-center underline decoration-1 underline-offset-[3px] transition-colors duration-150 hover:text-link-hover';
const coursesText = (n: number) => (n === 1 ? 'קורס אחד באתר' : `${n} קורסים באתר`);

/**
 * המרצה: מה המוסד אומר, מה בדקנו, וכל הקורסים, עם התפקיד ומה הבוגרים אומרים על המרצים בכל קורס.
 * אין ציון למרצה (החלטה של גל, 15.11.2026): הציון בכל שורה הוא של הקורס, מכל הבוגרים שלו.
 * במחשב, כמו בעמוד המוסד: השם מימין, ההערה בעט משמאל, והרשימה ברוחב הדף.
 */
export default async function LecturerPage({ params }: Props) {
  const { slug } = await params;
  const lecturer = await getLecturerPage(slug);
  if (!lecturer) notFound();
  const pages = await Promise.all(lecturer.courses.map((course) => getCoursePage(course.slug)));
  const courses = lecturer.courses
    .flatMap((link, i) => {
      const page = pages[i];
      return page ? [{ role: link.role, page }] : [];
    })
    .sort((a, b) => compareByScore(a.page, b.page));

  return (
    <Sheet>
      <main id="main">
        <nav aria-label="מיקום" className="mt-2 font-sans text-[13px] text-ink-soft lg:mt-6 lg:text-sm">
          <Link href="/courses" className={navLink}>
            קורסים
          </Link>
        </nav>
        <header className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)] lg:items-end lg:gap-x-16">
          <div className="mt-0.5 grid grid-cols-[52px_minmax(0,1fr)] items-center gap-x-3 lg:grid-cols-[72px_minmax(0,1fr)] lg:gap-x-5">
            {/* ראשי תיבות בעיגול דיו כפול, כמו ב"על המרצים": אין לנו תמונות של מרצים, ולא ממציאים. */}
            <div
              aria-hidden="true"
              className="flex size-[52px] items-center justify-center rounded-full border-[1.5px] border-ink font-sans text-lg font-bold shadow-[inset_0_0_0_3px_white,inset_0_0_0_4px_var(--color-ink)] lg:size-[72px] lg:text-2xl"
            >
              {initials(lecturer.name)}
            </div>
            <div className="min-w-0">
              <h1 className="text-[30px] leading-tight font-bold text-balance lg:text-[54px] lg:leading-[1.06]">
                {lecturer.name}
              </h1>
              <p className="mt-1 font-sans text-[15px] text-ink-soft tabular-nums lg:mt-2 lg:text-base">
                {coursesText(courses.length)}
              </p>
            </div>
          </div>
          <PenNote arrow className="mt-3 max-w-[38ch] text-base font-medium lg:mt-0 lg:pb-1 lg:text-lg">
            אין כאן ציון למרצה. המרצים מתחלפים בין מחזורים, ולכל קורס יש ציון משלו.
          </PenNote>
        </header>

        <SourceLegend variant="inline" />
        <LecturerAbout lecturer={lecturer} />

        <section id="courses" aria-labelledby="courses-title" className="mt-10 scroll-mt-6 lg:mt-14">
          <h2 id="courses-title" className="pen-rule text-[21px] font-bold lg:text-[28px]">
            הקורסים
          </h2>
          <p className="mt-1.5 font-sans text-[13px] text-ink-soft lg:text-sm">לפי אתרי המוסדות. המרצים משתנים בין מחזורים.</p>
          <ol className="mt-3">
            {courses.map(({ role, page }) => (
              <li key={page.slug}>
                <CourseRow
                  course={page}
                  showInstitution
                  scoreLabel="ציון הבוגרים לקורס"
                  detail={role && <p className="mt-1 font-sans text-sm leading-normal lg:text-[15px]">התפקיד בקורס: {role}</p>}
                >
                  {page.lecturersSummary && (
                    <StickyNote
                      tone="grad"
                      tilt={-1}
                      tiltLg={-1.4}
                      className="mt-4 mb-1 ml-6 px-3 pt-4 pb-2.5 text-sm lg:mt-3 lg:ml-0 lg:max-w-[340px] lg:text-[15px]"
                    >
                      <strong>מה הבוגרים אומרים על המרצים בקורס:</strong> {page.lecturersSummary}
                    </StickyNote>
                  )}
                </CourseRow>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </Sheet>
  );
}
