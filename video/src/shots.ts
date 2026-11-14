// המיקומים של הרכיבים בצילומים, מ-scripts/capture.mjs. בלי הצילומים (pnpm shots) הסרטון לא נבנה.
import desk from '../public/shots/desk/meta.json';
import phone from '../public/shots/phone/meta.json';
import type { Box, Layout } from './theme';

type Boxes = Record<string, Box>;
export type Meta = {
  viewport: { width: number; height: number };
  home: { height: number; boxes: Boxes };
  typing: { frames: string[]; scrollY: number; boxes: Boxes };
  why: { boxes: Boxes; button: string };
  results: { titles: string[]; boxes: Boxes };
  course: { height: number; boxes: Boxes };
  compare: { boxes: Boxes };
  tray: { boxes: Boxes };
  compareCourses: { title: string; score: string | null; price: string | null }[];
};

export const META: Record<Layout, Meta> = { wide: desk as unknown as Meta, tall: phone as unknown as Meta };
export const DIR: Record<Layout, string> = { wide: 'shots/desk', tall: 'shots/phone' };

/** הגבול האופקי של הנייר בצילום: במחשב הדף ברוחב 1184 (או 960 בעמודי טקסט) באמצע 1440. בטלפון הדף הוא המסך. */
export function sheetBounds(layout: Layout, narrow = false): [number, number] {
  if (layout === 'tall') return [0, 390];
  return narrow ? [240, 1200] : [128, 1312];
}
