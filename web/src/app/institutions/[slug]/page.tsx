import type { Metadata } from 'next';
import { ComingSoon } from '@/components/site/coming-soon';

export const metadata: Metadata = { title: 'עמוד מוסד | [שם האתר]' };

export default function InstitutionPage() {
  return <ComingSoon title="עמוד מוסד" line="פרטי המוסד, וכל הקורסים שלו באתר." />;
}
