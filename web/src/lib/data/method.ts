import { cacheLife, cacheTag } from 'next/cache';
import { createPublicClient } from '@/lib/supabase/public-client';
import { queryError } from './shared';

export interface MethodChange {
  version: string;
  summary: string;
  reason: string;
  changedAt: string;
}

export interface MethodData {
  /** יומן השינויים בשיטה, מהחדש לישן. */
  changes: MethodChange[];
  /** השם של כל שאלה בשאלון, לפי המפתח שלה. */
  metricLabels: Record<string, string>;
}

export async function getMethodData(): Promise<MethodData> {
  'use cache';
  cacheLife('hours');
  cacheTag('method');
  const db = createPublicClient();
  const [changes, metrics] = await Promise.all([
    db.from('method_changes').select('version, summary, reason, changed_at').order('changed_at', { ascending: false }),
    db.from('metrics').select('key, label'),
  ]);
  if (changes.error) throw queryError('method changes', changes.error);
  if (metrics.error) throw queryError('metrics', metrics.error);
  return {
    changes: changes.data.map((c) => ({
      version: c.version,
      summary: c.summary,
      reason: c.reason,
      changedAt: c.changed_at,
    })),
    metricLabels: Object.fromEntries(metrics.data.map((m) => [m.key, m.label])),
  };
}
