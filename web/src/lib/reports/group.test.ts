import { describe, expect, it } from 'vitest';
import { groupReports, type ReportedReview } from './group';
import type { ReportReason } from './reasons';

const review = (reviewId: string, status: ReportedReview['status'] = 'published'): ReportedReview => ({
  reviewId,
  status,
  courseSlug: 'sample-course',
  courseTitle: 'קורס לדוגמה',
  institutionName: 'מכללה לדוגמה',
  cohortMonth: '2026-01-01',
  publishedAt: '2026-02-01T10:00:00+00:00',
  body: 'גוף הביקורת',
  displayName: null,
  authorTitle: 'none',
  vendorResponse: null,
});
const report = (id: number, reviewId: string, reason: ReportReason, createdAt: string) => ({
  id,
  reviewId,
  reason,
  details: null,
  createdAt,
});

describe('groupReports', () => {
  it('makes one item per review: urgent first, then the oldest', () => {
    const items = groupReports(
      [review('a'), review('b'), review('c')],
      [
        report(1, 'a', 'false_fact', '2026-11-01T10:00:00+00:00'),
        report(2, 'b', 'other', '2026-11-02T10:00:00+00:00'),
        report(3, 'c', 'false_fact', '2026-11-03T10:00:00+00:00'),
        report(4, 'c', 'privacy', '2026-11-04T10:00:00+00:00'),
        report(5, 'a', 'not_graduate', '2026-11-05T10:00:00+00:00'),
      ],
    );
    expect(items.map((i) => i.reviewId)).toEqual(['c', 'a', 'b']);
    expect(items[0]).toMatchObject({ urgent: true, since: '2026-11-03T10:00:00+00:00' });
    expect(items[0].reports.map((r) => r.id)).toEqual([4, 3]);
    expect(items[1].reports.map((r) => r.id)).toEqual([1, 5]);
  });

  it('skips reports whose review is gone, and a hidden review is no longer urgent', () => {
    const items = groupReports(
      [review('a', 'disputed')],
      [report(1, 'a', 'privacy', '2026-11-01T10:00:00+00:00'), report(2, 'gone', 'privacy', '2026-11-01T09:00:00+00:00')],
    );
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ reviewId: 'a', urgent: false });
  });
});
