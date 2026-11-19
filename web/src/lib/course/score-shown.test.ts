import { describe, expect, it } from 'vitest';
import { showsScore } from './score-shown';

describe('showsScore', () => {
  it('hides the score until a course has one published review', () => {
    expect(showsScore(0)).toBe(false);
    expect(showsScore(1)).toBe(true);
    expect(showsScore(23)).toBe(true);
  });
});
