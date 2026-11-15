import { Sheet } from '@/components/site/sheet';
import { SITE_NAME } from '@/lib/site';

export default function CourseNotFound() {
  return (
    <Sheet narrow>
      <main className="py-16">
        <title>{`הקורס לא נמצא | ${SITE_NAME}`}</title>
        <h1 className="text-2xl font-bold lg:text-[40px]">הקורס לא נמצא</h1>
        <p className="mt-2 font-sans text-ink-soft">ייתכן שהקישור שגוי, או שהקורס הוסר מהקטלוג.</p>
      </main>
    </Sheet>
  );
}
