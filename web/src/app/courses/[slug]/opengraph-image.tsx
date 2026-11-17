import { notFound } from 'next/navigation';
import { getCoursePage, getCourseSlugs } from '@/lib/data/course-page';
import { slugParams } from '@/lib/data/static-params';
import { OG_SIZE, renderCourseCard } from '../../_og/card';

/** התמונה שמופיעה כששולחים קישור לקורס בוואטסאפ או בפייסבוק. אותם נתונים מהמטמון כמו העמוד עצמו. */
export const alt = 'סיכום הקורס על דף מודפס: העובדות שהמוסד מפרסם, או ציון הבוגרים וכמה שילמו בפועל כשיש ביקורות.';
export const size = OG_SIZE;
export const contentType = 'image/png';

/** התמונות נבנות מראש לכל קורס, כמו העמודים, ומתרעננות עם אותו מטמון. */
export async function generateStaticParams() {
  const slugs = await getCourseSlugs();
  return slugParams(slugs);
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await getCoursePage(slug);
  // קורס שלא קיים: 404, כמו העמוד.
  if (!course) notFound();
  return renderCourseCard(course);
}
