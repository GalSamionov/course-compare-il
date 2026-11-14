import type { Metadata } from 'next';
import { ComingSoon } from '@/components/site/coming-soon';
import { SITE_NAME } from '@/lib/site';

export const metadata: Metadata = { title: `הוספת קורס | ${SITE_NAME}` };

/** המסלול "אני מוסד או מרצה, רוצה להוסיף קורס" מדף הבית. */
export default function InstitutionJoinPage() {
  return (
    <ComingSoon
      title="הוספת קורס על ידי מוסד או מרצה"
      line="מוסד או מרצה יוכלו לבקש להוסיף קורס. אנחנו בודקים כל קורס לפני שהוא עולה, ואף אחד לא משלם על מקום."
    />
  );
}
