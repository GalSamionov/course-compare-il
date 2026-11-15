import Link from 'next/link';
import type { CheckView, RequestOutcome } from '@/app/request-course/actions';
import { Claim, Mark } from '@/components/course/marks';
import { SourceLegend } from '@/components/course/source-legend';
import { PenArrow, PenNumber } from '@/components/site/pen';
import { buttonVariants } from '@/components/ui/button';
import { AD_CLAIMS, CLAIM_LABELS, flagCopy, RED_FLAGS_GUIDE } from '@/lib/ad-check/flags';
import { cn } from '@/lib/utils';

const marginLabel = 'font-sans text-[13px] leading-tight text-ink-soft lg:text-[15px]';
const smallLink = 'inline-flex min-h-11 items-center underline underline-offset-[3px] hover:text-link-hover';
const sectionTitle = 'pen-rule mt-10 text-[21px] leading-snug font-bold lg:mt-14 lg:text-[28px]';
const row = 'ruled-row grid grid-cols-[var(--margin)_minmax(0,1fr)] items-start';
/** הטקסט בשורה: אחרי השוליים, עם אותו ריווח כמו התשובות בטופס. */
const cell = 'ps-3 pt-3 pb-2.5 lg:pt-3.5 lg:pb-3';
/** משפט של האתר, בעט (DESIGN.md, The One Pen Rule). */
const pen = 'font-pen text-[15px] leading-snug font-medium text-pen lg:text-base';

/** הכותרת והשורה שמתחתיה, לפי מה שיצא. בתוצאה, השורה היא הכתובת שנבדקה. */
export function checkHeading(check: CheckView, url: string): { title: string; lead: React.ReactNode } {
  switch (check.kind) {
    case 'result':
      return {
        title: 'מה כתוב בדף',
        lead: (
          <>
            הדף שבדקנו:{' '}
            <bdi dir="ltr" className="break-all">
              {shownUrl(url)}
            </bdi>
          </>
        ),
      };
    case 'social':
      return {
        title: 'את הקישור הזה אנחנו לא קוראים',
        lead: 'זה קישור לפוסט או לדף ברשת חברתית. פתחו את המודעה, לחצו על הכפתור שלה, והעתיקו את הקישור מהדפדפן.',
      };
    case 'quota':
      return { title: 'הבדיקות להיום נגמרו', lead: 'הגענו למספר הבדיקות האוטומטיות של היום. אפשר לבדוק שוב מחר.' };
    case 'unreadable':
      return {
        title: 'לא הצלחנו לקרוא את הדף',
        lead: 'אולי הוא בנוי רק ב-JavaScript, או שהוא לא נותן לקרוא אותו אוטומטית.',
      };
  }
}

/** הכתובת כמו שאדם קורא אותה: בלי https:// ובלי / בסוף, ועד 90 תווים. */
function shownUrl(url: string): string {
  const text = url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
  return text.length > 90 ? `${text.slice(0, 89)}…` : text;
}

/**
 * תוצאת בדיקת הקישור (docs/superpowers/specs/2026-11-15-ad-check-design.md, "העמוד"): מה הדף מבטיח, מה כדאי
 * לבדוק, ומה הבוגרים אומרים. בעולם של הסיכום: מה שהדף אומר בקו הכחול של טענה, דגל במרקר ורוד, וההסבר שלנו
 * בעט. כל הטקסט כאן שלנו, חוץ מהציטוטים, שנבדקו מול הדף לפני שהגיעו לכאן (lib/ad-check/quotes.ts).
 */
export function AdCheckResult({
  url,
  check,
  request,
  onAnother,
}: {
  url: string;
  check: CheckView;
  request: RequestOutcome;
  onAnother: () => void;
}) {
  return (
    <div>
      {check.kind === 'result' ? (
        <>
          <SourceLegend variant="inline" />

          <h2 className={sectionTitle}>מה הדף מבטיח</h2>
          <div className="margin-rule mt-4">
            <dl className="ruled-top">
              {AD_CLAIMS.map((key) => (
                <div key={key} className={row}>
                  <dt className={cn(marginLabel, 'pt-3.5 lg:pt-4')}>{CLAIM_LABELS[key]}</dt>
                  <dd className={cn(cell, 'text-base leading-normal lg:text-[17px]')}>
                    {check.result.claims[key] ? (
                      <Claim>{check.result.claims[key]}</Claim>
                    ) : (
                      <span className="font-sans text-[15px] text-ink-soft">לא כתוב בדף</span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <h2 className={sectionTitle}>מה כדאי לבדוק</h2>
          {check.result.flags.length > 0 ? (
            <div className="margin-rule mt-4">
              <ol className="ruled-top">
                {check.result.flags.map((finding, i) => {
                  const copy = flagCopy(finding.flag);
                  return (
                    <li key={finding.flag} className={row}>
                      <span className="pt-3 lg:pt-3.5">
                        <PenNumber n={i + 1} />
                      </span>
                      <div className={cn(cell, 'space-y-2')}>
                        <p className="text-[17px] leading-snug font-bold lg:text-lg">
                          <Mark source="weak">{copy.label}</Mark>
                        </p>
                        {finding.quotes.map((quote) => (
                          <p key={quote} className="text-base leading-normal text-pretty lg:text-[17px]">
                            <Claim>״{quote}״</Claim>
                          </p>
                        ))}
                        <p className={pen}>{copy.why}</p>
                        <Link href={copy.href} className={cn(smallLink, 'font-sans text-[15px] font-semibold')}>
                          מה לשאול, בפרק במדריך
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              <p className="text-base leading-normal lg:text-[17px]">לא מצאנו בדף את הדגלים מהרשימה.</p>
              <p className={pen}>
                <PenArrow />
                זה לא אומר שהקורס טוב. שאלו בוגרים.
              </p>
              <Link href={RED_FLAGS_GUIDE} className={cn(smallLink, 'font-sans text-[15px] font-semibold')}>
                שמונת הדגלים, במדריך
              </Link>
            </div>
          )}

          <h2 className={sectionTitle}>מה הבוגרים אומרים</h2>
          <Graduates request={request} />

          <p className="mt-8 max-w-[60ch] font-sans text-[13px] leading-normal text-pretty text-ink-soft lg:text-sm">
            בדיקה אוטומטית של מה שכתוב בדף, ב-{check.checkedOn}. היא לא פסק דין על הקורס.
          </p>
        </>
      ) : (
        <>
          {/* בלי בדיקה: רק מה קרה לקישור עצמו. קורס שכבר באתר עדיין מקבל את הקישור לעמוד שלו. */}
          <p dir="ltr" className="text-end font-sans text-[15px] leading-normal break-all text-ink-soft lg:text-base">
            {shownUrl(url)}
          </p>
          <div className="mt-6">
            <Graduates request={request} />
          </div>
        </>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-1 font-sans text-[15px] font-semibold">
        <button
          type="button"
          onClick={onAnother}
          className={cn(buttonVariants(), 'h-[50px] cursor-pointer px-6 font-sans text-base font-bold')}
        >
          {check.kind === 'result'
            ? 'לבדוק קישור נוסף'
            : check.kind === 'quota'
              ? 'לשלוח קישור נוסף לרשימה'
              : 'להדביק קישור אחר'}
        </button>
        <Link href={RED_FLAGS_GUIDE} className={smallLink}>
          המדריך: דגלים אדומים במודעה
        </Link>
      </div>
    </div>
  );
}

/** מה הבוגרים אומרים: הקורס באתר, או מה קרה לבקשה. */
function Graduates({ request }: { request: RequestOutcome }) {
  if (request.kind === 'existing') {
    const n = request.verifiedReviews;
    return (
      <div className="margin-rule mt-4">
        <div className="ruled-top">
          <div className={row}>
            <span className={cn(marginLabel, 'pt-3.5 lg:pt-4')}>כבר באתר</span>
            <div className={cell}>
              <Link
                href={`/courses/${request.slug}`}
                className="text-[17px] leading-snug font-bold underline underline-offset-[3px] hover:text-link-hover lg:text-lg"
              >
                {request.title || 'לעמוד הקורס'}
              </Link>
              <p className="mt-1 font-sans text-[15px] leading-normal text-ink-soft">
                {n === null
                  ? 'בעמוד הקורס: מה בוגרים מאומתים כתבו עליו.'
                  : n === 0
                    ? 'עוד אין עליו ביקורות מאומתות.'
                    : n === 1
                      ? 'ביקורת מאומתת אחת.'
                      : `${n} ביקורות מאומתות.`}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="mt-4 space-y-1">
      <p className="text-base leading-normal lg:text-[17px]">
        {request.kind === 'sent' ? 'הקורס עוד לא באתר. הוספנו אותו לרשימה שלנו.' : 'הקורס עוד לא באתר.'}
      </p>
      {request.kind === 'failed' && (
        <p className="font-sans text-[15px] leading-normal font-bold">{request.message}</p>
      )}
    </div>
  );
}
