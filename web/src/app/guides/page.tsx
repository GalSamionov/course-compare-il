import type { Metadata } from 'next';
import Link from 'next/link';
import { Claim, Mark } from '@/components/course/marks';
import { PenNumber } from '@/components/site/pen';
import { Sheet } from '@/components/site/sheet';
import { formatGuideDate, getGuides } from '@/lib/guides/guides';
import { SITE_NAME } from '@/lib/site';

export const ensureStatic = 'navigation';

export const metadata: Metadata = {
  title: `מדריכים לפני שמשלמים על קורס | ${SITE_NAME}`,
  description:
    'חמישה מדריכים לפני שמשלמים על קורס: סילבוס, שאלות למוסד, תעודות מוכרות, מימון, ודגלים אדומים במודעות. כל עובדה עם המקור שלה.',
  openGraph: { type: 'website', locale: 'he_IL', siteName: SITE_NAME, url: '/guides' },
};

/**
 * הסדרה "לפני שמשלמים": חמישה מדריכים לפי הסדר, כמו תוכן עניינים של חוברת.
 * כל מדריך על שורה של מחברת שנמשכת עד קצה הנייר, והמספר שלו בסדרה מוקף בעט.
 * מתחת לשם, מאותו צד, מה יש בו וכמה עובדות בו נבדקו (DESIGN.md, The Not A Menu Rule).
 */
export default function GuidesPage() {
  const guides = getGuides();
  const checked = guides.map((g) => g.checked).sort()[0];
  const needsLegal = guides.some((g) => g.legalReview);
  return (
    <Sheet narrow>
      <main id="main" className="pt-[22px] lg:pt-12">
        <h1 className="text-[30px] leading-tight font-bold text-balance lg:text-[48px]">לפני שמשלמים על קורס</h1>
        {needsLegal && (
          <p className="mt-2 inline-block border border-ink px-2 py-0.5 font-sans text-[13px] font-bold">
            טיוטה, לפני בדיקה של עורך דין
          </p>
        )}
        <div className="mt-5 max-w-[62ch] text-[16px] leading-[1.75] lg:mt-7 lg:text-[18px]">
          <p>
            חמישה מדריכים למי שעומד לשלם על קורס: איך קוראים סילבוס, מה לשאול את המוסד, אילו תעודות מוכרות, איך
            אפשר לממן את הלימודים, ואיך מזהים דגלים אדומים במודעה לקורס.
          </p>
          <p className="mt-4">
            כל עובדה בהם מסומנת לפי המקור שלה. <Mark source="verified">ירוק</Mark> נבדק מול מסמך רשמי, כמו חוק,
            תקנה או עמוד של משרד ממשלתי. <Claim>קו כחול</Claim> הוא מה שמוסדות נוטים להגיד, ולא בדקנו.{' '}
            <span className="font-pen font-medium text-pen">עט כחול</span> הוא הדעה שלנו.
          </p>
        </div>

        <ol className="ruled-top mt-9 lg:mt-12">
          {guides.map((g) => (
            <li key={g.slug} className="ruled-row flex items-start gap-3 py-5 lg:gap-5 lg:py-7">
              <PenNumber n={g.order} className="mt-0.5 lg:mt-1 lg:size-[34px] lg:text-[19px]" />
              <div className="min-w-0 flex-1">
                <h2 className="text-[19px] leading-snug font-bold text-balance lg:text-[24px]">
                  {/* כל השורה לחיצה (after), והעט מותח קו מתחת לשם בריחוף. */}
                  <Link
                    href={`/guides/${g.slug}`}
                    className="group hover:text-link-hover after:absolute after:inset-0 after:content-[''] focus-visible:outline-offset-4"
                  >
                    <span className="pen-under">{g.title}</span>
                  </Link>
                </h2>
                <p className="mt-1.5 max-w-[60ch] text-[15px] leading-relaxed text-pretty lg:text-[17px]">
                  {g.description}
                </p>
                <p className="mt-2 font-sans text-[13px] text-ink-soft lg:text-sm">
                  {g.sections.length} פרקים · {g.refs.length} עובדות שנבדקו מול מסמך · {g.sources.length} מקורות
                </p>
              </div>
            </li>
          ))}
        </ol>

        <p className="mt-6 max-w-[62ch] font-sans text-[13px] text-ink-soft text-pretty lg:mt-8 lg:text-sm">
          המקורות נבדקו ב-{formatGuideDate(checked)}. המדריכים מסבירים, הם לא ייעוץ משפטי: במקרה מסוים, מה שקובע הוא
          נוסח החוק והחוזה שלכם.
        </p>
      </main>
    </Sheet>
  );
}
