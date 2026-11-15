import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { Mark, PenNote, Tape } from '@/components/course/marks';
import { Stamp } from '@/components/course/stamp';
import { TickMark } from '@/components/notebook/tick';
import { buttonVariants } from '@/components/ui/button';
import { Sheet } from '@/components/site/sheet';
import { badgeHeadline, badgeTitle, type Badge } from '@/lib/badges/badge';
import { loadBadge } from '@/lib/badges/load';
import { SITE_NAME } from '@/lib/site';
import { cn } from '@/lib/utils';

type Props = { params: Promise<{ token: string }> };

/**
 * "בוגר מאומת": הכרטיס שכותב משתף ב-LinkedIn, אחרי שהביקורת שלו פורסמה (docs/b2b/2026-11-15-go-to-market.md).
 * הכול בבקשה ובלי מטמון: כשהכותב מפסיק לשתף, מכבה את השם או מוחק את הביקורת, הבקשה הבאה כבר רואה את זה.
 * ה-proxy בודק את הטוקן לפני שהתשובה מתחילה, ומחזיר 404 אמיתי לקישור שכבר לא עובד. כאן בודקים שוב.
 * הכרטיס מראה רק את הקורס, את המוסד ו"בוגר/ת מאומת/ת". שם רק אם הכותב בחר. אף פעם לא הטקסט של הביקורת.
 * העמוד לא נכנס למנועי חיפוש (noindex), גם אחרי ההשקה.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const badge = await loadBadge(token);
  const robots = { index: false, follow: false };
  if (!badge) return { title: `הקישור כבר לא פעיל | ${SITE_NAME}`, robots };
  return {
    title: `${badgeHeadline(badge)} | ${SITE_NAME}`,
    description: `ביקורת מאומתת על ${badge.courseTitle}, ${badge.institutionName}. ביקורת מתפרסמת רק אחרי הוכחה שלמדו בקורס, ואף מוסד לא משלם לנו.`,
    robots,
    openGraph: { type: 'website', locale: 'he_IL', siteName: SITE_NAME },
  };
}

export default function BadgePage({ params }: Props) {
  return (
    <Sheet narrow>
      <main className="pb-4">
        <Suspense fallback={<div aria-hidden="true" className="h-[420px] lg:h-[520px]" />}>
          <BadgeView params={params} />
        </Suspense>
      </main>
    </Sheet>
  );
}

async function BadgeView({ params }: Props) {
  await connection();
  const { token } = await params;
  const badge = await loadBadge(token);
  if (!badge) notFound();
  return <BadgeContent badge={badge} />;
}

/**
 * מדבקת שם של מחברת, כמו הלוגו: מסגרת כפולה בדיו, מודבקת בסלוטייפ. "בוגר/ת מאומת/ת" במרקר הירוק,
 * כי ההשתתפות בקורס נבדקה מול מסמך, והעט מסמן וי. שם הקורס והמוסד בדיו: הם עובדה.
 */
function BadgeContent({ badge }: { badge: Badge }) {
  const title = badgeTitle(badge);
  return (
    <>
      <div className="relative mt-10 rotate-[-0.8deg] bg-white p-3 shadow-[0_1px_2px_rgb(0_0_0/0.16),0_14px_22px_-12px_rgb(0_0_0/0.42)] ring-1 ring-black/[0.05] lg:mt-16 lg:p-4">
        <Tape width={84} tilt={-3} />
        <div className="border-[1.5px] border-ink px-5 pt-6 pb-6 lg:px-10 lg:pt-10 lg:pb-9">
          <h1 className="text-[28px] leading-tight font-bold text-balance lg:text-[48px] lg:leading-[1.08]">
            {badge.shownName && <span className="mb-1 block text-[21px] lg:text-[30px]">{badge.shownName},</span>}
            <span className="inline-flex flex-wrap items-center gap-x-2.5">
              <Mark source="verified">{title}</Mark>
              <TickMark className="size-7 lg:size-10" strokeWidth={2.6} />
            </span>
            <span className="mt-1 block">של {badge.courseTitle}</span>
          </h1>
          <p className="mt-5 lg:mt-7">
            <Stamp>{badge.institutionName}</Stamp>
          </p>
        </div>
      </div>

      <p className="mt-7 max-w-[58ch] text-base leading-relaxed text-pretty lg:mt-10 lg:text-lg">
        {badge.shownName ? badge.shownName : 'מי ששיתף את הכרטיס'} כתב/ה ביקורת על הקורס, אחרי שהעלה/תה הוכחה שלמד/ה
        בו: חשבונית, קבלה או תעודת סיום. ההוכחה נמחקה מיד אחרי הבדיקה.
      </p>
      <PenNote arrow className="mt-2 text-base font-medium lg:text-lg">
        זו הכרה ולא פרס: על ביקורת לא מקבלים כאן כלום, ואף מוסד לא משלם לנו.
      </PenNote>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row lg:mt-9">
        <Link
          href={`/courses/${badge.courseSlug}#reviews`}
          className={cn(buttonVariants(), 'h-[50px] px-5 text-base font-bold')}
        >
          לקרוא את הביקורות על הקורס
        </Link>
        <Link
          href="/review"
          className={cn(buttonVariants({ variant: 'outline' }), 'h-[50px] border-[1.5px] border-ink px-5 text-base font-bold')}
        >
          סיימתם קורס? לכתוב ביקורת
        </Link>
      </div>
      <p className="mt-3 font-sans text-[13px] text-ink-soft lg:text-sm">
        <Link
          href="/who-pays-us"
          className="inline-flex min-h-11 items-center underline underline-offset-[3px] hover:text-link-hover"
        >
          מי משלם לנו, ועל מה אף אחד לא יכול לשלם
        </Link>
      </p>
    </>
  );
}
