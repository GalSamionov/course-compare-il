import type { CoursePageData } from '@/lib/data/course-page';
import { Mark } from './marks';

/** האם יש מה להציג בחלק. גם הניווט בראש העמוד משתמש בזה, כדי לא לקשר לחלק שלא קיים. */
export function hasGradsSection(course: CoursePageData): boolean {
  return Boolean(course.summaryGood || course.summaryWeak || course.metrics.length > 0);
}

export function GradsSection({ course }: { course: CoursePageData }) {
  if (!hasGradsSection(course)) return null;
  return (
    <section id="grads" className="mt-10 scroll-mt-6 lg:mt-14">
      <h2 className="pen-rule text-[21px] font-bold lg:text-[28px]">מה הבוגרים אומרים</h2>
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
          <caption className="pb-1.5 text-right font-bold">ציונים לפי שאלה, מתוך 5</caption>
          <tbody>
            {course.metrics.map((m) => (
              <tr key={m.key}>
                <th scope="row" className="w-[42%] py-1.5 pe-3 text-right align-middle font-normal lg:w-[34%]">
                  {m.label}
                </th>
                <td className="py-1.5 align-middle">
                  {/* פס במרקר הצהוב של הבוגרים, באורך הציון מתוך 5. נמרח כשהוא נכנס למסך. */}
                  <span className="flex items-center gap-2.5">
                    <span aria-hidden="true" className="relative h-[15px] flex-1">
                      <span
                        className="hl hl-grads absolute inset-y-0 start-0 block p-0"
                        data-tilt={m.key.length % 2 ? 'b' : 'a'}
                        style={{ width: `${Math.max(4, Math.min(100, (m.mean / 5) * 100))}%` }}
                      />
                    </span>
                    <span className="w-7 text-left font-bold">{m.mean.toFixed(1)}</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
