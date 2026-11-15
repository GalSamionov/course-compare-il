/**
 * מה שהיועץ מחזיר, והגבולות של שאלה. משותף לשרת ולדפדפן, ולכן בלי שום import של שרת.
 */

/**
 * המקור של משפט בתשובה, והסימון שלו בעמוד:
 * verified נבדק מול מסמך (מרקר ירוק), graduates בוגרים מאומתים (מרקר צהוב), institution המוסד אומר ולא בדקנו (קו כחול).
 */
export type AdviceSource = 'verified' | 'graduates' | 'institution';
export const ADVICE_SOURCES: readonly AdviceSource[] = ['verified', 'graduates', 'institution'];

export interface AdviceSentence {
  text: string;
  source: AdviceSource;
  /** הקורס שהמשפט עוסק בו, מתוך הרשימה. null: המשפט משווה בין קורסים, או לא עוסק באחד מסוים. */
  courseSlug: string | null;
}

export interface Advice {
  sentences: AdviceSentence[];
  /** חלק מהשאלה לא נענה, כי אין לנו מספיק נתונים. */
  notEnoughInfo: boolean;
  /** משפט אחד בקול האתר: מה חסר. null כשהמודל לא כתב משפט כזה. */
  missing: string | null;
}

export interface AdviseResponse {
  advice: Advice;
  /** כמה שאלות נשארו היום, במופע הזה של השרת. */
  remaining: number;
}

export type AdviseError =
  | 'not_configured'
  | 'bad_json'
  | 'bad_question'
  | 'bad_courses'
  | 'no_courses'
  | 'too_fast'
  | 'limit'
  | 'failed';

/** אורך השאלה בתווים. */
export const MAX_QUESTION_LENGTH = 300;
/** כמה קורסים בשאלה אחת: הראשונים ברשימה. */
export const MAX_COURSES = 10;
/** כמה משפטים מוצגים בתשובה אחת. */
export const MAX_SENTENCES = 8;

/** מסמך העיצוב של סבב 2, סעיף 12: 10 שאלות ביום למבקר ו-30 למשתמש מחובר. ועוד הגבלה קצרה לדקה. */
export const ADVISOR_LIMITS = { visitorPerDay: 10, userPerDay: 30, perMinute: 3 } as const;
