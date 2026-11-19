import type { CourseType } from '@/lib/score/types';

/** מתי הקורס מתקיים. אותם ערכים כמו בעמודה courses.time_slots. */
export type TimeSlot = 'evening' | 'morning' | 'weekend';
/** איך לומדים. אותם ערכים כמו בעמודה courses.formats (הבדיקה courses_formats_known במסד). */
export type CourseFormat = 'online' | 'in_person' | 'hybrid' | 'recorded';
/**
 * מה שאפשר לבחור בחיפוש, בשורה "מתי ואיך". קורס משולב או מוקלט נמצא דרכם (search/match.ts, coversFormat).
 * סינון של "משולב" עצמו הוא שלב 2 של מסמך העיצוב 2026-11-17.
 */
export type SearchFormat = 'online' | 'in_person';
/** התשובות לשורה "למה?". */
export type WhyKey = 'switch' | 'advance' | 'certificate' | 'exam' | 'fun';
/** ארבע השורות של המחברת. */
export type LineKey = 'what' | 'why' | 'whenhow' | 'budget';
/** סוג המוצר. אותם ערכים כמו בעמודה courses.product_type. */
export type ProductType = 'course' | 'workshop' | 'lecture';

export const TIME_SLOTS: readonly TimeSlot[] = ['evening', 'morning', 'weekend'];
export const PRODUCT_TYPES: readonly ProductType[] = ['course', 'workshop', 'lecture'];
/** ערך מהמסד (courses.product_type), שאולי לא מוכר לקוד. */
export const isProductType = (value: string): value is ProductType => (PRODUCT_TYPES as readonly string[]).includes(value);
/** מה נכתב ליד המוסד. קורס הוא ברירת המחדל, ולכן לא נכתב. */
export const PRODUCT_TYPE_LABEL: Record<ProductType, string | null> = { course: null, workshop: 'סדנה', lecture: 'הרצאה' };
export const COURSE_FORMATS: readonly CourseFormat[] = ['online', 'in_person', 'hybrid', 'recorded'];
export const SEARCH_FORMATS: readonly SearchFormat[] = ['online', 'in_person'];
export const LINE_KEYS: readonly LineKey[] = ['what', 'why', 'whenhow', 'budget'];

export const TIME_SLOT_LABEL: Record<TimeSlot, string> = { evening: 'ערבים', morning: 'בקרים', weekend: 'סופ״ש' };
/** "בכיתה" כבר מתחילה בב׳, ו"אונליין" לא מקבלת ב׳. ראו whenHowWords. */
export const FORMAT_LABEL: Record<CourseFormat, string> = {
  online: 'אונליין',
  in_person: 'בכיתה',
  hybrid: 'משולב',
  recorded: 'מוקלט',
};

/** התשובות של המבקר. נשמרות בכתובת, כדי שאפשר יהיה לשתף רשימה. */
export interface SearchQuery {
  /** המילים של המבקר בשורה 1, כמו שנכתבו. */
  q: string;
  /** התחומים שהבנו מהמילים, או שנבחרו מהרשימה. רק הם מסננים. */
  cats: string[];
  why: WhyKey | null;
  when: TimeSlot[];
  how: SearchFormat[];
  maxPrice: number | null;
  /** שורות שהוסר מהן הווי: התשובה נשארת, אבל לא מסננת. */
  off: LineKey[];
}

export const EMPTY_QUERY: SearchQuery = { q: '', cats: [], why: null, when: [], how: [], maxPrice: null, off: [] };

export type RowScore =
  | { status: 'scored'; value: number }
  | { status: 'not_enough_reviews'; reviewsNeeded: number }
  | { status: 'none' };

/** העובדה שמודגשת בשורת התוצאה, לפי סוג הקורס. */
export interface Highlight {
  label: string;
  text: string;
}

/** קורס בשורת תוצאה. רק מה שהרשימה צריכה, כדי שהדפדפן יקבל מעט נתונים. */
export interface CourseSummary {
  /** המזהה במסד. הרשימות של המשתמש (saved_courses, compare_items) שומרות אותו. */
  id: string;
  slug: string;
  title: string;
  institutionName: string;
  categorySlug: string;
  categoryName: string;
  categoryParentSlug: string | null;
  courseType: CourseType;
  productType: ProductType;
  score: RowScore;
  /** ביקורות מאומתות שפורסמו. */
  verifiedCount: number;
  sitePrice: number | null;
  /**
   * "העובדות" (lib/course/facts.ts): מה שהמוסד מפרסם על הקורס. משמשות לשורת העובדות, לשאלות ולסדר ברשימות.
   * אותם ערכים כמו בעמוד הקורס. בערך 30KB נוספים לכל הקטלוג, לפני דחיסה.
   */
  totalHours: number | null;
  durationMonths: number | null;
  region: string | null;
  /** העיר של המוסד (institutions.city), ל"מיקום" כשהקורס לא כותב איפה הוא (lib/course/facts.ts). */
  institutionCity: string | null;
  certificate: string | null;
  nextCohortDate: string | null;
  formats: CourseFormat[];
  timeSlots: TimeSlot[];
  updatedAt: string;
  highlight: Highlight | null;
}

export interface CategoryEntry {
  slug: string;
  name: string;
  /** תיאור קצר, מתחת לשם (categories.description). אולי חסר בתחום שנוסף אחר כך. */
  description: string | null;
  parentSlug: string | null;
  /** אין תחום אחר שהוא האב שלו. */
  isLeaf: boolean;
  /** קורסים בתחום ובתחומים שמתחתיו. */
  courseCount: number;
  /** בוגרים מאומתים בקורסים האלה. */
  gradCount: number;
}

export interface Catalog {
  /** התחומים הפעילים. תחום שיצא משימוש לא כאן, אלא ב-moved. */
  categories: CategoryEntry[];
  courses: CourseSummary[];
  /** תחום שיצא משימוש (categories.replaced_by): slug -> התחומים שהחליפו אותו. כך קישורים ישנים ממשיכים לעבוד. */
  moved: Readonly<Record<string, readonly string[]>>;
}

/** מה שהבנו מהמילים בשורה 1. אף פעם לא טקסט חופשי: רק תחומים וערכים שקיימים. */
export interface Understanding {
  categories: string[];
  when: TimeSlot[];
  how: SearchFormat[];
  source: 'ai' | 'keywords';
}
