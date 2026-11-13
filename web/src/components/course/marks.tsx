import { cn } from '@/lib/utils';

type MarkSource = 'verified' | 'grads' | 'weak';

const markColor: Record<MarkSource, string> = {
  verified: 'bg-mark-verified',
  grads: 'bg-mark-grads',
  weak: 'bg-mark-weak',
};

/** מרקר בצבע המקור: ירוק נבדק מול מסמך, צהוב בוגרים, ורוד חולשה. */
export function Mark({ source, children }: { source: MarkSource; children: React.ReactNode }) {
  return <mark className={cn('px-0.5 text-inherit', markColor[source])}>{children}</mark>;
}

/** טענה של המוסד שלא בדקנו: קו כחול מתחת לטקסט. */
export function Claim({ children }: { children: React.ReactNode }) {
  return (
    <span className="underline decoration-claim decoration-2 underline-offset-[5px]">{children}</span>
  );
}

/** הערה קצרה של האתר לקורא, בכתב יד בעט כחול. */
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

/** פתק דביק: צהוב לקול של בוגר, כחול לקול של המוסד. */
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
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      {children}
    </div>
  );
}
