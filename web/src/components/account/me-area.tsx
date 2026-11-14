'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MAX_COMPARE } from '@/lib/account/lists';
import { useAccount } from '@/lib/account/store';
import { parseQuery } from '@/lib/search/query';
import type { Catalog } from '@/lib/search/types';
import { cn } from '@/lib/utils';
import { AccountSection } from './account-section';
import { CompareTray } from './compare-tray';
import { MeSection } from './me-section';
import { MyAnswers } from './my-answers';
import { SavedCourses } from './saved-courses';

const navLink = 'inline-flex min-h-11 items-center underline decoration-1 underline-offset-[3px] hover:text-link-hover';

/**
 * האזור האישי, לפי הציור (Me.dc.html): התשובות, השמורים, ההשוואה, "הביקורות שלי" (בקרוב) והחשבון.
 * הכול נטען בדפדפן. מי שלא מחובר עובר להתחברות, וחוזר לכאן אחריה.
 * קורס שכבר לא בקטלוג (הוסר מהאתר) לא מוצג. ראו notes-for-plan-2.md.
 */
export function MeArea({ catalog }: { catalog: Catalog }) {
  const account = useAccount();
  const router = useRouter();
  const [left, setLeft] = useState<'signed-out' | 'deleted' | null>(null);

  useEffect(() => {
    if (account.status === 'signed-out' && left === null) router.replace('/login?next=%2Fme');
    if (account.status === 'signed-out' && left === 'signed-out') router.replace('/');
  }, [account.status, left, router]);

  if (left === 'deleted') {
    return (
      <div role="status" className="mt-6 font-sans text-[15px] leading-normal">
        <p className="font-bold">החשבון נמחק. המייל וכל מה ששמרתם כבר לא אצלנו.</p>
        <Link href="/" className="inline-flex min-h-11 items-center underline underline-offset-[3px]">
          לדף הבית
        </Link>
      </div>
    );
  }
  if (account.status === 'error') {
    return (
      <p role="alert" className="mt-6 font-sans text-[15px] font-bold">
        לא הצלחנו לטעון את האזור שלכם. נסו לרענן את הדף.
      </p>
    );
  }
  if (account.status !== 'signed-in') {
    return (
      <p role="status" className="sr-only">
        טוענים את האזור שלכם
      </p>
    );
  }

  const byId = new Map(catalog.courses.map((course) => [course.id, course]));
  const saved = account.saved.flatMap((id) => byId.get(id) ?? []);
  const slots = account.compare.flatMap((slot) => {
    const course = byId.get(slot.courseId);
    return course ? [{ position: slot.position, course }] : [];
  });
  const inCompare = (courseId: string) => account.compare.some((slot) => slot.courseId === courseId);
  const query = account.answers ? parseQuery(new URLSearchParams(account.answers.params)) : null;

  return (
    <>
      <nav
        aria-label="בעמוד הזה"
        className="mt-1.5 flex flex-wrap gap-x-4 font-sans text-[15px] leading-tight font-semibold lg:mt-3 lg:gap-x-6 lg:text-base"
      >
        <a href="#answers" className={navLink}>
          התשובות שלי
        </a>
        <a href="#saved" className={navLink}>
          שמורים ({saved.length})
        </a>
        <a href="#compare" className={navLink}>
          ההשוואה ({slots.length} מתוך {MAX_COMPARE})
        </a>
        <a href="#reviews" className={navLink}>
          הביקורות שלי
        </a>
        <a href="#account" className={cn(navLink, 'min-w-11')}>
          החשבון
        </a>
      </nav>
      {/*
        קו השוליים לאורך כל החלקים, כמו בציור. במחשב: מחברת פתוחה בשני עמודים, התשובות והשמורים מימין,
        וההשוואה, הביקורות והחשבון משמאל, עם קפל באמצע.
      */}
      <div className="mt-[18px] lg:mt-10 lg:grid lg:grid-cols-2">
        <div className="margin-rule flow-root lg:pe-10 lg:[background:linear-gradient(to_right,rgb(0_0_0/0.05),transparent_36px)_left/36px_100%_no-repeat]">
          <MyAnswers catalog={catalog} query={query} savedAt={account.answers?.updatedAt ?? null} />
          <SavedCourses courses={saved} inCompare={inCompare} query={query} />
        </div>
        <div className="lg:border-s lg:border-rule lg:ps-10 lg:[background:linear-gradient(to_left,rgb(0_0_0/0.06),transparent_36px)_right/36px_100%_no-repeat]">
          <div className="margin-rule flow-root lg:[--bleed:2.5rem]">
          <CompareTray slots={slots} />
          <MeSection id="reviews" title="הביקורות שלי" className="mt-8">
            <p className="ms-(--margin) mt-2.5 ps-3 text-base leading-[1.7]">
              <strong className="font-sans">בקרוב.</strong> כאן יופיעו הביקורות שתכתבו על קורסים שסיימתם, ואם כל
              אחת כבר אומתה.
            </p>
            <div aria-hidden="true" className="ruled-row h-[30px]" />
            <div aria-hidden="true" className="ruled-row h-[38px]" />
          </MeSection>
          <AccountSection email={account.email} onLeave={setLeft} />
          </div>
        </div>
      </div>
    </>
  );
}
