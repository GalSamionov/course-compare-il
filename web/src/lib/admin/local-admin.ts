import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../database.types';

/**
 * מנהל רק מול Supabase המקומי. קבצי ה-seed עולים לענן (db push --include-seed), ולכן אין שם מנהל.
 * בענן, גל מאשר את ההוספה של החשבון שלו בעצמו (תוכנית 3, משימה 14).
 */
export function isLocalSupabase(url: string): boolean {
  const host = new URL(url).hostname;
  return host === '127.0.0.1' || host === 'localhost';
}

/** משתמש עם המייל הזה (נוצר ומאושר אם צריך), ושורה ב-admins. מחזיר את המזהה. אפשר להריץ שוב. */
export async function ensureLocalAdmin(db: SupabaseClient<Database>, email: string): Promise<string> {
  const { data: list, error: listError } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) throw listError;
  let user = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) {
    const { data, error } = await db.auth.admin.createUser({ email, email_confirm: true });
    if (error) throw error;
    user = data.user;
  }
  const { error } = await db
    .from('admins')
    .upsert({ user_id: user.id }, { onConflict: 'user_id', ignoreDuplicates: true });
  if (error) throw error;
  return user.id;
}
