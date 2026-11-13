import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

/**
 * חיבור עם המפתח הסודי, שעוקף את כל ההרשאות. משמש רק את נתיב מחיקת החשבון.
 * 'server-only': בנייה שמכניסה את הקובץ לקוד של הדפדפן נכשלת.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY');
  return createClient<Database>(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
}
