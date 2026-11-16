/**
 * מ-HTML לטקסט שהמודל קורא, ושמולו נבדקים הציטוטים (quotes.ts): הכותרת, ה-meta description, תגיות og,
 * JSON-LD, והטקסט הגלוי בלי script ו-style. עד 30,000 תווים (מסמך העיצוב, "הזרימה", 6).
 * בלי ספרייה ובלי DOM: דף נחיתה הוא טקסט, וכל מה שלא טקסט נזרק.
 */

export const MAX_PAGE_CHARS = 30_000;

const NAMED: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  laquo: '«',
  raquo: '»',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  bdquo: '„',
  middot: '·',
  bull: '•',
  times: '×',
  copy: '©',
  reg: '®',
  trade: '™',
  euro: '€',
  shy: '',
  zwj: '',
  zwnj: '',
  lrm: '',
  rlm: '',
};

export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, body: string) => {
    if (body[0] === '#') {
      const code = body[1] === 'x' || body[1] === 'X' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) return '';
      return String.fromCodePoint(code);
    }
    const named = NAMED[body.toLowerCase()];
    return named ?? whole;
  });
}

/** הערך של תכונה בתגית אחת, למשל content ב-<meta>. */
function attr(tag: string, name: string): string | null {
  const match = tag.match(new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  if (!match) return null;
  return decodeEntities(match[2] ?? match[3] ?? match[4] ?? '');
}

/** שורה אחת: רווחים ברצף לרווח אחד, ובלי תווים בלתי נראים (כיווניות, רוחב אפס). */
function oneLine(text: string): string {
  return text.replace(/\p{Cf}/gu, '').replace(/\s+/g, ' ').trim();
}

/** ערכי טקסט מ-JSON-LD: שם, תיאור, מחיר וכו'. בלי מפתחות של @ ובלי כתובות. */
function jsonLdStrings(value: unknown, out: string[], depth = 0): void {
  if (depth > 8 || out.length > 200) return;
  if (typeof value === 'string') {
    const text = oneLine(decodeEntities(value.replace(/<[^>]*>/g, ' ')));
    if (text && !/^https?:\/\//i.test(text)) out.push(text);
  } else if (typeof value === 'number') {
    out.push(String(value));
  } else if (Array.isArray(value)) {
    for (const item of value) jsonLdStrings(item, out, depth + 1);
  } else if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      if (key.startsWith('@') || /^(url|image|logo|sameAs|contentUrl|thumbnailUrl|embedUrl)$/i.test(key)) continue;
      jsonLdStrings(item, out, depth + 1);
    }
  }
}

const BLOCK_TAGS =
  'address|article|aside|blockquote|br|button|dd|details|dialog|div|dl|dt|fieldset|figcaption|figure|footer|form|h[1-6]|header|hr|li|main|nav|ol|option|p|pre|section|summary|table|tbody|td|tfoot|th|thead|tr|ul';

export interface ExtractedPage {
  title: string;
  /** כל הטקסט, כפי שהמודל רואה אותו. הציטוטים נבדקים מולו. */
  text: string;
}

/**
 * הטקסט של הדף, בסדר: כותרת, תיאורים (meta ו-og), JSON-LD, ואז הטקסט הגלוי. שורה לכל בלוק, בלי שורות כפולות
 * ברצף. נחתך ב-30,000 תווים.
 */
export function extractPageText(html: string): ExtractedPage {
  // הערות קודם: בתוכן שלהן יכולות להיות תגיות.
  let source = html.replace(/<!--[\s\S]*?-->/g, ' ');

  const titleMatch = source.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? oneLine(decodeEntities(titleMatch[1].replace(/<[^>]*>/g, ' '))) : '';

  const meta: string[] = [];
  for (const tag of source.match(/<meta\b[^>]*>/gi) ?? []) {
    const key = (attr(tag, 'name') ?? attr(tag, 'property') ?? '').toLowerCase();
    if (!/^(description|og:title|og:description|twitter:title|twitter:description)$/.test(key)) continue;
    const content = oneLine(attr(tag, 'content') ?? '');
    if (content && content !== title && !meta.includes(content)) meta.push(content);
  }

  const jsonLd: string[] = [];
  for (const match of source.matchAll(/<script\b[^>]*type\s*=\s*["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      jsonLdStrings(JSON.parse(match[1]), jsonLd);
    } catch {
      // JSON-LD שבור: מדלגים.
    }
  }

  source = source
    .replace(/<head\b[\s\S]*?<\/head>/i, ' ')
    .replace(/<(script|style|noscript|template|svg|iframe|object|canvas|select)\b[\s\S]*?<\/\1\s*>/gi, ' ')
    .replace(new RegExp(`<\\/?(?:${BLOCK_TAGS})\\b[^>]*>`, 'gi'), '\n')
    .replace(/<[^>]*>/g, ' ');

  const lines: string[] = [];
  for (const raw of decodeEntities(source).split('\n')) {
    const line = oneLine(raw);
    if (line && line !== lines[lines.length - 1]) lines.push(line);
  }

  const seen = new Set<string>();
  const parts = [title, ...meta, ...jsonLd, ...lines].filter((part) => {
    if (!part || seen.has(part)) return false;
    seen.add(part);
    return true;
  });
  let text = parts.join('\n');
  // בלי חצי של תו (אימוג'י) בסוף החיתוך.
  if (text.length > MAX_PAGE_CHARS) text = text.slice(0, MAX_PAGE_CHARS).replace(/[\uD800-\uDBFF]$/, '');
  return { title, text };
}
