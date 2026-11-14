import Link from 'next/link';
import { Sheet } from '@/components/site/sheet';

export default function CategoryNotFound() {
  return (
    <Sheet narrow>
      <main className="py-16">
        <title>התחום לא נמצא | [שם האתר]</title>
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
