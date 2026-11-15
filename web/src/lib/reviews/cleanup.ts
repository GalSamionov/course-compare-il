import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../database.types';
import { removeProofFiles } from './files';

/** טיוטה או ביקורת ממתינה שלא אומתה תוך 30 יום נמחקת, עם הקבצים (מסמך העיצוב, סעיף 4, ומדיניות הפרטיות). */
export const STALE_DAYS = 30;
/** קובץ שהועלה ולא נשלח, למשל כי הכותב החליף אותו, נמחק אחרי יום. */
export const ORPHAN_HOURS = 24;
/** מכסת הבדיקות של מודל השפה סופרת יממה אחורה (take_proof_checks). שורה בת יומיים כבר לא נספרת. */
export const CHECK_USAGE_KEEP_HOURS = 48;
/** כמה ביקורות בהרצה אחת. השאר בהרצה של מחר. */
const STALE_BATCH = 1000;

export interface CleanupResult {
  reviewsDeleted: number;
  filesDeleted: number;
  checkUsageDeleted: number;
  /** מיילים של בקשות ממוסדות שנמחקו (90 יום אחרי ההחלטה). null: הפונקציה עוד לא במסד הזה. */
  requestEmailsDeleted: number | null;
  failures: string[];
}

const hoursAgo = (now: Date, hours: number) => new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();

/**
 * 1. ביקורות שלא אומתו (טיוטה או ממתינה): שנוצרו לפני יותר מ-30 יום, או של חשבון שנמחק.
 *    delete_review() מוחקת אותן ומשאירה רק טביעה. הקבצים שלהן נשארים בלי הוכחה שמצביעה עליהם.
 * 2. כל קובץ בתיקיית ההוכחות שאף הוכחה פתוחה לא מצביעה עליו, ושהועלה לפני יותר מיום. גם הקבצים משלב 1.
 *    קובץ של הוכחה שממתינה לגל לא נמחק כאן: proof_orphans מדלגת על כל נתיב שיש לו שורה ב-proofs.
 * 3. שורות של מכסת הבדיקות בנות יותר מיומיים.
 * 4. בקשות ממוסדות (/institutions/join): המייל 90 יום אחרי ההחלטה, והטביעה של ה-IP אחרי יומיים
 *    (purge_institution_requests, ומדיניות הפרטיות).
 * המחיקה מהאחסון דרך ה-API של Storage בלבד (protect_delete חוסם מחיקה ב-SQL).
 */
export async function cleanupProofs(db: SupabaseClient<Database>, now: Date): Promise<CleanupResult> {
  const failures: string[] = [];
  const cutoff = hoursAgo(now, STALE_DAYS * 24);

  const { data: stale, error } = await db
    .from('reviews')
    .select('id')
    .in('status', ['draft', 'pending'])
    .or(`created_at.lt."${cutoff}",author_id.is.null`)
    .order('created_at')
    .limit(STALE_BATCH);
  if (error) throw error;

  let reviewsDeleted = 0;
  for (const { id } of stale) {
    const { error: deleteError } = await db.rpc('delete_review', { p_review_id: id, p_action: 'cleanup_delete' });
    // רק המזהה וההודעה: בלי תוכן הביקורת.
    if (deleteError) failures.push(`review ${id}: ${deleteError.message}`);
    else reviewsDeleted += 1;
  }

  const { data: orphans, error: orphanError } = await db.rpc('proof_orphans', { p_age_hours: ORPHAN_HOURS });
  if (orphanError) throw orphanError;
  const filesDeleted = await removeProofFiles(db, orphans ?? []);

  const { count, error: usageError } = await db
    .from('proof_check_usage')
    .delete({ count: 'exact' })
    .lt('created_at', hoursAgo(now, CHECK_USAGE_KEEP_HOURS));
  if (usageError) failures.push(`proof_check_usage: ${usageError.message}`);

  // מסד שהמיגרציה של תוכנית 5ב עוד לא עלתה אליו: אין מה לנקות, וזה לא כישלון.
  let requestEmailsDeleted: number | null = null;
  const { data: purged, error: purgeError } = await db.rpc('purge_institution_requests');
  if (purgeError && purgeError.code !== 'PGRST202') failures.push(`institution_requests: ${purgeError.message}`);
  else if (!purgeError) requestEmailsDeleted = purged ?? 0;

  return { reviewsDeleted, filesDeleted, checkUsageDeleted: count ?? 0, requestEmailsDeleted, failures };
}
