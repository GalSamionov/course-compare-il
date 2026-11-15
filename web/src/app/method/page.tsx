import type { Metadata } from 'next';
import Link from 'next/link';
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
  title: `איך אנחנו מדרגים | ${SITE_NAME}`,
  description: 'איך מחושב ציון הבוגרים: מי נספר, המשקלות לפי סוג קורס, ויומן השינויים בשיטה.',
};

const TYPES: CourseType[] = ['career', 'exam', 'hobby'];

export default async function MethodPage() {
  const { changes, metricLabels } = await getMethodData();
  return (
    <TextPage title="איך אנחנו מדרגים">
      <p>
        ציון הבוגרים בא רק מבוגרים שהעלו הוכחה שלמדו בקורס: חשבונית, קבלה או תעודת סיום. את הקורסים עצמם עוד לא
        בדקנו, וזה כתוב ליד כל ציון.
      </p>
      <p>הציון מחושב בקוד קבוע, לא על ידי מודל שפה. כל חישוב נשמר עם גרסת השיטה שלו, ושום חישוב לא נמחק.</p>

      <h2>מי נספר</h2>
      <ul>
        <li>רק ביקורות שאומתו ופורסמו ב-{WINDOW_MONTHS} החודשים האחרונים.</li>
        <li>ביקורת אחת לאדם, לקורס ולמחזור.</li>
        <li>כשמתגלה שמוכר נתן תמריץ על ביקורות, כל הביקורות מאותו מחזור יוצאות מהציון.</li>
      </ul>

      <h2>השאלות והמשקלות</h2>
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

      <h2>החישוב</h2>
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

      <h2>מתי אין ציון</h2>
      <ul>
        <li>מתחת ל-{MIN_REVIEWS} ביקורות אין ציון. במקומו מופיעות הביקורות עצמן, ו״עוד X ביקורות עד לציון״.</li>
        <li>אם לא נכנסה ביקורת חדשה {STALE_MONTHS} חודשים, הציון מסומן ״ייתכן שהתיישן״.</li>
      </ul>

      <h2>יומן השינויים בשיטה</h2>
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
        לפני שמשלמים על קורס אפשר גם לבדוק לבד: איך קוראים סילבוס, מה לשאול את המוסד, אילו תעודות מוכרות ואיך
        מממנים. על זה כתבנו{' '}
        <Link href="/guides" className="underline decoration-1 underline-offset-[3px] hover:text-link-hover">
          ארבעה מדריכים קצרים
        </Link>
        , וכל עובדה בהם עם המקור שלה.
      </p>
      <p>
        <Link href="/who-pays-us">מי משלם לנו</Link>
      </p>
    </TextPage>
  );
}
