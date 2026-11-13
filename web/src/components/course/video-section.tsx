import { PenNote, StickyNote } from './marks';

export function VideoSection({ url }: { url: string }) {
  return (
    <section id="video" aria-label="סרטון של המוסד" className="relative mt-7">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex aspect-video items-center justify-center bg-[#23262b] focus-visible:outline-2 focus-visible:outline-claim"
      >
        <span className="flex size-16 items-center justify-center rounded-full bg-white">
          <svg aria-hidden="true" width="22" height="24" viewBox="0 0 22 24">
            <path d="M20 12L3 22V2z" fill="#1c1c1c" />
          </svg>
        </span>
        <span className="sr-only">צפייה בסרטון של המוסד (נפתח בחלון חדש)</span>
      </a>
      <StickyNote tone="institution" tilt={3} className="absolute -top-3.5 -right-2 w-[136px] px-2 py-1.5">
        סרטון של המוסד. לא ערכנו אותו.
      </StickyNote>
      <PenNote className="mt-1">← זה שיווק. את הדעות תמצאו למטה</PenNote>
    </section>
  );
}
