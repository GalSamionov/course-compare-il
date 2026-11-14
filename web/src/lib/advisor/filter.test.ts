import { describe, expect, it } from 'vitest';
import { filterAdvice } from './filter';

const SLUGS = ['baking-sample', 'bread-sample'];

describe('filterAdvice', () => {
  it('keeps only sentences with a known source, about a course in the list', () => {
    const advice = filterAdvice(
      {
        sentences: [
          { text: 'נמשך חודשיים.', source: 'verified', courseSlug: 'baking-sample' },
          { text: 'הבוגרים אהבו את העבודה בידיים.', source: 'graduates', courseSlug: '' },
          { text: 'מבטיח מחמצת לכל משתתף.', source: 'institution', courseSlug: 'bread-sample' },
          { text: 'חלש במחמצת.', source: 'weak', courseSlug: 'baking-sample' },
          { text: 'בלי מקור.', courseSlug: 'baking-sample' },
          { text: 'קורס שלא ברשימה.', source: 'verified', courseSlug: 'other-sample' },
          { text: '   ', source: 'verified', courseSlug: '' },
        ],
        notEnoughInfo: false,
        missing: '',
      },
      SLUGS,
    );
    expect(advice).toEqual({
      sentences: [
        { text: 'נמשך חודשיים.', source: 'verified', courseSlug: 'baking-sample' },
        { text: 'הבוגרים אהבו את העבודה בידיים.', source: 'graduates', courseSlug: null },
        { text: 'מבטיח מחמצת לכל משתתף.', source: 'institution', courseSlug: 'bread-sample' },
      ],
      notEnoughInfo: false,
      missing: null,
    });
  });

  it('keeps the note on what is missing, and counts it as not enough information', () => {
    const advice = filterAdvice(
      { sentences: [], notEnoughInfo: false, missing: '  אין לנו מספיק ביקורות על העומס.  ' },
      SLUGS,
    );
    expect(advice).toEqual({ sentences: [], notEnoughInfo: true, missing: 'אין לנו מספיק ביקורות על העומס.' });
  });

  it('shows at most 8 sentences', () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ text: `משפט ${i}.`, source: 'verified', courseSlug: '' }));
    expect(filterAdvice({ sentences: many, notEnoughInfo: false, missing: '' }, SLUGS).sentences).toHaveLength(8);
  });

  it('returns an empty answer for anything that is not an answer', () => {
    const empty = { sentences: [], notEnoughInfo: false, missing: null };
    expect(filterAdvice(null, SLUGS)).toEqual(empty);
    expect(filterAdvice('טקסט', SLUGS)).toEqual(empty);
    expect(filterAdvice({ sentences: 'לא מערך' }, SLUGS)).toEqual(empty);
  });
});
