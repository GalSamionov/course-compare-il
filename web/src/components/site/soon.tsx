import { cn } from '@/lib/utils';

/**
 * הערה בעט ליד קישור או כפתור שמוביל לחלק שעוד לא נבנה: "נפתח בקרוב".
 * כך אף אחד לא מגלה את זה רק אחרי הלחיצה. ההערה בתוך הקישור, ולכן גם קורא מסך שומע אותה כחלק מהשם.
 * inline-block: קו התחתון של הקישור לא עובר מתחתיה.
 */
export function Soon({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-block -rotate-2 font-pen text-[13px] leading-none font-medium whitespace-nowrap text-pen lg:text-sm',
        className,
      )}
    >
      <span className="sr-only">, </span>נפתח בקרוב
    </span>
  );
}
