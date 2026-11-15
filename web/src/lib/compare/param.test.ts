import { describe, expect, it } from 'vitest';
import { compareHref, parseCompareParam, pickCompared, slotsLeftText } from './param';

describe('parseCompareParam', () => {
  it('reads the slugs in the order of the link', () => {
    expect(parseCompareParam('full-stack-sample,baking-sample')).toEqual(['full-stack-sample', 'baking-sample']);
  });

  it('drops spaces, capitals, repeats and anything that is not a slug, and keeps at most 3', () => {
    expect(parseCompareParam(' Full-Stack-Sample , baking-sample,full-stack-sample')).toEqual([
      'full-stack-sample',
      'baking-sample',
    ]);
    expect(parseCompareParam('../admin,a b,,ok-1,<x>')).toEqual(['ok-1']);
    expect(parseCompareParam('a,b,c,d')).toEqual(['a', 'b', 'c']);
    expect(parseCompareParam(null)).toEqual([]);
  });

  it('reads back the link it builds, also when the commas are encoded', () => {
    const href = compareHref(['a-sample', 'b-sample']);
    expect(href).toBe('/compare?c=a-sample,b-sample');
    expect(parseCompareParam(new URL(href, 'https://example.com').searchParams.get('c'))).toEqual(['a-sample', 'b-sample']);
    expect(parseCompareParam(new URLSearchParams('c=a-sample%2Cb-sample').get('c'))).toEqual(['a-sample', 'b-sample']);
  });
});

describe('pickCompared', () => {
  const courses = [
    { id: '1', slug: 'a' },
    { id: '2', slug: 'b' },
  ];

  it('keeps the order of the link or the tray, and reports what is no longer on the site', () => {
    expect(pickCompared(courses, { slugs: ['b', 'gone', 'a'] })).toEqual({ chosen: [courses[1], courses[0]], missing: ['gone'] });
    expect(pickCompared(courses, { ids: ['2', '9'] })).toEqual({ chosen: [courses[1]], missing: ['9'] });
  });
});

describe('slotsLeftText', () => {
  it('says how many places are left', () => {
    expect([0, 1, 2, 3].map((n) => slotsLeftText(n))).toEqual([
      'נשארו 3 מקומות',
      'נשארו 2 מקומות',
      'נשאר מקום אחד',
      'ההשוואה מלאה',
    ]);
  });
});
