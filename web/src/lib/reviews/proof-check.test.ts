import { describe, expect, it } from 'vitest';
import { compareProof, paidBucket, sanitizeExtracted, type ExtractedProof, type ProofExpectations } from './proof-check';

const expected: ProofExpectations = {
  institutionName: 'מכללה לדוגמה',
  businessNumber: '512345678',
  cohortMonth: '2026-03-01',
  finishedMonth: '2026-10-01',
  sitePrice: 14900,
  displayName: 'נועה ר.',
  displayMode: 'first_initial',
  claimedKind: 'invoice',
};

const invoice: ExtractedProof = {
  institutionName: 'מכללה לדוגמה בע"מ',
  businessNumber: '512345678',
  documentDate: '2026-02-20',
  amountIls: 13800,
  nameOnDocument: 'נועה רוזן',
  documentType: 'invoice_or_receipt',
};

const fields = (found: ExtractedProof, exp: ProofExpectations = expected) => compareProof(found, exp).map((m) => m.field);

describe('compareProof', () => {
  it('finds nothing when the invoice matches the course and the name', () => {
    expect(compareProof(invoice, expected)).toEqual([]);
  });

  it('flags another institution and another business number', () => {
    expect(fields({ ...invoice, institutionName: 'בית ספר אחר', businessNumber: '599999999' })).toEqual([
      'institution',
      'business_number',
    ]);
  });

  it('flags a date far from the cohort and an amount far from the price on the site', () => {
    expect(fields({ ...invoice, documentDate: '2024-01-10', amountIls: 900 })).toEqual(['date', 'amount']);
  });

  it('does not compare a name for an anonymous review, and flags another kind of document', () => {
    const anonymous = { ...expected, displayMode: 'anonymous' as const, displayName: 'בוגר מאומת' };
    expect(fields({ ...invoice, nameOnDocument: '', documentType: 'course_screenshot' }, anonymous)).toEqual([
      'document_type',
    ]);
  });
});

describe('sanitizeExtracted', () => {
  it('keeps only clean values from the model', () => {
    expect(
      sanitizeExtracted({
        institution_name: '  מכללה  ',
        business_number: 'ח.פ. 51-234',
        document_date: '20.2.2026',
        amount_ils: -5,
        name_on_document: 'נועה',
        document_type: 'poem',
      }),
    ).toEqual({
      institutionName: 'מכללה',
      businessNumber: '51234',
      documentDate: '',
      amountIls: 0,
      nameOnDocument: 'נועה',
      documentType: 'other',
    });
  });

  it('strips hidden control and format characters from every text field before trimming and cutting', () => {
    const found = sanitizeExtracted({
      // היפוך כיוון (RLO), סימן כיוון וסוף היפוך: נראה אחרת ממה שהוא.
      institution_name: '‮מכללה‬‏ לדוגמה\u0000',
      business_number: '‎512345678',
      document_date: '‏2026-02-20‏',
      amount_ils: 9000,
      // רוחב אפס בין האותיות, ושורה חדשה בין המילים.
      name_on_document: '​נו‍עה\nרוזן⁦',
      document_type: 'invoice_or_receipt',
    });
    expect(found).toEqual({
      institutionName: 'מכללה לדוגמה',
      businessNumber: '512345678',
      documentDate: '2026-02-20',
      amountIls: 9000,
      nameOnDocument: 'נועה רוזן',
      documentType: 'invoice_or_receipt',
    });
    // תווים נסתרים לא תופסים את מגבלת האורך, ושם שכולו נסתר הוא ריק.
    expect(sanitizeExtracted({ name_on_document: '​'.repeat(150) + 'נועה' }).nameOnDocument).toBe('נועה');
    expect(sanitizeExtracted({ institution_name: '‮‏\u0007' }).institutionName).toBe('');
  });
});

describe('paidBucket', () => {
  it('rounds down to steps of 500', () => {
    expect(paidBucket(1800)).toBe(1500);
    expect(paidBucket(14900)).toBe(14500);
    expect(paidBucket(500)).toBe(500);
    expect(paidBucket(0)).toBeNull();
    expect(paidBucket(Number.NaN)).toBeNull();
  });
});
