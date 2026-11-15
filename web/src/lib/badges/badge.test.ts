import { describe, expect, it } from 'vitest';
import {
  badgeHeadline,
  badgePath,
  badgeTitle,
  badgeUrl,
  isBadgeToken,
  linkedInShareHref,
  tokenFromPath,
} from './badge';

const TOKEN = 'Ab3_-9zZ0123456789abcdefGHIJKLMN';

describe('isBadgeToken', () => {
  it('accepts exactly 32 base64url characters, like the database check', () => {
    expect(TOKEN).toHaveLength(32);
    expect(isBadgeToken(TOKEN)).toBe(true);
  });

  it('refuses anything else', () => {
    expect(isBadgeToken(TOKEN.slice(1))).toBe(false);
    expect(isBadgeToken(`${TOKEN}a`)).toBe(false);
    expect(isBadgeToken(`${TOKEN.slice(1)}+`)).toBe(false);
    expect(isBadgeToken(`${TOKEN.slice(1)}/`)).toBe(false);
    expect(isBadgeToken(`${TOKEN.slice(1)}=`)).toBe(false);
    expect(isBadgeToken('11111111-2222-3333-4444-555555555555')).toBe(false);
    expect(isBadgeToken(null)).toBe(false);
    expect(isBadgeToken(32)).toBe(false);
  });
});

describe('badge urls', () => {
  it('builds the page path and the full url', () => {
    expect(badgePath(TOKEN)).toBe(`/verified/${TOKEN}`);
    expect(badgeUrl('https://lamadti.co.il/', TOKEN)).toBe(`https://lamadti.co.il/verified/${TOKEN}`);
    expect(badgeUrl('http://localhost:3000', TOKEN)).toBe(`http://localhost:3000/verified/${TOKEN}`);
  });

  it('reads the token from the page and from the image under it', () => {
    expect(tokenFromPath(`/verified/${TOKEN}`)).toBe(TOKEN);
    expect(tokenFromPath(`/verified/${TOKEN}/opengraph-image`)).toBe(TOKEN);
    expect(tokenFromPath(`/verified/${TOKEN}/opengraph-image-1a2b3c`)).toBe(TOKEN);
  });

  it('gives null for a path that is not a badge, so the proxy answers 404 without asking the database', () => {
    expect(tokenFromPath('/verified/')).toBeNull();
    expect(tokenFromPath('/verified/gone')).toBeNull();
    expect(tokenFromPath(`/verified/${TOKEN}x`)).toBeNull();
    expect(tokenFromPath(`/courses/${TOKEN}`)).toBeNull();
    expect(tokenFromPath(`/verifiedx/${TOKEN}`)).toBeNull();
  });

  it('opens the LinkedIn share window with the badge url, encoded', () => {
    expect(linkedInShareHref(`https://lamadti.co.il/verified/${TOKEN}`)).toBe(
      `https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Flamadti.co.il%2Fverified%2F${TOKEN}`,
    );
  });
});

describe('badge text', () => {
  const course = { courseTitle: 'פיתוח Full Stack' };

  it('says nothing about the person by default: no name, no gender', () => {
    expect(badgeTitle({ shownName: null, shownTitle: null })).toBe('בוגר/ת מאומת/ת');
    expect(badgeHeadline({ ...course, shownName: null, shownTitle: null })).toBe('בוגר/ת מאומת/ת של פיתוח Full Stack');
  });

  it('uses the title only together with a name the author chose to show', () => {
    expect(badgeTitle({ shownName: null, shownTitle: 'graduate_f' })).toBe('בוגר/ת מאומת/ת');
    expect(badgeHeadline({ ...course, shownName: 'דנה כ.', shownTitle: 'graduate_f' })).toBe(
      'דנה כ., בוגרת מאומתת של פיתוח Full Stack',
    );
    expect(badgeHeadline({ ...course, shownName: 'יוסי ל.', shownTitle: 'graduate_m' })).toBe(
      'יוסי ל., בוגר מאומת של פיתוח Full Stack',
    );
    expect(badgeHeadline({ ...course, shownName: 'נועם', shownTitle: 'none' })).toBe('נועם, בוגר/ת מאומת/ת של פיתוח Full Stack');
  });
});
