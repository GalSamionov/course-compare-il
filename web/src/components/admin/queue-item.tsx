import Link from 'next/link';
import { StickyNote } from '@/components/course/marks';
import { PaperClip } from '@/components/review/proof-step';
import type { QueueItem, QueueProof } from '@/lib/admin/queue';
import { formatIls } from '@/lib/format';
import { PROOF_KIND_LABEL, SUFFICIENT_KINDS, verifiedLabel } from '@/lib/reviews/types';
import { DecideForm } from './decide-form';

const FLAG_LABEL: Record<string, string> = {
  duplicate: 'אותו קובץ כבר הוגש עם ביקורת אחרת.',
  duplicate_same_review: 'אותו קובץ כבר נשלח עם הביקורת הזו.',
  busy_course: 'יותר משלוש ביקורות לקורס הזה ביממה.',
};

const SKIPPED_LABEL: Record<string, string> = {
  no_key: 'לא נבדק אוטומטית: אין מפתח Anthropic.',
  too_large: 'לא נבדק אוטומטית: הקובץ גדול מדי לבדיקה.',
  quota: 'לא נבדק אוטומטית: הכותב עבר את מכסת הבדיקות היומית.',
  error: 'הבדיקה האוטומטית נכשלה. לבדוק ידנית.',
};

/** היעד: תשובה תוך 48 שעות (מסמך העיצוב, סעיף 4). */
const TARGET_HOURS = 48;

const monthLabel = (iso: string) =>
  new Intl.DateTimeFormat('he-IL', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(iso));
const timeLabel = (iso: string) =>
  new Intl.DateTimeFormat('he-IL', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Jerusalem' }).format(
    new Date(iso),
  );
const sizeLabel = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)}MB` : `${Math.max(1, Math.round(bytes / 1024))}KB`;
const answerLabel = (value: number, scale: 'likert5' | 'yes_no') =>
  scale === 'yes_no' ? (value === 5 ? 'כן' : 'לא') : `${value} מתוך 5`;

/** כמה זמן הביקורת מחכה, מול היעד של 48 שעות. מעבר ליעד: מודגש, בדיו ובלי צבע. */
function Waiting({ hours }: { hours: number }) {
  const text = hours < 1 ? 'מחכה פחות משעה' : hours === 1 ? 'מחכה שעה' : `מחכה ${hours} שעות`;
  if (hours < TARGET_HOURS) return <>{text}</>;
  return <strong className="font-bold text-ink">{text}, מעבר ליעד של {TARGET_HOURS}</strong>;
}

/**
 * מה המודל קרא, מתחת למסמך. אי-ההתאמות עצמן עולות לבלוק "לשים לב" שליד ההחלטה (warningsOf).
 * רמז בלבד: טקסט מוסתר במסמך יכול לגרום למודל לקרוא מוסד, שם או סכום אחרים. ההחלטה רק מול המסמך עצמו.
 */
function CheckView({ proof }: { proof: QueueProof }) {
  const check = proof.check;
  if (!check) return <p className="text-ink-soft">לא נבדק אוטומטית.</p>;
  if ('skipped' in check) return <p className="font-semibold">{SKIPPED_LABEL[check.skipped]}</p>;
  const found = check.found;
  return (
    <>
      {check.mismatches.length === 0 ? (
        <p className="font-semibold">הקריאה האוטומטית לא מצאה אי-התאמות. זה לא אימות: לפתוח את המסמך.</p>
      ) : (
        <p className="font-semibold">הקריאה האוטומטית מצאה אי-התאמות: ליד ההחלטה.</p>
      )}
      <p className="mt-1 text-ink-soft">
        המודל קרא (רמז בלבד, המסמך קובע): {found.institutionName || 'בלי מוסד'}
        {found.businessNumber && `, עוסק ${found.businessNumber}`}, {found.documentDate || 'בלי תאריך'}
        {found.amountIls > 0 && `, ${formatIls(found.amountIls)}`}, {found.nameOnDocument || 'בלי שם'}.
      </p>
    </>
  );
}

/**
 * ההוכחה כמו שהכותב הצמיד אותה (proof-step.tsx): מסמך עם מהדק, בלי הטיה. הקישור נפתח בלשונית חדשה.
 * מתחת למסמך, ההערות לגל: מה סומן ומה המודל קרא.
 */
function ProofView({ proof }: { proof: QueueProof }) {
  return (
    <li>
      <div className="relative bg-white px-4 pt-5 pb-1 shadow-[0_1px_2px_rgb(0_0_0/0.16),0_10px_18px_-12px_rgb(0_0_0/0.4)] ring-1 ring-black/5">
        <PaperClip />
        <p className="text-[15px] font-bold">{PROOF_KIND_LABEL[proof.claimedKind]}</p>
        <p className="mt-0.5 text-[13px] text-ink-soft">
          {proof.mime === 'application/pdf' ? 'PDF' : 'תמונה'} · <span dir="ltr">{sizeLabel(proof.sizeBytes)}</span>
        </p>
        {proof.url ? (
          <a
            href={proof.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center text-[15px] font-semibold underline underline-offset-[3px] hover:text-link-hover"
          >
            לפתוח את ההוכחה
            <span className="sr-only"> (בלשונית חדשה)</span>
          </a>
        ) : (
          <p className="flex min-h-11 items-center text-[15px] font-semibold">אין קישור לקובץ. לרענן את הדף.</p>
        )}
      </div>
      <div className="mt-2.5 space-y-1 text-[13px] leading-normal">
        <p className="text-ink-soft">הקישור תקף לעשר דקות. לקישור חדש מרעננים את הדף.</p>
        <CheckView proof={proof} />
      </div>
    </li>
  );
}

/**
 * מה שגל צריך לראות לפני שהוא מאשר: מה המערכת סימנה (אותו קובץ, יותר מדי ביקורות ביממה) ואי-ההתאמות שהמודל
 * מצא. עם שתי הוכחות, כל שורה אומרת על איזו מהן.
 */
function warningsOf(proofs: readonly QueueProof[]): { flags: string[]; mismatches: string[] } {
  const prefix = (proof: QueueProof) => (proofs.length > 1 ? `${PROOF_KIND_LABEL[proof.claimedKind]}: ` : '');
  const flags = proofs.flatMap((p) => p.flags.map((flag) => `${prefix(p)}${FLAG_LABEL[flag] ?? flag}`));
  const mismatches = proofs.flatMap((p) =>
    p.check && 'found' in p.check ? p.check.mismatches.map((m) => `${prefix(p)}${m.message}`) : [],
  );
  return { flags: [...new Set(flags)], mismatches: [...new Set(mismatches)] };
}

export function QueueItemView({ item }: { item: QueueItem }) {
  const defaultKind = item.proofs.find((p) => SUFFICIENT_KINDS.includes(p.claimedKind))?.claimedKind ?? 'invoice';
  const modelAmount =
    item.proofs.flatMap((p) =>
      p.check && 'found' in p.check && p.check.found.amountIls > 0 ? [p.check.found.amountIls] : [],
    )[0] ?? null;
  const name = item.displayMode === 'anonymous' ? null : item.displayName;
  const headingId = `q-${item.reviewId}`;
  return (
    <article aria-labelledby={headingId} className="border-t border-rule py-6 lg:py-8">
      <header>
        <h2 id={headingId} className="text-[21px] leading-snug font-bold text-balance">
          <Link
            href={`/courses/${item.courseSlug}`}
            className="inline-flex min-h-11 items-center underline decoration-1 underline-offset-[3px] hover:text-link-hover"
          >
            {item.courseTitle}
          </Link>
        </h2>
        <p className="mt-1 font-sans text-[13px] leading-normal text-ink-soft">
          {item.institutionName} · מחזור {monthLabel(item.cohortMonth)}
          {item.finishedMonth && ` עד ${monthLabel(item.finishedMonth)}`}
        </p>
        {item.submittedAt && (
          <p className="font-sans text-[13px] leading-normal text-ink-soft">
            נשלחה {timeLabel(item.submittedAt)}
            {item.waitingHours !== null && (
              <>
                {' · '}
                <Waiting hours={item.waitingHours} />
              </>
            )}
          </p>
        )}
      </header>
      <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-14">
        <section aria-label="הביקורת" className="min-w-0">
          <StickyNote tone="grad" tape={false} className="max-w-[68ch] px-4 pt-4 pb-3.5">
            <p className="text-[13px]">
              {name ? (
                <>
                  <strong>{name}</strong>, {verifiedLabel(item.authorTitle)}
                </>
              ) : (
                <strong>{verifiedLabel(item.authorTitle)}</strong>
              )}
            </p>
            <p className="mt-1.5 text-[15px] leading-relaxed whitespace-pre-line lg:text-base">{item.body}</p>
          </StickyNote>
          <dl className="mt-5 grid grid-cols-[auto_auto] justify-start gap-x-6 gap-y-1 font-sans text-[13px] leading-normal">
            {item.answers.map((a) => (
              <div key={a.label} className="contents">
                <dt className="text-ink-soft">{a.label}</dt>
                <dd className="font-semibold tabular-nums">{answerLabel(a.value, a.scale)}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section aria-label="ההוכחות וההחלטה" className="min-w-0 font-sans">
          <ul aria-label="ההוכחות" className="space-y-7 pt-3">
            {item.proofs.map((proof) => (
              <ProofView key={proof.id} proof={proof} />
            ))}
          </ul>
          <div className="mt-7 border-t border-rule pt-5">
            <DecideForm
              reviewId={item.reviewId}
              courseSlug={item.courseSlug}
              courseTitle={item.courseTitle}
              defaultKind={defaultKind}
              modelAmount={modelAmount}
              sitePrice={item.sitePrice}
              {...warningsOf(item.proofs)}
            />
          </div>
        </section>
      </div>
    </article>
  );
}
