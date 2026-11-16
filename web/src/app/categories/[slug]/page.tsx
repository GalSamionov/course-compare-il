import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { CareerChangeLink } from '@/components/category/career-change-link';
import { TopByGraduates } from '@/components/category/top-by-graduates';
import { PenNote } from '@/components/course/marks';
import { NotebookPage } from '@/components/notebook/notebook-page';
import { SubjectsToc } from '@/components/site/subjects-toc';
import { isTechCategory } from '@/lib/data/career-change';
import { getCatalog } from '@/lib/data/catalog';
import { movedCategoryHref } from '@/lib/search/query';
import { EMPTY_QUERY } from '@/lib/search/types';
import { SITE_NAME } from '@/lib/site';

/**
 * כמו עמוד הקורס: העמוד כולו סטטי, ותחום שלא נבנה מראש נבנה בבקשה הראשונה.
 * כך notFound() רץ לפני שהתשובה מתחילה, ותחום שלא קיים מחזיר 404 אמיתי.
 */
export const ensureStatic = 'navigation';

export async function generateStaticParams() {
  const { categories } = await getCatalog();
  return categories.map((c) => ({ slug: c.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = (await getCatalog()).categories.find((c) => c.slug === slug);
  if (!category) return {};
  return {
    title: `${category.name}: כל הקורסים | ${SITE_NAME}`,
    description: `${category.description ? `${category.description} ` : ''}קורסים ב${category.name}, לפי ציון של בוגרים מאומתים בלבד. אף מוכר לא משלם לנו.`,
  };
}

const crumb = 'inline-flex min-h-11 items-center underline decoration-1 underline-offset-[3px] hover:text-link-hover';

const coursesText = (n: number) => (n === 1 ? 'קורס אחד' : `${n} קורסים`);
const gradsText = (n: number) =>
  n === 0 ? 'עוד אין בוגרים מאומתים' : n === 1 ? 'בוגר מאומת אחד' : `${n} בוגרים מאומתים`;

/** אותה מחברת, עם שורה 1 קבועה: התחום של העמוד. */
export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const catalog = await getCatalog();
  // תחום שיצא משימוש (ai, מ-16.11.2026): קישור ישן עובר לתחומים שהחליפו אותו.
  const replacements = catalog.moved[slug];
  if (replacements) permanentRedirect(movedCategoryHref(replacements));
  const category = catalog.categories.find((c) => c.slug === slug);
  if (!category) notFound();
  const parent = catalog.categories.find((c) => c.slug === category.parentSlug);
  const empty = category.courseCount === 0;
  // תחום בהייטק ("טכנולוגיה" וכל מה שמתחתיו) מקשר לעמוד ההסבה. תחום מסוג תחביב או מבחן לא, גם אם הוא שם.
  const parentOf = (s: string) => catalog.categories.find((c) => c.slug === s)?.parentSlug ?? null;
  const careerLink = isTechCategory(category.slug, parentOf) && catalog.courses.some(
    (c) => (c.categorySlug === category.slug || c.categoryParentSlug === category.slug) && c.courseType === 'career',
  );

  return (
    <NotebookPage
      catalog={catalog}
      base={{ ...EMPTY_QUERY, cats: [category.slug] }}
      fixedWhat
      alwaysShowResults
      heading={category.name}
      intro={
        // התיאור של התחום בדיו, ואחריו איך משתמשים בעמוד. בתחום בלי קורסים אין עוד מה לצמצם.
        <>
          {category.description && <span className="text-ink">{category.description} </span>}
          {empty ? 'עוד אין בו קורסים באתר.' : 'כל הקורסים בתחום, לפי ציון הבוגרים. אפשר לצמצם בשורות 2 עד 4.'}
        </>
      }
      headSideAlign="start"
      headSide={
        // במחשב העמודה גבוהה מהכותרת, ולכן היא מיושרת לראש ולא לתחתית. 32 פיקסלים מלמעלה:
        // השורה הראשונה בעט עומדת מול פירורי הלחם (mt-6 ויעד מגע של 44), ולא צמודה לקו של כותרת האתר.
        <div className="lg:pt-8">
          {empty ? (
            // תחום בלי קורסים: בלי "המובילים לפי בוגרים", שאין בו עוד מה לדרג.
            <PenNote arrow className="text-base font-medium lg:text-lg">
              כשנוסיף קורס בתחום, הוא יופיע כאן עם ציון הבוגרים שלו.
            </PenNote>
          ) : (
            <>
              <PenNote arrow className="text-base font-medium lg:text-lg">
                בתחום: {coursesText(category.courseCount)}, {gradsText(category.gradCount)}.
              </PenNote>
              <TopByGraduates courses={catalog.courses} categorySlug={category.slug} />
            </>
          )}
          {careerLink && <CareerChangeLink className="mt-6 lg:mt-7" />}
        </div>
      }
      after={
        <SubjectsToc
          categories={catalog.categories}
          heading="תחומים אחרים"
          exclude={category.slug}
          className="lg:max-w-[620px]"
        />
      }
      before={
        <nav aria-label="מיקום" className="mt-2 font-sans text-[13px] text-ink-soft lg:mt-6 lg:text-sm">
          <Link href="/courses" className={crumb}>
            קורסים
          </Link>
          {parent && (
            <>
              {' › '}
              <Link href={`/categories/${parent.slug}`} className={crumb}>
                {parent.name}
              </Link>
            </>
          )}
        </nav>
      }
    />
  );
}
