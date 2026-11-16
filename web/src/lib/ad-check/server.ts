import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import type { AdCheckDeps } from './check';
import { fetchPage } from './fetch-page';
import { readAdPage } from './llm';
import { parseStoredResult } from './quotes';

/**
 * האם להציג את "בדקו את הדף" ב-/request-course. העמוד סטטי, ולכן זה נקבע בזמן הבנייה, כמו היועץ
 * (advisor/enabled.ts). פעולת השרת בודקת שוב בכל בקשה: בלי מפתח, הטופס עובד כמו קודם.
 */
export function adCheckEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

/** המסד (הפונקציות של 20261116020001_ad_checks.sql), הרשת והמודל, לבדיקה אחת. */
export function adCheckDeps(db: SupabaseClient<Database>, apiKey: string, ipHash: string): AdCheckDeps {
  return {
    getCached: async (url) => {
      const { data, error } = await db.rpc('get_ad_check', { p_url: url });
      if (error) throw error;
      const row = (data ?? null) as { result?: unknown; checked_at?: unknown } | null;
      const result = parseStoredResult(row?.result);
      return result && typeof row?.checked_at === 'string' ? { result, checkedAt: row.checked_at } : null;
    },
    takeQuota: async () => {
      const { data, error } = await db.rpc('take_ad_check', { p_ip_hash: ipHash });
      if (error) throw error;
      return data === true;
    },
    fetchPage,
    readPage: (page) => readAdPage(apiKey, page),
    save: async (url, result) => {
      const { data, error } = await db.rpc('save_ad_check', {
        p_url: url,
        p_result: result as unknown as Database['public']['Functions']['save_ad_check']['Args']['p_result'],
      });
      if (error) throw error;
      return typeof data === 'string' ? data : new Date().toISOString();
    },
    log: (message) => console.error(message),
  };
}

/** כמה ביקורות מאומתות יש לקורס שבאתר. באתר מתפרסמות רק ביקורות שאומתו, ולכן זו ספירה של המפורסמות. */
export async function verifiedReviewCount(db: SupabaseClient<Database>, slug: string): Promise<number | null> {
  const { data: course } = await db.from('courses').select('id').eq('slug', slug).maybeSingle();
  if (!course) return null;
  const { count, error } = await db
    .from('reviews')
    .select('id', { count: 'exact', head: true })
    .eq('course_id', course.id)
    .eq('status', 'published');
  return error ? null : (count ?? 0);
}
