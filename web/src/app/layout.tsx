import { Analytics } from '@vercel/analytics/next';
import type { Metadata } from 'next';
import { IBM_Plex_Sans_Hebrew, Rubik } from 'next/font/google';
import { Suspense } from 'react';
import { FirstVisit } from '@/components/site/first-visit';
import { MotionObserver } from '@/components/site/motion-observer';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import './globals.css';

// הדיו המודפסת: כותרות, גוף, תוויות ונתונים. גל בחר ב-14.11.2026, במקום Noto Serif Hebrew ו-Assistant.
const print = IBM_Plex_Sans_Hebrew({
  subsets: ['hebrew', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plex',
});
// העט הכחול: הקול של האתר בלבד. Rubik, עגול וחם יותר מהדיו המודפסת, כדי שהקול של האתר יישמע כיד אחרת.
// גל בחר ב-14.11.2026, במקום כתב היד של Playpen Sans Hebrew. החיצים, העיגולים וקווי העט נשארים מצוירים ביד.
const pen = Rubik({
  subsets: ['hebrew', 'latin'],
  weight: ['400', '500', '600'],
  variable: '--font-rubik',
});

// תנועה: רק אם המבקר לא ביקש פחות תנועה. בלי הסימון הזה (או בלי JavaScript) הכול גלוי ועומד.
// אם MotionObserver לא עלה תוך 3 שניות (טלפון איטי, שגיאה), מורידים את הסימון והכול נשאר גלוי.
const MOTION_SCRIPT = `(function(){try{var d=document.documentElement;if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&'IntersectionObserver' in window){d.setAttribute('data-motion','');setTimeout(function(){if(!d.hasAttribute('data-motion-ready'))d.removeAttribute('data-motion')},3000)}}catch(e){}})();`;

/**
 * מדידת כניסות (Vercel Web Analytics, מסמך העיצוב 2026-11-17): בלי עוגיות ובלי זיהוי אישי (/privacy#analytics).
 * רק באתר החי. מקומית, ב-CI ובתצוגות מקדימות לא נטען כלום: שם אין /_vercel/insights, והבקשה הייתה נכשלת עם שגיאה
 * בקונסול (ובדיקת הקצה "בלי שגיאות בקונסול" הייתה נופלת). NEXT_PUBLIC_VERCEL_ENV נקבע ב-Vercel בבנייה (ראו lib/site.ts).
 * המדידה עצמה מתחילה רק אחרי שמפעילים את Web Analytics בהגדרות הפרויקט ב-Vercel, באישור של גל.
 */
const MEASURE_VISITS = process.env.NEXT_PUBLIC_VERCEL_ENV === 'production';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_NAME,
  description:
    'לא יודעים למי לפנות? נראה לכם את האפשרויות זו לצד זו, מה כל אחד מפרסם ומה הוא לא כותב, ומה לשאול לפני שמשלמים. אף מוכר לא משלם לנו.',
  // מאז העלייה לציבור (16.11.2026) מנועי חיפוש מאנדקסים את האתר. מה שלא: lib/seo/indexing.ts.
  // בלי כתובת קנונית כאן: כל עמוד ציבורי קובע את שלו (alternates.canonical), כי עמוד בלי משלו היה יורש מכאן את '/'.
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
        {/* הקישור הראשון בכל עמוד, למקלדת ולקורא מסך: מדלג על הכותרת ועל התפריט. כל <main> נושא id="main". */}
        <a href="#main" className="skip-link">
          דלגו לתוכן
        </a>
        {children}
        <MotionObserver />
        {/* ההיכרות למבקר ראשון: בכל עמוד ציבורי, כי רוב המבקרים נכנסים ישר לעמוד קורס מקישור. */}
        <FirstVisit />
        {MEASURE_VISITS && (
          // הרכיב קורא את הכתובת בדפדפן. בתוך Suspense, כדי שהעמודים יישארו סטטיים.
          <Suspense fallback={null}>
            <Analytics />
          </Suspense>
        )}
      </body>
    </html>
  );
}
