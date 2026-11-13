import type { Metadata } from 'next';
import { ComingSoon } from '@/components/site/coming-soon';

export const metadata: Metadata = { title: 'לחברות | [שם האתר]' };

/** המסלול "אנחנו חברה, מחפשים קורס או הרצאה לעובדים" (מסמך העיצוב, 3א.8). */
export default function CompaniesPage() {
  return (
    <ComingSoon
      title="לחברות"
      line="חברה שמחפשת קורס או הרצאה לעובדים תקבל רשימה קצרה מתוך הקטלוג. אנחנו לא לוקחים עמלה ממי שנבחר."
    />
  );
}
