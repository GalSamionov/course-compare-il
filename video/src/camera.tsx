import React, { createContext, useContext } from 'react';
import { Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { C, SHADOW, STAGE, sans, type Box, type Layout } from './theme';
import { BinderClip, CameraScale, Tape, useProgress } from './world';

/** נקודת מצלמה: באיזה פריים, איזה מרכז (בפיקסלים של CSS בצילום) ובאיזה קנה מידה (פיקסלים בפריים לכל פיקסל CSS). */
export type Key = { f: number; x: number; y: number; s: number };

const ease = Easing.bezier(0.45, 0, 0.2, 1);

export function camAt(frame: number, keys: Key[]) {
  if (frame <= keys[0].f) return keys[0];
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1];
    const b = keys[i];
    if (frame <= b.f) {
      const t = ease((frame - a.f) / Math.max(1, b.f - a.f));
      return { f: frame, x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, s: a.s + (b.s - a.s) * t };
    }
  }
  return keys[keys.length - 1];
}

const WinSize = createContext({ w: 0, h: 0 });

/**
 * הדף על השולחן: נייר לבן עם דף מתחתיו, תפס למעלה וסלוטייפ "לדוגמה" בפינה.
 * בתוכו מוצג צילום מהאתר החי, דרך מצלמה שזזה ומגדילה.
 */
export function PageWindow({ layout, children, box }: { layout: Layout; children: React.ReactNode; box?: Box }) {
  const win = box ?? STAGE[layout].win;
  const tag = useProgress(10, 8);
  return (
    <div style={{ position: 'absolute', left: win.x, top: win.y, width: win.w, height: win.h }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: C.paperUnder,
          transform: 'rotate(0.7deg) translate(6px, 8px)',
          boxShadow: SHADOW.under,
        }}
      />
      <div style={{ position: 'absolute', inset: 0, background: C.paper, boxShadow: SHADOW.sheet, overflow: 'hidden' }}>
        <WinSize.Provider value={{ w: win.w, h: win.h }}>{children}</WinSize.Provider>
      </div>
      <BinderClip width={layout === 'wide' ? 128 : 132} style={{ top: -52, left: '50%', marginLeft: layout === 'wide' ? -64 : -66 }} />
      {/* כל נתון באתר הוא לדוגמה עד ההשקה, וזה כתוב (DESIGN.md). */}
      <Tape
        width={layout === 'wide' ? 150 : 170}
        height={layout === 'wide' ? 40 : 46}
        tilt={-8}
        style={{ top: 18, left: -30, fontSize: layout === 'wide' ? 22 : 26, opacity: tag }}
      >
        לדוגמה
      </Tape>
    </div>
  );
}

/**
 * צילום מסך בתוך הדף, עם מצלמה.
 * bounds: הגבול האופקי של הנייר בצילום, כדי שהמצלמה לא תראה את השולחן שמסביב.
 */
export function Shot({
  src,
  w,
  h,
  keys,
  bounds,
  vbounds,
  opacity = 1,
  children,
}: {
  src: string;
  w: number;
  h: number;
  keys: Key[];
  bounds?: [number, number];
  /** הגבול האנכי: למשל מתחת לתפס של האתר עצמו, כדי שלא יופיעו שני תפסים. */
  vbounds?: [number, number];
  opacity?: number;
  children?: React.ReactNode;
}) {
  const frame = useCurrentFrame();
  const win = useContext(WinSize);
  const k = camAt(frame, keys);
  const s = k.s;
  const visW = win.w / s;
  const visH = win.h / s;
  const [lo, hi] = bounds ?? [0, w];
  const [top, bottom] = vbounds ?? [0, h];
  const x = hi - lo <= visW ? (lo + hi) / 2 : Math.min(Math.max(k.x, lo + visW / 2), hi - visW / 2);
  const y = bottom - top <= visH ? (top + bottom) / 2 : Math.min(Math.max(k.y, top + visH / 2), bottom - visH / 2);
  const tx = win.w / 2 - x * s;
  const ty = win.h / 2 - y * s;
  if (opacity <= 0) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: w,
        height: h,
        transform: `translate(${tx}px, ${ty}px) scale(${s})`,
        transformOrigin: '0 0',
        opacity,
      }}
    >
      <Img src={staticFile(src)} style={{ width: w, height: h, display: 'block' }} />
      <CameraScale.Provider value={s}>{children}</CameraScale.Provider>
    </div>
  );
}

/** מעבר רך בין שני מצבים של אותו דף. */
export function useCrossfade(at: number, dur = 8) {
  const frame = useCurrentFrame();
  return interpolate(frame, [at, at + dur], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
}

/** נקודת מצלמה שממרכזת תיבה. */
export function center(box: Box, s: number, f: number, dx = 0, dy = 0): Key {
  return { f, x: box.x + box.w / 2 + dx, y: box.y + box.h / 2 + dy, s };
}

export const label = { fontFamily: sans };
