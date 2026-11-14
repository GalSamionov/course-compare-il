import type { Metadata } from 'next';
import { Assistant, Noto_Serif_Hebrew, Playpen_Sans_Hebrew } from 'next/font/google';
import { FirstVisit } from '@/components/site/first-visit';
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
    <html lang="he" dir="rtl" className={`${serif.variable} ${sans.variable} ${pen.variable}`}>
      <body className="antialiased">
        {children}
        {/* ההיכרות למבקר ראשון: בכל עמוד ציבורי, כי רוב המבקרים נכנסים ישר לעמוד קורס מקישור. */}
        <FirstVisit />
      </body>
    </html>
  );
}
