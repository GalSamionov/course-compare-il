import type { Metadata } from 'next';
import { Assistant, Noto_Serif_Hebrew, Playpen_Sans_Hebrew } from 'next/font/google';
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
  title: '[שם האתר]',
  description: 'השוואת קורסים עצמאית בישראל. אף מוכר לא משלם לנו.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={`${serif.variable} ${sans.variable} ${pen.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
