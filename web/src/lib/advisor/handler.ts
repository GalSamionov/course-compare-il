import type { CoursePageData } from '@/lib/data/course-page';
import { askAdvisor, type AdvisorClient } from './claude';
import type { AdvisorLimiter, Asker } from './rate-limit';
import { MAX_COURSES, MAX_QUESTION_LENGTH, type AdviseError, type AdviseResponse } from './types';

/** כל גוף הבקשה: שאלה של 300 תווים ו-10 כתובות של קורסים, עם מרווח. */
const MAX_BODY_CHARS = 2_500;
/** אותה תבנית כמו העמודה courses.slug במסד. */
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** מה שהנתיב צריך מבחוץ. route.ts מחבר את הדברים האמיתיים, והבדיקה מחברת מדומים. */
export interface AdviseDeps {
  /** נקרא בכל בקשה ולא בטעינת הקובץ. בלי מפתח: 503. */
  apiKey: () => string | undefined;
  /** קורס מהמסד, דרך הטוען של עמוד הקורס. null: אין קורס כזה. */
  loadCourse: (slug: string) => Promise<CoursePageData | null>;
  /** המשתמש לפי ה-access token של Supabase, או null כשהוא לא תקף. */
  userIdFromToken: (token: string) => Promise<string | null>;
  client: (apiKey: string) => AdvisorClient;
  limiter: AdvisorLimiter;
}

function fail(error: AdviseError, status: number, remaining?: number): Response {
  return Response.json(remaining === undefined ? { error } : { error, remaining }, { status });
}

/**
 * POST /api/advise עם { question, courseSlugs }.
 * הסדר: מפתח, גוף הבקשה, הקורסים מהמסד, מי שואל, המגבלה, ורק אז המודל.
 * כך בקשה שגויה לא נספרת, ושאלה שלא נענתה מוחזרת.
 */
export function createAdviseHandler(deps: AdviseDeps) {
  return async function POST(request: Request): Promise<Response> {
    const apiKey = deps.apiKey()?.trim();
    if (!apiKey) return fail('not_configured', 503);

    let body: { question?: unknown; courseSlugs?: unknown } | null;
    try {
      const raw = await request.text();
      if (raw.length > MAX_BODY_CHARS) return fail('bad_json', 400);
      body = JSON.parse(raw);
    } catch {
      return fail('bad_json', 400);
    }

    const question = typeof body?.question === 'string' ? body.question.trim() : '';
    if (question === '' || question.length > MAX_QUESTION_LENGTH) return fail('bad_question', 400);
    const given = body?.courseSlugs;
    if (
      !Array.isArray(given) ||
      given.length === 0 ||
      given.length > MAX_COURSES ||
      !given.every((slug) => typeof slug === 'string' && SLUG.test(slug))
    ) {
      return fail('bad_courses', 400);
    }

    // הנתונים מהמסד, דרך אותו טוען (והמטמון) של עמוד הקורס. מהדפדפן מגיעה רק רשימת כתובות.
    let courses: CoursePageData[];
    try {
      const loaded = await Promise.all([...new Set(given as string[])].map((slug) => deps.loadCourse(slug)));
      courses = loaded.filter((c): c is CoursePageData => c !== null && c.status !== 'removed');
    } catch (error) {
      console.error('advise: loading courses failed:', error instanceof Error ? error.message : 'unknown error');
      return fail('failed', 502);
    }
    if (courses.length === 0) return fail('no_courses', 400);

    // ב-Vercel הכתובת הראשונה ב-x-forwarded-for היא של המבקר.
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
    const token = request.headers.get('authorization')?.match(/^Bearer\s+(\S+)$/i)?.[1];
    // טוקן שלא אומת לא נכשל: השואל נספר כמבקר.
    const userId = token ? await deps.userIdFromToken(token).catch(() => null) : null;
    const asker: Asker = { ip, userId };

    const limit = deps.limiter.take(asker);
    if (!limit.allowed) return fail(limit.reason, 429, limit.remaining);

    try {
      const advice = await askAdvisor(deps.client(apiKey), question, courses);
      return Response.json({ advice, remaining: limit.remaining } satisfies AdviseResponse);
    } catch (error) {
      // השאלה לא נענתה, ולכן היא לא נספרת. רק ההודעה נרשמת ביומן, בלי השאלה: שום דבר מהמבקר לא נשמר.
      deps.limiter.giveBack(asker);
      console.error('advise failed:', error instanceof Error ? error.message : 'unknown error');
      return fail('failed', 502);
    }
  };
}
