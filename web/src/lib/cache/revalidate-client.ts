import { MAX_COURSES_PER_REQUEST } from './revalidate';

/** לאן לשלוח את הרענון, או למה לדלג. */
export type RevalidateTarget = { kind: 'skip'; reason: string } | { kind: 'send'; endpoint: string; token: string };

const isLocalHost = (host: string) => host === 'localhost' || host === '127.0.0.1';
const hostOf = (url: string | undefined): string | null => {
  try {
    return url ? new URL(url).hostname : null;
  } catch {
    return null;
  }
};

/**
 * מהסביבה של הסקריפט (process.env). בלי REVALIDATE_TOKEN או REVALIDATE_URL: מדלגים. כך מקומית, וב-GitHub עד
 * שגל מוסיף את הסוד. מסד מקומי אף פעם לא מרענן את האתר באוויר, ולהפך. באוויר רק https.
 */
export function revalidateTarget(env: Record<string, string | undefined>): RevalidateTarget {
  const token = env.REVALIDATE_TOKEN?.trim();
  const base = env.REVALIDATE_URL?.trim();
  if (!token) return { kind: 'skip', reason: 'REVALIDATE_TOKEN is not set' };
  if (!base) return { kind: 'skip', reason: 'REVALIDATE_URL is not set' };
  let endpoint: URL;
  try {
    endpoint = new URL('/api/revalidate', base);
  } catch {
    return { kind: 'skip', reason: 'REVALIDATE_URL is not a URL' };
  }
  const siteIsLocal = isLocalHost(endpoint.hostname);
  if (endpoint.protocol !== 'https:' && !siteIsLocal) return { kind: 'skip', reason: 'REVALIDATE_URL must use https' };
  const dbHost = hostOf(env.NEXT_PUBLIC_SUPABASE_URL);
  if (dbHost !== null && isLocalHost(dbHost) !== siteIsLocal) {
    return { kind: 'skip', reason: 'the database and the site are different environments' };
  }
  return { kind: 'send', endpoint: endpoint.href, token };
}

/**
 * שולח את כל הכתובות, בחלקים של 500, ומחזיר כמה בקשות נשלחו. גם רשימה ריקה שולחת בקשה אחת: הקטלוג
 * והמספרים מתרעננים. שגיאה: רק הסטטוס. אף פעם לא הטוקן, ולא גוף התשובה.
 */
export async function requestRevalidation(
  slugs: readonly string[],
  target: Extract<RevalidateTarget, { kind: 'send' }>,
  fetchImpl: typeof fetch = fetch,
): Promise<number> {
  const chunks: string[][] = [];
  for (let i = 0; i < slugs.length; i += MAX_COURSES_PER_REQUEST) chunks.push(slugs.slice(i, i + MAX_COURSES_PER_REQUEST));
  if (chunks.length === 0) chunks.push([]);
  for (const courses of chunks) {
    const response = await fetchImpl(target.endpoint, {
      method: 'POST',
      headers: { authorization: `Bearer ${target.token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ courses }),
    });
    if (!response.ok) throw new Error(`revalidate failed with status ${response.status}`);
  }
  return chunks.length;
}
