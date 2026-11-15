import { cacheLife } from 'next/cache';
import { notFound } from 'next/navigation';
import { getGuide, getGuides } from '@/lib/guides/guides';
import { OG_SIZE, renderGuideCard } from '../../_og/card';

/** התמונה שמופיעה כששולחים קישור למדריך בוואטסאפ או בפייסבוק. */
export const alt = 'דף מודפס על שולחן: מדריך לפני שמשלמים על קורס, וכמה עובדות בו נבדקו מול מסמך.';
export const size = OG_SIZE;
export const contentType = 'image/png';

export async function generateStaticParams() {
  return getGuides().map((g) => ({ slug: g.slug }));
}

/**
 * הנתונים של הכרטיס מהמטמון (use cache), כמו בתמונה של עמוד קורס: כך התמונה נבנית מראש בזמן הבנייה,
 * והפונקציה בשרת לא צריכה לקרוא את content/guides, שלא נארז איתה.
 */
async function cardData(slug: string) {
  'use cache';
  cacheLife('max');
  const guide = getGuide(slug);
  if (!guide) return null;
  return {
    title: guide.title,
    description: guide.description,
    order: guide.order,
    total: getGuides().length,
    verifiedCount: guide.refs.length,
  };
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await cardData(slug);
  if (!data) notFound();
  return renderGuideCard(data);
}
