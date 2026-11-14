'use client';

import { useId, useState } from 'react';
import { PenNote } from '@/components/course/marks';
import { buttonVariants } from '@/components/ui/button';
import { uploadProof, writeAttached, type AttachedProof } from '@/lib/reviews/browser';
import { MAX_PROOF_FILES, PROOF_KIND_LABEL, SUFFICIENT_KINDS, UPLOAD_KINDS, type ProofKind } from '@/lib/reviews/types';
import { cn } from '@/lib/utils';
import { fieldLabel, selectClass } from './review-steps';

const sizeLabel = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)}MB` : `${Math.max(1, Math.round(bytes / 1024))}KB`;

/**
 * מהדק משרדי: ההוכחה מוצמדת לדף. ציור SVG משלנו, חוט מתכת באפור ובהבהרה, כמו הידיות של התפס (sheet.tsx).
 * החלק העליון בולט מעל הקצה של המסמך. גם בתור של גל (components/admin/queue-item.tsx): אותו מסמך, מוצמד.
 */
export function PaperClip() {
  const wire = 'M8 30V10a5 5 0 0 1 10 0v24a8 8 0 0 1-16 0V14';
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 48"
      className="pointer-events-none absolute -top-[22px] start-7 h-[52px] w-[22px] overflow-visible drop-shadow-[0_1px_1px_rgb(0_0_0/0.25)]"
    >
      <path d={wire} fill="none" stroke="#8b9198" strokeWidth="2.6" strokeLinecap="round" />
      <path d={wire} fill="none" stroke="#e9ecef" strokeWidth="0.9" strokeLinecap="round" />
    </svg>
  );
}

/** הכפתור הראשי, ומושבת: מסגרת אפורה וטקסט אפור (DESIGN.md, Buttons). */
export const primaryButton = cn(
  buttonVariants(),
  'h-[50px] px-6 font-sans text-base font-bold disabled:border-[1.5px] disabled:border-line disabled:bg-white disabled:text-ink-soft disabled:opacity-100',
);

/**
 * צעד 5. הקובץ עולה מיד כשבוחרים אותו, ישר לאחסון. עד שני קבצים: צילום מסך או פרויקט רק יחד עם הוכחה
 * שמספיקה לבד. "להסיר" מוציא את הקובץ מהרשימה. הקובץ עצמו נמחק בניקוי היומי, כי למשתמש אין הרשאה למחוק.
 */
export function ProofStep({
  userId,
  reviewId,
  proofs,
  decisionNote,
  busy,
  onChange,
  onSubmit,
}: {
  userId: string;
  reviewId: string;
  proofs: AttachedProof[];
  decisionNote: string | null;
  busy: boolean;
  onChange: (proofs: AttachedProof[]) => void;
  onSubmit: () => void;
}) {
  const [kind, setKind] = useState<ProofKind>(() =>
    proofs.some((p) => SUFFICIENT_KINDS.includes(p.kind)) ? 'screenshot' : 'invoice',
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const kindId = useId();

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    // אותו קובץ אפשר לבחור שוב אחרי שגיאה.
    input.value = '';
    if (!file) return;
    setError(null);
    setUploading(true);
    const result = await uploadProof(userId, reviewId, file, kind);
    setUploading(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    const next = [...proofs, result.proof];
    writeAttached(reviewId, next);
    onChange(next);
    if (SUFFICIENT_KINDS.includes(kind)) setKind('screenshot');
  }

  function remove(path: string) {
    const next = proofs.filter((p) => p.path !== path);
    writeAttached(reviewId, next);
    onChange(next);
    if (!next.some((p) => SUFFICIENT_KINDS.includes(p.kind))) setKind('invoice');
  }

  return (
    <div>
      {decisionNote && (
        <div role="note" className="mb-6 border-s border-ink ps-3 font-sans text-[15px] leading-normal">
          <p className="font-bold">ההודעה שלנו:</p>
          <p className="mt-1">{decisionNote}</p>
        </div>
      )}
      <p className="max-w-[60ch] font-sans text-[15px] leading-normal">
        חשבונית או קבלה, תעודת סיום, מייל אישור הרשמה, או אישור מהמעסיק או מקרן ההשתלמות. צילום מסך ממערכת הקורס
        או פרויקט, רק יחד עם אחד מאלה.
      </p>
      <PenNote arrow className="mt-3 max-w-[40ch]">
        רק אנחנו רואים את הקובץ. הוא נמחק מיד אחרי ההחלטה. נשאר רק סוג ההוכחה, החודש וטווח הסכום.
      </PenNote>

      {proofs.length > 0 && (
        <ul aria-label="הקבצים שהוצמדו" className="mt-10 space-y-10">
          {proofs.map((proof, i) => (
            // מסמך שהוצמד לדף: כרטיס נייר עם צל של חפץ מונח, מוטה מעט, והמהדק מעליו.
            <li
              key={proof.path}
              className={cn(
                'relative max-w-[340px] bg-white px-4 pt-5 pb-1.5 shadow-[0_1px_2px_rgb(0_0_0/0.16),0_10px_18px_-12px_rgb(0_0_0/0.4)] ring-1 ring-black/5',
                i % 2 === 0 ? '-rotate-[0.7deg]' : 'rotate-[0.6deg]',
              )}
            >
              <PaperClip />
              <p className="font-sans text-[15px] font-bold">{PROOF_KIND_LABEL[proof.kind]}</p>
              <p className="mt-0.5 truncate text-end font-sans text-[13px] text-ink-soft" dir="ltr">
                {proof.name} · {sizeLabel(proof.size)}
              </p>
              <button
                type="button"
                onClick={() => remove(proof.path)}
                className="inline-flex h-11 items-center font-sans text-[15px] font-semibold underline underline-offset-[3px] hover:text-link-hover"
              >
                להסיר
                <span className="sr-only"> את {proof.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {proofs.length < MAX_PROOF_FILES && (
        <div className="mt-8 space-y-4">
          <div>
            <label htmlFor={kindId} className={fieldLabel}>
              {proofs.length === 0 ? 'סוג ההוכחה' : 'הוכחה נוספת (רשות)'}
            </label>
            <select id={kindId} value={kind} onChange={(e) => setKind(e.target.value as ProofKind)} className={selectClass}>
              {UPLOAD_KINDS.map((k) => (
                <option key={k} value={k}>
                  {PROOF_KIND_LABEL[k]}
                </option>
              ))}
            </select>
          </div>
          {/* הקלט עצמו מוסתר, והתווית היא הכפתור. הפוקוס של המקלדת מסומן על התווית. */}
          <label
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'h-[50px] cursor-pointer border-[1.5px] border-ink px-5 font-sans text-base font-bold',
              // כמו הפוקוס של שאר הכפתורים (buttonVariants), רק שהוא נדלק מהקלט שבתוך התווית.
              'has-focus-visible:border-ring has-focus-visible:ring-3 has-focus-visible:ring-ring/50',
              uploading && 'cursor-wait opacity-60',
            )}
          >
            {uploading ? 'מעלים…' : proofs.length === 0 ? 'לבחור קובץ' : 'לבחור עוד קובץ'}
            <input
              type="file"
              accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png"
              className="sr-only"
              disabled={uploading}
              onChange={(e) => void onFile(e)}
            />
          </label>
          <p className="font-sans text-[13px] text-ink-soft">JPG, PNG או PDF, עד 10MB.</p>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 font-sans text-[15px] font-bold">
          {error}
        </p>
      )}

      <button
        type="button"
        disabled={busy || uploading || proofs.length === 0}
        onClick={onSubmit}
        className={cn(primaryButton, 'mt-10 w-full max-w-[340px]')}
      >
        {busy ? 'שולחים…' : 'לשלוח לבדיקה'}
      </button>
    </div>
  );
}
