import { loadFont as loadAssistant } from '@remotion/google-fonts/Assistant';
import { loadFont as loadSerif } from '@remotion/google-fonts/NotoSerifHebrew';
import { loadFont as loadPen } from '@remotion/google-fonts/PlaypenSansHebrew';

/** שלוש הידיים של האתר (DESIGN.md): סריף מודפס לתוכן, Assistant לתוויות, Playpen לעט של האתר בלבד. */
export const serif = loadSerif('normal', { weights: ['400', '700', '800'], subsets: ['hebrew', 'latin'] }).fontFamily;
export const sans = loadAssistant('normal', { weights: ['400', '600', '700', '800'], subsets: ['hebrew', 'latin'] }).fontFamily;
export const pen = loadPen('normal', { weights: ['500', '600'], subsets: ['hebrew', 'latin'] }).fontFamily;

/** הצבעים מ-DESIGN.md. צבע מקור רק למידע מהמקור הזה. */
export const C = {
  ink: '#1c1c1c',
  inkSoft: '#555555',
  pen: '#1f3fbf',
  claim: '#2f5fe0',
  paper: '#ffffff',
  paperUnder: '#eef0f2',
  desk: '#474b50',
  deskDeep: '#3a3e42',
  ruled: '#c3cad3',
  marginRule: '#9ca5b0',
} as const;

/** מרקם הלבד של השולחן, מ-globals.css. */
export const FELT =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .9 -.33'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23f)'/%3E%3C/svg%3E\")";

/** סלוטייפ עם קצוות קרועים, מ-globals.css. */
export const TAPE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 24' preserveAspectRatio='none'%3E%3Cpath fill='%23E6E9ED' fill-opacity='.74' d='M2.2 1.2L78 0.6 76.6 3.4 78.6 6 76.9 8.9 78.8 12.2 76.7 15 78.5 18.4 76.8 21 78.2 23.6 1.6 23.2 3.3 20.6 1.2 17.5 3.1 14.6 1.1 11.4 3.2 8.6 1.4 5.4 3.4 3.2Z'/%3E%3Cpath fill='%23fff' fill-opacity='.35' d='M4 3.4L76 2.9 76 7.2 4 7.6Z'/%3E%3C/svg%3E\")";

/** המסגרת של תווית המחברת (שם האתר), מ-globals.css. */
export const LABEL_FRAME =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 36 36'%3E%3Cpath fill='none' stroke='%231c1c1c' stroke-width='1.6' d='M9 1.5H27A7.5 7.5 0 0 0 34.5 9V27A7.5 7.5 0 0 0 27 34.5H9A7.5 7.5 0 0 0 1.5 27V9A7.5 7.5 0 0 0 9 1.5Z'/%3E%3Cpath fill='none' stroke='%231c1c1c' stroke-width='.8' d='M10.2 4.5H25.8A6.5 6.5 0 0 0 31.5 10.2V25.8A6.5 6.5 0 0 0 25.8 31.5H10.2A6.5 6.5 0 0 0 4.5 25.8V10.2A6.5 6.5 0 0 0 10.2 4.5Z'/%3E%3C/svg%3E\")";

/** צללים של חפצים בלבד (DESIGN.md, Elevation & Depth). */
export const SHADOW = {
  sheet: '0 1px 1px rgb(0 0 0 / 0.18), 0 3px 6px -2px rgb(0 0 0 / 0.22), 0 28px 48px -18px rgb(0 0 0 / 0.55)',
  under: '0 18px 36px -16px rgb(0 0 0 / 0.5)',
  card: '0 1px 2px rgb(0 0 0 / 0.16), 0 10px 18px -12px rgb(0 0 0 / 0.4), 0 22px 40px -22px rgb(0 0 0 / 0.5)',
} as const;

export type Layout = 'wide' | 'tall';
export type Box = { x: number; y: number; w: number; h: number };

export const FPS = 30;
export const SIZE: Record<Layout, { w: number; h: number }> = {
  wide: { w: 1920, h: 1080 },
  tall: { w: 1080, h: 1920 },
};

/**
 * איפה כל דבר עומד על השולחן.
 * wide: כרטיס ההסבר משמאל, והדף מימין (בעברית קוראים קודם את הדף).
 * tall: כרטיס ההסבר למעלה, והדף מתחתיו.
 */
export const STAGE: Record<Layout, { card: Box; win: Box }> = {
  wide: { card: { x: 64, y: 0, w: 488, h: 1080 }, win: { x: 600, y: 64, w: 1256, h: 952 } },
  tall: { card: { x: 64, y: 72, w: 952, h: 340 }, win: { x: 64, y: 488, w: 952, h: 1368 } },
};

/** כל סצנה מקבלת את הפריסה ואת הכתובת שבסוף. */
export type SceneProps = { layout: Layout; url: string };
