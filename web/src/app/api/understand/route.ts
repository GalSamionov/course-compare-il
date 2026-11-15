import { getCatalog } from '@/lib/data/catalog';
import { MAX_Q_LENGTH } from '@/lib/search/query';
import { allowRequest } from '@/lib/understand/rate-limit';
import { understand } from '@/lib/understand/understand';

/** גוף הבקשה כולו: מספיק ל-{ text } עם מרווח, ולא יותר. */
const MAX_BODY_CHARS = 1_000;

/** מקבל { text } ומחזיר תחומים וסינון מובנה. אף פעם לא טקסט חופשי. */
export async function POST(request: Request) {
  // ב-Vercel הכתובת הראשונה ב-x-forwarded-for היא של המבקר.
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (!allowRequest(ip)) return Response.json({ error: 'rate_limited' }, { status: 429 });

  let text: unknown;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_CHARS) return Response.json({ error: 'bad_text' }, { status: 400 });
    text = (JSON.parse(raw) as { text?: unknown } | null)?.text;
  } catch {
    return Response.json({ error: 'bad_json' }, { status: 400 });
  }
  if (typeof text !== 'string' || text.trim() === '' || text.length > MAX_Q_LENGTH) {
    return Response.json({ error: 'bad_text' }, { status: 400 });
  }

  const { categories } = await getCatalog();
  const options = categories.filter((c) => c.courseCount > 0).map(({ slug, name }) => ({ slug, name }));
  return Response.json(await understand(text.trim(), options));
}
