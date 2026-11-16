import { describe, expect, it } from 'vitest';
import { REMOVE_NOTE, parseReportForm, removalNote } from './reasons';

const ID = '11111111-2222-4333-8444-555555555555';
const form = (entries: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.set(key, value);
  return data;
};

describe('parseReportForm', () => {
  it('keeps the reason and cleans the details', () => {
    expect(parseReportForm(form({ reviewId: ID, reason: 'privacy', details: '  יש   שם\nמלא ' }))).toEqual({
      ok: true,
      values: { reviewId: ID, reason: 'privacy', details: 'יש שם מלא' },
    });
    expect(parseReportForm(form({ reviewId: ID, reason: 'false_fact', details: '   ' }))).toEqual({
      ok: true,
      values: { reviewId: ID, reason: 'false_fact', details: null },
    });
  });

  it('refuses what the database would refuse, and says which field', () => {
    expect(parseReportForm(form({ reviewId: 'x', reason: 'privacy' }))).toMatchObject({ ok: false, field: null });
    expect(parseReportForm(form({ reviewId: ID }))).toMatchObject({ ok: false, field: 'reason' });
    expect(parseReportForm(form({ reviewId: ID, reason: 'spam' }))).toMatchObject({ ok: false, field: 'reason' });
    expect(parseReportForm(form({ reviewId: ID, reason: 'other', details: ' ' }))).toMatchObject({ ok: false, field: 'details' });
    expect(parseReportForm(form({ reviewId: ID, reason: 'illegal', details: 'א'.repeat(1001) }))).toMatchObject({
      ok: false,
      field: 'details',
    });
  });
});

describe('removalNote', () => {
  it('starts with the reason, and adds what Gal wrote in one line', () => {
    expect(removalNote('privacy', '  היה שם   מלא.\n')).toBe(`${REMOVE_NOTE.privacy} היה שם מלא.`);
    expect(removalNote('other', '')).toBe(REMOVE_NOTE.other);
  });
});
