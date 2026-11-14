import { cn } from '@/lib/utils';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';

/**
 * תפס משרדי שחור שמחזיק את ערימת הדפים, באמצע הקצה העליון. רק במחשב, כשהשולחן נראה.
 * ציור SVG משלנו, באפור ובשחור בלבד.
 */
function BinderClip() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 120 76"
      className="pointer-events-none absolute -top-[46px] left-1/2 z-10 hidden w-[104px] -translate-x-1/2 drop-shadow-[0_6px_5px_rgb(0_0_0/0.35)] lg:block"
    >
      {/* הידיות: חוט מתכת מקופל */}
      <path d="M36 44 30 8C29.6 5.4 31.4 4 34 4H86C88.6 4 90.4 5.4 90 8L84 44" fill="none" stroke="#b9bec4" strokeWidth="3.4" strokeLinejoin="round" />
      <path d="M36 44 30 8C29.6 5.4 31.4 4 34 4H86C88.6 4 90.4 5.4 90 8L84 44" fill="none" stroke="#e9ecef" strokeWidth="1.2" strokeLinejoin="round" />
      {/* גוף התפס */}
      <path d="M14 38C14 34 17 31.6 21 31.4L99 31.4C103 31.6 106 34 106 38L104 70C104 72.6 102 74 99.4 74H20.6C18 74 16 72.6 16 70Z" fill="#1d1f22" />
      <path d="M18 36.6C18 35 19.4 34 21.4 34H98.6C100.6 34 102 35 102 36.6L101.6 42H18.4Z" fill="#3a3e43" />
      <path d="M22 70.4H98" stroke="#000" strokeOpacity=".5" strokeWidth="1.4" />
    </svg>
  );
}

/**
 * הדף: נייר מודפס לבן. בנייד הוא ממלא את המסך. מ-1024 פיקסלים הוא מונח על משטח הלבד,
 * עם דף נוסף מתחתיו ותפס למעלה (globals.css, .sheet).
 * narrow: לעמודי טקסט, שבהם עמודת קריאה אחת.
 */
export function Sheet({
  narrow = false,
  className,
  children,
}: {
  narrow?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('mx-auto w-full lg:w-[calc(100%-64px)]', narrow ? 'lg:max-w-[960px]' : 'lg:max-w-[1184px]')}>
      <div className={cn('sheet px-(--sheet-pad)', className)}>
        <BinderClip />
        <SiteHeader />
        {children}
        <SiteFooter />
      </div>
    </div>
  );
}
