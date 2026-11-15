import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

/** חיבור עם המפתח הציבורי. רואה רק מה שההרשאות מתירות. */
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
  return createClient<Database>(url, key, {
    auth: { persistSession: false },
    // 'use cache' הוא שכבת המטמון היחידה. בלי no-store, `next build` משתמש שוב במטמון ה-fetch של Next
    // שנשמר בדיסק (כ-15 דקות), ובנייה אחרי שינוי במסד מציגה נתונים ישנים.
    global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) },
  });
}
