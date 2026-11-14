/** הכתובת הציבורית של האתר. הקישורים בתמונת השיתוף (og:image) נבנים ממנה. */
export const SITE_URL = process.env.SITE_URL ?? 'https://course-compare-il.vercel.app';

/** השם עוד לא נקבע (PRODUCT.md). כל מקום שמציג את השם משתמש בזה. */
export const SITE_NAME = '[שם האתר]';

/**
 * עד ההשקה כל הקורסים, המוסדות והביקורות לדוגמה, וכל מספר שיוצא מהאתר מסומן ככה:
 * בתחתית כל עמוד, בתיאור של קישור משותף ועל תמונת השיתוף.
 */
export const SAMPLE_DATA = true;
