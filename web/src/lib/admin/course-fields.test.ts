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

  // הצורה של new_value בקורס חדש מהריצה האמיתית הראשונה של האוסף (15.11.2026), עם ערכים לדוגמה.
  it('reads every field of a new course from a real scraper run', () => {
    const newValue = {
      title: { value: 'קורס לדוגמה בפיתוח', quote: 'קורס לדוגמה בפיתוח', confidence: 'high', issues: [] },
      certificate: { value: 'תעודת השלמה לדוגמה', quote: 'אישור השלמה', confidence: 'low', issues: [] },
      duration_months: { value: 3, quote: 'שלושה חודשים', confidence: 'high', issues: [] },
      total_hours: { value: 13, quote: '13 שעות', confidence: 'medium', issues: [] },
      formats: { value: ['in_person', 'online'], quote: 'אונליין או בכיתה', confidence: 'medium', issues: [] },
      time_slots: { value: ['evening'], quote: 'מפגשי ערב', confidence: 'medium', issues: [] },
      next_cohort_date: { value: '2027-02-01', quote: 'בפברואר', confidence: 'low', issues: [] },
      syllabus: { value: ['נושא א', 'Front-end', 'נושא ג'], quote: 'מתמקדים ב:', confidence: 'low', issues: [] },
      video_url: { value: 'https://www.youtube.com/embed/abc?si=x&hd=1', quote: '', confidence: 'medium', issues: [] },
    };
    const shown = Object.fromEntries(Object.entries(newValue).map(([field, item]) => [field, displayValue(field, item.value)]));
    expect(shown).toEqual({
      title: 'קורס לדוגמה בפיתוח',
      certificate: 'תעודת השלמה לדוגמה',
      duration_months: '3 חודשים',
      total_hours: '13 שעות',
      formats: 'בכיתה, אונליין',
      time_slots: 'ערבים',
      next_cohort_date: '1.2.2027',
      syllabus: 'נושא א · Front-end · נושא ג',
      video_url: 'https://www.youtube.com/embed/abc?si=x&hd=1',
    });
    expect(reasonText('formats:low_confidence')).toBe('פורמט: המודל לא היה בטוח');
  });

  it('shows a value in an unexpected shape as readable text, and never throws', () => {
    expect(displayValue('next_cohort_date', '2026-13-01')).toBe('2026-13-01');
    expect(displayValue('next_cohort_date', { from: '2027-01' })).toBe('{"from":"2027-01"}');
    expect(displayValue('certificate', { text: 'תעודה' })).toBe('{"text":"תעודה"}');
    expect(displayValue('total_hours', [10, 20])).toBe('[10,20]');
    expect(displayValue('formats', ['online', { kind: 'hybrid' }])).toBe('אונליין, {"kind":"hybrid"}');
    expect(displayValue('formats', 'online')).toBe('online');
    expect(displayValue('syllabus', 'HTML, CSS')).toBe('HTML, CSS');
    expect(displayValue('syllabus', [{ name: 'בלי כותרת' }])).toBe('[{"name":"בלי כותרת"}]');
    expect(displayValue('unknown_field', { a: [1] })).toBe('{"a":[1]}');
  });

  it('names the reasons in Hebrew, with the field for a new course', () => {
    expect(reasonText('price_jump')).toBe('המחיר זז ביותר מ-20%');
    expect(reasonText('site_price_ils:low_confidence')).toBe('מחיר באתר: המודל לא היה בטוח');
    expect(reasonText('something_new')).toBe('something_new');
  });
});
