import { describe, expect, it } from 'vitest';
import type { MatchResult } from './match';
import { marginNotes } from './notes';
import type { CourseSummary } from './types';

function row(slug: string, full: boolean, note: string, categorySlug = 'cooking'): MatchResult {
  const course = {
    slug,
    categorySlug,
    categoryName: categorySlug === 'cooking' ? 'בישול' : 'תכנות',
  } as CourseSummary;
  return { course, full, note };
}

describe('marginNotes', () => {
  it('writes a note shared by every full match once, and keeps the notes that differ', () => {
    const result = marginNotes([row('a', true, 'ערבים'), row('b', true, 'ערבים'), row('c', false, 'רק בסופ״ש')]);
    expect(result).toEqual({ shared: 'ערבים', sharedCount: 2, notes: ['', '', 'רק בסופ״ש'] });
  });

  it('keeps per-row notes when the full matches differ', () => {
    const result = marginNotes([row('a', true, 'ערבים'), row('b', true, 'בקרים')]);
    expect(result).toEqual({ shared: null, sharedCount: 0, notes: ['ערבים', 'בקרים'] });
  });

  it('names the subject of each course when nothing filters a list that spans subjects', () => {
    const result = marginNotes([row('a', true, '', 'cooking'), row('b', true, '', 'programming')]);
    expect(result.notes).toEqual(['בישול', 'תכנות']);
    expect(marginNotes([row('a', true, ''), row('b', true, '')]).notes).toEqual(['', '']);
  });
});
