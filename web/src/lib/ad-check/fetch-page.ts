import 'server-only';
import { Agent, fetch } from 'undici';
import { SITE_URL } from '@/lib/site';
import { checkTarget, guardedLookup } from './url-guard';

/** מסמך העיצוב, "הזרימה", 5: בקשת GET אחת, עד 3 הפניות, 8 שניות, עד 1.5MB, ורק text/html. */
export const FETCH_TIMEOUT_MS = 8_000;
export const MAX_REDIRECTS = 3;
export const MAX_PAGE_BYTES = 1_500_000;

/**
 * Agent משלנו: כל חיבור עובר דרך guardedLookup, שדוחה כתובת פרטית בזמן החיבור עצמו. בלי proxy מהסביבה.
 * maxResponseSize עוצר גם בצד של undici, לפני הפענוח של gzip; הספירה למטה עוצרת אחרי הפענוח.
 */
const agent = new Agent({
  connect: { lookup: guardedLookup, timeout: FETCH_TIMEOUT_MS },
  headersTimeout: FETCH_TIMEOUT_MS,
  bodyTimeout: FETCH_TIMEOUT_MS,
  maxResponseSize: MAX_PAGE_BYTES,
});

export type FetchProblem = 'blocked' | 'social' | 'status' | 'type' | 'size' | 'redirects' | 'network';
export type FetchedPage = { ok: true; url: string; html: string } | { ok: false; problem: FetchProblem };

/** הקידוד מה-Content-Type, או מ-<meta charset> בתחילת הדף. אתרים ישנים בעברית עוד ב-windows-1255. */
function decode(bytes: Uint8Array, contentType: string): string {
  const fromHeader = contentType.match(/charset\s*=\s*["']?([\w-]+)/i)?.[1];
  const head = new TextDecoder('latin1').decode(bytes.subarray(0, 4096));
  const fromMeta = head.match(/<meta[^>]+charset\s*=\s*["']?([\w-]+)/i)?.[1];
  for (const label of [fromHeader, fromMeta, 'utf-8']) {
    if (!label) continue;
    try {
      return new TextDecoder(label).decode(bytes);
    } catch {
      // קידוד לא מוכר: הבא בתור.
    }
  }
  return new TextDecoder().decode(bytes);
}

/**
 * קורא דף אחד. כל הפניה נבדקת מחדש (checkTarget), ואם היא מובילה לרשת חברתית, הדף לא נקרא.
 * לא זורקת: כל תקלה חוזרת כ-problem, והמבקר מקבל "לא הצלחנו לקרוא את הדף".
 */
export async function fetchPage(href: string): Promise<FetchedPage> {
  const signal = AbortSignal.timeout(FETCH_TIMEOUT_MS);
  let current = href;
  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const target = checkTarget(current);
      if (!target.ok) return { ok: false, problem: target.problem === 'social' ? 'social' : 'blocked' };

      const response = await fetch(target.url, {
        dispatcher: agent,
        redirect: 'manual',
        signal,
        headers: {
          accept: 'text/html,application/xhtml+xml;q=0.9',
          'accept-language': 'he,en;q=0.8',
          'user-agent': `Mozilla/5.0 (compatible; LamadtiAdCheck/1.0; +${SITE_URL}/request-course)`,
        },
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        await response.body?.cancel();
        if (!location) return { ok: false, problem: 'status' };
        current = new URL(location, target.url).href;
        continue;
      }
      if (!response.ok) {
        await response.body?.cancel();
        return { ok: false, problem: 'status' };
      }
      const type = response.headers.get('content-type') ?? '';
      if (!/^\s*text\/html\b/i.test(type)) {
        await response.body?.cancel();
        return { ok: false, problem: 'type' };
      }
      const declared = Number(response.headers.get('content-length'));
      if (Number.isFinite(declared) && declared > MAX_PAGE_BYTES) {
        await response.body?.cancel();
        return { ok: false, problem: 'size' };
      }

      const chunks: Uint8Array[] = [];
      let size = 0;
      const reader = response.body?.getReader();
      if (!reader) return { ok: false, problem: 'status' };
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > MAX_PAGE_BYTES) {
          await reader.cancel();
          return { ok: false, problem: 'size' };
        }
        chunks.push(value);
      }
      const bytes = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
      }
      return { ok: true, url: target.url.href, html: decode(bytes, type) };
    }
    return { ok: false, problem: 'redirects' };
  } catch {
    // זמן קצוב, כתובת חסומה בזמן החיבור (EADDRBLOCKED), DNS, TLS: אותה תשובה למבקר.
    return { ok: false, problem: 'network' };
  }
}
