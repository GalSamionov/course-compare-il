/** שאילתה שנכשלה זורקת שגיאה, כדי שהבנייה תיכשל ולא תציג בשקט רשימה ריקה. */
export function queryError(what: string, error: { message: string }): Error {
  return new Error(`${what} query failed: ${error.message}`, { cause: error });
}

/** PostgREST מחזיר קשר "אחד" לפעמים כאובייקט ולפעמים כמערך. */
export function one<T>(ref: T | T[] | null): T | null {
  return Array.isArray(ref) ? (ref[0] ?? null) : ref;
}
