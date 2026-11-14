import { createBrowserSupabase } from '@/lib/supabase/browser-client';
import { isUuid } from './types';

/** מזהה אקראי של הדפדפן. רק טביעה שלו נשמרת בשרת (toggle_helpful). */
const BROWSER_KEY = 'browser-id:v1';
/** על אילו ביקורות לחצו "עזר לי" בדפדפן הזה. */
const HELPFUL_KEY = 'helpful:v1';
/** אילו ביקורות כבר נספרו כנקראו בדפדפן הזה. */
const READ_KEY = 'read:v1';
/** כמה מזהים זוכרים, כדי שהאחסון לא יגדל בלי סוף. */
const MAX_REMEMBERED = 500;

const listeners = new Set<() => void>();

function read(key: string): string {
  try {
    return window.localStorage.getItem(key) ?? '';
  } catch {
    return '';
  }
}

function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // גלישה פרטית או אחסון חסום: נספר שוב בביקור הבא, וזה בסדר.
  }
}

export function parseIds(raw: string): string[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

/** UUID v4 באותיות קטנות, כמו שהמסד בודק. randomUUID חסר בדפדפנים ישנים, ואז בונים אותו מ-getRandomValues. */
function newBrowserId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function browserId(): string {
  let id = read(BROWSER_KEY);
  if (!isUuid(id)) {
    id = newBrowserId();
    write(BROWSER_KEY, id);
  }
  return id;
}

/** ל-useSyncExternalStore: מה שסומן בדפדפן הזה, גם מלשונית אחרת. */
export function subscribeHelpful(listener: () => void) {
  listeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

export const helpfulSnapshot = () => read(HELPFUL_KEY);

/** לחיצה ראשונה מוסיפה, שנייה מבטלת. null: לא הצלחנו, ושום דבר לא השתנה. */
export async function toggleHelpful(reviewId: string): Promise<{ helpful: boolean; total: number } | null> {
  try {
    const { data, error } = await createBrowserSupabase().rpc('toggle_helpful', {
      p_review_id: reviewId,
      p_browser_id: browserId(),
    });
    const row = data?.[0];
    if (error || !row) return null;
    const marked = new Set(parseIds(read(HELPFUL_KEY)));
    if (row.is_helpful) marked.add(reviewId);
    else marked.delete(reviewId);
    write(HELPFUL_KEY, JSON.stringify([...marked].slice(-MAX_REMEMBERED)));
    for (const listener of listeners) listener();
    return { helpful: row.is_helpful, total: row.total };
  } catch {
    return null;
  }
}

export function wasRead(reviewId: string): boolean {
  return parseIds(read(READ_KEY)).includes(reviewId);
}

/** קריאה נספרת פעם אחת לכל דפדפן. המספר גלוי רק לכותב, ב"הביקורות שלי". */
export async function countRead(reviewId: string): Promise<void> {
  if (wasRead(reviewId)) return;
  write(READ_KEY, JSON.stringify([...parseIds(read(READ_KEY)), reviewId].slice(-MAX_REMEMBERED)));
  try {
    await createBrowserSupabase().rpc('count_review_read', { p_review_id: reviewId });
  } catch {
    // קריאה שלא נספרה היא לא שגיאה שהקורא צריך לראות.
  }
}
