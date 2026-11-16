/**
 * הסימנים הקטנים בעט בתחילת כל מרקר מקור (WCAG 1.4.1: הצבע הוא לא הסימן היחיד).
 * - verified: וי. בדקנו מול מסמך, כמו סטודנט שמסמן וי ליד מה שבדק.
 * - grads: בועת דיבור. מה שבוגרים אמרו, כמו התווית "בוגרים אמרו:" שקורא מסך שומע.
 *   לא מירכאות: בטקסט של בוגרים יש לפעמים מירכאות אמיתיות ("אחרי 3 חודשים"), ובבדיקת המודעה
 *   מירכאות הן ציטוט מדף המוסד. הזנב בצד ימין, בתחילת השורה העברית.
 * - weak: סימן קריאה. נקודה שכדאי לשים לב אליה לפני שמשלמים.
 *
 * מקור אחד לציור: globals.css (מסכה על .hl[data-cue], בעט הכחול) ותמונות השיתוף (_og/card.tsx) בונות ממנו.
 * mark-cues.test.ts בודק שהעותק ב-globals.css זהה לזה.
 */

export type CueSource = 'verified' | 'grads' | 'weak';

type Cue = { viewBox: string; body: (color: string) => string };

const stroke = (color: string, width: number) =>
  `fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"`;

export const CUE_PATHS = {
  verified: 'M3.2 10.9C4.9 12.5 6.3 14.4 7.5 16.7 9.8 11.1 13 6.5 17.2 3',
  grads:
    'M13.6 3.3C11 2.4 7.3 2.6 5 3.9 2.5 5.3 2 8.5 3.7 10.7 5.3 12.8 8.7 13.5 11.7 12.9L15.9 16.1 14.7 11.9C16.9 10.7 18 8.6 17.5 6.4 17.1 4.9 15.8 3.9 13.2 3.2',
  weak: 'M5.6 2.6C5.8 6.4 5.5 9.8 4.9 13',
} as const;

const CUES: Record<CueSource, Cue> = {
  verified: {
    viewBox: '0 0 20 20',
    body: (c) => `<path ${stroke(c, 2.7)} d="${CUE_PATHS.verified}"/>`,
  },
  grads: {
    viewBox: '0 0 20 20',
    body: (c) => `<path ${stroke(c, 2.3)} d="${CUE_PATHS.grads}"/>`,
  },
  weak: {
    viewBox: '0 0 10 20',
    body: (c) => `<path ${stroke(c, 3.1)} d="${CUE_PATHS.weak}"/><circle fill="${c}" cx="4.7" cy="17.4" r="2"/>`,
  },
};

/** ה-SVG של הסימן, בצבע שמבקשים. */
export function cueSvg(source: CueSource, color: string): string {
  const cue = CUES[source];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${cue.viewBox}">${cue.body(color)}</svg>`;
}
