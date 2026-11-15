import { createBrowserSupabase } from '@/lib/supabase/browser-client';

/** קישור "בוגר מאומת" של ביקורת שלי (my_review_badges). */
export interface MyBadge {
  reviewId: string;
  token: string;
  showName: boolean;
}

export async function loadMyBadges(): Promise<MyBadge[]> {
  const { data, error } = await createBrowserSupabase().rpc('my_review_badges');
  if (error) throw error;
  return (data ?? []).map((row) => ({ reviewId: row.review_id, token: row.token, showName: row.show_name }));
}

/**
 * יוצר קישור לביקורת שפורסמה, או משנה אם השם מופיע בו. מחזיר את הטוקן, או null כשהמסד סירב
 * (הביקורת לא שלי, או שהיא כבר לא מוצגת באתר).
 */
export async function shareBadge(reviewId: string, showName: boolean): Promise<string | null> {
  const { data, error } = await createBrowserSupabase().rpc('share_review_badge', {
    p_review_id: reviewId,
    p_show_name: showName,
  });
  return error || typeof data !== 'string' ? null : data;
}

/** מפסיק לשתף: הקישור מפסיק לעבוד מיד. */
export async function unshareBadge(reviewId: string): Promise<boolean> {
  const { data, error } = await createBrowserSupabase().rpc('unshare_review_badge', { p_review_id: reviewId });
  return !error && data === true;
}
