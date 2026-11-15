import Link from 'next/link';
import { cn } from '@/lib/utils';
import { PenNumber } from './pen';

/** שלושת הצעדים, בלשון של PRODUCT.md: הוכחה, בדיקה, מחיקה. */
const STEPS = [
  'מעלים חשבונית, קבלה או תעודת סיום.',
  'אנחנו בודקים שההוכחה שייכת לקורס ולמחזור.',
  'ההוכחה נמחקת מיד אחרי הבדיקה. הביקורת נשארת.',
];

/**
 * סימן קטן בעט לכל צעד: קבלה, מסמך עם וי, ומסמך שקשקשו עליו.
 * קווים ביד ולא אייקונים מספרייה (DESIGN.md: כל סימן מצויר ב-SVG). קישוט שמלווה את הטקסט, ולכן aria-hidden.
 */
const STEP_MARKS: string[][] = [
  // קבלה: דף עם שוליים משוננים בתחתית ושלוש שורות
  [
    'M8.4 4.6C13.6 4.2 18.8 4.3 23.8 4.7 24 11.6 23.9 19 23.6 26.4L21 24.6 18.4 26.5 15.8 24.7 13.2 26.6 10.6 24.8 8.2 26.5C8 19.2 8 11.8 8.4 4.6Z',
    'M11.6 10.6C14.6 10.3 17.6 10.4 20.4 10.6',
    'M11.6 14.6C14.6 14.4 17.8 14.5 20.6 14.7',
    'M11.8 18.6C13.6 18.4 15.4 18.5 17.2 18.6',
  ],
  // נבדק: דף עם פינה מקופלת ווי
  [
    'M9.2 4.4C12.6 4.2 16 4.2 19.4 4.4L24 9C24.2 15.4 24.1 21.4 23.8 27.4 19 27.7 14 27.7 9.2 27.4 8.9 19.8 8.9 12 9.2 4.4Z',
    'M19.4 4.6C19.2 6.2 19.2 7.6 19.4 9.2 21 9.3 22.4 9.3 23.8 9.1',
    'M12.2 17.4C13.3 18.4 14.3 19.6 15.2 20.9 16.8 18.2 18.6 15.8 21 13.6',
  ],
  // נמחק: אותו דף, עם קשקוש עליו
  [
    'M9.2 4.4C12.6 4.2 16 4.2 19.4 4.4L24 9C24.2 15.4 24.1 21.4 23.8 27.4 19 27.7 14 27.7 9.2 27.4 8.9 19.8 8.9 12 9.2 4.4Z',
    'M7.2 13.2C11.4 11.2 17.6 10 25.6 11.4 19.4 12 13.2 14.4 8.4 17.8 14.6 15.4 20.8 14.6 26 15.8 19.4 16.8 13.4 19.4 8.8 22.4 14 20.6 19.6 20 24.4 21',
  ],
];

function StepMark({ index }: { index: number }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 32 32"
      className="size-8 flex-none overflow-visible text-pen lg:size-9"
    >
      {STEP_MARKS[index].map((d) => (
        <path
          key={d}
          d={d}
          pathLength={1}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}

/** חץ קטן בעט בין צעד לצעד, רק כשהצעדים בשורה (מחשב). */
function StepArrow() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 34 16"
      className="absolute top-2 -left-9 hidden h-4 w-[34px] overflow-visible text-pen lg:block"
    >
      <path d="M32 6.4C24 3.6 13 4.6 4 9.6" pathLength={1} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M9.4 4.6 3.4 9.8 10.4 12.4" pathLength={1} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
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
            <span className="flex flex-none items-center gap-1.5 lg:gap-2">
              <PenNumber n={i + 1} className="size-9 text-xl lg:size-11 lg:text-2xl" />
              <StepMark index={i} />
            </span>
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
