import { describe, expect, it } from 'vitest';
import { safeHttpUrl } from './safe-url';

describe('safeHttpUrl', () => {
  it('returns an https URL unchanged', () => {
    expect(safeHttpUrl('https://example.com/a?b=1')).toBe('https://example.com/a?b=1');
  });
  it('rejects javascript: URLs', () => {
    expect(safeHttpUrl('javascript:alert(1)')).toBeNull();
  });
  it('rejects non-strings and unparseable strings', () => {
    expect(safeHttpUrl(undefined)).toBeNull();
    expect(safeHttpUrl(42)).toBeNull();
    expect(safeHttpUrl('not a url')).toBeNull();
  });
});
