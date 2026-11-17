import type { Metadata } from 'next';
import { ComingSoon } from '@/components/site/coming-soon';
import { getCourseSlugs } from '@/lib/data/course-page';
import { NOINDEX } from '@/lib/seo/indexing';
import { SITE_NAME } from '@/lib/site';
import { slugParams } from '@/lib/data/static-params';

/**
 * תמונת השיתוף של הקורס (../opengraph-image.tsx) חלה גם על העמוד הזה, והכתובת שלה תלויה בקורס.
 * לכן, כמו בעמוד הקורס, העמוד נבנה מראש לכל קורס, וקורס שלא נבנה מראש נבנה במלואו בבקשה הראשונה.
 */
export const ensureStatic = 'navigation';

export async function generateStaticParams() {
  const slugs = await getCourseSlugs();
  return slugParams(slugs);
}

/** העמוד עוד לא נבנה (ComingSoon): לא במנועי חיפוש עד שיהיה בו תוכן. */
export const metadata: Metadata = { title: `כל הביקורות | ${SITE_NAME}`, robots: NOINDEX };

export default function CourseReviewsPage() {
  return <ComingSoon title="כל הביקורות" line="כל הביקורות המאומתות על הקורס, מהחדשה לישנה." />;
}
