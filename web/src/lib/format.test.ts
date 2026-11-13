import { describe, expect, it } from 'vitest';
import { costPerHandsOnHour, formatHebrewDate, formatIls, formatPaidRange } from './format';

describe('formatIls', () => {
  it('adds thousands separators and the shekel sign', () => {
    expect(formatIls(14900)).toBe('14,900 ₪');
  });
});

describe('formatPaidRange', () => {
  it('writes the range with an en dash', () => {
    expect(formatPaidRange({ min: 12500, max: 15000, count: 6 })).toBe('12,500–15,000 ₪');
  });
});

describe('costPerHandsOnHour', () => {
  it('rounds the price per hands-on hour', () => {
    expect(costPerHandsOnHour(14900, 260)).toBe(57);
  });
  it('returns null when a value is missing', () => {
    expect(costPerHandsOnHour(null, 260)).toBeNull();
    expect(costPerHandsOnHour(14900, 0)).toBeNull();
  });
});

describe('formatHebrewDate', () => {
  it('writes day.month.year in Israel time', () => {
    expect(formatHebrewDate('2026-11-06T08:00:00Z')).toBe('6.11.2026');
  });
});
