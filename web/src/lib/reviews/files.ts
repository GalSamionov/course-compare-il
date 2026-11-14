import { createHash } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../database.types';
import type { ProofMime } from './types';

/** התיקייה הפרטית של ההוכחות (ה-migration של סבב 3). */
export const PROOF_BUCKET = 'proofs';

const PROOF_FILE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(pdf|jpg|png)$/;
const MIME_OF_EXTENSION: Record<string, ProofMime> = { pdf: 'application/pdf', jpg: 'image/jpeg', png: 'image/png' };

/** '<uid>/<reviewId>/<uuid>.<pdf|jpg|png>', בדיוק מה שהדפדפן מעלה (reviews/browser.ts, uploadProof). */
export function isProofPathOf(path: string, userId: string, reviewId: string): boolean {
  const parts = path.split('/');
  return parts.length === 3 && parts[0] === userId && parts[1] === reviewId && PROOF_FILE.test(parts[2]);
}

/** הסוג לפי הסיומת בנתיב. הנתיב כבר עבר את isProofPathOf. */
export function mimeOfPath(path: string): ProofMime | null {
  return MIME_OF_EXTENSION[path.slice(path.lastIndexOf('.') + 1)] ?? null;
}

/** הסוג לפי הבתים הראשונים, ולא לפי מה שהדפדפן אמר. */
export function sniffMime(bytes: Uint8Array): ProofMime | null {
  const starts = (...signature: number[]) => signature.every((byte, i) => bytes[i] === byte);
  if (starts(0x25, 0x50, 0x44, 0x46, 0x2d)) return 'application/pdf'; // %PDF-
  if (starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return 'image/png';
  if (starts(0xff, 0xd8, 0xff)) return 'image/jpeg';
  return null;
}

/** טביעת האצבע של הקובץ. נשמרת גם אחרי שהקובץ נמחק, כדי לזהות את אותו קובץ בפעם הבאה. */
export function sha256Hex(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

/**
 * מוחק קבצים מתיקיית ההוכחות דרך ה-API של Storage. מחיקה מ-storage.objects ב-SQL חסומה ב-Supabase
 * (storage.protect_delete). קובץ שכבר לא קיים לא נחשב שגיאה (נבדק מקומית). זורקת כשה-API נכשל.
 */
export async function removeProofFiles(db: SupabaseClient<Database>, paths: readonly string[]): Promise<number> {
  let removed = 0;
  for (let i = 0; i < paths.length; i += 100) {
    const { data, error } = await db.storage.from(PROOF_BUCKET).remove(paths.slice(i, i + 100));
    if (error) throw error;
    removed += data.length;
  }
  return removed;
}

/** כל הקבצים בתיקייה של ביקורת אחת, גם כאלה שהועלו ולא נשלחו. */
export async function listReviewFiles(
  db: SupabaseClient<Database>,
  userId: string,
  reviewId: string,
): Promise<string[]> {
  const folder = `${userId}/${reviewId}`;
  const { data, error } = await db.storage.from(PROOF_BUCKET).list(folder, { limit: 100 });
  if (error) throw error;
  return data.map((file) => `${folder}/${file.name}`);
}
