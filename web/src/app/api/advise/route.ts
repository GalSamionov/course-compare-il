import Anthropic from '@anthropic-ai/sdk';
import { ADVISOR_TIMEOUT_MS } from '@/lib/advisor/claude';
import { createAdviseHandler } from '@/lib/advisor/handler';
import { advisorLimiter } from '@/lib/advisor/rate-limit';
import { getCoursePage } from '@/lib/data/course-page';
import { createPublicClient } from '@/lib/supabase/public-client';

/** שני ניסיונות של 25 שניות למודל, ועוד טעינת הקורסים. */
export const maxDuration = 60;

/** POST { question, courseSlugs } ומחזיר { advice, remaining }. הלוגיקה והבדיקה ב-lib/advisor/handler. */
export const POST = createAdviseHandler({
  apiKey: () => process.env.ANTHROPIC_API_KEY,
  loadCourse: getCoursePage,
  // getUser(token) בודק את הטוקן מול Supabase Auth, עם המפתח הציבורי. בלי המפתח הסודי.
  userIdFromToken: async (token) => {
    const { data, error } = await createPublicClient().auth.getUser(token);
    return error || !data.user ? null : data.user.id;
  },
  client: (apiKey) => new Anthropic({ apiKey, timeout: ADVISOR_TIMEOUT_MS, maxRetries: 1 }),
  limiter: advisorLimiter,
});
