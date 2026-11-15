import { toCompareCourse, type CompareCourse } from '@/lib/compare/rows';
import { getCatalog } from './catalog';
import { getCoursePage } from './course-page';

/**
 * כל הקורסים שאפשר להשוות: הקורסים בקטלוג (פעילים, או שאולי כבר לא פעילים), כל אחד מהמטמון של עמוד הקורס.
 * העמוד סטטי, והדפדפן בוחר מהרשימה לפי הכתובת או המגש. מספיק לכמה מאות קורסים, כמו הקטלוג.
 * בלי מטמון משלה: היא מרכיבה פונקציות שכבר במטמון, והתגיות שלהן (catalog, course:<slug>) חלות על העמוד.
 */
export async function getCompareCourses(): Promise<CompareCourse[]> {
  const { courses } = await getCatalog();
  const pages = await Promise.all(courses.map((course) => getCoursePage(course.slug)));
  return pages.flatMap((page) => (page ? [toCompareCourse(page)] : []));
}
