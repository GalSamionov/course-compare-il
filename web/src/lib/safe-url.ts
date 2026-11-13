/** מחזיר את הכתובת רק אם היא מחרוזת http או https תקינה. אחרת null. */
export function safeHttpUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:' ? value : null;
  } catch {
    return null;
  }
}
