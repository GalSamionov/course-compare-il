import { Claim, MarkSample, Tape } from './marks';

/**
 * מקרא ארבעת הסימונים: כל דוגמה היא אותה משיכה ואותו סימן בעט כמו בטקסט (וי, מירכאות, קריאה),
 * כדי שגם מי שלא מבחין בין הצבעים ידע מה כל סימון אומר.
 * card: כרטיס לבן מודבק בסלוטייפ, בעמוד הקורס (בנייד מתחת ל"בקצרה", ובמחשב בעמודת הסיכום, מעל "על הקורס").
 * inline: שורה קצרה מתחת לסיכום לדוגמה בדף הבית.
 */
export function SourceLegend({ variant = 'card' }: { variant?: 'card' | 'inline' }) {
  const items = (
    <>
      <span>
        <MarkSample source="verified">ירוק</MarkSample> נבדק מול מסמך
      </span>
      <span>
        <MarkSample source="grads">צהוב</MarkSample> מה שבוגרים אמרו
      </span>
      <span>
        <MarkSample source="weak">ורוד</MarkSample> נקודת חולשה
      </span>
      <span>
        <Claim>קו כחול</Claim> המוסד אומר, לא נבדק
      </span>
    </>
  );
  if (variant === 'inline') {
    return (
      <section
        aria-label="מקרא הסימונים"
        className="mt-2 flex flex-wrap gap-x-3.5 gap-y-1 font-sans text-[13px] leading-relaxed lg:text-sm"
      >
        {items}
      </section>
    );
  }
  return (
    <section
      aria-label="מקרא הסימונים"
      className="relative mt-8 rotate-[0.6deg] bg-white px-4 pt-5 pb-3.5 lg:mt-10 lg:px-5 font-sans text-[13px] leading-normal shadow-[0_1px_2px_rgb(0_0_0/0.16),0_10px_18px_-12px_rgb(0_0_0/0.4)] ring-1 ring-black/[0.05] lg:text-sm"
    >
      <Tape width={70} tilt={-3} />
      <p className="mb-2 font-bold">מה אומר כל סימון</p>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 lg:gap-x-6">{items}</div>
      <p className="mt-2 text-ink-soft">פתקים באותם צבעים: פתק צהוב הוא בוגר, פתק כחול הוא המוסד.</p>
    </section>
  );
}
