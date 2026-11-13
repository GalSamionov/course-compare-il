import type { CoursePageData } from '@/lib/data/course-page';
import { formatHebrewDate } from '@/lib/format';
import { Claim, Mark, StickyNote } from './marks';

const formatLabels: Record<string, string> = {
  online: 'אונליין',
  in_person: 'בכיתה',
  hybrid: 'משולב',
  recorded: 'מוקלט',
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="font-sans font-bold">{label}</dt>
      <dd className="m-0">{children}</dd>
    </>
  );
}

export function AboutSection({ course }: { course: CoursePageData }) {
  const formats = course.formats.map((f) => formatLabels[f] ?? f).join(' או ');
  // שורת המשך מציגה רק את מה שידוע. חודשים ושעות נבדקו מול אתר המוסד, ולכן הם במרקר ירוק.
  const duration = [
    course.durationMonths !== null ? `${course.durationMonths} חודשים` : null,
    course.totalHours !== null ? `${course.totalHours} שעות` : null,
  ]
    .filter(Boolean)
    .join(', ');
  const handsOn =
    course.handsOnHours === null
      ? null
      : course.totalHours !== null
        ? `מהן ${course.handsOnHours} שעות עשייה`
        : `${course.handsOnHours} שעות עשייה`;
  return (
    <section id="about" className="mt-7">
      <h2 className="inline-block border-b-2 border-ink pb-0.5 text-[21px] font-bold">על הקורס</h2>

      {course.syllabus.length > 0 && (
        <>
          <h3 className="mt-4 font-sans text-base font-bold">מה לומדים, {course.syllabus.length} פרקים</h3>
          <ol className="mt-1 list-decimal pr-6">
            {course.syllabus.map((item, i) => (
              <li key={`${i}-${item.title}`}>{item.weak ? <Mark source="weak">{item.title}</Mark> : item.title}</li>
            ))}
          </ol>
        </>
      )}

      <dl className="mt-4 grid grid-cols-[112px_minmax(0,1fr)] gap-x-3 gap-y-2 text-[15px] leading-relaxed">
        {(duration || handsOn) && (
          <Row label="משך">
            {duration && <Mark source="verified">{duration}</Mark>}
            {duration && handsOn && ', '}
            {handsOn}
          </Row>
        )}
        {course.schedule && <Row label="מתי">{course.schedule}</Row>}
        {formats && <Row label="איך">{course.region ? `${formats}, ${course.region}` : formats}</Row>}
        {course.nextCohortDate && <Row label="המחזור הבא">{formatHebrewDate(course.nextCohortDate)}</Row>}
        {course.lecturersNote && course.lecturers.length === 0 && (
          <Row label="מרצים">
            <Claim>{course.lecturersNote}</Claim>
          </Row>
        )}
        {course.admission && <Row label="תנאי קבלה">{course.admission}</Row>}
        {course.classSizeNote && (
          <Row label="בכיתה">
            <Claim>{course.classSizeNote}</Claim>
          </Row>
        )}
        {course.certificate && <Row label="תעודה">{course.certificate}</Row>}
        {course.institutionPromises && (
          <Row label="המוסד מבטיח">
            <Claim>{course.institutionPromises}</Claim>
          </Row>
        )}
      </dl>

      {course.outcome && (
        <StickyNote tone="grad" tilt={1} className="mt-4 ml-8 px-3 py-2.5 text-sm">
          <strong>מה קרה בפועל:</strong> {course.outcome.n} בוגרים ענו 3 חודשים אחרי הסיום. ציון התוצאה:{' '}
          {course.outcome.mean.toFixed(1)} מתוך 5.
        </StickyNote>
      )}
    </section>
  );
}
