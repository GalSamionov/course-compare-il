'use client';

import { useState } from 'react';
import { ChoiceChip } from '@/components/notebook/choice-chip';
import { ResultRow } from '@/components/notebook/results';
import { toggleCompare, toggleSaved, type ListResult } from '@/lib/account/store';
import { matchCourses } from '@/lib/search/match';
import type { CourseSummary, SearchQuery } from '@/lib/search/types';
import { MeSection, textButton } from './me-section';

/**
 * ההערה בשוליים: הקורס מול התשובות השמורות, באותו חישוב כמו ברשימה בדף הבית.
 * "מה" לא נבדק: את הקורס כבר בחרו. קורס שלא מתאים בשני דברים נשאר בלי הערה.
 */
function noteFor(course: CourseSummary, query: SearchQuery | null): string {
  if (!query) return '';
  const [result] = matchCourses([course], { ...query, off: [...query.off, 'what'] });
  return result?.note ?? '';
}

const countText = (n: number) => (n === 1 ? 'קורס אחד.' : `${n} קורסים.`);

/** "קורסים ששמרתי": שורה לכל קורס, עם "להשוואה" ו"להסיר מהשמורים", כמו בציור (Me.dc.html). */
export function SavedCourses({
  courses,
  inCompare,
  query,
}: {
  courses: CourseSummary[];
  inCompare: (courseId: string) => boolean;
  query: SearchQuery | null;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ courseId: string; result: ListResult } | null>(null);

  async function run(courseId: string, action: (id: string) => Promise<ListResult>) {
    setBusy(courseId);
    const result = await action(courseId);
    setBusy(null);
    setNotice(result === 'ok' ? null : { courseId, result });
  }

  const sub =
    courses.length === 0
      ? 'עוד לא שמרתם קורסים. בכל קורס יש כפתור ״לשמור״.'
      : `${countText(courses.length)}${query ? ' ההערות בשוליים משוות כל קורס לתשובות שלכם.' : ''}`;

  return (
    <MeSection id="saved" title="קורסים ששמרתי" sub={sub} className="mt-9">
      {courses.map((course) => (
        <ResultRow
          key={course.id}
          result={{ course, full: true, note: noteFor(course, query) }}
          highlight={false}
          actions={
            <>
              <ChoiceChip
                checked={inCompare(course.id)}
                disabled={busy === course.id}
                onClick={() => void run(course.id, toggleCompare)}
              >
                להשוואה<span className="sr-only"> את {course.title}</span>
              </ChoiceChip>
              <button
                type="button"
                disabled={busy === course.id}
                onClick={() => void run(course.id, toggleSaved)}
                className={textButton}
              >
                להסיר מהשמורים<span className="sr-only"> את {course.title}</span>
              </button>
              {notice?.courseId === course.id && (
                <p role="status" className="basis-full font-sans text-[13px] text-ink-soft">
                  {notice.result === 'full'
                    ? 'בהשוואה כבר יש 3 קורסים. מוציאים אחד כדי לפנות מקום.'
                    : 'לא הצלחנו לעדכן. נסו שוב.'}
                </p>
              )}
            </>
          }
        />
      ))}
    </MeSection>
  );
}
