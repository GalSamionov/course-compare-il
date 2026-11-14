import type { Metadata } from 'next';
import { ComingSoon } from '@/components/site/coming-soon';
import { getCourseSlugs } from '@/lib/data/course-page';

/**
 * תמונת השיתוף של הקורס (../opengraph-image.tsx) חלה גם על העמוד הזה, והכתובת שלה תלויה בקורס.
 * לכן, כמו בעמוד הקורס, העמוד נבנה מראש לכל קורס, וקורס שלא נבנה מראש נבנה במלואו בבקשה הראשונה.
 */
export const ensureStatic = 'navigation';

export async function generateStaticParams() {
  const slugs = await getCourseSlugs();
  return slugs.map((slug) => ({ slug }));
}

export const metadata: Metadata = { title: 'כל הביקורות | [שם האתר]' };

export default function CourseReviewsPage() {
  return <ComingSoon title="כל הביקורות" line="כל הביקורות המאומתות על הקורס, מהחדשה לישנה." />;
}
