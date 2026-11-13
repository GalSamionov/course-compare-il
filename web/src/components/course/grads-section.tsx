import type { CoursePageData } from '@/lib/data/course-page';
import { Mark } from './marks';

/** האם יש מה להציג בחלק. גם הניווט בראש העמוד משתמש בזה, כדי לא לקשר לחלק שלא קיים. */
export function hasGradsSection(course: CoursePageData): boolean {
  return Boolean(course.summaryGood || course.summaryWeak || course.metrics.length > 0);
}

export function GradsSection({ course }: { course: CoursePageData }) {
  if (!hasGradsSection(course)) return null;
  return (
    <section id="grads" className="mt-7">
      <h2 className="inline-block border-b-2 border-ink pb-0.5 text-[21px] font-bold">מה הבוגרים אומרים</h2>
      {course.summaryGood && (
        <p className="mt-2.5">
          <strong className="font-sans">טוב:</strong> <Mark source="grads">{course.summaryGood}</Mark>
        </p>
      )}
      {course.summaryWeak && (
        <p className="mt-2">
          <strong className="font-sans">חלש:</strong> <Mark source="weak">{course.summaryWeak}</Mark>
        </p>
      )}
      {course.metrics.length > 0 && (
        <table className="mt-3.5 w-full border-collapse font-sans text-[15px] tabular-nums">
          <caption className="pb-1 text-right font-bold">ציונים לפי שאלה, מתוך 5</caption>
          <tbody>
            {course.metrics.map((m) => (
              <tr key={m.key} className="border-b border-rule last:border-b-0">
                <th scope="row" className="py-1.5 text-right font-normal">
                  {m.label}
                </th>
                <td className="text-left font-bold">{m.mean.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
