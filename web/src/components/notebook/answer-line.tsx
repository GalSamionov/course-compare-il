import { PenNumber } from '@/components/site/pen';
import { cn } from '@/lib/utils';
import { Tick } from './tick';

/**
 * שורה במחברת: מספר מוקף בעט ושאלה בשוליים, התשובה על הקו, והווי מיד אחרי התשובה.
 * הווי צמוד למה שנכתב, כמו סטודנט שמסמן את השורה שלו, ולא בעמודה בקצה השני של הדף:
 * עמודה של תיבות בקצה נקראה כמו טופס הזמנה (משוב מ-14.11.2026).
 * המשך הקו אחרי הווי ריק, ונגיעה בו מתחילה לכתוב בשורה (או פותחת את הבחירות), כמו לפני כן.
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
  /** נגיעה בהמשך הקו: מתחילים לכתוב בשדה של השורה, או פותחים את הבחירות שלה. */
  function startWriting(event: React.MouseEvent<HTMLSpanElement>) {
    const row = event.currentTarget.parentElement;
    const field = row?.querySelector<HTMLElement>('textarea, input');
    if (field) {
      field.focus();
      return;
    }
    row?.querySelector<HTMLButtonElement>('button[aria-expanded]')?.click();
  }
  return (
    <div
      data-open={open ? '' : undefined}
      className="ruled-row ruled-active grid min-h-[62px] grid-cols-[var(--margin)_minmax(0,1fr)] items-center lg:min-h-[68px]"
    >
      <span
        aria-hidden="true"
        className="flex flex-col items-start gap-0.5 font-sans text-[13px] leading-tight text-ink-soft lg:flex-row lg:items-center lg:gap-2.5 lg:text-[15px]"
      >
        <PenNumber n={number} className="lg:size-[34px] lg:text-[19px]" />
        {question}
      </span>
      <div className="flex min-w-0 items-center self-stretch">
        {children}
        <Tick checked={ticked} disabled={!canTick} label={`שורה ${number} מסננת את התוצאות`} onToggle={onTick} />
        <span aria-hidden="true" onClick={startWriting} className="min-w-3 flex-1 cursor-text self-stretch" />
      </div>
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
