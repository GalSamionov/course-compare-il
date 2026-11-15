import { describe, expect, it } from 'vitest';
import { REPORT_REASON_LABEL } from '@/lib/reports/reasons';
import { PROOF_KIND_LABEL } from '@/lib/reviews/types';
import { AUDIT_ACTIONS, actionLabel, actorLabel, detailLabel } from './audit';
import { REJECT_REASONS } from './reasons';

describe('audit lines', () => {
  it('has words for every action the database accepts, and an actor', () => {
    for (const action of AUDIT_ACTIONS) expect(actionLabel(action), action).not.toBe(action);
    expect(actionLabel('something_new')).toBe('something_new');
    expect(actorLabel('cleanup_delete', null)).toBe('הניקוי האוטומטי');
    expect(actorLabel('author_delete', 'u')).toBe('הכותב');
    expect(actorLabel('report_hide', 'u')).toBe('מנהל');
  });

  it('turns the codes in details into words, and nothing else', () => {
    expect(detailLabel('reject', { reason: 'unreadable' })).toBe(REJECT_REASONS.unreadable);
    expect(detailLabel('report_remove', { reason: 'privacy', reports: [1, 2] })).toBe(REPORT_REASON_LABEL.privacy);
    expect(detailLabel('report_keep', { reports: [3], was_hidden: true })).toBe('הביקורת חזרה לאתר');
    expect(detailLabel('report_keep', { reports: [3], was_hidden: false })).toBeNull();
    expect(detailLabel('course_edit', { field: 'site_price_ils', kind: 'field' })).toBe('מחיר באתר');
    expect(detailLabel('course_approve', { kind: 'new_course' })).toBe('קורס חדש');
    expect(detailLabel('approve', { proof_kind: 'invoice', has_amount: true })).toBe(`${PROOF_KIND_LABEL.invoice}, עם סכום`);
    expect(detailLabel('vendor_response', {})).toBeNull();
  });
});
