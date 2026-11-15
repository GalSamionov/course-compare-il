'use client';

import Link from 'next/link';
import { createContext, useCallback, useContext, useState } from 'react';

export interface Decision {
  /** ייחודי בכל התורים: review:<id>, course:<id> או request:<id>. */
  id: string;
  /** שם הקורס, או שם המוסד בבקשה. */
  title: string;
  message: string;
  /** פורסם, אבל משהו אחריו נכשל (חישוב הציונים). */
  warning?: string;
  /** עמוד הקורס, כשמשהו ציבורי השתנה וכדאי לבדוק אותו. */
  href?: string;
}

const LogContext = createContext<(decision: Decision) => void>(() => {});

/** הטופס מדווח כאן על החלטה שהצליחה, לפני שהפריט יורד מהרשימה. משותף לכל התורים בעמוד. */
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
              <li key={d.id}>
                <span className="font-semibold">{d.title}:</span> {d.message}{' '}
                {d.href && (
                  <Link
                    href={d.href}
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
