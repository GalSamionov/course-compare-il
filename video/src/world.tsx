import React, { createContext, useContext } from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { C, FELT, LABEL_FRAME, SHADOW, TAPE, pen, sans, type Box } from './theme';

/** הזמן של אנימציה מ-from ולמשך dur, בין 0 ל-1. */
export function useProgress(from: number, dur: number, ease: (t: number) => number = Easing.bezier(0.45, 0, 0.2, 1)) {
  const frame = useCurrentFrame();
  return interpolate(frame, [from, from + dur], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
}

/** משטח הלבד: הרקע של כל הסרטון. */
export function Desk() {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.desk,
        backgroundImage: `${FELT}, radial-gradient(ellipse at 50% 40%, rgb(255 255 255 / 0.05), rgb(0 0 0 / 0.18))`,
        backgroundSize: '220px 220px, 100% 100%',
      }}
    />
  );
}

/** סלוטייפ, עם טקסט אם צריך (כמו "לדוגמה" באתר). */
export function Tape({
  width,
  tilt = 0,
  height = 30,
  style,
  children,
}: {
  width: number;
  tilt?: number;
  height?: number;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        width,
        height,
        backgroundImage: TAPE,
        backgroundSize: '100% 100%',
        filter: 'drop-shadow(0 1px 0.5px rgb(0 0 0 / 0.12))',
        transform: `rotate(${tilt}deg)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: sans,
        fontWeight: 800,
        color: C.ink,
        zIndex: 3,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** התפס השחור שמחזיק את הדף, מ-web/src/components/site/sheet.tsx. */
export function BinderClip({ width = 130, style }: { width?: number; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 120 76"
      style={{ position: 'absolute', width, filter: 'drop-shadow(0 6px 5px rgb(0 0 0 / 0.35))', zIndex: 4, ...style }}
    >
      <path d="M36 44 30 8C29.6 5.4 31.4 4 34 4H86C88.6 4 90.4 5.4 90 8L84 44" fill="none" stroke="#b9bec4" strokeWidth="3.4" strokeLinejoin="round" />
      <path d="M36 44 30 8C29.6 5.4 31.4 4 34 4H86C88.6 4 90.4 5.4 90 8L84 44" fill="none" stroke="#e9ecef" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M14 38C14 34 17 31.6 21 31.4L99 31.4C103 31.6 106 34 106 38L104 70C104 72.6 102 74 99.4 74H20.6C18 74 16 72.6 16 70Z" fill="#1d1f22" />
      <path d="M18 36.6C18 35 19.4 34 21.4 34H98.6C100.6 34 102 35 102 36.6L101.6 42H18.4Z" fill="#3a3e43" />
      <path d="M22 70.4H98" stroke="#000" strokeOpacity=".5" strokeWidth="1.4" />
    </svg>
  );
}

/** כרטיס לבן מודבק בסלוטייפ: חפץ על השולחן, עם צל של חפץ. */
export function Card({ tilt = -1.2, style, children }: { tilt?: number; style?: React.CSSProperties; children: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'relative',
        background: C.paper,
        boxShadow: `${SHADOW.card}, 0 0 0 1px rgb(0 0 0 / 0.05)`,
        transform: `rotate(${tilt}deg)`,
        ...style,
      }}
    >
      <Tape width={120} tilt={-3} style={{ top: -15, left: '50%', marginLeft: -60 }} />
      {children}
    </div>
  );
}

/* ===== העט: הקול היחיד של האתר ===== */

/** מתאים נתיב SVG (רק פקודות מוחלטות עם זוגות x,y) לתיבה. כך העובי של הקו לא נמתח עם התיבה. */
export function fitPath(d: string, vb: { w: number; h: number }, box: Box) {
  let i = 0;
  return d.replace(/-?\d*\.?\d+/g, (n) => {
    const v = parseFloat(n);
    const out = i % 2 === 0 ? box.x + (v / vb.w) * box.w : box.y + (v / vb.h) * box.h;
    i++;
    return out.toFixed(2);
  });
}

/** עובי של קו עט בפיקסלים של הפריים, גם בתוך מצלמה שמגדילה. */
export const CameraScale = createContext(1);

/** קו עט שנמשך: progress מ-0 ל-1. */
export function DrawnPath({ d, progress, width = 4, color = C.pen }: { d: string; progress: number; width?: number; color?: string }) {
  const scale = useContext(CameraScale);
  if (progress <= 0) return null;
  return (
    <path
      d={d}
      pathLength={1}
      fill="none"
      stroke={color}
      strokeWidth={width / scale}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray="1 1.2"
      strokeDashoffset={1.1 - progress * 1.1}
    />
  );
}

const LOOP = 'M40.6 4.2C30.8 1.6 14.6 2.8 7 9.4 1.4 14.2 2.6 23.6 10.4 28.2 19.6 33.4 41.8 32.6 51.6 26.4 59 21.6 58.4 12.6 50.8 7.8 44.6 3.8 33.2 2.8 24.4 4';

/** עיגול בעט סביב תיבה, כמו PenLoop באתר. */
export function PenLoopAround({ box, from, dur = 16, pad = 10, width = 4 }: { box: Box; from: number; dur?: number; pad?: number; width?: number }) {
  const p = useProgress(from, dur, Easing.bezier(0.4, 0, 0.3, 1));
  const padX = pad * 1.6;
  const b = { x: box.x - padX, y: box.y - pad, w: box.w + padX * 2, h: box.h + pad * 2 };
  return (
    <svg style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }} width="100%" height="100%">
      <DrawnPath d={fitPath(LOOP, { w: 60, h: 34 }, b)} progress={p} width={width} />
    </svg>
  );
}

/** קו בעט מתחת לטקסט, כמו קו העט מתחת לכותרות. */
const RULE = 'M198.4 3.6C160 5.6 112 6.8 60 6.6 38 6.5 18 6.1 3.4 5.2';
export function PenUnderline({ box, from, dur = 14, width = 4 }: { box: Box; from: number; dur?: number; width?: number }) {
  const p = useProgress(from, dur);
  const b = { x: box.x - 4, y: box.y + box.h + 2, w: box.w + 8, h: 10 };
  return (
    <svg style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }} width="100%" height="100%">
      <DrawnPath d={fitPath(RULE, { w: 200, h: 12 }, b)} progress={p} width={width} />
    </svg>
  );
}

/** חץ בעט מנקודה לנקודה, קצת מעוקל, עם ראש. */
export function PenArrow({
  from: [x1, y1],
  to: [x2, y2],
  start,
  dur = 16,
  bend = 0.18,
  width = 4,
}: {
  from: [number, number];
  to: [number, number];
  start: number;
  dur?: number;
  bend?: number;
  width?: number;
}) {
  const p = useProgress(start, dur);
  const scale = useContext(CameraScale);
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  const cx = (x1 + x2) / 2 - dy * bend;
  const cy = (y1 + y2) / 2 + dx * bend;
  const ang = Math.atan2(y2 - cy, x2 - cx);
  const head = Math.min(26 / scale, len * 0.3);
  const a1 = ang + Math.PI - 0.5;
  const a2 = ang + Math.PI + 0.5;
  const headD = `M${x2 + Math.cos(a1) * head} ${y2 + Math.sin(a1) * head} L${x2} ${y2} L${x2 + Math.cos(a2) * head} ${y2 + Math.sin(a2) * head}`;
  return (
    <svg style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }} width="100%" height="100%">
      <DrawnPath d={`M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}`} progress={Math.min(1, p / 0.75)} width={width} />
      <DrawnPath d={headD} progress={Math.max(0, (p - 0.72) / 0.28)} width={width} />
    </svg>
  );
}

const NUM_LOOPS = [
  'M25.2 5.6C15.4 2.6 5.4 8.8 4.8 19.2 4.2 29.2 11.6 35.8 21 35.4 30.2 35 36 28.2 35.4 19 34.8 10.6 28 4.8 18.4 5.8',
  'M14.4 6.2C23.6 2.8 34.8 8 35.4 18.6 36 28.8 29 35.6 19.4 35.6 9.8 35.6 4.2 28.4 4.8 19.4 5.4 11.6 11 6.6 21.2 5.2',
  'M28.4 8.4C22.6 3.8 11.8 4.2 7.2 11.4 2.8 18.4 5 29.6 13.4 33.8 22 38 32.6 33.4 35 24.6 37 17.2 33.4 9.6 23.8 6.4',
];

/** מספר מוקף בעט, שנכתב: קודם העיגול ואז הספרה. */
export function PenNumber({ n, size, from }: { n: number; size: number; from: number }) {
  const p = useProgress(from, 14);
  const t = useProgress(from + 8, 6);
  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        flex: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: pen,
        fontWeight: 600,
        fontSize: size * 0.56,
        color: C.pen,
      }}
    >
      <svg viewBox="0 0 40 40" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
        <DrawnPath d={NUM_LOOPS[(n - 1) % 3]} progress={p} width={2.2} />
      </svg>
      <span style={{ position: 'relative', opacity: t, transform: 'translateY(2px)' }}>{n}</span>
    </div>
  );
}

/** טקסט בעט שנכתב מימין לשמאל, כמו יד שכותבת. */
export function PenWrite({
  children,
  from,
  dur = 22,
  size,
  weight = 500,
  tilt = -1,
  style,
}: {
  children: React.ReactNode;
  from: number;
  dur?: number;
  size: number;
  weight?: number;
  tilt?: number;
  style?: React.CSSProperties;
}) {
  const p = useProgress(from, dur, Easing.bezier(0.3, 0, 0.6, 1));
  return (
    <div
      style={{
        fontFamily: pen,
        fontWeight: weight,
        fontSize: size,
        lineHeight: 1.3,
        color: C.pen,
        transform: `rotate(${tilt}deg)`,
        transformOrigin: 'right center',
        clipPath: `inset(-20% 0 -20% ${(1 - p) * 100}%)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** חץ קטן בעט לפני הערה (PenArrow מהאתר): מצביע שמאלה, בכיוון הקריאה. */
export function SmallArrow({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 28 14" style={{ width: size * 1.25, height: size * 0.62, overflow: 'visible', marginInlineEnd: size * 0.25, flex: 'none' }}>
      <path d="M26.6 5.4C19.4 3.6 11.6 4.4 3.4 8.2" fill="none" stroke={C.pen} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8.6 3.4 2.8 8.5 9.6 11.4" fill="none" stroke={C.pen} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** שם האתר על תווית של כריכת מחברת, והשם נכתב בעט. */
export function Wordmark({ size, from }: { size: number; from: number }) {
  const frame = useProgress(from, 10);
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: C.paper,
        border: `${Math.round(size * 0.4)}px solid transparent`,
        borderImage: `${LABEL_FRAME} 12 / ${Math.round(size * 0.4)}px / 0 stretch`,
        padding: `${size * 0.06}px ${size * 0.42}px`,
        opacity: frame,
      }}
    >
      <PenWrite from={from + 6} dur={20} size={size} weight={600}>
        למדתי
      </PenWrite>
    </div>
  );
}
