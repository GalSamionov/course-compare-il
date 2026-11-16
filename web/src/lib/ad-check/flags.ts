/**
 * שמונת הדגלים של המדריך "דגלים אדומים במודעה לקורס" (web/content/guides/05-red-flags-in-course-ads.md),
 * בסדר של המדריך. מסמך העיצוב: docs/superpowers/specs/2026-11-15-ad-check-design.md.
 *
 * כל מה שהמבקר קורא כאן כתבנו אנחנו. מהמודל מגיע רק סוג הדגל וציטוט, והציטוט נבדק מול הדף (quotes.ts).
 */

export const AD_FLAGS = [
  'income_promise',
  'guaranteed_return',
  'anchor_discount',
  'international_certificate',
  'valued_extras',
  'urgency',
  'no_experience_fast_result',
  'anonymous_testimonial',
] as const;

export type AdFlag = (typeof AD_FLAGS)[number];

export function isAdFlag(value: unknown): value is AdFlag {
  return typeof value === 'string' && (AD_FLAGS as readonly string[]).includes(value);
}

/** המדריך. כל דגל מקשר לפרק שלו: part-1 עד part-8 (המזהים נבנים ב-lib/guides/guides.ts לפי הסדר). */
export const RED_FLAGS_GUIDE = '/guides/red-flags-in-course-ads';

export interface FlagCopy {
  /** השם בעמוד, כמו בטבלה של מסמך העיצוב. */
  label: string;
  /** משפט אחד שלנו: למה זה דגל. */
  why: string;
  /** הקישור לפרק במדריך. */
  href: string;
}

const COPY: Record<AdFlag, Omit<FlagCopy, 'href'>> = {
  income_promise: {
    label: 'הבטחה של הכנסה',
    why: 'מה שהמוכר מרוויח לא אומר כמה תרוויחו אתם.',
  },
  guaranteed_return: {
    label: 'רווח מובטח, או כסף בחזרה',
    why: 'אף אחד לא יכול להבטיח רווח על הכסף שלכם. שאלו מה כתוב בחוזה על ההחזר.',
  },
  anchor_discount: {
    label: 'הנחה גדולה ממחיר "רגיל"',
    why: 'אם אף אחד לא שילם את המחיר ה"רגיל", ההנחה היא רק עוגן. מה שחשוב הוא כמה תשלמו.',
  },
  international_certificate: {
    label: '"תעודה בינלאומית"',
    why: 'המילה "בינלאומית" לא אומרת מי מכיר בתעודה. שאלו איזה גוף, מחוץ למוסד, מכיר בה.',
  },
  valued_extras: {
    label: 'ערכה או מתנות "בשווי"',
    why: 'את השווי קובע המוכר. ערכה שכלולה בקורס היא חלק מהמחיר שלו, לא מתנה.',
  },
  urgency: {
    label: 'לחץ של זמן ומקומות',
    why: 'לחץ של זמן נועד לכך שלא תשוו. בקשו את ההצעה בכתב, וקחו יום לחשוב.',
  },
  no_experience_fast_result: {
    label: '"בלי ניסיון", ותוצאה תוך זמן קצר',
    why: 'מקצוע שלומדים מאפס לוקח זמן ותרגול. בדקו בסילבוס כמה שעות תרגול יש.',
  },
  anonymous_testimonial: {
    label: 'המלצה בלי שם',
    why: 'ציטוט בלי שם מלא ובלי דרך לפנות לבוגר, אי אפשר לבדוק.',
  },
};

export function flagCopy(flag: AdFlag): FlagCopy {
  return { ...COPY[flag], href: `${RED_FLAGS_GUIDE}#part-${AD_FLAGS.indexOf(flag) + 1}` };
}

/** מה הדף מבטיח: ארבע טענות של המוסד. כל אחת ציטוט מהדף, או ריקה. */
export const AD_CLAIMS = ['price', 'duration', 'certificate', 'format'] as const;
export type AdClaim = (typeof AD_CLAIMS)[number];

export const CLAIM_LABELS: Record<AdClaim, string> = {
  price: 'מחיר',
  duration: 'משך',
  certificate: 'תעודה',
  format: 'מתכונת',
};

/**
 * ההגדרות שהמודל מקבל, באנגלית (מסמך העיצוב, "8 סוגי הדגלים"). הדוגמאות בעברית, כי הדפים בעברית.
 */
export const FLAG_DEFINITIONS: Record<AdFlag, string> = {
  income_promise:
    'A promise or hint of income, salary or profit from the profession (an amount, "5 ספרות", "עצמאות כלכלית", "להרוויח").',
  guaranteed_return: 'A guaranteed return on an investment, or "money back if you do not profit".',
  anchor_discount:
    'A discount of 40% or more, or a "regular" / "original" price shown next to a sale price (מחיר רגיל, במקום, הנחה).',
  international_certificate:
    'A "תעודה בינלאומית" or a certificate "recognized worldwide", without naming an outside body that recognizes it.',
  valued_extras: 'A kit, bonus or gifts "worth X" (בשווי).',
  urgency: 'Limited seats, limited time, or a countdown (מספר המקומות מוגבל, לזמן מוגבל, נשארו).',
  no_experience_fast_result:
    '"No experience needed" or "from zero" (בלי ניסיון, מאפס), together with a fast or big result.',
  anonymous_testimonial: 'A quoted testimonial without a full name (first name only, initials, or no name).',
};
