import { LOGO_LAMED, LOGO_LAMED_TRANSFORM, LOGO_LOOP } from '@/lib/logo';
import { cn } from '@/lib/utils';

/**
 * הסימן של למדתי בכותרת: ל בדיו (currentColor, כדי שתתכהה יחד עם השם בריחוף), מוקפת בעט כחול.
 * העיגול נמשך כשהעמוד נטען (data-anim="draw"), ושוב בריחוף על הקישור (globals.css, .logo-loop).
 * קישוט שמלווה את השם, ולכן aria-hidden.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      data-anim="draw"
      data-delay={200}
      aria-hidden="true"
      viewBox="0 0 100 100"
      className={cn('flex-none overflow-visible', className)}
      style={{ '--draw-ms': '900ms' } as React.CSSProperties}
    >
      <path
        className="logo-loop"
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
