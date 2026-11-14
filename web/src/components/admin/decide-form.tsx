'use client';

import { useActionState, useId, useState } from 'react';
import { approveReview, returnReview, type DecisionState } from '@/app/admin/actions';
import { buttonVariants } from '@/components/ui/button';
import { REJECT_REASONS } from '@/lib/admin/reasons';
import { formatIls } from '@/lib/format';
import { PROOF_KIND_LABEL, UPLOAD_KINDS, type ProofKind } from '@/lib/reviews/types';
import { cn } from '@/lib/utils';
import { useLogDecision } from './decision-log';

const IDLE: DecisionState = { status: 'idle' };
const label = 'block font-semibold';
const control = 'mt-1 block h-11 w-full max-w-[320px] rounded-[4px] border border-ink bg-white px-2.5 text-[15px] text-ink';
/** מושבת בזמן שפעולה רצה: מסגרת אפורה וטקסט אפור (DESIGN.md, Buttons), כמו בצעד ההוכחה. */
const disabled = 'disabled:border-[1.5px] disabled:border-line disabled:bg-white disabled:text-ink-soft disabled:opacity-100';

function ErrorLine({ state }: { state: DecisionState }) {
  if (state.status !== 'error') return null;
  return (
    <p role="alert" className="font-bold">
      {state.message}
    </p>
  );
}

/**
 * שלוש הפעולות (מסמך העיצוב, סעיף 4): לאשר עם סוג וסכום, או להחזיר: לדחות עם סיבה, או לבקש הוכחה נוספת.
 * החלטה שהצליחה נרשמת ביומן שמעל הרשימה (decision-log.tsx), כי הפריט, והטופס הזה איתו, יורדים מהרשימה.
 */
export function DecideForm({
  reviewId,
  courseSlug,
  courseTitle,
  defaultKind,
  modelAmount,
  sitePrice,
}: {
  reviewId: string;
  courseSlug: string;
  courseTitle: string;
  defaultKind: ProofKind;
  /** הסכום שהמודל קרא. רק רמז ליד השדה: טקסט מוסתר במסמך יכול לגרום לו לקרוא סכום אחר (prompt injection). */
  modelAmount: number | null;
  sitePrice: number | null;
}) {
  const logDecision = useLogDecision();
  const [approveState, approve, approving] = useActionState(async (previous: DecisionState, form: FormData) => {
    const result = await approveReview(previous, form);
    if (result.status === 'done') {
      logDecision({ reviewId, courseSlug, courseTitle, message: result.message, warning: result.warning, published: true });
    }
    return result;
  }, IDLE);
  const [returnState, sendBack, returning] = useActionState(async (previous: DecisionState, form: FormData) => {
    const result = await returnReview(previous, form);
    if (result.status === 'done') logDecision({ reviewId, courseSlug, courseTitle, message: result.message, published: false });
    return result;
  }, IDLE);
  const [kind, setKind] = useState<ProofKind>(defaultKind);
  const [action, setAction] = useState<'reject' | 'request_more'>('request_more');
  const busy = approving || returning;
  const amountHint = useId();
  const modelHint = useId();

  return (
    <div className="space-y-6 font-sans text-[15px] leading-normal">
      <form action={approve} aria-label="לאשר" className="space-y-3">
        <input type="hidden" name="reviewId" value={reviewId} />
        <label className="block">
          <span className={label}>סוג ההוכחה שאושר</span>
          <select name="proofKind" value={kind} onChange={(e) => setKind(e.target.value as ProofKind)} className={control}>
            {UPLOAD_KINDS.map((k) => (
              <option key={k} value={k}>
                {PROOF_KIND_LABEL[k]}
              </option>
            ))}
          </select>
        </label>
        {kind === 'invoice' && (
          <label className="block">
            <span className={label}>סכום ששולם, בשקלים</span>
            <input
              name="amount"
              inputMode="numeric"
              autoComplete="off"
              // ריק תמיד: גל מקליד את הסכום מהמסמך. מה שהמודל קרא לא נכנס לשדה, כדי שלחיצה אחת לא תשמור אותו.
              defaultValue=""
              aria-describedby={modelAmount !== null ? `${modelHint} ${amountHint}` : amountHint}
              className={cn(control, 'max-w-[180px] tabular-nums')}
              dir="ltr"
            />
            {modelAmount !== null && (
              <span id={modelHint} className="mt-1 block text-[13px]">
                הקריאה האוטומטית: &lrm;{formatIls(modelAmount)}. לא מאומת, להקליד מהמסמך.
              </span>
            )}
            <span id={amountHint} className="mt-1 block text-[13px] text-ink-soft">
              נשמר רק במדרגות של 500. ריק: בלי סכום.
              {sitePrice !== null && ` המחיר באתר: ${formatIls(sitePrice)}.`}
            </span>
          </label>
        )}
        <button
          type="submit"
          disabled={busy}
          className={cn(buttonVariants(), 'h-11 rounded-[4px] px-5 text-[15px] font-bold', disabled)}
        >
          {approving ? 'מפרסמים…' : 'לאשר ולפרסם'}
        </button>
        <ErrorLine state={approveState} />
      </form>

      <form action={sendBack} aria-label="להחזיר לכותב" className="space-y-3 border-t border-rule pt-5">
        <input type="hidden" name="reviewId" value={reviewId} />
        <fieldset>
          <legend className={label}>להחזיר לכותב</legend>
          <div className="mt-1 flex flex-wrap gap-x-6">
            <label className="inline-flex min-h-11 items-center gap-2">
              <input
                type="radio"
                name="action"
                value="request_more"
                checked={action === 'request_more'}
                onChange={() => setAction('request_more')}
                className="size-4 accent-ink"
              />
              לבקש הוכחה נוספת
            </label>
            <label className="inline-flex min-h-11 items-center gap-2">
              <input
                type="radio"
                name="action"
                value="reject"
                checked={action === 'reject'}
                onChange={() => setAction('reject')}
                className="size-4 accent-ink"
              />
              לדחות
            </label>
          </div>
        </fieldset>
        {action === 'reject' && (
          <label className="block">
            <span className={label}>הסיבה</span>
            <select name="reason" defaultValue="unreadable" className={control}>
              {Object.entries(REJECT_REASONS).map(([key, text]) => (
                <option key={key} value={key}>
                  {text}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="block">
          <span className={label}>{action === 'reject' ? 'עוד משהו לכותב (רשות)' : 'מה חסר'}</span>
          <textarea
            name="note"
            rows={3}
            maxLength={600}
            required={action === 'request_more'}
            className="mt-1 block w-full max-w-[420px] rounded-[4px] border border-ink bg-white p-2.5 text-[15px] text-ink"
          />
        </label>
        <p className="text-[13px] text-ink-soft">הכותב רואה את ההודעה ב&quot;הביקורות שלי&quot;. הקבצים נמחקים.</p>
        <button
          type="submit"
          disabled={busy}
          className={cn(
            buttonVariants({ variant: 'outline' }),
            'h-11 rounded-[4px] border-[1.5px] border-ink px-5 text-[15px] font-bold',
            disabled,
          )}
        >
          {returning ? 'מחזירים…' : 'להחזיר לכותב'}
        </button>
        <ErrorLine state={returnState} />
      </form>
    </div>
  );
}
