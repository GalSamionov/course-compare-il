import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/database.types';

/**
 * החיבור בדפדפן, עם המשתמש המחובר. ההתחברות נשמרת בעוגיות (ולא ב-localStorage), כדי שגם הנתיבים
 * בשרת יראו אותה. @supabase/ssr מחזיר את אותו חיבור בכל קריאה בדפדפן, ומרענן את ההתחברות בעצמו.
 */
export function createBrowserSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
  return createBrowserClient<Database>(url, key);
}
