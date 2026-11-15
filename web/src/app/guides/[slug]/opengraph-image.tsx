import { notFound } from 'next/navigation';
import { getGuide, getGuides } from '@/lib/guides/guides';
import { OG_SIZE, renderGuideCard } from '../../_og/card';

/** התמונה שמופיעה כששולחים קישור למדריך בוואטסאפ או בפייסבוק. נבנית מראש לכל מדריך, כמו העמוד. */
export const alt = 'דף מודפס על שולחן: מדריך לפני שמשלמים על קורס, וכמה עובדות בו נבדקו מול מסמך.';
export const size = OG_SIZE;
export const contentType = 'image/png';

export function generateStaticParams() {
  return getGuides().map((g) => ({ slug: g.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();
  return renderGuideCard({
    title: guide.title,
    description: guide.description,
    order: guide.order,
    total: getGuides().length,
    verifiedCount: guide.refs.length,
  });
}
