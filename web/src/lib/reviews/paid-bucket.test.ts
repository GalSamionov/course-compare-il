import { describe, expect, it } from 'vitest';
import { paidBucket, paidBucketFromInput, paidBucketLabel } from './paid-bucket';

describe('paidBucket', () => {
  it('rounds down to steps of 500', () => {
    expect(paidBucket(1800)).toBe(1500);
    expect(paidBucket(14900)).toBe(14500);
    expect(paidBucket(500)).toBe(500);
    expect(paidBucket(0)).toBeNull();
    expect(paidBucket(Number.NaN)).toBeNull();
  });
});

describe('paidBucketFromInput', () => {
  it('reads what the admin typed, the same way the server stores it', () => {
    expect(paidBucketFromInput('3,200')).toBe(3000);
    expect(paidBucketFromInput(' 3200 ₪ ')).toBe(3000);
    expect(paidBucketFromInput('')).toBeNull();
    expect(paidBucketFromInput('  ')).toBeNull();
    expect(paidBucketFromInput('שלושת אלפים')).toBe('invalid');
    expect(paidBucketFromInput('-50')).toBe('invalid');
  });
});

describe('paidBucketLabel', () => {
  it('shows the stored step as a range, left to right inside Hebrew', () => {
    expect(paidBucketLabel(3000)).toBe('\u200E3,000–3,500 ₪');
  });
});
