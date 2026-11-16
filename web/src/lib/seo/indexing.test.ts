import { describe, expect, it } from 'vitest';
import type { CategoryEntry, CourseSummary } from '@/lib/search/types';
import { NOINDEX, ROBOTS_DISALLOW, hasCourses, robotsFor, sitemapEntries } from './indexing';

const SITE = 'https://lamadti.example';

const category = (slug: string, courseCount: number, parentSlug: string | null = null): CategoryEntry => ({
  slug,
  name: slug,
  parentSlug,
  isLeaf: true,
  courseCount,
  gradCount: 0,
});

const course = (slug: string, updatedAt: string) => ({ slug, updatedAt }) as CourseSummary;

describe('hasCourses', () => {
  it('is true only for a category with at least one listed course', () => {
    expect(hasCourses({ courseCount: 2 })).toBe(true);
    expect(hasCourses({ courseCount: 1 })).toBe(true);
    expect(hasCourses({ courseCount: 0 })).toBe(false);
  });
});

describe('robotsFor', () => {
  it('opens the site, closes the admin, the server and the login callback, and points at the sitemap', () => {
    expect(robotsFor(SITE)).toEqual({
      rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api/', '/auth/'] },
      sitemap: `${SITE}/sitemap.xml`,
    });
  });

  it('does not block pages that must be crawled to see their noindex', () => {
    // /verified (כותרת noindex), /me, /login ו-/review/new (meta noindex): חסימה הייתה מסתירה את ה-noindex מהמנוע.
    for (const path of ['/verified/', '/me', '/login', '/review/new', '/courses/']) {
      expect(ROBOTS_DISALLOW.some((rule) => path.startsWith(rule))).toBe(false);
    }
  });

  it('keeps private pages out of the index without following their links', () => {
    expect(NOINDEX).toEqual({ index: false, follow: false });
  });
});

describe('sitemapEntries', () => {
  const entries = sitemapEntries({
    catalog: {
      categories: [category('technology', 2), category('programming', 0, 'technology'), category('ai', 2, 'technology')],
      courses: [course('real-course-a', '2026-11-10T10:00:00Z'), course('real-course-b', '2026-11-12T10:00:00Z')],
    },
    guides: [{ slug: 'how-to-read-a-syllabus', checked: '2026-11-15' }],
    siteUrl: SITE,
  });
  const urls = entries.map((e) => e.url);

  it('builds every address from the public site address', () => {
    expect(urls.every((u) => u.startsWith(SITE))).toBe(true);
    expect(urls).toContain(SITE);
    expect(urls).toContain(`${SITE}/courses`);
  });

  it('lists categories with courses, and leaves out an empty one', () => {
    expect(urls).toContain(`${SITE}/categories/technology`);
    expect(urls).toContain(`${SITE}/categories/ai`);
    expect(urls).not.toContain(`${SITE}/categories/programming`);
  });

  it('lists every listed course and guide, with the date it last changed', () => {
    expect(entries).toContainEqual({ url: `${SITE}/courses/real-course-a`, lastModified: '2026-11-10T10:00:00Z' });
    expect(entries).toContainEqual({ url: `${SITE}/courses/real-course-b`, lastModified: '2026-11-12T10:00:00Z' });
    expect(entries).toContainEqual({ url: `${SITE}/guides/how-to-read-a-syllabus`, lastModified: '2026-11-15' });
  });

  it('never lists a private, tool or noindex page', () => {
    for (const path of ['/admin', '/me', '/login', '/auth', '/api', '/verified', '/review', '/compare']) {
      expect(urls.some((u) => u === `${SITE}${path}` || u.startsWith(`${SITE}${path}/`))).toBe(false);
    }
  });

  it('lists each address once', () => {
    expect(new Set(urls).size).toBe(urls.length);
  });
});
