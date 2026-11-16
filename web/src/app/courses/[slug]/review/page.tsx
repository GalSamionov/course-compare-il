import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Stamp } from '@/components/course/stamp';
import { ReviewFlow } from '@/components/review/review-flow';
import { Sheet } from '@/components/site/sheet';
import { getCourseSlugs } from '@/lib/data/course-page';
import { getReviewForm } from '@/lib/reviews/review-form';
import { SITE_NAME } from '@/lib/site';

/**
 * כמו עמוד הקורס: נבנה מראש לכל קורס, וקורס שלא נבנה מראש נבנה במלואו בבקשה הראשונה, כך ש-notFound()
 * מחזיר 404 אמיתי. ההתחברות והטיוטה נטענות בדפדפן (ReviewFlow), ולכן העמוד נשאר סטטי.
 * תמונת השיתוף של הקורס (../opengraph-image.tsx) חלה גם על העמוד הזה.
 */
export const ensureStatic = 'navigation';

export async function generateStaticParams() {
  const slugs = await getCourseSlugs();
  return slugs.map((slug) => ({ slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const form = await getReviewForm(slug);
  return { title: form ? `ביקורת על ${form.title} | ${SITE_NAME}` : `כתיבת ביקורת | ${SITE_NAME}` };
}

export default async function CourseReviewPage({ params }: Props) {
  const { slug } = await params;
  const form = await getReviewForm(slug);
  if (!form) notFound();
  return (
    <Sheet narrow>
      <main id="main" className="pb-10 lg:pb-14">
        <nav aria-label="מיקום" className="mt-2 font-sans text-[13px] text-ink-soft lg:mt-6 lg:text-sm">
          <Link
            href={`/courses/${form.slug}`}
            className="inline-flex min-h-11 items-center underline decoration-1 underline-offset-[3px] hover:text-link-hover"
          >
            {form.title}
          </Link>
        </nav>
        <h1 className="mt-0.5 text-[30px] leading-tight font-bold text-balance lg:text-[48px] lg:leading-[1.1]">
          ביקורת על {form.title}
        </h1>
        {form.institutionName && (
          <p className="mt-2.5 lg:mt-4">
            <Stamp>{form.institutionName}</Stamp>
          </p>
        )}
        <ReviewFlow form={form} />
      </main>
    </Sheet>
  );
}
