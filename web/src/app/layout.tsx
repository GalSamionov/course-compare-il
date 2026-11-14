import type { Metadata } from 'next';
import { IBM_Plex_Sans_Hebrew, Playpen_Sans_Hebrew } from 'next/font/google';
import { MotionObserver } from '@/components/site/motion-observer';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import './globals.css';

// הדיו המודפסת: כותרות, גוף, תוויות ונתונים. גל בחר ב-14.11.2026, במקום Noto Serif Hebrew ו-Assistant.
const print = IBM_Plex_Sans_Hebrew({
  subsets: ['hebrew', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plex',
});
// העט הכחול: הקול של האתר בלבד.
const pen = Playpen_Sans_Hebrew({
  subsets: ['hebrew', 'latin'],
  variable: '--font-playpen',
});

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
      className={`${print.variable} ${pen.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: MOTION_SCRIPT }} />
      </head>
      <body className="antialiased">
        {children}
        <MotionObserver />
      </body>
    </html>
  );
}
