import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/database.types';

/**
 * החיבור בשרת, עם המשתמש מהעוגיות של הבקשה. חיבור חדש לכל בקשה, כמו שכתוב ב-createServerClient.
 * - בנתיבים (Route Handlers) וב-Server Actions מותר לכתוב עוגיות (cookies.md), ולכן רענון ההתחברות נשמר.
 * - readOnly: לרכיב שרת, שבו כתיבת עוגייה זורקת שגיאה. היום רק עמוד התור (/admin), וה-proxy שלו כבר
 *   רענן את ההתחברות וכתב את העוגיות לפני שהעמוד רץ (web/src/proxy.ts).
 */
export async function createServerSupabase({ readOnly = false }: { readOnly?: boolean } = {}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
  const cookieStore = await cookies();
  return createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        if (readOnly) return;
        for (const { name, value, options } of toSet) cookieStore.set(name, value, options);
      },
    },
  });
}
