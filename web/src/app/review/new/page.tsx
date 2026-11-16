import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LinkCourseReview } from '@/components/review/link-course-review';
import { Sheet } from '@/components/site/sheet';
import { getReviewMetrics } from '@/lib/reviews/review-form';
import { SITE_NAME } from '@/lib/site';

/** סטטי, כמו /review: הקורס, ההתחברות והטיוטה נטענים בדפדפן (LinkCourseReview). */
export const ensureStatic = 'navigation';

export const metadata: Metadata = {
  title: `ביקורת על קורס חדש | ${SITE_NAME}`,
  // עמוד של משתמש אחד, על קורס שעוד לא באתר.
  robots: { index: false, follow: false },
};

/** כתיבת ביקורת על קורס שהבוגר הוסיף מקישור (/review/new?course=<id>). הקורס לא באתר עד שנבדוק אותו. */
export default async function NewCourseReviewPage() {
  const metrics = await getReviewMetrics();
  return (
    <Sheet narrow>
      <main id="main" className="pb-10 lg:pb-14">
        {/* useSearchParams: בלי Suspense כל העמוד היה עובר לדפדפן (use-search-params.md). */}
        <Suspense fallback={<h1 className="mt-[22px] text-[30px] leading-tight font-bold lg:mt-12 lg:text-[48px]">כתיבת ביקורת</h1>}>
          <LinkCourseReview metrics={metrics} />
        </Suspense>
      </main>
    </Sheet>
  );
}
