import type { Metadata } from 'next';
import { ComingSoon } from '@/components/site/coming-soon';
import { SITE_NAME } from '@/lib/site';

export const metadata: Metadata = { title: `עמוד מוסד | ${SITE_NAME}` };

export default function InstitutionPage() {
  return <ComingSoon title="עמוד מוסד" line="פרטי המוסד, וכל הקורסים שלו באתר." />;
}
