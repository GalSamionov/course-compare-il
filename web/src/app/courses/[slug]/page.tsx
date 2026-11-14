import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AboutSection } from '@/components/course/about-section';
import { CourseActions } from '@/components/course/course-actions';
import { GradsSection, hasGradsSection } from '@/components/course/grads-section';
import { LecturersSection } from '@/components/course/lecturers-section';
import { PriceSection } from '@/components/course/price-section';
import { PaidLine } from '@/components/course/paid-line';
import { ReviewsSection } from '@/components/course/reviews-section';
import { ScoreBox } from '@/components/course/score-box';
import { SourceLegend } from '@/components/course/source-legend';
import { Stamp } from '@/components/course/stamp';
import { VideoSection } from '@/components/course/video-section';
import { Sheet } from '@/components/site/sheet';
import { getCoursePage, getCourseSlugs } from '@/lib/data/course-page';
import { formatHebrewDate } from '@/lib/format';

/**
 * העמוד כולו סטטי: הנתונים מגיעים מ-getCoursePage שבמטמון (cacheLife('hours')).
 * קורס שלא נבנה מראש נבנה בבקשה הראשונה, והבקשה מחכה לעמוד המלא במקום לקבל שלד.
 * כך notFound() רץ לפני שהתשובה מתחילה, וכתובת של קורס שלא קיים מחזירה 404 אמיתי.
 */
export const ensureStatic = 'navigation';

export async function generateStaticParams() {
  const slugs = await getCourseSlugs();
  return slugs.map((slug) => ({ slug }));
}

type Props = { params: Promise<{ slug: string }> };

/** קישור בתוך טקסט, עם קו דק כמו בלוח. כפתורים וקישורי מקור נשארים בלי זה. */
const textLink = 'underline decoration-1 underline-offset-[3px] hover:text-link-hover';
/** קישור בניווט: יעד מגע של 44 פיקסלים. */
const navLink = `inline-flex min-h-11 items-center ${textLink}`;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCoursePage(slug);
  if (!course) return {};
  const scoreText = course.score.status === 'scored' ? ` ציון בוגרים ${course.score.value.toFixed(1)} מתוך 10.` : '';
  return {
    title: `${course.title}, ${course.institutionName} | [שם האתר]`,
    description: `מה באמת לומדים, כמה שילמו בפועל ומה אומרים בוגרים מאומתים.${scoreText}`,
  };
}

export default async function CoursePage({ params }: Props) {
  const { slug } = await params;
  const course = await getCoursePage(slug);
  if (!course) notFound();

  const reviewCount = course.reviewTotal;
  // הקישורים בניווט מופיעים רק כשהחלק שהם מובילים אליו מוצג.
  const hasGrads = hasGradsSection(course);
  const hasReviews = course.reviews.length > 0;

  return (
    <Sheet>
      <main>
        <nav aria-label="מיקום" className="mt-2 font-sans text-[13px] text-ink-soft lg:mt-6 lg:text-sm">
          <Link href="/courses" className={navLink}>
            קורסים
          </Link>
          {course.categorySlug && (
            <>
              {' › '}
              <Link href={`/categories/${course.categorySlug}`} className={navLink}>
                {course.categoryName}
              </Link>
            </>
          )}
        </nav>
        {/*
          במחשב: עמודת הסיכום מימין, ועמודה צדדית משמאל שנשארת במקום בגלילה: הציון, מה ששולם בפועל,
          מקרא הצבעים כפתק מודבק, ושתי הפעולות. בנייד אותה עמודה מופיעה אחרי הכותרת, והפעולות בסוף העמוד.
        */}
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-x-20">
          <header className="lg:col-start-1 lg:row-start-1">
            <h1 className="mt-0.5 text-[30px] leading-tight font-bold text-balance lg:text-[54px] lg:leading-[1.06] lg:font-extrabold">
              {course.title}
            </h1>
            <p className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-sans text-[15px] text-ink-soft lg:mt-4 lg:text-base">
              <Stamp>{course.institutionName}</Stamp>
              {course.region && <span>{course.region}</span>}
            </p>
            {course.status === 'removed' && (
              <p role="status" className="mt-2 font-sans text-[15px] font-semibold">
                הקורס כבר לא מוצע. ההיסטוריה והביקורות נשארות כאן.
              </p>
            )}
            <nav
              aria-label="בעמוד הזה"
              className="mt-1.5 flex flex-wrap gap-x-4 font-sans text-[15px] font-semibold lg:mt-4 lg:gap-x-6 lg:text-base"
            >
              {course.videoUrl && (
                <a href="#video" className={navLink}>
                  סרטון
                </a>
              )}
              <a href="#about" className={navLink}>
                על הקורס
              </a>
              {course.lecturers.length > 0 && (
                <a href="#lecturers" className={navLink}>
                  מרצים
                </a>
              )}
              <a href="#price" className={navLink}>
                מחיר
              </a>
              {hasGrads && (
                <a href="#grads" className={navLink}>
                  מה הבוגרים אומרים
                </a>
              )}
              {hasReviews && (
                <a href="#reviews" className={navLink}>
                  ביקורות ({reviewCount})
                </a>
              )}
            </nav>
          </header>

          <aside
            aria-label="בקצרה"
            className="lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:pt-3"
          >
            <div className="lg:sticky lg:top-8 lg:pb-10">
              <ScoreBox score={course.score} />
              <PaidLine course={course} />
              <SourceLegend />
              {/* במחשב הפעולות כאן, תמיד בהישג יד. בנייד הן בסוף העמוד (החוזה של עמוד הקורס). */}
              <div className="hidden lg:block">
                <CourseActions courseId={course.id} slug={course.slug} title={course.title} stacked />
              </div>
            </div>
          </aside>

          <div className="lg:col-start-1 lg:row-start-2 lg:max-w-[68ch] lg:text-[17px]">
            {course.videoUrl && <VideoSection url={course.videoUrl} />}
            <AboutSection course={course} />
            <LecturersSection course={course} />
            <PriceSection course={course} />
            {hasGrads && <GradsSection course={course} />}
            <ReviewsSection slug={course.slug} reviews={course.reviews} total={reviewCount} />
            <div className="lg:hidden">
              <CourseActions courseId={course.id} slug={course.slug} title={course.title} />
            </div>

            {course.lastCheckedAt && (
              <p className="mt-6 font-sans text-[13px] text-ink-soft lg:mt-12 lg:text-sm">
                פרטי הקורס נבדקו מול אתר המוסד ב-{formatHebrewDate(course.lastCheckedAt)}.{' '}
                <Link href="/method" className="underline hover:text-link-hover">
                  איך אנחנו מסכמים ומי משלם לנו
                </Link>
              </p>
            )}
          </div>
        </div>
      </main>
    </Sheet>
  );
}
