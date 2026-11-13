import Link from 'next/link';

/** שלושת הצעדים, בלשון של PRODUCT.md: הוכחה, בדיקה, מחיקה. */
const STEPS = [
  'מעלים חשבונית, קבלה או תעודת סיום.',
  'אנחנו בודקים שההוכחה שייכת לקורס ולמחזור.',
  'ההוכחה נמחקת מיד אחרי הבדיקה. הביקורת נשארת.',
];

/** "איך האימות עובד" (מסמך העיצוב, 3א.7), מעל התחתית. המספרים בשוליים, כמו שאלות המחברת. */
export function VerificationSteps() {
  return (
    <section aria-labelledby="verification-title" className="mt-9">
      {/* הריווח על עטיפה ולא על הכותרת, כדי שהקו מתחת לכותרת יהיה ברוחב הטקסט, כמו בשאר הכותרות. */}
      <div className="ms-[70px] ps-3">
        <h2
          id="verification-title"
          className="inline-block border-b-2 border-ink pb-0.5 text-[21px] leading-snug font-bold"
        >
          איך האימות עובד
        </h2>
      </div>
      <ol className="mt-2">
        {STEPS.map((step, i) => (
          <li key={step} className="grid grid-cols-[70px_minmax(0,1fr)] items-baseline border-b border-rule py-2">
            <span aria-hidden="true" className="font-sans text-base font-bold">
              {i + 1}
            </span>
            <span className="ps-3">{step}</span>
          </li>
        ))}
      </ol>
      <p className="ms-[70px] mt-1 ps-3 font-sans text-[13px] text-ink-soft">
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
