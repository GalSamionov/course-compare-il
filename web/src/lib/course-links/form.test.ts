import { describe, expect, it } from 'vitest';
import { parseCourseLinkForm, parseCourseRequestForm } from './form';
import { adminMessage, submitMessage } from './messages';

const form = (entries: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.set(key, value);
  return data;
};

describe('parseCourseLinkForm', () => {
  it('accepts a link, the names, and a category', () => {
    const result = parseCourseLinkForm(
      form({
        url: ' facebook.com/dana.nails/posts/1?fbclid=x ',
        title: '  לק ג׳ל   למתחילות ',
        institutionName: 'דנה ',
        category: 'nails',
        courseKind: 'career',
      }),
    );
    expect(result).toEqual({
      ok: true,
      values: {
        url: 'https://facebook.com/dana.nails/posts/1',
        title: 'לק ג׳ל למתחילות',
        institutionName: 'דנה',
        categorySlug: 'nails',
        courseType: null,
      },
    });
  });

  it('takes the course kind when there is no matching category', () => {
    const result = parseCourseLinkForm(
      form({ url: 'https://dana.example/gel', title: 'לק ג׳ל', institutionName: 'דנה', category: '', courseKind: 'hobby' }),
    );
    expect(result.ok && result.values).toMatchObject({ categorySlug: null, courseType: 'hobby' });
  });

  it('names every problem, in Hebrew', () => {
    const result = parseCourseLinkForm(form({ url: 'javascript:alert(1)', title: 'א', institutionName: '', courseKind: 'x' }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.errors).sort()).toEqual(['courseKind', 'institutionName', 'title', 'url']);
    expect(result.errors.url).toContain('קישור');
    expect(parseCourseLinkForm(form({ title: 'אב', institutionName: 'אב', courseKind: 'career' }))).toMatchObject({
      ok: false,
      errors: { url: 'הדביקו את הקישור לדף הקורס או למודעה.' },
    });
  });

  it('removes invisible direction and zero-width characters from the names', () => {
    const result = parseCourseLinkForm(
      form({ url: 'https://a.example/x', title: 'לק‏ ג׳ל‮', institutionName: 'דנה​', courseKind: 'hobby' }),
    );
    expect(result.ok && result.values).toMatchObject({ title: 'לק ג׳ל', institutionName: 'דנה' });
  });

  it('counts characters like the database, and refuses a category that is not a slug', () => {
    const long = parseCourseLinkForm(
      form({ url: 'https://a.example/x', title: 'א'.repeat(161), institutionName: 'ב'.repeat(121), category: '../x' }),
    );
    expect(long.ok === false && long.errors).toMatchObject({
      title: 'עד 160 תווים.',
      institutionName: 'עד 120 תווים.',
      courseKind: 'בחרו תחום, או מה סוג הקורס.',
    });
  });
});

describe('parseCourseRequestForm', () => {
  it('needs only the link', () => {
    expect(parseCourseRequestForm(form({ url: 'instagram.com/p/abc', name: ' ', note: '' }))).toEqual({
      ok: true,
      values: { url: 'https://instagram.com/p/abc', name: null, note: null },
    });
  });

  it('keeps a name and a note, with at most one empty line in a row', () => {
    const result = parseCourseRequestForm(
      form({ url: 'https://ai.example/course', name: ' סדנת  AI ', note: 'ראיתי מודעה\r\n\r\n\r\n\r\nבפייסבוק ' }),
    );
    expect(result.ok && result.values).toEqual({
      url: 'https://ai.example/course',
      name: 'סדנת AI',
      note: 'ראיתי מודעה\n\nבפייסבוק',
    });
  });

  it('refuses a bad link, a one-letter name and a long note', () => {
    const result = parseCourseRequestForm(form({ url: 'http://localhost/', name: 'א', note: 'ב'.repeat(501) }));
    expect(result.ok === false && Object.keys(result.errors).sort()).toEqual(['name', 'note', 'url']);
  });
});

describe('messages', () => {
  it('turns the database codes into Hebrew, with a safe fallback', () => {
    expect(submitMessage('LM040')).toContain('שלושה קורסים');
    expect(submitMessage('LM042')).toContain('שלוש בקשות');
    expect(submitMessage('XX000')).toBe('לא הצלחנו לשמור. נסו שוב בעוד כמה דקות.');
    expect(adminMessage('LM050')).toContain('תחום');
    expect(adminMessage(undefined)).toBe('ההחלטה לא נשמרה. נסו שוב.');
  });
});
