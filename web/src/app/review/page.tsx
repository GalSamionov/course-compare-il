import type { Metadata } from 'next';
import { CoursePicker } from '@/components/review/course-picker';
import { Sheet } from '@/components/site/sheet';
import { getCatalog } from '@/lib/data/catalog';
import { SITE_NAME } from '@/lib/site';

/** סטטי, עם הקטלוג מהמטמון. */
export const ensureStatic = 'navigation';

export const metadata: Metadata = { title: `כתיבת ביקורת | ${SITE_NAME}` };

/** המסלול "סיימתי קורס, רוצה לכתוב עליו" מדף הבית: בוחרים קורס, ועוברים לכתיבה. */
export default async function ReviewPage() {
  const { courses, categories } = await getCatalog();
  return (
    <Sheet narrow>
      <main className="pt-[22px] pb-10 lg:pt-12 lg:pb-14">
        <h1 className="text-[30px] leading-tight font-bold text-balance lg:text-[48px] lg:leading-[1.1]">
          כתיבת ביקורת
        </h1>
        <p className="mt-2 max-w-[60ch] font-sans text-[15px] leading-normal text-ink-soft lg:mt-3 lg:text-lg">
          בוחרים קורס, עונים על כמה שאלות, ומצמידים הוכחה שלמדתם בו.
        </p>
        <CoursePicker
          courses={courses.map(({ slug, title, institutionName }) => ({ slug, title, institutionName }))}
          categories={categories.map(({ slug, name, parentSlug, isLeaf }) => ({ slug, name, parentSlug, isLeaf }))}
        />
      </main>
    </Sheet>
  );
}
