import type { Metadata } from 'next';
import { ComingSoon } from '@/components/site/coming-soon';
import { SITE_NAME } from '@/lib/site';

export const metadata: Metadata = { title: `השוואה | ${SITE_NAME}` };

export default function ComparePage() {
  return <ComingSoon title="השוואה" line="עד שלושה קורסים זה לצד זה, שורה לכל עובדה ולכל שאלה." />;
}
