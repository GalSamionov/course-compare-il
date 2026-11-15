/**
 * הסימן של למדתי: האות ל, מוקפת בעיגול שנמשך ביד בעט כחול. כמו שהאתר מקיף עובדה או מספר בסיכום.
 * גל בחר ב-14.11.2026, במקום תווית המחברת. אותן צורות בכותרת (components/site/logo-mark.tsx),
 * באייקון (app/icon.svg ו-favicon.ico) ובכרטיס השיתוף (app/_og/card.tsx).
 * הכול בריבוע של 100 על 100.
 */

/** העיגול: נפתח למעלה מימין, מקיף, וממשיך מעט מעבר לנקודת ההתחלה, כמו קו ביד אחת. */
export const LOGO_LOOP = 'M68 9C46 1 16 10 9 36 3 60 20 88 50 91 78 94 96 72 93 46 90 22 70 8 44 10';

/** האות ל מ-IBM Plex Sans Hebrew Bold, כקו מתאר. בגובה 58 ובמרכז הריבוע. */
export const LOGO_LAMED = 'M338 477H22V740H172V610H496V470L316 0H156Z';
export const LOGO_LAMED_TRANSFORM = 'translate(30.7 80) scale(0.07838 -0.07838)';

export const LOGO_PEN = '#1f3fbf';
export const LOGO_INK = '#1c1c1c';

/**
 * הסימן כקובץ SVG שלם: לאייקון ולכרטיס השיתוף.
 * stroke: עובי העיגול. באייקון קטן (16 עד 32) הוא עבה יותר, כדי שלא ייעלם.
 * background: ריבוע מעוגל מאחור, לאייקון בלשונית כהה.
 */
export function logoMarkSvg({
  loop = LOGO_PEN,
  letter = LOGO_INK,
  stroke = 6.5,
  background,
  size = 100,
}: { loop?: string; letter?: string; stroke?: number; background?: string; size?: number } = {}): string {
  const bg = background ? `<rect width="100" height="100" rx="20" fill="${background}"/>` : '';
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">${bg}` +
    `<path fill="none" stroke="${loop}" stroke-width="${stroke}" stroke-linecap="round" d="${LOGO_LOOP}"/>` +
    `<path fill="${letter}" transform="${LOGO_LAMED_TRANSFORM}" d="${LOGO_LAMED}"/></svg>`
  );
}
