import { Claim, MarkSample, Tape } from '@/components/course/marks';
import { cn } from '@/lib/utils';

/**
 * מקרא שלושת הסימונים של המדריכים: ירוק נבדק מול מסמך, קו כחול מה שמוסדות אומרים, ועט כחול הדעה של האתר.
 * אותו כרטיס לבן מודבק כמו מקרא עמוד הקורס (source-legend.tsx), עם הסימונים שיש במדריך בלבד:
 * במדריכים אין קול של בוגרים ואין נקודות חולשה, ולכן אין צהוב ואין ורוד.
 */
export function GuideLegend({ className }: { className?: string }) {
  return (
    <section
      aria-label="מקרא הסימונים"
      className={cn(
        'relative rotate-[0.6deg] bg-white px-4 pt-5 pb-3.5 font-sans text-[13px] leading-normal lg:-rotate-[0.8deg] lg:text-sm',
        'shadow-[0_1px_2px_rgb(0_0_0/0.16),0_10px_18px_-12px_rgb(0_0_0/0.4)] ring-1 ring-black/[0.05]',
        className,
      )}
    >
      <Tape width={70} tilt={-3} />
      <p className="mb-2 font-bold">מה אומר כל סימון</p>
      <ul className="flex flex-col gap-1.5">
        <li>
          <MarkSample source="verified">ירוק</MarkSample> נבדק מול מסמך רשמי
        </li>
        <li>
          <Claim>קו כחול</Claim> מה שמוסדות אומרים. לא בדקנו
        </li>
        <li>
          <span className="font-pen font-medium text-pen">עט כחול</span> הדעה שלנו, לא עובדה
        </li>
      </ul>
      <p className="mt-2 text-ink-soft text-pretty">
        המספר הקטן אחרי עובדה ירוקה פותח את המקור שלה. כל המקורות בסוף העמוד.
      </p>
    </section>
  );
}
