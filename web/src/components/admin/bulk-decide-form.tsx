'use client';

import { useActionState, useEffect, useId, useRef, useState } from 'react';
import type { DecisionState } from '@/app/admin/actions';
import { decideInstitutionCourses } from '@/app/admin/bulk-actions';
import { cn } from '@/lib/utils';
import { outlineButton, primaryButton } from './controls';
import { useLogDecision } from './decision-log';

const IDLE: DecisionState = { status: 'idle' };

/** כפתור עם שם ארוך ("לאשר את 12 הקורסים הבטוחים של..."): נשבר לשורות, ולא חורג מהעמודה. */
const wrap = 'h-auto min-h-11 py-2 text-start whitespace-normal';

/**
 * אישור או דחייה של כל הקורסים של מוסד, בשני שלבים: הלחיצה הראשונה רק פותחת את שלב האישור, עם המספר ועם
 * מה יקרה, ורק הכפתור שם שולח. בלי חלון קופץ: האישור נפתח במקום, והפוקוס עובר אליו וחוזר כשמבטלים.
 * המזהים הם מה שגל רואה בעמוד. השרת בודק אותם שוב (bulk-actions.ts).
 */
export function BulkDecideForm({
  institutionId,
  institutionName,
  decision,
  ids,
  label,
  confirmText,
  confirmLabel,
}: {
  institutionId: string;
  institutionName: string;
  decision: 'approve' | 'reject';
  ids: number[];
  /** הכפתור הראשון. */
  label: string;
  /** מה יקרה, עם המספר. */
  confirmText: string;
  /** הכפתור ששולח. */
  confirmLabel: string;
}) {
  const logDecision = useLogDecision();
  const [confirming, setConfirming] = useState(false);
  const [state, dispatch, pending] = useActionState(async (previous: DecisionState, form: FormData) => {
    const result = await decideInstitutionCourses(previous, form);
    if (result.status === 'done') {
      logDecision({
        id: `bulk:${decision}:${institutionId}:${Date.now()}`,
        title: institutionName,
        message: result.message,
        warning: result.warning,
      });
      setConfirming(false);
    }
    return result;
  }, IDLE);
  const openRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef(false);
  const textId = useId();

  useEffect(() => {
    if (confirming) confirmRef.current?.focus();
    else if (returnFocus.current) openRef.current?.focus();
    returnFocus.current = false;
  }, [confirming]);

  const primary = decision === 'approve' ? primaryButton : outlineButton;

  if (!confirming) {
    return (
      <div className="space-y-2">
        <button ref={openRef} type="button" onClick={() => setConfirming(true)} className={cn(primary, wrap)}>
          {label}
        </button>
        {state.status === 'error' && (
          <p role="alert" className="font-bold">
            {state.message}
          </p>
        )}
      </div>
    );
  }

  return (
    <form
      action={dispatch}
      aria-label={label}
      aria-describedby={textId}
      className="space-y-3 border-y-[1.5px] border-ink py-3"
    >
      <input type="hidden" name="institutionId" value={institutionId} />
      <input type="hidden" name="decision" value={decision} />
      <input type="hidden" name="ids" value={ids.join(',')} />
      <p id={textId} className="font-semibold">
        {confirmText}
      </p>
      <div className="flex flex-wrap gap-3">
        <button ref={confirmRef} type="submit" disabled={pending} className={cn(primary, wrap)}>
          {pending ? 'שומרים…' : confirmLabel}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            returnFocus.current = true;
            setConfirming(false);
          }}
          className={outlineButton}
        >
          ביטול
        </button>
      </div>
      {state.status === 'error' && (
        <p role="alert" className="font-bold">
          {state.message}
        </p>
      )}
    </form>
  );
}
