import { describe, expect, it } from 'vitest';
import { suggestInstitution, urlHost } from './institution-match';

const INSTITUTIONS = [
  { id: 'prep', name: 'מכון הכנה לדוגמה', website: 'https://example.com/prep' },
  { id: 'college', name: 'מכללה לדוגמה', website: 'https://example.com' },
  { id: 'kitchen', name: 'בית ספר לבישול לדוגמה', website: 'https://www.example.org/' },
];

describe('urlHost', () => {
  it('lowercases and drops www, like private.url_host', () => {
    expect(urlHost('https://WWW.Example.org/a')).toBe('example.org');
    expect(urlHost('not a url')).toBeNull();
  });
});

describe('suggestInstitution', () => {
  it('on a shared host, prefers the institution whose site path the link is under', () => {
    expect(suggestInstitution({ institutionName: 'משהו אחר', courseUrl: 'https://example.com/prep/math' }, INSTITUTIONS)).toBe('prep');
    expect(suggestInstitution({ institutionName: 'משהו אחר', courseUrl: 'https://example.com/courses/ux' }, INSTITUTIONS)).toBe('college');
  });

  it('prefers the same name over the path', () => {
    expect(suggestInstitution({ institutionName: 'מכון הכנה לדוגמה', courseUrl: 'https://example.com/courses/ux' }, INSTITUTIONS)).toBe('prep');
  });

  it('matches with or without www, and suggests nothing for another host', () => {
    expect(suggestInstitution({ institutionName: 'x', courseUrl: 'https://example.org/bread' }, INSTITUTIONS)).toBe('kitchen');
    expect(suggestInstitution({ institutionName: 'x', courseUrl: 'https://clay.example/a' }, INSTITUTIONS)).toBeNull();
  });
});
