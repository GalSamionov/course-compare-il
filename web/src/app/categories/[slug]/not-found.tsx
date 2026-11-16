import Link from 'next/link';
import { Sheet } from '@/components/site/sheet';
import { SITE_NAME } from '@/lib/site';

export default function CategoryNotFound() {
  return (
    <Sheet narrow>
      <main id="main" className="py-16">
        <title>{`התחום לא נמצא | ${SITE_NAME}`}</title>
        <h1 className="text-2xl font-bold lg:text-[40px]">התחום לא נמצא</h1>
        <p className="mt-2 font-sans text-ink-soft">
          ייתכן שהקישור שגוי.{' '}
          <Link href="/courses" className="underline underline-offset-[3px]">
            לכל הקורסים
          </Link>
        </p>
      </main>
    </Sheet>
  );
}
