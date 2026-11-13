import type { CourseType } from '@/lib/score/types';

/** מתי הקורס מתקיים. אותם ערכים כמו בעמודה courses.time_slots. */
export type TimeSlot = 'evening' | 'morning' | 'weekend';
/** איך לומדים. אותם ערכים כמו בעמודה courses.formats. */
export type CourseFormat = 'online' | 'in_person';
/** התשובות לשורה "למה?". */
export type WhyKey = 'switch' | 'advance' | 'certificate' | 'exam' | 'fun';
/** ארבע השורות של המחברת. */
export type LineKey = 'what' | 'why' | 'whenhow' | 'budget';
/** סוג המוצר. אותם ערכים כמו בעמודה courses.product_type. */
export type ProductType = 'course' | 'workshop' | 'lecture';

export const TIME_SLOTS: readonly TimeSlot[] = ['evening', 'morning', 'weekend'];
export const PRODUCT_TYPES: readonly ProductType[] = ['course', 'workshop', 'lecture'];
/** מה נכתב ליד המוסד. קורס הוא ברירת המחדל, ולכן לא נכתב. */
export const PRODUCT_TYPE_LABEL: Record<ProductType, string | null> = { course: null, workshop: 'סדנה', lecture: 'הרצאה' };
export const COURSE_FORMATS: readonly CourseFormat[] = ['online', 'in_person'];
export const LINE_KEYS: readonly LineKey[] = ['what', 'why', 'whenhow', 'budget'];

export const TIME_SLOT_LABEL: Record<TimeSlot, string> = { evening: 'ערבים', morning: 'בקרים', weekend: 'סופ״ש' };
/** "בכיתה" כבר מתחילה בב׳, ו"אונליין" לא מקבלת ב׳. ראו whenHowWords. */
export const FORMAT_LABEL: Record<CourseFormat, string> = { online: 'אונליין', in_person: 'בכיתה' };

/** התשובות של המבקר. נשמרות בכתובת, כדי שאפשר יהיה לשתף רשימה. */
export interface SearchQuery {
  /** המילים של המבקר בשורה 1, כמו שנכתבו. */
  q: string;
  /** התחומים שהבנו מהמילים, או שנבחרו מהרשימה. רק הם מסננים. */
  cats: string[];
  why: WhyKey | null;
  when: TimeSlot[];
  how: CourseFormat[];
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
  formats: CourseFormat[];
  timeSlots: TimeSlot[];
  updatedAt: string;
  highlight: Highlight | null;
}

export interface CategoryEntry {
  slug: string;
  name: string;
  parentSlug: string | null;
  /** אין תחום אחר שהוא האב שלו. */
  isLeaf: boolean;
  /** קורסים בתחום ובתחומים שמתחתיו. */
  courseCount: number;
  /** בוגרים מאומתים בקורסים האלה. */
  gradCount: number;
}

export interface Catalog {
  categories: CategoryEntry[];
  courses: CourseSummary[];
}

/** מה שהבנו מהמילים בשורה 1. אף פעם לא טקסט חופשי: רק תחומים וערכים שקיימים. */
export interface Understanding {
  categories: string[];
  when: TimeSlot[];
  how: CourseFormat[];
  source: 'ai' | 'keywords';
}
