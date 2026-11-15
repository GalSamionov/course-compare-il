'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { Claim, Tape } from '@/components/course/marks';
import { PEN_LOOPS, PenArrow } from '@/components/site/pen';
import { buttonVariants } from '@/components/ui/button';
import { INTRO_OPEN_EVENT, WALKTHROUGH, hasSeenIntro, introAllowedOn, markIntroSeen } from '@/lib/intro';
import { cn } from '@/lib/utils';

const STEPS = 3;

/**
 * ההיכרות למבקר ראשון: כרטיס לבן מודבק על הדף, עם שלושה דברים בחצי דקה, בקול של האתר.
 * לא חוסם את העמוד ולא לוקח פוקוס כשהוא נפתח לבד. מופיע פעם אחת לדפדפן, ונשאר פתוח במעבר בין עמודים
 * עד שסוגרים. "איך משתמשים בלמדתי" בכותרת התחתונה פותח אותו שוב (lib/intro.ts).
 * החוזה: .impeccable/surfaces/web-src-app-page-tsx.md, "תוספת: היכרות למבקר ראשון".
 */
export function FirstVisit() {
  // בלי usePathname: הרכיב יושב ב-layout, וקריאה של הכתובת בזמן הרינדור חוסמת את הבנייה הסטטית של כל העמודים.
  // הכתובת נקראת מ-window, רק בדפדפן, ברגע שצריך אותה.
  const router = useRouter();
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [video, setVideo] = useState(false);
  const card = useRef<HTMLElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const focusOnOpen = useRef(false);

  // פעם ראשונה בדפדפן הזה: נפתח שנייה אחרי שהעמוד נטען, כדי שהמבקר יראה קודם את מה שבא לראות.
  useEffect(() => {
    if (!introAllowedOn(window.location.pathname) || hasSeenIntro()) return;
    const timer = window.setTimeout(() => {
      markIntroSeen();
      setStep(1);
      setOpen(true);
    }, 900);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    function reopen() {
      opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      focusOnOpen.current = true;
      markIntroSeen();
      setStep(1);
      setOpen(true);
    }
    window.addEventListener(INTRO_OPEN_EVENT, reopen);
    return () => window.removeEventListener(INTRO_OPEN_EVENT, reopen);
  }, []);

  // כשפותחים מהכותרת התחתונה, הפוקוס עובר לכותרת של הכרטיס. כשהוא נפתח לבד, לא.
  useEffect(() => {
    if (open && focusOnOpen.current) {
      focusOnOpen.current = false;
      title.current?.focus();
    }
  }, [open]);

  function close() {
    const focusInside = card.current?.contains(document.activeElement) ?? false;
    setOpen(false);
    if (focusInside) opener.current?.focus();
    opener.current = null;
  }

  function ask() {
    close();
    if (window.location.pathname !== '/') {
      router.push('/#notebook-title');
      return;
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById('notebook-title')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    document.querySelector<HTMLTextAreaElement>('textarea[name="what"]')?.focus({ preventScroll: true });
  }

  return (
    <>
      {open && (
        <section
          ref={card}
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
          onKeyDown={(event) => {
            if (event.key === 'Escape') close();
          }}
          className={cn(
            // במחשב בפינה הימנית: בצד שמאל של עמוד הקורס עומדים הציון והכפתורים, ובדף הבית הסיכום לדוגמה.
            'fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-40 lg:inset-x-auto lg:start-7 lg:bottom-7 lg:w-[380px]',
            'animate-in fade-in slide-in-from-bottom-3 duration-300 ease-out motion-reduce:animate-none',
          )}
        >
          <div
            className={cn(
              'relative -rotate-[0.6deg] bg-white px-5 pt-6 pb-3 font-sans lg:rotate-[1.2deg] lg:px-6 lg:pt-7',
              'shadow-[0_1px_2px_rgb(0_0_0/0.16),0_12px_22px_-12px_rgb(0_0_0/0.45),0_26px_40px_-24px_rgb(0_0_0/0.4)] ring-1 ring-black/[0.05]',
            )}
          >
            <Tape width={84} tilt={-3} />
            <button
              type="button"
              onClick={close}
              aria-label="לסגור את ההיכרות"
              className="absolute end-1 top-1 inline-flex size-11 items-center justify-center text-pen hover:text-link-hover"
            >
              <PenCross />
            </button>

            <h2 ref={title} id={titleId} tabIndex={-1} className="pe-10 text-[19px] leading-snug font-bold outline-none lg:text-xl">
              פעם ראשונה בלמדתי?
            </h2>
            <p className="mt-0.5 font-pen text-[15px] leading-snug font-medium text-pen">
              <PenArrow />
              שלושה דברים, בחצי דקה
            </p>

            <div aria-live="polite" className="mt-3 min-h-[148px] text-[15px] leading-relaxed text-pretty lg:min-h-[156px]">
              {step === 1 && <StepOne />}
              {step === 2 && <StepTwo />}
              {step === 3 && <StepThree onAsk={ask} onVideo={() => setVideo(true)} />}
            </div>

            <div className="mt-2 flex items-center justify-between gap-3">
              <ol aria-label="הצעדים בהיכרות" className="-ms-2.5 flex">
                {Array.from({ length: STEPS }, (_, i) => i + 1).map((n) => (
                  <li key={n}>
                    <StepNumber n={n} current={step === n} onClick={() => setStep(n)} />
                  </li>
                ))}
              </ol>
              {step < STEPS ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className={cn(buttonVariants(), 'h-11 rounded-sm px-6 text-[15px] font-bold')}
                >
                  הבא
                </button>
              ) : (
                <button
                  type="button"
                  onClick={close}
                  className="inline-flex min-h-11 items-center px-1 text-[15px] font-semibold underline underline-offset-[3px] hover:text-link-hover"
                >
                  הבנתי, לסגור
                </button>
              )}
            </div>
          </div>
        </section>
      )}
      <VideoSheet open={video} onClose={() => setVideo(false)} />
    </>
  );
}

function StepTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-base leading-snug font-bold">{children}</p>;
}

function StepOne() {
  return (
    <>
      <StepTitle>ביקורות רק ממי שלמד</StepTitle>
      <p className="mt-1">
        כל ביקורת כאן נכתבה על ידי בוגר שהעלה הוכחה שלמד בקורס: חשבונית, קבלה או תעודת סיום. ואף מוכר קורסים לא משלם לנו.
      </p>
      <p className="mt-2 font-pen text-sm leading-snug font-medium text-pen">
        <PenArrow />
        כאן הכול נתוני דוגמה, עד ההשקה.
      </p>
    </>
  );
}

/** אותו מקרא כמו בעמוד הקורס (course/source-legend.tsx), גדול יותר. */
function StepTwo() {
  const swatch = 'hl font-semibold';
  return (
    <>
      <StepTitle>הצבע אומר מאיפה המידע</StepTitle>
      <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm leading-normal lg:text-[15px]">
        <li>
          <span className={cn(swatch, 'hl-verified')}>ירוק</span> נבדק מול מסמך
        </li>
        <li>
          <span className={cn(swatch, 'hl-grads')}>צהוב</span> מה שבוגרים אמרו
        </li>
        <li>
          <span className={cn(swatch, 'hl-weak')}>ורוד</span> נקודת חולשה
        </li>
        <li>
          <Claim>קו כחול</Claim> המוסד אומר, לא נבדק
        </li>
      </ul>
      <p className="mt-2.5 text-[13px] leading-normal text-ink-soft lg:text-sm">פתק צהוב הוא בוגר. פתק כחול הוא המוסד.</p>
    </>
  );
}

function StepThree({ onAsk, onVideo }: { onAsk: () => void; onVideo: () => void }) {
  return (
    <>
      <StepTitle>שואלים בשוליים</StepTitle>
      <p className="mt-1">כותבים במילים שלכם מה רוצים ללמוד ולמה, ורואים רק קורסים שמתאימים. אפשר להשוות עד 3, זה לצד זה.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={onAsk} className={cn(buttonVariants(), 'h-11 rounded-sm px-4 text-[15px] font-bold')}>
          לשאול עכשיו
        </button>
        <button
          type="button"
          onClick={onVideo}
          className={cn(
            buttonVariants({ variant: 'outline' }),
            'h-11 gap-2 rounded-sm border-[1.5px] border-ink px-3.5 text-[15px] font-bold hover:bg-white hover:text-link-hover',
          )}
        >
          <PlayMark />
          הסרטון, {WALKTHROUGH.seconds} שניות
        </button>
      </div>
    </>
  );
}

/** מספר הצעד בעט. הצעד הנוכחי מוקף בעיגול שנמשך ביד. */
function StepNumber({ n, current, onClick }: { n: number; current: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={current ? 'step' : undefined}
      aria-label={`צעד ${n} מתוך ${STEPS}`}
      className={cn(
        'relative inline-flex size-11 items-center justify-center font-pen text-[17px] leading-none font-semibold text-pen',
        !current && 'opacity-60 hover:opacity-100',
      )}
    >
      <svg aria-hidden="true" viewBox="0 0 40 40" className="absolute inset-[7px] overflow-visible">
        <path
          d={PEN_LOOPS[(n - 1) % PEN_LOOPS.length]}
          pathLength={1}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeDasharray="1 1.2"
          strokeDashoffset={current ? 0 : 1.1}
          className="transition-[stroke-dashoffset] duration-500 ease-out motion-reduce:transition-none"
        />
      </svg>
      <span aria-hidden="true" className="relative translate-y-px">
        {n}
      </span>
    </button>
  );
}

/** איקס שצויר בעט: שני קווים שלא בדיוק ישרים. */
function PenCross() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-[18px] overflow-visible">
      <path d="M5 5.6C9.4 9.8 13.6 14.2 18.8 18.6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M18.6 5.2C14.4 9.4 9.6 14 5.2 18.8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** משולש הפעלה קטן בדיו, מצויר ביד. בעברית הוא עדיין מצביע ימינה, כמו בכל נגן. */
function PlayMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5 overflow-visible">
      <path d="M4.2 2.6C7.8 4.6 10.6 6.4 13.2 8.1 10.4 9.8 7.6 11.6 4.4 13.5 4 9.8 4 6.2 4.2 2.6Z" fill="currentColor" />
    </svg>
  );
}

/**
 * סרטון ההדרכה בדף נייר על השולחן. <dialog> מודאלי: Esc ולחיצה על הרקע סוגרים, והפוקוס נשאר בתוכו.
 * בטלפון 9:16 ובמחשב 16:9, לפי רוחב המסך בזמן הפתיחה. הקובץ נטען רק כשפותחים.
 */
function VideoSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [kind, setKind] = useState<'wide' | 'tall'>('tall');

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) {
      setKind(window.matchMedia('(min-width: 1024px)').matches ? 'wide' : 'tall');
      d.showModal();
    }
    if (!open && d.open) d.close();
  }, [open]);

  const file = WALKTHROUGH[kind];
  return (
    <dialog
      ref={dialog}
      aria-label="סרטון: איך משתמשים בלמדתי"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialog.current) onClose();
      }}
      className="m-auto max-h-none max-w-none overflow-visible border-0 bg-transparent p-0 backdrop:bg-ink/75"
    >
      <figure className="bg-white p-2 font-sans shadow-[0_1px_1px_rgb(30_36_44/0.1),0_3px_8px_-3px_rgb(30_36_44/0.12),0_24px_44px_-20px_rgb(30_36_44/0.28)] lg:p-3">
        {open && (
          <video
            key={kind}
            controls
            autoPlay
            muted
            playsInline
            preload="metadata"
            poster={file.poster}
            width={kind === 'wide' ? 1280 : 720}
            height={kind === 'wide' ? 720 : 1280}
            className={cn(
              'block bg-paper-under',
              kind === 'wide' ? 'aspect-video h-auto w-[min(86vw,1040px)]' : 'aspect-[9/16] h-[min(72dvh,800px)] w-auto',
            )}
          >
            <source src={file.src} type="video/mp4" />
          </video>
        )}
        <figcaption className="flex items-center justify-between gap-4 pt-1.5 ps-1">
          <p className=" font-pen text-sm leading-snug font-medium text-pen">כל הנתונים בסרטון לדוגמה.</p>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 items-center px-1 text-[15px] font-semibold underline underline-offset-[3px] hover:text-link-hover"
          >
            לסגור
          </button>
        </figcaption>
      </figure>
    </dialog>
  );
}
