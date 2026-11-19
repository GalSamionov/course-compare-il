import { describe, expect, it } from 'vitest';
import { matchKeywords, matchNames } from './keywords';
import type { CourseSummary } from './types';

const CATEGORIES = [
  { slug: 'technology', name: 'טכנולוגיה' },
  { slug: 'programming', name: 'תכנות' },
  { slug: 'ai-at-work', name: 'AI בעבודה ולפי מקצוע' },
  { slug: 'ai-automation', name: 'אוטומציות וסוכני AI' },
  { slug: 'ai-no-code', name: 'בניית אפליקציות בלי קוד' },
  { slug: 'ai-content', name: 'AI ליצירת תוכן ווידאו' },
  { slug: 'data-analysis', name: 'דאטה' },
  { slug: 'cyber', name: 'סייבר' },
  { slug: 'digital-marketing', name: 'שיווק דיגיטלי' },
  { slug: 'nails', name: 'ציפורניים ולק ג׳ל' },
  { slug: 'cooking', name: 'בישול' },
  { slug: 'photography', name: 'צילום' },
  { slug: 'psychometric', name: 'פסיכומטרי' },
  { slug: 'bookkeeping', name: 'הנהלת חשבונות' },
];

describe('matchKeywords', () => {
  it('finds the subject and the time in a free sentence', () => {
    expect(matchKeywords('קורס לבניית אתרים בערבים', CATEGORIES)).toEqual({
      categories: ['programming'],
      when: ['evening'],
      how: [],
      source: 'keywords',
    });
  });

  it('reads the weekend and the format, with an ASCII quote mark', () => {
    expect(matchKeywords('אפייה בסופ"ש, אונליין', CATEGORIES)).toEqual({
      categories: ['cooking'],
      when: ['weekend'],
      how: ['online'],
      source: 'keywords',
    });
  });

  it('ignores niqqud and matches a category name after a prefix', () => {
    expect(matchKeywords('לְהִתְכּוֹנֵן לַפְּסִיכוֹמֶטְרִי', CATEGORIES).categories).toEqual(['psychometric']);
  });

  it('tells the four AI categories apart, and plain "AI" goes to the general one', () => {
    expect(matchKeywords('קורס AI לעבודה', CATEGORIES).categories).toEqual(['ai-at-work']);
    expect(matchKeywords('לבנות סוכנים עם n8n', CATEGORIES).categories).toEqual(['ai-automation']);
    expect(matchKeywords('אפליקציה בלי קוד עם Lovable', CATEGORIES).categories).toEqual(['ai-no-code']);
    expect(matchKeywords('יצירת וידאו עם AI', CATEGORIES).categories).toEqual(['ai-at-work', 'ai-content']);
  });

  it('finds the new career categories by name and by common words', () => {
    expect(matchKeywords('להיות אנליסטית דאטה', CATEGORIES).categories).toEqual(['data-analysis']);
    expect(matchKeywords('קורס סייבר בערבים', CATEGORIES).categories).toEqual(['cyber']);
    expect(matchKeywords('קמפיינים בפייסבוק', CATEGORIES).categories).toEqual(['digital-marketing']);
    expect(matchKeywords("קורס לק ג'ל", CATEGORIES).categories).toEqual(['nails']);
  });

  it('does not match inside longer words', () => {
    expect(matchKeywords('ערבית למתחילים, שקודם כל', CATEGORIES)).toEqual({
      categories: [],
      when: [],
      how: [],
      source: 'keywords',
    });
  });
});

describe('matchNames', () => {
  const course = (slug: string, title: string, institutionName: string): CourseSummary => ({
    id: slug,
    slug,
    title,
    institutionName,
    categorySlug: 'cooking',
    categoryName: 'בישול',
    categoryParentSlug: null,
    courseType: 'hobby',
    productType: 'course',
    score: { status: 'none' },
    verifiedCount: 0,
    sitePrice: null,
    totalHours: null,
    durationMonths: null,
    sessionCount: null,
    region: null,
    institutionCity: null,
    certificate: null,
    nextCohortDate: null,
    formats: [],
    timeSlots: [],
    updatedAt: '2026-10-01T10:00:00+03:00',
    highlight: null,
  });
  const COURSES = [
    course('baking-sample', 'אפייה ביתית: לחמים ועוגות', 'בית ספר לבישול לדוגמה'),
    course('full-stack-sample', 'פיתוח Full Stack', 'מכללה לדוגמה'),
    course('ai-tools-sample', 'כלי AI לעבודה יומיומית', 'מכללה לדוגמה'),
  ];

  it('finds a course by its name, inside a sentence or slightly shortened', () => {
    expect(matchNames('קורס פיתוח full stack', COURSES)).toEqual({ by: 'title', courses: [COURSES[1]] });
    expect(matchNames('אפייה ביתית לחמים', COURSES)?.courses.map((c) => c.slug)).toEqual(['baking-sample']);
  });

  it('finds the courses of an institution, and leaves a subject word alone', () => {
    const byInstitution = matchNames('מכללה לדוגמה', COURSES);
    expect(byInstitution?.by).toBe('institution');
    expect(byInstitution?.courses.map((c) => c.slug)).toEqual(['full-stack-sample', 'ai-tools-sample']);
    expect(matchNames('אפייה', COURSES)).toBeNull();
  });
});
