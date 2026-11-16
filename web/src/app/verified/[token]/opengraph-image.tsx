import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { badgeTitle } from '@/lib/badges/badge';
import { loadBadge } from '@/lib/badges/load';
import { OG_SIZE, renderBadgeCard } from '../../_og/card';

/** התמונה ש-LinkedIn מציג כשמשתפים את הכרטיס. בבקשה ובלי מטמון, כמו העמוד: קישור שבוטל מחזיר 404. */
export const alt = 'מדבקה על דף מודפס: בוגר/ת מאומת/ת של הקורס, עם חותמת המוסד. ביקורת מתפרסמת רק אחרי הוכחה שלמדו בקורס.';
export const size = OG_SIZE;
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ token: string }> }) {
  await connection();
  const { token } = await params;
  const badge = await loadBadge(token);
  if (!badge) notFound();
  return renderBadgeCard({
    title: badgeTitle(badge),
    name: badge.shownName,
    courseTitle: badge.courseTitle,
    institutionName: badge.institutionName,
  });
}
