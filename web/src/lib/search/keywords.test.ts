import { describe, expect, it } from 'vitest';
import { matchKeywords, matchNames } from './keywords';
import type { CourseSummary } from './types';

const CATEGORIES = [
  { slug: 'technology', name: 'טכנולוגיה' },
  { slug: 'programming', name: 'תכנות' },
  { slug: 'ai', name: 'בינה מלאכותית' },
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
