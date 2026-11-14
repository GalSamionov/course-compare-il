/**
 * הגבלה פשוטה לפי כתובת IP, בזיכרון של התהליך.
 * ב-Vercel כל מופע של הפונקציה מחזיק זיכרון משלו, ומופע חדש מתחיל מאפס. זו הגנה מפני לולאה
 * או בוט פשוט, לא מפני תוקף. הגבלה במסד, גם ליועץ, מגיעה בסבב ההשקה (notes-for-plan-2.md).
 */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;
const MAX_TRACKED = 5_000;

const seen = new Map<string, number[]>();

export function allowRequest(ip: string, now: number = Date.now()): boolean {
  const recent = (seen.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  const allowed = recent.length < MAX_PER_WINDOW;
  if (allowed) recent.push(now);
  // הכנסה מחדש שומרת את ה-Map מסודר מהישן לחדש, וכך קל לזרוק את הישן כשהוא מתמלא.
  seen.delete(ip);
  seen.set(ip, recent);
  if (seen.size > MAX_TRACKED) {
    const oldest = seen.keys().next().value;
    if (oldest !== undefined) seen.delete(oldest);
  }
  return allowed;
}
