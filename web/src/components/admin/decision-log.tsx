'use client';

import Link from 'next/link';
import { createContext, useCallback, useContext, useState } from 'react';

export interface Decision {
  reviewId: string;
  courseSlug: string;
  courseTitle: string;
  message: string;
  /** פורסם, אבל משהו אחריו נכשל (חישוב הציונים). */
  warning?: string;
  published: boolean;
}

const LogContext = createContext<(decision: Decision) => void>(() => {});

/** הטופס מדווח כאן על החלטה שהצליחה, לפני שהפריט יורד מהרשימה. */
export const useLogDecision = () => useContext(LogContext);

/**
 * מה הוחלט בביקור הזה. הפריט יורד מהרשימה באותה תשובה של הפעולה (server-actions.md), ואיתו הטופס וההודעה שלו.
 * היומן הזה יושב מעל הרשימה ולא יורד: כך אזהרה על חישוב שנכשל לא נעלמת עם הפריט, ויש קישור לבדוק את עמוד הקורס.
 * רק בדפדפן הזה, עד שעוזבים את העמוד. היומן הקבוע הוא audit_log.
 */
export function DecisionLog({ children }: { children: React.ReactNode }) {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const log = useCallback((decision: Decision) => setDecisions((list) => [decision, ...list]), []);
  return (
    <LogContext.Provider value={log}>
      <div role="status" aria-live="polite" className="font-sans text-[15px] leading-normal">
        {decisions.length > 0 && (
          <ul aria-label="מה הוחלט עכשיו" className="mt-5 space-y-1.5 border-y border-rule py-3">
            {decisions.map((d) => (
              <li key={d.reviewId}>
                <span className="font-semibold">{d.courseTitle}:</span> {d.message}{' '}
                {d.published && (
                  <Link
                    href={`/courses/${d.courseSlug}`}
                    className="inline-flex min-h-11 items-center underline decoration-1 underline-offset-[3px] hover:text-link-hover"
                  >
                    לעמוד הקורס
                  </Link>
                )}
                {d.warning && <span className="block font-bold">{d.warning}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
      {children}
    </LogContext.Provider>
  );
}
