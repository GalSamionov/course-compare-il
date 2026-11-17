import Link from 'next/link';
import { MarkSample } from '@/components/course/marks';
import { PenArrow } from '@/components/site/pen';

/**
 * "מה רואים כאן" (מסמך העיצוב 2026-11-17, דף הבית): במקום שלושת צעדי האימות. שלוש שורות, כל אחת בסימון שלה,
 * כמו בעמוד הקורס: קו כחול למה שהמוסד אומר, ירוק למה שנבדק מול מסמך, ובעט מה שלא כתוב.
 * הדוגמאות בלי תווית לקורא מסך (כמו MarkSample במקרא): המשמעות כתובה בהן עצמן.
 * לידן הדלת לבדיקה: מי שקיבל הצעה או ראה מודעה מדביק את הקישור ב-/request-course.
 * אחרי הרשימה, ולא לפני התיבה: התיבה צריכה להיות במסך הראשון, בנייד ובמחשב.
 * כשיש קורס עם ציון, במחשב הסיכום לדוגמה עומד משמאל (app/page.tsx), והעט מצביע אליו מכאן. בנייד הוא לא מוצג.
 */
export function WhatYouSee({ example = false }: { example?: boolean }) {
  return (
    <section aria-labelledby="what-you-see-title" className="mt-10 ms-(--margin) ps-3 lg:ms-0 lg:mt-16 lg:ps-0">
      <h2 id="what-you-see-title" className="pen-rule text-[21px] leading-snug font-bold lg:text-[28px]">
        מה רואים כאן
      </h2>
      <ul className="mt-3 space-y-2.5 font-sans text-[15px] leading-relaxed lg:mt-4 lg:text-[17px]">
        <li>
          <span className="claim">מה המוסד אומר</span>
        </li>
        <li>
          <MarkSample source="verified">מה נבדק מול מסמך</MarkSample>
        </li>
        <li>
          <span className="font-pen text-[17px] font-medium text-pen lg:text-lg">מה לא כתוב</span>
        </li>
      </ul>
      {example && (
        <p className="mt-5 hidden font-pen text-lg font-medium text-pen lg:block">
          <PenArrow />
          ככה נראה סיכום של קורס אצלנו
        </p>
      )}
      <p className="mt-4 font-sans text-[15px] font-semibold lg:text-base">
        <Link
          href="/request-course"
          className="inline-flex min-h-11 items-center underline underline-offset-[3px] hover:text-link-hover"
        >
          קיבלתם הצעה או ראיתם מודעה? הדביקו את הקישור
        </Link>
      </p>
    </section>
  );
}
