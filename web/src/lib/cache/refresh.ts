import 'server-only';
import { updateTag } from 'next/cache';

/**
 * אחרי חישוב ציונים: כל עמוד קורס שחושב, והקטלוג, מתרעננים מיד (סבב 5, פריט 36). ממוצע התחום משותף,
 * ולכן ביקורת אחת מזיזה גם ציונים של קורסים אחרים. הבקשה הבאה לכל עמוד מחכה לנתונים החדשים.
 * רק בתוך Server Action (updateTag.md). בנתיב API: revalidateTag(tag, { expire: 0 }).
 */
export function refreshCourses(slugs: Iterable<string>): void {
  for (const slug of new Set(slugs)) updateTag(`course:${slug}`);
  updateTag('catalog');
}
