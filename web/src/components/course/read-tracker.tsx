'use client';

import { useEffect, useRef } from 'react';
import { countRead, wasRead } from '@/lib/reviews/helpful';

/** ספים צפופים, כדי שגם ביקורת ארוכה מהמסך תדווח כשחצי מהמסך מתמלא בה. */
const THRESHOLDS = Array.from({ length: 11 }, (_, i) => i / 10);

/**
 * הביקורת עצמה (article), עם ספירת קריאה: כשלפחות חצי ממנה, או חצי מהמסך בביקורת ארוכה ממנו,
 * גלוי שנייה רצופה (מסמך העיצוב, סעיף 6). פעם אחת לדפדפן. המספר גלוי רק לכותב.
 */
export function ReadTracker({
  reviewId,
  className,
  children,
}: {
  reviewId: string;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || wasRead(reviewId) || typeof IntersectionObserver === 'undefined') return;
    let timer: number | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const needed = Math.min(entry.boundingClientRect.height, window.innerHeight) * 0.5;
        if (entry.isIntersecting && entry.intersectionRect.height >= needed) {
          timer ??= window.setTimeout(() => {
            observer.disconnect();
            void countRead(reviewId);
          }, 1000);
        } else if (timer !== undefined) {
          window.clearTimeout(timer);
          timer = undefined;
        }
      },
      { threshold: THRESHOLDS },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [reviewId]);

  return (
    <article ref={ref} className={className}>
      {children}
    </article>
  );
}
