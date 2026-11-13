import { cn } from '@/lib/utils';

type MarkSource = 'verified' | 'grads' | 'weak';

const markColor: Record<MarkSource, string> = {
  verified: 'bg-mark-verified',
  grads: 'bg-mark-grads',
  weak: 'bg-mark-weak',
};

const markLabel: Record<MarkSource, string> = {
  verified: 'נבדק מול מסמך',
  grads: 'בוגרים אמרו',
  weak: 'נקודת חולשה',
};

/** מרקר בצבע המקור: ירוק נבדק מול מסמך, צהוב בוגרים, ורוד חולשה. */
export function Mark({ source, children }: { source: MarkSource; children: React.ReactNode }) {
  return (
    <mark data-source={source} className={cn('box-decoration-clone px-0.5 text-inherit', markColor[source])}>
      <span className="sr-only">{markLabel[source]}: </span>
      {children}
    </mark>
  );
}

/** טענה של המוסד שלא בדקנו: קו כחול מתחת לטקסט. */
export function Claim({ children }: { children: React.ReactNode }) {
  return (
    <span
      data-source="claim"
      className="underline decoration-claim decoration-2 underline-offset-[5px]"
    >
      <span className="sr-only">המוסד אומר, לא נבדק: </span>
      {children}
    </span>
  );
}

/**
 * הערה קצרה של האתר לקורא, בכתב יד בעט כחול.
 * רכיב בלוק (p): אסור למקם אותו בתוך <p>.
 */
export function PenNote({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn('font-pen text-[15px] leading-snug text-pen -rotate-1', className)}>{children}</p>
  );
}

type NoteTone = 'grad' | 'grad-light' | 'institution';

const noteColor: Record<NoteTone, string> = {
  grad: 'bg-note-grad',
  'grad-light': 'bg-note-grad-light',
  institution: 'bg-note-institution',
};

/**
 * פתק דביק: צהוב לקול של בוגר, כחול לקול של המוסד.
 * רכיב בלוק (div): אסור למקם אותו בתוך <p>.
 */
export function StickyNote({
  tone,
  tilt = 0,
  className,
  children,
}: {
  tone: NoteTone;
  tilt?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'font-sans text-[13px] leading-snug shadow-[0_8px_12px_-6px_rgba(40,40,20,0.4)]',
        noteColor[tone],
        className,
      )}
      // הטיה מוגבלת ל-4 מעלות, כדי שהפתק לא יצא מהעמוד
      style={{ transform: `rotate(${Math.max(-4, Math.min(4, tilt))}deg)` }}
    >
      {children}
    </div>
  );
}
