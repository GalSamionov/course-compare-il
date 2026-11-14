import type { Metadata } from 'next';
import {
  Assistant,
  IBM_Plex_Sans_Hebrew,
  Noto_Serif_Hebrew,
  Playpen_Sans_Hebrew,
  Rubik,
  Secular_One,
} from 'next/font/google';
import { MotionObserver } from '@/components/site/motion-observer';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import './globals.css';

const serif = Noto_Serif_Hebrew({
  subsets: ['hebrew', 'latin'],
  variable: '--font-noto-serif-hebrew',
});
const sans = Assistant({
  subsets: ['hebrew', 'latin'],
  variable: '--font-assistant',
});
const pen = Playpen_Sans_Hebrew({
  subsets: ['hebrew', 'latin'],
  variable: '--font-playpen',
});

// תצוגה מקדימה זמנית: שלושה כיווני גופן לבחירה של גל (?type=a|b|c). אחרי הבחירה נשאר אחד.
const plex = IBM_Plex_Sans_Hebrew({
  subsets: ['hebrew', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plex',
});
const rubik = Rubik({
  subsets: ['hebrew', 'latin'],
  variable: '--font-rubik',
});
const secular = Secular_One({
  subsets: ['hebrew', 'latin'],
  weight: '400',
  variable: '--font-secular',
});

const PREVIEW_SCRIPT = `(function(){try{var q=new URLSearchParams(location.search),d=document.documentElement;['type','frame'].forEach(function(k){var v=q.get(k);if(v){sessionStorage.setItem('vr-'+k,v)}else{v=sessionStorage.getItem('vr-'+k)}if(v)d.setAttribute('data-'+k,v)})}catch(e){}})();`;

// תנועה: רק אם המבקר לא ביקש פחות תנועה. בלי הסימון הזה (או בלי JavaScript) הכול גלוי ועומד.
// אם MotionObserver לא עלה תוך 3 שניות (טלפון איטי, שגיאה), מורידים את הסימון והכול נשאר גלוי.
const MOTION_SCRIPT = `(function(){try{var d=document.documentElement;if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&'IntersectionObserver' in window){d.setAttribute('data-motion','');setTimeout(function(){if(!d.hasAttribute('data-motion-ready'))d.removeAttribute('data-motion')},3000)}}catch(e){}})();`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_NAME,
  description:
    'לפני שמשלמים על קורס: מה אומרים בוגרים שהוכיחו שלמדו בו. השוואת קורסים עצמאית בישראל, ואף מוכר לא משלם לנו.',
  // עד ההשקה האתר מציג נתוני דוגמה, ולכן מנועי חיפוש לא מאנדקסים אותו.
  robots: { index: false, follow: false },
  // קישור שנשלח בוואטסאפ או בפייסבוק. בלי כותרת ותיאור כאן: Next משלים אותם מהכותרת והתיאור של כל עמוד.
  // התמונה מ-app/opengraph-image.tsx, ועמוד קורס מחליף אותה בתמונה משלו.
  openGraph: { type: 'website', locale: 'he_IL', siteName: SITE_NAME },
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="he"
      dir="rtl"
      suppressHydrationWarning
      className={`${serif.variable} ${sans.variable} ${pen.variable} ${plex.variable} ${rubik.variable} ${secular.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: PREVIEW_SCRIPT + MOTION_SCRIPT }} />
      </head>
      <body className="antialiased">
        {children}
        <MotionObserver />
      </body>
    </html>
  );
}
