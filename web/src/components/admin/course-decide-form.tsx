'use client';

import { useActionState, useId } from 'react';
import type { DecisionState } from '@/app/admin/actions';
import { decideCourseChange } from '@/app/admin/course-actions';
import type { FieldKind } from '@/lib/admin/course-fields';
import { cn } from '@/lib/utils';
import { control, fieldLabel, outlineButton, primaryButton, textArea } from './controls';
import { useLogDecision } from './decision-log';

const IDLE: DecisionState = { status: 'idle' };

/** התיקון הידני: איזה שדה, ומה מופיע בו כשהוא נפתח (הערך מהדף). */
export interface EditSpec {
  label: string;
  kind: FieldKind;
  text: string;
  maxChars?: number;
  choices?: { value: string; label: string; checked: boolean }[];
}

/**
 * ההחלטה על פריט בתור של הקורסים. כפתור אחד לכל החלטה, שנשלח עם הטופס (decision), ותיקון ידני מקופל
 * ב-details, כי רוב הפריטים מאושרים או נדחים כמו שהם. ההחלטה נרשמת ביומן שמעל התורים (decision-log.tsx).
 */
export function CourseDecideForm({
  queueId,
  title,
  courseHref,
  approveLabel,
  rejectLabel,
  hint,
  edit,
}: {
  queueId: number;
  title: string;
  /** עמוד הקורס, כשהוא ציבורי. טיוטה: null. */
  courseHref: string | null;
  approveLabel: string;
  /** null: אין דחייה (דף שלא נטען: רק "ראיתי"). */
  rejectLabel: string | null;
  /** מה קורה אחרי ההחלטה, בשורה אחת מתחת לכפתורים. */
  hint: string;
  edit: EditSpec | null;
}) {
  const logDecision = useLogDecision();
  const [state, dispatch, pending] = useActionState(async (previous: DecisionState, form: FormData) => {
    const result = await decideCourseChange(previous, form);
    if (result.status === 'done') {
      const decision = form.get('decision');
      logDecision({
        id: `course:${queueId}`,
        title,
        message: result.message,
        href: courseHref && decision !== 'reject' ? courseHref : undefined,
      });
    }
    return result;
  }, IDLE);
  const editId = useId();
  const hintId = useId();

  return (
    <div className="space-y-5 font-sans text-[15px] leading-normal">
      <form action={dispatch} aria-label={`החלטה: ${title}`} className="space-y-3">
        <input type="hidden" name="queueId" value={queueId} />
        <div className="flex flex-wrap gap-3">
          <button type="submit" name="decision" value="approve" disabled={pending} aria-describedby={hintId} className={primaryButton}>
            {pending ? 'שומרים…' : approveLabel}
          </button>
          {rejectLabel && (
            <button type="submit" name="decision" value="reject" disabled={pending} className={outlineButton}>
              {rejectLabel}
            </button>
          )}
        </div>
        <p id={hintId} className="text-[13px] text-ink-soft">
          {hint}
        </p>
      </form>

      {edit && (
        <details className="group border-t border-rule pt-3">
          <summary className="inline-flex min-h-11 cursor-pointer items-center font-semibold underline decoration-1 underline-offset-[3px] hover:text-link-hover">
            לתקן ידנית
          </summary>
          <form action={dispatch} aria-label={`תיקון ידני: ${edit.label}`} className="mt-2 space-y-3">
            <input type="hidden" name="queueId" value={queueId} />
            <EditInput id={editId} spec={edit} />
            <button type="submit" name="decision" value="edit" disabled={pending} className={outlineButton}>
              {pending ? 'שומרים…' : 'לשמור את התיקון'}
            </button>
            <p className="text-[13px] text-ink-soft">התיקון עולה לאתר במקום מה שבדף, ונרשם ביומן.</p>
          </form>
        </details>
      )}
      {state.status === 'error' && (
        <p role="alert" className="font-bold">
          {state.message}
        </p>
      )}
    </div>
  );
}

function EditInput({ id, spec }: { id: string; spec: EditSpec }) {
  if (spec.kind === 'choices') {
    return (
      <fieldset>
        <legend className={fieldLabel}>{spec.label}</legend>
        <div className="mt-1 flex flex-wrap gap-x-6">
          {spec.choices?.map((c) => (
            <label key={c.value} className="inline-flex min-h-11 items-center gap-2">
              <input type="checkbox" name="value" value={c.value} defaultChecked={c.checked} className="size-4 accent-ink" />
              {c.label}
            </label>
          ))}
        </div>
      </fieldset>
    );
  }
  const long = spec.kind === 'syllabus' || (spec.kind === 'text' && (spec.maxChars ?? 0) > 60);
  return (
    <div>
      <label htmlFor={id} className={fieldLabel}>
        {spec.label}
        {spec.kind === 'syllabus' && <span className="font-normal text-ink-soft">, נושא בכל שורה</span>}
      </label>
      {long ? (
        <textarea
          id={id}
          name="value"
          rows={spec.kind === 'syllabus' ? 8 : 3}
          maxLength={spec.kind === 'syllabus' ? undefined : spec.maxChars}
          defaultValue={spec.text}
          className={textArea}
        />
      ) : (
        <input
          id={id}
          name="value"
          type={spec.kind === 'date' ? 'date' : 'text'}
          inputMode={spec.kind === 'int' || spec.kind === 'number' ? 'decimal' : undefined}
          dir={spec.kind === 'text' ? undefined : 'ltr'}
          maxLength={spec.maxChars}
          autoComplete="off"
          defaultValue={spec.text}
          className={cn(control, spec.kind !== 'text' && 'max-w-[200px] tabular-nums')}
        />
      )}
      <span className="mt-1 block text-[13px] text-ink-soft">ריק: בלי ערך.</span>
    </div>
  );
}
