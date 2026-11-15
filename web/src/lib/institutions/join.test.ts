import { describe, expect, it } from 'vitest';
import { normalizeCourseUrl, parseJoinForm } from './join';

const form = (entries: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.set(key, value);
  return data;
};

describe('normalizeCourseUrl', () => {
  it('adds https to a bare address and drops the fragment', () => {
    expect(normalizeCourseUrl(' www.example.co.il/courses/design#price ')).toBe('https://www.example.co.il/courses/design');
    expect(normalizeCourseUrl('http://example.co.il/a?b=1')).toBe('http://example.co.il/a?b=1');
  });

  it('refuses what is not a page on an institution site', () => {
    for (const bad of [
      'javascript:alert(1)',
      'ftp://example.co.il/file',
      'https://user:pass@example.co.il/',
      'https://evil.example@example.co.il/',
      'http://127.0.0.1/admin',
      'http://localhost:3000/',
      'https://[::1]/',
      'not a url',
      'intranet/page',
      `https://example.co.il/${'a'.repeat(500)}`,
    ]) {
      expect(normalizeCourseUrl(bad), bad).toBeNull();
    }
  });
});

describe('parseJoinForm', () => {
  it('cleans the values', () => {
    expect(
      parseJoinForm(form({ institutionName: '  מכללה   לדוגמה ', courseUrl: 'example.co.il/c', contactEmail: ' Info@Example.co.il ' })),
    ).toEqual({
      ok: true,
      values: { institutionName: 'מכללה לדוגמה', courseUrl: 'https://example.co.il/c', contactEmail: 'info@example.co.il' },
    });
  });

  it('accepts only a plain email, so the admin mailto link cannot carry a subject or body', () => {
    const base = { institutionName: 'מכללה לדוגמה', courseUrl: 'example.co.il/c' };
    expect(parseJoinForm(form({ ...base, contactEmail: 'first.last+courses@mail.example.co.il' })).ok).toBe(true);
    for (const bad of ['a@b.co?subject=x', 'a@b.co&body=x', 'a@b.co#x', 'a b@c.co', 'a@b']) {
      expect(parseJoinForm(form({ ...base, contactEmail: bad })).ok, bad).toBe(false);
    }
  });

  it('says what is missing, field by field', () => {
    const result = parseJoinForm(form({ institutionName: 'א', courseUrl: 'nope', contactEmail: 'no-at-sign' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.errors).sort()).toEqual(['contactEmail', 'courseUrl', 'institutionName']);
  });
});
