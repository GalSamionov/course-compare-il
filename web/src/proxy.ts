import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/lib/database.types';

/**
 * רק /admin, וכל מה שיהיה מתחתיו (/admin/...). כל עמוד אחר נשאר בלי proxy (תוכנית 2ב, החלטה 2): proxy שרץ בכל צפייה היה עולה בכל עמוד, בשביל כלום.
 * למה כאן כן: עם Cache Components, notFound() שרץ בבקשה בתוך העמוד משאיר סטטוס 200
 * (loading.md, "Status codes"). מי שאינו מנהל צריך לקבל 404 אמיתי, בלי לדעת שיש כאן משהו.
 * ה-proxy גם מרענן את ההתחברות וכותב את העוגיות (proxy.md, "Using Cookies"), כדי שהעמוד, שמוצג בשרת, לא יצטרך.
 * הוא לא ההגנה היחידה: העמוד וכל Server Action בודקים שוב (server-actions.md, Security).
 * Server Actions של התור הן POST ל-/admin, ולכן גם הן עוברות כאן (proxy.md, "Execution order").
 */
export const config = { matcher: ['/admin', '/admin/:path*'] };

/**
 * כתובת שאין לה עמוד: Next מחזיר את עמוד ה-404 שלו, כמו לכל כתובת שלא קיימת.
 * עוגיות שרועננו עוברות גם ל-404: אחרת הדפדפן היה נשאר עם טוקן רענון שכבר נוצל, ומשתמש רגיל היה מתנתק.
 */
function notFound(request: NextRequest, refreshed?: NextResponse) {
  const response = NextResponse.rewrite(new URL('/admin-not-found', request.url), { status: 404 });
  for (const cookie of refreshed?.cookies.getAll() ?? []) response.cookies.set(cookie);
  return response;
}

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return notFound(request);

  let response = NextResponse.next({ request });
  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        // ההתחברות שרועננה עוברת גם לעמוד (בבקשה) וגם לדפדפן (בתשובה).
        for (const { name, value } of toSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of toSet) response.cookies.set(name, value, options);
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  if (!data.user) return notFound(request, response);
  // is_admin() בהרשאות של המשתמש: לא צריך את המפתח הסודי, שעוד לא קיים ב-Vercel.
  const { data: isAdmin } = await supabase.rpc('is_admin');
  return isAdmin === true ? response : notFound(request, response);
}
