import { describe, expect, it, vi } from 'vitest';
import { CAREER_QUESTIONS, resolveQuestions } from '@/lib/career/questions';
import {
  isTechCategory,
  longEnough,
  selectCareerChange,
  techCategoryIds,
  type CategoryRow,
  type CourseCandidate,
} from './career-change';

// המודול טוען עמודי קורס מהמטמון של Next. כאן נבדקת רק הבחירה, בלי מסד ובלי מטמון.
vi.mock('next/cache', () => ({ cacheLife: () => {}, cacheTag: () => {} }));

const CATEGORIES: CategoryRow[] = [
  { id: 'tech', slug: 'technology', parentId: null, courseType: 'career' },
  { id: 'prog', slug: 'programming', parentId: 'tech', courseType: 'career' },
  { id: 'ai', slug: 'ai', parentId: 'tech', courseType: 'career' },
  // נכד: תחום חדש מתחת לתכנות, כמו שהאוסף יכול לפתוח.
  { id: 'qa', slug: 'qa', parentId: 'prog', courseType: 'career' },
  // תחום תחביב בתוך טכנולוגיה: לא הסבה.
  { id: 'maker', slug: 'maker', parentId: 'tech', courseType: 'hobby' },
  { id: 'cook', slug: 'cooking', parentId: null, courseType: 'hobby' },
  { id: 'biz', slug: 'business', parentId: null, courseType: 'career' },
];

const course = (over: Partial<CourseCandidate> & { slug: string }): CourseCandidate => ({
  categoryId: 'prog',
  productType: 'course',
  status: 'active',
  totalHours: 400,
  durationMonths: 8,
  ...over,
});

describe('techCategoryIds', () => {
  it('takes technology and everything under it, at any depth', () => {
    expect([...techCategoryIds(CATEGORIES)].sort()).toEqual(['ai', 'maker', 'prog', 'qa', 'tech']);
  });

  it('is empty when there is no technology category', () => {
    expect(techCategoryIds(CATEGORIES.filter((c) => c.slug !== 'technology')).size).toBe(0);
  });

  it('stops on a loop in the data instead of hanging', () => {
    const loop: CategoryRow[] = [
      { id: 'tech', slug: 'technology', parentId: 'x', courseType: 'career' },
      { id: 'x', slug: 'x', parentId: 'tech', courseType: 'career' },
    ];
    expect([...techCategoryIds(loop)].sort()).toEqual(['tech', 'x']);
  });
});

describe('longEnough', () => {
  it('uses hours first: 100 and up', () => {
    expect(longEnough({ totalHours: 100, durationMonths: 1 })).toBe(true);
    expect(longEnough({ totalHours: 96, durationMonths: 4 })).toBe(false);
  });

  it('falls back to months when the hours are unknown: 3 and up', () => {
    expect(longEnough({ totalHours: null, durationMonths: 3 })).toBe(true);
    expect(longEnough({ totalHours: null, durationMonths: 2.5 })).toBe(false);
  });

  it('keeps a course whose length the institution did not publish', () => {
    expect(longEnough({ totalHours: null, durationMonths: null })).toBe(true);
  });
});

describe('selectCareerChange', () => {
  it('keeps long career courses in the tech categories, and nothing else', () => {
    const picked = selectCareerChange(CATEGORIES, [
      course({ slug: 'full-stack' }),
      course({ slug: 'qa-course', categoryId: 'qa', totalHours: 180 }),
      course({ slug: 'data', categoryId: 'ai', totalHours: 120 }),
      course({ slug: 'unknown-length', totalHours: null, durationMonths: null }),
      course({ slug: 'maybe-inactive', status: 'maybe_inactive' }),
      // לא:
      course({ slug: 'short', categoryId: 'ai', totalHours: 24, durationMonths: 2 }),
      course({ slug: 'workshop', categoryId: 'ai', productType: 'workshop', totalHours: 160 }),
      course({ slug: 'lecture', productType: 'lecture' }),
      course({ slug: 'hobby-in-tech', categoryId: 'maker' }),
      course({ slug: 'cooking', categoryId: 'cook' }),
      course({ slug: 'business', categoryId: 'biz' }),
      course({ slug: 'removed', status: 'removed' }),
      course({ slug: 'draft', status: 'draft' }),
      course({ slug: 'no-category', categoryId: 'gone' }),
    ]);
    expect(picked).toEqual(['full-stack', 'qa-course', 'data', 'unknown-length', 'maybe-inactive']);
  });

  it('matches the sample data: Full Stack, web basics and Python data, not the short ones or the workshop', () => {
    const picked = selectCareerChange(CATEGORIES, [
      course({ slug: 'full-stack-sample', totalHours: 420, durationMonths: 8 }),
      course({ slug: 'ai-tools-sample', categoryId: 'ai', totalHours: 24, durationMonths: 2 }),
      course({ slug: 'web-basics-sample', totalHours: 180, durationMonths: 6 }),
      course({ slug: 'react-frontend-sample', totalHours: 96, durationMonths: 4 }),
      course({ slug: 'python-data-sample', categoryId: 'ai', totalHours: 120, durationMonths: 3 }),
      course({ slug: 'ai-weekend-sample', categoryId: 'ai', productType: 'workshop', totalHours: 16, durationMonths: 1 }),
    ]);
    expect(picked).toEqual(['full-stack-sample', 'web-basics-sample', 'python-data-sample']);
  });

  it('is empty without a technology category', () => {
    expect(selectCareerChange(CATEGORIES.slice(5), [course({ slug: 'x', categoryId: 'cook' })])).toEqual([]);
  });
});

describe('isTechCategory', () => {
  const parent = new Map(CATEGORIES.map((c) => [c.slug, CATEGORIES.find((p) => p.id === c.parentId)?.slug ?? null]));
  const parentOf = (slug: string) => parent.get(slug) ?? null;

  it('is true for technology and anything under it', () => {
    expect(['technology', 'programming', 'ai', 'qa'].map((s) => isTechCategory(s, parentOf))).toEqual([true, true, true, true]);
  });

  it('is false for other categories', () => {
    expect(['cooking', 'business', 'nothing'].map((s) => isTechCategory(s, parentOf))).toEqual([false, false, false]);
  });
});

describe('career questions', () => {
  it('link each question to a section that exists in the guides', () => {
    const resolved = resolveQuestions();
    expect(resolved).toHaveLength(CAREER_QUESTIONS.length);
    for (const q of resolved) expect(q.href).toMatch(/^\/guides\/[a-z0-9-]+#part-\d+$/);
    expect(resolved[0].href).toBe('/guides/questions-before-signing-up#part-1');
  });

  it('fail loudly when a section was renamed', () => {
    expect(() => resolveQuestions([{ text: 'x', guide: 'questions-before-signing-up', section: 'אין פרק כזה' }])).toThrow(
      /no section/,
    );
    expect(() => resolveQuestions([{ text: 'x', guide: 'no-such-guide', section: 'x' }])).toThrow(/no guide/);
  });
});
