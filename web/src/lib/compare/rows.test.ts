import { describe, expect, it } from 'vitest';
import { sampleCourse } from '@/lib/advisor/sample-course';
import { buildCompareRows, toCompareCourse, type CompareSection } from './rows';

const rowOf = (sections: CompareSection[], key: string) => sections.flatMap((s) => s.rows).find((r) => r.key === key);
const course = (overrides: Parameters<typeof sampleCourse>[0] = {}) => toCompareCourse(sampleCourse(overrides));

describe('buildCompareRows', () => {
  it('leaves out the score when no course in the comparison has a published review', () => {
    const a = course({ reviewTotal: 0, score: { status: 'none' }, outcome: null });
    const b = course({
      id: 'b',
      slug: 'b-sample',
      reviewTotal: 0,
      score: { status: 'not_enough_reviews', reviewCount: 0, reviewsNeeded: 5 },
      outcome: null,
    });
    expect(buildCompareRows([a, b]).map((s) => s.key)).not.toContain('score');
  });

  it('says a course has no reviews yet, next to a course with a score', () => {
    const scored = course({ score: { status: 'scored', value: 7.9, reviewCount: 23, recommendPct: 91, stale: false } });
    const none = course({ id: 'b', slug: 'b-sample', reviewTotal: 0, score: { status: 'none' } });
    expect(rowOf(buildCompareRows([scored, none]), 'score')?.cells[1]).toEqual({ text: null, missing: 'עוד אין ביקורות' });
  });

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

  it('puts an outcome in every bold line of "what happened", and how many answered under it', () => {
    const career = course({ outcome: { kind: 'after_3m', n: 14, mean: 3.7, question: 'אחרי 3 חודשים' } });
    const hobby = course({ id: 'b', slug: 'b-sample', outcome: { kind: 'skill_gained', yes: 8, n: 8 } });
    const none = course({ id: 'c', slug: 'c-sample', outcome: null });
    expect(rowOf(buildCompareRows([career, hobby, none]), 'outcome')?.cells).toEqual([
      { text: '3.7 מתוך 5 בשאלה ״אחרי 3 חודשים״', source: 'grads', sub: '14 בוגרים ענו 3 חודשים אחרי הסיום' },
      { text: '8 מתוך 8 אומרים שרכשו את המיומנות', source: 'grads' },
      { text: null, missing: 'עוד אין מספיק תשובות' },
    ]);
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
