import Link from 'next/link';
import { PenNumber } from '@/components/site/pen';
import { cn } from '@/lib/utils';

/**
 * השאלות, ממוספרות בעיגול של עט כמו השאלות בשוליים של המחברת. המספר בעט מוסתר מקורא מסך: הרשימה ממוספרת לבד.
 * ברשימת התוצאות הן בתוך "מה לשאול לפני שמשלמים" המקופל (results.tsx), ובעמוד הקורס מתחת ל"העובדות".
 */
export function AskList({ questions, className }: { questions: readonly string[]; className?: string }) {
  return (
    <ol className={cn('space-y-2 font-sans text-[15px] leading-snug lg:text-base', className)}>
      {questions.map((question, i) => (
        <li key={question} className="grid grid-cols-[28px_minmax(0,1fr)] items-start gap-x-2">
          <PenNumber n={i + 1} className="size-6 text-[15px]" />
          <span className="pt-0.5 text-pretty">{question}</span>
        </li>
      ))}
    </ol>
  );
}

/** החלק בעמוד הקורס (מסמך העיצוב 2026-11-17): מתחת ל"העובדות", או מתחת ל"בקצרה" כשיש ציון. */
export function AskBeforePaying({ questions }: { questions: readonly string[] }) {
  return (
    <section aria-labelledby="before-paying-title" className="mt-6 font-sans lg:mt-8">
      <h2 id="before-paying-title" className="text-[15px] font-bold lg:text-base">
        מה לשאול לפני שמשלמים
      </h2>
      <AskList questions={questions} className="mt-2" />
      <p className="mt-1 text-[13px] text-ink-soft lg:text-sm">
        <Link
          href="/guides/questions-before-signing-up"
          className="inline-flex min-h-11 items-center underline decoration-1 underline-offset-[3px] hover:text-link-hover"
        >
          עוד שאלות, במדריך ״מה לשאול את המוסד לפני שנרשמים״
        </Link>
      </p>
    </section>
  );
}
