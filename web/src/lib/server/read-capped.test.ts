import { describe, expect, it } from 'vitest';
import { readCapped } from './read-capped';

const post = (body: BodyInit | null, headers: Record<string, string> = {}) =>
  new Request('http://localhost/api/test', { method: 'POST', body, headers, duplex: 'half' } as RequestInit);

describe('readCapped', () => {
  it('returns a body that fits, including Hebrew', async () => {
    expect(await readCapped(post('{"reviewId":"שלום"}'), 200)).toBe('{"reviewId":"שלום"}');
    expect(await readCapped(post(null), 200)).toBe('');
  });

  it('counts bytes, not characters', async () => {
    // 4 אותיות בעברית הן 8 בתים.
    expect(await readCapped(post('שלום'), 8)).toBe('שלום');
    expect(await readCapped(post('שלום'), 7)).toBeNull();
  });

  it('rejects a declared content-length over the limit without reading the body', async () => {
    let pulled = false;
    const body = new ReadableStream<Uint8Array>(
      {
        pull(controller) {
          pulled = true;
          controller.enqueue(new Uint8Array(10));
          controller.close();
        },
      },
      // בלי קריאה מראש: pull רץ רק כשמישהו קורא.
      { highWaterMark: 0 },
    );
    expect(await readCapped(post(body, { 'content-length': '5000' }), 100)).toBeNull();
    expect(pulled).toBe(false);
  });

  it('stops reading an endless body once it passes the limit, and cancels it', async () => {
    let chunks = 0;
    let cancelled = false;
    const endless = new ReadableStream<Uint8Array>({
      pull(controller) {
        chunks += 1;
        controller.enqueue(new Uint8Array(1024));
      },
      cancel() {
        cancelled = true;
      },
    });
    expect(await readCapped(post(endless), 4096)).toBeNull();
    expect(cancelled).toBe(true);
    expect(chunks).toBeLessThan(10);
  });
});
