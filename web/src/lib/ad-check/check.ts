/**
 * בדיקת קישור אחת, מהקישור המנורמל ועד התוצאה (מסמך העיצוב, "הזרימה"): מטמון של 24 שעות, מכסה, קריאת הדף,
 * חילוץ הטקסט, המודל, בדיקת הציטוטים ושמירה. כל מה שיוצא החוצה (מסד, רשת, מודל) מגיע ב-deps, כדי שהבדיקות
 * יחליפו אותו. בלי קריאה אמיתית למודל בבדיקות.
 */
import { extractPageText } from './extract';
import { mapModelOutput, type AdCheckResult } from './quotes';
import { checkTarget } from './url-guard';
import type { FetchedPage } from './fetch-page';

export interface AdCheckDeps {
  /** תוצאה מ-24 השעות האחרונות (get_ad_check), או null. */
  getCached: (url: string) => Promise<{ result: AdCheckResult; checkedAt: string } | null>;
  /** מעלה את המונים (take_ad_check). false: נגמרה המכסה של הכתובת או של האתר. */
  takeQuota: () => Promise<boolean>;
  fetchPage: (url: string) => Promise<FetchedPage>;
  /** המודל. מחזיר JSON כמו שהוא, וזורק בכל תקלה. */
  readPage: (page: { url: string; text: string }) => Promise<unknown>;
  /** שומר במטמון (save_ad_check) ומחזיר מתי נבדק. */
  save: (url: string, result: AdCheckResult) => Promise<string>;
  /** תקלה שלא מגיעה למבקר. בלי תוכן הדף ובלי הכתובת. */
  log?: (message: string) => void;
}

export type AdCheckOutcome =
  | { kind: 'checked'; result: AdCheckResult; checkedAt: string; cached: boolean }
  /** פוסט, דף או קישור מקוצר של רשת חברתית: לא נקרא. */
  | { kind: 'social' }
  /** המכסה נגמרה. הבקשה עצמה נשמרת בנפרד. */
  | { kind: 'quota' }
  /** הדף לא נקרא, או שהמודל נכשל: אותה הודעה. */
  | { kind: 'unreadable' };

/** פחות טקסט מזה: כנראה דף שנבנה רק ב-JavaScript ("You need to enable JavaScript"). */
export const MIN_PAGE_TEXT = 120;

export async function runAdCheck(url: string, deps: AdCheckDeps): Promise<AdCheckOutcome> {
  const target = checkTarget(url);
  if (!target.ok) return { kind: target.problem === 'social' ? 'social' : 'unreadable' };

  const cached = await deps.getCached(url);
  if (cached) return { kind: 'checked', result: cached.result, checkedAt: cached.checkedAt, cached: true };

  if (!(await deps.takeQuota())) return { kind: 'quota' };

  const page = await deps.fetchPage(url);
  if (!page.ok) return { kind: 'unreadable' };
  const { text } = extractPageText(page.html);
  if (text.length < MIN_PAGE_TEXT) return { kind: 'unreadable' };

  let raw: unknown;
  try {
    raw = await deps.readPage({ url: page.url, text });
  } catch (error) {
    deps.log?.(`ad check model failed: ${error instanceof Error ? error.name : 'unknown'}`);
    return { kind: 'unreadable' };
  }
  const result = mapModelOutput(raw, text);

  let checkedAt = new Date().toISOString();
  try {
    checkedAt = await deps.save(url, result);
  } catch (error) {
    // בלי מטמון הבדיקה עדיין טובה. הפעם הבאה פשוט תקרא שוב.
    deps.log?.(`ad check save failed: ${error instanceof Error ? error.message : 'unknown'}`);
  }
  return { kind: 'checked', result, checkedAt, cached: false };
}
