import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CourseRow } from '@/components/course/course-row';
import { Claim, PenNote } from '@/components/course/marks';
import { SourceLegend } from '@/components/course/source-legend';
import { Sheet } from '@/components/site/sheet';
import { compareByScore } from '@/lib/data/course-order';
import { getCoursePage, type CoursePageData } from '@/lib/data/course-page';
import { INSTITUTION_KIND_LABEL, getInstitutionPage, getInstitutionSlugs } from '@/lib/data/institution-page';
import { verifiedGraduatesText } from '@/lib/format';
import { SITE_NAME } from '@/lib/site';

/**
 * כמו עמוד הקורס: העמוד כולו סטטי, ומוסד שלא נבנה מראש נבנה בבקשה הראשונה.
 * כך notFound() רץ לפני שהתשובה מתחילה, ומוסד שלא קיים מחזיר 404 אמיתי.
 * /institutions/join הוא עמוד נפרד, וכתובת קבועה גוברת על [slug].
 */
export const ensureStatic = 'navigation';

export async function generateStaticParams() {
  const slugs = await getInstitutionSlugs();
  return slugs.map((slug) => ({ slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const institution = await getInstitutionPage(slug);
  if (!institution) return {};
  return {
    title: `${institution.name}: כל הקורסים באתר | ${SITE_NAME}`,
    alternates: { canonical: `/institutions/${institution.slug}` },
    description: `הקורסים של ${institution.name} באתר, לכל אחד ציון משלו מבוגרים מאומתים בלבד. אף מוכר לא משלם לנו.`,
  };
}

const textLink = 'underline decoration-1 underline-offset-[3px] transition-colors duration-150 hover:text-link-hover';
const navLink = `inline-flex min-h-11 items-center ${textLink}`;

const coursesText = (n: number) => (n === 1 ? 'קורס אחד באתר' : `${n} קורסים באתר`);
const gradsText = (n: number) => (n === 0 ? 'עוד אין בוגרים מאומתים' : verifiedGraduatesText(n));

/** נקודה בין הפרטים בשורה שמתחת לשם, צמודה למילה שאחריה. קישוט: קורא מסך שומע את הפרטים עצמם. */
const Dot = () => (
  <span aria-hidden="true" className="text-ink-soft/70">
    {' · '}
  </span>
);

/**
 * פרטי המוסד, וכל הקורסים שלו, כמו דף אינדקס בסוף הסיכום (החוזה של עמוד מוסד ומרצה).
 * אין ציון למוסד (החלטה של גל, 15.11.2026): הספירה בראש העמוד היא ספירה, לא ציון, וההערה בעט אומרת למה.
 * במחשב: השם והפרטים מימין, ההערה בעט משמאל, והרשימה ברוחב הדף.
 */
export default async function InstitutionPage({ params }: Props) {
  const { slug } = await params;
  const institution = await getInstitutionPage(slug);
  if (!institution) notFound();
  const courses = (await Promise.all(institution.courseSlugs.map((s) => getCoursePage(s))))
    .filter((course): course is CoursePageData => course !== null)
    .sort(compareByScore);
  const grads = courses.reduce((sum, course) => sum + course.reviewTotal, 0);

  return (
    <Sheet>
      <main id="main">
        <nav aria-label="מיקום" className="mt-2 font-sans text-[13px] text-ink-soft lg:mt-6 lg:text-sm">
          <Link href="/courses" className={navLink}>
            קורסים
          </Link>
        </nav>
        <header className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)] lg:items-end lg:gap-x-16">
          <div>
            <h1 className="mt-0.5 text-[30px] leading-tight font-bold text-balance lg:text-[54px] lg:leading-[1.06]">
              {institution.name}
            </h1>
            {/* הנקודות צמודות למילים (רווח קשיח), כדי ששורה לא תיגמר בנקודה. בנייד הקישור לאתר יורד לשורה משלו. */}
            <div className="mt-2 flex flex-wrap items-center gap-x-2.5 font-sans text-[15px] text-ink-soft lg:mt-3.5 lg:text-base">
              <p className="tabular-nums">
                {INSTITUTION_KIND_LABEL[institution.kind]}
                <Dot />
                {coursesText(courses.length)}, {gradsText(grads)}
              </p>
              {institution.website && (
                <p>
                  <span className="hidden lg:inline">
                    <Dot />
                  </span>
                  <a
                    href={institution.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${navLink} font-semibold text-ink`}
                  >
                    לאתר המוסד<span className="sr-only"> (נפתח בחלון חדש)</span>
                  </a>
                </p>
              )}
            </div>
          </div>
          <PenNote arrow className="mt-1.5 max-w-[34ch] text-base font-medium lg:mt-0 lg:pb-3 lg:text-lg">
            אין כאן ציון למוסד. לכל קורס יש ציון משלו, רק מהבוגרים שלו.
          </PenNote>
        </header>

        <SourceLegend variant="inline" />

        <section id="courses" aria-labelledby="courses-title" className="mt-10 scroll-mt-6 lg:mt-14">
          <h2 id="courses-title" className="pen-rule text-[21px] font-bold lg:text-[28px]">
            הקורסים במוסד
          </h2>
          {courses.length > 1 && (
            <p className="mt-1.5 font-sans text-[13px] text-ink-soft lg:text-sm">
              קודם קורסים עם ציון, מהגבוה לנמוך. אחריהם מי שהכי קרוב לציון.
            </p>
          )}
          <ol className="mt-3">
            {courses.map((course) => (
              <li key={course.slug}>
                <CourseRow course={course}>
                  {course.institutionPromises && (
                    <p className="text-[15px] leading-relaxed text-pretty lg:mt-1">
                      <span className="font-sans font-bold">המוסד מבטיח:</span> <Claim>{course.institutionPromises}</Claim>
                    </p>
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
