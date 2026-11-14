import { cn } from '@/lib/utils';

/** וי בכתב יד, בעט כחול. הקו מהציור. */
export function TickMark({ className, strokeWidth = 2.4 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 30 30" className={cn('overflow-visible text-pen', className)}>
      <path
        d="M5 16 C8 19, 10 22, 12 25 C16 15, 21 8, 29 1"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * הווי בסוף כל שורה. מסומן: השורה מסננת. הורדת הווי משאירה את התשובה, אבל השורה לא מסננת.
 * בשורה בלי תשובה אין מה לסמן: מוצג רק מקום מנוקד ודהוי, בלי מסגרת של כפתור,
 * כדי שלא ייראה כמו משהו שאפשר ללחוץ עליו.
 */
export function Tick({
  checked,
  disabled,
  label,
  onToggle,
}: {
  checked: boolean;
  disabled: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-disabled={disabled}
      aria-label={label}
      onClick={disabled ? undefined : onToggle}
      className={cn('group relative size-11 justify-self-center', disabled ? 'cursor-default' : 'cursor-pointer')}
    >
      <span
        aria-hidden="true"
        className={cn(
          'absolute rounded-[2px]',
          disabled
            ? 'top-[15px] left-[15px] size-[14px] border border-dashed border-line'
            : 'top-[11px] left-[11px] size-[22px] border-[1.5px] border-ink transition-colors group-hover:border-pen',
        )}
      />
      {checked && <TickMark className="absolute top-0.5 left-2.5 size-8" />}
    </button>
  );
}
