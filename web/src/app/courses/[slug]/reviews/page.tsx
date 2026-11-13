import type { Metadata } from 'next';
import { ComingSoon } from '@/components/site/coming-soon';

export const metadata: Metadata = { title: 'כל הביקורות | [שם האתר]' };

export default function CourseReviewsPage() {
  return <ComingSoon title="כל הביקורות" line="כל הביקורות המאומתות על הקורס, מהחדשה לישנה." />;
}
