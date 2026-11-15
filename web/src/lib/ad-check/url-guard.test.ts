import type { LookupAddress } from 'node:dns';
import { describe, expect, it } from 'vitest';
import { normalizeCourseLink } from '@/lib/course-links/url';
import { checkTarget, isBlockedAddress, makeGuardedLookup } from './url-guard';

describe('isBlockedAddress', () => {
  it.each([
    '10.1.2.3',
    '172.16.0.1',
    '172.31.255.255',
    '192.168.1.1',
    '127.0.0.1',
    '127.8.8.8',
    '169.254.169.254',
    '100.64.0.1',
    '100.127.255.254',
    '0.0.0.0',
    '224.0.0.1',
    '255.255.255.255',
    '::1',
    '::',
    'fe80::1',
    'fd00:ec2::254',
    'fc00::1',
    'ff02::1',
    '::ffff:127.0.0.1',
    '::ffff:10.0.0.1',
    '64:ff9b::a00:1',
    '2002:a00:1::',
    'not-an-ip',
  ])('blocks %s', (address) => {
    expect(isBlockedAddress(address)).toBe(true);
  });

  it.each(['8.8.8.8', '1.1.1.1', '172.32.0.1', '100.128.0.1', '2a00:1450:4001:81a::200e', '::ffff:8.8.8.8'])(
    'allows %s',
    (address) => {
      expect(isBlockedAddress(address)).toBe(false);
    },
  );
});

describe('checkTarget', () => {
  it('allows a normal landing page, on the default ports or 80/443', () => {
    expect(checkTarget('https://www.example.co.il/course?x=1').ok).toBe(true);
    expect(checkTarget('http://example.co.il:80/').ok).toBe(true);
    expect(checkTarget('https://example.co.il:443/').ok).toBe(true);
  });

  it.each([
    ['ftp://example.com/', 'scheme'],
    ['file:///etc/passwd', 'scheme'],
    ['javascript:alert(1)', 'scheme'],
    ['not a url', 'scheme'],
    ['https://user:pass@example.com/', 'credentials'],
    ['https://example.com:8443/', 'port'],
    ['http://example.com:22/', 'port'],
    ['https://localhost/', 'host'],
    ['https://localhost./', 'host'],
    ['https://app.localhost/', 'host'],
    ['https://intranet/', 'host'],
    ['https://intranet./', 'host'],
    ['https://127.0.0.1/', 'host'],
    ['http://2130706433/', 'host'],
    ['http://0x7f.1/', 'host'],
    ['https://[::1]/', 'host'],
    ['https://169.254.169.254/latest/meta-data', 'host'],
    ['https://www.facebook.com/somepage', 'social'],
    ['https://fb.me/abc', 'social'],
    ['https://m.facebook.com/story.php?id=1', 'social'],
    ['https://www.instagram.com/p/abc/', 'social'],
  ])('rejects %s (%s)', (href, problem) => {
    expect(checkTarget(href)).toEqual({ ok: false, problem });
  });

  it('drops a trailing dot from the host before checking it', () => {
    const result = checkTarget('https://example.co.il./course');
    expect(result.ok && result.url.hostname).toBe('example.co.il');
    expect(checkTarget('https://facebook.com./page')).toEqual({ ok: false, problem: 'social' });
  });
});

describe('the link the visitor pasted', () => {
  it('unwraps l.facebook.com/l.php?u= to the landing page, which is then allowed', () => {
    const pasted = 'https://l.facebook.com/l.php?u=https%3A%2F%2Fexample.co.il%2Fcourse%3Ffbclid%3Dabc&h=AT0';
    const url = normalizeCourseLink(pasted);
    expect(url).toBe('https://example.co.il/course');
    expect(checkTarget(url!).ok).toBe(true);
  });

  it('a link that unwraps to a private address is still rejected', () => {
    const url = normalizeCourseLink('https://l.facebook.com/l.php?u=http%3A%2F%2F10.0.0.1%2Fadmin');
    expect(url === null || !checkTarget(url).ok).toBe(true);
  });
});

describe('guardedLookup', () => {
  const resolver =
    (addresses: LookupAddress[]) =>
    (_host: string, _options: unknown, callback: (error: NodeJS.ErrnoException | null, a: LookupAddress[]) => void) =>
      callback(null, addresses);

  function run(addresses: LookupAddress[], all: boolean) {
    const lookup = makeGuardedLookup(resolver(addresses));
    return new Promise<{ error: NodeJS.ErrnoException | null; address: unknown; family?: number }>((resolve) =>
      lookup('example.co.il', { all }, (error, address, family) => resolve({ error, address, family })),
    );
  }

  it('passes public addresses through, in the shape the caller asked for', async () => {
    const list = [{ address: '93.184.216.34', family: 4 }];
    expect(await run(list, true)).toMatchObject({ error: null, address: list });
    expect(await run(list, false)).toMatchObject({ error: null, address: '93.184.216.34', family: 4 });
  });

  it('fails the connection when any address is private (DNS rebinding)', async () => {
    const result = await run(
      [
        { address: '93.184.216.34', family: 4 },
        { address: '10.0.0.5', family: 4 },
      ],
      true,
    );
    expect(result.error?.code).toBe('EADDRBLOCKED');
  });

  it('fails on loopback over IPv6 and on an empty answer', async () => {
    expect((await run([{ address: '::1', family: 6 }], false)).error?.code).toBe('EADDRBLOCKED');
    expect((await run([], false)).error?.code).toBe('EADDRBLOCKED');
  });
});
