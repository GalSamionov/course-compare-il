import type { CourseFormat, CourseSummary, TimeSlot, Understanding } from './types';

export interface KeywordCategory {
  slug: string;
  name: string;
  /** התיאור הקצר של התחום. רק ה-AI משתמש בו, כדי להבחין בין תחומים קרובים. */
  description?: string | null;
}

/**
 * מילים נוספות לכל תחום, מעבר לשם שלו. לפי slug.
 * תחום חדש במסד בלי רשימה כאן נמצא רק לפי השם שלו.
 */
export const CATEGORY_SYNONYMS: Readonly<Record<string, readonly string[]>> = {
  technology: ['הייטק', 'מחשבים'],
  programming: ['פיתוח', 'מתכנת', 'מתכנתת', 'לתכנת', 'אתר', 'אתרים', 'קוד', 'full stack', 'פולסטאק', 'react', 'ריאקט', 'javascript', 'ג׳אווהסקריפט', 'web'],
  // ai יצא משימוש ב-16.11.2026. "AI" סתם מוביל לתחום הכללי מבין הארבעה, והמילים המדויקות לשאר.
  'ai-at-work': ['ai', 'בינה', 'בינה מלאכותית', 'צ׳אט', 'chatgpt', 'צ׳אט gpt', 'gpt', 'פרומפט', 'פרומפטים', 'prompt'],
  'ai-automation': ['אוטומציה', 'אוטומציות', 'סוכן', 'סוכנים', 'סוכני ai', 'agents', 'n8n', 'make', 'zapier'],
  'ai-no-code': ['בלי קוד', 'no code', 'nocode', 'no-code', 'lovable', 'base44', 'cursor', 'vibe coding', 'וייב קודינג'],
  'ai-content': ['יצירת תוכן', 'וידאו', 'סרטונים', 'מוזיקה', 'midjourney', 'מידג׳רני', 'תמונות ai'],
  'data-analysis': ['נתונים', 'ניתוח נתונים', 'אנליסט', 'אנליסטית', 'data', 'sql', 'power bi', 'python', 'פייתון', 'למידת מכונה'],
  cyber: ['אבטחת מידע', 'האקינג', 'האקר', 'soc', 'cyber'],
  'digital-marketing': ['שיווק', 'פרסום', 'קמפיינים', 'קמפיין', 'סושיאל', 'רשתות חברתיות', 'seo', 'ppc'],
  beauty: ['יופי', 'טיפוח', 'קוסמטיקה', 'קוסמטיקאית'],
  nails: ['ציפורניים', 'מניקור', 'פדיקור', 'לק', 'לק ג׳ל', 'בניית ציפורניים'],
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

/**
 * התחומים שהטקסט מזכיר. מונח ארוך קודם, והמילים שלו לא נספרות שוב למונח קצר יותר:
 * "בלי קוד" הוא בניית אפליקציות בלי קוד, וה"קוד" שבתוכו לא מוסיף גם את תכנות.
 */
function matchCategories(padded: string, categories: readonly KeywordCategory[]): Set<string> {
  const terms = categories
    .flatMap((c) => [c.name, ...(CATEGORY_SYNONYMS[c.slug] ?? [])].map((term) => ({ slug: c.slug, term: normalize(term) })))
    .filter(({ term }) => term !== '')
    .sort((a, b) => b.term.length - a.term.length);
  const found = new Set<string>();
  let rest = padded;
  for (const { slug, term } of terms) {
    const hit = PREFIXES.map((p) => ` ${p}${term} `).find((t) => rest.includes(t));
    if (!hit) continue;
    found.add(slug);
    rest = rest.replace(hit, ' ');
  }
  return found;
}

/** הגיבוי כשאין AI: תחומים לפי שם ומילים נרדפות, וזמן ופורמט לפי מילים קבועות. */
export function matchKeywords(text: string, categories: readonly KeywordCategory[]): Understanding {
  const padded = ` ${normalize(text)} `;
  const found = (terms: readonly string[]) => terms.some((term) => hasTerm(padded, term));
  const inText = matchCategories(padded, categories);
  return {
    categories: categories
      .filter((c) => inText.has(c.slug))
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
