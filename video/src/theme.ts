import { loadFont as loadPlex } from '@remotion/google-fonts/IBMPlexSansHebrew';
import { loadFont as loadRubik } from '@remotion/google-fonts/Rubik';

/**
 * שתי הידיים של האתר אחרי הרענון (DESIGN.md, 14.11.2026): IBM Plex Sans Hebrew לכל הדיו המודפסת,
 * ו-Rubik בכחול לקול של האתר בלבד, בלי הטיה. השמות serif ו-sans נשארו כתפקידים: תוכן ותווית.
 */
const plex = loadPlex('normal', { weights: ['400', '500', '600', '700'], subsets: ['hebrew', 'latin'] }).fontFamily;
export const serif = plex;
export const sans = plex;
export const pen = loadRubik('normal', { weights: ['400', '500', '600'], subsets: ['hebrew', 'latin'] }).fontFamily;

/** הצבעים מ-DESIGN.md. צבע מקור רק למידע מהמקור הזה. */
export const C = {
  ink: '#1c1c1c',
  inkSoft: '#555555',
  pen: '#1f3fbf',
  claim: '#2f5fe0',
  paper: '#ffffff',
  paperUnder: '#f6f7f9',
  /** שולחן בהיר ושטוח, בלי מרקם ובלי תפס: דף על משטח כהה עם תפס נקרא כמו תפריט על קליפבורד. */
  desk: '#e9ebee',
  deskDeep: '#a3a9b0',
  ruled: '#c3cad3',
  marginRule: '#9ca5b0',
} as const;

/** סלוטייפ עם קצוות קרועים, מ-globals.css. */
export const TAPE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 24' preserveAspectRatio='none'%3E%3Cpath fill='%23E6E9ED' fill-opacity='.74' d='M2.2 1.2L78 0.6 76.6 3.4 78.6 6 76.9 8.9 78.8 12.2 76.7 15 78.5 18.4 76.8 21 78.2 23.6 1.6 23.2 3.3 20.6 1.2 17.5 3.1 14.6 1.1 11.4 3.2 8.6 1.4 5.4 3.4 3.2Z'/%3E%3Cpath fill='%23fff' fill-opacity='.35' d='M4 3.4L76 2.9 76 7.2 4 7.6Z'/%3E%3C/svg%3E\")";

/** הסימן של למדתי: ל מוקפת בעט כחול, מ-web/src/lib/logo.ts. בריבוע של 100 על 100. */
export const LOGO_LOOP = 'M68 9C46 1 16 10 9 36 3 60 20 88 50 91 78 94 96 72 93 46 90 22 70 8 44 10';
export const LOGO_LAMED = 'M338 477H22V740H172V610H496V470L316 0H156Z';
export const LOGO_LAMED_TRANSFORM = 'translate(30.7 80) scale(0.07838 -0.07838)';

/** צללים של חפצים בלבד (DESIGN.md, Elevation & Depth): קרירים ובהירים, כדי שיתאימו לשולחן הבהיר. */
export const SHADOW = {
  sheet: '0 1px 1px rgb(30 36 44 / 0.1), 0 3px 8px -3px rgb(30 36 44 / 0.12), 0 24px 44px -20px rgb(30 36 44 / 0.28)',
  under: '0 1px 1px rgb(30 36 44 / 0.08), 0 16px 30px -18px rgb(30 36 44 / 0.25)',
  card: '0 1px 2px rgb(0 0 0 / 0.16), 0 10px 18px -12px rgb(0 0 0 / 0.4)',
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
