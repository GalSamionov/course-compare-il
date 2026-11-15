'use client';

import { useEffect } from 'react';

/**
 * מסמן בניווט של המדריך את הפרק שקוראים עכשיו (aria-current="location"), והעט מותח קו מתחתיו.
 * במחשב הניווט נשאר במקום בגלילה, וכך רואים איפה נמצאים במדריך ארוך. בלי JavaScript הניווט עובד כרגיל.
 */
export function TocSpy({ navId, ids }: { navId: string; ids: string[] }) {
  const key = ids.join(' ');
  useEffect(() => {
    const nav = document.getElementById(navId);
    const order = key.split(' ');
    const sections = order.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => el !== null);
    if (!nav || sections.length === 0 || typeof IntersectionObserver === 'undefined') return;

    const visible = new Set<string>();
    const update = () => {
      // הפרק הראשון בסדר הקריאה שנמצא ברצועה בחלק העליון של המסך.
      const current = order.find((id) => visible.has(id));
      if (!current) return;
      nav.querySelectorAll('a[href^="#"]').forEach((a) => {
        if (a.getAttribute('href') === `#${current}`) a.setAttribute('aria-current', 'location');
        else a.removeAttribute('aria-current');
      });
    };
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target.id);
          else visible.delete(e.target.id);
        }
        update();
      },
      { rootMargin: '-15% 0px -60% 0px' },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [navId, key]);
  return null;
}
