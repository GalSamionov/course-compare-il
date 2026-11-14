import Link from 'next/link';
import { cn } from '@/lib/utils';
import { PenNumber } from './pen';

/** שלושת הצעדים, בלשון של PRODUCT.md: הוכחה, בדיקה, מחיקה. */
const STEPS = [
  'מעלים חשבונית, קבלה או תעודת סיום.',
  'אנחנו בודקים שההוכחה שייכת לקורס ולמחזור.',
  'ההוכחה נמחקת מיד אחרי הבדיקה. הביקורת נשארת.',
];

/** חץ קטן בעט בין צעד לצעד, רק כשהצעדים בשורה (מחשב). */
function StepArrow() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 34 16"
      className="absolute top-2 -left-9 hidden h-4 w-[34px] overflow-visible text-pen lg:block"
    >
      <path d="M32 6.4C24 3.6 13 4.6 4 9.6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M9.4 4.6 3.4 9.8 10.4 12.4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * "איך האימות עובד" (מסמך העיצוב, 3א.7). בראש דף הבית, מתחת להבטחה: מספרים מוקפים בעט,
 * בנייד זה מתחת לזה ובמחשב בשורה אחת עם חצים ביניהם (חוזה דף הבית, FIRST VIEWPORT).
 */
export function VerificationSteps({ className }: { className?: string }) {
  return (
    <section aria-labelledby="verification-title" className={cn('mt-9', className)}>
      <div className="lg:flex lg:items-baseline lg:justify-between lg:gap-6">
        <h2 id="verification-title" className="pen-rule text-[19px] leading-snug font-bold lg:text-[22px]">
          איך האימות עובד
        </h2>
        <p className="hidden font-sans text-sm text-ink-soft lg:block">
          <Link
            href="/method"
            className="inline-flex min-h-11 items-center underline underline-offset-[3px] hover:text-link-hover"
          >
            איך אנחנו מדרגים
          </Link>
        </p>
      </div>
      <ol className="mt-3.5 grid gap-y-3 lg:mt-5 lg:grid-cols-3 lg:gap-x-12">
        {STEPS.map((step, i) => (
          <li key={step} className="relative flex items-start gap-3 lg:flex-col lg:gap-2">
            <PenNumber n={i + 1} className="size-9 text-xl lg:size-11 lg:text-2xl" />
            <span className="pt-1 text-[15px] leading-snug text-pretty lg:pt-0 lg:text-base">{step}</span>
            {i < STEPS.length - 1 && <StepArrow />}
          </li>
        ))}
      </ol>
      {/* בנייד הקישור מתחת לצעדים. במחשב הוא בשורת הכותרת, כדי שהמחברת תתחיל עוד במסך הראשון. */}
      <p className="mt-1 font-sans text-[13px] text-ink-soft lg:hidden">
        <Link
          href="/method"
          className="inline-flex min-h-11 items-center underline underline-offset-[3px] hover:text-link-hover"
        >
          איך אנחנו מדרגים
        </Link>
      </p>
    </section>
  );
}
