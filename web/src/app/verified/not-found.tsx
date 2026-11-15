import Link from 'next/link';
import { Sheet } from '@/components/site/sheet';
import { SITE_NAME } from '@/lib/site';

/** קישור "בוגר מאומת" שכבר לא עובד: הכותב הפסיק לשתף, או שהביקורת כבר לא באתר. לא אומרים מה מהשניים. */
export default function BadgeNotFound() {
  return (
    <Sheet narrow>
      <main className="py-16">
        <title>{`הקישור כבר לא פעיל | ${SITE_NAME}`}</title>
        <meta name="robots" content="noindex, nofollow" />
        <h1 className="text-2xl font-bold lg:text-[40px]">הקישור הזה כבר לא פעיל</h1>
        <p className="mt-2 max-w-[56ch] font-sans text-ink-soft text-pretty">
          מי ששיתף אותו הפסיק לשתף, או שהביקורת כבר לא באתר.
        </p>
        <p className="mt-3 font-sans text-[15px]">
          <Link href="/courses" className="inline-flex min-h-11 items-center underline underline-offset-[3px] hover:text-link-hover">
            לכל הקורסים, וביקורות רק מבוגרים מאומתים
          </Link>
        </p>
      </main>
    </Sheet>
  );
}
