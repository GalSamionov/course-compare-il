import { ADVISOR_LIMITS } from './types';

/**
 * כמה שאלות מותר לשאול את היועץ: ביום, לפי משתמש מחובר או לפי כתובת IP, ועוד הגבלה קצרה לדקה לפי IP.
 *
 * הספירה בזיכרון של התהליך, ולכן היא "בערך":
 * - ב-Vercel כל מופע של הפונקציה סופר לבד, ומופע חדש מתחיל מאפס. מבקר שהבקשות שלו מגיעות לכמה מופעים
 *   יכול לשאול יותר מהמגבלה.
 * - זו הגנה מפני לולאה ובוט פשוט, ומגבלה הוגנת לרוב המבקרים. היא לא הגנה מפני תוקף.
 * - הגבלה במסד, שמשותפת לכל המופעים, מגיעה בסבב ההשקה (notes-for-plan-2.md). היא לא יכולה להישען
 *   על SUPABASE_SECRET_KEY, כי הוא לא קיים ב-Vercel.
 */

const MINUTE_MS = 60_000;
const MAX_TRACKED = 5_000;

const israelDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem' });

/** "היום" לפי השעון בישראל, כמו "2026-11-14". השאלות מתחדשות בחצות. */
export function dayKey(now: number): string {
  return israelDate.format(now);
}

/** מי שואל: כתובת ה-IP תמיד, והמשתמש כשהוא מחובר. */
export interface Asker {
  ip: string;
  userId: string | null;
}

export type LimitResult =
  | { allowed: true; remaining: number }
  | { allowed: false; reason: 'too_fast' | 'limit'; remaining: number };

export interface AdvisorLimiter {
  /** סופר שאלה אחת, אם מותר. remaining: כמה נשארו היום אחריה. */
  take(asker: Asker, now?: number): LimitResult;
  /** מחזיר שאלה שלא נענתה, למשל כשהמודל נכשל. */
  giveBack(asker: Asker, now?: number): void;
}

/** הכנסה מחדש שומרת את ה-Map מסודר מהישן לחדש, וכך קל לזרוק את הישן כשהוא מתמלא. */
function remember<V>(map: Map<string, V>, key: string, value: V) {
  map.delete(key);
  map.set(key, value);
  if (map.size > MAX_TRACKED) {
    const oldest = map.keys().next().value;
    if (oldest !== undefined) map.delete(oldest);
  }
}

export function createAdvisorLimiter(
  limits: { visitorPerDay: number; userPerDay: number; perMinute: number } = ADVISOR_LIMITS,
): AdvisorLimiter {
  const lastMinute = new Map<string, number[]>();
  const today = new Map<string, { day: string; count: number }>();
  const keyOf = (asker: Asker) => (asker.userId ? `user:${asker.userId}` : `ip:${asker.ip}`);
  const limitOf = (asker: Asker) => (asker.userId ? limits.userPerDay : limits.visitorPerDay);
  const usedOn = (key: string, day: string) => {
    const entry = today.get(key);
    return entry && entry.day === day ? entry.count : 0;
  };

  return {
    take(asker, now = Date.now()) {
      const key = keyOf(asker);
      const day = dayKey(now);
      const limit = limitOf(asker);
      const used = usedOn(key, day);
      if (used >= limit) return { allowed: false, reason: 'limit', remaining: 0 };
      const recent = (lastMinute.get(asker.ip) ?? []).filter((t) => now - t < MINUTE_MS);
      if (recent.length >= limits.perMinute) return { allowed: false, reason: 'too_fast', remaining: limit - used };
      remember(lastMinute, asker.ip, [...recent, now]);
      remember(today, key, { day, count: used + 1 });
      return { allowed: true, remaining: limit - used - 1 };
    },
    giveBack(asker, now = Date.now()) {
      const key = keyOf(asker);
      const day = dayKey(now);
      const used = usedOn(key, day);
      if (used > 0) remember(today, key, { day, count: used - 1 });
    },
  };
}

/** המונה של המופע הזה. הנתיב משתמש בו, והבדיקות יוצרות מונה משלהן. */
export const advisorLimiter = createAdvisorLimiter();
