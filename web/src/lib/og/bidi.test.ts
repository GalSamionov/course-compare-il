import { describe, expect, it } from 'vitest';
import { rtlLine, rtlTokens } from './bidi';

describe('rtlTokens', () => {
  it('reverses Hebrew words and keeps a Latin run whole and in order', () => {
    expect(rtlTokens('פיתוח Full Stack')).toEqual(['חותיפ', 'Full Stack']);
    expect(rtlTokens('HTML ו-JavaScript')).toEqual(['HTML', 'JavaScript-ו']);
  });

  it('keeps numbers left to right, puts a range low-first for an RTL reader, and mirrors brackets', () => {
    // הטווח נקרא מימין: 12,500, ואז 15,000. לכן משמאל לימין הוא 15,000–12,500.
    expect(rtlTokens('שילמו בפועל 12,500–15,000 ₪')).toEqual(['ומליש', 'לעופב', '15,000–12,500', '₪']);
    expect(rtlLine('להשוואה (עד 3)')).toBe('(3 דע) האוושהל');
    expect(rtlLine('91% ממליצים')).toBe('םיצילממ 91%');
  });
});
