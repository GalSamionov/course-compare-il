import { describe, expect, it, vi } from 'vitest';
import { runAdCheck, type AdCheckDeps } from './check';
import type { AdCheckResult } from './quotes';

/** דף נחיתה מומצא, לדוגמה בלבד. */
const HTML = `<html><head><title>קורס לדוגמה</title></head><body>
<h1>קורס לדוגמה לעיצוב ציפורניים, מאפס ועד מקצוע</h1>
<p>מספר המקומות מוגבל. ההרשמה נסגרת ביום חמישי.</p>
<p>12 מפגשים בזום, ובסוף תעודה של האקדמיה לדוגמה. אפשר לשלם בתשלומים.</p>
</body></html>`;

const EMPTY: AdCheckResult = { claims: { price: '', duration: '', certificate: '', format: '' }, flags: [] };

function deps(overrides: Partial<AdCheckDeps> = {}): AdCheckDeps {
  return {
    getCached: vi.fn(async () => null),
    takeQuota: vi.fn(async () => true),
    fetchPage: vi.fn(async (url: string) => ({ ok: true as const, url, html: HTML })),
    readPage: vi.fn(async () => ({
      claims: { price: '', duration: '', certificate: '', format: '12 מפגשים בזום' },
      flags: [
        { flag: 'urgency', quote: 'מספר המקומות מוגבל' },
        { flag: 'urgency', quote: 'מקומות אחרונים!' },
      ],
    })),
    save: vi.fn(async () => '2026-11-15T10:00:00Z'),
    ...overrides,
  };
}

describe('runAdCheck', () => {
  it('reads the page, keeps only verified quotes, and saves the result', async () => {
    const d = deps();
    const outcome = await runAdCheck('https://example.co.il/course', d);
    expect(outcome).toEqual({
      kind: 'checked',
      cached: false,
      checkedAt: '2026-11-15T10:00:00Z',
      result: {
        claims: { price: '', duration: '', certificate: '', format: '12 מפגשים בזום' },
        flags: [{ flag: 'urgency', quotes: ['מספר המקומות מוגבל'] }],
      },
    });
    expect(d.save).toHaveBeenCalledWith('https://example.co.il/course', expect.objectContaining({ flags: expect.any(Array) }));
    // המודל מקבל את הטקסט, לא את ה-HTML.
    const sent = vi.mocked(d.readPage).mock.calls[0][0];
    expect(sent.text).toContain('מספר המקומות מוגבל');
    expect(sent.text).not.toContain('<p>');
  });

  it('returns a cached result without taking quota or reading the page', async () => {
    const d = deps({ getCached: vi.fn(async () => ({ result: EMPTY, checkedAt: '2026-11-15T08:00:00Z' })) });
    expect(await runAdCheck('https://example.co.il/course', d)).toEqual({
      kind: 'checked',
      cached: true,
      checkedAt: '2026-11-15T08:00:00Z',
      result: EMPTY,
    });
    expect(d.takeQuota).not.toHaveBeenCalled();
    expect(d.fetchPage).not.toHaveBeenCalled();
    expect(d.readPage).not.toHaveBeenCalled();
  });

  it('stops before the page when the quota is used up', async () => {
    const d = deps({ takeQuota: vi.fn(async () => false) });
    expect(await runAdCheck('https://example.co.il/course', d)).toEqual({ kind: 'quota' });
    expect(d.fetchPage).not.toHaveBeenCalled();
  });

  it('does not read social links, and does not count them', async () => {
    const d = deps();
    expect(await runAdCheck('https://www.facebook.com/somepage/posts/1', d)).toEqual({ kind: 'social' });
    expect(d.getCached).not.toHaveBeenCalled();
    expect(d.takeQuota).not.toHaveBeenCalled();
  });

  it('a private or odd address is unreadable, before any request', async () => {
    const d = deps();
    expect(await runAdCheck('https://example.co.il:8080/', d)).toEqual({ kind: 'unreadable' });
    expect(d.fetchPage).not.toHaveBeenCalled();
  });

  it('a page that could not be read, or a JavaScript-only page, is unreadable', async () => {
    const failed = deps({ fetchPage: vi.fn(async () => ({ ok: false as const, problem: 'network' as const })) });
    expect(await runAdCheck('https://example.co.il/course', failed)).toEqual({ kind: 'unreadable' });

    const jsOnly = deps({
      fetchPage: vi.fn(async (url: string) => ({
        ok: true as const,
        url,
        html: '<html><body><div id="root"></div><noscript>You need to enable JavaScript</noscript></body></html>',
      })),
    });
    expect(await runAdCheck('https://example.co.il/course', jsOnly)).toEqual({ kind: 'unreadable' });
    expect(jsOnly.readPage).not.toHaveBeenCalled();
  });

  it('when the model fails, the visitor gets "unreadable" and nothing is saved', async () => {
    const log = vi.fn();
    const d = deps({ readPage: vi.fn(async () => Promise.reject(new Error('timeout'))), log });
    expect(await runAdCheck('https://example.co.il/course', d)).toEqual({ kind: 'unreadable' });
    expect(d.save).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith('ad check model failed: Error');
  });

  it('a failed save still shows the result', async () => {
    const d = deps({ save: vi.fn(async () => Promise.reject(new Error('db down'))), log: vi.fn() });
    const outcome = await runAdCheck('https://example.co.il/course', d);
    expect(outcome.kind).toBe('checked');
  });
});
