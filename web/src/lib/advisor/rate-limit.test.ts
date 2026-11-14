import { describe, expect, it } from 'vitest';
import { createAdvisorLimiter, dayKey } from './rate-limit';

/** 14.11.2026 בצהריים, שעון ישראל (UTC+2 בחורף). */
const NOON = Date.parse('2026-11-14T10:00:00Z');
const MINUTE = 60_000;
const visitor = { ip: '203.0.113.7', userId: null };

describe('createAdvisorLimiter', () => {
  it('lets a visitor ask 10 questions a day, and counts down what is left', () => {
    const limiter = createAdvisorLimiter();
    const left = Array.from({ length: 10 }, (_, i) => limiter.take(visitor, NOON + i * MINUTE));
    expect(left.map((r) => r.remaining)).toEqual([9, 8, 7, 6, 5, 4, 3, 2, 1, 0]);
    expect(left.every((r) => r.allowed)).toBe(true);
    expect(limiter.take(visitor, NOON + 10 * MINUTE)).toEqual({ allowed: false, reason: 'limit', remaining: 0 });
  });

  it('counts a signed-in user by the user, with 30 a day, apart from the visitors on the same IP', () => {
    const limiter = createAdvisorLimiter();
    const user = { ip: visitor.ip, userId: 'user-1' };
    for (let i = 0; i < 10; i++) limiter.take(visitor, NOON + i * MINUTE);
    expect(limiter.take(user, NOON + 10 * MINUTE)).toEqual({ allowed: true, remaining: 29 });
    expect(limiter.take({ ip: '198.51.100.2', userId: 'user-1' }, NOON + 11 * MINUTE)).toEqual({
      allowed: true,
      remaining: 28,
    });
  });

  it('allows only 3 questions a minute from one IP', () => {
    const limiter = createAdvisorLimiter();
    for (let i = 0; i < 3; i++) limiter.take(visitor, NOON + i * 1_000);
    expect(limiter.take(visitor, NOON + 5_000)).toEqual({ allowed: false, reason: 'too_fast', remaining: 7 });
    expect(limiter.take(visitor, NOON + MINUTE + 1_000)).toEqual({ allowed: true, remaining: 6 });
  });

  it('starts a new day at midnight in Israel', () => {
    const limiter = createAdvisorLimiter({ visitorPerDay: 1, userPerDay: 1, perMinute: 5 });
    const beforeMidnight = Date.parse('2026-11-14T21:58:00Z');
    const afterMidnight = Date.parse('2026-11-14T22:01:00Z');
    expect(dayKey(beforeMidnight)).toBe('2026-11-14');
    expect(dayKey(afterMidnight)).toBe('2026-11-15');
    expect(limiter.take(visitor, beforeMidnight).allowed).toBe(true);
    expect(limiter.take(visitor, beforeMidnight + 30_000).allowed).toBe(false);
    expect(limiter.take(visitor, afterMidnight)).toEqual({ allowed: true, remaining: 0 });
  });

  it('gives back a question that was not answered', () => {
    const limiter = createAdvisorLimiter();
    limiter.take(visitor, NOON);
    limiter.giveBack(visitor, NOON);
    expect(limiter.take(visitor, NOON + MINUTE)).toEqual({ allowed: true, remaining: 9 });
  });
});
