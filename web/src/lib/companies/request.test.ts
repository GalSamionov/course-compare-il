import { describe, expect, it } from 'vitest';
import { charCount, cleanLine, cleanText, normalizePhone, parseCompanyRequest } from './request';

const form = (entries: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.set(key, value);
  return data;
};

const base = { needs: 'סדנת אקסל לצוות הכספים', companyName: 'חברה לדוגמה', contactName: 'דנה כהן', email: 'dana@example.co.il' };

describe('cleaning, the same as private.clean_line and private.clean_text in the database', () => {
  it('folds a line into one, without direction marks', () => {
    expect(cleanLine('  חברה \t לדוגמה\n בע"מ ')).toBe('חברה לדוגמה בע"מ');
    expect(cleanLine('‮חברה‬')).toBe('חברה');
  });

  it('keeps line breaks in free text, at most one empty line in a row', () => {
    expect(cleanText('  צריך   סדנה\r\n\r\n\r\n\r\nלצוות  ‮של 12 ')).toBe('צריך סדנה\n\nלצוות של 12');
    expect(cleanText('שורה\t אחת  \n  ושנייה')).toBe('שורה אחת\nושנייה');
  });

  it('counts characters the way the database does', () => {
    expect(charCount('סדנה 🙂')).toBe(6);
  });

  it('keeps only the digits of a phone', () => {
    expect(normalizePhone(' 050-123 4567 ')).toBe('0501234567');
    expect(normalizePhone('+972 (50) 123.4567')).toBe('+972501234567');
    for (const bad of ['050-CALL-ME', '1234', '+', '0'.repeat(16), 'tel:0501234567']) expect(normalizePhone(bad), bad).toBeNull();
  });
});

describe('parseCompanyRequest', () => {
  it('cleans the values, and leaves what was not filled empty', () => {
    expect(parseCompanyRequest(form({ ...base, email: ' Dana@Example.co.il ', companyName: ' חברה   לדוגמה ' }))).toEqual({
      ok: true,
      values: { ...base, phone: null, teamSize: null, format: null, timing: null },
    });
  });

  it('takes the optional fields from their lists', () => {
    const result = parseCompanyRequest(
      form({ ...base, phone: '03-1234567', teamSize: '51-200', format: 'lecture', timing: 'half_year' }),
    );
    expect(result).toEqual({
      ok: true,
      values: { ...base, phone: '031234567', teamSize: '51-200', format: 'lecture', timing: 'half_year' },
    });
  });

  it('says what is missing, field by field', () => {
    const result = parseCompanyRequest(form({ needs: ' ', companyName: 'ח', contactName: '', email: 'no-at-sign' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.errors).sort()).toEqual(['companyName', 'contactName', 'email', 'needs']);
  });

  it('accepts only a plain email, so the admin mailto link cannot carry a subject or body', () => {
    for (const bad of ['a@b.co?subject=x', 'a@b.co&body=x', 'a@b.co#x', 'a b@c.co', 'a@b']) {
      expect(parseCompanyRequest(form({ ...base, email: bad })).ok, bad).toBe(false);
    }
  });

  it('allows up to 1,000 characters of what you are looking for, and says how many there are', () => {
    expect(parseCompanyRequest(form({ ...base, needs: 'א'.repeat(1000) })).ok).toBe(true);
    const long = parseCompanyRequest(form({ ...base, needs: 'א'.repeat(1001) }));
    expect(long.ok).toBe(false);
    if (!long.ok) expect(long.errors.needs).toBe('עד 1,000 תווים. כרגע 1,001.');
  });

  it('refuses a choice that is not on the list, or a phone that is not one', () => {
    const result = parseCompanyRequest(form({ ...base, phone: '050-CALL-ME', teamSize: '5000', format: 'webinar', timing: 'someday' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.errors).sort()).toEqual(['format', 'phone', 'teamSize', 'timing']);
  });
});
