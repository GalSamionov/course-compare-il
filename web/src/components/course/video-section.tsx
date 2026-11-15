import { PenNote, Tape } from './marks';

/**
 * הסרטון של המוסד, כתמונה קטנה שהודבקה בשוליים של הסיכום, אחרי "על הקורס".
 * הוא קטן מהציון ומהטקסט בכוונה: זה שיווק של המוסד, לא הסיכום עצמו. הקישור נפתח בחלון חדש.
 */
export function VideoSection({ url }: { url: string }) {
  return (
    <section id="video" aria-label="סרטון של המוסד" className="mt-9 scroll-mt-6 lg:mt-12">
      <div className="flex items-start gap-4 lg:gap-5">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative block w-[136px] flex-none rotate-[1.2deg] bg-white p-1.5 shadow-[0_1px_2px_rgb(0_0_0/0.18),0_10px_16px_-10px_rgb(0_0_0/0.45)] ring-1 ring-black/[0.06] lg:w-[168px]"
        >
          <Tape width={44} tilt={-5} />
          <span className="flex aspect-video items-center justify-center bg-[#23262b]">
            <span className="flex size-9 items-center justify-center rounded-full bg-white transition-transform group-hover:scale-105 lg:size-10">
              <svg aria-hidden="true" width="13" height="14" viewBox="0 0 22 24">
                <path d="M20 12L3 22V2z" fill="#1c1c1c" />
              </svg>
            </span>
          </span>
          <span className="sr-only">צפייה בסרטון של המוסד (נפתח בחלון חדש)</span>
        </a>
        {/* ההערות הן האתר שמדבר, ולכן בעט. פתק כחול שמור למילים של המוסד עצמו, כמו "תגובת המוסד". */}
        <div className="min-w-0 pt-1">
          <PenNote arrow="back" className="lg:text-base">
            סרטון של המוסד, לא ערכנו אותו
          </PenNote>
          <PenNote className="mt-1.5 lg:text-base">זה שיווק. את הדעות תמצאו בביקורות</PenNote>
        </div>
      </div>
    </section>
  );
}
