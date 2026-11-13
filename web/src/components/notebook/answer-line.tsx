import { cn } from '@/lib/utils';
import { Tick } from './tick';

/**
 * שורה במחברת: מספר ושאלה בשוליים, התשובה על הקו, והווי בסוף.
 * השורה הפעילה מקבלת קו כהה של 2 פיקסלים, כמו בציור. הצל הפנימי מוסיף את הפיקסל השני בלי להזיז את הדף.
 */
export function AnswerLine({
  number,
  question,
  ticked,
  canTick,
  onTick,
  open = false,
  children,
}: {
  number: number;
  question: string;
  ticked: boolean;
  canTick: boolean;
  onTick: () => void;
  open?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'grid min-h-[60px] grid-cols-[70px_minmax(0,1fr)_44px] items-center border-b border-line',
        'focus-within:border-ink focus-within:shadow-[inset_0_-1px_0_var(--color-ink)]',
        open && 'border-ink shadow-[inset_0_-1px_0_var(--color-ink)]',
      )}
    >
      <span aria-hidden="true" className="font-sans text-[13px] leading-tight text-ink-soft">
        <strong className="block text-base text-ink">{number}</strong>
        {question}
      </span>
      {children}
      <Tick checked={ticked} disabled={!canTick} label={`שורה ${number} מסננת את התוצאות`} onToggle={onTick} />
    </div>
  );
}

/** תשובה של המבקר: עט כחול, מוטה מעט, על הקו. struck: הווי של השורה הוסר, והתשובה מחוקה. */
export function PenAnswer({ struck = false, children }: { struck?: boolean; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        'inline-block -rotate-1 font-pen text-[21px] font-medium text-pen',
        struck && 'line-through decoration-[1.5px] opacity-50',
      )}
    >
      {children}
    </span>
  );
}
