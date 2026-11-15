import type { CourseFormat, CourseSummary, TimeSlot, Understanding } from './types';

export interface KeywordCategory {
  slug: string;
  name: string;
}

/**
 * מילים נוספות לכל תחום, מעבר לשם שלו. לפי slug.
 * תחום חדש במסד בלי רשימה כאן נמצא רק לפי השם שלו.
 */
export const CATEGORY_SYNONYMS: Readonly<Record<string, readonly string[]>> = {
  technology: ['הייטק', 'מחשבים'],
  programming: ['פיתוח', 'מתכנת', 'מתכנתת', 'לתכנת', 'אתר', 'אתרים', 'קוד', 'full stack', 'פולסטאק', 'react', 'ריאקט', 'javascript', 'ג׳אווהסקריפט', 'web'],
  ai: ['ai', 'בינה', 'צ׳אט', 'chatgpt', 'דאטה', 'נתונים', 'python', 'פייתון', 'למידת מכונה'],
  cooking: ['אפייה', 'אפיה', 'לאפות', 'לבשל', 'מטבח', 'שף', 'קונדיטוריה', 'עוגות', 'לחם', 'פסטה'],
  photography: ['מצלמה', 'צלם', 'צלמת', 'לצלם', 'פוטושופ', 'לייטרום'],
  psychometric: ['פסיכומטרית', 'מבחן כניסה'],
  bookkeeping: ['חשבונאות', 'מנהל חשבונות', 'מנהלת חשבונות', 'הנה״ח', 'שכר'],
};

const TIME_WORDS: readonly (readonly [TimeSlot, readonly string[]])[] = [
  ['evening', ['ערב', 'ערבים', 'אחרי העבודה']],
  ['morning', ['בוקר', 'בקרים', 'בוקרים']],
  ['weekend', ['סופ״ש', 'סופש', 'סוף שבוע', 'סופי שבוע', 'שישי', 'שבת']],
];

const FORMAT_WORDS: readonly (readonly [CourseFormat, readonly string[]])[] = [
  ['online', ['אונליין', 'און ליין', 'online', 'זום', 'zoom', 'מרחוק', 'מהבית']],
  ['in_person', ['פרונטלי', 'פרונטלית', 'כיתה', 'פנים מול פנים']],
];

/** אותיות שימוש שיכולות לבוא לפני מילה: "בערבים", "לפסיכומטרי", "ולבישול". */
const PREFIXES = ['', 'ה', 'ב', 'ל', 'ו', 'מ', 'ש', 'כ', 'וה', 'וב', 'ול', 'ומ', 'וש', 'שה', 'שב', 'של', 'מה', 'כש'];

/** בלי ניקוד, כל סוגי הגרש והמירכאות לאחד, ורווח אחד במקום כל סימן אחר. */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7]/g, '')
    .replace(/[׳’`]/g, "'")
    .replace(/[״”“]/g, '"')
    .toLowerCase()
    .replace(/[^a-z0-9\u05D0-\u05EA'"]+/g, ' ')
    .trim();
}

/** המונח מופיע כמילה שלמה, אולי אחרי אותיות שימוש. padded: טקסט מנורמל עם רווח בשני הצדדים. */
function hasTerm(padded: string, term: string): boolean {
  const normalized = normalize(term);
  return normalized !== '' && PREFIXES.some((p) => padded.includes(` ${p}${normalized} `));
}

/** הגיבוי כשאין AI: תחומים לפי שם ומילים נרדפות, וזמן ופורמט לפי מילים קבועות. */
export function matchKeywords(text: string, categories: readonly KeywordCategory[]): Understanding {
  const padded = ` ${normalize(text)} `;
  const found = (terms: readonly string[]) => terms.some((term) => hasTerm(padded, term));
  return {
    categories: categories
      .filter((c) => found([c.name, ...(CATEGORY_SYNONYMS[c.slug] ?? [])]))
      .map((c) => c.slug)
      .slice(0, 3),
    when: TIME_WORDS.filter(([, words]) => found(words)).map(([slot]) => slot),
    how: FORMAT_WORDS.filter(([, words]) => found(words)).map(([format]) => format),
    source: 'keywords',
  };
}

export interface NameMatch {
  /** הטקסט תאם שם של קורס, או שם של מוסד. */
  by: 'title' | 'institution';
  courses: CourseSummary[];
}

/**
 * שמות של קורסים ומוסדות (מסמך העיצוב, 3א.2). שם נחשב רק כשהמבקר כתב אותו במלואו,
 * או לפחות 60% מאורך השם. כך "אפייה" נשארת נושא, ולא הופכת לשם של "אפייה ביתית".
 */
export function matchNames(text: string, courses: readonly CourseSummary[]): NameMatch | null {
  const query = normalize(text);
  if (query.length < 3) return null;
  const covers = (name: string) => {
    const normalized = normalize(name);
    return (
      normalized !== '' &&
      (query.includes(normalized) || (normalized.includes(query) && query.length >= normalized.length * 0.6))
    );
  };
  const byTitle = courses.filter((c) => covers(c.title));
  if (byTitle.length > 0) return { by: 'title', courses: byTitle.slice(0, 3) };
  const byInstitution = courses.filter((c) => covers(c.institutionName));
  if (byInstitution.length > 0) return { by: 'institution', courses: byInstitution.slice(0, 3) };
  return null;
}
