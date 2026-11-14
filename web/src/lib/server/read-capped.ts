/**
 * גוף הבקשה כטקסט, עד max בתים. null: גדול מדי.
 * request.text() קורא את כל הגוף לזיכרון לפני שאפשר לבדוק את הגודל. כאן:
 * - content-length גדול מ-max נדחה בלי לקרוא כלום;
 * - בלי content-length (או עם ערך שקרי), הגוף נקרא בחלקים, והקריאה מבוטלת ברגע שעוברים את max.
 */
export async function readCapped(request: Request, max: number): Promise<string | null> {
  const declared = Number(request.headers.get('content-length') ?? Number.NaN);
  if (Number.isFinite(declared) && declared > max) return null;
  if (!request.body) return '';

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > max) {
      // השאר לא נקרא בכלל.
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}
