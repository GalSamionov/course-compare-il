import { queryError } from '@/lib/data/shared';
import { createPublicClient } from '@/lib/supabase/public-client';
import { isBadgeToken, type Badge } from './badge';

/**
 * הכרטיס לפי הטוקן, עם המפתח הציבורי (review_badge). בלי מטמון בכוונה: כשהכותב מפסיק לשתף, מוחק את הביקורת
 * או מכבה את השם, הבקשה הבאה כבר רואה את זה. null: אין כרטיס כזה, או שהביקורת כבר לא מוצגת באתר.
 */
export async function loadBadge(token: string): Promise<Badge | null> {
  if (!isBadgeToken(token)) return null;
  const { data, error } = await createPublicClient().rpc('review_badge', { p_token: token });
  if (error) throw queryError('badge', error);
  const row = data?.[0];
  if (!row) return null;
  return {
    courseSlug: row.course_slug,
    courseTitle: row.course_title,
    institutionName: row.institution_name,
    // `?? null`: הטיפוסים שנוצרים מסמנים את שתי העמודות כלא-null, אבל המסד מחזיר בהן null כשאין שם.
    shownName: row.shown_name ?? null,
    shownTitle: row.shown_title ?? null,
  };
}
