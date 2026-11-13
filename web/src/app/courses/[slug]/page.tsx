import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AboutSection } from '@/components/course/about-section';
import { CourseActions } from '@/components/course/course-actions';
import { GradsSection, hasGradsSection } from '@/components/course/grads-section';
import { LecturersSection } from '@/components/course/lecturers-section';
import { PriceSection } from '@/components/course/price-section';
import { ReviewsSection } from '@/components/course/reviews-section';
import { SiteFooter } from '@/components/site/site-footer';
import { SiteHeader } from '@/components/site/site-header';
import { ScoreBox } from '@/components/course/score-box';
import { SourceLegend } from '@/components/course/source-legend';
import { VideoSection } from '@/components/course/video-section';
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
const textLink = 'underline decoration-1 underline-offset-[3px]';

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
    <div className="mx-auto max-w-[680px] px-[22px]">
      <SiteHeader />

      <main>
        <nav aria-label="מיקום" className="mt-3.5 font-sans text-[13px] text-ink-soft">
          <Link href="/courses" className={textLink}>
            קורסים
          </Link>
          {course.categorySlug && (
            <>
              {' › '}
              <Link href={`/categories/${course.categorySlug}`} className={textLink}>
                {course.categoryName}
              </Link>
            </>
          )}
        </nav>
        <h1 className="mt-0.5 text-[30px] leading-tight font-bold">{course.title}</h1>
        <p className="mt-1 font-sans text-[15px] text-ink-soft">
          {course.institutionName}
          {course.region ? `, ${course.region}` : ''}
        </p>
        {course.status === 'removed' && (
          <p role="status" className="mt-2 font-sans text-[15px] font-semibold">
            הקורס כבר לא מוצע. ההיסטוריה והביקורות נשארות כאן.
          </p>
        )}
        <nav aria-label="בעמוד הזה" className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 font-sans text-[15px] font-semibold">
          {course.videoUrl && (
            <a href="#video" className={textLink}>
              סרטון
            </a>
          )}
          <a href="#about" className={textLink}>
            על הקורס
          </a>
          {course.lecturers.length > 0 && (
            <a href="#lecturers" className={textLink}>
              מרצים
            </a>
          )}
          <a href="#price" className={textLink}>
            מחיר
          </a>
          {hasGrads && (
            <a href="#grads" className={textLink}>
              מה הבוגרים אומרים
            </a>
          )}
          {hasReviews && (
            <a href="#reviews" className={textLink}>
              ביקורות ({reviewCount})
            </a>
          )}
        </nav>

        <ScoreBox score={course.score} />
        <SourceLegend />
        {course.videoUrl && <VideoSection url={course.videoUrl} />}
        <AboutSection course={course} />
        <LecturersSection course={course} />
        <PriceSection course={course} />
        {hasGrads && <GradsSection course={course} />}
        <ReviewsSection slug={course.slug} reviews={course.reviews} total={reviewCount} />
        <CourseActions courseId={course.id} slug={course.slug} title={course.title} />

        {course.lastCheckedAt && (
          <p className="mt-4 font-sans text-[13px] text-ink-soft">
            פרטי הקורס נבדקו מול אתר המוסד ב-{formatHebrewDate(course.lastCheckedAt)}.{' '}
            <Link href="/method" className="underline">
              איך אנחנו מסכמים ומי משלם לנו
            </Link>
          </p>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
