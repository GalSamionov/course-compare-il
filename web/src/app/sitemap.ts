import type { MetadataRoute } from 'next';
import { getCatalog } from '@/lib/data/catalog';
import { getGuides } from '@/lib/guides/guides';
import { sitemapEntries } from '@/lib/seo/indexing';
import { SITE_URL } from '@/lib/site';

/**
 * מפת האתר (/sitemap.xml): העמודים הציבוריים שמותר לאנדקס (lib/seo/indexing.ts). הקורסים והתחומים מהקטלוג
 * שבמטמון, והמדריכים מהדיסק. לא כאן: האזור האישי, הניהול, כתיבת ביקורת, תחום בלי קורסים, וכרטיסי "בוגר מאומת"
 * (/verified), שלא נכנסים לחיפוש אף פעם.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return sitemapEntries({ catalog: await getCatalog(), guides: getGuides(), siteUrl: SITE_URL });
}
