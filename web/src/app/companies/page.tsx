import type { Metadata } from 'next';
import Link from 'next/link';
import { PenNote } from '@/components/course/marks';
import { CompanyRequestForm } from '@/components/companies/request-form';
import { PenArrowDown } from '@/components/site/pen';
import { Sheet } from '@/components/site/sheet';
import { SITE_NAME } from '@/lib/site';

export const metadata: Metadata = {
  title: `לחברות | ${SITE_NAME}`,
  alternates: { canonical: '/companies' },
  description:
    'עוזרים לחברות לבחור קורס, הרצאה או סדנה לעובדים: מה כל מוסד מפרסם ומה הוא לא כותב, ומה לשאול לפני שמשלמים. בקרוב גם המחיר ששילמו בפועל וביקורות מאומתות. אף מוסד או מרצה לא משלם לנו.',
};

/**
 * מה החברה מקבלת, בשורות מחברת: הנושא בשוליים, והתשובה מודפסת על הקו.
 * soon: עוד לא קיים, כי עוד אין ביקורות וחשבוניות (מסמך העיצוב 2026-11-17). "בקרוב:" בעט, לפני התשובה.
 */
const OFFER: { label: string; text: string; soon?: boolean }[] = [
  { label: 'רשימה קצרה', text: 'קורסים, הרצאות או סדנאות מהקטלוג שלנו, שמתאימים למה שהעובדים צריכים ללמוד.' },
  {
    label: 'מחיר',
    soon: true,
    text: 'כמה שילמו עליהם בפועל, לפי חשבוניות של מי שלמדו בהם. עד אז, המחיר שהמוסד מפרסם, וכשהוא לא מפרסם, זה כתוב.',
  },
  { label: 'ביקורות', soon: true, text: 'רק ממי שהשתתפו והוכיחו את זה, בחשבונית, קבלה או תעודת סיום.' },
  {
    label: 'בלי עמלה',
    text: 'אף מוסד או מרצה לא משלם לנו, ואנחנו לא לוקחים עמלה ממי שתבחרו. ההסכם נחתם ישירות ביניכם.',
  },
  {
    label: 'אחרי ההכשרה',
    text: 'אם תרצו, נאסוף מהעובדים משוב על מה שלמדו. לציון הציבורי הוא נכנס רק במצטבר, בלי שם החברה ובהסכמתכם.',
  },
];

/**
 * המסלול "אנחנו חברה, מחפשים קורס או הרצאה לעובדים" מדף הבית. חברות הן מי שמשלם (PRODUCT.md), והעמוד בודק
 * ביקוש: מה מקבלים, ושיחת היכרות בלי התחייבות. עוד אין מחירון, וזה כתוב.
 * העמוד סטטי: הטופס בדפדפן, והשליחה בפעולת שרת (actions.ts).
 * במחשב: ההצעה מימין והטופס משמאל. בנייד: ההצעה, ואז הטופס, עם קישור בעט אליו מתחת לפתיחה.
 */
export default function CompaniesPage() {
  return (
    <Sheet>
      <main id="main" className="pb-6">
        <h1 className="mt-[22px] max-w-[30ch] text-[30px] leading-tight font-bold text-balance lg:mt-12 lg:text-[54px] lg:leading-[1.06]">
          לבחור קורס, הרצאה או סדנה לעובדים, לפי מי שכבר היה שם
        </h1>
        <p className="mt-3 max-w-[56ch] font-sans text-[17px] leading-normal text-pretty lg:mt-5 lg:text-xl">
          אנחנו עוזרים לחברות לבחור הכשרה לעובדים: מה כל מוסד מפרסם ומה הוא לא כותב, ומה לשאול לפני שמשלמים. בקרוב גם
          המחיר ששילמו בפועל, וביקורות של מי שהשתתפו והוכיחו את זה.
        </p>
        <p className="mt-2 font-sans text-[15px] font-semibold lg:hidden">
          <a href="#request" className="inline-flex min-h-11 items-center gap-1.5 hover:text-link-hover">
            <span className="underline decoration-1 underline-offset-[3px]">לספר לנו מה אתם מחפשים</span>
            <PenArrowDown />
          </a>
        </p>

        <div className="mt-7 lg:mt-14 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] lg:items-start lg:gap-x-20">
          <section aria-labelledby="offer-title">
            <h2 id="offer-title" className="pen-rule text-[21px] leading-snug font-bold lg:text-[28px]">
              מה תקבלו
            </h2>
            {/* השוליים והקו העליון על שני רכיבים: שניהם מצוירים ב-::before (globals.css), כמו בטופס למוסדות. */}
            <div className="margin-rule mt-4 lg:mt-6">
              <ul className="ruled-top">
                {OFFER.map((item) => (
                  <li
                    key={item.label}
                    data-anim="ink"
                    className="ruled-row grid grid-cols-[var(--margin)_minmax(0,1fr)] items-start"
                  >
                    <span className="pt-3 font-sans text-[13px] leading-tight text-ink-soft lg:pt-[18px] lg:text-[15px]">
                      {item.label}
                    </span>
                    <p className="pt-2.5 ps-3 pb-[9px] text-base leading-normal text-pretty lg:pt-3.5 lg:pb-3 lg:text-lg">
                      {item.soon && <span className="font-pen font-medium text-pen">בקרוב: </span>}
                      {item.text}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
            <PenNote arrow className="ms-(--margin) mt-4 max-w-[44ch] ps-3 text-base leading-snug lg:mt-5 lg:text-lg">
              השירות נבנה עכשיו, יחד עם החברות הראשונות. עוד אין מחירון: מתחילים בשיחת היכרות, בלי התחייבות.
            </PenNote>
            <p className="ms-(--margin) mt-1 ps-3 font-sans text-[13px] text-ink-soft lg:text-sm">
              <Link href="/who-pays-us" className="inline-flex min-h-11 items-center underline underline-offset-[3px] hover:text-link-hover">
                מי משלם לנו, ועל מה אף אחד לא יכול לשלם
              </Link>
            </p>
          </section>

          {/* במחשב הטופס בעמודה השנייה: הקווים שלו לא נמשכים אל הרווח שבין העמודות (כמו בטופס למוסדות). */}
          <CompanyRequestForm className="mt-10 lg:mt-0 lg:[--bleed:0px]" />
        </div>
      </main>
    </Sheet>
  );
}
