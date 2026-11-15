import { describe, expect, it } from 'vitest';
import { safeNextPath } from './next-path';

describe('safeNextPath', () => {
  it('keeps a path on this site, with its query and hash', () => {
    expect(safeNextPath('/courses/baking-sample')).toBe('/courses/baking-sample');
    expect(safeNextPath('/?cat=cooking&when=evening')).toBe('/?cat=cooking&when=evening');
    expect(safeNextPath('/me#saved')).toBe('/me#saved');
  });

  it('sends anything else to the home page', () => {
    for (const raw of [
      null,
      '',
      'me',
      'https://evil.example',
      'javascript:alert(1)',
      '//evil.example',
      '/\\evil.example',
      '/\t/evil.example',
      '/.//evil.example',
      '/login?next=/me',
      '/auth/callback',
      `/${'a'.repeat(1001)}`,
    ]) {
      expect(safeNextPath(raw), String(raw)).toBe('/');
    }
  });
});
