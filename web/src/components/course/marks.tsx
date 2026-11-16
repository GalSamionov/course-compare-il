import { Children, isValidElement } from 'react';
import { PenArrow, PenArrowUp } from '@/components/site/pen';
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
 * המשיכה נמרחת פעם אחת, קצרה, כשהיא נכנסת למסך (globals.css, "תנועה").
 *
 * הצבע הוא לא הסימן היחיד (WCAG 1.4.1): בתחילת כל סימון העט מוסיף סימן קטן, וי לנבדק, בועת דיבור לבוגרים
 * וקריאה לחולשה (globals.css, data-cue; הציור ב-lib/mark-cues.ts). כך גם מי שלא מבחין בין הצבעים יודע מה המקור.
 * cue={false}: רק כשממש ליד הסימון כבר יש סימן גדול באותה משמעות, כמו הווי בכרטיס "בוגר מאומת".
 */
export function Mark({
  source,
  cue = true,
  children,
}: {
  source: MarkSource;
  cue?: boolean;
  children: React.ReactNode;
}) {
  return (
    <mark
      data-source={source}
      data-cue={cue ? source : undefined}
      data-tilt={tiltFor(children)}
      className={cn('hl', `hl-${source}`)}
    >
      <span className="sr-only">{markLabel[source]}: </span>
      {children}
    </mark>
  );
}

/**
 * דוגמה של סימון במקרא: אותה משיכה ואותו סימן בעט כמו בטקסט, על שם הצבע.
 * בלי תווית לקורא מסך: במקרא המשמעות כתובה ממש לידה.
 */
export function MarkSample({ source, children }: { source: MarkSource; children: React.ReactNode }) {
  return (
    <span data-cue={source} className={cn('hl font-semibold', `hl-${source}`)}>
      {children}
    </span>
  );
}

/**
 * טענה של המוסד שלא בדקנו: קו כחול של 2 פיקסלים מתחת לטקסט (globals.css, .claim).
 * הקו נמתח מימין לשמאל כשהטענה נכנסת למסך, כמו המרקרים: גם הוא סימון של מקור.
 */
export function Claim({ children }: { children: React.ReactNode }) {
  return (
    <span data-source="claim" className="claim">
      <span className="sr-only">המוסד אומר, לא נבדק: </span>
      {children}
    </span>
  );
}

/**
 * הערה קצרה של האתר לקורא, בעט הכחול (Rubik). זה הקול היחיד של האתר: פתק דביק הוא קול של בוגר או של המוסד.
 * arrow: חץ בעט לפני ההערה. true: חץ קטן בכיוון הקריאה. 'up': חץ מעוקל שעולה מתחילת ההערה אל מה שמעליה,
 * ולא תופס מקום בשורה. 'back': חץ קטן שמצביע אחורה, אל מה שעומד מימין להערה.
 * רכיב בלוק (p): אסור למקם אותו בתוך <p>.
 */
export function PenNote({
  children,
  arrow = false,
  className,
}: {
  children: React.ReactNode;
  arrow?: boolean | 'up' | 'back';
  className?: string;
}) {
  return (
    <p
      className={cn('font-pen text-[15px] leading-snug text-pen', arrow === 'up' && 'relative ps-6', className)}
    >
      {arrow === true && <PenArrow />}
      {arrow === 'back' && <PenArrow className="-scale-x-100" />}
      {arrow === 'up' && <PenArrowUp className="absolute start-0 -top-[15px] h-[26px] w-[22px]" />}
      {children}
    </p>
  );
}

/**
 * פס סלוטייפ עם קצוות קרועים. side: איפה הוא מודבק.
 * width ב-px. הפס הוא קישוט בלבד.
 */
export type WashiTone = 'lilac' | 'teal' | 'peach';

export function Tape({
  side = 'top',
  width = 64,
  tilt = -3,
  washi,
  className,
  children,
}: {
  side?: 'top' | 'top-start' | 'top-end';
  width?: number;
  tilt?: number;
  /** מסקינג טייפ צבעוני במקום סלוטייפ שקוף. רק על פתק לבן (paper), שהוא קישור ולא קול. */
  washi?: WashiTone;
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
      data-washi={washi}
      className={cn('tape z-[1]', children && 'flex items-center justify-center', className)}
      style={{ width, ...place }}
    >
      {children}
    </span>
  );
}

/**
 * grad: קול של בוגר. grad-light: אותו בוגר, 3 חודשים אחרי. institution: תגובת המוסד בלבד.
 * paper: פתק לבן, שהוא מקום באתר ולא קול של אף אחד: רק לקישור (תחום, מסלול). אין לו צבע של מקור.
 */
type NoteTone = 'grad' | 'grad-light' | 'institution' | 'paper';

const noteColor: Record<NoteTone, string> = {
  grad: 'bg-note-grad',
  'grad-light': 'bg-note-grad-light',
  institution: 'bg-note-institution',
  paper: 'bg-white',
};

/**
 * פתק דביק: צהוב לקול של בוגר, כחול לקול של המוסד. מודבק בסלוטייפ.
 * רכיב בלוק (div): אסור למקם אותו בתוך <p>.
 */
export function StickyNote({
  tone,
  tilt = 0,
  tiltLg,
  tape = true,
  washi,
  className,
  children,
}: {
  tone: NoteTone;
  /** סלוטייפ צבעוני: רק לפתק לבן (tone="paper"). */
  washi?: WashiTone;
  tilt?: number;
  /** הטיה אחרת מרוחב מחשב: פתק צר בעמודה מוטה יותר מפתק ברוחב מלא בנייד. */
  tiltLg?: number;
  /** בלי סלוטייפ: פתק שמודבק מעל פתק אחר נשען עליו. */
  tape?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  // הטיה מוגבלת ל-4 מעלות, כדי שהפתק לא יצא מהעמוד
  const clamp = (deg: number) => Math.max(-4, Math.min(4, deg));
  const angle = clamp(tilt);
  return (
    <div
      className={cn(
        'relative font-sans text-[13px] leading-snug text-pretty',
        // נייר של פתק: כהה מעט בתחתית, וצל של פינה שמתרוממת. פתק לבן מקבל צל אפור-קר, בלי הגוון הצהוב.
        'bg-[linear-gradient(to_bottom,transparent_70%,rgb(0_0_0/0.035))]',
        tone === 'paper'
          ? 'shadow-[0_0_0_1px_rgb(30_36_44/0.07),0_1px_1px_rgb(30_36_44/0.08),0_10px_14px_-9px_rgb(30_36_44/0.4)]'
          : 'shadow-[0_1px_1px_rgb(0_0_0/0.08),0_10px_14px_-9px_rgb(40_40_20/0.45)]',
        noteColor[tone],
        tiltLg !== undefined && 'rotate-(--tilt) lg:rotate-(--tilt-lg)',
        className,
      )}
      style={
        tiltLg === undefined
          ? { transform: `rotate(${angle}deg)` }
          : ({ '--tilt': `${angle}deg`, '--tilt-lg': `${clamp(tiltLg)}deg` } as React.CSSProperties)
      }
    >
      {tape && <Tape width={58} tilt={angle > 0 ? -4 : 3} washi={tone === 'paper' ? washi : undefined} />}
      {children}
    </div>
  );
}
