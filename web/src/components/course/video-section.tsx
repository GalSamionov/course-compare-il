import { PenNote, StickyNote, Tape } from './marks';

/**
 * הסרטון של המוסד, כמו תמונת מסך שהודפסה והודבקה בסיכום: מסגרת נייר לבנה, סלוטייפ בפינה,
 * ופתק כחול של המוסד. הוא קטן מהטקסט סביבו, כי זה שיווק ולא הסיכום עצמו.
 */
export function VideoSection({ url }: { url: string }) {
  return (
    <section id="video" aria-label="סרטון של המוסד" className="relative mt-10 scroll-mt-6 lg:mt-12 lg:max-w-[520px]">
      <div className="relative rotate-[0.8deg] bg-white p-2 shadow-[0_1px_2px_rgb(0_0_0/0.18),0_12px_20px_-12px_rgb(0_0_0/0.45)] ring-1 ring-black/[0.06]">
        {/* הפינה הימנית מוסתרת בפתק של המוסד, ולכן סלוטייפ רק בשמאלית. */}
        <Tape side="top-end" width={64} tilt={36} />
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex aspect-video items-center justify-center bg-[#23262b] focus-visible:outline-2 focus-visible:outline-claim"
        >
          <span className="flex size-16 items-center justify-center rounded-full bg-white transition-transform group-hover:scale-105">
            <svg aria-hidden="true" width="22" height="24" viewBox="0 0 22 24">
              <path d="M20 12L3 22V2z" fill="#1c1c1c" />
            </svg>
          </span>
          <span className="sr-only">צפייה בסרטון של המוסד (נפתח בחלון חדש)</span>
        </a>
      </div>
      <StickyNote
        tone="institution"
        tilt={3}
        tape={false}
        className="absolute -top-4 -right-2 w-[136px] px-2 py-1.5 lg:-right-8 lg:w-[150px]"
      >
        סרטון של המוסד. לא ערכנו אותו.
      </StickyNote>
      <PenNote arrow className="mt-2">
        זה שיווק. את הדעות תמצאו למטה
      </PenNote>
    </section>
  );
}
