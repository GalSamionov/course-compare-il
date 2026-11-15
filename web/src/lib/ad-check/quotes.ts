/**
 * בדיקת הציטוטים בקוד (מסמך העיצוב, "הזרימה", 8): ציטוט שהמודל החזיר נשאר רק אם הוא מופיע בטקסט של הדף.
 * ההשוואה אחרי נרמול של רווחים, מירכאות (״ "), גרש (׳ '), מקפים, ניקוד ואותיות גדולות. מה שמוצג למבקר הוא
 * הקטע מהדף עצמו, לא מה שהמודל כתב.
 *
 * כאן גם המיפוי מהפלט של המודל לתוצאה: דגל לא מוכר נזרק, ובכל סוג דגל נשארים עד 2 ציטוטים.
 */
import { AD_CLAIMS, AD_FLAGS, isAdFlag, type AdClaim, type AdFlag } from './flags';

export interface AdFlagFinding {
  flag: AdFlag;
  /** 1 עד 2 ציטוטים מהדף, כמו שהם בדף. */
  quotes: string[];
}

/** מה שנשמר במטמון ומוצג. בלי הטקסט של הדף. */
export interface AdCheckResult {
  /** מה הדף מבטיח: ציטוט מהדף, או "" כשאין. */
  claims: Record<AdClaim, string>;
  /** בסדר של המדריך. רק דגלים עם ציטוט שנמצא בדף. */
  flags: AdFlagFinding[];
}

export const MAX_QUOTES_PER_FLAG = 2;
/** ציטוט קצר מזה לא אומר כלום ("כן"), וארוך מזה הוא כבר לא ציטוט אלא פסקה. */
const MIN_QUOTE = 4;
const MAX_QUOTE = 300;

const QUOTES = new Set(['"', '“', '”', '„', '‟', '״', '″', '«', '»', '＂']);
const APOSTROPHES = new Set(["'", '‘', '’', '‚', '‛', '׳', '′', '`', '´', '＇']);
const DASHES = new Set(['-', '‐', '‑', '‒', '–', '—', '―', '−', '־', '－']);

export interface Normalized {
  text: string;
  norm: string;
  /** לכל תו ב-norm: איפה מתחיל ואיפה נגמר התו המקורי שממנו הוא בא. */
  from: number[];
  to: number[];
}

export function normalizeForMatch(text: string): Normalized {
  let norm = '';
  const from: number[] = [];
  const to: number[] = [];
  const emit = (out: string, start: number, end: number) => {
    for (let k = 0; k < out.length; k++) {
      from.push(start);
      to.push(end);
    }
    norm += out;
  };
  let i = 0;
  while (i < text.length) {
    const cp = text.codePointAt(i)!;
    const ch = String.fromCodePoint(cp);
    const end = i + ch.length;
    if (/[\p{Cf}\p{M}]/u.test(ch)) {
      // כיווניות, רוחב אפס, ניקוד וטעמים: לא נחשבים.
    } else if (/\s/u.test(ch)) {
      if (norm !== '' && !norm.endsWith(' ')) emit(' ', i, end);
    } else if (QUOTES.has(ch)) emit('"', i, end);
    else if (APOSTROPHES.has(ch)) emit("'", i, end);
    else if (DASHES.has(ch)) emit('-', i, end);
    else if (ch === '…') emit('...', i, end);
    else emit(ch.toLowerCase(), i, end);
    i = end;
  }
  if (norm.endsWith(' ')) {
    norm = norm.slice(0, -1);
    from.pop();
    to.pop();
  }
  return { text, norm, from, to };
}

/**
 * המודל מוסיף לפעמים מירכאות או שלוש נקודות מסביב לציטוט. מנסים קודם את הציטוט כמו שהוא (אולי המירכאות בדף),
 * אחר כך בלי שלוש הנקודות, ובסוף גם בלי המירכאות.
 */
function candidates(quote: string): string[] {
  const trimmed = quote.trim();
  const noDots = trimmed.replace(/^[\s.…]+|[\s.…]+$/gu, '');
  const bare = trimmed.replace(/^[\s"'“”„‟״″«»‘’‚‛׳.…]+|[\s"'“”„‟״″«»‘’‚‛׳.…]+$/gu, '');
  return [...new Set([trimmed, noDots, bare])];
}

/**
 * הקטע מהדף שהציטוט מצביע עליו, עם רווח אחד בין מילים. null: הציטוט לא בדף, קצר מדי או ארוך מדי.
 */
export function findQuote(quote: unknown, page: Normalized): string | null {
  if (typeof quote !== 'string') return null;
  for (const candidate of candidates(quote)) {
    const q = normalizeForMatch(candidate).norm;
    if (q.length < MIN_QUOTE || q.length > MAX_QUOTE) continue;
    const at = page.norm.indexOf(q);
    if (at === -1) continue;
    const original = page.text.slice(page.from[at], page.to[at + q.length - 1]);
    return original.replace(/[\p{Cf}]/gu, '').replace(/\s+/g, ' ').trim() || null;
  }
  return null;
}

/**
 * מהפלט של המודל לתוצאה. כל דבר שלא עומד בכללים נזרק בשקט: דגל לא מוכר, ציטוט שלא בדף, ציטוט שלישי
 * לאותו דגל, וציטוט כפול. דגל שלא נשאר לו אף ציטוט לא מוצג.
 */
export function mapModelOutput(raw: unknown, pageText: string): AdCheckResult {
  const page = normalizeForMatch(pageText);
  const input = (raw && typeof raw === 'object' ? raw : {}) as { claims?: unknown; flags?: unknown };
  const rawClaims = (input.claims && typeof input.claims === 'object' ? input.claims : {}) as Record<string, unknown>;

  const claims = Object.fromEntries(AD_CLAIMS.map((key) => [key, findQuote(rawClaims[key], page) ?? ''])) as Record<
    AdClaim,
    string
  >;

  const byFlag = new Map<AdFlag, string[]>();
  for (const item of Array.isArray(input.flags) ? input.flags : []) {
    if (!item || typeof item !== 'object') continue;
    const { flag, quote } = item as { flag?: unknown; quote?: unknown };
    if (!isAdFlag(flag)) continue;
    const found = findQuote(quote, page);
    if (!found) continue;
    const list = byFlag.get(flag) ?? [];
    const key = normalizeForMatch(found).norm;
    if (list.length >= MAX_QUOTES_PER_FLAG || list.some((q) => normalizeForMatch(q).norm === key)) continue;
    list.push(found);
    byFlag.set(flag, list);
  }

  const flags = AD_FLAGS.filter((flag) => byFlag.has(flag)).map((flag) => ({ flag, quotes: byFlag.get(flag)! }));
  return { claims, flags };
}

/**
 * תוצאה מהמטמון במסד. נכתבה על ידינו, אבל נבדקת שוב לפני שמציגים: צורה לא צפויה מחזירה null, והבדיקה רצה מחדש.
 */
export function parseStoredResult(value: unknown): AdCheckResult | null {
  if (!value || typeof value !== 'object') return null;
  const { claims, flags } = value as { claims?: unknown; flags?: unknown };
  if (!claims || typeof claims !== 'object' || !Array.isArray(flags)) return null;
  const c = claims as Record<string, unknown>;
  if (!AD_CLAIMS.every((key) => typeof c[key] === 'string')) return null;
  const parsed: AdFlagFinding[] = [];
  for (const item of flags) {
    const { flag, quotes } = (item ?? {}) as { flag?: unknown; quotes?: unknown };
    if (!isAdFlag(flag) || !Array.isArray(quotes)) return null;
    const list = quotes.filter((q): q is string => typeof q === 'string' && q !== '').slice(0, MAX_QUOTES_PER_FLAG);
    if (list.length > 0) parsed.push({ flag, quotes: list });
  }
  return {
    claims: Object.fromEntries(AD_CLAIMS.map((key) => [key, c[key] as string])) as Record<AdClaim, string>,
    flags: parsed,
  };
}
