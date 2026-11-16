import { describe, expect, it } from 'vitest';
import { movedCategoryHref, parseQuery, resolveMoved, serializeQuery, whenHowWords } from './query';
import { EMPTY_QUERY, type SearchQuery } from './types';

describe('parseQuery and serializeQuery', () => {
  it('round-trips a full set of answers through the URL', () => {
    const query: SearchQuery = {
      q: 'פיתוח אתרים',
      cats: ['programming'],
      why: 'switch',
      when: ['evening'],
      how: ['online'],
      maxPrice: 15000,
      off: ['budget'],
    };
    expect(parseQuery(new URLSearchParams(serializeQuery(query)))).toEqual(query);
  });

  it('drops values it does not know', () => {
    const params = new URLSearchParams('why=hack&when=evening,noon&how=zoom&max=-5&cat=Bad Slug,cooking&off=what,nope');
    expect(parseQuery(params)).toEqual({ ...EMPTY_QUERY, cats: ['cooking'], when: ['evening'], off: ['what'] });
  });

  it('keeps the prefilled answers and leaves them out of the URL', () => {
    const base: SearchQuery = { ...EMPTY_QUERY, cats: ['cooking'] };
    expect(parseQuery(new URLSearchParams('when=weekend'), base)).toEqual({ ...base, when: ['weekend'] });
    expect(serializeQuery({ ...base, when: ['weekend'] }, base)).toBe('when=weekend');
    expect(serializeQuery(base, base)).toBe('');
  });
});

describe('retired categories (Catalog.moved)', () => {
  const AI = ['ai-at-work', 'ai-automation', 'ai-no-code', 'ai-content'];
  const moved = { ai: AI };

  it('an old link with cat=ai filters by the four AI categories, without duplicates', () => {
    expect(parseQuery(new URLSearchParams('cat=ai'), EMPTY_QUERY, moved).cats).toEqual(AI);
    expect(parseQuery(new URLSearchParams('cat=ai-content,ai,cooking'), EMPTY_QUERY, moved).cats).toEqual([
      'ai-content',
      'ai-at-work',
      'ai-automation',
      'ai-no-code',
      'cooking',
    ]);
  });

  it('leaves the categories alone when nothing moved', () => {
    expect(resolveMoved(['ai', 'cooking'], {})).toEqual(['ai', 'cooking']);
  });

  it('sends the old category page to the replacement, or to all the courses in the replacements', () => {
    expect(movedCategoryHref(['data-analysis'])).toBe('/categories/data-analysis');
    expect(movedCategoryHref(AI)).toBe('/courses?cat=ai-at-work%2Cai-automation%2Cai-no-code%2Cai-content');
    // הכתובת נקראת בחזרה לאותם תחומים.
    expect(parseQuery(new URLSearchParams(movedCategoryHref(AI).split('?')[1])).cats).toEqual(AI);
  });
});

describe('whenHowWords', () => {
  it('writes ב׳ only before a time, so it never reads "באונליין"', () => {
    expect(whenHowWords([], ['online'])).toEqual({ prefix: '', words: ['אונליין'] });
    expect(whenHowWords(['evening'], ['online'])).toEqual({ prefix: 'ב', words: ['ערבים', 'אונליין'] });
    expect(whenHowWords([], ['in_person'])).toEqual({ prefix: '', words: ['בכיתה'] });
  });
});
