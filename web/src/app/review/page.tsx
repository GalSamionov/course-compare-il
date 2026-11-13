import type { Metadata } from 'next';
import { ComingSoon } from '@/components/site/coming-soon';

export const metadata: Metadata = { title: 'כתיבת ביקורת | [שם האתר]' };

/** המסלול "סיימתי קורס, רוצה לכתוב עליו" מדף הבית. */
export default function ReviewPage() {
  return <ComingSoon title="כתיבת ביקורת" line="בוחרים קורס, מעלים הוכחה שלמדתם בו, וכותבים מה יצא לכם ממנו." />;
}
