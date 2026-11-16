import type { MetadataRoute } from 'next';
import type { Catalog, CategoryEntry } from '@/lib/search/types';

/**
 * מה נכנס למנועי חיפוש, ומה לא. מאז העלייה לציבור (16.11.2026) האתר פתוח לאינדוקס, חוץ מהעמודים כאן.
 *
 * שתי דרכים, ולא אחת:
 * - Disallow ב-robots.txt: נתיבים שאין בהם עמוד לקרוא בכלל (שרת, התחברות) או שמחזירים 404 לכל מי שאינו מנהל.
 * - noindex בעמוד עצמו (NOINDEX, או הכותרת X-Robots-Tag ב-proxy.ts ל-/verified): עמוד שמנוע חיפוש צריך לקרוא
 *   כדי לראות שאסור לאנדקס אותו. עמוד שחסום ב-robots.txt יכול להיכנס לתוצאות לפי קישורים בלבד, בלי שהמנוע ראה את ה-noindex.
 *
 * noindex: /me, /login, /review/new, כתיבת ביקורת על קורס (/courses/<slug>/review), "כל הביקורות" שעוד לא נבנה,
 * תחום בלי קורסים, ו-/verified (הכרטיס "בוגר מאומת", גם אחרי ההשקה). /admin גם noindex וגם חסום.
 */
export const ROBOTS_DISALLOW = ['/admin', '/api/', '/auth/'] as const;

/** לעמוד אישי, לטופס או לעמוד שעוד לא נבנה. */
export const NOINDEX = { index: false, follow: false } as const;

/** robots.txt: הכול פתוח חוץ מ-ROBOTS_DISALLOW, ומפת האתר מאותה כתובת ציבורית. */
export function robotsFor(siteUrl: string): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: [...ROBOTS_DISALLOW] },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

/**
 * תחום שיש בו לפחות קורס אחד ברשימות (בו או בתחום שמתחתיו). תחום ריק לא מופיע בניווט ולא במפת האתר,
 * והעמוד שלו noindex עם הסבר, כדי שמי שמגיע אליו מקישור ישן לא ייתקע (categories/[slug]/page.tsx).
 */
export const hasCourses = (category: Pick<CategoryEntry, 'courseCount'>): boolean => category.courseCount > 0;

/** העמודים הקבועים במפת האתר. לא כאן: השוואה וכתיבת ביקורת (כלי, לא תוכן), וכל מה שב-noindex. */
export const SITEMAP_PAGES = [
  '/',
  '/courses',
  '/career-change',
  '/guides',
  '/companies',
  '/request-course',
  '/institutions/join',
  '/method',
  '/who-pays-us',
  '/privacy',
  '/accessibility',
  '/terms',
] as const;

/**
 * מפת האתר: רק עמודים ציבוריים שמותר לאנדקס. כל כתובת מ-siteUrl (SITE_URL), כמו הכתובת הקנונית של העמוד.
 * הקורסים והתחומים מהקטלוג: רק מה שברשימות (active או maybe_inactive), ורק תחומים שיש בהם קורס.
 */
export function sitemapEntries({
  catalog,
  guides,
  siteUrl,
}: {
  catalog: Pick<Catalog, 'categories' | 'courses'>;
  guides: readonly { slug: string; checked: string }[];
  siteUrl: string;
}): MetadataRoute.Sitemap {
  const url = (path: string) => `${siteUrl}${path === '/' ? '' : path}`;
  return [
    ...SITEMAP_PAGES.map((path) => ({ url: url(path) })),
    ...guides.map((g) => ({ url: url(`/guides/${g.slug}`), lastModified: g.checked })),
    ...catalog.categories.filter(hasCourses).map((c) => ({ url: url(`/categories/${c.slug}`) })),
    ...catalog.courses.map((c) => ({ url: url(`/courses/${c.slug}`), lastModified: c.updatedAt })),
  ];
}
