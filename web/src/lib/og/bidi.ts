/**
 * עברית בתמונות השיתוף (next/og). Satori מצייר טקסט משמאל לימין, בסדר שבו הוא כתוב,
 * בלי אלגוריתם הכיווניות של יוניקוד. מחרוזת עברית רגילה הייתה יוצאת הפוכה.
 *
 * הפתרון: שורה מתפרקת ליחידות שאי אפשר לשבור (מילה עברית, או רצף לועזי כמו "Full Stack"),
 * וכל יחידה כבר מסודרת בסדר שבו רואים אותה. הרכיב שמצייר מניח את היחידות בשורה מימין לשמאל
 * (flex-direction: row-reverse, flex-wrap: wrap), ולכן גם שבירת שורה מתחילה מימין.
 *
 * זו גרסה מצומצמת של אלגוריתם הכיווניות (UBA, Unicode 15), לפסקה בכיוון ימין לשמאל:
 * אותיות עבריות, אותיות לטיניות, ספרות ומפרידים, ₪ ו-%, רווחים וסימני פיסוק. אין כאן הטבעות
 * (LRE/RLI), ספרות ערביות או ניקוד, כי הטקסט באתר לא משתמש בהם.
 */

type Kind = 'R' | 'L' | 'EN' | 'ES' | 'ET' | 'CS' | 'WS' | 'ON';

function kindOf(ch: string): Kind {
  const c = ch.codePointAt(0) ?? 0;
  if ((c >= 0x0590 && c <= 0x05ff) || (c >= 0xfb1d && c <= 0xfb4f)) return 'R';
  if (c >= 0x30 && c <= 0x39) return 'EN';
  if ((c >= 0x41 && c <= 0x5a) || (c >= 0x61 && c <= 0x7a) || (c >= 0xc0 && c <= 0x24f && c !== 0xd7 && c !== 0xf7)) {
    return 'L';
  }
  if (c === 0x2b || c === 0x2d) return 'ES';
  if (c === 0x23 || c === 0x24 || c === 0x25 || c === 0xb0 || c === 0x2030 || (c >= 0x20a0 && c <= 0x20cf)) return 'ET';
  if (c === 0x2c || c === 0x2e || c === 0x2f || c === 0x3a || c === 0xa0) return 'CS';
  if (c === 0x20 || c === 0x09) return 'WS';
  return 'ON';
}

/** סימנים שמתהפכים כשהם בתוך טקסט מימין לשמאל (כלל L4). */
const MIRROR: Record<string, string> = {
  '(': ')',
  ')': '(',
  '[': ']',
  ']': '[',
  '{': '}',
  '}': '{',
  '<': '>',
  '>': '<',
  '«': '»',
  '»': '«',
};

/** רמת הכיווניות של כל תו: 1 מימין לשמאל, 2 משמאל לימין (לועזית ומספרים). */
function levelsOf(chars: string[]): number[] {
  const k = chars.map(kindOf);
  const n = k.length;

  // W4: מפריד יחיד בין שתי ספרות הוא חלק מהמספר (12,500 או 7.9).
  for (let i = 1; i < n - 1; i++) {
    if ((k[i] === 'CS' || k[i] === 'ES') && k[i - 1] === 'EN' && k[i + 1] === 'EN') k[i] = 'EN';
  }
  // W5: ₪, % ודומיהם שצמודים למספר הם חלק ממנו.
  for (let i = 0; i < n; i++) {
    if (k[i] !== 'ET') continue;
    let j = i;
    while (j < n && k[j] === 'ET') j++;
    if ((i > 0 && k[i - 1] === 'EN') || (j < n && k[j] === 'EN')) for (let x = i; x < j; x++) k[x] = 'EN';
    i = j - 1;
  }
  // W6: שאר המפרידים ניטרליים.
  for (let i = 0; i < n; i++) if (k[i] === 'ES' || k[i] === 'ET' || k[i] === 'CS') k[i] = 'ON';
  // W7: מספר שאחרי טקסט לועזי שייך לרצף הלועזי (למשל "Python 3").
  let strong: 'L' | 'R' = 'R';
  for (let i = 0; i < n; i++) {
    if (k[i] === 'L' || k[i] === 'R') strong = k[i] as 'L' | 'R';
    else if (k[i] === 'EN' && strong === 'L') k[i] = 'L';
  }
  // N1, N2: רצף ניטרלי מקבל את הכיוון של שני צדדיו אם הם זהים (מספר נחשב ימין לשמאל), ואחרת ימין לשמאל.
  const dir = (x: Kind): 'L' | 'R' => (x === 'L' ? 'L' : 'R');
  for (let i = 0; i < n; i++) {
    if (k[i] !== 'WS' && k[i] !== 'ON') continue;
    let j = i;
    while (j < n && (k[j] === 'WS' || k[j] === 'ON')) j++;
    const before = i > 0 ? dir(k[i - 1]) : 'R';
    const after = j < n ? dir(k[j]) : 'R';
    const resolved = before === after ? before : 'R';
    for (let x = i; x < j; x++) k[x] = resolved;
    i = j - 1;
  }
  return k.map((x) => (x === 'R' ? 1 : 2));
}

/** כלל L2: הופכים כל רצף מהרמה הגבוהה כלפי מטה, ואז מהפכים סימנים ברמה 1. */
function visual(chars: string[], levels: number[]): string {
  let cells = chars.map((c, i) => ({ c, l: levels[i] }));
  for (let level = Math.max(...levels); level >= 1; level--) {
    const next: typeof cells = [];
    let i = 0;
    while (i < cells.length) {
      if (cells[i].l < level) {
        next.push(cells[i++]);
        continue;
      }
      let j = i;
      while (j < cells.length && cells[j].l >= level) j++;
      next.push(...cells.slice(i, j).reverse());
      i = j;
    }
    cells = next;
  }
  return cells.map(({ c, l }) => (l === 1 ? (MIRROR[c] ?? c) : c)).join('');
}

/**
 * מפרקת שורה מימין לשמאל ליחידות שאי אפשר לשבור, בסדר הקריאה. כל יחידה כבר בסדר החזותי שלה,
 * משמאל לימין, כמו ש-Satori מצייר. רווח בין מילים עבריות מפריד בין יחידות; רווח בתוך רצף לועזי
 * ("Full Stack") נשאר בתוך היחידה.
 */
export function rtlTokens(text: string): string[] {
  const chars = Array.from(text.trim().replace(/\s+/g, ' '));
  if (chars.length === 0) return [];
  const levels = levelsOf(chars);
  const tokens: string[] = [];
  let start = 0;
  for (let i = 0; i <= chars.length; i++) {
    const breakHere = i === chars.length || (chars[i] === ' ' && levels[i] === 1);
    if (!breakHere) continue;
    if (i > start) tokens.push(visual(chars.slice(start, i), levels.slice(start, i)));
    start = i + 1;
  }
  return tokens;
}

/** שורה אחת בלי שבירה, כמו שהיא נראית: היחידות מימין לשמאל. */
export function rtlLine(text: string): string {
  return rtlTokens(text).reverse().join(' ');
}
