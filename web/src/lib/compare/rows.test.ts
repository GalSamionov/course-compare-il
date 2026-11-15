import { describe, expect, it } from 'vitest';
import { sampleCourse } from '@/lib/advisor/sample-course';
import { buildCompareRows, toCompareCourse, type CompareSection } from './rows';

const rowOf = (sections: CompareSection[], key: string) => sections.flatMap((s) => s.rows).find((r) => r.key === key);
const course = (overrides: Parameters<typeof sampleCourse>[0] = {}) => toCompareCourse(sampleCourse(overrides));

describe('buildCompareRows', () => {
  it('marks each cell with the same source as the course page', () => {
    const sections = buildCompareRows([course()]);
    expect(rowOf(sections, 'paid')?.cells[0]).toEqual({
      text: 'בין 2,000 ל-4,000 ₪',
      source: 'verified',
      sub: 'לפי 5 חשבוניות ומעלה',
    });
    expect(rowOf(sections, 'duration')?.cells[0]).toEqual({
      text: '2 חודשים, 24 שעות',
      source: 'verified',
      sub: 'מהן 18 שעות עשייה',
    });
    expect(rowOf(sections, 'good')?.cells[0]).toEqual({ text: 'הרבה עבודה בידיים', source: 'grads' });
    expect(rowOf(sections, 'weak')?.cells[0]).toEqual({ text: 'המחמצת קצרה מדי', source: 'weak' });
    expect(rowOf(sections, 'classSize')?.cells[0]).toEqual({ text: 'עד 12 משתתפים', source: 'claim' });
    expect(rowOf(sections, 'promises')?.cells[0]).toEqual({ text: 'כל משתתף יוצא עם מחמצת משלו', source: 'claim' });
    expect(rowOf(sections, 'sitePrice')?.cells[0]).toEqual({ text: '1,200 ₪' });
  });

  it('falls back to the weak chapter of the syllabus, like "בקצרה"', () => {
    expect(rowOf(buildCompareRows([course({ summaryWeak: null })]), 'weak')?.cells[0]).toEqual({
      lead: 'פרק חלש:',
      text: 'מחמצת',
      source: 'weak',
    });
  });

  it('shows the score with the verified count, or how many reviews are missing', () => {
    const scored = course({ score: { status: 'scored', value: 7.9, reviewCount: 23, recommendPct: 91, stale: false } });
    const waiting = course({
      id: 'b',
      slug: 'b-sample',
      score: { status: 'not_enough_reviews', reviewCount: 3, reviewsNeeded: 2 },
    });
    const sections = buildCompareRows([scored, waiting]);
    expect(rowOf(sections, 'score')?.cells).toEqual([
      { text: '7.9', big: true, sub: '23 בוגרים מאומתים' },
      { text: 'עוד אין ציון', sub: '3 ביקורות מאומתות, עוד 2 ביקורות עד לציון' },
    ]);
    expect(rowOf(sections, 'recommend')?.cells).toEqual([{ text: '91%' }, { text: null, missing: 'עוד אין ציון' }]);
  });

  it('keeps one row per question across the courses, and says when a course has no answer yet', () => {
    const a = course({ metrics: [{ key: 'teaching', label: 'איכות הוראה', mean: 4.2, n: 6 }] });
    const b = course({
      id: 'b',
      slug: 'b-sample',
      metrics: [
        { key: 'teaching', label: 'איכות הוראה', mean: 3.8, n: 6 },
        { key: 'value', label: 'ערך לכסף', mean: 4, n: 6 },
      ],
    });
    const metrics = buildCompareRows([a, b]).find((s) => s.key === 'metrics');
    expect(metrics?.rows.map((r) => r.label)).toEqual(['איכות הוראה', 'ערך לכסף']);
    expect(metrics?.rows[1].cells).toEqual([
      { text: null, missing: 'אין עדיין' },
      { text: '4.0', source: 'grads', bar: 4 },
    ]);
  });

  it('drops a row that no course has, and keeps a row that one course has', () => {
    const a = course({ admission: null, certificate: 'תעודת סיום' });
    const b = course({ id: 'b', slug: 'b-sample', admission: null, certificate: null });
    const keys = buildCompareRows([a, b]).flatMap((s) => s.rows.map((r) => r.key));
    expect(keys).not.toContain('admission');
    expect(keys).toContain('certificate');
  });

  it('links each lecturer to their page, with the role', () => {
    const c = course({
      lecturers: [{ slug: 'yael-sample', name: 'יעל', role: 'מרצה', institutionBio: null, verifiedFacts: [], otherCoursesCount: 0 }],
    });
    expect(rowOf(buildCompareRows([c]), 'lecturers')?.cells[0]).toEqual({
      text: 'יעל',
      links: [{ href: '/lecturers/yael-sample', label: 'יעל', sub: 'מרצה' }],
    });
  });
});
