'use client';

import Link from 'next/link';
import { useId, useState } from 'react';
import { PenArrow } from '@/components/site/pen';
import { cn } from '@/lib/utils';

export interface PickerCourse {
  slug: string;
  title: string;
  institutionName: string;
}

/** בלי ניקוד ובלי הבדל בין אותיות גדולות לקטנות. */
const normalize = (text: string) => text.normalize('NFKD').replace(/[֑-ׇ]/g, '').toLowerCase();

const marginLabel = 'font-sans text-[13px] leading-tight text-ink-soft lg:text-[15px]';

/**
 * "איזה קורס סיימתם?": שורה במחברת, השאלה בשוליים והחיפוש בעט על הקו (כמו בעמוד ההתחברות).
 * מחפשים בשם הקורס או המוסד, וכל תוצאה מובילה לכתיבה.
 */
export function CoursePicker({ courses }: { courses: PickerCourse[] }) {
  const [query, setQuery] = useState('');
  const inputId = useId();
  const q = normalize(query.trim());
  const shown = (q ? courses.filter((c) => normalize(`${c.title} ${c.institutionName}`).includes(q)) : courses).slice(0, 30);
  return (
    <div className="margin-rule mt-6 lg:mt-10">
      <div className="ruled-top ruled-row ruled-active grid min-h-16 grid-cols-[var(--margin)_minmax(0,1fr)] items-center lg:min-h-[72px]">
        <label htmlFor={inputId} className={marginLabel}>
          איזה קורס סיימתם?
        </label>
        <input
          id={inputId}
          type="search"
          value={query}
          autoComplete="off"
          enterKeyHint="search"
          placeholder="שם הקורס או המוסד"
          onChange={(e) => setQuery(e.target.value)}
          className={cn(
            'min-w-0 self-stretch bg-transparent pt-5 ps-3 pb-1 outline-none',
            'font-pen text-xl font-medium text-pen caret-pen lg:text-[23px]',
            'placeholder:font-sans placeholder:text-[15px] placeholder:font-normal placeholder:text-ink-soft',
          )}
        />
      </div>
      <div aria-live="polite">
        {shown.length === 0 ? (
          <div className="grid grid-cols-[var(--margin)_minmax(0,1fr)] items-start pt-3">
            <p className=" pe-1.5 font-pen text-sm leading-snug font-medium text-pen lg:text-base">
              <PenArrow />
              אין כזה
            </p>
            <p className="ps-3 font-sans text-[15px] leading-normal">
              לא מצאנו קורס כזה.{' '}
              <Link href="/request-course" className="inline-flex min-h-11 items-center underline underline-offset-[3px] hover:text-link-hover">
                לבקש שנוסיף אותו
              </Link>
            </p>
          </div>
        ) : (
          <ul aria-label="קורסים">
            {shown.map((course) => (
              <li key={course.slug} className="ruled-row">
                <Link
                  href={`/courses/${course.slug}/review`}
                  className="group grid min-h-14 grid-cols-[var(--margin)_minmax(0,1fr)] items-center py-2 hover:text-link-hover"
                >
                  <span aria-hidden="true" className="opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                    <PenArrow className="ms-3 h-[0.9em] w-[1.6em]" />
                  </span>
                  <span className="flex min-w-0 flex-col ps-3">
                    <span className="font-sans text-base leading-snug font-semibold lg:text-[17px]">{course.title}</span>
                    <span className="font-sans text-[13px] text-ink-soft lg:text-sm">{course.institutionName}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
