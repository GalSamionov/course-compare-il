import type { Metadata } from 'next';
import { ComingSoon } from '@/components/site/coming-soon';

export const metadata: Metadata = { title: 'כתיבת ביקורת | [שם האתר]' };

export default function CourseReviewPage() {
  return (
    <ComingSoon
      title="כתיבת ביקורת"
      line="כאן תכתבו ביקורת על הקורס, עם הוכחה שלמדתם בו: חשבונית, קבלה או תעודת סיום."
    />
  );
}
