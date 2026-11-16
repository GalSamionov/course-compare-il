import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AboutSection } from '@/components/course/about-section';
import { AtAGlance } from '@/components/course/at-a-glance';
import { CourseActions } from '@/components/course/course-actions';
import { GradsSection, hasGradsSection } from '@/components/course/grads-section';
import { LecturersSection } from '@/components/course/lecturers-section';
import { PriceSection } from '@/components/course/price-section';
import { ReviewsSection } from '@/components/course/reviews-section';
import { ScoreBox } from '@/components/course/score-box';
import { SourceLegend } from '@/components/course/source-legend';
import { Stamp } from '@/components/course/stamp';
import { VideoSection } from '@/components/course/video-section';
import { PenArrow } from '@/components/site/pen';
import { Sheet } from '@/components/site/sheet';
import { getCoursePage, getCourseSlugs } from '@/lib/data/course-page';
import { formatHebrewDate } from '@/lib/format';
import { courseShareDescription, courseShareMessage, courseShareTitle } from '@/lib/og/share-text';
import { SITE_NAME, SITE_URL } from '@/lib/site';

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

/**
 * הקישור הוא נקודת המגע הראשונה (PRODUCT.md): כותרת, תיאור עם הציון ומספר המאומתים, ותמונה
 * מ-opengraph-image.tsx שבאותה תיקייה. openGraph מחליף את זה של הפריסה, ולכן siteName ו-locale חוזרים כאן.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCoursePage(slug);
  if (!course) return {};
  const title = courseShareTitle(course);
  const description = courseShareDescription(course);
  return {
    title: `${title} | ${SITE_NAME}`,
    description,
    alternates: { canonical: `/courses/${course.slug}` },
    openGraph: { type: 'article', locale: 'he_IL', siteName: SITE_NAME, url: `/courses/${course.slug}`, title, description },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function CoursePage({ params }: Props) {
  const { slug } = await params;
  const course = await getCoursePage(slug);
  if (!course) notFound();

  const reviewCount = course.reviewTotal;
  // "לשלוח בוואטסאפ": אותו טקסט כמו בתצוגה של קישור משותף, והכתובת המלאה (SITE_URL, כמו בתמונת השיתוף).
  const share = { text: courseShareMessage(course), url: `${SITE_URL}/courses/${course.slug}` };
  // הקישורים בניווט מופיעים רק כשהחלק שהם מובילים אליו מוצג, ומספר הפרקים סופר רק אותם.
  const hasGrads = hasGradsSection(course);
  const hasReviews = course.reviews.length > 0;
  const sections = [
    { id: 'about', label: 'על הקורס', shown: true },
    { id: 'video', label: 'סרטון', shown: Boolean(course.videoUrl) },
    { id: 'lecturers', label: 'מרצים', shown: course.lecturers.length > 0 },
    { id: 'price', label: 'מחיר', shown: true },
    { id: 'grads', label: 'מה הבוגרים אומרים', shown: hasGrads },
    { id: 'reviews', label: `ביקורות (${reviewCount})`, shown: hasReviews },
  ].filter((s) => s.shown);

  return (
    <Sheet>
      <main id="main">
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
          במחשב: עמודת הסיכום מימין, ועמודה צדדית משמאל שנשארת במקום בגלילה: הציון, "בקצרה" (מה ששולם בפועל,
          מה קרה לבוגרים והחולשה הבולטת) ושתי הפעולות. היא נכנסת גם במסך של מחשב נייד.
          מקרא הצבעים בעמודת הסיכום, מעל "על הקורס". בנייד: הציון, "בקצרה" והמקרא מיד אחרי הכותרת, והפעולות בסוף העמוד.
          הסרטון של המוסד קטן, ובא אחרי "על הקורס": הוא שיווק, ולא אמור להיות כבד מהציון.
        */}
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-x-20">
          <header className="lg:col-start-1 lg:row-start-1">
            <h1 className="mt-0.5 text-[30px] leading-tight font-bold text-balance lg:text-[54px] lg:leading-[1.06]">
              {course.title}
            </h1>
            <p className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-sans text-[15px] text-ink-soft lg:mt-4 lg:text-base">
              {course.institutionSlug ? (
                <Link href={`/institutions/${course.institutionSlug}`} className="group inline-flex min-h-11 items-center">
                  <Stamp className="transition-colors duration-150 group-hover:border-link-hover group-hover:text-link-hover">
                    {course.institutionName}
                  </Stamp>
                </Link>
              ) : (
                <Stamp>{course.institutionName}</Stamp>
              )}
              {course.region && <span>{course.region}</span>}
            </p>
            {course.status === 'removed' && (
              <p role="status" className="mt-2 font-sans text-[15px] font-semibold">
                הקורס כבר לא מוצע. ההיסטוריה והביקורות נשארות כאן.
              </p>
            )}
            {/* מספר הפרקים בעמוד גלוי בניווט (חוזה עמוד הקורס, FORM), כמו מספר הפרקים על גב של כריכה. כתוב בעט: זה האתר שמסכם את הדף. */}
            <nav
              aria-label="בעמוד הזה"
              className="mt-1.5 flex flex-wrap items-center gap-x-4 font-sans text-[15px] font-semibold lg:mt-4 lg:text-base"
            >
              <span className="inline-flex min-h-11 items-center font-pen text-[15px] font-medium text-pen lg:text-base">
                {sections.length} פרקים בעמוד
                <PenArrow className="ms-1.5 me-0" />
              </span>
              {sections.map((s) => (
                <a key={s.id} href={`#${s.id}`} className={navLink}>
                  {s.label}
                </a>
              ))}
            </nav>
          </header>

          <aside
            aria-label="הציון ובקצרה"
            className="lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:pt-3"
          >
            <div className="lg:sticky lg:top-8 lg:pb-10">
              <ScoreBox score={course.score} />
              <AtAGlance course={course} />
              {/* במחשב הפעולות כאן, תמיד בהישג יד. בנייד הן בסוף העמוד (החוזה של עמוד הקורס). */}
              <div className="hidden lg:block">
                <CourseActions courseId={course.id} slug={course.slug} title={course.title} share={share} stacked />
              </div>
            </div>
          </aside>

          <div className="lg:col-start-1 lg:row-start-2 lg:max-w-[560px]">
            <SourceLegend />
          </div>

          <div className="lg:col-start-1 lg:row-start-3 lg:max-w-[68ch] lg:text-[17px]">
            <AboutSection course={course} />
            {course.videoUrl && <VideoSection url={course.videoUrl} />}
            <LecturersSection course={course} />
            <PriceSection course={course} />
            {hasGrads && <GradsSection course={course} />}
            <ReviewsSection slug={course.slug} reviews={course.reviews} total={reviewCount} />
            <div className="lg:hidden">
              <CourseActions courseId={course.id} slug={course.slug} title={course.title} share={share} />
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
