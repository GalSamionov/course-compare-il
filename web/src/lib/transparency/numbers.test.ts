import { describe, expect, it } from 'vitest';
import { monthName, toTransparencyMonth, transparencyLead, type TransparencyMonth } from './numbers';

const month = (published: number, returned: number): TransparencyMonth => ({
  month: '2026-10-01',
  reviewsPublished: published,
  reviewsReturned: returned,
  proofsDeleted: 0,
  courseChangesApproved: 0,
  courseChangesRejected: 0,
  reportedKept: 0,
  reportedRemoved: 0,
});

describe('transparencyLead', () => {
  it('says what we published and what went back, in the month that ended', () => {
    const name = monthName('2026-10-01');
    expect(name).toContain('2026');
    expect(transparencyLead(month(12, 37))).toBe(`ב${name} פרסמנו 12 ביקורות, והחזרנו 37 לכותבים בלי לפרסם.`);
    expect(transparencyLead(month(1, 1))).toBe(`ב${name} פרסמנו ביקורת אחת, והחזרנו אחת לכותב בלי לפרסם.`);
    expect(transparencyLead(month(0, 0))).toBe(`ב${name} לא פרסמנו אף ביקורת, ולא החזרנו אף אחת לכותבים.`);
    expect(transparencyLead(month(1234, 2))).toContain('1,234');
  });
});

describe('toTransparencyMonth', () => {
  it('maps a row of transparency_by_month', () => {
    expect(
      toTransparencyMonth({
        month: '2026-10-01',
        reviews_published: 1,
        reviews_returned: 2,
        proofs_deleted: 3,
        course_changes_approved: 4,
        course_changes_rejected: 5,
        reported_reviews_kept: 6,
        reported_reviews_removed: 7,
      }),
    ).toEqual({
      month: '2026-10-01',
      reviewsPublished: 1,
      reviewsReturned: 2,
      proofsDeleted: 3,
      courseChangesApproved: 4,
      courseChangesRejected: 5,
      reportedKept: 6,
      reportedRemoved: 7,
    });
  });
});
