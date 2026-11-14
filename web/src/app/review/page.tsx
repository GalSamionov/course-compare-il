import type { Metadata } from 'next';
import { ComingSoon } from '@/components/site/coming-soon';
import { SITE_NAME } from '@/lib/site';

export const metadata: Metadata = { title: `כתיבת ביקורת | ${SITE_NAME}` };

/** המסלול "סיימתי קורס, רוצה לכתוב עליו" מדף הבית. */
export default function ReviewPage() {
  return <ComingSoon title="כתיבת ביקורת" line="בוחרים קורס, מעלים הוכחה שלמדתם בו, וכותבים מה יצא לכם ממנו." />;
}
