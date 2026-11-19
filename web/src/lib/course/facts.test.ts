import { describe, expect, it } from 'vitest';
import { courseFacts, factsLine, knownFactsCount, type FactSource } from './facts';

const course = (over: Partial<FactSource> = {}): FactSource => ({
  sitePrice: 2600,
  totalHours: 30,
  durationMonths: 2,
  formats: ['in_person', 'online'],
  region: 'חיפה',
  institutionCity: null,
  certificate: 'תעודת השתתפות',
  nextCohortDate: '2027-01-11',
  ...over,
});

const nothing: Partial<FactSource> = {
  sitePrice: null,
  totalHours: null,
  durationMonths: null,
  formats: [],
  region: null,
  institutionCity: null,
  certificate: null,
  nextCohortDate: null,
};

describe('courseFacts', () => {
  it('lists the six facts in order, each with its source', () => {
    expect(courseFacts(course())).toEqual([
      { key: 'price', label: 'מחיר', known: true, text: '2,600 ₪', source: 'claim' },
      { key: 'duration', label: 'משך', known: true, text: '2 חודשים, 30 שעות', source: 'verified' },
      { key: 'format', label: 'מתכונת', known: true, text: 'בכיתה או אונליין', source: 'claim' },
      { key: 'location', label: 'מיקום', known: true, text: 'חיפה', source: 'claim' },
      { key: 'certificate', label: 'תעודה', known: true, text: 'תעודת השתתפות', source: 'claim' },
      { key: 'nextCohort', label: 'מחזור הבא', known: true, text: '11.1.2027', source: 'claim' },
    ]);
  });

  it('writes what the page does not say, and a missing price as the institution not publishing one', () => {
    expect(courseFacts(course(nothing)).map((f) => (f.known ? f.text : f.missing))).toEqual([
      'המוסד לא מפרסם מחיר',
      'לא כתוב בדף',
      'לא כתוב בדף',
      'לא כתוב בדף',
      'לא כתוב בדף',
      'לא כתוב בדף',
    ]);
  });

  it('counts a course that is only online as having a place, and says one month in words', () => {
    const facts = courseFacts(course({ formats: ['online'], region: null, durationMonths: 1, totalHours: null }));
    expect(facts.find((f) => f.key === 'location')).toMatchObject({ known: true, text: 'אונליין' });
    expect(facts.find((f) => f.key === 'duration')).toMatchObject({ known: true, text: 'חודש אחד' });
  });

  it('treats a blank certificate or region as unknown', () => {
    const facts = courseFacts(course({ certificate: '  ', region: '', formats: ['in_person'] }));
    expect(facts.filter((f) => !f.known).map((f) => f.key)).toEqual(['location', 'certificate']);
  });
});

describe('knownFactsCount', () => {
  it('agrees with courseFacts', () => {
    const cases = [
      course(),
      course(nothing),
      course({ formats: ['online'], region: null }),
      course({ sitePrice: null, certificate: '' }),
      course({ formats: ['toString'] }),
    ];
    for (const c of cases) expect(knownFactsCount(c)).toBe(courseFacts(c).filter((f) => f.known).length);
    expect(knownFactsCount(course())).toBe(6);
    expect(knownFactsCount(course(nothing))).toBe(0);
  });
});

describe('factsLine', () => {
  it('shows the price, the length, the format and the place, only what is known', () => {
    expect(factsLine(course()).map((p) => p.text)).toEqual(['2,600 ₪', '2 חודשים, 30 שעות', 'בכיתה או אונליין', 'חיפה']);
    expect(factsLine(course(nothing)).map((p) => p.text)).toEqual(['מחיר לא מפורסם']);
  });

  it('does not write "אונליין" twice', () => {
    expect(factsLine(course({ formats: ['online'], region: null })).map((p) => p.text)).toEqual([
      '2,600 ₪',
      '2 חודשים, 30 שעות',
      'אונליין',
    ]);
  });
});

describe('location from the institution (stage 3)', () => {
  it('uses the institution city when the course does not say where, with where it came from', () => {
    const c = course({ region: null, formats: ['in_person'], institutionCity: 'רמת גן' });
    expect(courseFacts(c).find((f) => f.key === 'location')).toEqual({
      key: 'location',
      label: 'מיקום',
      known: true,
      text: 'רמת גן',
      source: 'claim',
      note: 'לפי כתובת המוסד',
    });
    expect(factsLine(c).map((p) => p.text)).toEqual(['2,600 ₪', '2 חודשים, 30 שעות', 'בכיתה', 'רמת גן (לפי כתובת המוסד)']);
  });

  it('prefers what the course says, and puts no city on a course that is only online', () => {
    expect(courseFacts(course({ institutionCity: 'רמת גן' })).find((f) => f.key === 'location')).toMatchObject({ text: 'חיפה' });
    expect(
      courseFacts(course({ region: null, formats: ['online'], institutionCity: 'רמת גן' })).find((f) => f.key === 'location'),
    ).toEqual({ key: 'location', label: 'מיקום', known: true, text: 'אונליין', source: 'claim' });
  });

  it('uses the city also when the format is unknown, and counts it as known', () => {
    const c = course({ region: null, formats: [], institutionCity: 'רמת גן' });
    expect(courseFacts(c).find((f) => f.key === 'location')).toMatchObject({ known: true, text: 'רמת גן' });
    expect(knownFactsCount(c)).toBe(courseFacts(c).filter((f) => f.known).length);
  });

  it('an institution that teaches only online gives "אונליין", unless the course meets in a classroom', () => {
    const online = course({ region: null, formats: [], institutionCity: 'אונליין' });
    expect(courseFacts(online).find((f) => f.key === 'location')).toMatchObject({ text: 'אונליין', note: 'לפי המוסד' });
    expect(factsLine(online).map((p) => p.text)).toEqual(['2,600 ₪', '2 חודשים, 30 שעות', 'אונליין (לפי המוסד)']);
    const hybrid = course({ region: null, formats: ['hybrid'], institutionCity: 'אונליין' });
    expect(courseFacts(hybrid).find((f) => f.key === 'location')).toMatchObject({ known: false });
  });

  it('does not write "אונליין" twice when the course itself says it', () => {
    expect(factsLine(course({ region: 'אונליין', formats: ['online'] })).map((p) => p.text)).toEqual([
      '2,600 ₪',
      '2 חודשים, 30 שעות',
      'אונליין',
    ]);
  });
});
