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

export const metadata: Metadata = { title: 'כתיבת ביקורת | [שם האתר]' };

export default function CourseReviewPage() {
  return (
    <ComingSoon
      title="כתיבת ביקורת"
      line="כאן תכתבו ביקורת על הקורס, עם הוכחה שלמדתם בו: חשבונית, קבלה או תעודת סיום."
    />
  );
}
