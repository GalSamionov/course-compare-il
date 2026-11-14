import { ADVICE_SOURCES, MAX_SENTENCES, type Advice, type AdviceSentence, type AdviceSource } from './types';

/** משפט ארוך מזה כבר לא משפט אחד. */
const MAX_SENTENCE_CHARS = 400;
const MAX_MISSING_CHARS = 200;

const isSource = (value: unknown): value is AdviceSource =>
  typeof value === 'string' && (ADVICE_SOURCES as readonly string[]).includes(value);

const clean = (value: unknown): string => (typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '');

/** מספר או מחיר. ל"חסר לנו" אין סימון של מקור, ולכן אסור שיהיו בו נתונים. */
const HAS_FIGURE = /[0-9₪]/;

/**
 * מה שמוצג מתשובת היועץ. רץ בשרת על הפלט של המודל, ושוב בדפדפן על מה שהגיע מהשרת.
 * - משפט בלי מקור מוכר לא מוצג (מסמך העיצוב של סבב 2, סעיף 6).
 * - גם משפט על קורס שלא ברשימה לא מוצג: זה מידע מבחוץ.
 * - courseSlug ריק ("") הוא "לא קורס מסוים".
 * - "חסר לנו" עם מספר או ₪ לא מוצג: זה נתון בלי מקור. במקומו מופיע המשפט הקבוע של הממשק,
 *   ולכן notEnoughInfo נשאר true.
 */
export function filterAdvice(raw: unknown, courseSlugs: readonly string[]): Advice {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const sentences: AdviceSentence[] = [];
  for (const item of Array.isArray(obj.sentences) ? obj.sentences : []) {
    if (sentences.length === MAX_SENTENCES) break;
    const s = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
    const text = clean(s.text);
    if (text === '' || text.length > MAX_SENTENCE_CHARS || !isSource(s.source)) continue;
    const slug = typeof s.courseSlug === 'string' && s.courseSlug !== '' ? s.courseSlug : null;
    if (slug !== null && !courseSlugs.includes(slug)) continue;
    sentences.push({ text, source: s.source, courseSlug: slug });
  }
  const missingText = clean(obj.missing);
  const missing =
    missingText !== '' && missingText.length <= MAX_MISSING_CHARS && !HAS_FIGURE.test(missingText) ? missingText : null;
  return { sentences, notEnoughInfo: obj.notEnoughInfo === true || missingText !== '', missing };
}
