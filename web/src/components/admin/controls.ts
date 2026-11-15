import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** אוצר הפקדים של התור, אחד לכל התורים: אותו כפתור, אותה תווית ואותו שדה בכל מקום (DESIGN.md, Buttons). */
export const fieldLabel = 'block font-semibold';
export const control = 'mt-1 block h-11 w-full max-w-[320px] rounded-[4px] border border-ink bg-white px-2.5 text-[15px] text-ink';
export const textArea = 'mt-1 block w-full max-w-[420px] rounded-[4px] border border-ink bg-white p-2.5 text-[15px] text-ink';
/** מושבת בזמן שפעולה רצה: מסגרת אפורה וטקסט אפור (DESIGN.md, Buttons), כמו בצעד ההוכחה. */
const disabled = 'disabled:border-[1.5px] disabled:border-line disabled:bg-white disabled:text-ink-soft disabled:opacity-100';
export const primaryButton = cn(buttonVariants(), 'h-11 rounded-[4px] px-5 text-[15px] font-bold', disabled);
export const outlineButton = cn(
  buttonVariants({ variant: 'outline' }),
  'h-11 rounded-[4px] border-[1.5px] border-ink px-5 text-[15px] font-bold',
  disabled,
);
export const textLink = 'inline-flex min-h-11 items-center underline decoration-1 underline-offset-[3px] hover:text-link-hover';
