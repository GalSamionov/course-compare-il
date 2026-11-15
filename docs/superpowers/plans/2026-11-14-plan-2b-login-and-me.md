# תוכנית 2ב: התחברות ואזור אישי

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** התחברות בקישור למייל, בלי סיסמה, ואזור אישי (`/me`): התשובות מדף הבית, קורסים ששמרתי, ההשוואה שלי (3 מקומות בדיוק), "הביקורות שלי" (בקרוב), התנתקות ומחיקת חשבון עם שלב אישור. כפתור "לשמור" בעמוד הקורס ובשורות התוצאה, "להשוואה" בעמוד הקורס ובאזור האישי, ושמירת התשובות מדף הבית. מבקר לא מחובר: ההשוואה בדפדפן, ובקשת שמירה מחכה בדפדפן עד אחרי ההתחברות. בתפריט, "התחברות" הופכת ל"האזור שלי".

**Architecture:**
- **העמודים נשארים סטטיים.** מצב ההתחברות נקרא בדפדפן בלבד: מודול אחד (`web/src/lib/account/store.ts`) עם `useSyncExternalStore`. בבנייה ובהידרציה הוא `'loading'`, ומיד אחר כך המצב האמיתי. הכותרת, כפתורי השמירה והאזור האישי קוראים ממנו.
- **ההתחברות:** `@supabase/ssr` עם PKCE (ברירת המחדל שלו). הדפדפן שולח קישור, נתיב בשרת (`/auth/callback`) מחליף את הקוד בהתחברות ושומר אותה בעוגיות, וחוזר לעמוד שממנו באו. לאן לחזור נשמר בעוגייה קצרה, ונבדק שהוא נתיב באתר.
- **הרשימות:** שלוש טבלאות עם RLS לבעלים בלבד והרשאות ל-`authenticated` בלבד. הדפדפן קורא וכותב בהן ישירות, עם ההתחברות של המשתמש. רק מחיקת החשבון עוברת בשרת (`POST /api/account/delete`), כי היא צריכה את המפתח הסודי.
- **אין proxy (middleware).** אף רכיב שרת לא קורא את ההתחברות. שני הנתיבים בשרת יכולים לכתוב עוגיות בעצמם.

**Tech Stack:** Next.js 16.4 (Cache Components, `ensureStatic`), React 19.3, TypeScript, Tailwind CSS v4, shadcn/ui, Supabase Auth עם `@supabase/ssr` 0.12.7, Postgres RLS, pgTAP, Vitest, Playwright, Mailpit (המייל המקומי של Supabase), pnpm.

**מקור:**
- מסמך העיצוב: `docs/superpowers/specs/2026-11-13-round-2-public-site-design.md`, סעיפים 5, 8 ו-10.
- הציורים המאושרים: `design/canvas/Login.dc.html` (הטופס, ו"עכשיו לתיבת המייל") ו-`design/canvas/Me.dc.html` (האזור האישי). לכפתורים בעמוד הקורס: `design/canvas/Chosen.dc.html`. לשורות התוצאה: `design/canvas/HomeB.dc.html`.
- חוזה העיצוב: `.impeccable/surfaces/course-page.md`.
- מפת הדרכים: `docs/ROADMAP.md`, סעיפים 16 ו-17.

---

## מפת התוכניות של סבב 2

1. **תוכנית 2א:** בוצעה. דף הבית, עמוד תחום, כל הקורסים, הבנת "מה", עמודי טקסט ו"בקרוב".
2. **תוכנית 2ב (המסמך הזה):** התחברות ואזור אישי (סעיף 5).
3. **תוכנית 2ג:** יועץ הלימודים (סעיף 6, החצי השני).

## איך עובדים בתוכנית הזו

- **תיקייה:** כל הפקודות רצות מ-`C:/Users/galsa/Desktop/קורסים השוואות`, אלא אם כתוב `cd web`. בנתיב יש אותיות עבריות, ולכן תמיד במירכאות.
- **מסד מקומי:** Docker Desktop רץ, ו-`pnpm db:start` כבר הופעל. שינוי ב-`[auth]` של `supabase/config.toml` נכנס לתוקף רק אחרי `pnpm db:stop` ו-`pnpm db:start` (משימה 1).
- **מיילים מקומיים:** Supabase המקומי לא שולח מיילים. הוא תופס אותם ב-Mailpit, ב-`http://127.0.0.1:54324` (`MAILPIT_URL` ב-`pnpm exec supabase status -o env`). שם לוחצים על הקישור בבדיקות ידניות, ושם בדיקת הקצה לקצה קוראת אותו (דרך `/api/v1/search` ו-`/api/v1/message/<ID>`).
- **כל משימה מסתיימת ירוקה:**
  - תמיד: `pnpm lint`, `pnpm exec tsc --noEmit` ו-`pnpm test` מתוך `web/`.
  - משימות מסד: גם `pnpm db:test` (30 בדיקות אחרי משימה 1).
  - משימות ממשק: גם `pnpm build`, ו-`pnpm e2e` כשכתוב.
- **בדיקות מקצה לקצה:** `playwright.config.ts` משתמש בשרת קיים על פורט 3000 אם יש כזה. לפני `pnpm e2e` עוצרים כל `pnpm dev` או `pnpm start` שרץ, כדי שהבדיקה תבנה את הקוד החדש.
- **לוכסן הפוך:** בקובץ הבדיקה של `next-path` יש `'\\'`. כותבים אותו עם כלי עריכת קבצים, לא עם heredoc ב-bash, שמוחק לוכסנים.
- **תיעוד סשן:** לפי `CLAUDE.md`. שורה בקובץ הסשן אחרי כל קומיט ובדיקה.
- **עיצוב:** כל משימת ממשק (5, 6 ו-7) מתחילה בצעד קריאה קבוע. הוא כתוב מחדש בכל משימה, כדי שאפשר יהיה לקרוא אותה לבד.
- **הכלל של גל:** סטייה מהציור המאושר לא מתקבלת. כל משימת ממשק נגמרת בבדיקה מול הציור ברוחב 390, ומתקנים לפני הקומיט.

## החלטות שהתוכנית נשענת עליהן

1. **העמודים סטטיים, וההתחברות נקראת בדפדפן.**
   - `web/node_modules/next/dist/docs/01-app/02-guides/authentication-with-cache-components.md`: קריאה של ההתחברות בשרת לא יכולה להיות חלק מהמעטפת הסטטית. היא תמיד מאחורי `<Suspense>`, ורצה בכל בקשה.
   - `web/node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/ensureStatic.md`: עם `'navigation'`, קריאה ל-`cookies()` נכשלת בבנייה "even when it is wrapped in `<Suspense>`". לעומת זאת, "Client Components can load request-specific content in the browser".
   - לכן כל העמודים (גם `/login` ו-`/me`) נשארים עם `ensureStatic = 'navigation'`. הקטלוג מגיע מ-`getCatalog` שבמטמון, והרשימות של המשתמש נטענות בדפדפן עם ההרשאות שלו. הן אף פעם לא נשמרות במטמון בשרת.
   - **המחיר:** משתמש מחובר רואה לרגע "התחברות" בתפריט, וכפתור "לשמור" לא מסומן, עד שהדפדפן קורא את העוגייה. מבקר לא מחובר (רוב המבקרים) לא שולח אף בקשה נוספת: הבדיקה היא קריאה של עוגייה.
2. **בלי proxy.**
   - `web/node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`: "Starting with Next.js 16, Middleware is now called Proxy". שם גם: proxy "should not be used as a full session management or authorization solution".
   - המדריך של Supabase ל-Next (Creating a Supabase client for SSR) מוסיף proxy כי "Next.js Server Components can't write cookies". אצלנו אף Server Component לא קורא את ההתחברות. שני הנתיבים בשרת כותבים עוגיות בעצמם (`03-api-reference/04-functions/cookies.md`: `.set` מותר ב-Route Handlers). בדפדפן, `createBrowserClient` מרענן את ההתחברות לבד (`autoRefreshToken` בדפדפן).
   - proxy היה רץ בכל צפייה בכל עמוד סטטי, בשביל כלום.
3. **קישור למייל עם PKCE.**
   - `createBrowserClient` ב-`@supabase/ssr` 0.12.7 קובע `flowType: "pkce"` (נבדק ב-`dist/main/createBrowserClient.js`). Supabase שולח קישור ל-`/auth/v1/verify`, שמחזיר ל-`/auth/callback?code=...`, והנתיב קורא ל-`exchangeCodeForSession`.
   - תבנית המייל לא משתנה, לא מקומית ולא בענן. הנתיב מקבל גם `token_hash` עם `type=email`, למקרה שבעתיד ישנו את התבנית.
   - ב-PKCE הקישור עובד רק בדפדפן שביקש אותו. זה בדיוק מה שהציור אומר: "פותחים את הקישור באותו טלפון ובאותו דפדפן שבהם ביקשתם אותו".
4. **לאן לחזור: בעוגייה, ולא בקישור.**
   - Supabase ממליצים שכתובת החזרה באתר באוויר תהיה כתובת מדויקת (מדריך Redirect URLs: "we recommend setting the exact redirect URL path for your site URL in production"). לכן הקישור תמיד חוזר ל-`/auth/callback`, ו-`next` נשמר בעוגייה `login_next`, לשעה, רק לנתיב הזה.
   - הנתיב בודק את `next` עם `safeNextPath`: רק נתיב באתר. `//evil.com`, `/\evil.com`, תווי בקרה, ו-`/.//evil.com` (שהנירמול הופך ל-`//evil.com`) חוזרים ל-`/`.
   - **נבדק מקומית בזמן הכתיבה:** Supabase מקבל כל נתיב באותו host של ה-Site URL, ומחליף כתובת מ-host אחר ב-Site URL. קישור שביקש `http://localhost:3000/auth/callback`, כשה-Site URL הוא `http://127.0.0.1:3000`, הגיע בלי הנתיב. לכן ה-Site URL המקומי עובר ל-`http://localhost:3000` (הכתובת של Playwright), ובענן ל-`https://course-compare-il.vercel.app`.
5. **הנתיב מחזיר נתיב יחסי (303).** בזמן הכתיבה, `NextResponse.redirect(new URL(target, request.url))` שלח מ-`127.0.0.1` ל-`localhost`, והעוגיות של ההתחברות נשארו ב-host הראשון. כתובת יחסית משאירה את הדפדפן איפה שהוא. Next מוסיף לכל `Response` את העוגיות שנכתבו עם `cookies()` (`web/node_modules/next/dist/server/route-modules/app-route/module.js`, "It's possible cookies were set in the handler").
6. **ההשוואה היא חלק מהשמורים.**
   - מפתח זר מ-`compare_items (user_id, course_id)` ל-`saved_courses`, עם `on delete cascade`.
   - כך בציור: "להשוואה" מופיע על קורסים שמורים, והמקום הפנוי אומר "להוסיף מהשמורים". גם בעמוד ההתחברות: "שומרים אצלנו רק שלושה דברים: המייל, הקורסים ששמרתם והתשובות שלכם".
   - הוספה להשוואה שומרת את הקורס. הסרה מהשמורים מוציאה אותו גם מההשוואה.
7. **שלושה מקומות, במסד.** `position` בין 1 ל-3, מפתח ראשי `(user_id, position)` ו-`unique (user_id, course_id)`. אין מקום רביעי, בלי trigger. מקום שהתפנה נשאר ריק במקומו, כמו המקומות הממוספרים בציור. קורס חדש נכנס למקום הפנוי הראשון.
8. **התשובות נשמרות בצורה של הכתובת.** `user_answers.answers` הוא אובייקט כמו `{"cat": "cooking", "when": "evening"}`, בדיוק הפרמטרים ש-`serializeQuery` כותב. "התשובות שלי" קוראות אותו עם `parseQuery`, שמסנן כל ערך לא מוכר, ו"לחזור לרשימה" הוא `/?` ועוד `serializeQuery`. הגודל מוגבל ל-2,000 בתים במסד.
9. **מה שמבקר לא מחובר ביקש, נעשה אחרי ההתחברות.**
   - ההשוואה של מבקר לא מחובר נשמרת ב-`localStorage`. גם "לשמור" על קורס או על התשובות נרשם שם, לפני המעבר להתחברות.
   - מיד אחרי ההתחברות, `mergeIntoAccount` מחליטה מה להוסיף: כל קורס מההשוואה שבדפדפן נשמר, הקורסים נכנסים למקומות הפנויים לפי הסדר, ומה שלא נכנס נשאר בשמורים. אחר כך הדפדפן מתנקה.
   - כך הלחיצה על "לשמור" לא הולכת לאיבוד בדרך דרך המייל.
10. **הדפדפן כותב ישירות למסד.** בלי Server Actions: העמודים סטטיים, ו-RLS הוא השומר. השרת נדרש רק למחיקת חשבון.
11. **מחיקת חשבון:**
    - **הנתיב:** `POST /api/account/delete`.
    - **CSRF:** בודקים שה-host של `Origin` זהה ל-`Host`. אתר אחר לא יכול לזייף את `Origin`. עוגיית ההתחברות היא גם `SameSite=Lax` (ברירת המחדל של `@supabase/ssr`), ולא נשלחת ב-POST מאתר אחר.
    - **מי מוחק:** `getUser()` מאמת את ההתחברות מול Supabase, ואז `auth.admin.deleteUser` עם `SUPABASE_SECRET_KEY`, רק בשרת. המפתחות הזרים מוחקים את כל השורות.
    - **גם המייל ברישום של Supabase.** נבדק מקומית: `auth.audit_log_entries` שומר את המייל בכל כניסה, וגם ברשומה `user_deleted` על המחיקה עצמה, ולא נמחק עם המשתמש. לכן ה-migration מוסיף פונקציה `forget_auth_log(uuid)`, ש-`service_role` בלבד יכול להריץ, והנתיב קורא לה אחרי המחיקה. נבדק: אחרי מחיקה בבדיקת הקצה, לא נשארה אף שורה של המשתמש ברישום. בענן בודקים במשימה 9 שהבעלים של הפונקציה (`postgres`) רשאי למחוק שם.
    - **בלי מפתח:** הנתיב מחזיר 503, והעמוד אומר שלא נמחק כלום.
    - **אחרי המחיקה:** הדפדפן מנתק את עצמו (`signOut('local')`) ומנקה את `localStorage`.
12. **הרשאות:** רק ל-`authenticated`.
    - `saved_courses` ו-`compare_items`: select, insert ו-delete.
    - `user_answers`: select, insert ו-update, בשביל upsert. אין delete: המחיקה עוברת דרך המפתח הזר.
    - ל-`anon` אין כלום: ברירות המחדל מתוכנית 1 חוסמות כל טבלה חדשה.
    - בדיקת pgTAP 18 ("אין הרשאת כתיבה ציבורית") הופכת לרשימת מותרים, כמו שכתוב ב-`notes-for-plan-2.md`.
13. **pgTAP, 5 בדיקות חדשות:**
    - לכל טבלה בדיקה אחת שמשתמש אחר לא רואה ולא משנה. כל בדיקה מריצה פקודה אחת בשם משתמש ב': `delete` או `update` בתוך `with`, ו-`count` על אותה טבלה. התוצאה צריכה להיות `(0, 0)`.
    - בדיקה אחת למגבלת שלושת המקומות.
    - בדיקה אחת מעבר לבקשה: משתמש לא יכול להוסיף שורה בשם של אחר. שלוש הראשונות בודקות את `using`, וזו את `with check`.
    - **נבדק:** כשמדיניות הקריאה היא `using (true)`, שלוש הבדיקות הראשונות נכשלות.
14. **"לשמור" ו"להשוואה":** הכפתור עם הריבוע והווי בעט, כמו "להשוואה" ב-`Me.dc.html`. זה `ChoiceChip` הקיים, עם תווית קבועה, ומצב שמסומן בווי.
    - **שורת תוצאה:** בסוף השורה.
    - **עמוד הקורס:** מתחת לשני הכפתורים מהציור. "להשוואה (עד 3)" שומר על המראה מהציור, והופך למתג (`role="checkbox"`). כשהקורס בהשוואה, מופיע בו ריבוע עם וי.
    - **דף הבית:** "לשמור את התשובות באזור שלי" מתחת לכפתור הגדול, רק כשיש תשובה שמסננת. אחרי השמירה: "← התשובות נשמרו. לאזור שלי" בעט.
    - **לא מצויר:** אף אחד מהשלושה לא בציור, וגל מאשר אותם בבדיקה מול הציור (משימה 7). הם בנויים רק מחלקים שכבר בציורים.
15. **שלב האישור במחיקה לא מצויר.** בתוך החלק "החשבון": שאלה מודגשת, משפט מה יימחק, "כן, למחוק הכול" (הכפתור השחור הרגיל) ו"לא, להשאיר". בלי אדום: הוא לא במערכת הצבעים.
16. **הענן:**
    - **מה יש היום:** הרצה של `supabase config diff` לקריאה בלבד, מול תצורה מינימלית, הראתה Site URL `http://localhost:3000` ורשימת כתובות חזרה ריקה. בלי שינוי, קישור מהאתר באוויר היה חוזר ל-localhost.
    - **`config push` מהפרויקט לא בטוח.** `supabase/config.toml` מכריז על ערכים מקומיים: Site URL של localhost, `max_frequency = "1s"` ו-`enable_confirmations = false`.
    - **מה כן בטוח:** תצורה של שתי שורות בתיקייה זמנית. `config diff` הראה שרק שני הערכים האלה משתנים ("update"), וכל השאר "remote_only", כלומר נשאר כמו שהוא.
    - **מיילים:** שירות המייל המובנה שולח רק למיילים של הצוות בארגון ב-Supabase, וכמה מיילים בשעה בלבד (מדריך Send emails with custom SMTP). עד סבב 6 רק גל יכול להתחבר באוויר. הטופס מציג הודעה ברורה ל-`email_address_not_authorized`.
    - **אישור הרשמה:** בענן `enable_confirmations` פעיל. לכן המייל הראשון של משתמש חדש הוא "Confirm signup", עם אותה זרימה של קישור. בודקים את זה בבדיקה של גל בנייד.
17. **מדיניות הפרטיות** עוברת להווה: מה נשמר כשמתחברים (שלושה דברים), העוגייה, `localStorage`, רישום הכניסות של Supabase, ומחיקת החשבון (גם הרישום). יומני השרתים של Supabase, מחוץ למסד, נמחקים שם מעצמם אחרי זמן קצר, וזה כתוב.
18. **קורס שהוסר מהאתר** לא מופיע באזור האישי, כי האזור מציג רק קורסים מהקטלוג. היום אף קורס לא הוסר. ההערה נרשמת ב-`notes-for-plan-2.md`.

## מבנה הקבצים בתוכנית הזו

```
supabase/migrations/20261114000001_user_lists.sql   # חדש: saved_courses, compare_items, user_answers, RLS, הרשאות ו-forget_auth_log
supabase/tests/user-lists.test.sql                  # חדש: 5 בדיקות
supabase/tests/rls.test.sql                         # בדיקה 18: רשימת מותרים
supabase/config.toml                                # כתובות ההתחברות המקומיות
web/package.json, web/pnpm-lock.yaml                # @supabase/ssr
web/.env.example                                    # SUPABASE_SECRET_KEY משמש גם את נתיב המחיקה
web/src/lib/database.types.ts                       # נוצר מחדש
web/src/lib/supabase/browser-client.ts              # חדש: החיבור בדפדפן, עם עוגיות
web/src/lib/supabase/server-client.ts               # חדש: החיבור בנתיבים בשרת
web/src/lib/supabase/admin-client.ts                # חדש: המפתח הסודי, server-only
web/src/lib/account/next-path.ts                    # חדש: לאן לחזור, ובדיקה שזה נתיב באתר
web/src/lib/account/next-path.test.ts
web/src/lib/account/lists.ts                        # חדש: הרשימות בדפדפן, והמיזוג לחשבון
web/src/lib/account/lists.test.ts
web/src/lib/account/store.ts                        # חדש: מצב המבקר, והשמירות
web/src/lib/search/types.ts                         # CourseSummary.id
web/src/lib/data/catalog.ts                         # id
web/src/lib/data/course-page.ts                     # id
web/src/lib/search/match.test.ts                    # id בנתוני הבדיקה
web/src/lib/search/keywords.test.ts                 # id בנתוני הבדיקה
web/src/app/auth/callback/route.ts                  # חדש
web/src/app/api/account/delete/route.ts             # חדש
web/src/components/account/login-form.tsx           # חדש
web/src/app/login/page.tsx                          # התחברות במקום "בקרוב"
web/src/components/notebook/choice-chip.tsx         # disabled
web/src/components/notebook/results.tsx            # actions ו-highlight, ואחר כך "לשמור"
web/src/components/account/me-section.tsx           # חדש
web/src/components/account/my-answers.tsx           # חדש
web/src/components/account/saved-courses.tsx        # חדש
web/src/components/account/compare-tray.tsx         # חדש
web/src/components/account/account-section.tsx      # חדש
web/src/components/account/me-area.tsx              # חדש
web/src/app/me/page.tsx                             # חדש
web/src/components/site/account-link.tsx            # חדש
web/src/components/site/site-header.tsx             # "התחברות" או "האזור שלי"
web/src/components/account/save-button.tsx          # חדש
web/src/components/course/course-actions.tsx        # רכיב לקוח: השוואה ושמירה
web/src/app/courses/[slug]/page.tsx                 # id ושם לכפתורים
web/src/components/account/save-answers.tsx         # חדש
web/src/components/notebook/notebook.tsx            # saveAnswers
web/src/app/page.tsx                                # saveAnswers
web/src/app/privacy/page.tsx                        # בהווה, עם ההתחברות
web/e2e/account.spec.ts                             # חדש: 2 בדיקות
docs/STATUS.md
docs/superpowers/plans/notes-for-plan-2.md
```

---

### Task 1: הטבלאות, ההרשאות והבדיקות במסד

**Files:**
- Create: `supabase/tests/user-lists.test.sql`
- Modify: `supabase/tests/rls.test.sql` (בדיקה 18)
- Create: `supabase/migrations/20261114000001_user_lists.sql`
- Modify: `supabase/config.toml` (`[auth]`)
- Modify: `web/src/lib/database.types.ts` (נוצר מחדש)

- [ ] **Step 1: הבדיקות החדשות**

Create `supabase/tests/user-lists.test.sql`:

```sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(5);

-- שני משתמשים, ונתוני בדיקה של משתמש א'. נכתבים כ-postgres, שעוקף את ההרשאות.
insert into auth.users (id, email) values
  ('bbbbbbbb-0000-0000-0000-00000000000a', 'user-a@example.com'),
  ('bbbbbbbb-0000-0000-0000-00000000000b', 'user-b@example.com');
insert into categories (id, slug, name, course_type)
values ('bbbbbbbb-0000-0000-0000-000000000001', 'lists-cat', 'תחום בדיקה', 'career');
insert into institutions (id, slug, name, kind)
values ('bbbbbbbb-0000-0000-0000-000000000002', 'lists-inst', 'מוסד בדיקה', 'independent');
insert into courses (id, slug, institution_id, category_id, title, status)
select ('bbbbbbbb-0000-0000-0000-00000000001' || n)::uuid, 'lists-' || n,
       'bbbbbbbb-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000001', 'קורס ' || n, 'active'
from generate_series(1, 4) as n;
insert into saved_courses (user_id, course_id)
select 'bbbbbbbb-0000-0000-0000-00000000000a', ('bbbbbbbb-0000-0000-0000-00000000001' || n)::uuid
from generate_series(1, 4) as n;
insert into compare_items (user_id, course_id, position) values
  ('bbbbbbbb-0000-0000-0000-00000000000a', 'bbbbbbbb-0000-0000-0000-000000000011', 1),
  ('bbbbbbbb-0000-0000-0000-00000000000a', 'bbbbbbbb-0000-0000-0000-000000000012', 2),
  ('bbbbbbbb-0000-0000-0000-00000000000a', 'bbbbbbbb-0000-0000-0000-000000000013', 3);
insert into user_answers (user_id, answers)
values ('bbbbbbbb-0000-0000-0000-00000000000a', '{"cat": "lists-cat"}');

-- ===== משתמש ב' =====
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "bbbbbbbb-0000-0000-0000-00000000000b", "role": "authenticated"}', true);

-- כל בדיקה מנסה לקרוא ולשנות באותה פקודה. השורה המוחזרת: כמה שורות של א' ב' ראה, וכמה שינה.
select results_eq(
  $$with removed as (delete from saved_courses where user_id = 'bbbbbbbb-0000-0000-0000-00000000000a' returning 1)
    select (select count(*)::int from saved_courses), (select count(*)::int from removed)$$,
  $$values (0, 0)$$,
  'משתמש אחר לא רואה ולא מוחק קורסים ששמר מישהו אחר'
);

select results_eq(
  $$with removed as (delete from compare_items where user_id = 'bbbbbbbb-0000-0000-0000-00000000000a' returning 1)
    select (select count(*)::int from compare_items), (select count(*)::int from removed)$$,
  $$values (0, 0)$$,
  'משתמש אחר לא רואה ולא מוציא קורסים מההשוואה של מישהו אחר'
);

select results_eq(
  $$with changed as (update user_answers set answers = '{}' where user_id = 'bbbbbbbb-0000-0000-0000-00000000000a' returning 1)
    select (select count(*)::int from user_answers), (select count(*)::int from changed)$$,
  $$values (0, 0)$$,
  'משתמש אחר לא רואה ולא משנה את התשובות של מישהו אחר'
);

select throws_ok(
  $$insert into saved_courses (user_id, course_id)
    values ('bbbbbbbb-0000-0000-0000-00000000000a', 'bbbbbbbb-0000-0000-0000-000000000011')$$,
  '42501',
  null,
  'משתמש לא יכול לשמור קורס בשם של מישהו אחר'
);

-- ===== משתמש א' =====
select set_config('request.jwt.claims', '{"sub": "bbbbbbbb-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

select throws_ok(
  $$insert into compare_items (user_id, course_id, position)
    values ('bbbbbbbb-0000-0000-0000-00000000000a', 'bbbbbbbb-0000-0000-0000-000000000014', 4)$$,
  '23514',
  null,
  'בהשוואה יש מקום רק לשלושה קורסים'
);

select * from finish();
rollback;
```

- [ ] **Step 2: בדיקה 18 הופכת לרשימת מותרים**

In `supabase/tests/rls.test.sql`, replace:

```sql
      and has_table_privilege(r.rolname, c.oid, p.priv)$$,
  'אין הרשאת כתיבה ציבורית לאף טבלה'
);
```

with:

```sql
      and has_table_privilege(r.rolname, c.oid, p.priv)
      -- תוכנית 2ב: משתמש מחובר כותב ברשימות האישיות שלו, ורק בהרשאות האלה. ההגבלה לשורות שלו ב-RLS.
      and (r.rolname, c.relname, p.priv) not in (
        ('authenticated', 'saved_courses', 'INSERT'), ('authenticated', 'saved_courses', 'DELETE'),
        ('authenticated', 'compare_items', 'INSERT'), ('authenticated', 'compare_items', 'DELETE'),
        ('authenticated', 'user_answers', 'INSERT'), ('authenticated', 'user_answers', 'UPDATE')
      )$$,
  'אין הרשאת כתיבה ציבורית, חוץ מהרשימות האישיות של משתמש מחובר'
);
```

- [ ] **Step 3: לוודא שהבדיקות החדשות נכשלות**

```bash
cd "C:/Users/galsa/Desktop/קורסים השוואות"
pnpm db:test
```

Expected: `rls.test.sql` עובר (25). `user-lists.test.sql` נכשל עם `relation "saved_courses" does not exist`.

- [ ] **Step 4: ה-migration**

Create `supabase/migrations/20261114000001_user_lists.sql`:

```sql
-- סבב 2ב: מה שמשתמש מחובר שומר לעצמו. קורסים ששמר, ההשוואה שלו (3 מקומות) והתשובות מדף הבית.
-- כל משתמש רואה ומשנה רק את השורות שלו. ההרשאות ניתנות במפורש, רק ל-authenticated:
-- מתוכנית 1, טבלה חדשה לא נפתחת לאף אחד מעצמה, ול-anon אין כאן כלום.
-- מחיקת משתמש מ-auth.users מוחקת את כל השורות שלו (on delete cascade). כך מחיקת חשבון מוחקת הכול.

create table saved_courses (
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, course_id)
);
-- למפתח הזר לקורסים. השליפות של המשתמש עוברות דרך המפתח הראשי.
create index saved_courses_course_idx on saved_courses (course_id);

-- ההשוואה: שלושה מקומות בדיוק. position בין 1 ל-3, ומפתח ראשי (user_id, position), ולכן אין מקום רביעי.
-- כל קורס בהשוואה שמור גם ב-saved_courses. הסרה מהשמורים מוציאה אותו גם מההשוואה.
create table compare_items (
  user_id uuid not null,
  course_id uuid not null,
  position smallint not null check (position between 1 and 3),
  created_at timestamptz not null default now(),
  primary key (user_id, position),
  unique (user_id, course_id),
  foreign key (user_id, course_id) references saved_courses (user_id, course_id) on delete cascade
);

-- התשובות מדף הבית, באותה צורה כמו בכתובת: {"cat": "programming", "why": "switch", "max": "15000"}.
-- הדפדפן קורא אותן עם parseQuery, שמסנן כל ערך לא מוכר. הגודל מוגבל, כי זה שדה שהמשתמש כותב.
create table user_answers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  answers jsonb not null check (jsonb_typeof(answers) = 'object' and octet_length(answers::text) <= 2000),
  updated_at timestamptz not null default now()
);

create trigger user_answers_updated_at before update on user_answers
  for each row execute function set_updated_at();

alter table saved_courses enable row level security;
alter table compare_items enable row level security;
alter table user_answers enable row level security;

-- (select auth.uid()) ולא auth.uid(): הערך מחושב פעם אחת לשאילתה, ולא לכל שורה.
create policy "own saved courses: read" on saved_courses
  for select to authenticated using (user_id = (select auth.uid()));
create policy "own saved courses: add" on saved_courses
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own saved courses: remove" on saved_courses
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "own compare items: read" on compare_items
  for select to authenticated using (user_id = (select auth.uid()));
create policy "own compare items: add" on compare_items
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own compare items: remove" on compare_items
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "own answers: read" on user_answers
  for select to authenticated using (user_id = (select auth.uid()));
create policy "own answers: add" on user_answers
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own answers: change" on user_answers
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- בדיוק מה שהאתר צריך: לשמור ולהסיר קורס, להכניס ולהוציא מההשוואה, ולשמור תשובות (upsert).
grant select, insert, delete on saved_courses to authenticated;
grant select, insert, delete on compare_items to authenticated;
grant select, insert, update on user_answers to authenticated;

-- מחיקת חשבון מוחקת גם את המייל מהרישום של Supabase Auth: הרישום (auth.audit_log_entries) שומר
-- את המייל בכל כניסה, וגם ברשומה על המחיקה עצמה, ולא נמחק עם המשתמש. נתיב המחיקה קורא לזה
-- אחרי שהמשתמש נמחק. רק service_role (המפתח הסודי, בשרת) יכול להריץ: ברירות המחדל מתוכנית 1
-- חוסמות הרצה לכל השאר.
create function forget_auth_log(p_user_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.audit_log_entries
  where payload ->> 'actor_id' = p_user_id::text
     or payload -> 'traits' ->> 'user_id' = p_user_id::text;
$$;
grant execute on function forget_auth_log(uuid) to service_role;
```

- [ ] **Step 5: כתובות ההתחברות המקומיות**

In `supabase/config.toml`, replace:

```toml
site_url = "http://127.0.0.1:3000"
```

with:

```toml
# localhost: הכתובת של Playwright. Supabase מקבל כל נתיב באותו host, ומחליף host אחר ב-site_url.
site_url = "http://localhost:3000"
```

and replace:

```toml
additional_redirect_urls = ["https://127.0.0.1:3000"]
```

with:

```toml
# הקישור במייל חוזר תמיד לנתיב הזה (web/src/app/auth/callback/route.ts).
additional_redirect_urls = ["http://localhost:3000/auth/callback", "http://127.0.0.1:3000/auth/callback"]
```

- [ ] **Step 6: להפעיל מחדש ולאפס את המסד המקומי**

```bash
pnpm db:stop
pnpm db:start
pnpm db:reset
```

Expected: אחרי `db:start` השירותים עולים בלי שגיאות (ההגדרות של `[auth]` נקראות רק בהפעלה). ב-`db:reset` מופיעים `Applying migration 20261114000001_user_lists.sql...` ושני קבצי הנתונים, בלי שגיאות.

- [ ] **Step 7: הבדיקות עוברות**

```bash
pnpm db:test
```

Expected: `All tests successful`, עם `Files=2, Tests=30`.

- [ ] **Step 8: ל-anon אין גישה, ורק השרת מנקה את הרישום**

```bash
pnpm exec supabase db query "select has_table_privilege('anon', 'public.saved_courses', 'select') or has_table_privilege('anon', 'public.compare_items', 'select') or has_table_privilege('anon', 'public.user_answers', 'select') as anon_can_read"
pnpm exec supabase db query "select has_function_privilege('anon', 'public.forget_auth_log(uuid)', 'execute') or has_function_privilege('authenticated', 'public.forget_auth_log(uuid)', 'execute') as public_can_forget, has_function_privilege('service_role', 'public.forget_auth_log(uuid)', 'execute') as server_can_forget"
```

Expected: `anon_can_read` הוא `false`. `public_can_forget` הוא `false`, ו-`server_can_forget` הוא `true`.

- [ ] **Step 9: טיפוסי המסד**

```bash
pnpm db:types
git diff --stat web/src/lib/database.types.ts
```

Expected: הקובץ השתנה. נוספו `compare_items` (עם `course_id`, `created_at`, `position: number`, `user_id`), `saved_courses` ו-`user_answers` (עם `answers: NonNullable<Json>`), ובפונקציות `forget_auth_log` עם `Args: { "p_user_id": string }`.

- [ ] **Step 10: לוודא שהכול עדיין ירוק**

```bash
cd web
pnpm score:recompute
pnpm lint && pnpm exec tsc --noEmit && pnpm test
```

Expected: `score:recompute` מדפיס 15 שורות, ובהן `full-stack-sample: scored 7.9 (23 reviews)`. lint ו-tsc עוברים, ו-54 בדיקות יחידה עוברות.

- [ ] **Step 11: Commit**

```bash
cd ..
git add supabase/migrations/20261114000001_user_lists.sql supabase/tests/user-lists.test.sql supabase/tests/rls.test.sql supabase/config.toml web/src/lib/database.types.ts
git commit -m "feat: טבלאות לקורסים שמורים, להשוואה ולתשובות, רק לבעלים"
```

---

### Task 2: חיבורי Supabase להתחברות, ובדיקת כתובת החזרה (TDD)

**Files:**
- Create: `web/src/lib/account/next-path.test.ts`
- Create: `web/src/lib/account/next-path.ts`
- Modify: `web/package.json`, `web/pnpm-lock.yaml`
- Create: `web/src/lib/supabase/browser-client.ts`
- Create: `web/src/lib/supabase/server-client.ts`
- Create: `web/src/lib/supabase/admin-client.ts`
- Modify: `web/.env.example`

- [ ] **Step 1: הבדיקה**

Create `web/src/lib/account/next-path.test.ts` (עם כלי עריכת קבצים, בגלל `'/\\evil.example'`):

```ts
import { describe, expect, it } from 'vitest';
import { safeNextPath } from './next-path';

describe('safeNextPath', () => {
  it('keeps a path on this site, with its query and hash', () => {
    expect(safeNextPath('/courses/baking-sample')).toBe('/courses/baking-sample');
    expect(safeNextPath('/?cat=cooking&when=evening')).toBe('/?cat=cooking&when=evening');
    expect(safeNextPath('/me#saved')).toBe('/me#saved');
  });

  it('sends anything else to the home page', () => {
    for (const raw of [
      null,
      '',
      'me',
      'https://evil.example',
      'javascript:alert(1)',
      '//evil.example',
      '/\\evil.example',
      '/\t/evil.example',
      '/.//evil.example',
      '/login?next=/me',
      '/auth/callback',
      `/${'a'.repeat(1001)}`,
    ]) {
      expect(safeNextPath(raw), String(raw)).toBe('/');
    }
  });
});
```

- [ ] **Step 2: לוודא שהיא נכשלת**

```bash
cd web
pnpm exec vitest run src/lib/account/next-path.test.ts
```

Expected: FAIL, `Cannot find module './next-path'`.

- [ ] **Step 3: הבדיקה של כתובת החזרה**

Create `web/src/lib/account/next-path.ts`:

```ts
/**
 * לאן לחזור אחרי ההתחברות. נשמר בעוגייה קצרה, ולא בקישור שבמייל, כדי שכתובת החזרה ב-Supabase
 * תהיה כתובת אחת מדויקת (/auth/callback), כמו ש-Supabase ממליצים לאתר באוויר.
 * העוגייה נשלחת רק לנתיב ההתחברות, ונמחקת שם.
 */
export const NEXT_COOKIE = 'login_next';
export const CALLBACK_PATH = '/auth/callback';

/** כתובת חזרה ארוכה מזה היא כנראה לא מהאתר שלנו. */
const MAX_LENGTH = 1000;
const BASE = 'https://site.invalid';

/**
 * לאן לחזור אחרי ההתחברות. רק נתיב באתר הזה. כל השאר, ובכלל זה כתובת של אתר אחר, הופך ל-'/'.
 * כך אי אפשר לשלוח מישהו לקישור התחברות שמחזיר אותו לאתר זר (open redirect).
 */
export function safeNextPath(raw: string | null | undefined): string {
  if (!raw || raw.length > MAX_LENGTH || !raw.startsWith('/')) return '/';
  // '//x' ו-'/\x' הם כתובת של אתר אחר בדפדפן.
  if (raw.startsWith('//') || raw.includes('\\')) return '/';
  // תווי בקרה (טאב, שורה חדשה) הדפדפן מוחק מהכתובת, ואז '/\t/x' הופך ל-'//x'.
  for (const char of raw) {
    const code = char.charCodeAt(0);
    if (code < 0x20 || code === 0x7f) return '/';
  }
  let url: URL;
  try {
    url = new URL(raw, BASE);
  } catch {
    return '/';
  }
  // הנירמול יכול לייצר '//' מחדש: '/.//x' הופך ל-'//x'.
  if (url.origin !== BASE || url.pathname.startsWith('//')) return '/';
  // לא חוזרים לעמוד ההתחברות, או לנתיב שמסיים אותה.
  if (url.pathname === '/login' || url.pathname.startsWith('/auth/')) return '/';
  return `${url.pathname}${url.search}${url.hash}`;
}
```

- [ ] **Step 4: לוודא שהיא עוברת**

```bash
pnpm exec vitest run src/lib/account/next-path.test.ts
```

Expected: `Tests  2 passed (2)`.

- [ ] **Step 5: להתקין את `@supabase/ssr`**

```bash
pnpm add @supabase/ssr@^0.12.7
```

Expected: ב-`package.json` נוסף `"@supabase/ssr": "^0.12.7"`. זו הגרסה האחרונה ב-14.11.2026, והקוד כאן נבדק מולה. בגרסה אחרת, משווים את `dist/main/createBrowserClient.d.ts` ואת `dist/main/createServerClient.d.ts` לשימוש שבצעדים הבאים: `createBrowserClient(url, key)`, ו-`createServerClient(url, key, { cookies: { getAll, setAll } })`.

- [ ] **Step 6: החיבור בדפדפן**

Create `web/src/lib/supabase/browser-client.ts`:

```ts
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/database.types';

/**
 * החיבור בדפדפן, עם המשתמש המחובר. ההתחברות נשמרת בעוגיות (ולא ב-localStorage), כדי שגם הנתיבים
 * בשרת יראו אותה. @supabase/ssr מחזיר את אותו חיבור בכל קריאה בדפדפן, ומרענן את ההתחברות בעצמו.
 */
export function createBrowserSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
  return createBrowserClient<Database>(url, key);
}
```

- [ ] **Step 7: החיבור בנתיבים בשרת**

Create `web/src/lib/supabase/server-client.ts`:

```ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/database.types';

/**
 * החיבור בנתיבים בשרת (Route Handlers), עם המשתמש מהעוגיות של הבקשה.
 * רק בנתיבים: שם מותר לכתוב עוגיות (cookies.md). העמודים סטטיים, ולא קוראים עוגיות בכלל.
 * חיבור חדש לכל בקשה, כמו שכתוב ב-createServerClient.
 */
export async function createServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
  const cookieStore = await cookies();
  return createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        for (const { name, value, options } of toSet) cookieStore.set(name, value, options);
      },
    },
  });
}
```

- [ ] **Step 8: החיבור עם המפתח הסודי**

Create `web/src/lib/supabase/admin-client.ts`:

```ts
import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

/**
 * חיבור עם המפתח הסודי, שעוקף את כל ההרשאות. משמש רק את נתיב מחיקת החשבון.
 * 'server-only': בנייה שמכניסה את הקובץ לקוד של הדפדפן נכשלת.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY');
  return createClient<Database>(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
}
```

`server-only` לא צריך התקנה: Next מטפל בו בעצמו, ומצהיר על הטיפוס שלו ב-`next/types/global.d.ts` (`web/node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`: "installing `server-only` or `client-only` is **optional**").

- [ ] **Step 9: `.env.example`**

In `web/.env.example`, replace:

```
# סודי: רק לסקריפטים בשרת. אף פעם לא בקוד שרץ בדפדפן.
```

with:

```
# סודי: לסקריפטים בשרת ולנתיב מחיקת החשבון (src/app/api/account/delete). אף פעם לא בקוד שרץ בדפדפן.
```

- [ ] **Step 10: לוודא שהכול ירוק**

```bash
pnpm lint && pnpm exec tsc --noEmit && pnpm test
```

Expected: הכול עובר. 56 בדיקות יחידה (54 ועוד 2).

- [ ] **Step 11: Commit**

```bash
cd ..
git add web/package.json web/pnpm-lock.yaml web/.env.example web/src/lib/account/next-path.ts web/src/lib/account/next-path.test.ts web/src/lib/supabase
git commit -m "feat: חיבורי Supabase להתחברות, ובדיקה שכתובת החזרה היא באתר"
```

---

### Task 3: הרשימות של המבקר (TDD), ומזהה הקורס

**Files:**
- Create: `web/src/lib/account/lists.test.ts`
- Create: `web/src/lib/account/lists.ts`
- Modify: `web/src/lib/search/types.ts`
- Modify: `web/src/lib/data/catalog.ts`
- Modify: `web/src/lib/data/course-page.ts`
- Modify: `web/src/lib/search/match.test.ts`
- Modify: `web/src/lib/search/keywords.test.ts`
- Create: `web/src/lib/account/store.ts`

- [ ] **Step 1: הבדיקה של המיזוג**

Create `web/src/lib/account/lists.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { EMPTY_LOCAL, mergeIntoAccount } from './lists';

const A = 'aaaaaaaa-0000-0000-0000-000000000001';
const B = 'aaaaaaaa-0000-0000-0000-000000000002';
const C = 'aaaaaaaa-0000-0000-0000-000000000003';
const D = 'aaaaaaaa-0000-0000-0000-000000000004';

describe('mergeIntoAccount', () => {
  it('moves the browser comparison and the pending save into an empty account', () => {
    expect(mergeIntoAccount({ saved: [], compare: [] }, { ...EMPTY_LOCAL, compare: [A, B], save: C })).toEqual({
      save: [A, B, C],
      compare: [
        { courseId: A, position: 1 },
        { courseId: B, position: 2 },
      ],
    });
  });

  it('keeps the account places, fills the free ones, and saves what does not fit', () => {
    const account = { saved: [B, D], compare: [{ courseId: B, position: 2 }, { courseId: D, position: 3 }] };
    expect(mergeIntoAccount(account, { ...EMPTY_LOCAL, compare: [B, A, C] })).toEqual({
      save: [A, C],
      compare: [{ courseId: A, position: 1 }],
    });
  });
});
```

- [ ] **Step 2: לוודא שהיא נכשלת**

```bash
cd web
pnpm exec vitest run src/lib/account/lists.test.ts
```

Expected: FAIL, `Cannot find module './lists'`.

- [ ] **Step 3: הרשימות והמיזוג**

Create `web/src/lib/account/lists.ts`:

```ts
/** בהשוואה יש שלושה מקומות בדיוק. גם המסד לא מאפשר יותר (compare_items.position בין 1 ל-3). */
export const MAX_COMPARE = 3;

/** קורס בהשוואה, והמקום שלו (1 עד 3). מקום שהתפנה נשאר ריק עד שמוסיפים קורס. */
export interface CompareSlot {
  courseId: string;
  position: number;
}

/** התשובות מדף הבית, באותה צורה כמו בכתובת: { cat: 'cooking', when: 'evening' }. */
export type AnswerParams = Record<string, string>;

/**
 * מה שמבקר שלא התחבר שומר בדפדפן (localStorage): ההשוואה, וקורס או תשובות שביקש לשמור
 * רגע לפני שנשלח להתחבר. כשהוא מתחבר, הכול עובר לחשבון ונמחק מהדפדפן.
 */
export interface LocalLists {
  compare: string[];
  save: string | null;
  answers: AnswerParams | null;
}

export const EMPTY_LOCAL: LocalLists = { compare: [], save: null, answers: null };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const isCourseId = (value: unknown): value is string => typeof value === 'string' && UUID.test(value);

/** תשובות ממקור שלא כתבנו (הדפדפן או המסד): רק מחרוזות. parseQuery מסנן אחר כך כל ערך לא מוכר. */
export function toAnswerParams(value: unknown): AnswerParams | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const params: AnswerParams = {};
  for (const [key, item] of Object.entries(value)) if (typeof item === 'string') params[key] = item;
  return params;
}

/** מה ששמור בדפדפן. תוכן שגוי או ישן לא שובר את האתר: מה שלא מתאים נזרק. */
export function parseLocal(raw: string | null): LocalLists {
  if (!raw) return EMPTY_LOCAL;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return EMPTY_LOCAL;
  }
  if (typeof data !== 'object' || data === null) return EMPTY_LOCAL;
  const { compare, save, answers } = data as Record<string, unknown>;
  return {
    compare: Array.isArray(compare) ? [...new Set(compare.filter(isCourseId))].slice(0, MAX_COMPARE) : [],
    save: isCourseId(save) ? save : null,
    answers: toAnswerParams(answers),
  };
}

/** המקום הפנוי הראשון בהשוואה, או null כשהיא מלאה. */
export function firstFreePosition(slots: readonly CompareSlot[]): number | null {
  for (let position = 1; position <= MAX_COMPARE; position++) {
    if (!slots.some((slot) => slot.position === position)) return position;
  }
  return null;
}

/**
 * מה להוסיף לחשבון כשמבקר מתחבר.
 * - כל קורס מההשוואה שבדפדפן נשמר, כי קורס בהשוואה תמיד שמור (המפתח הזר ב-compare_items).
 * - הקורס שביקש לשמור לפני ההתחברות נשמר גם הוא.
 * - ההשוואה שבחשבון לא זזה. קורסים מהדפדפן נכנסים למקומות הפנויים, לפי הסדר.
 *   מה שלא נכנס נשאר בשמורים, ואפשר להחליף אותו באזור האישי.
 */
export function mergeIntoAccount(
  account: { saved: readonly string[]; compare: readonly CompareSlot[] },
  local: LocalLists,
): { save: string[]; compare: CompareSlot[] } {
  const wanted = local.save ? [...local.compare, local.save] : local.compare;
  const save = [...new Set(wanted)].filter((id) => !account.saved.includes(id));
  const taken = [...account.compare];
  const compare: CompareSlot[] = [];
  for (const courseId of local.compare) {
    if (taken.some((slot) => slot.courseId === courseId)) continue;
    const position = firstFreePosition(taken);
    if (position === null) break;
    taken.push({ courseId, position });
    compare.push({ courseId, position });
  }
  return { save, compare };
}
```

- [ ] **Step 4: לוודא שהיא עוברת**

```bash
pnpm exec vitest run src/lib/account/lists.test.ts
```

Expected: `Tests  2 passed (2)`.

- [ ] **Step 5: מזהה הקורס ברשימות ובעמוד הקורס**

הרשימות במסד שומרות `course_id`, ולכן גם הדפדפן צריך את המזהה.

In `web/src/lib/search/types.ts`, replace:

```ts
export interface CourseSummary {
  slug: string;
```

with:

```ts
export interface CourseSummary {
  /** המזהה במסד. הרשימות של המשתמש (saved_courses, compare_items) שומרות אותו. */
  id: string;
  slug: string;
```

In `web/src/lib/data/catalog.ts`, replace:

```ts
      {
        slug: row.slug,
        title: row.title,
```

with:

```ts
      {
        id: row.id,
        slug: row.slug,
        title: row.title,
```

In `web/src/lib/data/course-page.ts`, replace:

```ts
export interface CoursePageData {
  slug: string;
```

with:

```ts
export interface CoursePageData {
  /** המזהה במסד, ל"לשמור" ול"להשוואה". */
  id: string;
  slug: string;
```

ובאותו קובץ (השאילתה כבר בוחרת `id`), replace:

```ts
  return {
    slug: course.slug,
```

with:

```ts
  return {
    id: course.id,
    slug: course.slug,
```

In `web/src/lib/search/match.test.ts`, replace:

```ts
  return {
    title: over.slug,
```

with:

```ts
  return {
    id: over.slug,
    title: over.slug,
```

In `web/src/lib/search/keywords.test.ts`, replace:

```ts
  const course = (slug: string, title: string, institutionName: string): CourseSummary => ({
    slug,
```

with:

```ts
  const course = (slug: string, title: string, institutionName: string): CourseSummary => ({
    id: slug,
    slug,
```

- [ ] **Step 6: מצב המבקר בדפדפן**

Create `web/src/lib/account/store.ts`:

```ts
import type { Session } from '@supabase/supabase-js';
import { useSyncExternalStore } from 'react';
import { createBrowserSupabase } from '@/lib/supabase/browser-client';
import {
  EMPTY_LOCAL,
  MAX_COMPARE,
  firstFreePosition,
  mergeIntoAccount,
  parseLocal,
  toAnswerParams,
  type AnswerParams,
  type CompareSlot,
  type LocalLists,
} from './lists';

export interface SavedAnswers {
  params: AnswerParams;
  updatedAt: string;
}

/**
 * מה שהדפדפן יודע על המבקר. העמודים סטטיים, ולכן כל זה נטען כאן, בדפדפן, ולא בשרת.
 * 'loading': לפני שבדקנו אם יש התחברות. זה גם מה שנבנה מראש ב-HTML.
 */
export type AccountState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'signed-out'; compare: string[] }
  | {
      status: 'signed-in';
      userId: string;
      email: string;
      /** מהחדש לישן. */
      saved: string[];
      /** לפי המקום, 1 עד 3. */
      compare: CompareSlot[];
      answers: SavedAnswers | null;
    };

type SignedIn = Extract<AccountState, { status: 'signed-in' }>;

/** 'full': אין מקום בהשוואה. 'error': המסד או הרשת לא ענו, ושום דבר לא השתנה. */
export type ListResult = 'ok' | 'full' | 'error';

const LOCAL_KEY = 'account-lists:v1';
const LOADING: AccountState = { status: 'loading' };

let state: AccountState = LOADING;
const listeners = new Set<() => void>();
let started = false;
/** טעינה אחת בכל פעם, כדי ששני אירועים צמודים לא יעבירו את הרשימות מהדפדפן פעמיים. */
let queue: Promise<void> = Promise.resolve();

function setState(next: AccountState) {
  state = next;
  for (const listener of listeners) listener();
}

/** משנה רק אם עדיין מחובר אותו משתמש. תשובה שמגיעה אחרי התנתקות לא מחזירה אותו. */
function updateSignedIn(userId: string, change: (current: SignedIn) => SignedIn) {
  if (state.status === 'signed-in' && state.userId === userId) setState(change(state));
}

function readLocal(): LocalLists {
  try {
    return parseLocal(window.localStorage.getItem(LOCAL_KEY));
  } catch {
    return EMPTY_LOCAL;
  }
}

function writeLocal(lists: LocalLists) {
  try {
    if (lists.compare.length === 0 && lists.save === null && lists.answers === null) {
      window.localStorage.removeItem(LOCAL_KEY);
    } else {
      window.localStorage.setItem(LOCAL_KEY, JSON.stringify(lists));
    }
  } catch {
    // גלישה פרטית או אחסון חסום: הרשימה נשארת בזיכרון של הדף בלבד.
  }
}

async function fetchLists(userId: string) {
  const db = createBrowserSupabase();
  // ההרשאות במסד מחזירות ממילא רק את השורות של המשתמש. הסינון לפי user_id משתמש במפתח הראשי.
  const [saved, compare, answers] = await Promise.all([
    db.from('saved_courses').select('course_id').eq('user_id', userId).order('created_at', { ascending: false }),
    db.from('compare_items').select('course_id, position').eq('user_id', userId).order('position'),
    db.from('user_answers').select('answers, updated_at').eq('user_id', userId).maybeSingle(),
  ]);
  if (saved.error) throw saved.error;
  if (compare.error) throw compare.error;
  if (answers.error) throw answers.error;
  const params = answers.data ? toAnswerParams(answers.data.answers) : null;
  return {
    saved: saved.data.map((row) => row.course_id),
    compare: compare.data.map((row) => ({ courseId: row.course_id, position: row.position })),
    answers: answers.data && params ? { params, updatedAt: answers.data.updated_at } : null,
  };
}

/** מעביר לחשבון את מה שנשמר בדפדפן לפני ההתחברות. */
async function moveLocalIntoAccount(userId: string, account: { saved: string[]; compare: CompareSlot[] }) {
  const local = readLocal();
  const merged = mergeIntoAccount(account, local);
  if (merged.save.length === 0 && merged.compare.length === 0 && local.answers === null) return false;
  const db = createBrowserSupabase();
  if (merged.save.length > 0) {
    const { error } = await db
      .from('saved_courses')
      .upsert(
        merged.save.map((courseId) => ({ user_id: userId, course_id: courseId })),
        { onConflict: 'user_id,course_id', ignoreDuplicates: true },
      );
    if (error) throw error;
  }
  if (merged.compare.length > 0) {
    const { error } = await db
      .from('compare_items')
      .insert(merged.compare.map((slot) => ({ user_id: userId, course_id: slot.courseId, position: slot.position })));
    if (error) throw error;
  }
  if (local.answers !== null) {
    const { error } = await db.from('user_answers').upsert({ user_id: userId, answers: local.answers });
    if (error) throw error;
  }
  return true;
}

async function load(session: Session | null) {
  if (!session) {
    setState({ status: 'signed-out', compare: readLocal().compare });
    return;
  }
  const userId = session.user.id;
  if (state.status === 'signed-in' && state.userId === userId) return;
  try {
    let lists = await fetchLists(userId);
    if (await moveLocalIntoAccount(userId, lists)) lists = await fetchLists(userId);
    writeLocal(EMPTY_LOCAL);
    setState({ status: 'signed-in', userId, email: session.user.email ?? '', ...lists });
  } catch (error) {
    console.error('Loading the account lists failed', error);
    setState({ status: 'error' });
  }
}

function start() {
  // INITIAL_SESSION מגיע מיד עם ההתחברות שבעוגיות (או בלעדיה), ו-SIGNED_IN/SIGNED_OUT כשהיא משתנה,
  // גם בלשונית אחרת. לפי Supabase, לא קוראים ל-Supabase מתוך ה-callback עצמו, ולכן ממשיכים בתור.
  createBrowserSupabase().auth.onAuthStateChange((event, session) => {
    if (event === 'TOKEN_REFRESHED') return;
    setTimeout(() => {
      queue = queue.then(() => load(session));
    }, 0);
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!started) {
    started = true;
    start();
  }
  return () => {
    listeners.delete(listener);
  };
}

/**
 * המצב של המבקר, לכל רכיב בדף. בבנייה מראש ובהידרציה: 'loading', ומיד אחר כך המצב האמיתי.
 * כך הדפים נשארים סטטיים, ואין אי-התאמה בין ה-HTML לדפדפן.
 */
export function useAccount(): AccountState {
  return useSyncExternalStore(subscribe, () => state, () => LOADING);
}

/** עמוד ההתחברות, עם הדרך חזרה לעמוד הנוכחי. */
export function loginHref(): string {
  const here = `${window.location.pathname}${window.location.search}`;
  if (window.location.pathname === '/login') return here;
  return `/login?next=${encodeURIComponent(here)}`;
}

/** מבקר לא מחובר ביקש לשמור: זוכרים את הבקשה בדפדפן, והיא מתבצעת מיד אחרי ההתחברות. */
export function rememberForLogin(pending: { save?: string; answers?: AnswerParams }) {
  const local = readLocal();
  writeLocal({ ...local, save: pending.save ?? local.save, answers: pending.answers ?? local.answers });
}

export async function toggleSaved(courseId: string): Promise<ListResult> {
  if (state.status !== 'signed-in') return 'error';
  const { userId } = state;
  const db = createBrowserSupabase();
  if (state.saved.includes(courseId)) {
    const { error } = await db.from('saved_courses').delete().eq('user_id', userId).eq('course_id', courseId);
    if (error) return 'error';
    // המסד מוציא אותו גם מההשוואה (on delete cascade).
    updateSignedIn(userId, (s) => ({
      ...s,
      saved: s.saved.filter((id) => id !== courseId),
      compare: s.compare.filter((slot) => slot.courseId !== courseId),
    }));
    return 'ok';
  }
  const { error } = await db
    .from('saved_courses')
    .upsert({ user_id: userId, course_id: courseId }, { onConflict: 'user_id,course_id', ignoreDuplicates: true });
  if (error) return 'error';
  updateSignedIn(userId, (s) => ({ ...s, saved: [courseId, ...s.saved.filter((id) => id !== courseId)] }));
  return 'ok';
}

export async function toggleCompare(courseId: string): Promise<ListResult> {
  if (state.status === 'signed-out') {
    const has = state.compare.includes(courseId);
    if (!has && state.compare.length >= MAX_COMPARE) return 'full';
    const compare = has ? state.compare.filter((id) => id !== courseId) : [...state.compare, courseId];
    writeLocal({ ...readLocal(), compare });
    setState({ status: 'signed-out', compare });
    return 'ok';
  }
  if (state.status !== 'signed-in') return 'error';
  const { userId } = state;
  const db = createBrowserSupabase();
  if (state.compare.some((slot) => slot.courseId === courseId)) {
    const { error } = await db.from('compare_items').delete().eq('user_id', userId).eq('course_id', courseId);
    if (error) return 'error';
    updateSignedIn(userId, (s) => ({ ...s, compare: s.compare.filter((slot) => slot.courseId !== courseId) }));
    return 'ok';
  }
  const position = firstFreePosition(state.compare);
  if (position === null) return 'full';
  // קורס בהשוואה תמיד שמור: המסד דורש שורה ב-saved_courses.
  if (!state.saved.includes(courseId)) {
    const saved = await toggleSaved(courseId);
    if (saved !== 'ok') return saved;
  }
  const { error } = await db.from('compare_items').insert({ user_id: userId, course_id: courseId, position });
  // 23505/23514: לשונית אחרת תפסה את המקום בינתיים.
  if (error) return error.code === '23505' || error.code === '23514' ? 'full' : 'error';
  updateSignedIn(userId, (s) => ({
    ...s,
    compare: [...s.compare, { courseId, position }].sort((a, b) => a.position - b.position),
  }));
  return 'ok';
}

export async function saveAnswers(params: AnswerParams): Promise<ListResult> {
  if (state.status !== 'signed-in') return 'error';
  const { userId } = state;
  const { error } = await createBrowserSupabase().from('user_answers').upsert({ user_id: userId, answers: params });
  if (error) return 'error';
  updateSignedIn(userId, (s) => ({ ...s, answers: { params, updatedAt: new Date().toISOString() } }));
  return 'ok';
}

/**
 * התנתקות. 'global': מכל המכשירים. 'local': רק כאן, אחרי מחיקת החשבון, כשההתחברות כבר לא תקפה.
 * האירוע SIGNED_OUT מעדכן את כל הדף.
 */
export async function signOut(scope: 'global' | 'local' = 'global'): Promise<ListResult> {
  const { error } = await createBrowserSupabase().auth.signOut({ scope });
  return error ? 'error' : 'ok';
}

/**
 * מחיקת החשבון: הנתיב בשרת מוחק את המשתמש, והמסד מוחק איתו את כל השורות שלו.
 * מה שנשמר בדפדפן נמחק גם הוא. ההתחברות שבדפדפן נמחקת אחר כך, עם signOut('local').
 */
export async function deleteAccount(): Promise<ListResult> {
  try {
    const response = await fetch('/api/account/delete', { method: 'POST' });
    if (!response.ok) return 'error';
  } catch {
    return 'error';
  }
  writeLocal(EMPTY_LOCAL);
  return 'ok';
}
```

- [ ] **Step 7: לוודא שהכול ירוק**

```bash
pnpm lint && pnpm exec tsc --noEmit && pnpm test
```

Expected: הכול עובר. 58 בדיקות יחידה.

- [ ] **Step 8: Commit**

```bash
cd ..
git add web/src/lib/account web/src/lib/search/types.ts web/src/lib/data/catalog.ts web/src/lib/data/course-page.ts web/src/lib/search/match.test.ts web/src/lib/search/keywords.test.ts
git commit -m "feat: הרשימות של המבקר בדפדפן, והמעבר שלהן לחשבון אחרי ההתחברות"
```

---

### Task 4: הנתיבים בשרת: חזרה מהמייל ומחיקת חשבון

**Files:**
- Create: `web/src/app/auth/callback/route.ts`
- Create: `web/src/app/api/account/delete/route.ts`

- [ ] **Step 1: החזרה מהמייל**

Create `web/src/app/auth/callback/route.ts`:

```ts
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
```

- [ ] **Step 2: מחיקת החשבון**

Create `web/src/app/api/account/delete/route.ts`:

```ts
import type { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin-client';
import { createServerSupabase } from '@/lib/supabase/server-client';

/**
 * רק דף מהאתר עצמו יכול לבקש מחיקה (הגנה מ-CSRF): הדפדפן שולח Origin בכל POST של fetch,
 * ואתר אחר לא יכול לזייף אותו. עוגיית ההתחברות היא גם SameSite=Lax, ולא נשלחת ב-POST מאתר אחר.
 */
function fromThisSite(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/**
 * מוחק את המשתמש המחובר מ-Supabase Auth. המסד מוחק איתו את הקורסים השמורים, ההשוואה והתשובות
 * (on delete cascade). המפתח הסודי נקרא רק כאן, בשרת.
 */
export async function POST(request: NextRequest) {
  if (!fromThisSite(request)) return Response.json({ error: 'forbidden' }, { status: 403 });

  const db = await createServerSupabase();
  // getUser בודק את ההתחברות מול Supabase, ולא רק את העוגייה.
  const { data, error } = await db.auth.getUser();
  if (error || !data.user) return Response.json({ error: 'signed_out' }, { status: 401 });

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    // SUPABASE_SECRET_KEY חסר בסביבה (למשל ב-Vercel, לפני שגל הוסיף אותו).
    return Response.json({ error: 'not_configured' }, { status: 503 });
  }
  const { error: deleteError } = await admin.auth.admin.deleteUser(data.user.id);
  if (deleteError) {
    console.error('Deleting a user failed', deleteError.message);
    return Response.json({ error: 'failed' }, { status: 500 });
  }
  // גם הרישום של Supabase Auth, שבו המייל נשאר אחרי המחיקה. החשבון כבר נמחק, ולכן כישלון כאן
  // רק נרשם ביומן של השרת.
  const { error: logError } = await admin.rpc('forget_auth_log', { p_user_id: data.user.id });
  if (logError) console.error('Clearing the auth log failed', logError.message);
  return Response.json({ ok: true });
}
```

- [ ] **Step 3: בנייה ובדיקה בשרת**

```bash
cd web
pnpm lint && pnpm exec tsc --noEmit && pnpm test && pnpm build
```

Expected: בפלט הבנייה `ƒ /api/account/delete` ו-`ƒ /auth/callback`. כל השאר כמו קודם.

בטרמינל נפרד, מתוך `web/`: `pnpm start`. ואז:

```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:3000/auth/callback
curl -s -X POST -w " %{http_code}\n" http://localhost:3000/api/account/delete
curl -s -X POST -H "Origin: https://evil.example" -w " %{http_code}\n" http://localhost:3000/api/account/delete
curl -s -X POST -H "Origin: http://localhost:3000" -w " %{http_code}\n" http://localhost:3000/api/account/delete
```

Expected:

```
303 http://localhost:3000/login?error=link&next=%2F
{"error":"forbidden"} 403
{"error":"forbidden"} 403
{"error":"signed_out"} 401
```

עוצרים את השרת.

- [ ] **Step 4: Commit**

```bash
cd ..
git add web/src/app/auth web/src/app/api/account
git commit -m "feat: נתיב החזרה מהמייל, ומחיקת חשבון בשרת בלבד"
```

---

### Task 5: עמוד ההתחברות

**Files:**
- Create: `web/src/components/account/login-form.tsx`
- Modify: `web/src/app/login/page.tsx` (הקובץ כולו)

- [ ] **Step 1: לפני שכותבים ממשק**

1. קוראים את `.claude/skills/impeccable/reference/craft-floor.md` ואת `.impeccable/surfaces/course-page.md`. אם התיקייה `.claude/skills/impeccable` חסרה, מריצים `npx impeccable install` מתיקיית הפרויקט.
2. טוענים את `/impeccable`.
3. פותחים את `design/canvas/Login.dc.html`: למעלה הטופס, ולמטה "עכשיו לתיבת המייל". ההערות האפורות בין שני המצבים הן הערות לציור, ולא נכנסות לעמוד.
4. הכללים:
   - מרקרים ופתקים רק למקורות ולקולות: ירוק נבדק, צהוב בוגרים, ורוד חולשה, קו כחול טענת המוסד. אף כפתור, הודעה או שגיאה לא מקבלים מרקר או פתק.
   - מה שהמבקר כותב: עט כחול על קו. כאן, המייל.
   - הערות של האתר: עט, עם חץ, בשוליים ("← תקף לשעה").
   - קודם לנייד, ברוחב 390 פיקסלים. כל פקד לפחות 44 פיקסלים.
   - מה שלא מצויר (שגיאות), בונים מהחלקים שכבר בציור: טקסט מודגש בגופן המודפס, בלי צבע חדש.

- [ ] **Step 2: הטופס, והמצב אחרי השליחה**

Create `web/src/components/account/login-form.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { TickMark } from '@/components/notebook/tick';
import { buttonVariants } from '@/components/ui/button';
import { CALLBACK_PATH, NEXT_COOKIE, safeNextPath } from '@/lib/account/next-path';
import { useAccount } from '@/lib/account/store';
import { createBrowserSupabase } from '@/lib/supabase/browser-client';
import { cn } from '@/lib/utils';

/** "פעם בדקה" בציור. גם Supabase בענן לא שולח קישור נוסף לאותו מייל לפני שעברה דקה. */
const RESEND_SECONDS = 60;

/** "0:42", ובהתחלה "1:00". */
const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

const REASONS = [
  'לשמור קורסים ולחזור אליהם',
  'לשמור את ההשוואה שלכם, עד 3 קורסים',
  'לשמור את התשובות מדף הבית',
  'ובקרוב, לכתוב ביקורת על קורס שסיימתם',
];

const marginLabel = 'font-sans text-[13px] leading-tight text-ink-soft';
/** הערה של האתר בשוליים: עט, עם חץ, מוטה (מסמך העיצוב, סעיף 8). */
const marginNote = '-rotate-3 pe-1.5 font-pen text-sm leading-snug font-medium text-pen';
const smallLink = 'inline-flex min-h-11 items-center underline underline-offset-[3px] hover:text-link-hover';

type SendError = 'rate' | 'not-allowed' | 'failed';

const SEND_ERROR_TEXT: Record<SendError, string> = {
  rate: 'שלחנו כבר כמה קישורים בשעה האחרונה. נסו שוב בעוד כמה דקות.',
  'not-allowed': 'עד ההשקה אפשר להתחבר רק עם המיילים של צוות האתר.',
  failed: 'לא הצלחנו לשלוח את הקישור. נסו שוב בעוד דקה.',
};

function sendErrorOf(error: { code?: string; status?: number }): SendError {
  if (error.status === 429 || error.code === 'over_email_send_rate_limit') return 'rate';
  if (error.code === 'email_address_not_authorized') return 'not-allowed';
  return 'failed';
}

/** מה שבכתובת: לאן לחזור, והאם הקישור מהמייל לא עבד. בתוך <Suspense>, כמו המחברת. */
export function LoginFromUrl() {
  const params = useSearchParams();
  return <LoginForm next={safeNextPath(params.get('next'))} linkFailed={params.get('error') === 'link'} />;
}

/**
 * ההתחברות בקישור למייל, לפי הציור (Login.dc.html): הטופס, ואחרי השליחה "עכשיו לתיבת המייל"
 * באותו עמוד, עם המייל בעט ווי. Google לא בסבב הזה.
 */
export function LoginForm({ next, linkFailed }: { next: string; linkFailed: boolean }) {
  const account = useAccount();
  const router = useRouter();
  const heading = useRef<HTMLHeadingElement>(null);
  const [email, setEmail] = useState('');
  const [sentAt, setSentAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<SendError | null>(null);

  // מי שכבר מחובר לא צריך את העמוד הזה.
  useEffect(() => {
    if (account.status === 'signed-in') router.replace(next);
  }, [account.status, next, router]);

  // השעון של "לשלוח שוב בעוד".
  useEffect(() => {
    if (sentAt === null) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [sentAt]);

  const waitSeconds = sentAt === null ? 0 : Math.max(0, RESEND_SECONDS - Math.floor((now - sentAt) / 1000));

  async function send() {
    if (sending) return;
    setSending(true);
    setError(null);
    // לאן לחזור: בעוגייה לנתיב ההתחברות בלבד, לשעה, כמו תוקף הקישור.
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${NEXT_COOKIE}=${encodeURIComponent(next)}; Path=${CALLBACK_PATH}; Max-Age=3600; SameSite=Lax${secure}`;
    const { error: sendError } = await createBrowserSupabase().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}${CALLBACK_PATH}`, shouldCreateUser: true },
    });
    setSending(false);
    if (sendError) {
      setError(sendErrorOf(sendError));
      return;
    }
    setSentAt(Date.now());
    setNow(Date.now());
    // הכותרת מתחלפת. מעבירים אליה את הפוקוס, כדי שקורא מסך יקרא את המצב החדש.
    requestAnimationFrame(() => heading.current?.focus());
  }

  const sent = sentAt !== null;

  return (
    <>
      <h1 ref={heading} tabIndex={-1} className="mt-[22px] text-[30px] leading-tight font-bold text-balance outline-none">
        {sent ? 'עכשיו לתיבת המייל' : 'להתחבר בלי סיסמה'}
      </h1>
      <p className="mt-2 font-sans text-[15px] leading-normal text-ink-soft">
        {sent
          ? 'שלחנו קישור כניסה. לוחצים עליו, וחוזרים לעמוד שבו הייתם, מחוברים.'
          : 'שולחים לכם קישור למייל. לוחצים עליו, ואתם בפנים.'}
      </p>
      {linkFailed && !sent && (
        <p role="alert" className="mt-3 font-sans text-[15px] leading-normal font-bold">
          הקישור לא עבד. אולי עברה שעה, אולי כבר השתמשו בו, או שנפתח בדפדפן אחר. אפשר לבקש קישור חדש.
        </p>
      )}

      <div className="relative mt-[18px]">
        <div aria-hidden="true" className="absolute inset-y-0 start-[70px] w-px bg-rule" />

        {sent ? (
          <>
            <div
              role="status"
              className="grid min-h-16 grid-cols-[70px_minmax(0,1fr)_44px] items-center border-y border-line"
            >
              <span className={marginLabel}>לאן לשלוח?</span>
              <p className="min-w-0 self-stretch pt-5 ps-3 pb-1 text-lg leading-normal">
                {/* מייל ארוך נשבר לשורה שנייה, ולא נכנס לעמודת הווי. */}
                <span
                  dir="ltr"
                  className="inline-block max-w-full -rotate-1 font-pen text-xl font-medium [overflow-wrap:anywhere] text-pen"
                >
                  {email.trim()}
                </span>
              </p>
              <span className="justify-self-center">
                <TickMark className="size-[30px]" />
                <span className="sr-only">נשלח</span>
              </span>
            </div>
            <div className="grid grid-cols-[70px_minmax(0,1fr)] items-start pt-3">
              <p className={cn(marginNote, 'pt-0.5')}>
                <span aria-hidden="true">← </span>נשלח עכשיו
              </p>
              <div className="ps-3 font-sans text-[15px] leading-normal">
                <p className="font-bold">לא מוצאים אותו?</p>
                <p className="mt-1">חפשו בתיבה ״[שם האתר]״, ובדקו גם בספאם.</p>
                <p className="mt-1.5">פותחים את הקישור באותו טלפון ובאותו דפדפן שבהם ביקשתם אותו.</p>
                <p className="mt-1.5">הקישור תקף לשעה, ועובד פעם אחת.</p>
              </div>
            </div>
            <div className="mt-[18px] grid grid-cols-[70px_minmax(0,1fr)] items-center">
              <p className={marginNote}>
                <span aria-hidden="true">← </span>פעם בדקה
              </p>
              <div className="ps-3">
                <button
                  type="button"
                  disabled={waitSeconds > 0 || sending}
                  onClick={() => void send()}
                  className={cn(
                    'block h-[50px] w-full rounded-[4px] border-[1.5px] bg-white font-sans text-base font-bold tabular-nums',
                    waitSeconds > 0 ? 'cursor-not-allowed border-line text-ink-soft' : 'border-ink text-ink',
                  )}
                >
                  {waitSeconds > 0 ? `לשלוח שוב בעוד ${clock(waitSeconds)}` : 'לשלוח שוב'}
                </button>
              </div>
            </div>
            {error && (
              <p role="alert" className="ms-[70px] mt-2 ps-3 font-sans text-[15px] font-bold">
                {SEND_ERROR_TEXT[error]}
              </p>
            )}
            <div className="ms-[70px] mt-1.5 ps-3 font-sans text-[15px] font-semibold">
              <button
                type="button"
                onClick={() => {
                  setSentAt(null);
                  setError(null);
                }}
                className={smallLink}
              >
                טעיתי במייל
              </button>
            </div>
          </>
        ) : (
          <>
            <ul className="border-t border-line">
              {REASONS.map((reason, i) => (
                <li
                  key={reason}
                  className="grid grid-cols-[70px_minmax(0,1fr)] items-start border-b border-line"
                >
                  <span className={cn(marginLabel, 'pt-3')}>{i === 0 ? 'למה להתחבר?' : ''}</span>
                  <p className="pt-2.5 ps-3 pb-[7px] text-base leading-normal">{reason}</p>
                </li>
              ))}
            </ul>
            <form
              aria-label="כניסה עם קישור במייל"
              onSubmit={(event) => {
                event.preventDefault();
                void send();
              }}
            >
              <div className="grid min-h-16 grid-cols-[70px_minmax(0,1fr)] items-center border-b-2 border-ink">
                <label htmlFor="email" className={marginLabel}>
                  לאן לשלוח?
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  dir="ltr"
                  required
                  autoComplete="email"
                  inputMode="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  enterKeyHint="send"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={cn(
                    'min-w-0 self-stretch bg-transparent pt-5 ps-3 pb-1 pe-1 text-right outline-none',
                    'font-pen text-xl font-medium text-pen caret-pen not-placeholder-shown:-rotate-1',
                    'placeholder:font-sans placeholder:text-[15px] placeholder:font-normal placeholder:text-ink-soft',
                  )}
                />
              </div>
              <p className="ms-[70px] mt-3 ps-3 font-sans text-[13px] leading-normal text-ink-soft">
                אין סיסמה לזכור. אם עוד אין לכם חשבון, הקישור פותח אחד.
              </p>
              {error && (
                <p role="alert" className="ms-[70px] mt-2 ps-3 font-sans text-[15px] font-bold">
                  {SEND_ERROR_TEXT[error]}
                </p>
              )}
              <div className="mt-3.5 grid grid-cols-[70px_minmax(0,1fr)] items-center">
                <p className={marginNote}>
                  <span aria-hidden="true">← </span>תקף לשעה
                </p>
                <div className="ps-3">
                  <button
                    type="submit"
                    disabled={sending}
                    className={cn(buttonVariants(), 'h-[50px] w-full text-base font-bold')}
                  >
                    לשלוח לי קישור
                  </button>
                </div>
              </div>
            </form>
            <div className="ms-[70px] mt-4 ps-3 font-sans text-[13px] leading-normal text-ink-soft">
              <p className="text-pretty">שומרים אצלנו רק שלושה דברים: המייל, הקורסים ששמרתם והתשובות שלכם.</p>
              <Link href="/privacy" className={smallLink}>
                מדיניות הפרטיות
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}
```

- [ ] **Step 3: העמוד**

Replace the whole content of `web/src/app/login/page.tsx` with:

```tsx
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm, LoginFromUrl } from '@/components/account/login-form';
import { SiteFooter } from '@/components/site/site-footer';
import { SiteHeader } from '@/components/site/site-header';

/** העמוד סטטי. לאן לחזור (next) נקרא בדפדפן, בתוך <Suspense>, כמו התשובות בדף הבית. */
export const ensureStatic = 'navigation';

export const metadata: Metadata = {
  title: 'התחברות | [שם האתר]',
  description: 'התחברות בקישור למייל, בלי סיסמה. כדי לשמור קורסים, השוואה ותשובות.',
};

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-[680px] px-[22px]">
      <SiteHeader />
      <main className="pb-[30px]">
        <Suspense fallback={<LoginForm next="/" linkFailed={false} />}>
          <LoginFromUrl />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
```

- [ ] **Step 4: בנייה ובדיקות**

עוצרים כל שרת שרץ על פורט 3000, ואז:

```bash
cd web
pnpm lint && pnpm exec tsc --noEmit && pnpm test && pnpm build
pnpm e2e
```

Expected: בפלט הבנייה `○ /login` (סטטי). `7 passed`.

אם הבנייה נכשלת על `useSearchParams` מחוץ ל-`Suspense`, משהו קורא את הכתובת מחוץ ל-`LoginFromUrl`.

- [ ] **Step 5: בדיקה מול הציור, וכניסה אמיתית**

`pnpm start`, ופותחים את `http://localhost:3000/login?next=%2Fcourses%2Fbaking-sample` ברוחב 390 (במצב נייד). משווים ל-`design/canvas/Login.dc.html`, ומסמנים כל סעיף:
- [ ] **הטופס:** "להתחבר בלי סיסמה", המשפט מתחתיה, קו השוליים ב-70 פיקסלים, "למה להתחבר?" בשוליים עם ארבע השורות, "לאן לשלוח?" בשוליים, קו שחור עבה מתחת לשורת המייל, "אין סיסמה לזכור…", "← תקף לשעה" בעט, הכפתור השחור "לשלוח לי קישור", "שומרים אצלנו רק שלושה דברים…" ו"מדיניות הפרטיות".
- [ ] **המייל בעט:** מקלידים `gal-test@example.com`. הטקסט בעט כחול, מוטה מעט, משמאל לימין. הדוגמה `name@example.com` בגופן המודפס ובאפור.
- [ ] **אחרי השליחה:** "עכשיו לתיבת המייל", המייל בעט עם וי כחול, "← נשלח עכשיו", "לא מוצאים אותו?" ושלוש השורות, "← פעם בדקה", הכפתור "לשלוח שוב בעוד 1:00" שסופר לאחור, ו"טעיתי במייל". מייל ארוך נשבר לשורה שנייה, ולא נכנס לעמודת הווי.
- [ ] **"טעיתי במייל":** חוזר לטופס, והמייל עדיין כתוב.
- [ ] **כניסה:** פותחים את `http://127.0.0.1:54324` (Mailpit) **באותו דפדפן**, את המייל "Your sign-in link", ולוחצים על "Sign in". הדפדפן חוזר ל-`/courses/baking-sample`. פותחים שוב את `/login`: העמוד מעביר מיד ל-`/`, כי כבר מחוברים.
- [ ] **קישור שלא עבד:** `http://localhost:3000/login?error=link` מציג "הקישור לא עבד…" מודגש מעל הטופס.
- [ ] **מקלדת:** Tab עובר מהמייל לכפתור, Enter שולח, והפוקוס עובר לכותרת החדשה.
- [ ] **רוחב:** אין גלילה לרוחב, וכל פקד בגובה 44 לפחות.
- [ ] **קונסול:** אין שגיאות.

אם משהו לא תואם לציור, מתקנים לפני הקומיט. בסוף עוצרים את השרת.

- [ ] **Step 6: Commit**

```bash
cd ..
git add web/src/components/account/login-form.tsx web/src/app/login/page.tsx
git commit -m "feat: עמוד התחברות בקישור למייל, לפי הציור"
```

---

### Task 6: האזור האישי, ו"האזור שלי" בתפריט

**Files:**
- Modify: `web/src/components/notebook/choice-chip.tsx` (הקובץ כולו)
- Modify: `web/src/components/notebook/results.tsx`
- Create: `web/src/components/account/me-section.tsx`
- Create: `web/src/components/account/my-answers.tsx`
- Create: `web/src/components/account/saved-courses.tsx`
- Create: `web/src/components/account/compare-tray.tsx`
- Create: `web/src/components/account/account-section.tsx`
- Create: `web/src/components/account/me-area.tsx`
- Create: `web/src/app/me/page.tsx`
- Create: `web/src/components/site/account-link.tsx`
- Modify: `web/src/components/site/site-header.tsx` (הקובץ כולו)

- [ ] **Step 1: לפני שכותבים ממשק**

1. קוראים את `.claude/skills/impeccable/reference/craft-floor.md` ואת `.impeccable/surfaces/course-page.md`. אם התיקייה `.claude/skills/impeccable` חסרה, מריצים `npx impeccable install` מתיקיית הפרויקט.
2. טוענים את `/impeccable`.
3. פותחים את `design/canvas/Me.dc.html`. הסדר: הכותרת והמשפט, "בעמוד הזה" עם חמשת הקישורים, "התשובות שלי", "קורסים ששמרתי", "ההשוואה שלי", "הביקורות שלי" ו"החשבון".
4. הכללים:
   - מרקרים ופתקים רק למקורות ולקולות: ירוק נבדק, צהוב בוגרים, ורוד חולשה, קו כחול טענת המוסד. אף כפתור, הודעה או שגיאה לא מקבלים מרקר או פתק.
   - מה שהמבקר כתב או סימן: עט כחול על קו. כאן, התשובות השמורות והווי בריבוע של "להשוואה".
   - הערות של האתר: עט, עם חץ, בשוליים ("← היום מתאימים 14", "← עוד בבנייה").
   - כל מחיר עטוף ב-`<bdi dir="rtl">`.
   - קודם לנייד, ברוחב 390 פיקסלים. כל פקד לפחות 44 פיקסלים.
   - מה שלא מצויר (מצבים ריקים, שלב האישור במחיקה), בונים מהחלקים שכבר בציור, בלי רכיב או צבע חדש.

- [ ] **Step 2: כפתור בחירה שאפשר לנעול בזמן שמירה**

Replace the whole content of `web/src/components/notebook/choice-chip.tsx` with:

```tsx
import { cn } from '@/lib/utils';
import { TickMark } from './tick';

/**
 * כפתור בחירה בגובה 44, עם ריבוע קטן ווי בעט, כמו ב"מתי ואיך" בציור.
 * checked: בחירה מרובה (role="checkbox"). pressed: תשובה אחת מתוך כמה (aria-pressed).
 * disabled: בזמן שמירה, כדי שלחיצה כפולה לא תשלח פעמיים.
 */
export function ChoiceChip({
  checked,
  pressed,
  disabled = false,
  onClick,
  children,
}: {
  checked?: boolean;
  pressed?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const on = Boolean(checked ?? pressed);
  const state = pressed === undefined ? { role: 'checkbox' as const, 'aria-checked': on } : { 'aria-pressed': on };
  return (
    <button
      type="button"
      {...state}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex h-11 items-center gap-2 rounded-[4px] border border-ink bg-white px-2.5 font-sans text-[15px] text-ink',
        on ? 'font-bold' : 'font-semibold',
        disabled && 'cursor-wait opacity-60',
      )}
    >
      <span aria-hidden="true" className="relative size-4 flex-none rounded-[2px] border-[1.5px] border-ink">
        {on && <TickMark strokeWidth={2.6} className="absolute -top-[9px] -left-0.5 size-[23px]" />}
      </span>
      {children}
    </button>
  );
}
```

- [ ] **Step 3: שורת התוצאה מקבלת כפתורים**

In `web/src/components/notebook/results.tsx`, replace:

```tsx
import { PRODUCT_TYPE_LABEL } from '@/lib/search/types';
```

with:

```tsx
import { PRODUCT_TYPE_LABEL } from '@/lib/search/types';
import { cn } from '@/lib/utils';
```

Replace:

```tsx
/** שורת תוצאה בסגנון הסיכום: ההערה בעט בשוליים מימין, והקורס משמאלה. */
export function ResultRow({ result }: { result: MatchResult }) {
  const { course, note } = result;
  const product = PRODUCT_TYPE_LABEL[course.productType];
  return (
    <article className="grid grid-cols-[70px_minmax(0,1fr)] border-b border-rule pt-4 pb-[18px]">
```

with:

```tsx
/**
 * שורת תוצאה בסגנון הסיכום: ההערה בעט בשוליים מימין, והקורס משמאלה.
 * actions: הכפתורים בסוף השורה ("לשמור", ובאזור האישי גם "להשוואה").
 * highlight: באזור האישי השורה בלי העובדה המודגשת, כמו בציור (Me.dc.html).
 */
export function ResultRow({
  result,
  highlight = true,
  actions,
}: {
  result: MatchResult;
  highlight?: boolean;
  actions?: React.ReactNode;
}) {
  const { course, note } = result;
  const product = PRODUCT_TYPE_LABEL[course.productType];
  return (
    <article
      className={cn(
        'grid grid-cols-[70px_minmax(0,1fr)] border-b border-rule pt-4',
        actions ? 'pb-3' : 'pb-[18px]',
      )}
    >
```

Replace:

```tsx
        {course.highlight && (
          <p className="mt-1.5 font-sans text-[15px] leading-normal">
            <Mark source="grads">
              {course.highlight.label}: {course.highlight.text}
            </Mark>
          </p>
        )}
      </div>
```

with:

```tsx
        {highlight && course.highlight && (
          <p className="mt-1.5 font-sans text-[15px] leading-normal">
            <Mark source="grads">
              {course.highlight.label}: {course.highlight.text}
            </Mark>
          </p>
        )}
        {actions && <div className="mt-2.5 flex flex-wrap items-center gap-x-3.5 gap-y-2">{actions}</div>}
      </div>
```

- [ ] **Step 4: חלק באזור האישי**

Create `web/src/components/account/me-section.tsx`:

```tsx
import { cn } from '@/lib/utils';

/** הערה של האתר בשוליים: עט, עם חץ, מוטה (מסמך העיצוב, סעיף 8). */
export const marginNote = '-rotate-3 pe-1.5 font-pen text-sm leading-snug font-medium text-pen';
/** כפתור שנראה כמו קישור, בגובה 44. */
export const textButton =
  'inline-flex h-11 items-center px-1 font-sans text-[15px] font-semibold underline underline-offset-[3px] hover:text-link-hover';

/** חלק באזור האישי: כותרת עם קו קצר מתחתיה ושורת הסבר, מימין לקו השוליים, כמו בציור (Me.dc.html). */
export function MeSection({
  id,
  title,
  sub,
  className,
  children,
}: {
  id: string;
  title: string;
  sub?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className={cn('scroll-mt-4', className)}>
      <div className="ms-[70px] ps-3">
        <h2 id={`${id}-h`} className="inline-block border-b-2 border-ink pb-0.5 text-[21px] leading-snug font-bold">
          {title}
        </h2>
        {sub && <p className="mt-2 font-sans text-[13px] leading-normal text-ink-soft">{sub}</p>}
      </div>
      {children}
    </section>
  );
}
```

- [ ] **Step 5: "התשובות שלי"**

Create `web/src/components/account/my-answers.tsx`:

```tsx
import Link from 'next/link';
import { PenAnswer } from '@/components/notebook/answer-line';
import { buttonVariants } from '@/components/ui/button';
import { formatAmount, formatHebrewDate } from '@/lib/format';
import { matchCourses } from '@/lib/search/match';
import { activeLines, hasAnswer, serializeQuery, whenHowWords } from '@/lib/search/query';
import type { Catalog, LineKey, SearchQuery } from '@/lib/search/types';
import { whyOption } from '@/lib/search/why';
import { cn } from '@/lib/utils';
import { MeSection, marginNote } from './me-section';

function AnswerRow({ number, question, children }: { number: number; question: string; children?: React.ReactNode }) {
  return (
    <li className="grid min-h-[58px] grid-cols-[70px_minmax(0,1fr)] items-center border-b border-line">
      <span className="font-sans text-[13px] leading-tight text-ink-soft">
        <strong className="block text-base text-ink">{number}</strong>
        {question}
      </span>
      <p className="pt-3.5 ps-3 pb-0.5 text-lg leading-normal">{children}</p>
    </li>
  );
}

const fitsText = (n: number) => (n === 0 ? 'היום אין קורס מתאים' : n === 1 ? 'היום מתאים קורס אחד' : `היום מתאימים ${n}`);

/**
 * "התשובות שלי": ארבע השורות מדף הבית, לקריאה בלבד, ו"לחזור לרשימה" עם אותן תשובות בכתובת.
 * תשובה בשורה שהווי שלה הוסר מוצגת מחוקה, כמו בדף הבית.
 */
export function MyAnswers({
  catalog,
  query,
  savedAt,
}: {
  catalog: Catalog;
  query: SearchQuery | null;
  savedAt: string | null;
}) {
  if (!query || !savedAt) {
    return (
      <MeSection id="answers" title="התשובות שלי" sub="עוד לא שמרתם תשובות מדף הבית.">
        <p className="ms-[70px] mt-2 ps-3 font-sans text-[15px] font-semibold">
          <Link href="/" className="inline-flex min-h-11 items-center underline underline-offset-[3px] hover:text-link-hover">
            לענות על ארבע השאלות בדף הבית
          </Link>
        </p>
      </MeSection>
    );
  }

  const struck = (line: LineKey) => hasAnswer(query, line) && query.off.includes(line);
  const nameOf = (slug: string) => catalog.categories.find((c) => c.slug === slug)?.name ?? slug;
  const what = query.q || query.cats.map(nameOf).join(', ');
  const why = query.why ? whyOption(query.why) : null;
  const whenHow = whenHowWords(query.when, query.how);
  const filtering = activeLines(query).length > 0;
  const search = serializeQuery(query);

  return (
    <MeSection
      id="answers"
      title="התשובות שלי"
      sub={`מהשאלות בדף הבית. שמרתם אותן ב-${formatHebrewDate(savedAt)}.`}
    >
      <p className="ms-[70px] mt-2.5 pt-1 ps-3 pb-1.5 text-lg leading-normal">אני רוצה ללמוד</p>
      <ol className="border-t border-line">
        <AnswerRow number={1} question="מה?">
          {what && <PenAnswer struck={struck('what')}>{what}</PenAnswer>}
        </AnswerRow>
        <AnswerRow number={2} question="למה?">
          {why && (
            <>
              {why.prefix && `${why.prefix} `}
              <PenAnswer struck={struck('why')}>{why.label}</PenAnswer>,
            </>
          )}
        </AnswerRow>
        <AnswerRow number={3} question="מתי ואיך?">
          {whenHow.words.length > 0 && (
            <>
              {whenHow.prefix}
              <PenAnswer struck={struck('whenhow')}>{whenHow.words.join(', ')}</PenAnswer>,
            </>
          )}
        </AnswerRow>
        <AnswerRow number={4} question="כמה?">
          {query.maxPrice !== null && (
            <>
              עד <PenAnswer struck={struck('budget')}>{formatAmount(query.maxPrice)}</PenAnswer> ₪
            </>
          )}
        </AnswerRow>
      </ol>
      <div className="mt-3.5 grid grid-cols-[70px_minmax(0,1fr)] items-center">
        <p className={marginNote}>
          {filtering && (
            <>
              <span aria-hidden="true">← </span>
              {fitsText(matchCourses(catalog.courses, query).length)}
            </>
          )}
        </p>
        <div className="ps-3">
          <Link
            href={search ? `/?${search}` : '/'}
            className={cn(buttonVariants(), 'h-[50px] w-full text-base font-bold')}
          >
            לחזור לרשימה
          </Link>
        </div>
      </div>
    </MeSection>
  );
}
```

- [ ] **Step 6: "קורסים ששמרתי"**

Create `web/src/components/account/saved-courses.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { ChoiceChip } from '@/components/notebook/choice-chip';
import { ResultRow } from '@/components/notebook/results';
import { toggleCompare, toggleSaved, type ListResult } from '@/lib/account/store';
import { matchCourses } from '@/lib/search/match';
import type { CourseSummary, SearchQuery } from '@/lib/search/types';
import { MeSection, textButton } from './me-section';

/**
 * ההערה בשוליים: הקורס מול התשובות השמורות, באותו חישוב כמו ברשימה בדף הבית.
 * "מה" לא נבדק: את הקורס כבר בחרו. קורס שלא מתאים בשני דברים נשאר בלי הערה.
 */
function noteFor(course: CourseSummary, query: SearchQuery | null): string {
  if (!query) return '';
  const [result] = matchCourses([course], { ...query, off: [...query.off, 'what'] });
  return result?.note ?? '';
}

const countText = (n: number) => (n === 1 ? 'קורס אחד.' : `${n} קורסים.`);

/** "קורסים ששמרתי": שורה לכל קורס, עם "להשוואה" ו"להסיר מהשמורים", כמו בציור (Me.dc.html). */
export function SavedCourses({
  courses,
  inCompare,
  query,
}: {
  courses: CourseSummary[];
  inCompare: (courseId: string) => boolean;
  query: SearchQuery | null;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ courseId: string; result: ListResult } | null>(null);

  async function run(courseId: string, action: (id: string) => Promise<ListResult>) {
    setBusy(courseId);
    const result = await action(courseId);
    setBusy(null);
    setNotice(result === 'ok' ? null : { courseId, result });
  }

  const sub =
    courses.length === 0
      ? 'עוד לא שמרתם קורסים. בכל קורס יש כפתור ״לשמור״.'
      : `${countText(courses.length)}${query ? ' ההערות בשוליים משוות כל קורס לתשובות שלכם.' : ''}`;

  return (
    <MeSection id="saved" title="קורסים ששמרתי" sub={sub} className="mt-9">
      {courses.map((course) => (
        <ResultRow
          key={course.id}
          result={{ course, full: true, note: noteFor(course, query) }}
          highlight={false}
          actions={
            <>
              <ChoiceChip
                checked={inCompare(course.id)}
                disabled={busy === course.id}
                onClick={() => void run(course.id, toggleCompare)}
              >
                להשוואה<span className="sr-only"> את {course.title}</span>
              </ChoiceChip>
              <button
                type="button"
                disabled={busy === course.id}
                onClick={() => void run(course.id, toggleSaved)}
                className={textButton}
              >
                להסיר מהשמורים<span className="sr-only"> את {course.title}</span>
              </button>
              {notice?.courseId === course.id && (
                <p role="status" className="basis-full font-sans text-[13px] text-ink-soft">
                  {notice.result === 'full'
                    ? 'בהשוואה כבר יש 3 קורסים. מוציאים אחד כדי לפנות מקום.'
                    : 'לא הצלחנו לעדכן. נסו שוב.'}
                </p>
              )}
            </>
          }
        />
      ))}
    </MeSection>
  );
}
```

- [ ] **Step 7: "ההשוואה שלי"**

Create `web/src/components/account/compare-tray.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { MAX_COMPARE } from '@/lib/account/lists';
import { toggleCompare } from '@/lib/account/store';
import { formatIls } from '@/lib/format';
import type { CourseSummary } from '@/lib/search/types';
import { cn } from '@/lib/utils';
import { MeSection, marginNote } from './me-section';

const chosenText = (n: number) => (n === 0 ? 'עוד לא בחרתם.' : n === 1 ? 'בחרתם אחד.' : `בחרתם ${n}.`);
const smallLink = 'underline underline-offset-[3px] hover:text-link-hover';

/**
 * "ההשוואה שלי": שלושה מקומות בדיוק, זה לצד זה, כמו בציור (Me.dc.html).
 * מקום שהתפנה נשאר ריק במקום שלו. עמוד ההשוואה עצמו נבנה בסבב 4.
 */
export function CompareTray({ slots }: { slots: { position: number; course: CourseSummary }[] }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  async function remove(courseId: string) {
    setBusy(courseId);
    const result = await toggleCompare(courseId);
    setBusy(null);
    setFailed(result !== 'ok');
  }

  return (
    <MeSection
      id="compare"
      title="ההשוואה שלי"
      sub={`יש בה מקום ל-3 קורסים בדיוק, זה לצד זה. ${chosenText(slots.length)}`}
      className="mt-9"
    >
      <ol
        aria-label={`${slots.length} מתוך ${MAX_COMPARE} מקומות תפוסים`}
        className="relative z-[1] mt-3.5 grid grid-cols-3 border-[1.5px] border-ink bg-white"
      >
        {Array.from({ length: MAX_COMPARE }, (_, i) => i + 1).map((position) => {
          const slot = slots.find((s) => s.position === position);
          const divider = position < MAX_COMPARE && 'border-e border-ink';
          if (!slot) {
            return (
              <li key={position} className={cn('flex p-1.5', divider)}>
                <div className="flex flex-1 flex-col rounded-[2px] border-[1.5px] border-dashed border-leader pt-[3px] ps-1.5 pe-1">
                  <span className="font-sans text-base leading-tight font-bold text-ink-soft">{position}</span>
                  <p className="mt-2 font-sans text-sm leading-snug text-ink-soft">מקום פנוי</p>
                  <a
                    href="#saved"
                    className={cn('mt-auto flex min-h-11 items-center font-sans text-sm leading-tight font-bold', smallLink)}
                  >
                    להוסיף מהשמורים
                  </a>
                </div>
              </li>
            );
          }
          const { course } = slot;
          return (
            <li key={position} className={cn('flex flex-col pt-2.5 ps-2.5 pe-2 pb-1', divider)}>
              <span className="font-sans text-base leading-tight font-bold">{position}</span>
              <Link
                href={`/courses/${course.slug}`}
                className="mt-1 flex min-h-11 items-center text-[15px] leading-snug font-bold hover:text-link-hover hover:underline"
              >
                {course.title}
              </Link>
              {course.score.status === 'scored' ? (
                <p className="mt-1 flex flex-wrap items-baseline gap-x-1 font-sans text-[13px] leading-tight text-ink-soft">
                  <span className="font-serif text-xl leading-none font-bold text-ink">
                    {course.score.value.toFixed(1)}
                  </span>
                  ציון בוגרים
                </p>
              ) : (
                <p className="mt-1 font-sans text-[13px] leading-tight text-ink-soft">עוד אין ציון</p>
              )}
              <p className="mt-1 font-sans text-[15px] leading-snug font-bold tabular-nums">
                {course.sitePrice !== null ? (
                  <bdi dir="rtl">{formatIls(course.sitePrice)}</bdi>
                ) : (
                  <span className="text-[13px] font-normal text-ink-soft">בלי מחיר באתר</span>
                )}
              </p>
              <button
                type="button"
                disabled={busy === course.id}
                onClick={() => void remove(course.id)}
                aria-label={`להוציא את ${course.title} מההשוואה`}
                className="mt-1.5 inline-flex h-11 min-w-11 items-center self-start px-1 font-sans text-sm font-semibold underline underline-offset-[3px] hover:text-link-hover"
              >
                להוציא
              </button>
            </li>
          );
        })}
      </ol>
      {failed && (
        <p role="status" className="ms-[70px] mt-2 ps-3 font-sans text-[13px] text-ink-soft">
          לא הצלחנו לעדכן. נסו שוב.
        </p>
      )}
      <div className="mt-2.5 grid grid-cols-[70px_minmax(0,1fr)] items-center">
        <p className={marginNote}>
          <span aria-hidden="true">← </span>עוד בבנייה
        </p>
        <div className="ps-3 font-sans text-[15px] font-semibold">
          <Link href="/compare" className={cn('inline-flex min-h-11 items-center', smallLink)}>
            לעמוד ההשוואה
          </Link>
        </div>
      </div>
    </MeSection>
  );
}
```

- [ ] **Step 8: "החשבון", עם שלב האישור במחיקה**

Create `web/src/components/account/account-section.tsx`:

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { buttonVariants } from '@/components/ui/button';
import { deleteAccount, signOut } from '@/lib/account/store';
import { cn } from '@/lib/utils';
import { MeSection, textButton } from './me-section';

/**
 * "החשבון": המייל, התנתקות, ומחיקת החשבון עם שלב אישור בתוך העמוד.
 * onLeave נקרא לפני שההתחברות נמחקת, כדי שהאזור לא ישלח להתחברות אלא יראה מה קרה.
 */
export function AccountSection({
  email,
  onLeave,
}: {
  email: string;
  onLeave: (reason: 'signed-out' | 'deleted') => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const question = useRef<HTMLParagraphElement>(null);

  // שלב האישור נפתח: הפוקוס עובר לשאלה, כדי שקורא מסך יקרא אותה.
  useEffect(() => {
    if (confirming) question.current?.focus();
  }, [confirming]);

  async function onSignOut() {
    setBusy(true);
    onLeave('signed-out');
    if ((await signOut()) !== 'ok') {
      setBusy(false);
      setError('לא הצלחנו לנתק. נסו שוב.');
    }
  }

  async function onDelete() {
    setBusy(true);
    setError(null);
    if ((await deleteAccount()) === 'ok') {
      // קודם מודיעים לאזור, ורק אז מנתקים: אחרת ההתנתקות הייתה שולחת להתחברות.
      onLeave('deleted');
      await signOut('local');
      return;
    }
    setBusy(false);
    setError('לא הצלחנו למחוק את החשבון. לא נמחק כלום. נסו שוב בעוד כמה דקות.');
  }

  return (
    <MeSection id="account" title="החשבון" className="mt-[34px]">
      <div className="mt-3 grid min-h-[54px] grid-cols-[70px_minmax(0,1fr)] items-center border-y border-line">
        <span className="font-sans text-[13px] leading-tight text-ink-soft">מחוברים עם</span>
        <p dir="ltr" className="pr-3 text-right font-sans text-base leading-snug font-semibold">
          {email}
        </p>
      </div>
      <div className="ms-[70px] ps-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => void onSignOut()}
          className={cn(
            buttonVariants({ variant: 'outline' }),
            'mt-4 h-[50px] w-full border-[1.5px] border-ink text-base font-bold',
          )}
        >
          להתנתק
        </button>
        {confirming ? (
          <div role="group" aria-labelledby="delete-question" className="mt-3.5 border-t-2 border-ink pt-3 font-sans">
            <p id="delete-question" ref={question} tabIndex={-1} className="text-[15px] font-bold outline-none">
              למחוק את החשבון לצמיתות?
            </p>
            <p className="mt-1 text-[13px] leading-normal text-pretty text-ink-soft">
              המייל, הקורסים ששמרתם, ההשוואה והתשובות יימחקו עכשיו. אי אפשר לבטל את זה.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void onDelete()}
                className={cn(buttonVariants(), 'h-[50px] px-4 text-base font-bold')}
              >
                {busy ? 'מוחקים…' : 'כן, למחוק הכול'}
              </button>
              <button type="button" disabled={busy} onClick={() => setConfirming(false)} className={textButton}>
                לא, להשאיר
              </button>
            </div>
          </div>
        ) : (
          <>
            <button type="button" onClick={() => setConfirming(true)} className={cn(textButton, 'mt-3.5 px-0 font-bold')}>
              למחוק את החשבון
            </button>
            <p className="font-sans text-[13px] leading-normal text-pretty text-ink-soft">
              מוחק לצמיתות את המייל, הקורסים ששמרתם, ההשוואה והתשובות. אי אפשר לשחזר אותם.
            </p>
          </>
        )}
        {error && (
          <p role="alert" className="mt-2 font-sans text-[15px] font-bold">
            {error}
          </p>
        )}
      </div>
    </MeSection>
  );
}
```

- [ ] **Step 9: האזור כולו**

Create `web/src/components/account/me-area.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MAX_COMPARE } from '@/lib/account/lists';
import { useAccount } from '@/lib/account/store';
import { parseQuery } from '@/lib/search/query';
import type { Catalog } from '@/lib/search/types';
import { cn } from '@/lib/utils';
import { AccountSection } from './account-section';
import { CompareTray } from './compare-tray';
import { MeSection } from './me-section';
import { MyAnswers } from './my-answers';
import { SavedCourses } from './saved-courses';

const navLink = 'inline-flex min-h-11 items-center underline decoration-1 underline-offset-[3px] hover:text-link-hover';

/**
 * האזור האישי, לפי הציור (Me.dc.html): התשובות, השמורים, ההשוואה, "הביקורות שלי" (בקרוב) והחשבון.
 * הכול נטען בדפדפן. מי שלא מחובר עובר להתחברות, וחוזר לכאן אחריה.
 * קורס שכבר לא בקטלוג (הוסר מהאתר) לא מוצג. ראו notes-for-plan-2.md.
 */
export function MeArea({ catalog }: { catalog: Catalog }) {
  const account = useAccount();
  const router = useRouter();
  const [left, setLeft] = useState<'signed-out' | 'deleted' | null>(null);

  useEffect(() => {
    if (account.status === 'signed-out' && left === null) router.replace('/login?next=%2Fme');
    if (account.status === 'signed-out' && left === 'signed-out') router.replace('/');
  }, [account.status, left, router]);

  if (left === 'deleted') {
    return (
      <div role="status" className="mt-6 font-sans text-[15px] leading-normal">
        <p className="font-bold">החשבון נמחק. המייל וכל מה ששמרתם כבר לא אצלנו.</p>
        <Link href="/" className="inline-flex min-h-11 items-center underline underline-offset-[3px]">
          לדף הבית
        </Link>
      </div>
    );
  }
  if (account.status === 'error') {
    return (
      <p role="alert" className="mt-6 font-sans text-[15px] font-bold">
        לא הצלחנו לטעון את האזור שלכם. נסו לרענן את הדף.
      </p>
    );
  }
  if (account.status !== 'signed-in') {
    return (
      <p role="status" className="sr-only">
        טוענים את האזור שלכם
      </p>
    );
  }

  const byId = new Map(catalog.courses.map((course) => [course.id, course]));
  const saved = account.saved.flatMap((id) => byId.get(id) ?? []);
  const slots = account.compare.flatMap((slot) => {
    const course = byId.get(slot.courseId);
    return course ? [{ position: slot.position, course }] : [];
  });
  const inCompare = (courseId: string) => account.compare.some((slot) => slot.courseId === courseId);
  const query = account.answers ? parseQuery(new URLSearchParams(account.answers.params)) : null;

  return (
    <>
      <nav aria-label="בעמוד הזה" className="mt-1.5 flex flex-wrap gap-x-4 font-sans text-[15px] leading-tight font-semibold">
        <a href="#answers" className={navLink}>
          התשובות שלי
        </a>
        <a href="#saved" className={navLink}>
          שמורים ({saved.length})
        </a>
        <a href="#compare" className={navLink}>
          ההשוואה ({slots.length} מתוך {MAX_COMPARE})
        </a>
        <a href="#reviews" className={navLink}>
          הביקורות שלי
        </a>
        <a href="#account" className={cn(navLink, 'min-w-11')}>
          החשבון
        </a>
      </nav>
      {/* קו השוליים ב-70 פיקסלים, לאורך כל החלקים, כמו בציור. */}
      <div className="relative mt-[18px]">
        <div aria-hidden="true" className="absolute inset-y-0 start-[70px] w-px bg-rule" />
        <MyAnswers catalog={catalog} query={query} savedAt={account.answers?.updatedAt ?? null} />
        <SavedCourses courses={saved} inCompare={inCompare} query={query} />
        <CompareTray slots={slots} />
        <MeSection id="reviews" title="הביקורות שלי" className="mt-8">
          <p className="ms-[70px] mt-2.5 ps-3 text-base leading-[1.7]">
            <strong className="font-sans">בקרוב.</strong> כאן יופיעו הביקורות שתכתבו על קורסים שסיימתם, ואם כל אחת
            כבר אומתה.
          </p>
          <div aria-hidden="true" className="h-[30px] border-b border-line" />
          <div aria-hidden="true" className="h-[38px] border-b border-line" />
        </MeSection>
        <AccountSection email={account.email} onLeave={setLeft} />
      </div>
    </>
  );
}
```

- [ ] **Step 10: העמוד**

Create `web/src/app/me/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { MeArea } from '@/components/account/me-area';
import { SiteFooter } from '@/components/site/site-footer';
import { SiteHeader } from '@/components/site/site-header';
import { getCatalog } from '@/lib/data/catalog';

/**
 * העמוד סטטי, עם הקטלוג מהמטמון. מה ששמרתם נטען בדפדפן, עם ההרשאות שלכם במסד,
 * ולכן אף פעם לא נשמר במטמון בשרת. מי שלא מחובר עובר להתחברות.
 */
export const ensureStatic = 'navigation';

export const metadata: Metadata = { title: 'האזור שלי | [שם האתר]' };

export default async function MePage() {
  const catalog = await getCatalog();
  return (
    <div className="mx-auto max-w-[680px] px-[22px]">
      <SiteHeader />
      <main>
        <h1 className="mt-[22px] text-[30px] leading-tight font-bold">האזור שלי</h1>
        <p className="mt-2 font-sans text-[15px] leading-normal text-ink-soft">
          מה ששמרתם, ההשוואה והתשובות שלכם. רק אתם רואים את העמוד הזה.
        </p>
        <MeArea catalog={catalog} />
      </main>
      <SiteFooter />
    </div>
  );
}
```

- [ ] **Step 11: "האזור שלי" בתפריט**

Create `web/src/components/site/account-link.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { loginHref, useAccount } from '@/lib/account/store';

/**
 * הקישור האחרון בתפריט: "התחברות", ואחרי התחברות "האזור שלי".
 * הכותרת סטטית, ולכן ה-HTML מגיע עם "התחברות", והדפדפן מחליף מיד אחרי שקרא את ההתחברות.
 */
export function AccountLink({ className }: { className: string }) {
  const account = useAccount();
  const router = useRouter();
  if (account.status === 'signed-in') {
    return (
      <Link href="/me" className={className}>
        האזור שלי
      </Link>
    );
  }
  return (
    <Link
      href="/login"
      className={className}
      onClick={(event) => {
        // חוזרים לעמוד הזה אחרי ההתחברות, עם התשובות שבכתובת.
        event.preventDefault();
        router.push(loginHref());
      }}
    >
      התחברות
    </Link>
  );
}
```

Replace the whole content of `web/src/components/site/site-header.tsx` with:

```tsx
import Link from 'next/link';
import { AccountLink } from './account-link';

const navLink = 'inline-flex min-h-11 items-center underline-offset-[3px] hover:text-link-hover hover:underline';

/**
 * הכותרת של כל עמוד: שם האתר, "אף מוכר לא משלם לנו", והתפריט (מסמך העיצוב, 3א.1).
 * הקישור האחרון: "התחברות", או "האזור שלי" למי שמחובר (סעיף 5).
 */
export function SiteHeader() {
  return (
    // pt-[11px]: הקישור לשם האתר בגובה 44, והטקסט שלו נשאר 16 פיקסלים מראש הדף, כמו בציור.
    <header className="border-b border-rule pt-[11px] font-sans">
      <div className="flex items-center justify-between">
        <Link href="/" className="inline-flex min-h-11 items-center text-[19px] font-bold hover:text-link-hover">
          [שם האתר]
        </Link>
        <span className="text-xs text-ink-soft">אף מוכר לא משלם לנו</span>
      </div>
      <nav aria-label="ראשי" className="flex flex-wrap gap-x-4 text-sm">
        <Link href="/courses#subjects" className={navLink}>
          תחומים
        </Link>
        <Link href="/method" className={navLink}>
          איך אנחנו מדרגים
        </Link>
        <AccountLink className={navLink} />
      </nav>
    </header>
  );
}
```

- [ ] **Step 12: בנייה ובדיקות**

עוצרים כל שרת שרץ על פורט 3000, ואז:

```bash
cd web
pnpm lint && pnpm exec tsc --noEmit && pnpm test && pnpm build
pnpm e2e
```

Expected: בפלט הבנייה `○ /me` (סטטי, עם `1h` של הקטלוג). `7 passed`.

- [ ] **Step 13: בדיקה בדפדפן**

עוד אין כפתורי שמירה (משימה 7), ולכן כאן בודקים את הזרימה ואת המצבים הריקים. ההשוואה המלאה מול הציור, עם קורסים שמורים, נעשית במשימה 7.

`pnpm start`, ברוחב 390 (במצב נייד):
- [ ] **לא מחובר:** `http://localhost:3000/me` עובר ל-`/login?next=%2Fme`.
- [ ] **כניסה:** שולחים קישור ל-`gal-test@example.com`, פותחים אותו מ-Mailpit (`http://127.0.0.1:54324`) באותו דפדפן, וחוזרים ל-`/me`. בתפריט כתוב "האזור שלי".
- [ ] **מצבים ריקים:** "עוד לא שמרתם תשובות מדף הבית." עם קישור לדף הבית. "עוד לא שמרתם קורסים…". שלושה מקומות פנויים עם קו מקווקו, "מקום פנוי" ו"להוסיף מהשמורים". "בקרוב." ב"הביקורות שלי", עם שני קווים ריקים. ב"החשבון", המייל משמאל לימין, "להתנתק" ו"למחוק את החשבון".
- [ ] **בעמוד הזה:** חמשת הקישורים קופצים לחלקים, עם "שמורים (0)" ו"ההשוואה (0 מתוך 3)".
- [ ] **התנתקות:** "להתנתק" מעביר לדף הבית, ובתפריט חוזר "התחברות".
- [ ] **מחיקה:** נכנסים שוב. "למחוק את החשבון" פותח את שלב האישור, והפוקוס עובר לשאלה. "לא, להשאיר" סוגר אותו. "כן, למחוק הכול" מציג "החשבון נמחק…" ו"לדף הבית".
- [ ] **המחיקה במסד:** מהשורש, `pnpm exec supabase db query "select count(*) from auth.users where email = 'gal-test@example.com'"` מחזיר `0`.
- [ ] **רוחב:** אין גלילה לרוחב, וכל פקד בגובה 44 לפחות.
- [ ] **קונסול:** אין שגיאות.

בסוף עוצרים את השרת.

- [ ] **Step 14: Commit**

```bash
cd ..
git add web/src/components/notebook/choice-chip.tsx web/src/components/notebook/results.tsx web/src/components/account web/src/app/me web/src/components/site/account-link.tsx web/src/components/site/site-header.tsx
git commit -m "feat: האזור האישי: התשובות, השמורים, ההשוואה והחשבון, ו״האזור שלי״ בתפריט"
```

---

### Task 7: "לשמור" ו"להשוואה" בעמודים

**Files:**
- Create: `web/src/components/account/save-button.tsx`
- Modify: `web/src/components/notebook/results.tsx`
- Modify: `web/src/components/course/course-actions.tsx` (הקובץ כולו)
- Modify: `web/src/app/courses/[slug]/page.tsx`
- Create: `web/src/components/account/save-answers.tsx`
- Modify: `web/src/components/notebook/notebook.tsx`
- Modify: `web/src/app/page.tsx`

- [ ] **Step 1: לפני שכותבים ממשק**

1. קוראים את `.claude/skills/impeccable/reference/craft-floor.md` ואת `.impeccable/surfaces/course-page.md`. אם התיקייה `.claude/skills/impeccable` חסרה, מריצים `npx impeccable install` מתיקיית הפרויקט.
2. טוענים את `/impeccable`.
3. פותחים את `design/canvas/Me.dc.html` (הכפתור "להשוואה" עם הריבוע והווי, שממנו "לשמור" לקוח), את `design/canvas/Chosen.dc.html` (שני הכפתורים בסוף עמוד הקורס) ואת `design/canvas/HomeB.dc.html` (שורת התוצאה).
4. הכללים:
   - מרקרים ופתקים רק למקורות ולקולות: ירוק נבדק, צהוב בוגרים, ורוד חולשה, קו כחול טענת המוסד. אף כפתור או הודעה לא מקבלים מרקר או פתק.
   - מה שהמבקר מסמן: וי בעט כחול בריבוע.
   - הערות של האתר: עט, עם חץ ("← נוסף להשוואה…").
   - קודם לנייד, ברוחב 390 פיקסלים. כל פקד לפחות 44 פיקסלים.
   - שלושת הכפתורים לא מצוירים (החלטה 14). הם בנויים רק מחלקים שכבר בציורים, וגל מאשר אותם בצעד 9.

- [ ] **Step 2: "לשמור"**

Create `web/src/components/account/save-button.tsx`:

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ChoiceChip } from '@/components/notebook/choice-chip';
import { loginHref, rememberForLogin, toggleSaved, useAccount } from '@/lib/account/store';

/**
 * "לשמור": כפתור עם ריבוע ווי בעט, כמו "להשוואה" בציור של האזור האישי (Me.dc.html).
 * מבקר שלא התחבר עובר להתחברות, והקורס נשמר מיד כשהוא חוזר.
 */
export function SaveButton({ courseId, title }: { courseId: string; title: string }) {
  const account = useAccount();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const saved = account.status === 'signed-in' && account.saved.includes(courseId);

  async function onClick() {
    if (account.status === 'signed-out') {
      rememberForLogin({ save: courseId });
      router.push(loginHref());
      return;
    }
    if (account.status !== 'signed-in') return;
    setBusy(true);
    const result = await toggleSaved(courseId);
    setBusy(false);
    setFailed(result !== 'ok');
  }

  return (
    <>
      <ChoiceChip checked={saved} disabled={busy} onClick={() => void onClick()}>
        לשמור<span className="sr-only"> את {title}</span>
      </ChoiceChip>
      {failed && (
        <span role="status" className="font-sans text-[13px] text-ink-soft">
          לא הצלחנו לשמור. נסו שוב.
        </span>
      )}
    </>
  );
}
```

- [ ] **Step 3: "לשמור" בכל שורת תוצאה**

In `web/src/components/notebook/results.tsx`, replace:

```tsx
import Link from 'next/link';
import { Mark } from '@/components/course/marks';
```

with:

```tsx
import Link from 'next/link';
import { SaveButton } from '@/components/account/save-button';
import { Mark } from '@/components/course/marks';
```

Replace:

```tsx
        results.map((result) => <ResultRow key={result.course.slug} result={result} />)
```

with:

```tsx
        results.map((result) => (
          <ResultRow
            key={result.course.slug}
            result={result}
            actions={<SaveButton courseId={result.course.id} title={result.course.title} />}
          />
        ))
```

- [ ] **Step 4: הכפתורים בעמוד הקורס**

Replace the whole content of `web/src/components/course/course-actions.tsx` with:

```tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { SaveButton } from '@/components/account/save-button';
import { PenNote } from '@/components/course/marks';
import { TickMark } from '@/components/notebook/tick';
import { buttonVariants } from '@/components/ui/button';
import { toggleCompare, useAccount } from '@/lib/account/store';
import { cn } from '@/lib/utils';

type Note = 'added-local' | 'added' | 'full' | 'error' | null;

/**
 * שני הכפתורים מהציור (Chosen.dc.html), ומתחתם "לשמור".
 * כתיבת ביקורת נבנית בסבב 3, ועד אז מובילה לעמוד "בקרוב".
 * "להשוואה" מכניס את הקורס להשוואה או מוציא אותו. מבקר לא מחובר: ההשוואה נשמרת בדפדפן.
 * ה-Button של shadcn בנוי על Base UI ואין לו asChild, ולכן הקישור מקבל את המחלקות של הכפתור.
 */
export function CourseActions({ courseId, slug, title }: { courseId: string; slug: string; title: string }) {
  const account = useAccount();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<Note>(null);
  const inCompare =
    (account.status === 'signed-in' && account.compare.some((slot) => slot.courseId === courseId)) ||
    (account.status === 'signed-out' && account.compare.includes(courseId));

  async function onCompare() {
    if (account.status !== 'signed-in' && account.status !== 'signed-out') return;
    const adding = !inCompare;
    setBusy(true);
    const result = await toggleCompare(courseId);
    setBusy(false);
    if (result !== 'ok') setNote(result);
    else if (!adding) setNote(null);
    else setNote(account.status === 'signed-out' ? 'added-local' : 'added');
  }

  return (
    <div className="mt-6 font-sans">
      <div className="flex gap-2.5">
        <Link href={`/courses/${slug}/review`} className={cn(buttonVariants(), 'h-[50px] flex-1 text-base font-bold')}>
          כתיבת ביקורת
        </Link>
        <button
          type="button"
          role="checkbox"
          aria-checked={inCompare}
          disabled={busy}
          onClick={() => void onCompare()}
          className={cn(
            buttonVariants({ variant: 'outline' }),
            'h-[50px] flex-1 gap-2 border-[1.5px] border-ink text-base font-bold',
            busy && 'cursor-wait',
          )}
        >
          {inCompare && (
            <span aria-hidden="true" className="relative size-4 flex-none rounded-[2px] border-[1.5px] border-ink">
              <TickMark strokeWidth={2.6} className="absolute -top-[9px] -left-0.5 size-[23px]" />
            </span>
          )}
          להשוואה (עד 3)
        </button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-3.5 gap-y-2">
        <SaveButton courseId={courseId} title={title} />
      </div>
      <div role="status">
        {note === 'added-local' && (
          <PenNote className="mt-2.5">← נוסף להשוואה. היא נשמרת בדפדפן הזה, ואחרי התחברות תעבור לאזור שלכם.</PenNote>
        )}
        {note === 'added' && (
          <PenNote className="mt-2.5">
            ← נוסף להשוואה ולשמורים.{' '}
            <Link href="/me#compare" className="underline underline-offset-[3px]">
              לאזור שלי
            </Link>
          </PenNote>
        )}
        {note === 'full' && (
          <PenNote className="mt-2.5">
            ← בהשוואה כבר יש 3 קורסים.{' '}
            {account.status === 'signed-in' ? (
              <Link href="/me#compare" className="underline underline-offset-[3px]">
                להוציא אחד באזור שלי
              </Link>
            ) : (
              'אפשר להוציא קורס מהעמוד שלו.'
            )}
          </PenNote>
        )}
        {note === 'error' && <p className="mt-2.5 text-[13px] text-ink-soft">לא הצלחנו לעדכן את ההשוואה. נסו שוב.</p>}
      </div>
    </div>
  );
}
```

In `web/src/app/courses/[slug]/page.tsx`, replace:

```tsx
        <CourseActions slug={course.slug} />
```

with:

```tsx
        <CourseActions courseId={course.id} slug={course.slug} title={course.title} />
```

- [ ] **Step 5: "לשמור את התשובות" בדף הבית**

Create `web/src/components/account/save-answers.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { PenNote } from '@/components/course/marks';
import { loginHref, rememberForLogin, saveAnswers, useAccount } from '@/lib/account/store';
import { parseQuery, serializeQuery } from '@/lib/search/query';
import type { SearchQuery } from '@/lib/search/types';

const textButton =
  'inline-flex min-h-11 items-center font-sans text-[15px] font-semibold underline underline-offset-[3px] hover:text-link-hover';

/**
 * "לשמור את התשובות" מתחת לכפתור של דף הבית. התשובות נשמרות באותה צורה כמו בכתובת,
 * ו"התשובות שלי" באזור האישי קוראות אותן עם parseQuery.
 */
export function SaveAnswers({ query }: { query: SearchQuery }) {
  const account = useAccount();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const search = serializeQuery(query);
  // השוואה דרך parseQuery: המסד לא שומר את סדר המפתחות.
  const saved =
    account.status === 'signed-in' &&
    account.answers !== null &&
    serializeQuery(parseQuery(new URLSearchParams(account.answers.params))) === search;

  if (saved) {
    return (
      <PenNote className="mt-2.5">
        ← התשובות נשמרו.{' '}
        <Link href="/me#answers" className="underline underline-offset-[3px]">
          לאזור שלי
        </Link>
      </PenNote>
    );
  }

  async function onClick() {
    const params = Object.fromEntries(new URLSearchParams(search));
    if (account.status === 'signed-out') {
      rememberForLogin({ answers: params });
      router.push(loginHref());
      return;
    }
    if (account.status !== 'signed-in') return;
    setBusy(true);
    const result = await saveAnswers(params);
    setBusy(false);
    setFailed(result !== 'ok');
  }

  return (
    <p className="mt-1.5">
      <button type="button" disabled={busy} onClick={() => void onClick()} className={textButton}>
        לשמור את התשובות באזור שלי
      </button>
      {failed && (
        <span role="status" className="ms-2 font-sans text-[13px] text-ink-soft">
          לא הצלחנו לשמור. נסו שוב.
        </span>
      )}
    </p>
  );
}
```

In `web/src/components/notebook/notebook.tsx`, replace:

```tsx
import { Fragment, useCallback, useMemo, useRef, useState } from 'react';
import { buttonVariants } from '@/components/ui/button';
```

with:

```tsx
import { Fragment, useCallback, useMemo, useRef, useState } from 'react';
import { SaveAnswers } from '@/components/account/save-answers';
import { buttonVariants } from '@/components/ui/button';
```

Replace:

```tsx
  /** מוצג מתחת לטופס, בתוך קו השוליים. בדף הבית: "או" והמסלולים. */
  afterForm?: React.ReactNode;
}
```

with:

```tsx
  /** מוצג מתחת לטופס, בתוך קו השוליים. בדף הבית: "או" והמסלולים. */
  afterForm?: React.ReactNode;
  /** "לשמור את התשובות באזור שלי". רק בדף הבית: "התשובות שלי" הן המשפט מהבית (מסמך העיצוב, סעיף 5). */
  saveAnswers?: boolean;
}
```

Replace:

```tsx
  alwaysShowResults,
  afterForm,
  query,
  update,
}: NotebookProps & { query: SearchQuery; update?: Update }) {
```

with:

```tsx
  alwaysShowResults,
  afterForm,
  saveAnswers = false,
  query,
  update,
}: NotebookProps & { query: SearchQuery; update?: Update }) {
```

Replace:

```tsx
              {buttonLabel}
            </button>
```

with:

```tsx
              {buttonLabel}
            </button>
            {saveAnswers && activeLines(query).length > 0 && <SaveAnswers query={query} />}
```

In `web/src/app/page.tsx`, replace:

```tsx
      alwaysShowResults={false}
```

with:

```tsx
      alwaysShowResults={false}
      saveAnswers
```

- [ ] **Step 6: בנייה ובדיקות**

עוצרים כל שרת שרץ על פורט 3000, ואז:

```bash
cd web
pnpm lint && pnpm exec tsc --noEmit && pnpm test && pnpm build
pnpm e2e
```

Expected: הבנייה עוברת, ו-`/`, `/courses`, `/categories/[slug]`, `/courses/[slug]`, `/login` ו-`/me` עדיין סטטיים. `7 passed`.

- [ ] **Step 7: בדיקה כמבקר לא מחובר**

`pnpm start`, ברוחב 390, בחלון פרטי:
- [ ] **שורת תוצאה:** ב-`/?cat=cooking` בכל שורה יש "לשמור" עם ריבוע ריק, בסוף השורה. לחיצה עוברת ל-`/login?next=%2F%3Fcat%3Dcooking`.
- [ ] **עמוד הקורס:** ב-`/courses/baking-sample`, מתחת ל"כתיבת ביקורת" ו"להשוואה (עד 3)", מופיע "לשמור". "להשוואה (עד 3)" מקבל ריבוע עם וי בעט, ומתחת "← נוסף להשוואה. היא נשמרת בדפדפן הזה…". לחיצה נוספת מוציאה.
- [ ] **ההשוואה מלאה:** מוסיפים להשוואה גם את `italian-sample` ואת `photo-basics-sample`. ב-`full-stack-sample`: "← בהשוואה כבר יש 3 קורסים. אפשר להוציא קורס מהעמוד שלו."

- [ ] **Step 8: בדיקה אחרי התחברות**

באותו חלון:
- [ ] **בקשה שמחכה:** ב-`/courses/web-basics-sample` לוחצים "לשמור", ונכנסים דרך Mailpit. חוזרים לעמוד, ו"לשמור" כבר מסומן. שלושת הקורסים מההשוואה שבדפדפן (אפייה, איטלקי, צילום) עברו לחשבון, שמורים ובהשוואה.
- [ ] **תשובות:** ב-`/?cat=programming&why=switch&when=evening&how=online&max=15000`, מתחת לכפתור, "לשמור את התשובות באזור שלי". אחרי לחיצה: "← התשובות נשמרו. לאזור שלי" בעט.
- [ ] **שורה בלי תשובות:** בדף הבית בלי תשובות אין "לשמור את התשובות".

- [ ] **Step 9: בדיקה מול הציור, ברוחב טלפון**

פותחים את `http://localhost:3000/me`. משווים ל-`design/canvas/Me.dc.html`, ומסמנים כל סעיף:
- [ ] **ראש העמוד:** "האזור שלי", המשפט מתחתיו, וחמשת הקישורים, עם "שמורים (4)" ו"ההשוואה (3 מתוך 3)".
- [ ] **התשובות שלי:** "מהשאלות בדף הבית. שמרתם אותן ב-…", "אני רוצה ללמוד", ארבע שורות עם מספר ושאלה בשוליים והתשובות בעט ("תכנות", "כדי להחליף מקצוע,", "בערבים, אונליין,", "עד 15,000 ₪"), "← היום מתאימים …" בעט, והכפתור השחור "לחזור לרשימה". הכפתור מוביל לדף הבית עם אותן תשובות.
- [ ] **קורסים ששמרתי:** ארבע שורות, החדש ראשון, כמו בדף הבית אבל בלי העובדה המודגשת. בשוליים הערה בעט מול התשובות, כשיש מה לומר: ב"בניית אתרים מאפס" "← ערבים, אונליין, בתקציב". קורס ששתי שורות לא מתאימות לו (האפייה: רק בסופ״ש ורק בכיתה) בלי הערה. "להשוואה" עם וי בעט לשלושת הקורסים שבהשוואה, ו"להסיר מהשמורים". "להשוואה" על "בניית אתרים מאפס", כשההשוואה מלאה: "בהשוואה כבר יש 3 קורסים…".
- [ ] **ההשוואה שלי:** מסגרת שחורה, שלושה מקומות זה לצד זה, עם מספר, שם (קישור), ציון או "עוד אין ציון", מחיר ו"להוציא". "להוציא" משאיר מקום ריק במקומו, עם "מקום פנוי" ו"להוסיף מהשמורים". מתחת: "← עוד בבנייה" ו"לעמוד ההשוואה".
- [ ] **הסרה מהשמורים:** קורס שבהשוואה יוצא גם ממנה.
- [ ] **הביקורות שלי והחשבון:** כמו בציור.
- [ ] **מקלדת:** Tab עובר על כל הכפתורים, וטבעת הפוקוס נראית.
- [ ] **רוחב:** אין גלילה לרוחב, וכל פקד בגובה 44 לפחות.
- [ ] **קונסול:** אין שגיאות.

מראים לגל את "לשמור" בשורה ובעמוד הקורס, את "להשוואה (עד 3)" במצב מסומן, ואת "לשמור את התשובות" (החלטה 14). אם משהו לא תואם לציור או לא מאושר, מתקנים לפני הקומיט. בסוף מוחקים את החשבון מ"החשבון", ועוצרים את השרת.

- [ ] **Step 10: Commit**

```bash
cd ..
git add web/src/components/account/save-button.tsx web/src/components/account/save-answers.tsx web/src/components/notebook/results.tsx web/src/components/notebook/notebook.tsx web/src/components/course/course-actions.tsx "web/src/app/courses/[slug]/page.tsx" web/src/app/page.tsx
git commit -m "feat: ״לשמור״ ו״להשוואה״ בעמוד הקורס ובתוצאות, ושמירת התשובות מדף הבית"
```

---

### Task 8: מדיניות הפרטיות, ובדיקות מקצה לקצה

**Files:**
- Modify: `web/src/app/privacy/page.tsx` (הקובץ כולו)
- Create: `web/e2e/account.spec.ts`

- [ ] **Step 1: מדיניות הפרטיות, בהווה**

הטיוטה מתוכנית 2א כתבה "מה ייאסף כשתיפתח ההתחברות". עכשיו זה קורה, והעמוד צריך להגיד בדיוק מה נשמר: המייל, הקורסים השמורים (ומתוכם ההשוואה) והתשובות, כמו בעמוד ההתחברות.

Replace the whole content of `web/src/app/privacy/page.tsx` with:

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { TextPage } from '@/components/site/text-page';

export const metadata: Metadata = {
  title: 'מדיניות פרטיות (טיוטה) | [שם האתר]',
  description: 'מה האתר שומר כשמתחברים, ומה לא. טיוטה, לפני בדיקה של עורך דין.',
};

export default function PrivacyPage() {
  return (
    <TextPage title="מדיניות פרטיות" draft>
      <p>האתר עוד לא עלה לציבור, ומציג נתוני דוגמה. הטיוטה מתארת מה נאסף היום.</p>

      <h2>בלי להתחבר</h2>
      <ul>
        <li>
          התשובות שכותבים בדף הבית נשמרות בכתובת של הדף, כדי שאפשר יהיה לשתף רשימה. כל מי שמקבל את הקישור רואה
          אותן.
        </li>
        <li>
          מה שכותבים בשורה ״מה?״ נשלח לשרת שלנו, כדי להבין לאיזה תחום הוא שייך. כשהשירות של Anthropic פעיל, הטקסט
          עובר גם אליהם, רק לצורך ההבנה. אנחנו לא שומרים אותו, אלא אם שמרתם את התשובות באזור שלכם.
        </li>
        <li>
          כתובת ה-IP משמשת להגבלת מספר הבקשות לשירות ההבנה. היא נשמרת בזיכרון של השרת לדקה, ולא נכתבת למסד.
        </li>
        <li>
          ההשוואה (עד שלושה קורסים) נשמרת רק בדפדפן שלכם, עד שמתחברים. גם קורס או תשובות שביקשתם לשמור רגע לפני
          ההתחברות מחכים בדפדפן, ועוברים לחשבון מיד אחריה.
        </li>
      </ul>

      <h2>כשמתחברים</h2>
      <p>שומרים אצלנו רק שלושה דברים:</p>
      <ul>
        <li>כתובת המייל, כדי לשלוח קישור להתחברות, בלי סיסמה. המיילים נשלחים דרך Supabase.</li>
        <li>הקורסים ששמרתם, ומתוכם עד שלושה להשוואה.</li>
        <li>התשובות מדף הבית, אם בחרתם לשמור אותן.</li>
      </ul>
      <p>
        ההתחברות נשמרת בעוגייה בדפדפן שלכם, כדי שלא תצטרכו להתחבר בכל ביקור. Supabase, שמפעילה את ההתחברות,
        רושמת גם כל כניסה (מתי, מאיזו כתובת IP ובאיזה דפדפן), לצורכי אבטחה.
      </p>
      <p>אין לנו סיסמה, שם, טלפון או כל פרט אחר.</p>

      <h2>מחיקת החשבון</h2>
      <p>
        ב<Link href="/me#account">אזור שלכם</Link> יש ״למחוק את החשבון״. המחיקה מיידית: המייל, הקורסים ששמרתם,
        ההשוואה, התשובות ורישום הכניסות נמחקים, ואי אפשר לשחזר אותם. ביומני השרתים של Supabase הם נשארים עוד
        זמן קצר, ונמחקים שם מעצמם.
      </p>

      <h2>כשתיפתח כתיבת ביקורות</h2>
      <p>
        מי שכותב ביקורת יעלה הוכחה שלמד בקורס. ההוכחה נשמרת בתיקייה פרטית, ונמחקת מיד אחרי האימות, ולכל המאוחר
        אחרי 30 יום. הפרטים המלאים יתווספו לכאן לפני שהאפשרות תיפתח.
      </p>

      <h2>איפה המידע נמצא</h2>
      <p>המסד וההתחברות אצל Supabase, בשרתים בפרנקפורט. האתר מוגש דרך Vercel.</p>

      <h2>יצירת קשר</h2>
      <p>פרטי יצירת קשר בנושאי פרטיות יתווספו לפני ההשקה.</p>
    </TextPage>
  );
}
```

- [ ] **Step 2: הבדיקות**

Create `web/e2e/account.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

/** Mailpit של Supabase המקומי: כל מייל שנשלח נתפס שם (pnpm db:status, MAILPIT_URL). */
const MAILPIT = 'http://127.0.0.1:54324';

/** הקישור מהמייל האחרון שנשלח לכתובת, או '' אם עוד לא הגיע. */
async function magicLink(email: string): Promise<string> {
  const search = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${email}"`)}`);
  const { messages } = (await search.json()) as { messages: { ID: string }[] };
  if (messages.length === 0) return '';
  const message = (await (await fetch(`${MAILPIT}/api/v1/message/${messages[0].ID}`)).json()) as { Text: string };
  return message.Text.match(/http:\/\/127\.0\.0\.1:54321\/auth\/v1\/verify\?[^\s)]+/)?.[0] ?? '';
}

test('the personal area sends a signed-out visitor to log in', async ({ page }) => {
  await page.goto('/me');
  await expect(page).toHaveURL(/\/login\?next=%2Fme$/);
  await expect(page.getByRole('heading', { level: 1, name: 'להתחבר בלי סיסמה' })).toBeVisible();
});

test('a visitor logs in with the email link, and the course they saved is in the personal area', async ({ page }) => {
  const email = `e2e-${Date.now()}@example.com`;

  // לא מחובר: "לשמור" שולח להתחברות, וזוכר את הקורס.
  await page.goto('/courses/baking-sample');
  await page.getByRole('checkbox', { name: /^לשמור/ }).click();
  await expect(page).toHaveURL(/\/login\?next=%2Fcourses%2Fbaking-sample$/);

  await page.getByLabel('לאן לשלוח?').fill(email);
  await page.getByRole('button', { name: 'לשלוח לי קישור' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'עכשיו לתיבת המייל' })).toBeVisible();

  let link = '';
  await expect.poll(async () => (link = await magicLink(email)), { timeout: 15_000 }).not.toBe('');
  await page.goto(link);

  // חזרה לאותו עמוד, מחובר, והקורס כבר שמור.
  await expect(page).toHaveURL(/\/courses\/baking-sample$/);
  await expect(page.getByRole('checkbox', { name: /^לשמור/ })).toBeChecked();

  await page.getByRole('link', { name: 'האזור שלי' }).click();
  await expect(page.locator('#saved h3')).toHaveText(['אפייה ביתית: לחמים ועוגות']);
  await expect(page.getByText(email)).toBeVisible();

  // ניקוי: מחיקת החשבון, דרך שלב האישור.
  await page.getByRole('button', { name: 'למחוק את החשבון' }).click();
  await page.getByRole('button', { name: 'כן, למחוק הכול' }).click();
  await expect(page.getByText('החשבון נמחק.')).toBeVisible();
});
```

- [ ] **Step 3: להריץ**

עוצרים כל שרת שרץ על פורט 3000, ואז:

```bash
cd web
pnpm lint && pnpm exec tsc --noEmit && pnpm test
pnpm e2e
```

Expected: `9 passed`. הבדיקה השנייה עוברת דרך כל הזרימה: "לשמור" כשלא מחוברים, טופס ההתחברות, הקישור מ-Mailpit, החזרה לעמוד הקורס כשהקורס כבר שמור, "האזור שלי" ומחיקת החשבון.

אם הבדיקה נתקעת ב-`expect.poll` על המייל, בודקים ש-Mailpit עונה (`curl -s http://127.0.0.1:54324/api/v1/messages`). אם הקישור חוזר ל-`127.0.0.1:3000` ולא ל-`localhost:3000`, השינוי ב-`config.toml` (משימה 1, צעד 5) לא נכנס לתוקף: `pnpm db:stop` ו-`pnpm db:start`.

- [ ] **Step 4: המחיקה ניקתה גם את הרישום**

```bash
cd ..
pnpm exec supabase db query "select (select count(*) from auth.users where email like 'e2e-%') as users, (select count(*) from auth.audit_log_entries where payload::text like '%e2e-%@example.com%') as log_rows"
```

Expected: `0` ו-`0`.

- [ ] **Step 5: Commit**

```bash
git add web/src/app/privacy/page.tsx web/e2e/account.spec.ts
git commit -m "feat: מדיניות הפרטיות עם ההתחברות, ובדיקות קצה להתחברות ולאזור האישי"
```

---

### Task 9: הענן, הפריסה ותיעוד

**Files:**
- אין שינוי בקבצים במאגר בצעדים 1–9. הקובץ הזמני נכתב ל-`supabase/.temp/`, שלא נשמר ב-git.
- Modify: `docs/STATUS.md`
- Modify: `docs/superpowers/plans/notes-for-plan-2.md`
- Modify: קובץ הסשן של היום ב-`docs/sessions/`

**לפני שמתחילים:** הצעדים האלה משנים את המסד בענן, את הגדרות ההתחברות בענן ואת האתר באוויר. מוודאים עם גל שאפשר להתחיל, ושכל הבדיקות המקומיות ירוקות (`git status` נקי).

- [ ] **Step 1: מה ייכנס למסד בענן**

```bash
cd "C:/Users/galsa/Desktop/קורסים השוואות"
pnpm exec supabase db push --remote --dry-run
```

Expected: רק `20261114000001_user_lists.sql`. בלי `--include-seed`: אין נתונים חדשים בתוכנית הזו.

- [ ] **Step 2: להעלות את ה-migration**

```bash
pnpm exec supabase db push --remote --yes
```

Expected: `Applying migration 20261114000001_user_lists.sql...`, בלי שגיאות.

- [ ] **Step 3: לבדוק את המסד בענן**

```bash
pnpm exec supabase db query --remote --read-only "select (select count(*) from pg_policies where tablename in ('saved_courses', 'compare_items', 'user_answers')) as policies, has_table_privilege('anon', 'public.saved_courses', 'select') as anon_can_read, has_function_privilege('authenticated', 'public.forget_auth_log(uuid)', 'execute') as users_can_forget, has_table_privilege('postgres', 'auth.audit_log_entries', 'delete') as forget_works"
```

Expected: `9`, `false`, `false`, `true`. אם `forget_works` הוא `false`, הפונקציה לא תוכל למחוק את המייל מהרישום בענן. מספרים לגל לפני שממשיכים: מחיקת חשבון עדיין תעבוד, אבל המייל יישאר ברישום של Supabase, ומדיניות הפרטיות צריכה לומר את זה.

- [ ] **Step 4: עוצרים: הגדרות ההתחברות בענן מחכות לאישור של גל**

היום ה-Site URL בענן הוא `http://localhost:3000`, ורשימת כתובות החזרה ריקה (נבדק עם `config diff`, שרק קורא). בלי שינוי, הקישור במייל מהאתר באוויר יחזיר ל-localhost. זה שינוי בהגדרות של הפרויקט בענן, ולכן **לא מבצעים אותו בלי אישור מפורש של גל בצ'אט**. מציגים לו את שתי האפשרויות:

**אפשרות א, גל בלוח הבקרה:**
1. https://supabase.com/dashboard/project/bndxpogjvzhouoljiwrc/auth/url-configuration
2. **Site URL:** `https://course-compare-il.vercel.app`, ואז Save.
3. **Redirect URLs:** Add URL, `https://course-compare-il.vercel.app/auth/callback`, ואז Save.

**אפשרות ב, מהטרמינל, רק שני הערכים:**

לא מריצים `supabase config push` מהשורש: `supabase/config.toml` מכריז על ערכים מקומיים (Site URL של localhost, `max_frequency = "1s"`, `enable_confirmations = false`) שהיו דורסים את הענן. במקומו, תצורה של שתי שורות בתיקייה זמנית:

```bash
mkdir -p supabase/.temp/cloud-auth/supabase
cat > supabase/.temp/cloud-auth/supabase/config.toml <<'EOF'
# רק מה שמשנים בענן. כל מה שלא כתוב כאן נשאר בענן כמו שהוא.
project_id = "course-compare-il"

[auth]
site_url = "https://course-compare-il.vercel.app"
additional_redirect_urls = ["https://course-compare-il.vercel.app/auth/callback"]
EOF
pnpm exec supabase config diff --workdir supabase/.temp/cloud-auth --remote=bndxpogjvzhouoljiwrc
```

Expected (נבדק בזמן הכתיבה): `11 config differences found`. בדיוק שני שינויים עם `"class":"update"`: `auth.site_url` ו-`auth.additional_redirect_urls`. כל השאר `"class":"remote_only"`, עם `"declared":false`, כלומר נשארים בענן כמו שהם. אם יש עוד `"update"`, עוצרים ולא דוחפים.

רק אחרי "כן" של גל:

```bash
pnpm exec supabase config push --workdir supabase/.temp/cloud-auth --remote=bndxpogjvzhouoljiwrc --yes
pnpm exec supabase config diff --workdir supabase/.temp/cloud-auth --remote=bndxpogjvzhouoljiwrc
```

Expected: אחרי הדחיפה, ב-diff אין יותר `"update"`.

- [ ] **Step 5: המפתח הסודי ב-Vercel (גל)**

```bash
cd web
vercel env ls production
```

הפקודה מציגה רק שמות. אם `SUPABASE_SECRET_KEY` לא ברשימה, **גל מוסיף אותו בעצמו**: ב-Vercel, Project, Settings, Environment Variables, השם `SUPABASE_SECRET_KEY` לסביבת Production. את הערך הוא לוקח מ-Supabase: Project Settings, API Keys, Secret key. לא מדפיסים, לא מעתיקים ולא מבקשים את הערך. בלי המפתח הכול עובד חוץ ממחיקת חשבון, שמחזירה 503, והעמוד אומר שלא נמחק כלום.

- [ ] **Step 6: פריסה**

```bash
vercel deploy --prod
```

Expected: הבנייה ב-Vercel עוברת. `/login` ו-`/me` סטטיים, ו-`/auth/callback` ו-`/api/account/delete` דינמיים.

- [ ] **Step 7: לבדוק את האתר באוויר**

```bash
for p in / /login /me /privacy /courses/baking-sample /compare; do curl -s -o /dev/null -w "%{http_code} $p\n" "https://course-compare-il.vercel.app$p"; done
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" https://course-compare-il.vercel.app/auth/callback
curl -s -X POST -w " %{http_code}\n" https://course-compare-il.vercel.app/api/account/delete
curl -s -X POST -H "Origin: https://course-compare-il.vercel.app" -w " %{http_code}\n" https://course-compare-il.vercel.app/api/account/delete
```

Expected:
- `200` לכל העמודים.
- `303 https://course-compare-il.vercel.app/login?error=link&next=%2F`.
- `{"error":"forbidden"} 403`.
- `{"error":"signed_out"} 401`.

- [ ] **Step 8: גל בנייד**

שירות המייל המובנה של Supabase שולח רק למיילים של הצוות בארגון, וכמה מיילים בשעה בלבד. לכן רק גל בודק, עם המייל שלו. הוא מסמן:
- [ ] **התחברות:** ב-`https://course-compare-il.vercel.app/login` שולח קישור, ופותח אותו באותו טלפון ובאותו דפדפן. בפעם הראשונה המייל יכול להיות "Confirm your signup", כי בענן אישור הרשמה פעיל. הקישור מחזיר אותו מחובר, ובתפריט "האזור שלי".
- [ ] **מייל אחר:** מייל שאינו של הצוות מקבל "עד ההשקה אפשר להתחבר רק עם המיילים של צוות האתר."
- [ ] **שמירה:** "לשמור" על קורס, "להשוואה" על שניים, ושמירת התשובות מדף הבית. הכול מופיע ב"האזור שלי".
- [ ] **התנתקות:** "להתנתק" מחזיר לדף הבית.
- [ ] **מחיקה (אם גל רוצה):** מחיקת החשבון מציגה "החשבון נמחק". אפשר להתחבר מחדש, ונפתח חשבון חדש וריק. אחרי המחיקה, ב-Vercel, Logs, אין "Clearing the auth log failed".

אם הקישור מחזיר ל-`/login?error=link`, בודקים: נפתח באותו דפדפן? צעד 4 בוצע? הקישור בן פחות משעה?

**התיעוד:**

- [ ] **Step 9: `docs/STATUS.md`**

תחת "איפה אנחנו":
- **שלב:** תוכניות 1, 2א ו-2ב בוצעו, בענף `plan-1-foundation`.
- **באוויר:** מוסיפים לרשימה: "התחברות בקישור למייל, ו׳האזור שלי׳: התשובות מדף הבית, קורסים ששמרתי, השוואה של 3 קורסים, ומחיקת חשבון. עד סבב 6 רק מיילים של הצוות ב-Supabase יכולים להתחבר."
- **בדיקות:** מעדכנים למספרים מהריצה האחרונה: 30 בדיקות מסד, 58 בדיקות יחידה ו-9 בדיקות מקצה לקצה.

תחת "הצעדים הבאים", הסעיף הראשון: "תוכנית 2ג: יועץ הלימודים. לפניה: אישור של גל לציור Advisor בקנבס."

- [ ] **Step 10: הערות לתוכניות הבאות**

Append to `docs/superpowers/plans/notes-for-plan-2.md`:

```markdown
## מתוכנית 2ב

- **שירות המייל:** עד סבב 6 ההתחברות באוויר עובדת רק למיילים של הצוות ב-Supabase, וכמה מיילים בשעה בלבד. לפני ההשקה: SMTP אמיתי ודומיין, ואז לבדוק את הודעת `email_address_not_authorized` בטופס.
- **אישור הרשמה:** בענן `enable_confirmations` פעיל, ומקומית כבוי. משתמש חדש באוויר מקבל קודם "Confirm your signup". אם רוצים מייל אחד לכולם, לכבות בענן או לשנות את התבנית.
- **קורס שהוסר מהאתר:** האזור האישי מציג רק קורסים מהקטלוג. קורס שמור שיוסר ייעלם מהרשימה, ואם הוא בהשוואה, המקום שלו ייראה פנוי אבל יהיה תפוס. כשממשק הניהול (סבב 5) מסיר קורס, להוסיף שורה "הקורס כבר לא מוצע" עם "להסיר מהשמורים".
- **ההשוואה של מבקר לא מחובר:** נשמרת בדפדפן, ואין איפה לראות אותה עד ההתחברות. עמוד ההשוואה (סבב 4) יציג אותה גם בלי התחברות.
- **רגע של "התחברות" למשתמש מחובר:** הכותרת סטטית, ולכן "האזור שלי" מופיע רק אחרי שהדפדפן קרא את העוגייה.
- **בקשת שמירה שלא הושלמה:** מבקר שלחץ "לשמור" ולא התחבר, הבקשה נשארת בדפדפן ומתבצעת בהתחברות הבאה, גם אחרי ימים.
- **רישום הכניסות:** `forget_auth_log` מוחק את השורות של המשתמש מ-`auth.audit_log_entries` אחרי מחיקת חשבון. אם Supabase ישנו את מבנה הרישום (`actor_id`, `traits.user_id`), לבדוק שוב. יומני השרתים של Supabase, מחוץ למסד, נמחקים שם מעצמם: לבדוק עם עורך הדין שהניסוח במדיניות מספיק.
- **בדיקה 18 ב-pgTAP:** עכשיו רשימת מותרים. כל הרשאת כתיבה חדשה (למשל ביקורות בסבב 3) נכנסת לרשימה במפורש.
```

- [ ] **Step 11: קובץ הסשן**

ממלאים את "מה צריך לבדוק בסשן הבא": הבדיקה של גל בנייד (צעד 8), והאם `SUPABASE_SECRET_KEY` נוסף ב-Vercel.

- [ ] **Step 12: Commit**

```bash
git add docs
git commit -m "docs: מצב הפרויקט אחרי תוכנית 2ב"
```

לא דוחפים בלי אישור של גל.

---

## מה תוכנית 2ב לא כוללת (בכוונה)

- **התחברות עם Google** (סעיף 5): כשגל ייצור הרשאות ב-Google Cloud. בציור יש לה מקום מעל שורת המייל.
- **שירות מיילים אמיתי ודומיין:** סבב 6. עד אז, באוויר, רק מיילים של הצוות.
- **עמוד ההשוואה המלא:** סבב 4. `/compare` נשאר "בקרוב", וההשוואה שלי מקשרת אליו.
- **התוכן של "הביקורות שלי":** סבב 3.
- **יועץ הלימודים:** תוכנית 2ג.
- **שינוי מייל, CAPTCHA, והגבלת קצב משלנו להתחברות:** ההגבלות של Supabase מספיקות לבדיקות.
- **הצגת ההשוואה של מבקר לא מחובר:** אין עמוד שמציג אותה לפני ההתחברות (ראו ההערות).
- **סקירת סיום של Impeccable ו-`DESIGN.md`:** אחרי שכל עמודי סבב 2 קיימים. בתוכנית הזו יש בדיקה מול הציור ברוחב טלפון (משימות 5, 6 ו-7).

## בדיקה עצמית

**כיסוי של מסמך העיצוב ושל הבקשה:**

| דרישה | משימה |
|---|---|
| §5 התחברות ב-Supabase Auth, קישור למייל, בלי סיסמה | 2, 4, 5 |
| §5 שירות המייל המובנה, מוגבל, מספיק לבדיקות | 5 (הודעות), 9 |
| §5 "קורסים ששמרתי", "לשמור" בעמוד הקורס ובתוצאות | 3, 6, 7 |
| §5 "ההשוואה שלי": עד 3, עם קישור לעמוד "בקרוב" | 1, 3, 6, 7 |
| §5 "התשובות שלי": המשפט מהבית, וחזרה לרשימה בלחיצה | 3, 6, 7 |
| §5 "הביקורות שלי" בקרוב | 6 |
| §5 מחיקת החשבון מוחקת את כל הנתונים האישיים, עם שלב אישור | 1, 4, 6, 8 |
| §5 מבקר לא מחובר: ההשוואה בדפדפן, ועוברת לחשבון | 3, 7 |
| §5 שלוש הטבלאות, RLS לבעלים, הרשאות במפורש, בלי anon | 1 |
| §5 ו-§10 pgTAP לכל טבלה, ומגבלת 3 | 1 |
| §3 משתמש מחובר שומר את התשובות | 7 |
| §3א.1 "התחברות" בתפריט, ו"האזור שלי" כשמחוברים | 6 |
| §8 אותו עולם, לפי הציורים המאושרים, עט כחול על קו | 5, 6, 7 |
| §10 עמוד ההתחברות נטען, ובדיקת קצה להתחברות | 8 |
| `next` נבדק שהוא נתיב באתר | 2, 4 |
| מחיקה ב-POST עם בדיקת Origin, המפתח הסודי רק בשרת | 2, 4, 9 |
| מדיניות הפרטיות נכונה | 8 |
| `site_url` וכתובות חזרה מקומיות | 1 |
| הענן: migration, הגדרות התחברות באישור של גל, מפתח ב-Vercel, פריסה | 9 |

**מילים אסורות:** אין "TBD", "TODO", "להשלים אחר כך" או "כמו במשימה N". כל צעד שמשנה קוד מציג את הקוד.

**עקביות שמות בין המשימות:**
- `safeNextPath`, `NEXT_COOKIE`, `CALLBACK_PATH`: משימה 2. משמשים במשימות 4 ו-5.
- `createBrowserSupabase`, `createServerSupabase`, `createAdminClient`: משימה 2. משמשים במשימות 3, 4 ו-5.
- `MAX_COMPARE`, `CompareSlot`, `AnswerParams`, `LocalLists`, `EMPTY_LOCAL`, `toAnswerParams`, `parseLocal`, `firstFreePosition`, `mergeIntoAccount`: משימה 3 (`lists.ts`). `MAX_COMPARE` משמש גם במשימה 6.
- `AccountState`, `SavedAnswers`, `ListResult`, `useAccount`, `loginHref`, `rememberForLogin`, `toggleSaved`, `toggleCompare`, `saveAnswers`, `signOut(scope)`, `deleteAccount`: משימה 3 (`store.ts`). משמשים במשימות 5, 6 ו-7.
- `CourseSummary.id` ו-`CoursePageData.id`: משימה 3. משמשים במשימות 6 ו-7.
- `forget_auth_log(p_user_id uuid)`: משימה 1. משמש במשימה 4.
- `ChoiceChip({ checked?, pressed?, disabled?, onClick, children })` ו-`ResultRow({ result, highlight?, actions? })`: משימה 6. משמשים במשימות 6 ו-7.
- `MeSection({ id, title, sub?, className?, children })`, `marginNote`, `textButton`: משימה 6.
- `MyAnswers({ catalog, query, savedAt })`, `SavedCourses({ courses, inCompare, query })`, `CompareTray({ slots })`, `AccountSection({ email, onLeave })`, `MeArea({ catalog })`, `AccountLink({ className })`: משימה 6.
- `SaveButton({ courseId, title })`, `CourseActions({ courseId, slug, title })`, `SaveAnswers({ query })`, `NotebookProps.saveAnswers`: משימה 7.
- `LoginForm({ next, linkFailed })` ו-`LoginFromUrl`: משימה 5.

**אומת בזמן הכתיבה, בעותק של `web/` בתיקייה זמנית, בלי לגעת במאגר:**
- **הקוד:** כל קטעי הקוד בתוכנית הועתקו מהעותק הזה. הם עברו `tsc`, `eslint` ו-58 בדיקות יחידה, ו-`pnpm build`, שבו `/login` ו-`/me` סטטיים.
- **בדיקות הקצה:** 9 עברו מול Supabase המקומי (7 הקיימות ו-2 החדשות), כולל ההתחברות דרך Mailpit, השמירה שמחכה, האזור האישי ומחיקת החשבון. אחרי המחיקה לא נשארה במסד אף שורה של המשתמש, גם לא ברישום.
- **צילומי מסך:** ברוחב Pixel 7, של ההתחברות, "עכשיו לתיבת המייל", עמוד הקורס, דף הבית ו"האזור שלי", הושוו לציורים. שני דברים תוקנו בעקבותיהם: מייל ארוך שנכנס לעמודת הווי, והשעון שהתחיל ב-"0:60".
- **שני באגים שנמצאו בהרצה ותוקנו בקוד שכאן:** הפניה מוחלטת בנתיב החזרה, שהעבירה את הדפדפן ל-host אחר (החלטה 5). והתנתקות שקרתה לפני שהאזור ידע על המחיקה, ושלחה להתחברות במקום "החשבון נמחק".
- **המסד:** ה-migration וקבצי הבדיקה רצו על המסד המקומי בתוך טרנזקציה שבוטלה. 30 בדיקות עברו. בדיקה 18 הישנה נכשלת כשהטבלאות קיימות, כצפוי. שלוש בדיקות הבעלות נכשלות כשמדיניות הקריאה היא `using (true)`.
- **מה נוצר זמנית במסד המקומי:** לבדיקות הקצה, הטבלאות והפונקציה נוצרו ונמחקו אחר כך, יחד עם המשתמשים והמיילים של הבדיקה. שרת הבדיקה רץ על `127.0.0.1:3100`, שמתאים ל-Site URL המקומי הנוכחי, בלי לשנות את `config.toml`.
- **הענן:** `config diff` רץ לקריאה בלבד.
- **לא נבדק:**
  - ה-Site URL המקומי החדש (`localhost`, משימה 1, צעד 6) עם `pnpm e2e` הרגיל.
  - `config push` לענן.
  - הזרימה עם "Confirm your signup" בענן.
  - ההרשאה של `postgres` על `auth.audit_log_entries` בענן (משימה 9, צעד 3).
