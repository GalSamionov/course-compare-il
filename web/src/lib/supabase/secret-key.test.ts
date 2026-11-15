import { describe, expect, it } from 'vitest';
import { secretKeyShape } from './secret-key';

/** JWT לא חתום, רק עם ה-payload: הבדיקה קוראת את ה-role ולא את החתימה. */
const jwt = (payload: object) =>
  ['{"alg":"HS256","typ":"JWT"}', JSON.stringify(payload)].map((p) => Buffer.from(p).toString('base64url')).join('.') + '.sig';

describe('secretKeyShape', () => {
  it('treats an empty or absent key as missing', () => {
    expect(secretKeyShape(undefined)).toBe('missing');
    expect(secretKeyShape('')).toBe('missing');
    expect(secretKeyShape('   ')).toBe('missing');
  });

  it('accepts the new secret keys and the old service_role JWT', () => {
    expect(secretKeyShape('sb_secret_example0000')).toBe('secret');
    expect(secretKeyShape(jwt({ role: 'service_role', iss: 'supabase' }))).toBe('secret');
  });

  // מה שהיה ב-Vercel ב-15.11.2026: מפתח ציבורי במשתנה של הסודי.
  it('flags a publishable key, or an anon JWT, pasted in place of the secret key', () => {
    expect(secretKeyShape('sb_publishable_example0000')).toBe('public');
    expect(secretKeyShape(` sb_publishable_example0000\n`)).toBe('public');
    expect(secretKeyShape(jwt({ role: 'anon', iss: 'supabase' }))).toBe('public');
  });

  it('leaves any other shape to the database to judge', () => {
    expect(secretKeyShape('not-a-key')).toBe('unknown');
    expect(secretKeyShape('a.b.c')).toBe('unknown');
    expect(secretKeyShape(jwt({ sub: 'x' }))).toBe('unknown');
  });
});
