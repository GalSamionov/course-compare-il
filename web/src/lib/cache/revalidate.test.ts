import { describe, expect, it } from 'vitest';
import { ALWAYS_TAGS, bearerToken, tagsFromBody, tokenMatches } from './revalidate';

describe('tagsFromBody', () => {
  it('refreshes the catalog, the numbers, and each course once', () => {
    expect(tagsFromBody('{"courses":["full-stack-sample","baking-sample","full-stack-sample"]}')).toEqual([
      ...ALWAYS_TAGS,
      'course:full-stack-sample',
      'course:baking-sample',
    ]);
    expect(tagsFromBody('{"courses":[]}')).toEqual([...ALWAYS_TAGS]);
  });

  it('refuses anything that is not a short list of course addresses', () => {
    const tooMany = JSON.stringify({ courses: Array.from({ length: 501 }, (_, i) => `c-${i}`) });
    for (const raw of [
      '',
      'nope',
      'null',
      '{}',
      '{"courses":"all"}',
      '{"courses":["Full"]}',
      '{"courses":["a_b"]}',
      '{"courses":["../catalog"]}',
      '{"courses":[1]}',
      `{"courses":["${'a'.repeat(121)}"]}`,
      tooMany,
    ]) {
      expect(tagsFromBody(raw), raw.slice(0, 40)).toBeNull();
    }
  });
});

describe('the token', () => {
  it('matches only the whole token, and never a short one', () => {
    const token = 'k'.repeat(40);
    expect(tokenMatches(token, token)).toBe(true);
    expect(tokenMatches(`${token}x`, token)).toBe(false);
    expect(tokenMatches('', token)).toBe(false);
    expect(tokenMatches('short', 'short')).toBe(false);
  });

  it('is read from a Bearer header only', () => {
    expect(bearerToken('Bearer abc')).toBe('abc');
    expect(bearerToken('bearer abc')).toBe('');
    expect(bearerToken('Basic abc')).toBe('');
    expect(bearerToken(null)).toBe('');
  });
});
