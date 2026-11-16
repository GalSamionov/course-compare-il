import Link from 'next/link';
import { Sheet } from '@/components/site/sheet';
import { SITE_NAME } from '@/lib/site';

export default function LecturerNotFound() {
  return (
    <Sheet narrow>
      <main id="main" className="py-16">
        <title>{`לא מצאנו את המרצה | ${SITE_NAME}`}</title>
        <h1 className="text-2xl font-bold lg:text-[40px]">לא מצאנו את המרצה</h1>
        <p className="mt-2 font-sans text-ink-soft">
          ייתכן שהקישור שגוי, או שאין לו עוד קורסים באתר.{' '}
          <Link
            href="/courses"
            className="-my-3 inline-flex min-h-11 items-center text-ink underline underline-offset-[3px] hover:text-link-hover"
          >
            לכל הקורסים
          </Link>
        </p>
      </main>
    </Sheet>
  );
}
