import { notFound } from 'next/navigation';
import cards from '@/lib/guides/cards.json';
import { OG_SIZE, renderGuideCard } from '../../_og/card';

/**
 * התמונה שמופיעה כששולחים קישור למדריך בוואטסאפ או בפייסבוק.
 * הנתונים מ-cards.json ולא מ-content/guides, שלא נארז עם הפונקציה בשרת (lib/guides/cards.ts).
 */
export const alt = 'דף מודפס על שולחן: מדריך לפני שמשלמים על קורס, וכמה עובדות בו נבדקו מול מסמך.';
export const size = OG_SIZE;
export const contentType = 'image/png';

export async function generateStaticParams() {
  return cards.map((c) => ({ slug: c.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const card = cards.find((c) => c.slug === slug);
  if (!card) notFound();
  return renderGuideCard(card);
}
