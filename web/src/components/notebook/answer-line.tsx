import { PenNumber } from '@/components/site/pen';
import { cn } from '@/lib/utils';
import { Tick } from './tick';

/**
 * שורה במחברת: מספר מוקף בעט ושאלה בשוליים, התשובה על הקו, והווי בסוף.
 * הקו הוא שורה של מחברת שנמשכת עד קצה הנייר (globals.css, .ruled-row).
 * השורה הפעילה מקבלת קו כהה של 2 פיקסלים, כמו בציור.
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
      data-open={open ? '' : undefined}
      className="ruled-row ruled-active grid min-h-[62px] grid-cols-[var(--margin)_minmax(0,1fr)_44px] items-center lg:min-h-[68px]"
    >
      <span
        aria-hidden="true"
        className="flex flex-col items-start gap-0.5 font-sans text-[13px] leading-tight text-ink-soft lg:flex-row lg:items-center lg:gap-2.5 lg:text-[15px]"
      >
        <PenNumber n={number} className="lg:size-[34px] lg:text-[19px]" />
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
        'inline-block -rotate-1 font-pen text-[21px] font-medium text-pen lg:text-[23px]',
        struck && 'line-through decoration-[1.5px] opacity-50',
      )}
    >
      {children}
    </span>
  );
}
