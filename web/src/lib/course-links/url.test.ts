import { describe, expect, it } from 'vitest';
import { findLikelyCourse, sameInstitution } from './match';
import { courseTitleKey, courseUrlKey, isSocialUrl, normalizeCourseLink } from './url';

describe('normalizeCourseLink', () => {
  it('adds https, drops the fragment and keeps the query that identifies the course', () => {
    expect(normalizeCourseLink(' www.example.co.il/courses/nails#price ')).toBe('https://www.example.co.il/courses/nails');
    expect(normalizeCourseLink('http://example.co.il/course?ContentID=143')).toBe('http://example.co.il/course?ContentID=143');
  });

  it('removes ad tracking parameters', () => {
    expect(
      normalizeCourseLink('https://dana.example/gel?utm_source=facebook&utm_medium=paid&fbclid=IwAR0abc&id=7&gclid=x'),
    ).toBe('https://dana.example/gel?id=7');
    expect(normalizeCourseLink('https://www.instagram.com/p/Cx1/?igsh=abc&utm_campaign=x')).toBe(
      'https://www.instagram.com/p/Cx1/',
    );
  });

  it('unwraps the Facebook and Instagram outbound redirect, once', () => {
    const inner = encodeURIComponent('https://ai-course.example/landing?utm_source=fb');
    expect(normalizeCourseLink(`https://l.facebook.com/l.php?u=${inner}&h=AT0`)).toBe('https://ai-course.example/landing');
    expect(normalizeCourseLink(`https://l.instagram.com/?u=${inner}`)).toBe('https://ai-course.example/landing');
    const nested = encodeURIComponent(`https://l.facebook.com/l.php?u=${inner}`);
    expect(normalizeCourseLink(`https://l.facebook.com/l.php?u=${nested}`)).toBeNull();
    expect(normalizeCourseLink(`https://l.facebook.com/l.php?u=${encodeURIComponent('javascript:alert(1)')}`)).toBeNull();
  });

  it('maps the mobile Facebook hosts to www.facebook.com', () => {
    expect(normalizeCourseLink('https://m.facebook.com/dana.nails/posts/1')).toBe('https://www.facebook.com/dana.nails/posts/1');
  });

  it('encodes @ in the path, since the database refuses any @', () => {
    expect(normalizeCourseLink('https://www.tiktok.com/@dana.nails/video/1')).toBe(
      'https://www.tiktok.com/%40dana.nails/video/1',
    );
  });

  it('drops a trailing dot in the host before any check', () => {
    const url = normalizeCourseLink('https://www.facebook.com./dana');
    expect(url).toBe('https://www.facebook.com/dana');
    expect(isSocialUrl(url!)).toBe(true);
    expect(normalizeCourseLink('http://localhost./')).toBeNull();
  });

  it('refuses what is not a web page', () => {
    for (const bad of [
      '',
      '   ',
      'javascript:alert(1)',
      'JavaScript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'ftp://example.co.il/file',
      'mailto:a@example.co.il',
      'https://user:pass@example.co.il/',
      'https://evil.example@example.co.il/',
      'http://127.0.0.1/admin',
      'http://localhost:3000/',
      'http://app.localhost/',
      'https://[::1]/',
      'not a url',
      'intranet/page',
      `https://example.co.il/${'a'.repeat(500)}`,
    ]) {
      expect(normalizeCourseLink(bad), bad).toBeNull();
    }
  });
});

describe('isSocialUrl', () => {
  it('knows the social networks, with or without a subdomain', () => {
    for (const url of [
      'https://www.facebook.com/dana',
      'https://m.facebook.com/dana',
      'https://fb.me/abc',
      'https://www.instagram.com/p/1',
      'https://www.tiktok.com/%40dana',
      'https://youtu.be/abc',
      'https://linktr.ee/dana',
    ]) {
      expect(isSocialUrl(url), url).toBe(true);
    }
  });

  it('does not mistake a site that only contains the name', () => {
    expect(isSocialUrl('https://notfacebook.com/x')).toBe(false);
    expect(isSocialUrl('https://dana.wixsite.com/nails')).toBe(false);
    expect(isSocialUrl('https://facebook.com.evil.example/x')).toBe(false);
  });
});

describe('courseUrlKey (like private.course_url_key)', () => {
  it('treats scheme, www, a trailing slash, the fragment and case as the same link', () => {
    const key = 'example.co.il/courses/python';
    for (const url of [
      'https://www.example.co.il/courses/python/',
      'http://example.co.il/courses/python',
      'https://Example.co.il/Courses/Python#price',
      'https://www.example.co.il/courses/python//',
    ]) {
      expect(courseUrlKey(url), url).toBe(key);
    }
  });

  it('decodes Hebrew paths, and keeps the query', () => {
    expect(courseUrlKey('https://example.co.il/%D7%A7%D7%95%D7%A8%D7%A1/')).toBe('example.co.il/קורס');
    expect(courseUrlKey('https://example.co.il/course/?id=7')).toBe('example.co.il/course?id=7');
    expect(courseUrlKey('https://example.co.il/a%ZZ')).toBe('example.co.il/a%zz');
  });
});

describe('courseTitleKey (like private.course_title_key)', () => {
  it('ignores punctuation, spacing and case, in Hebrew too', () => {
    expect(courseTitleKey('Python - למתחילים!')).toBe('python למתחילים');
    expect(courseTitleKey('  לק ג׳ל   למתחילות ')).toBe('לק ג ל למתחילות');
    expect(courseTitleKey('!!!')).toBeNull();
  });
});

describe('duplicate detection', () => {
  const catalog = [
    { slug: 'gel-basic', title: 'לק ג׳ל למתחילות', institutionName: 'סטודיו דנה לדוגמה' },
    { slug: 'python', title: 'פייתון למתחילים', institutionName: 'מכללה לדוגמה' },
  ];

  it('finds the same title at the same institution, however it is written', () => {
    expect(findLikelyCourse({ title: 'לק-ג׳ל למתחילות', institutionName: 'דנה לדוגמה' }, catalog)?.slug).toBe('gel-basic');
    expect(findLikelyCourse({ title: 'פייתון, למתחילים', institutionName: 'מכללה  לדוגמה' }, catalog)?.slug).toBe('python');
  });

  it('does not match the same title at another institution, or a different title', () => {
    expect(findLikelyCourse({ title: 'פייתון למתחילים', institutionName: 'בית ספר אחר' }, catalog)).toBeNull();
    expect(findLikelyCourse({ title: 'פייתון מתקדם', institutionName: 'מכללה לדוגמה' }, catalog)).toBeNull();
    expect(findLikelyCourse({ title: '', institutionName: 'מכללה לדוגמה' }, catalog)).toBeNull();
  });

  it('compares institutions by their words, not by substrings', () => {
    expect(sameInstitution('מכללת קישורים לדוגמה', 'קישורים לדוגמה')).toBe(true);
    expect(sameInstitution('AI Academy', 'ai')).toBe(true);
    expect(sameInstitution('Maia', 'ai')).toBe(false);
    expect(sameInstitution('!!', 'מכללה')).toBe(false);
  });
});
