import { describe, expect, it, vi } from 'vitest';
import type { AdvisorClient } from './claude';
import { createAdviseHandler, type AdviseDeps } from './handler';
import { createAdvisorLimiter } from './rate-limit';
import { sampleCourse } from './sample-course';

interface FakeParams {
  model: string;
  max_tokens: number;
  output_config?: { effort?: string; format?: { type: string } };
  messages: { content: string }[];
}

/** לקוח Anthropic מדומה: מחזיר תמיד את אותה תשובה, ושומר עם מה קראו לו. */
function fakeAnthropic(answer: unknown) {
  const create = vi.fn(async (params: FakeParams) => {
    void params;
    return {
      stop_reason: 'end_turn',
      content: [
        { type: 'thinking', thinking: '', signature: 'sig' },
        { type: 'text', text: JSON.stringify(answer) },
      ],
    };
  });
  return { client: { messages: { create } } as unknown as AdvisorClient, create };
}

const ANSWER = {
  sentences: [
    { text: 'נמשך חודשיים, 24 שעות.', source: 'verified', courseSlug: 'baking-sample' },
    { text: 'משפט עם מקור לא מוכר.', source: 'weak', courseSlug: 'baking-sample' },
  ],
  notEnoughInfo: false,
  missing: '',
};

function setup(overrides: Partial<AdviseDeps> = {}) {
  const anthropic = fakeAnthropic(ANSWER);
  const deps: AdviseDeps = {
    apiKey: () => 'test-key',
    loadCourse: async (slug) => (slug === 'baking-sample' ? sampleCourse() : null),
    userIdFromToken: async (token) => (token === 'good-token' ? 'user-1' : null),
    client: () => anthropic.client,
    limiter: createAdvisorLimiter(),
    ...overrides,
  };
  return { post: createAdviseHandler(deps), create: anthropic.create };
}

function ask(body: unknown, headers: Record<string, string> = {}) {
  return new Request('http://localhost/api/advise', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.7', ...headers },
    body: JSON.stringify(body),
  });
}

const QUESTION = { question: 'כמה זמן זה לוקח?', courseSlugs: ['baking-sample'] };

describe('POST /api/advise', () => {
  it('answers 503 without an Anthropic key, and never calls the model', async () => {
    const { post, create } = setup({ apiKey: () => undefined });
    const response = await post(ask(QUESTION));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'not_configured' });
    expect(create).not.toHaveBeenCalled();
  });

  it('answers 429 once the day is used up, without calling the model again', async () => {
    const { post, create } = setup({
      limiter: createAdvisorLimiter({ visitorPerDay: 1, userPerDay: 2, perMinute: 5 }),
    });
    expect((await post(ask(QUESTION))).status).toBe(200);
    const second = await post(ask(QUESTION));
    expect(second.status).toBe(429);
    expect(await second.json()).toEqual({ error: 'limit', remaining: 0 });
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('asks the model about the courses from the database, and returns only sourced sentences', async () => {
    const { post, create } = setup();
    const response = await post(
      ask({ ...QUESTION, courseSlugs: ['baking-sample', 'gone-sample'] }, { authorization: 'Bearer good-token' }),
    );
    expect(response.status).toBe(200);
    // משתמש מחובר: 30 ביום, ונשארו 29.
    expect(await response.json()).toEqual({
      advice: {
        sentences: [{ text: 'נמשך חודשיים, 24 שעות.', source: 'verified', courseSlug: 'baking-sample' }],
        notEnoughInfo: false,
        missing: null,
      },
      remaining: 29,
    });
    const params = create.mock.calls[0][0];
    expect(params.model).toBe('claude-sonnet-5-5');
    expect(params.max_tokens).toBe(2048);
    // הקריאה הרגילה, עם פלט מובנה, בלי beta ובלי גיבוי בסירוב.
    expect(params.output_config).toEqual({ effort: 'low', format: expect.objectContaining({ type: 'json_schema' }) });
    expect(params).not.toHaveProperty('betas');
    expect(params).not.toHaveProperty('fallbacks');
    const prompt = params.messages[0].content;
    expect(prompt).toContain('[verified] שילמו בפועל: 1,100–1,200 ₪, לפי 4 חשבוניות');
    expect(prompt).toContain('[institution] מתי: שישי 9:00–13:00');
    expect(prompt).not.toContain('gone-sample');
    expect(prompt.endsWith('<visitor_question>\nכמה זמן זה לוקח?\n</visitor_question>')).toBe(true);
  });
});
