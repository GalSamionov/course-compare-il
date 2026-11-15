import { describe, expect, it } from 'vitest';
import {
  batches,
  causeSummary,
  groupTotals,
  parseIds,
  parseQueueView,
  queueHref,
  stillEligible,
  toGroup,
  type NewCourseGroupRow,
} from './new-course-groups';

const INST = '11111111-2222-3333-4444-555555555555';

const row = (over: Partial<NewCourseGroupRow> = {}): NewCourseGroupRow => ({
  institution_id: INST,
  institution_slug: 'example-school',
  institution_name: 'מכללה לדוגמה',
  total: 5,
  safe: 2,
  duplicates: 1,
  causes: { low_confidence: 2, duplicate_title: 1 },
  safe_ids: [11, 12],
  all_ids: [11, 12, 13, 14, 15],
  samples: [
    { id: 11, title: 'קורס לדוגמה', price: 4900, url: 'https://example.test/a', safe: true },
    { id: 12, title: 'עוד קורס', price: null, url: 'https://example.test/b', safe: true },
    { id: 13, title: 'קורס לא בטוח', price: 900, url: 'javascript:alert(1)', safe: false },
  ],
  ...over,
});

describe('toGroup', () => {
  it('reads one institution: counts, the safe ids, and the unsafe count', () => {
    const g = toGroup(row());
    expect(g).toMatchObject({ institutionName: 'מכללה לדוגמה', total: 5, safe: 2, unsafe: 3, duplicates: 1 });
    expect(g.safeIds).toEqual([11, 12]);
    expect(g.allIds).toHaveLength(5);
    expect(g.causes).toEqual({ low_confidence: 2, duplicate_title: 1 });
  });

  it('reads the samples, and a link that is not http(s) is dropped', () => {
    const g = toGroup(row());
    expect(g.samples.map((s) => [s.title, s.price, s.safe])).toEqual([
      ['קורס לדוגמה', 4900, true],
      ['עוד קורס', null, true],
      ['קורס לא בטוח', 900, false],
    ]);
    expect(g.samples[2].url).toBeNull();
  });

  it('an institution with nothing safe has no safe ids (the database sends null), and bad json does not throw', () => {
    const g = toGroup(row({ safe: 0, safe_ids: null, causes: 'oops', samples: [{ id: 'x' }, null] }));
    expect(g.safeIds).toEqual([]);
    expect(g.unsafe).toBe(5);
    expect(g.causes).toEqual({});
    expect(g.samples).toEqual([]);
  });
});

describe('groupTotals', () => {
  it('adds up all institutions, for the filter line', () => {
    const groups = [toGroup(row()), toGroup(row({ institution_id: 'other', total: 3, safe: 3, duplicates: 0 }))];
    expect(groupTotals(groups)).toEqual({ total: 8, safe: 5, unsafe: 3, duplicates: 1 });
    expect(groupTotals([])).toEqual({ total: 0, safe: 0, unsafe: 0, duplicates: 0 });
  });
});

describe('causeSummary', () => {
  it('says why items are not safe, most common first, in Hebrew', () => {
    expect(causeSummary({ cohort_in_past: 3, low_confidence: 40, duplicate_title: 2 })).toEqual([
      '40 בגלל שדה בביטחון לא גבוה',
      '3 בגלל מחזור שכבר עבר',
      '2 בגלל אותו שם כמו קורס אחר בתור',
    ]);
  });

  it('shows an unknown cause as it is, with thousands separators, and skips zero', () => {
    expect(causeSummary({ new_thing: 1200, quote_not_found: 0 })).toEqual(['1,200 בגלל new_thing']);
  });
});

describe('parseQueueView and queueHref', () => {
  it('reads the filter and the institution from the address', () => {
    expect(parseQueueView({ cq: 'unsafe', inst: INST })).toEqual({ filter: 'unsafe', institutionId: INST });
    expect(parseQueueView({ cq: ['duplicates', 'unsafe'] })).toEqual({ filter: 'duplicates', institutionId: null });
  });

  it('anything else is the grouped view, and an institution alone does not filter', () => {
    expect(parseQueueView({})).toEqual({ filter: 'groups', institutionId: null });
    expect(parseQueueView({ cq: 'all', inst: INST })).toEqual({ filter: 'groups', institutionId: null });
    expect(parseQueueView({ cq: 'unsafe', inst: 'not-a-uuid' })).toEqual({ filter: 'unsafe', institutionId: null });
  });

  it('builds the link back, to the courses section', () => {
    expect(queueHref({ filter: 'groups', institutionId: null })).toBe('/admin#courses');
    expect(queueHref({ filter: 'unsafe', institutionId: INST })).toBe(`/admin?cq=unsafe&inst=${INST}#courses`);
    expect(parseQueueView(Object.fromEntries(new URLSearchParams(queueHref({ filter: 'duplicates', institutionId: INST }).split(/[?#]/)[1])))).toEqual({
      filter: 'duplicates',
      institutionId: INST,
    });
  });
});

describe('parseIds', () => {
  it('reads a comma list of row ids, without duplicates', () => {
    expect(parseIds('11, 12,12,13')).toEqual([11, 12, 13]);
  });

  it('refuses anything that is not a positive row id, an empty list, or too many', () => {
    expect(parseIds('11,abc')).toBeNull();
    expect(parseIds('0')).toBeNull();
    expect(parseIds('-1')).toBeNull();
    expect(parseIds('1.5')).toBeNull();
    expect(parseIds('')).toBeNull();
    expect(parseIds(null)).toBeNull();
    expect(parseIds('1,2,3', 2)).toBeNull();
  });
});

describe('batches', () => {
  it('splits into batches of the given size, the last one shorter', () => {
    const ids = Array.from({ length: 250 }, (_, i) => i + 1);
    expect(batches(ids, 100).map((b) => b.length)).toEqual([100, 100, 50]);
    expect(batches([], 100)).toEqual([]);
    expect(() => batches(ids, 0)).toThrow();
  });
});

describe('stillEligible', () => {
  it('keeps only what Gal saw and is still safe (or pending) now, and nothing that came in since', () => {
    expect(stillEligible([11, 12, 13], [12, 13, 99])).toEqual({ ids: [12, 13], dropped: 1 });
    expect(stillEligible([11], [])).toEqual({ ids: [], dropped: 1 });
  });
});
