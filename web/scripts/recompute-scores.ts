import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/lib/database.types';
import { recomputeAllScores } from '../src/lib/score/recompute';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY');
const db = createClient<Database>(url, secret, { auth: { persistSession: false } });

/** `pnpm score:recompute`: כל הציונים מחדש. הלוגיקה ב-src/lib/score/recompute.ts, משותפת לשרת. */
async function main() {
  console.log(`target: ${new URL(url!).host}`);
  const { lines, failures } = await recomputeAllScores(db, new Date());
  for (const line of lines) console.log(line);
  for (const { slug, error } of failures) console.error(`${slug}: failed`, error);
  if (failures.length > 0) {
    console.error(`${failures.length} course(s) failed`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
