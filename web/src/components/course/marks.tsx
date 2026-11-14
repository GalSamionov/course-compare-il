import { Children, isValidElement } from 'react';
import { PenArrow } from '@/components/site/pen';
import { cn } from '@/lib/utils';

type MarkSource = 'verified' | 'grads' | 'weak';

const markLabel: Record<MarkSource, string> = {
  verified: 'נבדק מול מסמך',
  grads: 'בוגרים אמרו',
  weak: 'נקודת חולשה',
};

/** כל הטקסט שבתוך הסימון, כדי לבחור זווית משיכה קבועה לאותו טקסט. */
function textOf(node: React.ReactNode): string {
  return Children.toArray(node)
    .map((child) => {
      if (typeof child === 'string' || typeof child === 'number') return String(child);
      if (isValidElement<{ children?: React.ReactNode }>(child)) return textOf(child.props.children);
      return '';
    })
    .join('');
}

const TILTS = ['a', 'b', 'c'] as const;

/** זווית לפי הטקסט: אותו טקסט תמיד באותה משיכה, בשרת ובדפדפן. */
function tiltFor(children: React.ReactNode): (typeof TILTS)[number] {
  const text = textOf(children);
  let sum = 0;
  for (let i = 0; i < text.length; i++) sum += text.charCodeAt(i);
  return TILTS[sum % TILTS.length];
}

/**
 * מרקר בצבע המקור: ירוק נבדק מול מסמך, צהוב בוגרים, ורוד חולשה.
 * משיכה עם קצוות משופעים (globals.css, .hl), וכל שורה מקבלת משיכה משלה.
 * swipe: המשיכה נמרחת פעם אחת כשהדף נטען (רק בכרטיס הדוגמה בדף הבית).
 */
export function Mark({
  source,
  swipe,
  children,
}: {
  source: MarkSource;
  /** השהיה במילישניות לפני שהמשיכה נמרחת. */
  swipe?: number;
  children: React.ReactNode;
}) {
  return (
    <mark
      data-source={source}
      data-tilt={tiltFor(children)}
      className={cn('hl', `hl-${source}`, swipe !== undefined && 'hl-swipe')}
      style={swipe !== undefined ? { animationDelay: `${swipe}ms` } : undefined}
    >
      <span className="sr-only">{markLabel[source]}: </span>
      {children}
    </mark>
  );
}

/** טענה של המוסד שלא בדקנו: קו כחול מתחת לטקסט. */
export function Claim({ children }: { children: React.ReactNode }) {
  return (
    <span data-source="claim" className="underline decoration-claim decoration-2 underline-offset-[5px]">
      <span className="sr-only">המוסד אומר, לא נבדק: </span>
      {children}
    </span>
  );
}

/**
 * הערה קצרה של האתר לקורא, בכתב יד בעט כחול.
 * arrow: חץ בעט לפני ההערה. רכיב בלוק (p): אסור למקם אותו בתוך <p>.
 */
export function PenNote({
  children,
  arrow = false,
  className,
}: {
  children: React.ReactNode;
  arrow?: boolean;
  className?: string;
}) {
  return (
    <p className={cn('-rotate-1 font-pen text-[15px] leading-snug text-pen', className)}>
      {arrow && <PenArrow />}
      {children}
    </p>
  );
}

/**
 * פס סלוטייפ עם קצוות קרועים. side: איפה הוא מודבק.
 * width ב-px. הפס הוא קישוט בלבד.
 */
export function Tape({
  side = 'top',
  width = 64,
  tilt = -3,
  className,
  children,
}: {
  side?: 'top' | 'top-start' | 'top-end';
  width?: number;
  tilt?: number;
  className?: string;
  /** טקסט על הסלוטייפ, כמו תווית "לדוגמה". בלי טקסט הפס מוסתר מקורא מסך. */
  children?: React.ReactNode;
}) {
  const place =
    side === 'top'
      ? { top: -10, left: '50%', transform: `translateX(-50%) rotate(${tilt}deg)` }
      : side === 'top-start'
        ? { top: -9, insetInlineStart: -14, transform: `rotate(${tilt}deg)` }
        : { top: -9, insetInlineEnd: -14, transform: `rotate(${tilt}deg)` };
  return (
    <span
      aria-hidden={children ? undefined : true}
      className={cn('tape z-[1]', children && 'flex items-center justify-center', className)}
      style={{ width, ...place }}
    >
      {children}
    </span>
  );
}

type NoteTone = 'grad' | 'grad-light' | 'institution';

const noteColor: Record<NoteTone, string> = {
  grad: 'bg-note-grad',
  'grad-light': 'bg-note-grad-light',
  institution: 'bg-note-institution',
};

/**
 * פתק דביק: צהוב לקול של בוגר, כחול לקול של המוסד. מודבק בסלוטייפ.
 * רכיב בלוק (div): אסור למקם אותו בתוך <p>.
 */
export function StickyNote({
  tone,
  tilt = 0,
  tape = true,
  className,
  children,
}: {
  tone: NoteTone;
  tilt?: number;
  /** בלי סלוטייפ: פתק שמודבק מעל פתק אחר נשען עליו. */
  tape?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  // הטיה מוגבלת ל-4 מעלות, כדי שהפתק לא יצא מהעמוד
  const angle = Math.max(-4, Math.min(4, tilt));
  return (
    <div
      className={cn(
        'relative font-sans text-[13px] leading-snug text-pretty',
        // נייר של פתק: כהה מעט בתחתית, וצל של פינה שמתרוממת.
        'bg-[linear-gradient(to_bottom,transparent_70%,rgb(0_0_0/0.035))]',
        'shadow-[0_1px_1px_rgb(0_0_0/0.08),0_10px_14px_-9px_rgb(40_40_20/0.45)]',
        noteColor[tone],
        className,
      )}
      style={{ transform: `rotate(${angle}deg)` }}
    >
      {tape && <Tape width={58} tilt={angle > 0 ? -4 : 3} />}
      {children}
    </div>
  );
}
