'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Stamp } from '@/components/course/stamp';
import { PenArrow } from '@/components/site/pen';
import { buttonVariants } from '@/components/ui/button';
import { useAccount } from '@/lib/account/store';
import { questionsFor, type MetricDef } from '@/lib/reviews/steps';
import { isUuid, type CourseType } from '@/lib/reviews/types';
import { createBrowserSupabase } from '@/lib/supabase/browser-client';
import { cn } from '@/lib/utils';
import { ReviewFlow } from './review-flow';
import { ACCOUNTS_OPEN } from '@/lib/site';

/** מה ש-my_course_link מחזירה: רק לבוגר שהוסיף את הקורס. */
interface LinkedCourse {
  course_id: string;
  title: string;
  institution_name: string;
  course_type: CourseType | null;
  status: 'pending' | 'approved' | 'merged' | 'rejected';
  decision_reason: string | null;
  live_slug: string | null;
  merged_slug: string | null;
}

type Load = { kind: 'loading' } | { kind: 'missing' } | { kind: 'error' } | { kind: 'ready'; course: LinkedCourse };

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const title = 'mt-[22px] text-[30px] leading-tight font-bold text-balance lg:mt-12 lg:text-[48px] lg:leading-[1.1]';
const line = 'mt-3 max-w-[60ch] font-sans text-[15px] leading-normal lg:text-base';
const link = 'inline-flex min-h-11 items-center font-semibold underline underline-offset-[3px] hover:text-link-hover';
const primary = cn(buttonVariants(), 'mt-5 h-[50px] px-6 font-sans text-base font-bold');

/**
 * כתיבת ביקורת על קורס שהבוגר הוסיף מקישור (/review/new?course=<id>). הקורס טיוטה, ולכן הוא לא בקטלוג ולא
 * בעמוד סטטי: הוא נטען כאן, מהמסד, רק למי שהוסיף אותו (my_course_link). משם זה מסלול הכתיבה הרגיל, בחמישה צעדים.
 * קורס שכבר אושר, או שמוזג לקורס שכבר באתר: ממשיכים בעמוד הכתיבה שלו.
 */
export function LinkCourseReview({ metrics }: { metrics: MetricDef[] }) {
  const courseId = useSearchParams().get('course');
  const validId = isUuid(courseId) ? courseId : null;
  const account = useAccount();
  const userId = account.status === 'signed-in' ? account.userId : null;
  const router = useRouter();
  const [load, setLoad] = useState<Load>({ kind: 'loading' });

  useEffect(() => {
    if (!userId || !validId) return;
    let alive = true;
    createBrowserSupabase()
      .rpc('my_course_link', { p_course_id: validId })
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) return setLoad({ kind: 'error' });
        const course = data as unknown as LinkedCourse | null;
        if (!course) return setLoad({ kind: 'missing' });
        const next = course.live_slug ?? course.merged_slug;
        if (next && SLUG.test(next)) return router.replace(`/courses/${next}/review`);
        setLoad({ kind: 'ready', course });
      });
    return () => {
      alive = false;
    };
  }, [userId, validId, router]);

  if (!validId) {
    return (
      <>
        <h1 className={title}>כתיבת ביקורת</h1>
        <p className={line}>
          הקישור לא שלם.{' '}
          <Link href="/review" className={link}>
            לבחור קורס
          </Link>
        </p>
      </>
    );
  }
  if (account.status === 'signed-out') {
    return (
      <>
        <h1 className={title}>כתיבת ביקורת</h1>
        {ACCOUNTS_OPEN ? (
          <>
            <p className={line}>הקורס שהוספתם מחכה לכם. הוא עוד לא באתר, ולכן צריך להתחבר כדי להמשיך.</p>
            <Link href={`/login?next=${encodeURIComponent(`/review/new?course=${validId}`)}`} className={primary}>
              להתחבר ולהמשיך
            </Link>
          </>
        ) : (
          // ההתחברות עוד לא פתוחה באתר החי (ACCOUNTS_OPEN).
          <p className={line}>כתיבת ביקורות נפתחת בקרוב.</p>
        )}
      </>
    );
  }
  if (account.status === 'error' || load.kind === 'error') {
    return (
      <>
        <h1 className={title}>כתיבת ביקורת</h1>
        <p role="alert" className={cn(line, 'font-bold')}>
          לא הצלחנו לטעון את הקורס. נסו לרענן את הדף.
        </p>
      </>
    );
  }
  if (load.kind === 'loading') {
    return (
      <>
        <h1 className={title}>כתיבת ביקורת</h1>
        <p role="status" className="sr-only">
          טוענים את הקורס
        </p>
      </>
    );
  }
  if (load.kind === 'missing') {
    return (
      <>
        <h1 className={title}>כתיבת ביקורת</h1>
        <p className={line}>
          לא מצאנו את הקורס הזה אצלכם. אם כבר כתבתם עליו, הביקורת מחכה ב&quot;הביקורות שלי&quot;.{' '}
          <Link href="/me#reviews" className={link}>
            לביקורות שלי
          </Link>
        </p>
      </>
    );
  }

  const { course } = load;
  if (course.status === 'rejected') {
    return (
      <>
        <h1 className={title}>{course.title}</h1>
        <p className="mt-2.5 lg:mt-4">
          <Stamp>{course.institution_name}</Stamp>
        </p>
        <div role="note" className="mt-6 border-s border-ink ps-3 font-sans text-[15px] leading-normal">
          <p className="font-bold">בדקנו, והקורס לא נוסף לאתר.</p>
          {course.decision_reason && <p className="mt-1 max-w-[60ch] text-pretty">{course.decision_reason}</p>}
        </div>
        <p className={line}>
          <Link href="/me#reviews" className={link}>
            לביקורות שלי
          </Link>
        </p>
      </>
    );
  }
  if (!course.course_type) {
    return (
      <>
        <h1 className={title}>{course.title}</h1>
        <p role="alert" className={cn(line, 'font-bold')}>
          חסר לנו סוג הקורס, ולכן אי אפשר לשאול את השאלות. כתבו לנו, ונסדר.
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className={title}>ביקורת על {course.title}</h1>
      <p className="mt-2.5 lg:mt-4">
        <Stamp>{course.institution_name}</Stamp>
      </p>
      {/* קול האתר בעט, מתחת לחותמת ולא מעל הכותרת (DESIGN.md, Don't: שורת קיקר). */}
      <p className="mt-4 font-pen text-[15px] leading-snug font-medium text-pen lg:text-base">
        <PenArrow />
        עוד לא באתר
      </p>
      <p className="mt-1 max-w-[60ch] font-sans text-[15px] leading-normal text-ink-soft lg:text-base">
        עד שנבדוק את הקורס, הוא לא מופיע באתר. אחרי שנאשר אותו ואת ההוכחה, הוא והביקורת עולים לאתר יחד.
      </p>
      <ReviewFlow
        form={{
          courseId: course.course_id,
          slug: '',
          title: course.title,
          institutionName: course.institution_name,
          courseType: course.course_type,
          questions: questionsFor(course.course_type, metrics),
          writePath: `/review/new?course=${course.course_id}`,
        }}
      />
    </>
  );
}
