import Link from 'next/link';
import type { CoursePageData } from '@/lib/data/course-page';
import { formatHebrewDate } from '@/lib/format';
import { Claim, Mark, PenNote, StickyNote } from './marks';

export const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('');

const otherCoursesText = (n: number) => (n === 1 ? 'מרצה גם בקורס נוסף אחד באתר' : `מרצה גם ב-${n} קורסים נוספים באתר`);

export function LecturersSection({ course }: { course: CoursePageData }) {
  if (course.lecturers.length === 0) return null;
  return (
    <section id="lecturers" className="mt-10 scroll-mt-6 lg:mt-14">
      <h2 className="pen-rule text-[21px] font-bold lg:text-[28px]">על המרצים</h2>
      <p className="mt-1.5 font-sans text-[13px] text-ink-soft">
        המרצים משתנים בין מחזורים. הרשימה לפי אתר המוסד
        {course.nextCohortDate ? `, למחזור שנפתח ב-${formatHebrewDate(course.nextCohortDate)}` : ''}.
      </p>

      <div className="mt-4 flex flex-col gap-5">
        {course.lecturers.map((lecturer) => (
          <article key={lecturer.slug} className="grid grid-cols-[52px_minmax(0,1fr)] gap-x-3">
            {/* ראשי תיבות בעיגול דיו: אין לנו תמונות של מרצים, ולא ממציאים. */}
            <div
              aria-hidden="true"
              className="flex size-[52px] items-center justify-center rounded-full border-[1.5px] border-ink font-sans text-lg font-bold shadow-[inset_0_0_0_3px_white,inset_0_0_0_4px_var(--color-ink)]"
            >
              {initials(lecturer.name)}
            </div>
            <div>
              <h3 className="text-lg leading-snug font-bold lg:text-xl">
                {/* לעמוד המרצה. בריחוף העט מותח קו מתחת לשם, כמו בשם של קורס ברשימה. */}
                <Link
                  href={`/lecturers/${lecturer.slug}`}
                  className="-my-2.5 inline-flex min-h-11 items-center transition-colors duration-150 hover:text-link-hover"
                >
                  <span className="pen-under">{lecturer.name}</span>
                </Link>
              </h3>
              {lecturer.role && <p className="font-sans text-sm text-ink-soft">{lecturer.role}</p>}
              {lecturer.institutionBio && (
                <p className="mt-1.5 text-[15px] leading-relaxed">
                  <span className="font-sans font-bold">לפי המוסד:</span> <Claim>{lecturer.institutionBio}</Claim>
                </p>
              )}
              <p className="mt-1 text-[15px] leading-relaxed">
                <span className="font-sans font-bold">מה בדקנו:</span>{' '}
                {lecturer.verifiedFacts.length > 0 ? (
                  lecturer.verifiedFacts.map((fact, i) => (
                    <a
                      key={`${i}-${fact.text}`}
                      href={fact.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="me-1"
                    >
                      <Mark source="verified">{fact.text}</Mark>
                      <span className="sr-only"> (נפתח בחלון חדש)</span>
                    </a>
                  ))
                ) : (
                  <span className="text-ink-soft">לא מצאנו מידע ציבורי שאפשר לבדוק.</span>
                )}
              </p>
              {lecturer.otherCoursesCount > 0 && (
                <PenNote arrow className="mt-0.5 text-sm">{otherCoursesText(lecturer.otherCoursesCount)}</PenNote>
              )}
            </div>
          </article>
        ))}
      </div>

      {course.lecturersSummary && (
        <StickyNote tone="grad" tilt={-1} tiltLg={-1.4} className="mt-7 ml-6 px-3 pt-4 pb-2.5 text-sm lg:ml-0 lg:max-w-[340px] lg:text-[15px]">
          <strong>מה הבוגרים אומרים על המרצים:</strong> {course.lecturersSummary}
        </StickyNote>
      )}
    </section>
  );
}
