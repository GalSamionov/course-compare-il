import { LOGO_LAMED, LOGO_LAMED_TRANSFORM, LOGO_LOOP } from '@/lib/logo';
import { cn } from '@/lib/utils';

/**
 * הסימן של למדתי בכותרת: ל בדיו (currentColor, כדי שתתכהה יחד עם השם בריחוף), מוקפת בעט כחול.
 * קישוט שמלווה את השם, ולכן aria-hidden.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 100"
      className={cn('flex-none overflow-visible', className)}
    >
      <path
        d={LOGO_LOOP}
        pathLength={1}
        fill="none"
        stroke="var(--color-pen)"
        strokeWidth="6.5"
        strokeLinecap="round"
      />
      <path fill="currentColor" transform={LOGO_LAMED_TRANSFORM} d={LOGO_LAMED} />
    </svg>
  );
}
