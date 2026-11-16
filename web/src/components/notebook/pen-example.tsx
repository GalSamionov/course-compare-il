'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/** דוגמאות לשורה הראשונה. אותן מילים שהיו בדוגמה המודפסת, ואותן מילים שאפשר ללחוץ עליהן מתחת לשורה. */
export const WHAT_EXAMPLES = ['לבנות אתרים', 'אקסל לעבודה', 'עוגות', 'פסיכומטרי'];
/** כמה זמן כל דוגמה על הקו: נכתבת, נשארת רגע ונעלמת (globals.css, pen-example). */
const CYCLE_MS = 3000;

/**
 * הדוגמה בשורה הראשונה, כשהשורה ריקה: "למשל:" מודפס באפור, ואחריו דוגמה שנכתבת בעט בהיר ומתחלפת,
 * כאילו מישהו כותב בשוליים. העט בהיר, כדי שלא תיראה כמו תשובה שכבר נכתבה, אבל לא בהיר מדי:
 * בשקיפות 80% הניגודיות 5.2:1, מעל 4.5:1 של WCAG AA (ב-60% היא הייתה 3.2:1).
 * מוסתרת מקורא מסך: השדה עצמו נושא את הדוגמה המלאה ב-placeholder.
 * נעלמת כשכותבים או כשהשדה בפוקוס (globals.css, .pen-example). לא מתחלפת כשהיא מחוץ למסך,
 * כשהלשונית מוסתרת, או כשהמבקר ביקש פחות תנועה: אז נשארת הדוגמה הראשונה.
 */
export function PenExample({ className }: { className?: string }) {
  const [index, setIndex] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let visible = true;
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    if (ref.current) io.observe(ref.current);
    const timer = window.setInterval(() => {
      if (!visible || document.hidden) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      setIndex((n) => (n + 1) % WHAT_EXAMPLES.length);
    }, CYCLE_MS);
    return () => {
      window.clearInterval(timer);
      io.disconnect();
    };
  }, []);
  return (
    <span ref={ref} aria-hidden="true" className={cn('pen-example pointer-events-none', className)}>
      <span className="font-sans text-[15px] text-ink-soft lg:text-[17px]">למשל:</span>{' '}
      <span key={index} className="pen-example-word inline-block font-pen text-[21px] font-medium text-pen/80 lg:text-[23px]">
        {WHAT_EXAMPLES[index]}
      </span>
    </span>
  );
}
