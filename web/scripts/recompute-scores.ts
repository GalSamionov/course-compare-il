import { createClient } from '@supabase/supabase-js';
import { requestRevalidation, revalidateTarget } from '../src/lib/cache/revalidate-client';
import type { Database } from '../src/lib/database.types';
import { recomputeAllScores } from '../src/lib/score/recompute';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY');
const db = createClient<Database>(url, secret, { auth: { persistSession: false } });

/**
 * `pnpm score:recompute`: כל הציונים מחדש. הלוגיקה ב-src/lib/score/recompute.ts, משותפת לשרת.
 * בסוף: רענון מיידי של הקטלוג, של המספרים ושל כל עמוד קורס שחושב, דרך /api/revalidate (סבב 5, פריט 36).
 * בלי REVALIDATE_TOKEN או REVALIDATE_URL: מדלג על הרענון, והדפים מתרעננים לבד תוך שעה (cacheLife('hours')).
 * רענון שנכשל: יציאה עם 1, אחרי שהציונים כבר נשמרו. ביומן רק השרת והמספרים, אף פעם לא הטוקן.
 */
async function main() {
  console.log(`target: ${new URL(url!).host}`);
  const { lines, slugs, failures } = await recomputeAllScores(db, new Date());
  for (const line of lines) console.log(line);
  for (const { slug, error } of failures) console.error(`${slug}: failed`, error);

  let failed = failures.length > 0;
  const target = revalidateTarget(process.env);
  if (target.kind === 'skip') {
    console.log(`skip revalidate: ${target.reason}`);
  } else {
    try {
      const requests = await requestRevalidation(slugs, target);
      console.log(
        `revalidated the catalog and ${slugs.length} course page(s) on ${new URL(target.endpoint).host}, in ${requests} request(s)`,
      );
    } catch (error) {
      console.error(error instanceof Error ? error.message : 'revalidate failed');
      failed = true;
    }
  }

  if (failures.length > 0) console.error(`${failures.length} course(s) failed`);
  if (failed) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
