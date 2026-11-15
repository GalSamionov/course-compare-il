import { safeHttpUrl } from '@/lib/safe-url';

/** שאילתה שנכשלה זורקת שגיאה, כדי שהבנייה תיכשל ולא תציג בשקט רשימה ריקה. */
export function queryError(what: string, error: { message: string }): Error {
  return new Error(`${what} query failed: ${error.message}`, { cause: error });
}

/** PostgREST מחזיר קשר "אחד" לפעמים כאובייקט ולפעמים כמערך. */
export function one<T>(ref: T | T[] | null): T | null {
  return Array.isArray(ref) ? (ref[0] ?? null) : ref;
}

/** עובדה שבדקנו בעצמנו על מרצה, עם קישור למקור. */
export interface VerifiedFact {
  text: string;
  sourceUrl: string;
}

/**
 * lecturers.verified_facts מהמסד. עובדה בלי טקסט או בלי קישור תקין למקור לא מוצגת:
 * ההבטחה היא שלכל עובדה שבדקנו יש מקור. עמוד הקורס ועמוד המרצה משתמשים בזה.
 */
export function verifiedFactsOf(raw: unknown): VerifiedFact[] {
  return (Array.isArray(raw) ? (raw as unknown[]) : []).flatMap((f) => {
    const fact = f as { text?: unknown; source_url?: unknown } | null;
    const sourceUrl = safeHttpUrl(fact?.source_url);
    return typeof fact?.text === 'string' && fact.text !== '' && sourceUrl ? [{ text: fact.text, sourceUrl }] : [];
  });
}
