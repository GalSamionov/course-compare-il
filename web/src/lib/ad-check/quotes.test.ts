import { describe, expect, it } from 'vitest';
import { flagCopy } from './flags';
import { findQuote, mapModelOutput, normalizeForMatch, parseStoredResult } from './quotes';

/** טקסט מומצא של דף נחיתה, לדוגמה בלבד. */
const PAGE = [
  'קורס לדוגמה: עיצוב ציפורניים',
  'הכנסה של 5 ספרות בחודש – כבר מהחודש הראשון!',
  'מחיר רגיל: 4,990 ₪. היום רק 1,490 ₪',
  'בסיום תקבלי ״תעודה בינלאומית״ מטעם האקדמיה.',
  "ערכה מקצועית בשווי 1,750 ש׳׳ח",
  'מספר המקומות מוגבל',
  '"היומן שלי מלא" — נ׳, בוגרת',
  '12 מפגשים, פעם בשבוע, בזום',
].join('\n');

describe('findQuote', () => {
  const page = normalizeForMatch(PAGE);

  it('keeps a real quote and returns the text as it is on the page', () => {
    expect(findQuote('מספר המקומות מוגבל', page)).toBe('מספר המקומות מוגבל');
  });

  it('drops an invented quote', () => {
    expect(findQuote('הכנסה מובטחת של 20,000 ש"ח', page)).toBeNull();
  });

  it('matches across ״ and ", ׳ and \', and different dashes, but shows the page version', () => {
    expect(findQuote('בסיום תקבלי "תעודה בינלאומית"', page)).toBe('בסיום תקבלי ״תעודה בינלאומית״');
    expect(findQuote('"היומן שלי מלא" - נ\', בוגרת', page)).toBe('"היומן שלי מלא" — נ׳, בוגרת');
    expect(findQuote('5 ספרות בחודש - כבר מהחודש הראשון', page)).toBe('5 ספרות בחודש – כבר מהחודש הראשון');
  });

  it('ignores extra spaces, wrapping quotes and an ellipsis around the quote', () => {
    expect(findQuote('  ״מחיר   רגיל: 4,990 ₪.״ ', page)).toBe('מחיר רגיל: 4,990 ₪');
    expect(findQuote('...היום רק 1,490 ₪…', page)).toBe('היום רק 1,490 ₪');
  });

  it('matches a quote that runs across two lines of the page', () => {
    expect(findQuote('מוגבל "היומן שלי', page)).toBe('מוגבל "היומן שלי');
  });

  it('drops quotes that are too short, too long or not text', () => {
    expect(findQuote('קורס', page)).toBe('קורס');
    expect(findQuote('קו', page)).toBeNull();
    expect(findQuote('א'.repeat(301), normalizeForMatch('א'.repeat(400)))).toBeNull();
    expect(findQuote(42, page)).toBeNull();
    expect(findQuote(undefined, page)).toBeNull();
  });
});

describe('mapModelOutput', () => {
  it('keeps flags with real quotes, in the order of the guide', () => {
    const result = mapModelOutput(
      {
        claims: { price: 'היום רק 1,490 ₪', duration: '', certificate: '"תעודה בינלאומית"', format: '12 מפגשים, פעם בשבוע, בזום' },
        flags: [
          { flag: 'urgency', quote: 'מספר המקומות מוגבל' },
          { flag: 'income_promise', quote: 'הכנסה של 5 ספרות בחודש' },
          { flag: 'anchor_discount', quote: 'מחיר רגיל: 4,990 ₪' },
        ],
      },
      PAGE,
    );
    expect(result.flags.map((f) => f.flag)).toEqual(['income_promise', 'anchor_discount', 'urgency']);
    expect(result.claims).toEqual({
      price: 'היום רק 1,490 ₪',
      duration: '',
      certificate: '״תעודה בינלאומית״',
      format: '12 מפגשים, פעם בשבוע, בזום',
    });
  });

  it('drops an unknown flag, an invented quote, and a flag left with no quote', () => {
    const result = mapModelOutput(
      {
        claims: { price: 'מחיר שלא בדף', duration: '', certificate: '', format: '' },
        flags: [
          { flag: 'scam', quote: 'מספר המקומות מוגבל' },
          { flag: 'guaranteed_return', quote: 'החזר כספי מלא אם לא תרוויחו' },
          { flag: 'urgency', quote: 'מספר המקומות מוגבל' },
          'not an object',
          null,
        ],
      },
      PAGE,
    );
    expect(result.flags).toEqual([{ flag: 'urgency', quotes: ['מספר המקומות מוגבל'] }]);
    expect(result.claims.price).toBe('');
  });

  it('keeps at most 2 quotes per flag, without the same quote twice', () => {
    const result = mapModelOutput(
      {
        claims: {},
        flags: [
          { flag: 'income_promise', quote: 'הכנסה של 5 ספרות' },
          { flag: 'income_promise', quote: '״הכנסה של 5 ספרות״' },
          { flag: 'income_promise', quote: 'כבר מהחודש הראשון' },
          { flag: 'income_promise', quote: 'הכנסה של 5 ספרות בחודש' },
        ],
      },
      PAGE,
    );
    expect(result.flags).toEqual([
      { flag: 'income_promise', quotes: ['הכנסה של 5 ספרות', 'כבר מהחודש הראשון'] },
    ]);
  });

  it('returns an empty result for output that is not the schema at all', () => {
    for (const raw of [null, 'text', 42, { flags: 'x' }, []]) {
      expect(mapModelOutput(raw, PAGE)).toEqual({
        claims: { price: '', duration: '', certificate: '', format: '' },
        flags: [],
      });
    }
  });
});

describe('parseStoredResult', () => {
  it('reads back what mapModelOutput produced, and rejects other shapes', () => {
    const result = mapModelOutput({ claims: {}, flags: [{ flag: 'urgency', quote: 'מספר המקומות מוגבל' }] }, PAGE);
    expect(parseStoredResult(JSON.parse(JSON.stringify(result)))).toEqual(result);
    expect(parseStoredResult({ claims: {}, flags: [] })).toBeNull();
    expect(parseStoredResult({ claims: result.claims, flags: [{ flag: 'scam', quotes: ['x'] }] })).toBeNull();
    expect(parseStoredResult(null)).toBeNull();
  });
});

describe('flagCopy', () => {
  it('links each flag to its part of the guide', () => {
    expect(flagCopy('income_promise').href).toBe('/guides/red-flags-in-course-ads#part-1');
    expect(flagCopy('anonymous_testimonial').href).toBe('/guides/red-flags-in-course-ads#part-8');
  });
});
