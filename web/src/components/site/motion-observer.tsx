'use client';

import { useEffect } from 'react';

/** מה זז כשהוא נכנס למסך: משיכות מרקר, קווי עט מתחת לכותרות, וכל רכיב עם data-anim (globals.css, "תנועה"). */
const SELECTOR = '.hl, .pen-rule, [data-anim]';
/** כמה רכיבים לכל היותר נכנסים בזה אחר זה באותו רגע, לפני שההשהיה מפסיקה לגדול. */
const STAGGER_CAP = 6;
const STAGGER_MS = 140;

/**
 * מסמן כל רכיב שזז ברגע שהוא נכנס למסך (data-inview), פעם אחת. ה-CSS עושה את השאר.
 * פועל רק כשיש data-motion על <html>: הסקריפט ב-layout שם אותו רק אם המבקר לא ביקש פחות תנועה.
 * בלי JavaScript, או אם הרכיב הזה לא עלה תוך 3 שניות, data-motion יורד והכול גלוי ועומד.
 */
export function MotionObserver() {
  useEffect(() => {
    const root = document.documentElement;
    if (!root.hasAttribute('data-motion')) return;
    root.setAttribute('data-motion-ready', '');

    // רכיב שמוסתר ב-clip-path עד שהוא נכנס (העט כותב) לא נחשב גלוי בעיני IntersectionObserver,
    // ולכן צופים בהורה שלו ומסמנים את הרכיב עצמו.
    const proxyOf = new Map<Element, HTMLElement[]>();
    const io = new IntersectionObserver(
      (entries) => {
        const shown = entries
          .filter((e) => e.isIntersecting)
          .flatMap((e) => {
            io.unobserve(e.target);
            const owned = proxyOf.get(e.target);
            proxyOf.delete(e.target);
            return owned ?? [e.target as HTMLElement];
          })
          .sort((a, b) => {
            const ra = a.getBoundingClientRect();
            const rb = b.getBoundingClientRect();
            // מלמעלה למטה, ובאותה שורה מימין לשמאל, בכיוון הקריאה
            return Math.round(ra.top - rb.top) || rb.right - ra.right;
          });
        shown.forEach((el, i) => {
          const own = Number(el.dataset.delay ?? 0);
          el.style.setProperty('--enter-delay', `${own + Math.min(i, STAGGER_CAP) * STAGGER_MS}ms`);
          el.setAttribute('data-inview', '');
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.15 },
    );

    // רשימה בזיכרון ולא סימון על הרכיב: ב-StrictMode האפקט רץ פעמיים, וסימון על הרכיב היה מדלג עליו בפעם השנייה.
    const watched = new WeakSet<Element>();
    const watch = (el: Element) => {
      if (el.hasAttribute('data-inview') || watched.has(el)) return;
      watched.add(el);
      const parent = el.parentElement;
      if (el.matches('[data-anim~="write"]') && parent) {
        proxyOf.set(parent, [...(proxyOf.get(parent) ?? []), el as HTMLElement]);
        io.observe(parent);
        return;
      }
      io.observe(el);
    };
    const scan = (node: ParentNode) => node.querySelectorAll(SELECTOR).forEach(watch);

    // רכיבים שנוספים אחר כך: מעבר בין עמודים, תוצאות במחברת, תשובה של היועץ.
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((n) => {
          if (!(n instanceof Element)) return;
          if (n.matches(SELECTOR)) watch(n);
          scan(n);
        });
      }
    });

    // מתחילים רק אחרי שהדף נטען ו-React סיים לחבר אותו (hydration): סימון של רכיב לפני כן
    // הוא שינוי ב-HTML שהשרת שלח, ו-React מזהיר עליו. requestIdleCallback רץ רק כשאין עבודה ממתינה.
    let idle = 0;
    let timer = 0;
    const start = () => {
      const go = () => {
        scan(document);
        mo.observe(document.body, { childList: true, subtree: true });
      };
      if (typeof window.requestIdleCallback === 'function') idle = window.requestIdleCallback(go, { timeout: 1200 });
      else timer = window.setTimeout(go, 120);
    };
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });

    return () => {
      window.removeEventListener('load', start);
      if (idle) window.cancelIdleCallback?.(idle);
      window.clearTimeout(timer);
      io.disconnect();
      mo.disconnect();
    };
  }, []);
  return null;
}
