import type { CoursePageData } from '@/lib/data/course-page';
import { formatHebrewDate } from '@/lib/format';
import { Claim, Mark, PenNote, StickyNote } from './marks';

const initials = (name: string) =>
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
    <section id="lecturers" className="mt-7">
      <h2 className="inline-block border-b-2 border-ink pb-0.5 text-[21px] font-bold">על המרצים</h2>
      <p className="mt-1.5 font-sans text-[13px] text-ink-soft">
        המרצים משתנים בין מחזורים. הרשימה לפי אתר המוסד
        {course.nextCohortDate ? `, למחזור שנפתח ב-${formatHebrewDate(course.nextCohortDate)}` : ''}.
      </p>

      <div className="mt-4 flex flex-col gap-5">
        {course.lecturers.map((lecturer) => (
          <article key={lecturer.slug} className="grid grid-cols-[52px_minmax(0,1fr)] gap-x-3">
            <div
              aria-hidden="true"
              className="flex size-[52px] items-center justify-center rounded-full border-[1.5px] border-ink font-sans text-lg font-bold"
            >
              {initials(lecturer.name)}
            </div>
            <div>
              <h3 className="text-lg leading-snug font-bold">{lecturer.name}</h3>
              {lecturer.role && <p className="font-sans text-sm text-ink-soft">{lecturer.role}</p>}
              {lecturer.institutionBio && (
                <p className="mt-1.5 text-[15px] leading-relaxed">
                  <span className="font-sans font-bold">לפי המוסד:</span> <Claim>{lecturer.institutionBio}</Claim>
                </p>
              )}
              <p className="mt-1 text-[15px] leading-relaxed">
                <span className="font-sans font-bold">מה בדקנו:</span>{' '}
                {lecturer.verifiedFacts.length > 0 ? (
                  lecturer.verifiedFacts.map((fact) => (
                    <a key={fact.text} href={fact.sourceUrl} target="_blank" rel="noopener noreferrer" className="me-1">
                      <Mark source="verified">{fact.text}</Mark>
                    </a>
                  ))
                ) : (
                  <span className="text-ink-soft">לא מצאנו מידע ציבורי שאפשר לבדוק.</span>
                )}
              </p>
              {lecturer.otherCoursesCount > 0 && (
                <PenNote className="mt-0.5 text-sm">← {otherCoursesText(lecturer.otherCoursesCount)}</PenNote>
              )}
            </div>
          </article>
        ))}
      </div>

      {course.lecturersSummary && (
        <StickyNote tone="grad" tilt={-1} className="mt-5 ml-6 px-3 py-2.5 text-sm">
          <strong>מה הבוגרים אומרים על המרצים:</strong> {course.lecturersSummary}
        </StickyNote>
      )}
    </section>
  );
}
