import { revalidateTag } from 'next/cache';
import { MAX_REVALIDATE_BODY, MIN_TOKEN_LENGTH, bearerToken, tagsFromBody, tokenMatches } from '@/lib/cache/revalidate';
import { readCapped } from '@/lib/server/read-capped';

/**
 * POST /api/revalidate, עם "Authorization: Bearer <REVALIDATE_TOKEN>" ו-{ "courses": [slug, ...] }, עד 500.
 * מרענן מיד את הקטלוג, את מספרי השקיפות ואת העמוד של כל קורס ברשימה (סבב 5, פריט 36).
 * הסקריפט של חישוב הציונים קורא לו בסוף (web/scripts/recompute-scores.ts), גם בחישוב הלילי ב-GitHub Actions.
 * לא נקרא מדפדפן: הטוקן בכותרת ולא בעוגייה, ולכן אין כאן CSRF.
 * { expire: 0 }: הבקשה הבאה לעמוד מחכה לנתונים החדשים. מחוץ ל-Server Action אין updateTag (revalidateTag.md).
 * בלי טוקן בשרת, או קצר מ-32 תווים: 503, והנתיב סגור. טוקן שגוי: 401, בלי לומר מה לא נכון.
 * הטוקן נבדק לפני שקוראים את הגוף. אף שורה כאן לא מדפיסה אותו.
 */
export async function POST(request: Request) {
  const expected = process.env.REVALIDATE_TOKEN ?? '';
  if (expected.length < MIN_TOKEN_LENGTH) return Response.json({ error: 'not_configured' }, { status: 503 });
  if (!tokenMatches(bearerToken(request.headers.get('authorization')), expected)) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  const raw = await readCapped(request, MAX_REVALIDATE_BODY);
  const tags = raw === null ? null : tagsFromBody(raw);
  if (!tags) return Response.json({ error: 'bad_request' }, { status: 400 });

  for (const tag of tags) revalidateTag(tag, { expire: 0 });
  return Response.json({ ok: true, tags: tags.length });
}
