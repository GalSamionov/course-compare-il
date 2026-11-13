import { cn } from '@/lib/utils';
import { TickMark } from './tick';

/**
 * כפתור בחירה בגובה 44, עם ריבוע קטן ווי בעט, כמו ב"מתי ואיך" בציור.
 * checked: בחירה מרובה (role="checkbox"). pressed: תשובה אחת מתוך כמה (aria-pressed).
 * disabled: בזמן שמירה, כדי שלחיצה כפולה לא תשלח פעמיים.
 */
export function ChoiceChip({
  checked,
  pressed,
  disabled = false,
  onClick,
  children,
}: {
  checked?: boolean;
  pressed?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const on = Boolean(checked ?? pressed);
  const state = pressed === undefined ? { role: 'checkbox' as const, 'aria-checked': on } : { 'aria-pressed': on };
  return (
    <button
      type="button"
      {...state}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex h-11 items-center gap-2 rounded-[4px] border border-ink bg-white px-2.5 font-sans text-[15px] text-ink',
        on ? 'font-bold' : 'font-semibold',
        disabled && 'cursor-wait opacity-60',
      )}
    >
      <span aria-hidden="true" className="relative size-4 flex-none rounded-[2px] border-[1.5px] border-ink">
        {on && <TickMark strokeWidth={2.6} className="absolute -top-[9px] -left-0.5 size-[23px]" />}
      </span>
      {children}
    </button>
  );
}
