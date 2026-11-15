import type { MetadataRoute } from 'next';
import { getCatalog } from '@/lib/data/catalog';
import { getGuides } from '@/lib/guides/guides';
import { SITE_URL } from '@/lib/site';

/**
 * מפת האתר (/sitemap.xml): העמודים הציבוריים שמחפשים בהם קורס. הקורסים והתחומים מהקטלוג שבמטמון, והמדריכים מהדיסק.
 * עד ההשקה האתר כולו noindex (layout.tsx), והמפה מוכנה ליום שהוא יורד.
 * לא כאן: האזור האישי, הניהול, כתיבת ביקורת, וכרטיסי "בוגר מאומת" (/verified), שלא נכנסים לחיפוש אף פעם.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const catalog = await getCatalog();
  const url = (path: string) => `${SITE_URL}${path}`;
  const pages = ['/', '/career-change', '/courses', '/guides', '/companies', '/method', '/who-pays-us', '/privacy', '/terms'];
  return [
    ...pages.map((path) => ({ url: url(path) })),
    ...getGuides().map((g) => ({ url: url(`/guides/${g.slug}`), lastModified: g.checked })),
    ...catalog.categories.map((c) => ({ url: url(`/categories/${c.slug}`) })),
    ...catalog.courses.map((c) => ({ url: url(`/courses/${c.slug}`), lastModified: c.updatedAt })),
  ];
}
