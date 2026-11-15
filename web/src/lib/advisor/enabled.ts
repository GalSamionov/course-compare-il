import 'server-only';

/**
 * האם להציג את השורה "לשאול על הקורסים האלה".
 * דף הבית סטטי, ולכן זה נקבע בזמן הבנייה, לפי הסביבה של השרת שבונה. מפתח שנוסף ב-Vercel
 * נכנס לתוקף רק בפריסה הבאה. הנתיב /api/advise בודק שוב בכל בקשה, ובלי מפתח מחזיר 503.
 */
export function advisorEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}
