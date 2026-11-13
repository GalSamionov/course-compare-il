import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { NotebookPage } from '@/components/notebook/notebook-page';
import { getCatalog } from '@/lib/data/catalog';
import { EMPTY_QUERY } from '@/lib/search/types';

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
    title: `${category.name}: כל הקורסים | [שם האתר]`,
    description: `קורסים ב${category.name}, לפי ציון של בוגרים מאומתים בלבד. אף מוכר לא משלם לנו.`,
  };
}

const crumb = 'underline decoration-1 underline-offset-[3px] hover:text-link-hover';

/** אותה מחברת, עם שורה 1 קבועה: התחום של העמוד. */
export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const catalog = await getCatalog();
  const category = catalog.categories.find((c) => c.slug === slug);
  if (!category) notFound();
  const parent = catalog.categories.find((c) => c.slug === category.parentSlug);

  return (
    <NotebookPage
      catalog={catalog}
      base={{ ...EMPTY_QUERY, cats: [category.slug] }}
      fixedWhat
      alwaysShowResults
      heading={category.name}
      intro="כל הקורסים בתחום, לפי ציון הבוגרים. אפשר לצמצם בשורות 2 עד 4."
      before={
        <nav aria-label="מיקום" className="mt-3.5 font-sans text-[13px] text-ink-soft">
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
