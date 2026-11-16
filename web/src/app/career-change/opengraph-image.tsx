import { getCareerChangePage } from '@/lib/data/career-change';
import { OG_SIZE, renderCareerCard } from '../_og/card';

/** התמונה שמופיעה כששולחים את העמוד בקבוצה. אותם נתונים מהמטמון כמו העמוד עצמו. */
export const alt = 'דף מודפס על שולחן: קורסי הסבה להייטק, לפי מי שכבר סיים אותם, וכמה בוגרים מאומתים יש בעמוד.';
export const size = OG_SIZE;
export const contentType = 'image/png';

export default async function Image() {
  const page = await getCareerChangePage();
  return renderCareerCard({ courses: page.courses.length, graduates: page.graduates });
}
