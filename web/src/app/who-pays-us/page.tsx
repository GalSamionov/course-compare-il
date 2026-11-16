import type { Metadata } from 'next';
import Link from 'next/link';
import { TextPage } from '@/components/site/text-page';
import { SITE_NAME } from '@/lib/site';

export const metadata: Metadata = {
  title: `מי משלם לנו | ${SITE_NAME}`,
  alternates: { canonical: '/who-pays-us' },
  description: 'כל מקור הכנסה של האתר, והכללים שמונעים ממוכר קורסים לשלם על תוצאה.',
};

export default function WhoPaysUsPage() {
  return (
    <TextPage title="מי משלם לנו">
      <p>היום אף אחד.</p>

      <h2>מאיפה יבוא הכסף</h2>
      <p>
        מחברות שמכשירות עובדים. חברה מקבלת מאיתנו מיפוי של מי צריך ללמוד מה, רשימה קצרה של ספקים מתוך הקטלוג,
        ומדידה לפני הקורס ואחריו. היא משלמת מנוי שנתי.
      </p>
      <p>החוזה עם ספק ההכשרה נחתם ישירות בין החברה לספק, בלי עמלה לנו.</p>

      <h2>על מה אף אחד לא יכול לשלם</h2>
      <ul>
        <li>מקום ברשימה.</li>
        <li>ציון, או סימון ״נבדק״.</li>
        <li>הסרה של ביקורת.</li>
        <li>תוכן ממומן, או פרסומת של מוכר.</li>
      </ul>

      <h2>הכללים</h2>
      <ul>
        <li>הכסף מגיע רק ממי שקונה הכשרה, אף פעם ממי שמוכר אותה.</li>
        <li>הציון נקבע לפני שבודקים אם יש עמלה.</li>
        <li>תוצאות של חברות נכנסות לציון הציבורי רק במצטבר, בלי שם החברה, ובהסכמתה.</li>
        <li>כל מקור הכנסה מפורסם בעמוד הזה.</li>
      </ul>

      <p>
        <Link href="/method">איך אנחנו מדרגים</Link>
      </p>
    </TextPage>
  );
}
