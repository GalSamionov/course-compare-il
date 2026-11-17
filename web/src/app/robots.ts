import type { MetadataRoute } from 'next';
import { robotsFor } from '@/lib/seo/indexing';
import { SITE_URL } from '@/lib/site';

/** /robots.txt: הכול פתוח לסריקה חוץ מהניהול, השרת וההתחברות, ומפת האתר (lib/seo/indexing.ts). */
export default function robots(): MetadataRoute.Robots {
  return robotsFor(SITE_URL);
}
