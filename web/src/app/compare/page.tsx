import type { Metadata } from 'next';
import { ComingSoon } from '@/components/site/coming-soon';

export const metadata: Metadata = { title: 'השוואה | [שם האתר]' };

export default function ComparePage() {
  return <ComingSoon title="השוואה" line="עד שלושה קורסים זה לצד זה, שורה לכל עובדה ולכל שאלה." />;
}
