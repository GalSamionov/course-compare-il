import { describe, expect, it } from 'vitest';
import { EMPTY_LOCAL, mergeIntoAccount } from './lists';

const A = 'aaaaaaaa-0000-0000-0000-000000000001';
const B = 'aaaaaaaa-0000-0000-0000-000000000002';
const C = 'aaaaaaaa-0000-0000-0000-000000000003';
const D = 'aaaaaaaa-0000-0000-0000-000000000004';

describe('mergeIntoAccount', () => {
  it('moves the browser comparison and the pending save into an empty account', () => {
    expect(mergeIntoAccount({ saved: [], compare: [] }, { ...EMPTY_LOCAL, compare: [A, B], save: C })).toEqual({
      save: [A, B, C],
      compare: [
        { courseId: A, position: 1 },
        { courseId: B, position: 2 },
      ],
    });
  });

  it('keeps the account places, fills the free ones, and saves what does not fit', () => {
    const account = { saved: [B, D], compare: [{ courseId: B, position: 2 }, { courseId: D, position: 3 }] };
    expect(mergeIntoAccount(account, { ...EMPTY_LOCAL, compare: [B, A, C] })).toEqual({
      save: [A, C],
      compare: [{ courseId: A, position: 1 }],
    });
  });
});
