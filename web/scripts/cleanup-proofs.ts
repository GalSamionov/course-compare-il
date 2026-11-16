import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/lib/database.types';
import { cleanupProofs } from '../src/lib/reviews/cleanup';

/**
 * `pnpm proofs:cleanup`: פעם ביום ב-GitHub Actions (.github/workflows/cleanup.yml), עם המפתח הסודי.
 * בלי המפתח: מדלג בהודעה, בלי כישלון. מקומית הוא קורא את web/.env.local.
 * ביומן רק הכתובת של השרת והמספרים. אף פעם לא המפתח.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;

async function main() {
  if (!url || !secret) {
    console.log('skip: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY is missing');
    return;
  }
  const db = createClient<Database>(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  console.log(`target: ${new URL(url).host}`);
  const result = await cleanupProofs(db, new Date());
  console.log(
    `reviews deleted: ${result.reviewsDeleted}, files deleted: ${result.filesDeleted}, check usage rows deleted: ${result.checkUsageDeleted}, ` +
      `institution request emails deleted: ${result.requestEmailsDeleted ?? 'skipped (no purge_institution_requests yet)'}, ` +
      `company requests deleted: ${result.companyRequestsDeleted ?? 'skipped (no purge_company_requests yet)'}, ` +
      `report details deleted: ${result.reportDetailsDeleted ?? 'skipped (no purge_reports yet)'}, ` +
      `course request notes deleted: ${result.courseRequestNotesDeleted ?? 'skipped (no purge_course_submissions yet)'}, ` +
      `ad check results deleted: ${result.adChecksDeleted ?? 'skipped (no purge_ad_checks yet)'}`,
  );
  for (const failure of result.failures) console.error(failure);
  if (result.failures.length > 0) process.exit(1);
}

main().catch((error: unknown) => {
  // רק ההודעה: אובייקט שגיאה של הלקוח יכול לכלול את הבקשה.
  console.error('cleanup failed:', error instanceof Error ? error.message : (error as { message?: string })?.message ?? 'unknown error');
  process.exit(1);
});
