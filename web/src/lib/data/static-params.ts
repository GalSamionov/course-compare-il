/**
 * עם Cache Components, generateStaticParams חייבת להחזיר לפחות תוצאה אחת, אחרת הבנייה נכשלת
 * (https://nextjs.org/docs/messages/empty-generate-static-params).
 * זה קרה בפריסה של 17.11.2026: אחרי הסתרת נתוני הדוגמה לא נשאר אף מרצה ציבורי.
 * כשאין עדיין אף עמוד, בונים slug אחד שלא קיים במסד. העמוד שלו קורא ל-notFound() ומחזיר 404.
 */
export const NO_PAGES_YET = '__none__';

export function slugParams(slugs: readonly string[]): { slug: string }[] {
  return (slugs.length > 0 ? slugs : [NO_PAGES_YET]).map((slug) => ({ slug }));
}
