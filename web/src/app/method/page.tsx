import type { Metadata } from 'next';
import Link from 'next/link';
import { MarkSample } from '@/components/course/marks';
import { TextPage } from '@/components/site/text-page';
import { getMethodData } from '@/lib/data/method';
import { formatHebrewDate } from '@/lib/format';
import {
  CATEGORY_PRIOR_MIN_REVIEWS,
  MIN_OUTCOME_ANSWERS,
  MIN_REVIEWS,
  PRIOR_WEIGHT,
  STALE_MONTHS,
  WEIGHTS,
  WINDOW_MONTHS,
} from '@/lib/score/constants';
import type { CourseType } from '@/lib/score/types';
import { COURSE_TYPE_LABEL } from '@/lib/search/why';
import { SITE_NAME } from '@/lib/site';

export const ensureStatic = 'navigation';

export const metadata: Metadata = {
  title: `איך אנחנו משווים | ${SITE_NAME}`,
  alternates: { canonical: '/method' },
  description: 'מאיפה הפרטים על כל קורס, מה כל סימון אומר, ואיך יחושב ציון הבוגרים כשיהיו ביקורות. אף מוכר לא משלם לנו.',
};

const TYPES: CourseType[] = ['career', 'exam', 'hobby'];

/**
 * השיטה (מסמך העיצוב 2026-11-17): קודם מאיפה הפרטים, מה הסימונים אומרים, ושאף מוכר לא משלם.
 * אחר כך ביקורות, שבאות בקרוב. השיטה של הציון נשארת, תחת "כשיהיו ביקורות".
 */
export default async function MethodPage() {
  const { changes, metricLabels } = await getMethodData();
  return (
    <TextPage title="איך אנחנו משווים">
      <p>
        הפרטים על כל קורס הם מה שהמוסד כותב על עצמו, בדף של הקורס באתר שלו. האוסף שלנו קורא את הדף פעם בשבוע, ובכל
        עמוד קורס יש קישור לדף ותאריך הקריאה. מה שהמוסד לא כותב, כתוב גם אצלנו: ״לא כתוב בדף״, או ״המוסד לא מפרסם
        מחיר״. כך אפשר להשוות גם לפי מה שחסר.
      </p>

      <h2>מה הסימונים אומרים</h2>
      <ul>
        <li>
          <span className="claim">קו כחול</span>: מה המוסד אומר. לא בדקנו את זה.
        </li>
        <li>
          <MarkSample source="verified">ירוק</MarkSample>: מה נבדק מול מסמך.
        </li>
        <li>
          <MarkSample source="grads">צהוב</MarkSample>: מה שבוגרים אמרו.
        </li>
        <li>
          <MarkSample source="weak">ורוד</MarkSample>: נקודת חולשה.
        </li>
        <li>
          <span className="font-pen font-medium text-pen">בעט</span>: מה שלא כתוב, וההערות שלנו.
        </li>
      </ul>
      <p>
        אף מוכר קורסים לא משלם לנו: לא על מקום ברשימה, לא על הסדר ולא על מה שכתוב.{' '}
        <Link href="/who-pays-us">מי משלם לנו</Link>
      </p>

      <h2>ביקורות</h2>
      <p>
        בקרוב: ביקורות רק ממי שהעלה הוכחה שלמד בקורס, כמו חשבונית, קבלה או תעודת סיום. ההוכחה נמחקת אחרי הבדיקה.
      </p>

      <h2>כשיהיו ביקורות</h2>
      <p>
        ציון הבוגרים יבוא רק מבוגרים שהעלו הוכחה שלמדו בקורס. את הקורסים עצמם לא בדקנו, וזה כתוב ליד כל ציון.
      </p>
      <p>הציון מחושב בקוד קבוע, לא על ידי מודל שפה. כל חישוב נשמר עם גרסת השיטה שלו, ושום חישוב לא נמחק.</p>

      <h3>מי נספר</h3>
      <ul>
        <li>רק ביקורות שאומתו ופורסמו ב-{WINDOW_MONTHS} החודשים האחרונים.</li>
        <li>ביקורת אחת לאדם, לקורס ולמחזור.</li>
        <li>כשמתגלה שמוכר נתן תמריץ על ביקורות, כל הביקורות מאותו מחזור יוצאות מהציון.</li>
      </ul>

      <h3>השאלות והמשקלות</h3>
      <p>כל בוגר עונה על שאלון לפי סוג הקורס. ״ממליץ״ לא נכנס לציון, ומוצג בנפרד כאחוז הממליצים.</p>
      {TYPES.map((type) => (
        <table key={type} className="w-full font-sans text-[15px] tabular-nums">
          <caption className="text-start font-bold">{COURSE_TYPE_LABEL[type]}</caption>
          <tbody>
            {Object.entries(WEIGHTS[type]).map(([key, weight]) => (
              <tr key={key} className="border-b border-rule">
                <th scope="row" className="py-1.5 text-start font-normal">
                  {metricLabels[key] ?? key}
                </th>
                <td className="w-16 py-1.5 text-end">{Math.round((weight ?? 0) * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      ))}

      <h3>החישוב</h3>
      <ul>
        <li>תשובת ״כן״ נספרת כ-5, ותשובת ״לא״ כ-1. שאר השאלות בסולם 1 עד 5.</li>
        <li>
          הממוצע של כל שאלה נמשך לממוצע התחום, כאילו נוספו {PRIOR_WEIGHT} ביקורות בגובה הממוצע. כך קורס עם שתי
          ביקורות נלהבות לא קופץ לראש הרשימה.
        </li>
        <li>
          ממוצע התחום מחושב מכל הביקורות בתחום. כשיש בתחום פחות מ-{CATEGORY_PRIOR_MIN_REVIEWS} ביקורות, משתמשים
          בממוצע של כל הקורסים מאותו סוג.
        </li>
        <li>כל שאלה מומרת לסולם 0 עד 10, והציון הוא הסכום המשוקלל לפי הטבלאות.</li>
        <li>
          על ״אחרי 3 חודשים״ צריך לפחות {MIN_OUTCOME_ANSWERS} תשובות. בלי זה, המשקל שלה מתחלק בין שאר השאלות.
        </li>
      </ul>

      <h3>מתי אין ציון</h3>
      <ul>
        <li>בלי ביקורת מפורסמת, אין לקורס ציון ואין תיבת ציון. במקומה מופיעות העובדות שהמוסד מפרסם.</li>
        <li>מתחת ל-{MIN_REVIEWS} ביקורות אין ציון. במקומו מופיעות הביקורות עצמן, ו״עוד X ביקורות עד לציון״.</li>
        <li>אם לא נכנסה ביקורת חדשה {STALE_MONTHS} חודשים, הציון מסומן ״ייתכן שהתיישן״.</li>
      </ul>

      <h3>יומן השינויים בשיטה</h3>
      {changes.length === 0 ? (
        <p>עוד אין שינויים.</p>
      ) : (
        <ol className="list-none">
          {changes.map((change) => (
            <li key={change.version}>
              <span className="block font-sans text-[13px] text-ink-soft">
                גרסה {change.version}, {formatHebrewDate(change.changedAt)}
              </span>
              {change.summary}. הסיבה: {change.reason}.
            </li>
          ))}
        </ol>
      )}

      <p>
        לפני שמשלמים על קורס אפשר גם לבדוק לבד: איך קוראים סילבוס, מה לשאול את המוסד, אילו תעודות מוכרות, איך
        מממנים, ומה הדגלים האדומים במודעות. על זה כתבנו{' '}
        <Link href="/guides" className="underline decoration-1 underline-offset-[3px] hover:text-link-hover">
          חמישה מדריכים קצרים
        </Link>
        , וכל עובדה בהם עם המקור שלה.
      </p>
    </TextPage>
  );
}
