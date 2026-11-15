'use client';

import { useEffect } from 'react';

/** מה זז כשהוא נכנס למסך: משיכות מרקר, קווי עט מתחת לכותרות, וכל רכיב עם data-anim (globals.css, "תנועה"). */
const SELECTOR = '.hl, .pen-rule, [data-anim]';
/** כמה רכיבים לכל היותר נכנסים בזה אחר זה באותו רגע, לפני שההשהיה מפסיקה לגדול. */
const STAGGER_CAP = 6;
const STAGGER_MS = 140;

/**
 * מסמן כל רכיב שזז ברגע שהוא נכנס למסך (data-inview), פעם אחת. ה-CSS עושה את השאר.
 * פועל רק כשיש data-motion על <html>: הסקריפט ב-layout שם אותו רק אם המבקר לא ביקש פחות תנועה,
 * ומוריד אותו אם הסימון לא התחיל תוך 3 שניות (data-motion-ready). אז, או בלי JavaScript, הכול גלוי ועומד.
 */
export function MotionObserver() {
  useEffect(() => {
    const root = document.documentElement;
    if (!root.hasAttribute('data-motion')) return;

    /** רכיבים שמחכים להיכנס למסך. */
    const pending = new Set<HTMLElement>();
    // רשימה בזיכרון ולא סימון על הרכיב: ב-StrictMode האפקט רץ פעמיים, וסימון על הרכיב היה מדלג עליו בפעם השנייה.
    const watched = new WeakSet<Element>();
    // רכיב שמוסתר ב-clip-path עד שהוא נכנס (העט כותב) לא נחשב גלוי בעיני IntersectionObserver,
    // ולכן צופים בהורה שלו ומסמנים את הרכיב עצמו.
    const proxyOf = new Map<Element, HTMLElement[]>();

    /** מסמנים קבוצה שנכנסה יחד: מלמעלה למטה, ובאותה שורה מימין לשמאל, בכיוון הקריאה. */
    const reveal = (els: HTMLElement[]) => {
      els
        .filter((el) => pending.delete(el))
        .sort((a, b) => {
          const ra = a.getBoundingClientRect();
          const rb = b.getBoundingClientRect();
          return Math.round(ra.top - rb.top) || rb.right - ra.right;
        })
        .forEach((el, i) => {
          const own = Number(el.dataset.delay ?? 0);
          el.style.setProperty('--enter-delay', `${own + Math.min(i, STAGGER_CAP) * STAGGER_MS}ms`);
          el.setAttribute('data-inview', '');
        });
    };
    const onEnter = (observer: IntersectionObserver) => (entries: IntersectionObserverEntry[]) => {
      reveal(
        entries
          .filter((e) => e.isIntersecting)
          .flatMap((e) => {
            observer.unobserve(e.target);
            const owned = proxyOf.get(e.target);
            proxyOf.delete(e.target);
            return owned ?? [e.target as HTMLElement];
          }),
      );
    };
    const io: IntersectionObserver = new IntersectionObserver((entries) => onEnter(io)(entries), {
      rootMargin: '0px 0px -8% 0px',
      threshold: 0.15,
    });
    // להורה של הערת עט מספיק פיקסל אחד: הורה ארוך מכמה מסכים לא יגיע לעולם ל-15%.
    const ioProxy: IntersectionObserver = new IntersectionObserver((entries) => onEnter(ioProxy)(entries), {
      threshold: 0,
    });

    const watch = (el: Element) => {
      if (el.hasAttribute('data-inview') || watched.has(el)) return;
      watched.add(el);
      pending.add(el as HTMLElement);
      const parent = el.parentElement;
      if (el.matches('[data-anim~="write"]') && parent) {
        proxyOf.set(parent, [...(proxyOf.get(parent) ?? []), el as HTMLElement]);
        ioProxy.observe(parent);
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

    // בתחתית הדף אי אפשר לגלול עוד, ורכיב ב-8% התחתונים לא ייכנס לעולם: חושפים כל מה שגלוי.
    let frame = 0;
    const atBottom = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (window.scrollY + window.innerHeight < document.documentElement.scrollHeight - 4) return;
        reveal([...pending].filter((el) => el.getBoundingClientRect().top < window.innerHeight));
      });
    };

    // מתחילים רק אחרי שהדף נטען ו-React סיים לחבר אותו (hydration): סימון של רכיב לפני כן
    // הוא שינוי ב-HTML שהשרת שלח, ו-React מזהיר עליו. requestIdleCallback רץ רק כשאין עבודה ממתינה.
    // data-motion-ready רק כאן: אם זה לא קרה תוך 3 שניות, הסקריפט ב-layout מוריד את data-motion.
    let idle = 0;
    let timer = 0;
    const go = () => {
      if (!root.hasAttribute('data-motion')) return;
      root.setAttribute('data-motion-ready', '');
      scan(document);
      mo.observe(document.body, { childList: true, subtree: true });
      window.addEventListener('scroll', atBottom, { passive: true });
      atBottom();
    };
    const start = () => {
      if (typeof window.requestIdleCallback === 'function') idle = window.requestIdleCallback(go, { timeout: 1200 });
      else timer = window.setTimeout(go, 120);
    };
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });

    return () => {
      window.removeEventListener('load', start);
      window.removeEventListener('scroll', atBottom);
      cancelAnimationFrame(frame);
      if (idle) window.cancelIdleCallback?.(idle);
      window.clearTimeout(timer);
      io.disconnect();
      ioProxy.disconnect();
      mo.disconnect();
    };
  }, []);
  return null;
}
