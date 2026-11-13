import { Claim } from './marks';

export function SourceLegend() {
  return (
    <section aria-label="מקרא הסימונים" className="mt-8 font-sans text-[13px] leading-normal">
      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
        <span>
          <span className="bg-mark-verified px-1.5">ירוק</span> נבדק מול מסמך
        </span>
        <span>
          <span className="bg-mark-grads px-1.5">צהוב</span> מה שבוגרים אמרו
        </span>
        <span>
          <span className="bg-mark-weak px-1.5">ורוד</span> נקודת חולשה
        </span>
        <span>
          <Claim>קו כחול</Claim> המוסד אומר, לא נבדק
        </span>
      </div>
      <p className="mt-1 text-ink-soft">פתקים באותם צבעים: פתק צהוב הוא בוגר, פתק כחול הוא המוסד.</p>
    </section>
  );
}
