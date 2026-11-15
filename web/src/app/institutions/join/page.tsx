import type { Metadata } from 'next';
import { JoinForm } from '@/components/institutions/join-form';
import { Sheet } from '@/components/site/sheet';
import { SITE_NAME } from '@/lib/site';

export const metadata: Metadata = {
  title: `הוספת קורס | ${SITE_NAME}`,
  description: 'מוסד או מרצה? שולחים קישור לדף הקורס. אנחנו בודקים את הפרטים מול הדף לפני שהקורס עולה, ואף אחד לא משלם על מקום.',
};

/**
 * המסלול "אני מוסד או מרצה, רוצה להוסיף קורס" מדף הבית (סבב 5, חלק מפריט 27).
 * העמוד סטטי: הטופס בדפדפן, והשליחה בפעולת שרת (actions.ts).
 */
export default function InstitutionJoinPage() {
  return (
    <Sheet>
      <main className="pb-6">
        <JoinForm />
      </main>
    </Sheet>
  );
}
