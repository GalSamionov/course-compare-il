import { getGuide } from '@/lib/guides/guides';

/**
 * השאלות לשאול לפני שמשלמים על קורס הסבה. רובן מתוך "הרשימה לשמירה" במדריך "מה לשאול את המוסד לפני שנרשמים",
 * בחירה של מה שהכי חשוב כשהסכום גבוה וההבטחה היא עבודה. כל שאלה מקשרת לפרק במדריך שמסביר אותה,
 * עם מה שהחוק אומר והמקור. הפרק נמצא לפי השם שלו, ושם שהשתנה במדריך מפיל את בדיקת היחידה.
 */
export interface CareerQuestion {
  text: string;
  guide: string;
  /** השם של הפרק במדריך, כמו בכותרת ## שלו. */
  section: string;
}

export const CAREER_QUESTIONS: readonly CareerQuestion[] = [
  { text: 'מה המחיר הכולל, עם מע״מ, ומה לא כלול בו?', guide: 'questions-before-signing-up', section: 'כמה זה עולה, עד הסוף' },
  {
    text: 'איך ספרתם את הבוגרים שעובדים, ומה כתוב בחוזה על השמה?',
    guide: 'questions-before-signing-up',
    section: 'מה עם עבודה אחרי הקורס',
  },
  { text: 'אפשר לדבר עם בוגרים שלא אתם בחרתם?', guide: 'questions-before-signing-up', section: 'מה עם עבודה אחרי הקורס' },
  { text: 'כמה שעות עם מרצה, וכמה הקלטות?', guide: 'questions-before-signing-up', section: 'מי מלמד, וכמה שעות' },
  {
    text: 'מה מדיניות הביטול לפני הקורס, ומה קורה אם עוזבים באמצע?',
    guide: 'questions-before-signing-up',
    section: 'מה קורה אם מתחרטים',
  },
  {
    text: 'מי נותן את התשלומים, ומה קורה להלוואה אם מבטלים?',
    guide: 'questions-before-signing-up',
    section: 'איך משלמים',
  },
  {
    text: 'אפשר לשלם בשובר הכשרה של משרד העבודה, או מהפיקדון של חיילים משוחררים?',
    guide: 'funding-and-vouchers',
    section: 'לפני שמשלמים',
  },
];

export interface ResolvedQuestion {
  text: string;
  href: string;
  /** שם המדריך. */
  guideTitle: string;
  /** שם הפרק במדריך, לקישור: הוא אומר על מה הפרק, ושונה משאלה לשאלה. */
  section: string;
}

/** הקישור של כל שאלה: המדריך והפרק. מדריך או פרק שלא קיימים זורקים שגיאה, כדי שהבנייה תיכשל ולא תקשר לכלום. */
export function resolveQuestions(questions: readonly CareerQuestion[] = CAREER_QUESTIONS): ResolvedQuestion[] {
  return questions.map((q) => {
    const guide = getGuide(q.guide);
    if (!guide) throw new Error(`career question: no guide "${q.guide}"`);
    const section = guide.sections.find((s) => s.title === q.section);
    if (!section) throw new Error(`career question: no section "${q.section}" in "${q.guide}"`);
    return { text: q.text, href: `/guides/${guide.slug}#${section.id}`, guideTitle: guide.title, section: section.title };
  });
}
