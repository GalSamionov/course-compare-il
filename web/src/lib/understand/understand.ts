import { matchKeywords, type KeywordCategory } from '@/lib/search/keywords';
import type { Understanding } from '@/lib/search/types';
import { understandWithClaude } from './claude';

/** ה-AI כשיש מפתח. בלי מפתח, או כשהקריאה נכשלה או איטית מדי: התאמת מילים. */
export async function understand(text: string, categories: readonly KeywordCategory[]): Promise<Understanding> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || categories.length === 0) return matchKeywords(text, categories);
  try {
    return await understandWithClaude(text, categories, apiKey);
  } catch (error) {
    // רק ההודעה, בלי הבקשה: הטקסט של המבקר לא נכתב ליומן.
    console.error('understand: falling back to keywords:', error instanceof Error ? error.message : 'unknown error');
    return matchKeywords(text, categories);
  }
}
