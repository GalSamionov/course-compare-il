import { cn } from '@/lib/utils';

/**
 * סימני העט של האתר: חץ, מספר מוקף וחץ גדול. הקול של האתר הוא עט כחול (#1F3FBF).
 * כולם קישוט שמלווה טקסט, ולכן aria-hidden.
 */

/** חץ קטן בעט, שמצביע מההערה אל התוכן (שמאלה, בכיוון הקריאה). */
export function PenArrow({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 28 14"
      className={cn('me-1 inline-block h-[0.62em] w-[1.25em] overflow-visible align-[0.04em] text-pen', className)}
    >
      <path d="M26.6 5.4C19.4 3.6 11.6 4.4 3.4 8.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M8.6 3.4 2.8 8.5 9.6 11.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * חץ מעוקל בעט שעולה מההערה אל מה שמעליה: למשל מהערה מתחת לתיבת הציון אל הציון.
 * בעברית הוא עומד בתחילת ההערה (מימין), ועולה ימינה ולמעלה.
 */
export function PenArrowUp({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 22 26" className={cn('overflow-visible text-pen', className)}>
      <path d="M3.2 24.2C5.4 16.8 9.8 10.4 18.2 3.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M11.4 3.9 18.7 3.2 17.4 10.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** שלוש צורות של עיגול ביד, כדי שהמספרים לא ייראו מוחתמים. */
export const PEN_LOOPS = [
  'M25.2 5.6C15.4 2.6 5.4 8.8 4.8 19.2 4.2 29.2 11.6 35.8 21 35.4 30.2 35 36 28.2 35.4 19 34.8 10.6 28 4.8 18.4 5.8',
  'M14.4 6.2C23.6 2.8 34.8 8 35.4 18.6 36 28.8 29 35.6 19.4 35.6 9.8 35.6 4.2 28.4 4.8 19.4 5.4 11.6 11 6.6 21.2 5.2',
  'M28.4 8.4C22.6 3.8 11.8 4.2 7.2 11.4 2.8 18.4 5 29.6 13.4 33.8 22 38 32.6 33.4 35 24.6 37 17.2 33.4 9.6 23.8 6.4',
];

/** מספר מוקף בעט: לשאלות בשוליים ולצעדים. */
export function PenNumber({ n, className }: { n: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative inline-flex size-[30px] flex-none items-center justify-center font-pen text-[17px] leading-none font-semibold text-pen',
        className,
      )}
    >
      <svg viewBox="0 0 40 40" className="absolute inset-0 size-full overflow-visible">
        <path d={PEN_LOOPS[(n - 1) % PEN_LOOPS.length]} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      </svg>
      <span className="relative translate-y-[1px]">{n}</span>
    </span>
  );
}

/**
 * עיגול בעט סביב מספר בטבלה, כמו סטודנט שהקיף את המספר הגדול ברשימה.
 * העיגול רחב מהמספר ונמשך מעבר לנקודת ההתחלה, כמו קו שנמשך ביד אחת.
 */
export function PenLoop({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('relative inline-block', className)}>
      <svg
        aria-hidden="true"
        viewBox="0 0 60 34"
        preserveAspectRatio="none"
        className="pointer-events-none absolute -inset-x-[9px] -inset-y-[5px] h-[calc(100%+10px)] w-[calc(100%+18px)] overflow-visible text-pen"
      >
        <path
          d="M40.6 4.2C30.8 1.6 14.6 2.8 7 9.4 1.4 14.2 2.6 23.6 10.4 28.2 19.6 33.4 41.8 32.6 51.6 26.4 59 21.6 58.4 12.6 50.8 7.8 44.6 3.8 33.2 2.8 24.4 4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span className="relative">{children}</span>
    </span>
  );
}

/**
 * תיבה ריקה שצוירה בעט, לשורה במחברת שעוד אין בה תשובה. בהירה ובלי מסגרת של כפתור:
 * היא מחכה לתשובה, ואין מה ללחוץ עליה. הפינות לא נסגרות בדיוק, כמו ריבוע ביד.
 */
export function PenBox({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={cn('overflow-visible text-pen', className)}>
      <path
        d="M3.4 4.2C9 3.1 15.2 2.9 20.7 3.7 21.4 9.2 21.2 15 20.3 20.5 14.6 21.3 8.8 21.1 3.3 20.2 2.6 14.4 2.8 8.6 4.4 2.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** חץ גדול ומעוקל בעט, בין ההבטחה בדף הבית לבין הסיכום לדוגמה. */
export function PenSwoosh({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 120 64" className={cn('overflow-visible text-pen', className)}>
      <path
        d="M114 8C96 4 70 6 52 18 36 28 26 42 10 52"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M19.6 53.8 9.4 52.6 13.2 43"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
