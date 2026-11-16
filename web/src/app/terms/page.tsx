import type { Metadata } from 'next';
import { TextPage } from '@/components/site/text-page';
import { CONTACT_EMAIL, SITE_NAME } from '@/lib/site';

export const metadata: Metadata = {
  title: `תנאי שימוש (טיוטה) | ${SITE_NAME}`,
  alternates: { canonical: '/terms' },
  description: 'מה האתר אומר ומה לא, וכללי השימוש. טיוטה, לפני בדיקה של עורך דין.',
};

export default function TermsPage() {
  return (
    <TextPage title="תנאי שימוש" draft>
      <h2>מה האתר אומר, ומה לא</h2>
      <ul>
        <li>האתר לא ממליץ להירשם לקורס, ולא מקבל כסף ממי שמוכר קורסים.</li>
        <li>ציון הבוגרים מסכם את מה שבוגרים מאומתים דיווחו. הוא לא בדיקה שלנו של הקורס.</li>
        <li>פרטי הקורס לקוחים מאתר המוסד, עם תאריך הבדיקה. טענה של המוסד שלא בדקנו מסומנת בקו כחול.</li>
        <li>ביקורת היא הדעה של מי שכתב אותה. עובדות נבדקות ומתוקנות, ודעות נשארות.</li>
      </ul>

      <h2>שימוש באתר</h2>
      <ul>
        <li>אסור לפרסם ביקורת מזויפת, או ביקורת על קורס שלא למדתם בו.</li>
        <li>מוסד יכול להגיב לביקורת בפומבי, אבל לא למחוק אותה.</li>
      </ul>

      <h2 id="contact">יצירת קשר</h2>
      <p>
        את האתר מפעיל גל. שאלות, בקשות ותלונות: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>

      <p>התנאים המלאים ייכתבו לפני ההשקה, אחרי בדיקה של עורך דין.</p>
    </TextPage>
  );
}
