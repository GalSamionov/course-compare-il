import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { CALLBACK_PATH, NEXT_COOKIE, safeNextPath } from '@/lib/account/next-path';
import { createServerSupabase } from '@/lib/supabase/server-client';

/**
 * הקישור מהמייל מגיע לכאן. Supabase שולח code (זרימת PKCE, ברירת המחדל של @supabase/ssr),
 * או token_hash ו-type=email אם תבנית המייל תשונה לזה, כמו בתבנית ש-Supabase מציעים. אחרי ההחלפה ההתחברות נשמרת בעוגיות, וחוזרים לעמוד
 * שממנו ביקשו את הקישור.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get('code');
  const tokenHash = params.get('token_hash');

  const cookieStore = await cookies();
  const next = safeNextPath(cookieStore.get(NEXT_COOKIE)?.value ?? null);
  cookieStore.delete({ name: NEXT_COOKIE, path: CALLBACK_PATH });

  const db = await createServerSupabase();
  let ok = false;
  if (code) {
    ok = !(await db.auth.exchangeCodeForSession(code)).error;
  } else if (tokenHash && params.get('type') === 'email') {
    ok = !(await db.auth.verifyOtp({ type: 'email', token_hash: tokenHash })).error;
  }
  // קישור שפג, שכבר נוצל, או שנפתח בדפדפן אחר (ב-PKCE הקוד שייך לדפדפן שביקש אותו).
  const target = ok ? next : `/login?error=link&next=${encodeURIComponent(next)}`;
  // נתיב יחסי: הדפדפן נשאר בכתובת שבה הוא נמצא. request.url בשרת לא תמיד זהה לה
  // (localhost מול 127.0.0.1), ואז העוגיות של ההתחברות היו נשארות בכתובת האחרת.
  // Next מוסיף לתשובה את העוגיות שנכתבו עם cookies() (route-modules/app-route/module.js).
  return new Response(null, { status: 303, headers: { location: target } });
}
