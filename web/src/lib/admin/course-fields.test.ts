import { describe, expect, it } from 'vitest';
import { displayValue, editText, parseEdit, priceChange, reasonText } from './course-fields';

describe('parseEdit', () => {
  it('reads a price with separators and the shekel sign, inside the database range', () => {
    expect(parseEdit('site_price_ils', '12,500 ₪')).toEqual({ ok: true, value: 12500 });
    expect(parseEdit('site_price_ils', '20').ok).toBe(false);
    expect(parseEdit('site_price_ils', '12.5').ok).toBe(false);
    expect(parseEdit('site_price_ils', 'שנים עשר').ok).toBe(false);
  });

  it('keeps a decimal month count, and an empty number clears the field', () => {
    expect(parseEdit('duration_months', '4.5')).toEqual({ ok: true, value: 4.5 });
    expect(parseEdit('total_hours', '  ')).toEqual({ ok: true, value: null });
  });

  it('accepts only real dates', () => {
    expect(parseEdit('next_cohort_date', '2027-02-01')).toEqual({ ok: true, value: '2027-02-01' });
    expect(parseEdit('next_cohort_date', '1.2.2027').ok).toBe(false);
  });

  it('keeps only known choices, in a fixed order, and an empty list stays a list', () => {
    expect(parseEdit('formats', ['in_person', 'online'])).toEqual({ ok: true, value: ['online', 'in_person'] });
    expect(parseEdit('time_slots', [])).toEqual({ ok: true, value: [] });
    expect(parseEdit('formats', ['hybrid']).ok).toBe(false);
  });

  it('reads one syllabus topic per line, and keeps the weak mark of a topic that was already there', () => {
    const current = [{ title: 'פונקציות', weak: true }];
    expect(parseEdit('syllabus', 'פונקציות\n\n  מערכים  ', current)).toEqual({
      ok: true,
      value: [
        { title: 'פונקציות', weak: true },
        { title: 'מערכים', weak: false },
      ],
    });
  });

  it('collapses spaces in text, limits its length, and accepts only YouTube or Vimeo for the video', () => {
    expect(parseEdit('region', '  תל   אביב ')).toEqual({ ok: true, value: 'תל אביב' });
    expect(parseEdit('region', 'א'.repeat(61)).ok).toBe(false);
    expect(parseEdit('video_url', 'https://www.youtube.com/watch?v=abc').ok).toBe(true);
    expect(parseEdit('video_url', 'https://evil.example/video').ok).toBe(false);
  });

  it('refuses a field the scraper does not write', () => {
    expect(parseEdit('summary_good', 'משהו').ok).toBe(false);
  });
});

describe('display', () => {
  it('shows values the way Gal reads them, and nothing for an empty value', () => {
    expect(displayValue('site_price_ils', 14500)).toBe('14,500 ₪');
    expect(displayValue('total_hours', 120)).toBe('120 שעות');
    expect(displayValue('formats', ['online', 'in_person'])).toBe('אונליין, בכיתה');
    expect(displayValue('next_cohort_date', '2027-01-10')).toBe('10.1.2027');
    expect(displayValue('syllabus', [{ title: 'א', weak: false }, 'ב'])).toBe('א · ב');
    expect(displayValue('certificate', null)).toBeNull();
    expect(displayValue('formats', [])).toBeNull();
  });

  it('shows how far a price moved', () => {
    expect(priceChange(10000, 13800)).toBe('+38%');
    expect(priceChange(10000, 9000)).toBe('−10%');
    expect(priceChange(null, 9000)).toBeNull();
  });

  it('puts the value in the edit box in a form that parses back', () => {
    expect(editText('syllabus', [{ title: 'א', weak: false }, { title: 'ב', weak: true }])).toBe('א\nב');
    expect(editText('formats', ['online'])).toBe('online');
    expect(parseEdit('site_price_ils', editText('site_price_ils', 9900))).toEqual({ ok: true, value: 9900 });
  });

  it('names the reasons in Hebrew, with the field for a new course', () => {
    expect(reasonText('price_jump')).toBe('המחיר זז ביותר מ-20%');
    expect(reasonText('site_price_ils:low_confidence')).toBe('מחיר באתר: המודל לא היה בטוח');
    expect(reasonText('something_new')).toBe('something_new');
  });
});
