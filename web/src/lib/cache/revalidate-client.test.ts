import { describe, expect, it } from 'vitest';
import { requestRevalidation, revalidateTarget } from './revalidate-client';

const TOKEN = 't'.repeat(40);
const LIVE_DB = 'https://example.supabase.co';
const LOCAL_DB = 'http://127.0.0.1:54321';
const SEND = { kind: 'send', endpoint: 'https://lamadti.example/api/revalidate', token: TOKEN } as const;

describe('revalidateTarget', () => {
  it('sends only with a token and a site, in the same environment as the database', () => {
    expect(revalidateTarget({})).toMatchObject({ kind: 'skip' });
    expect(revalidateTarget({ REVALIDATE_TOKEN: TOKEN })).toMatchObject({ kind: 'skip' });
    expect(revalidateTarget({ REVALIDATE_TOKEN: TOKEN, REVALIDATE_URL: 'http://lamadti.example' })).toMatchObject({ kind: 'skip' });
    expect(
      revalidateTarget({ REVALIDATE_TOKEN: TOKEN, REVALIDATE_URL: 'https://lamadti.example', NEXT_PUBLIC_SUPABASE_URL: LOCAL_DB }),
    ).toMatchObject({ kind: 'skip' });
    expect(
      revalidateTarget({ REVALIDATE_TOKEN: TOKEN, REVALIDATE_URL: 'http://localhost:3000', NEXT_PUBLIC_SUPABASE_URL: LIVE_DB }),
    ).toMatchObject({ kind: 'skip' });
    expect(
      revalidateTarget({ REVALIDATE_TOKEN: TOKEN, REVALIDATE_URL: 'https://lamadti.example/', NEXT_PUBLIC_SUPABASE_URL: LIVE_DB }),
    ).toEqual(SEND);
    expect(
      revalidateTarget({ REVALIDATE_TOKEN: TOKEN, REVALIDATE_URL: 'http://localhost:3000', NEXT_PUBLIC_SUPABASE_URL: LOCAL_DB }),
    ).toEqual({ kind: 'send', endpoint: 'http://localhost:3000/api/revalidate', token: TOKEN });
  });
});

describe('requestRevalidation', () => {
  it('posts the courses in chunks of 500, with the token only in the header', async () => {
    const calls: RequestInit[] = [];
    const fake = (async (_url: string | URL | Request, init?: RequestInit) => {
      calls.push(init ?? {});
      return new Response('{"ok":true}', { status: 200 });
    }) as typeof fetch;
    const slugs = Array.from({ length: 1001 }, (_, i) => `course-${i}`);
    expect(await requestRevalidation(slugs, SEND, fake)).toBe(3);
    expect(calls.map((c) => (JSON.parse(String(c.body)) as { courses: string[] }).courses.length)).toEqual([500, 500, 1]);
    expect(new Headers(calls[0].headers).get('authorization')).toBe(`Bearer ${TOKEN}`);
    expect(String(calls[0].body)).not.toContain(TOKEN);
  });

  it('fails with the status, and never with the token', async () => {
    const fake = (async () => new Response('{"error":"unauthorized"}', { status: 401 })) as typeof fetch;
    const error = (await requestRevalidation(['a'], SEND, fake).catch((e: unknown) => e)) as Error;
    expect(error.message).toContain('401');
    expect(error.message).not.toContain(TOKEN);
  });
});
