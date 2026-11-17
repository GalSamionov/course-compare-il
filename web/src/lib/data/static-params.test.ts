import { describe, expect, it } from 'vitest';
import { NO_PAGES_YET, slugParams } from './static-params';

describe('slugParams', () => {
  it('maps every slug to params', () => {
    expect(slugParams(['a', 'b'])).toEqual([{ slug: 'a' }, { slug: 'b' }]);
  });

  it('never returns an empty list: one slug that is not in the database', () => {
    expect(slugParams([])).toEqual([{ slug: NO_PAGES_YET }]);
  });
});
