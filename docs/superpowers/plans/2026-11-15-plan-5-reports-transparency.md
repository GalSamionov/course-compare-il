# תוכנית 5ג: דיווחים, יומן פעולות, מספרי שקיפות ורענון מטמון

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** כל אחד מדווח על ביקורת בלי חשבון, והיא נשארת באתר. גל מחליט ב-`/admin` (להשאיר, להסתיר עד בירור, או להסיר עם נימוק), ומצרף תגובת מוסד. כל החלטה ב-`audit_log`, שמוצג ב-`/admin/log`. מספרי שקיפות חודשיים בעמוד השיטה וב"מי משלם לנו". החישוב הלילי מרענן את הדפים מיד, דרך `POST /api/revalidate`.

**Architecture:**
- **מיגרציה אחת חדשה:** `20261115230001_reports_and_transparency.sql`. בתוכה:
  - הטבלה `reports`, סגורה לציבור;
  - ארבע פונקציות ל-service_role: `submit_review_report`, `decide_review_reports`, `set_vendor_response` ו-`purge_reports`;
  - חמש פעולות חדשות ב-`audit_log`;
  - `transparency_by_month`: `security definer`, פתוחה לאורח, ומחזירה רק ספירות.
- **הדיווח הציבורי:** פעולת שרת עם המפתח הסודי, כמו הטופס של מוסד (`app/institutions/join/actions.ts`). טביעה של כתובת ה-IP (HMAC) למגבלת הקצב, שנבדקת במסד.
- **ההחלטות של גל:** פעולות שרת ב-`app/admin/report-actions.ts`, עם `requireAdmin`. כל הכתיבה והיומן בתוך פונקציה במסד, בטרנזקציה אחת. אחריהן: חישוב מחדש של הציונים, ו-`updateTag` לכל עמוד קורס שחושב ולקטלוג.
- **הרענון מבחוץ:** נתיב API עם טוקן, שמריץ `revalidateTag(tag, { expire: 0 })`. הסקריפט של הציונים קורא לו בסוף. הלוגיקה בפונקציות טהורות עם בדיקות יחידה.
- **המספרים:** `getTransparency()` במטמון (`cacheLife('hours')`, התגית `transparency`). שני העמודים נשארים סטטיים.

**Tech Stack:** Next.js 16.4.6 (Cache Components, `ensureStatic`, `use cache`, `cacheTag`, `updateTag`, `revalidateTag`, Server Actions עם `useActionState`, Route Handlers), React 19.3, TypeScript, Tailwind CSS v4, shadcn/ui, Supabase (Postgres, RLS, PostgREST, pgTAP), Vitest, Playwright, GitHub Actions, pnpm.

**מקור:**
- מסמך העיצוב: `docs/superpowers/specs/2026-11-15-round-5-reports-transparency-design.md`. הוא המקור. במקום שהוא שותק: `docs/superpowers/specs/2026-11-13-course-comparison-part1-design.md`, סעיפים 6 ו-10.
- `docs/ROADMAP.md`, פריטים 32, 33 ו-36.
- התור של הקורסים, שהסבב הזה בנוי עליו: `docs/superpowers/plans/2026-11-15-plan-5b-course-queue.md` ו-`supabase/migrations/20261115210001_course_queue_admin.sql`.
- שפת העיצוב: `DESIGN.md`. חוזה התור: `.impeccable/surfaces/web-src-app-admin-page-tsx.md`.
- `web/AGENTS.md`: לפני שימוש ב-API של Next קוראים את המדריך שלו ב-`web/node_modules/next/dist/docs/`. ההחלטות על Next כאן מצטטות את הקובץ שממנו הן באות.

---

## איך עובדים בתוכנית הזו

- **תיקייה:** כל הפקודות רצות מ-`C:/Users/galsa/Desktop/קורסים השוואות`, ב-Git Bash. בנתיב יש אותיות עבריות, ולכן תמיד במירכאות. פקודות של האתר: `pnpm --dir web ...`.
- **ענף:** `plan-1-foundation`. פריסות יוצאות רק ממנו (`docs/STATUS.md`).
- **התוכנית מתחילה אחרי שהענף של התור (`claude/upbeat-carson-94b71e`) מוזג ל-`plan-1-foundation`.** משימה 1 בודקת את זה, ועוצרת אם לא.
- **המסד לפיתוח רץ על הרספברי פיי, דרך מנהרת SSH (`README.md`). אין Docker במחשב.**
  - **הפעלה:** `pnpm db:start`. אחרי אתחול של המחשב: `pnpm db:tunnel`.
  - **שאר הפקודות:** `pnpm db:reset`, `pnpm db:test`, `pnpm db:types` ו-`pnpm db:migrate` מעתיקות את `supabase/` מתיקיית העבודה לפיי, כולל קבצים שעוד לא נשמרו ב-git, ומריצות שם.
  - **אחרי `pnpm db:reset`,** לפני בדיקות קצה: `pnpm --dir web score:recompute`. אחרת אין ציונים, וחמש בדיקות קצה קיימות נכשלות.
  - **המסד בפיי משותף לכל הסשנים.** האיפוס בונה אותו מחדש מהענף הנוכחי. אחרי המיזוג של התור, זה מה שרוצים.
- **סודות:**
  - `web/.env.local` כבר מכיל את המפתחות המקומיים. לא מדפיסים אותו, לא מעתיקים ממנו ולא מכניסים ל-git.
  - **`REVALIDATE_TOKEN` של האתר באוויר:** גל יוצר אותו ומוסיף אותו בעצמו. לא מודפס, לא נכתב לקובץ ולא נכנס ל-git.
  - לבדיקה מקומית של הנתיב יוצרים טוקן זמני, אחר, בקובץ ב-`web/test-results/` (שלא נשמר ב-git), ומוחקים אחרי הבדיקה.
- **בדיקות, במינימום (בקשה של גל: "לא להגזים בבדיקות ובסבבי סקירה, לקדם את המוצר שרואים"):**
  - **pgTAP:** לכל טבלה, פונקציה והרשאה חדשה (משימות 2 ו-3).
  - **בדיקות יחידה:** ללוגיקה טהורה (משימות 4 ו-5).
  - **בדיקות קצה:** אחת לדיווח (משימה 6), ואחת להחלטה של גל (משימה 7).
- **סקירה:**
  - **אבטחה:** סבב אחד, על הדיווח הציבורי ועל נתיב הרענון (משימה 11).
  - **עיצוב:** הממשק עובר את סקירת הסיום של Impeccable, סבב אחד (משימה 12).
- **כל משימה מסתיימת ירוקה:**
  - **תמיד:** `pnpm --dir web lint`, `pnpm --dir web exec tsc --noEmit` ו-`pnpm --dir web test`.
  - **משימות מסד:** גם `pnpm db:test`.
  - **משימות ממשק:** גם `pnpm --dir web build`, ובדיקת הקצה של המשימה.
- **שרת התצוגה רץ עם `next start`.** לפני כל בדיקה בדפדפן בונים מחדש (`pnpm --dir web build`), ואז `pnpm --dir web start` בטרמינל נפרד. אחרת רואים את הבנייה הקודמת.
- **בדיקות קצה:** `playwright.config.ts` משתמש בשרת קיים על פורט 3000 אם יש כזה. לפני `pnpm --dir web e2e` עוצרים כל שרת על 3000, כדי שהבדיקה תבנה את הקוד החדש. הבדיקות רצות כ-Pixel 7 (נייד).
- **עיצוב: כל משימת ממשק (6, 7, 8, 9 ו-10) עוברת דרך Impeccable.** הצעד הראשון בכל אחת קבוע, וכתוב מחדש בכל משימה כדי שאפשר יהיה לקרוא אותה לבד:
  1. טוענים את ה-skill `/impeccable`. אם `.claude/skills/impeccable` חסרה: `npx impeccable install` מתיקיית הפרויקט.
  2. כותבים או מעדכנים את חוזה העיצוב של המשטח (`impeccable surface-brief write`), כשהמשימה אומרת.
  3. `.claude/skills/impeccable/scripts/impeccable context --target <הקובץ>`. ב-PowerShell או ב-cmd: `.claude\skills\impeccable\scripts\impeccable.cmd context --target <הקובץ>`. ממלאים את ההוראות שהפקודה מדפיסה, ולא מריצים אותה שוב.
  4. קוראים את `.claude/skills/impeccable/reference/craft-floor.md` לפני כל עריכת ממשק, ואת קובץ המצב (`mode-operate.md` או `mode-read.md`) שהמשימה אומרת.
  5. **`DESIGN.md` גובר:**
     - IBM Plex Sans Hebrew לכל הדיו, ו-Rubik בכחול לעט, שהוא הקול היחיד של האתר.
     - צבע מסמן מקור בלבד: ירוק נבדק מול מסמך, צהוב בוגרים, ורוד חולשה, קו כחול טענה של המוסד, ופתק כחול רק ל"תגובת המוסד".
     - כפתור, הודעה, שגיאה או מספר שקיפות לא מקבלים צבע מקור, מרקר או פתק.
     - בלי אייקוני גליף: כל סימן מצויר ב-SVG.
     - אף פעם לא ממשק גנרי. shadcn/ui הוא הבסיס לרכיבים (`buttonVariants`), ובממשק הניהול הפקדים מ-`web/src/components/admin/controls.ts`.
  6. **תנועה:** רק אבני הבניין שכבר קיימות, בלי JavaScript חדש. `MotionObserver` (`web/src/components/site/motion-observer.tsx`) מפעיל אותן:
     - `.pen-rule` מתחת לכותרת (ב-`.text-page` זה אוטומטי ב-`h2`);
     - `PenNote` (`data-anim="write"`);
     - שורה ברשימה: `data-anim="ink"`;
     - שורות בטבלה של עמוד טקסט מופיעות לבד.
  7. קודם לנייד, ברוחב 390. כל פקד לפחות 44 פיקסלים. אין גלילה לרוחב.

  הקוד בכל משימת ממשק הוא נקודת התחלה שעובדת. Impeccable משפר אותו בתוך העולם, ולא מחליף את ההתנהגות: אותם שמות של כפתורים, תוויות, `id` ו-`aria-label`, כי בדיקות הקצה מחפשות אותם.
- **תיעוד סשן:** לפי `CLAUDE.md`, בקובץ `docs/sessions/2026-11-15-round-5.md` (קיים). שורה אחרי כל קומיט ובדיקה, עם הסטטוס הכן (נבדק / נכתב, לא נבדק / לא הושלם).
- **קומיטים:** כל commit מסתיים בשורת ה-Co-Authored-By מההוראות של הסשן.
- **לוכסן הפוך:** קוד עם `\` (ביטויים רגולריים ב-SQL וב-TypeScript) נכתב עם כלי עריכת קבצים, לא עם heredoc ב-bash.

## החלטות שהתוכנית נשענת עליהן

1. **אין טבלת `reports` במיגרציות.** נבדק ב-15.11: `grep -n "create table" supabase/migrations/*.sql`. היא מתוכננת רק במסמך של חלק 1, סעיף 4. לכן מיגרציה חדשה, אחרי `20261115210001_course_queue_admin.sql`.
2. **היומן כבר מוכן לשורות בלי ביקורת:**
   - `20261115210001` הוסיפה `audit_log_one_target`: בכל שורה יעד אחד בדיוק.
   - פעולה שאינה של קורס או של בקשה חייבת `review_id`.
   - כל חמש הפעולות החדשות הן על ביקורת. לכן משנים רק את רשימת הפעולות (`audit_log_action_check`), ומעתיקים את כל הקיימות כמו שהן.
3. **הסתרה עד בירור היא `status = 'disputed'`.**
   - הערך קיים ב-`review_status` מתוכנית 1.
   - המדיניות הציבורית מראה רק `published`.
   - `recomputeAllScores` קורא רק `published`.
   - לכן ביקורת מוסתרת יורדת מהאתר ומהציון בלי שום הרשאה חדשה.
   - `disputed_at` (מסבב 3) מסמן "יש דיווח פתוח", כשהביקורת עדיין `published`. הוא לא עמודה ציבורית: `rls.test.sql` כבר בודק את זה.
4. **הסרה היא `status = 'removed'`,** עם `decision_note` לכותב. `my_reviews()` כבר מחזירה את `decision_note`, ולכן "הביקורות שלי" רק צריך להציג אותו.
5. **הכתיבה הציבורית דרך פעולת שרת, לא RPC פתוח:**
   - **למה:** במסד אי אפשר לדעת את כתובת ה-IP האמיתית (סשן התור, החלטה 2).
   - **הטביעה:** `createHmac('sha256', SUPABASE_SECRET_KEY)` על `review-report:<ip>`. אותו דפוס כמו `submitJoinRequest`, עם קידומת אחרת, כדי שהטביעות של שני הטפסים לא יהיו זהות.
   - **CSRF:** Next משווה Origin ל-Host בכל Server Action (`server-actions.md`, "CSRF check").
6. **מגבלת הקצב במסד, עם נעילה אחת** (`pg_advisory_xact_lock(hashtext('public.reports'))`), כמו `submit_institution_request`. כפילות נבדקת לפני המגבלה, כדי שלחיצה כפולה לא תספור פעמיים.
7. **ההחלטה סוגרת את כל הדיווחים הפתוחים של הביקורת.**
   - `decide_review_reports` נועלת את הביקורת (`for update`) ובודקת את המצב בעצמה.
   - שתי לשוניות לא יכולות להסתיר ולהסיר יחד.
8. **ביומן רק קודים ומזהים:**
   - **מה כן:** `reports` (מספרי הדיווחים), `reason` ו-`was_hidden`.
   - **מה לא:** הטקסט של המדווח ושל גל, ב-`audit_log` או ב-`details`.
   - **למה:** היומן לא נמחק (`audit_log_append_only`).
9. **אחרי כל חישוב ציונים בפעולה, כל עמוד קורס שחושב מתרענן:**
   - `recomputeAllScores` מחזיר עכשיו גם `slugs`.
   - `refreshCourses(slugs)` מריץ `updateTag` לכל אחד ול-`catalog`. לפי `updateTag.md`, רק בתוך Server Action.
   - בנתיב API (`api/reviews/delete`): `revalidateTag(tag, { expire: 0 })`.
10. **`revalidateTag(tag, { expire: 0 })` בנתיב הרענון:**
    - `revalidateTag.md`: "When the invalidation comes from outside a Server Action... Pass `{ expire: 0 }` to expire the data immediately".
    - הצורה בלי פרופיל deprecated.
    - `updateTag` לא זמין ב-Route Handler (`updateTag.md`).
11. **השוואת הטוקן בזמן קבוע:**
    - SHA-256 של שני הצדדים, ואז `timingSafeEqual`. כך גם האורך לא דולף.
    - טוקן בשרת קצר מ-32 תווים: הנתיב סגור (503), כדי שטעות בהגדרה לא תפתח אותו.
    - הטוקן נבדק לפני שקוראים את הגוף.
12. **`revalidateTarget` לא שולח רענון מסביבה אחת לאחרת:** מסד מקומי ואתר באוויר, או להפך. בלי `REVALIDATE_URL` הסקריפט מדלג, גם אם יש טוקן. כך `pnpm --dir web score:recompute` מקומי לא נוגע באתר.
13. **המספרים רק מחודשים שנגמרו, בשעון ישראל, ורק לכל האתר יחד:**
    - בתוך הפונקציה: `date_trunc('month', <זמן> at time zone 'Asia/Jerusalem')`.
    - עד 12 חודשים, ומהחודש הראשון שיש בו פעולה.
    - הפונקציה לא מקבלת שום סינון חוץ ממספר החודשים.
14. **`getTransparency()` קוראת עם המפתח הציבורי** (`createPublicClient`, כמו `getMethodData`), דרך `transparency_by_month`. לכן הפונקציה פתוחה לאורח. היא `security definer` עם `search_path = ''`, וכל טבלה בה מלאה בשם הסכמה.
15. **תגובת מוסד מתוך פריט בתור הדיווחים בלבד** (מסמך העיצוב, סעיף 2). לכן אין צורך בקריאה של מזהה ביקורת מקישור.
    - **העוגן `#review-<id>` בכל זאת נוסף לכל ביקורת:** התור מקשר אליו, ובדיקות הקצה מוצאות לפיו את הביקורת.
16. **בלי Zod ובלי תלויות חדשות.**

## איפה המקורות לא מסכימים, ומה הוחלט

1. **"מי דיווח (אנונימי, מוסד או משתמש)"** (מסמך חלק 1, סעיף 4) מול "no account required" (הבקשה). לא נשמרת זהות בכלל, רק טביעה של כתובת ל-48 שעות. פרטיות גוברת (מסמך העיצוב, סעיף 2).
2. **"החודש פרסמנו 12 ביקורות"** (פריט 33) מול "Small numbers should not leak individuals" (הבקשה). רק חודשים שנגמרו, והמשפט על החודש האחרון שנגמר.
3. **"העלאת תגובת מוסד" כחלק נפרד בממשק** (מסמך חלק 1, סעיף 10) מול "if it fits cleanly" (הבקשה). בתוך פריט בתור הדיווחים, כי שם גל כבר מסתכל על ביקורת מסוימת.
4. **"calls `revalidateTag` for `catalog` and `course:<slug>`"** (הבקשה). גם `transparency`, כי בלי זה המספרים מחכים שעה אחרי תחילת חודש.
5. **"after a course is published or changed"** (פריט 36). החלטות בתור של הקורסים כבר מרעננות (`course-actions.ts`, מהסשן של התור). שינוי שהאוסף העלה לבד לא מחובר בסבב הזה (מסמך העיצוב, סעיף 2).

## מבנה הקבצים בתוכנית הזו

```
supabase/migrations/20261115230001_reports_and_transparency.sql   # חדש: reports, 5 פונקציות, היומן
supabase/tests/reports.test.sql                                    # חדש: 41 בדיקות
supabase/tests/transparency.test.sql                               # חדש: 8 בדיקות
web/src/lib/database.types.ts                                      # נוצר מחדש (pnpm db:types)
web/src/lib/reports/reasons.ts                                     # חדש: הסיבות, קריאת הטופס, הנימוק לכותב
web/src/lib/reports/reasons.test.ts                                # 3 בדיקות
web/src/lib/reports/group.ts                                       # חדש: groupReports (טהור)
web/src/lib/reports/group.test.ts                                  # 2 בדיקות
web/src/lib/reports/queue.ts                                       # חדש: loadReportQueue (server-only)
web/src/lib/admin/audit.ts                                         # חדש: השורות ביומן (טהור)
web/src/lib/admin/audit.test.ts                                    # 2 בדיקות
web/src/lib/admin/audit-log.ts                                     # חדש: loadAuditLog (server-only)
web/src/lib/transparency/numbers.ts                                # חדש: המשפט, השורות, המיפוי
web/src/lib/transparency/numbers.test.ts                           # 2 בדיקות
web/src/lib/data/transparency.ts                                   # חדש: getTransparency (במטמון)
web/src/lib/cache/revalidate.ts                                    # חדש: tagsFromBody, tokenMatches, bearerToken
web/src/lib/cache/revalidate.test.ts                               # 4 בדיקות
web/src/lib/cache/revalidate-client.ts                             # חדש: revalidateTarget, requestRevalidation
web/src/lib/cache/revalidate-client.test.ts                        # 3 בדיקות
web/src/lib/cache/refresh.ts                                       # חדש: refreshCourses (server-only)
web/src/lib/score/recompute.ts                                     # slugs בתוצאה
web/src/app/api/revalidate/route.ts                                # חדש: POST /api/revalidate
web/src/app/api/reviews/delete/route.ts                            # רענון של כל הקורסים שחושבו
web/src/app/admin/actions.ts                                       # approveReview: refreshCourses
web/scripts/recompute-scores.ts                                    # רענון בסוף
.github/workflows/scores-nightly.yml                               # REVALIDATE_URL, REVALIDATE_TOKEN
web/.env.example                                                   # שני המשתנים, עם הסבר
web/src/app/courses/[slug]/report-actions.ts                       # חדש: reportReview (Server Action)
web/src/components/course/report-review.tsx                        # חדש: "לדווח" והטופס
web/src/components/course/reviews-section.tsx                      # "לדווח" ליד "עזר לי"
web/src/components/course/read-tracker.tsx                         # העוגן #review-<id>
web/e2e/report.spec.ts                                             # חדש: בדיקת קצה אחת
web/src/app/admin/report-actions.ts                                # חדש: decideReports, saveVendorResponse
web/src/components/admin/report-queue-item.tsx                     # חדש: פריט בתור הדיווחים
web/src/components/admin/report-decide-form.tsx                    # חדש: להשאיר, להסתיר, להסיר
web/src/components/admin/vendor-response-form.tsx                  # חדש: תגובת מוסד
web/src/app/admin/page.tsx                                         # התור הרביעי, והקישור ליומן
web/e2e/report-decision.spec.ts                                    # חדש: בדיקת קצה אחת
web/src/components/admin/audit-log-list.tsx                        # חדש: השורות ביומן
web/src/app/admin/log/page.tsx                                     # חדש: /admin/log
web/src/components/account/my-reviews.tsx                         # "מוסתרת", ו"הוסרה" עם הנימוק
web/src/app/privacy/page.tsx                                       # "כשמדווחים על ביקורת"
web/src/lib/reviews/cleanup.ts, web/scripts/cleanup-proofs.ts      # purge_reports
web/src/components/transparency/transparency-numbers.tsx           # חדש: המשפט, הטבלה וההערה
web/src/app/method/page.tsx                                        # "האימות במספרים", "כשמדווחים על ביקורת"
web/src/app/who-pays-us/page.tsx                                   # המשפט, וקישור
.impeccable/surfaces/*.md                                          # שני חוזים חדשים, וחוזה התור מעודכן
DESIGN.md, .impeccable/design.json                                 # אחרי סקירת הסיום
docs/STATUS.md, docs/ROADMAP.md, docs/superpowers/plans/notes-for-plan-2.md, docs/sessions/2026-11-15-round-5.md
```

---

### Task 1: נקודת ההתחלה: התור של הקורסים מוזג, והכול ירוק

**Files:**
- אין שינוי בקוד.
- Modify: `docs/sessions/2026-11-15-round-5.md` (שורת מצב)

- [ ] **Step 1: הענף של התור מוזג**

```bash
cd "C:/Users/galsa/Desktop/קורסים השוואות"
git branch --show-current
git merge-base --is-ancestor claude/upbeat-carson-94b71e plan-1-foundation && echo merged
ls supabase/migrations/20261115210001_course_queue_admin.sql web/src/app/admin/course-actions.ts web/src/components/admin/controls.ts
grep -n "updateTag" web/src/app/admin/course-actions.ts
git status --short
```

Expected:
- `plan-1-foundation`, ואז `merged`.
- שלושת הקבצים קיימים.
- ב-`course-actions.ts` שתי שורות: `updateTag(\`course:${course.slug}\`)` ו-`updateTag('catalog')`. כך החלק של פריט 36 שנוגע לקורס שפורסם או השתנה בתור כבר עובד.
- `git status` נקי, חוץ מקובץ הסשן.

**אם הענף לא מוזג:** עוצרים. כותבים לגל שהתוכנית מתחילה רק אחרי המיזוג של `claude/upbeat-carson-94b71e`, ולא ממשיכים.

- [ ] **Step 2: המסד בפיי, מהענף הנוכחי**

```bash
pnpm db:status || pnpm db:start
pnpm db:reset
pnpm db:test
```

Expected:
- `db:reset` מסתיים בלי שגיאה. כל המיגרציות, כולל `20261115210001`, וה-seed.
- `db:test` עובר כולו. רושמים את המספר בקובץ הסשן: זה הבסיס. אחרי המיזוג של התור צפויות בערך 132.

- [ ] **Step 3: הטיפוסים, הציונים והאתר**

```bash
pnpm db:types
git diff --stat web/src/lib/database.types.ts
pnpm --dir web score:recompute
pnpm --dir web lint && pnpm --dir web exec tsc --noEmit && pnpm --dir web test
```

Expected:
- `git diff` לא מראה שינוי. הסשן של התור כבר יצר את הטיפוסים.
- `score:recompute` מדפיס שורה לכל קורס, בלי `failed`.
- lint, tsc ובדיקות היחידה עוברים. רושמים את מספר בדיקות היחידה בקובץ הסשן.

אם `db:types` כן משנה משהו: זה שינוי של הסשן הקודם. שומרים אותו ב-commit נפרד, `chore: הטיפוסים של המסד אחרי המיזוג של התור`.

- [ ] **Step 4: שורה בקובץ הסשן**

ב-`docs/sessions/2026-11-15-round-5.md`, תחת "מה נעשה": "נקודת התחלה: התור מוזג (`<sha של HEAD>`), N בדיקות מסד ו-M בדיקות יחידה עוברות. נבדק."

---

### Task 2: המסד: דיווחים, ההחלטות של גל ותגובת מוסד (TDD)

**Files:**
- Create: `supabase/tests/reports.test.sql`
- Create: `supabase/migrations/20261115230001_reports_and_transparency.sql` (סעיפים 1–6. סעיף 7 במשימה 3)

- [ ] **Step 1: הבדיקות**

Create `supabase/tests/reports.test.sql`:

```sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(41);

-- תוכנית 5ג: דיווח על ביקורת, ההחלטות של גל, תגובת מוסד והניקוי (20261115230001_reports_and_transparency.sql).
-- נתוני בדיקה, כ-postgres. כל שאילתה מוגבלת לנתונים האלה: המסד בפיי משותף, ויכולים להיות בו דיווחים אחרים.
insert into auth.users (id, email) values
  ('77777777-0000-0000-0000-00000000000a', 'rp-admin@example.test'),
  ('77777777-0000-0000-0000-00000000000b', 'rp-user@example.test');
insert into admins (user_id) values ('77777777-0000-0000-0000-00000000000a');
insert into categories (id, slug, name, course_type)
values ('77777777-0000-0000-0000-000000000001', 'rp-cat', 'תחום בדיקה', 'career');
insert into institutions (id, slug, name, kind)
values ('77777777-0000-0000-0000-000000000002', 'rp-inst', 'מוסד בדיקה', 'school');
insert into courses (id, slug, institution_id, category_id, title, status) values
  ('77777777-0000-0000-0000-000000000003', 'rp-course', '77777777-0000-0000-0000-000000000002',
   '77777777-0000-0000-0000-000000000001', 'קורס בדיקה', 'active');
-- c1, c2, c3 פורסמו. c4 ממתינה לבדיקה, ולכן לא מוצגת באתר.
insert into reviews (id, course_id, author_id, cohort_month, body, display_name, status, proof_kind, verified_at, published_at, submitted_at)
select v.id::uuid, '77777777-0000-0000-0000-000000000003', '77777777-0000-0000-0000-00000000000b', v.month::date,
       repeat('ביקורת לבדיקה. ', 8), 'בוגר בדיקה', v.status::review_status,
       case when v.status = 'published' then 'invoice'::proof_kind end,
       case when v.status = 'published' then now() end,
       case when v.status = 'published' then now() end,
       now()
from (values
  ('77777777-0000-0000-0000-0000000000c1', '2026-01-01', 'published'),
  ('77777777-0000-0000-0000-0000000000c2', '2026-02-01', 'published'),
  ('77777777-0000-0000-0000-0000000000c3', '2026-03-01', 'published'),
  ('77777777-0000-0000-0000-0000000000c4', '2026-04-01', 'pending')
) as v(id, month, status);

-- ===== הציבור: לא רואה ולא כותב =====

select ok(
  not has_table_privilege('anon', 'public.reports', 'SELECT')
  and not has_table_privilege('authenticated', 'public.reports', 'SELECT')
  and not has_table_privilege('anon', 'public.reports', 'INSERT')
  and not has_table_privilege('authenticated', 'public.reports', 'INSERT')
  and not has_table_privilege('authenticated', 'public.reports', 'UPDATE')
  and not has_table_privilege('anon', 'public.reports', 'DELETE'),
  'הדיווחים סגורים לאורח ולמשתמש מחובר'
);
select ok(
  not has_function_privilege('anon', 'public.submit_review_report(uuid, text, text, text)', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.submit_review_report(uuid, text, text, text)', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.decide_review_reports(uuid, uuid, text, text, text)', 'EXECUTE')
  and not has_function_privilege('anon', 'public.set_vendor_response(uuid, uuid, text)', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.purge_reports()', 'EXECUTE')
  and has_function_privilege('service_role', 'public.submit_review_report(uuid, text, text, text)', 'EXECUTE')
  and has_function_privilege('service_role', 'public.decide_review_reports(uuid, uuid, text, text, text)', 'EXECUTE')
  and has_function_privilege('service_role', 'public.set_vendor_response(uuid, uuid, text)', 'EXECUTE'),
  'רק service_role מריץ את הפונקציות שכותבות'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "77777777-0000-0000-0000-00000000000b", "role": "authenticated"}', true);
select throws_ok($$select count(*) from reports$$, '42501', null, 'משתמש מחובר לא רואה דיווחים');
select throws_ok(
  $$select submit_review_report('77777777-0000-0000-0000-0000000000c1', 'privacy', repeat('a', 64))$$,
  '42501', null, 'משתמש מחובר לא מדווח ישירות, רק דרך השרת'
);
reset role;
set local role anon;
select throws_ok(
  $$insert into reports (review_id, reason) values ('77777777-0000-0000-0000-0000000000c1', 'privacy')$$,
  '42501', null, 'אורח לא מוסיף דיווח ישירות'
);
reset role;

-- ===== דיווח, דרך השרת =====
set local role service_role;

select is(
  submit_review_report('77777777-0000-0000-0000-0000000000c1', 'privacy', repeat('1', 64), '  שם   מלא של   מרצה  '),
  'created', 'דיווח נשמר'
);
select results_eq(
  $$select reason, details, status from reports where review_id = '77777777-0000-0000-0000-0000000000c1'$$,
  $$values ('privacy', 'שם מלא של מרצה', 'open')$$,
  'הפירוט בלי רווחים מיותרים'
);
select ok(
  (select status = 'published' and disputed_at is not null from reviews where id = '77777777-0000-0000-0000-0000000000c1'),
  'הביקורת נשארת באתר, ומסומנת שיש עליה דיווח'
);
select is(
  submit_review_report('77777777-0000-0000-0000-0000000000c1', 'false_fact', repeat('1', 64)),
  'duplicate', 'אותה כתובת על אותה ביקורת: לא נוסף דיווח'
);
select is(
  (select count(*)::integer from reports where review_id = '77777777-0000-0000-0000-0000000000c1'),
  1, 'עדיין דיווח אחד'
);
select throws_ok(
  $$select submit_review_report('77777777-0000-0000-0000-0000000000c2', 'other', repeat('2', 64), '   ')$$,
  '22023', null, 'סיבה אחרת בלי פירוט'
);
select throws_ok(
  $$select submit_review_report('77777777-0000-0000-0000-0000000000c2', 'spam', repeat('2', 64))$$,
  '22023', null, 'סיבה שלא ברשימה'
);
select throws_ok(
  $$select submit_review_report('77777777-0000-0000-0000-0000000000c2', 'privacy', 'not-a-hash')$$,
  '22023', null, 'בלי טביעה תקינה של הכתובת'
);
select throws_ok(
  $$select submit_review_report('77777777-0000-0000-0000-0000000000c4', 'privacy', repeat('2', 64))$$,
  'P0002', null, 'על ביקורת שלא מוצגת באתר אי אפשר לדווח'
);
-- מגבלת הקצב לכתובת: חמישה דיווחים של כתובת 3 כבר היום.
insert into reports (review_id, reason, client_hash)
select '77777777-0000-0000-0000-0000000000c3', 'false_fact', repeat('3', 64) from generate_series(1, 5);
select throws_ok(
  $$select submit_review_report('77777777-0000-0000-0000-0000000000c2', 'privacy', repeat('3', 64))$$,
  'LM030', null, 'דיווח שישי ביממה מאותה כתובת נחסם'
);
-- המגבלה הכוללת: משלימים ל-300 דיווחים ביממה, מכתובות שונות.
insert into reports (review_id, reason, details, client_hash)
select '77777777-0000-0000-0000-0000000000c3', 'false_fact', 'rp-bulk', encode(sha256(convert_to('rp-bulk-' || g, 'UTF8')), 'hex')
from generate_series(1, greatest(0, 300 - (select count(*) from reports where created_at > now() - interval '1 day'))) g;
select throws_ok(
  $$select submit_review_report('77777777-0000-0000-0000-0000000000c2', 'privacy', repeat('4', 64))$$,
  'LM031', null, 'אחרי 300 דיווחים ביממה, מכל הכתובות, הטופס נחסם'
);
delete from reports where review_id = '77777777-0000-0000-0000-0000000000c3';

-- ===== ההחלטות של גל =====

select throws_ok(
  $$select decide_review_reports('77777777-0000-0000-0000-0000000000c2', '77777777-0000-0000-0000-00000000000a', 'keep')$$,
  'P0002', null, 'בלי דיווח פתוח אין מה להחליט'
);
select is(
  submit_review_report('77777777-0000-0000-0000-0000000000c2', 'privacy', repeat('5', 64), 'הטלפון של המרצה'),
  'created', 'דיווח על ביקורת שנייה'
);
select throws_ok(
  $$select decide_review_reports('77777777-0000-0000-0000-0000000000c2', '77777777-0000-0000-0000-00000000000b', 'keep')$$,
  '42501', null, 'רק מנהל מחליט'
);
select throws_ok(
  $$select decide_review_reports('77777777-0000-0000-0000-0000000000c2', '77777777-0000-0000-0000-00000000000a', 'hide', 'false_fact')$$,
  'LM032', null, 'מסתירים עד בירור רק בגלל פרטים אישיים או תוכן לא חוקי'
);
select lives_ok(
  $$select decide_review_reports('77777777-0000-0000-0000-0000000000c2', '77777777-0000-0000-0000-00000000000a', 'hide', 'privacy')$$,
  'הסתרה עד בירור'
);
select results_eq(
  $$select r.status::text, (select count(*)::integer from reports p where p.review_id = r.id and p.status = 'open')
    from reviews r where r.id = '77777777-0000-0000-0000-0000000000c2'$$,
  $$values ('disputed', 1)$$,
  'מוסתרת, והדיווח עדיין פתוח'
);
reset role;
set local role anon;
select is(
  (select count(*)::integer from reviews where id = '77777777-0000-0000-0000-0000000000c2'),
  0, 'אורח לא רואה ביקורת מוסתרת'
);
reset role;
set local role service_role;
select lives_ok(
  $$select decide_review_reports('77777777-0000-0000-0000-0000000000c2', '77777777-0000-0000-0000-00000000000a', 'keep')$$,
  'להשאיר: הביקורת חוזרת'
);
select results_eq(
  $$select r.status::text, r.disputed_at is null,
           (select string_agg(distinct p.status, ',') from reports p where p.review_id = r.id)
    from reviews r where r.id = '77777777-0000-0000-0000-0000000000c2'$$,
  $$values ('published', true, 'kept')$$,
  'באתר שוב, בלי סימון, והדיווח נסגר'
);
select lives_ok(
  $$select decide_review_reports('77777777-0000-0000-0000-0000000000c1', '77777777-0000-0000-0000-00000000000a', 'remove', 'privacy',
    'הסרנו את הביקורת: היו בה פרטים של אדם פרטי.')$$,
  'הסרה עם נימוק'
);
select results_eq(
  $$select r.status::text, r.decision_note,
           (select string_agg(distinct p.status, ',') from reports p where p.review_id = r.id)
    from reviews r where r.id = '77777777-0000-0000-0000-0000000000c1'$$,
  $$values ('removed', 'הסרנו את הביקורת: היו בה פרטים של אדם פרטי.', 'removed')$$,
  'הוסרה, הכותב רואה למה, והדיווח נסגר'
);
select throws_ok(
  $$select decide_review_reports('77777777-0000-0000-0000-0000000000c1', '77777777-0000-0000-0000-00000000000a', 'keep')$$,
  'P0002', null, 'אחרי הסרה אין דיווח פתוח'
);
select results_eq(
  $$select action from audit_log
    where review_id in ('77777777-0000-0000-0000-0000000000c1', '77777777-0000-0000-0000-0000000000c2') order by id$$,
  $$values ('report_hide'), ('report_keep'), ('report_remove')$$,
  'כל החלטה ביומן'
);
select ok(
  not exists (
    select 1 from audit_log
    where review_id in ('77777777-0000-0000-0000-0000000000c1', '77777777-0000-0000-0000-0000000000c2')
      and (details::text like '%מרצה%' or details::text like '%הסרנו%')
  ),
  'ביומן רק קודים ומזהים, בלי מה שהמדווח או גל כתבו'
);

-- ===== תגובת מוסד =====

select lives_ok(
  $$select set_vendor_response('77777777-0000-0000-0000-0000000000c3', '77777777-0000-0000-0000-00000000000a', '  המוסד מבהיר: הפרק עודכן.  ')$$,
  'תגובה של מוסד'
);
select lives_ok(
  $$select set_vendor_response('77777777-0000-0000-0000-0000000000c3', '77777777-0000-0000-0000-00000000000a', 'תגובה מעודכנת.')$$,
  'תגובה שנייה מחליפה את הראשונה'
);
reset role;
set local role anon;
select results_eq(
  $$select body from vendor_responses where review_id = '77777777-0000-0000-0000-0000000000c3'$$,
  $$values ('תגובה מעודכנת.')$$,
  'אורח רואה תגובה אחת, העדכנית'
);
reset role;
set local role service_role;
select throws_ok(
  $$select set_vendor_response('77777777-0000-0000-0000-0000000000c3', '77777777-0000-0000-0000-00000000000b', 'x')$$,
  '42501', null, 'רק מנהל מעלה תגובה'
);
select throws_ok(
  $$select set_vendor_response('77777777-0000-0000-0000-0000000000c4', '77777777-0000-0000-0000-00000000000a', 'x')$$,
  'P0002', null, 'רק לביקורת שבאתר או שמוסתרת עד בירור'
);
select lives_ok(
  $$select set_vendor_response('77777777-0000-0000-0000-0000000000c3', '77777777-0000-0000-0000-00000000000a', '   ')$$,
  'תגובה ריקה מסירה את התגובה'
);
select throws_ok(
  $$select set_vendor_response('77777777-0000-0000-0000-0000000000c3', '77777777-0000-0000-0000-00000000000a', '')$$,
  'LM033', null, 'אין תגובה להסיר'
);
select results_eq(
  $$select action from audit_log where review_id = '77777777-0000-0000-0000-0000000000c3' order by id$$,
  $$values ('vendor_response'), ('vendor_response'), ('vendor_response_remove')$$,
  'התגובות ביומן'
);
select throws_ok(
  $$insert into audit_log (actor_id, action, review_id)
    values ('77777777-0000-0000-0000-00000000000a', 'report_snooze', '77777777-0000-0000-0000-0000000000c3')$$,
  '23514', null, 'פעולה שלא ברשימה לא נכנסת ליומן'
);

-- ===== הניקוי: הפירוט 90 יום אחרי ההחלטה, והטביעה אחרי יומיים =====
reset role;
update reports set decided_at = now() - interval '91 days', created_at = now() - interval '92 days'
where review_id = '77777777-0000-0000-0000-0000000000c2';
set local role service_role;
select ok(purge_reports() >= 1, 'הניקוי רץ');
select results_eq(
  $$select review_id = '77777777-0000-0000-0000-0000000000c2', details is null, client_hash is null
    from reports
    where review_id in ('77777777-0000-0000-0000-0000000000c1', '77777777-0000-0000-0000-0000000000c2')
    order by review_id$$,
  $$values (false, false, false), (true, true, true)$$,
  'הפירוט והטביעה נמחקו רק בדיווח הישן שהוחלט עליו'
);

select * from finish();
rollback;
```

- [ ] **Step 2: הבדיקות נכשלות**

```bash
pnpm db:test
```

Expected: `reports.test.sql` נכשל, עם `relation "reports" does not exist` או `function submit_review_report(...) does not exist`. שאר קבצי הבדיקה עוברים.

- [ ] **Step 3: המיגרציה, סעיפים 1–6**

Create `supabase/migrations/20261115230001_reports_and_transparency.sql`:

```sql
-- סבב 5, תוכנית 5ג: דיווח על ביקורת, ההחלטות של גל עליו, תגובת מוסד, ומספרי השקיפות.
-- התוכנית: docs/superpowers/plans/2026-11-15-plan-5-reports-transparency.md.
-- מסמך העיצוב: docs/superpowers/specs/2026-11-15-round-5-reports-transparency-design.md, סעיפים 3–7 ו-9.
-- אחרי 20261115210001_course_queue_admin.sql: ביומן כבר יש יעד אחד בכל שורה (audit_log_one_target), ופעולה
-- שאינה של קורס או של בקשה חייבת review_id. כל הפעולות החדשות כאן על ביקורת.
-- הפונקציות שכותבות: ל-service_role בלבד. לאורח ולמשתמש מחובר: רק מספרי השקיפות.
--
-- קודי שגיאה שהשרת מתרגם לעברית (web/src/app/courses/[slug]/report-actions.ts ו-web/src/app/admin/report-actions.ts):
--   LM030  יותר מדי דיווחים מאותה כתובת ביממה
--   LM031  יותר מדי דיווחים ביממה, מכל הכתובות
--   LM032  הסתרה עד בירור רק לפרטים של אדם פרטי או לתוכן לא חוקי
--   LM033  אין תגובה של מוסד להסיר
--   P0002  הביקורת לא מוצגת באתר, או שאין עליה דיווח פתוח, או שהיא כבר מוסתרת

-- ===== 1. היומן: גם דיווחים ותגובות של מוסדות =====
-- אותה רשימה כמו ב-20261115210001, ועוד חמש פעולות על ביקורת. ב-details רק קודים ומזהים, אף פעם לא טקסט
-- חופשי: היומן לא נמחק, וטקסט של דיווח יכול לכלול שם של אדם פרטי.

alter table audit_log drop constraint audit_log_action_check;
alter table audit_log add constraint audit_log_action_check check (action in (
  'approve', 'reject', 'request_more', 'author_delete', 'cleanup_delete',
  'course_approve', 'course_edit', 'course_reject',
  'join_request_approve', 'join_request_reject',
  'report_keep', 'report_hide', 'report_remove',
  'vendor_response', 'vendor_response_remove'
));

-- ===== 2. דיווחים (מסמך העיצוב של חלק 1, סעיף 4) =====

create table reports (
  id bigint generated always as identity primary key,
  -- כותב שמוחק את הביקורת שלו מוחק גם את הדיווחים עליה. ההחלטות נשארות ביומן.
  review_id uuid not null references reviews(id) on delete cascade,
  reason text not null check (reason in ('privacy', 'illegal', 'false_fact', 'not_graduate', 'other')),
  -- מה שהמדווח כתב. רק לגל, ב-/admin. נמחק 90 יום אחרי ההחלטה (purge_reports).
  details text check (details is null or char_length(details) between 1 and 1000),
  -- HMAC-SHA256 של כתובת ה-IP, עם מפתח שיש רק לשרת. רק למגבלת הקצב, ונמחק אחרי יומיים (purge_reports).
  client_hash text check (client_hash ~ '^[0-9a-f]{64}$'),
  status text not null default 'open' check (status in ('open', 'kept', 'removed')),
  decided_by uuid,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  check ((status = 'open') = (decided_at is null))
);
create index reports_open_idx on reports (review_id, created_at) where status = 'open';
create index reports_client_idx on reports (client_hash, created_at) where client_hash is not null;
create index reports_created_idx on reports (created_at);

alter table reports enable row level security;
-- אין מדיניות: אורח ומשתמש מחובר לא רואים ולא כותבים. רק service_role, שעוקף RLS.
-- ברירות המחדל של תוכנית 1 כבר חוסמות, וזה במפורש.
revoke all on reports from anon, authenticated;

-- ===== 3. דיווח, מהטופס הציבורי, דרך פעולת השרת =====
-- מחזירה 'created', או 'duplicate' כשאותה כתובת כבר דיווחה על אותה ביקורת והדיווח עוד פתוח (ואז לא נוסף כלום).
-- מגבלת קצב: 5 ביממה לכל כתובת, ו-300 ביממה בסך הכול. נעילה אחת, כמו submit_institution_request.
-- הביקורת נשארת באתר (סעיף 6). disputed_at מסמן שיש עליה דיווח פתוח, ולא מוצג לציבור.
create function submit_review_report(p_review_id uuid, p_reason text, p_client_hash text, p_details text default null)
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_details text := nullif(btrim(regexp_replace(coalesce(p_details, ''), '\s+', ' ', 'g')), '');
begin
  if p_client_hash is null or p_client_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'bad client hash' using errcode = '22023';
  end if;
  if p_reason is null or p_reason not in ('privacy', 'illegal', 'false_fact', 'not_graduate', 'other') then
    raise exception 'unknown reason' using errcode = '22023';
  end if;
  if p_reason = 'other' and v_details is null then
    raise exception 'other needs details' using errcode = '22023';
  end if;
  if char_length(v_details) > 1000 then
    raise exception 'details are too long' using errcode = '22023';
  end if;
  -- רק ביקורת שמוצגת באתר: פורסמה, בקורס שאינו טיוטה. אותו כלל כמו private.is_review_public.
  if not exists (
    select 1 from public.reviews r join public.courses c on c.id = r.course_id
    where r.id = p_review_id and r.status = 'published' and c.status <> 'draft'
  ) then
    raise exception 'review not found' using errcode = 'P0002';
  end if;

  perform pg_advisory_xact_lock(hashtext('public.reports'));
  if exists (
    select 1 from public.reports r
    where r.review_id = p_review_id and r.client_hash = p_client_hash and r.status = 'open'
  ) then
    return 'duplicate';
  end if;
  if (select count(*) from public.reports r
      where r.client_hash = p_client_hash and r.created_at > now() - interval '1 day') >= 5 then
    raise exception 'too many reports from this client today' using errcode = 'LM030';
  end if;
  if (select count(*) from public.reports r where r.created_at > now() - interval '1 day') >= 300 then
    raise exception 'too many reports today' using errcode = 'LM031';
  end if;

  insert into public.reports (review_id, reason, details, client_hash)
  values (p_review_id, p_reason, v_details, p_client_hash);
  update public.reviews set disputed_at = coalesce(disputed_at, now()) where id = p_review_id;
  return 'created';
end $$;

-- ===== 4. ההחלטה של גל, על כל הדיווחים הפתוחים של ביקורת אחת (סעיף 10, "דיווחים") =====
-- keep: הביקורת נשארת (או חוזרת, אם הוסתרה), והדיווחים נסגרים. דעה נשארת.
-- hide: הביקורת יורדת מהאתר ומהציון עד ההחלטה (status = 'disputed', שכבר לא ציבורי), והדיווחים נשארים פתוחים.
--       רק לפרטים של אדם פרטי או לתוכן לא חוקי (סעיף 6). המסד אוכף.
-- remove: הביקורת מוסרת (status = 'removed'), והכותב רואה ב"הביקורות שלי" את p_note. הדיווחים נסגרים.
-- ביומן: מספרי הדיווחים והסיבה. p_note נשמרת רק בביקורת, שהכותב יכול למחוק.
-- מחזירה את הכתובת של הקורס, לרענון העמוד.
create function decide_review_reports(
  p_review_id uuid, p_admin_id uuid, p_decision text, p_reason text default null, p_note text default null
)
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_status public.review_status;
  v_slug text;
  v_reports jsonb;
begin
  if not exists (select 1 from public.admins where user_id = p_admin_id) then
    raise exception 'not an admin' using errcode = '42501';
  end if;
  if p_decision is null or p_decision not in ('keep', 'hide', 'remove') then
    raise exception 'unknown decision' using errcode = '22023';
  end if;

  select r.status, c.slug into v_status, v_slug
  from public.reviews r join public.courses c on c.id = r.course_id
  where r.id = p_review_id
  for update of r;
  select jsonb_agg(p.id order by p.id) into v_reports
  from public.reports p where p.review_id = p_review_id and p.status = 'open';
  if v_status is null or v_status not in ('published', 'disputed') or v_reports is null then
    raise exception 'review % has no open report', p_review_id using errcode = 'P0002';
  end if;

  if p_decision = 'keep' then
    update public.reviews set disputed_at = null where id = p_review_id;
    -- רק כשהיא מוסתרת: עדכון של status מזיז את updated_at (reviews_updated_at), ואת הסדר ב"הביקורות שלי".
    if v_status = 'disputed' then
      update public.reviews set status = 'published' where id = p_review_id;
    end if;
    update public.reports set status = 'kept', decided_by = p_admin_id, decided_at = now()
    where review_id = p_review_id and status = 'open';
    insert into public.audit_log (actor_id, action, review_id, details)
    values (p_admin_id, 'report_keep', p_review_id,
            jsonb_build_object('reports', v_reports, 'was_hidden', v_status = 'disputed'));
  elsif p_decision = 'hide' then
    if p_reason is null or p_reason not in ('privacy', 'illegal') then
      raise exception 'hide is only for privacy or illegal content' using errcode = 'LM032';
    end if;
    if v_status = 'disputed' then
      raise exception 'review % is already hidden', p_review_id using errcode = 'P0002';
    end if;
    update public.reviews set status = 'disputed' where id = p_review_id;
    insert into public.audit_log (actor_id, action, review_id, details)
    values (p_admin_id, 'report_hide', p_review_id, jsonb_build_object('reports', v_reports, 'reason', p_reason));
  else
    if p_reason is null or p_reason not in ('privacy', 'illegal', 'false_fact', 'not_graduate', 'other') then
      raise exception 'unknown reason' using errcode = '22023';
    end if;
    update public.reviews set status = 'removed', decision_note = p_note where id = p_review_id;
    update public.reports set status = 'removed', decided_by = p_admin_id, decided_at = now()
    where review_id = p_review_id and status = 'open';
    insert into public.audit_log (actor_id, action, review_id, details)
    values (p_admin_id, 'report_remove', p_review_id, jsonb_build_object('reports', v_reports, 'reason', p_reason));
  end if;
  return v_slug;
end $$;

-- ===== 5. תגובת מוסד (סעיף 6: "גל מעלה אותה"), מתחת לביקורת בפתק כחול =====

alter table vendor_responses
  add constraint vendor_responses_body_length check (char_length(btrim(body)) between 1 and 2000);

-- p_body ריק: מוחקת את התגובה. אחרת: מוסיפה, או מחליפה את הקיימת (vendor_responses_review_idx).
-- רק לביקורת שפורסמה, או שמוסתרת עד בירור. ביומן רק שהתגובה פורסמה או הוסרה, בלי הטקסט.
-- מחזירה את הכתובת של הקורס.
create function set_vendor_response(p_review_id uuid, p_admin_id uuid, p_body text)
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_slug text;
  v_body text := nullif(btrim(coalesce(p_body, '')), '');
begin
  if not exists (select 1 from public.admins where user_id = p_admin_id) then
    raise exception 'not an admin' using errcode = '42501';
  end if;
  select c.slug into v_slug
  from public.reviews r join public.courses c on c.id = r.course_id
  where r.id = p_review_id and r.status in ('published', 'disputed')
  for update of r;
  if v_slug is null then
    raise exception 'review % is not on the site', p_review_id using errcode = 'P0002';
  end if;

  if v_body is null then
    delete from public.vendor_responses where review_id = p_review_id;
    if not found then
      raise exception 'review % has no response', p_review_id using errcode = 'LM033';
    end if;
    insert into public.audit_log (actor_id, action, review_id, details)
    values (p_admin_id, 'vendor_response_remove', p_review_id, '{}'::jsonb);
  else
    if char_length(v_body) > 2000 then
      raise exception 'response is too long' using errcode = '22023';
    end if;
    insert into public.vendor_responses (review_id, body) values (p_review_id, v_body)
    on conflict (review_id) do update set body = excluded.body;
    insert into public.audit_log (actor_id, action, review_id, details)
    values (p_admin_id, 'vendor_response', p_review_id, '{}'::jsonb);
  end if;
  return v_slug;
end $$;

-- ===== 6. הניקוי היומי (web/src/lib/reviews/cleanup.ts, ומדיניות הפרטיות) =====
-- מה שהמדווח כתב: 90 יום אחרי ההחלטה. הטביעה של הכתובת: אחרי יומיים. מחזירה כמה טקסטים נמחקו.
create function purge_reports()
returns integer
language plpgsql
set search_path = ''
as $$
declare
  v_details integer;
begin
  update public.reports set details = null
  where details is not null and status <> 'open' and decided_at < now() - interval '90 days';
  get diagnostics v_details = row_count;
  update public.reports set client_hash = null
  where client_hash is not null and created_at < now() - interval '2 days';
  return v_details;
end $$;

revoke execute on function submit_review_report(uuid, text, text, text) from public, anon, authenticated;
revoke execute on function decide_review_reports(uuid, uuid, text, text, text) from public, anon, authenticated;
revoke execute on function set_vendor_response(uuid, uuid, text) from public, anon, authenticated;
revoke execute on function purge_reports() from public, anon, authenticated;
grant execute on function submit_review_report(uuid, text, text, text) to service_role;
grant execute on function decide_review_reports(uuid, uuid, text, text, text) to service_role;
grant execute on function set_vendor_response(uuid, uuid, text) to service_role;
grant execute on function purge_reports() to service_role;
```

- [ ] **Step 4: הבדיקות עוברות**

```bash
pnpm db:reset
pnpm db:test
```

Expected:
- `db:reset` מסתיים בלי שגיאה.
- `db:test` עובר כולו, עם 41 בדיקות יותר מהבסיס של משימה 1.
- אם `vendor_responses_body_length` נכשל באיפוס, יש ב-seed תגובה ריקה. אז האילוץ יורד מהמיגרציה, והבדיקה של אורך התגובה נשארת רק בפונקציה.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20261115230001_reports_and_transparency.sql supabase/tests/reports.test.sql
git commit -m "db: דיווחים על ביקורות, ההחלטות של גל ותגובת מוסד, עם מגבלת קצב ויומן"
```

שורה בקובץ הסשן: הקומיט, "41 בדיקות pgTAP חדשות עוברות. נבדק."

---

### Task 3: המסד: מספרי השקיפות (TDD), והטיפוסים

**Files:**
- Create: `supabase/tests/transparency.test.sql`
- Modify: `supabase/migrations/20261115230001_reports_and_transparency.sql` (סעיף 7 בסוף)
- Modify: `web/src/lib/database.types.ts` (נוצר מחדש)

- [ ] **Step 1: הבדיקות**

Create `supabase/tests/transparency.test.sql`:

```sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

-- תוכנית 5ג: מספרי השקיפות (transparency_by_month). הספירות כאן הן הפרש: לפני ואחרי פעולות הבדיקה,
-- כי המסד בפיי משותף ויש בו כבר פעולות.
create temp table before_t as select * from transparency_by_month(3);
-- אמצע החודש הקודם, בשעון ישראל.
create temp table moments as
select ((date_trunc('month', now() at time zone 'Asia/Jerusalem') - interval '15 days') at time zone 'Asia/Jerusalem') as last_month;

insert into audit_log (actor_id, action, review_id, created_at)
select null, a, gen_random_uuid(), (select last_month from moments)
from unnest(array['approve', 'approve', 'reject', 'request_more', 'report_keep', 'report_remove']) a;
insert into audit_log (actor_id, action, course_queue_id, created_at)
select null, t.a, 900000 + t.n, (select last_month from moments)
from unnest(array['course_approve', 'course_edit', 'course_reject']) with ordinality as t(a, n);
insert into proofs (sha256, claimed_kind, mime_type, size_bytes, check_status, file_deleted_at)
values (repeat('e', 64), 'invoice', 'application/pdf', 1000, 'not_checked', (select last_month from moments));
-- החודש הנוכחי: לא נספר.
insert into audit_log (actor_id, action, review_id) values (null, 'approve', gen_random_uuid());
create temp table after_t as select * from transparency_by_month(3);

select ok(
  has_function_privilege('anon', 'public.transparency_by_month(integer)', 'EXECUTE')
  and has_function_privilege('authenticated', 'public.transparency_by_month(integer)', 'EXECUTE'),
  'אורח ומשתמש מחובר קוראים את המספרים'
);
select results_eq(
  $$select a.reviews_published - coalesce(b.reviews_published, 0),
           a.reviews_returned - coalesce(b.reviews_returned, 0),
           a.proofs_deleted - coalesce(b.proofs_deleted, 0),
           a.course_changes_approved - coalesce(b.course_changes_approved, 0),
           a.course_changes_rejected - coalesce(b.course_changes_rejected, 0),
           a.reported_reviews_kept - coalesce(b.reported_reviews_kept, 0),
           a.reported_reviews_removed - coalesce(b.reported_reviews_removed, 0)
    from after_t a left join before_t b using (month)
    where a.month = (date_trunc('month', now() at time zone 'Asia/Jerusalem') - interval '1 month')::date$$,
  $$values (2, 2, 1, 2, 1, 1, 1)$$,
  'בחודש הקודם: כל פעולה נספרת בשורה שלה'
);
select ok(
  not exists (select 1 from after_t where month >= date_trunc('month', now() at time zone 'Asia/Jerusalem')::date),
  'החודש הנוכחי לא מוצג'
);
select ok(
  (select count(*) from transparency_by_month(100)) <= 12,
  'עד 12 חודשים'
);
select is(
  pg_get_function_result('public.transparency_by_month(integer)'::regprocedure),
  'TABLE(month date, reviews_published integer, reviews_returned integer, proofs_deleted integer, course_changes_approved integer, course_changes_rejected integer, reported_reviews_kept integer, reported_reviews_removed integer)',
  'רק חודש וספירות: בלי מזהה, קורס או מוסד'
);
select ok(
  (select p.prosecdef and p.proconfig @> array['search_path=""']
   from pg_proc p where p.oid = 'public.transparency_by_month(integer)'::regprocedure),
  'security definer, עם search_path ריק'
);
set local role anon;
select ok((select count(*) from transparency_by_month(3)) >= 1, 'אורח קורא את המספרים');
select throws_ok($$select count(*) from audit_log$$, '42501', null, 'אורח לא קורא את היומן עצמו');
reset role;

select * from finish();
rollback;
```

- [ ] **Step 2: הבדיקות נכשלות**

```bash
pnpm db:test
```

Expected: `transparency.test.sql` נכשל עם `function transparency_by_month(integer) does not exist`.

- [ ] **Step 3: סעיף 7 במיגרציה**

מוסיפים בסוף `supabase/migrations/20261115230001_reports_and_transparency.sql`:

```sql

-- ===== 7. מספרי השקיפות (סבב 5, פריט 33) =====
-- מה עשינו בכל חודש שנגמר, לכל האתר יחד. רק ספירות: בלי מזהה, בלי קורס, בלי מוסד ובלי יום.
-- רק חודשים שנגמרו (בשעון ישראל), כדי שאי אפשר יהיה לראות את המספר זז אחרי פעולה מסוימת.
-- מהחודש הראשון שיש בו פעולה, ועד p_months אחורה (1 עד 12). בלי שום חודש כזה: בלי שורות.
-- security definer: היומן וההוכחות סגורים לציבור, והפונקציה מחזירה מהם רק ספירות. כל טבלה בשם הסכמה.
create function transparency_by_month(p_months integer default 3)
returns table (
  month date,
  reviews_published integer,
  reviews_returned integer,
  proofs_deleted integer,
  course_changes_approved integer,
  course_changes_rejected integer,
  reported_reviews_kept integer,
  reported_reviews_removed integer
)
language sql stable security definer
set search_path = ''
as $$
  with events as (
    select (date_trunc('month', l.created_at at time zone 'Asia/Jerusalem'))::date as month, l.action as kind
    from public.audit_log l
    union all
    select (date_trunc('month', p.file_deleted_at at time zone 'Asia/Jerusalem'))::date, 'proof_deleted'
    from public.proofs p
    where p.file_deleted_at is not null
  ),
  bounds as (
    select (date_trunc('month', now() at time zone 'Asia/Jerusalem'))::date as this_month,
           (select min(e.month) from events e) as first_month
  ),
  months as (
    select g::date as month
    from bounds b,
      generate_series(
        greatest(
          b.first_month::timestamp,
          b.this_month - make_interval(months => least(greatest(coalesce(p_months, 3), 1), 12))
        ),
        (b.this_month - interval '1 month')::timestamp,
        interval '1 month'
      ) g
    where b.first_month is not null
  )
  select m.month,
         (count(*) filter (where e.kind = 'approve'))::integer,
         (count(*) filter (where e.kind in ('reject', 'request_more')))::integer,
         (count(*) filter (where e.kind = 'proof_deleted'))::integer,
         (count(*) filter (where e.kind in ('course_approve', 'course_edit')))::integer,
         (count(*) filter (where e.kind = 'course_reject'))::integer,
         (count(*) filter (where e.kind = 'report_keep'))::integer,
         (count(*) filter (where e.kind = 'report_remove'))::integer
  from months m
  left join events e on e.month = m.month
  group by m.month
  order by m.month desc;
$$;
revoke execute on function transparency_by_month(integer) from public;
grant execute on function transparency_by_month(integer) to anon, authenticated;
```

- [ ] **Step 4: הבדיקות עוברות**

```bash
pnpm db:reset
pnpm db:test
```

Expected: הכול עובר, עם 8 בדיקות יותר ממשימה 2.

- [ ] **Step 5: הטיפוסים**

```bash
pnpm db:types
grep -n "reports: {\|submit_review_report\|decide_review_reports\|set_vendor_response\|purge_reports\|transparency_by_month" web/src/lib/database.types.ts
pnpm --dir web exec tsc --noEmit
```

Expected:
- ב-`database.types.ts`:
  - הטבלה `reports` וחמש הפונקציות;
  - `p_details?: string` ב-`submit_review_report`;
  - `p_reason?: string` ו-`p_note?: string` ב-`decide_review_reports`.
- `tsc` עובר.

- [ ] **Step 6: Commit**

```bash
pnpm --dir web score:recompute
git add supabase/migrations/20261115230001_reports_and_transparency.sql supabase/tests/transparency.test.sql web/src/lib/database.types.ts
git commit -m "db: מספרי השקיפות לפי חודש, רק ספירות של חודשים שנגמרו"
```

שורה בקובץ הסשן: הקומיט, "8 בדיקות pgTAP חדשות עוברות, והטיפוסים נוצרו. נבדק."

---

### Task 4: לוגיקה טהורה: הטופס, התור, היומן והמספרים (TDD)

**Files:**
- Create: `web/src/lib/reports/reasons.ts`
- Test: `web/src/lib/reports/reasons.test.ts`
- Create: `web/src/lib/reports/group.ts`
- Test: `web/src/lib/reports/group.test.ts`
- Create: `web/src/lib/admin/audit.ts`
- Test: `web/src/lib/admin/audit.test.ts`
- Create: `web/src/lib/transparency/numbers.ts`
- Test: `web/src/lib/transparency/numbers.test.ts`

כל הקבצים כאן בלי `server-only`: Vitest מריץ אותם ב-Node, ו-`server-only` זורק שם שגיאה.

- [ ] **Step 1: הבדיקות של הטופס**

Create `web/src/lib/reports/reasons.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { REMOVE_NOTE, parseReportForm, removalNote } from './reasons';

const ID = '11111111-2222-4333-8444-555555555555';
const form = (entries: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.set(key, value);
  return data;
};

describe('parseReportForm', () => {
  it('keeps the reason and cleans the details', () => {
    expect(parseReportForm(form({ reviewId: ID, reason: 'privacy', details: '  יש   שם\nמלא ' }))).toEqual({
      ok: true,
      values: { reviewId: ID, reason: 'privacy', details: 'יש שם מלא' },
    });
    expect(parseReportForm(form({ reviewId: ID, reason: 'false_fact', details: '   ' }))).toEqual({
      ok: true,
      values: { reviewId: ID, reason: 'false_fact', details: null },
    });
  });

  it('refuses what the database would refuse, and says which field', () => {
    expect(parseReportForm(form({ reviewId: 'x', reason: 'privacy' }))).toMatchObject({ ok: false, field: null });
    expect(parseReportForm(form({ reviewId: ID }))).toMatchObject({ ok: false, field: 'reason' });
    expect(parseReportForm(form({ reviewId: ID, reason: 'spam' }))).toMatchObject({ ok: false, field: 'reason' });
    expect(parseReportForm(form({ reviewId: ID, reason: 'other', details: ' ' }))).toMatchObject({ ok: false, field: 'details' });
    expect(parseReportForm(form({ reviewId: ID, reason: 'illegal', details: 'א'.repeat(1001) }))).toMatchObject({
      ok: false,
      field: 'details',
    });
  });
});

describe('removalNote', () => {
  it('starts with the reason, and adds what Gal wrote in one line', () => {
    expect(removalNote('privacy', '  היה שם   מלא.\n')).toBe(`${REMOVE_NOTE.privacy} היה שם מלא.`);
    expect(removalNote('other', '')).toBe(REMOVE_NOTE.other);
  });
});
```

- [ ] **Step 2: הבדיקות של התור**

Create `web/src/lib/reports/group.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { groupReports, type ReportedReview } from './group';
import type { ReportReason } from './reasons';

const review = (reviewId: string, status: ReportedReview['status'] = 'published'): ReportedReview => ({
  reviewId,
  status,
  courseSlug: 'sample-course',
  courseTitle: 'קורס לדוגמה',
  institutionName: 'מכללה לדוגמה',
  cohortMonth: '2026-01-01',
  publishedAt: '2026-02-01T10:00:00+00:00',
  body: 'גוף הביקורת',
  displayName: null,
  authorTitle: 'none',
  vendorResponse: null,
});
const report = (id: number, reviewId: string, reason: ReportReason, createdAt: string) => ({
  id,
  reviewId,
  reason,
  details: null,
  createdAt,
});

describe('groupReports', () => {
  it('makes one item per review: urgent first, then the oldest', () => {
    const items = groupReports(
      [review('a'), review('b'), review('c')],
      [
        report(1, 'a', 'false_fact', '2026-11-01T10:00:00+00:00'),
        report(2, 'b', 'other', '2026-11-02T10:00:00+00:00'),
        report(3, 'c', 'false_fact', '2026-11-03T10:00:00+00:00'),
        report(4, 'c', 'privacy', '2026-11-04T10:00:00+00:00'),
        report(5, 'a', 'not_graduate', '2026-11-05T10:00:00+00:00'),
      ],
    );
    expect(items.map((i) => i.reviewId)).toEqual(['c', 'a', 'b']);
    expect(items[0]).toMatchObject({ urgent: true, since: '2026-11-03T10:00:00+00:00' });
    expect(items[0].reports.map((r) => r.id)).toEqual([4, 3]);
    expect(items[1].reports.map((r) => r.id)).toEqual([1, 5]);
  });

  it('skips reports whose review is gone, and a hidden review is no longer urgent', () => {
    const items = groupReports(
      [review('a', 'disputed')],
      [report(1, 'a', 'privacy', '2026-11-01T10:00:00+00:00'), report(2, 'gone', 'privacy', '2026-11-01T09:00:00+00:00')],
    );
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ reviewId: 'a', urgent: false });
  });
});
```

- [ ] **Step 3: הבדיקות של היומן**

Create `web/src/lib/admin/audit.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { REPORT_REASON_LABEL } from '@/lib/reports/reasons';
import { PROOF_KIND_LABEL } from '@/lib/reviews/types';
import { AUDIT_ACTIONS, actionLabel, actorLabel, detailLabel } from './audit';
import { REJECT_REASONS } from './reasons';

describe('audit lines', () => {
  it('has words for every action the database accepts, and an actor', () => {
    for (const action of AUDIT_ACTIONS) expect(actionLabel(action), action).not.toBe(action);
    expect(actionLabel('something_new')).toBe('something_new');
    expect(actorLabel('cleanup_delete', null)).toBe('הניקוי האוטומטי');
    expect(actorLabel('author_delete', 'u')).toBe('הכותב');
    expect(actorLabel('report_hide', 'u')).toBe('מנהל');
  });

  it('turns the codes in details into words, and nothing else', () => {
    expect(detailLabel('reject', { reason: 'unreadable' })).toBe(REJECT_REASONS.unreadable);
    expect(detailLabel('report_remove', { reason: 'privacy', reports: [1, 2] })).toBe(REPORT_REASON_LABEL.privacy);
    expect(detailLabel('report_keep', { reports: [3], was_hidden: true })).toBe('הביקורת חזרה לאתר');
    expect(detailLabel('report_keep', { reports: [3], was_hidden: false })).toBeNull();
    expect(detailLabel('course_edit', { field: 'site_price_ils', kind: 'field' })).toBe('מחיר באתר');
    expect(detailLabel('course_approve', { kind: 'new_course' })).toBe('קורס חדש');
    expect(detailLabel('approve', { proof_kind: 'invoice', has_amount: true })).toBe(`${PROOF_KIND_LABEL.invoice}, עם סכום`);
    expect(detailLabel('vendor_response', {})).toBeNull();
  });
});
```

- [ ] **Step 4: הבדיקות של המספרים**

Create `web/src/lib/transparency/numbers.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { monthName, toTransparencyMonth, transparencyLead, type TransparencyMonth } from './numbers';

const month = (published: number, returned: number): TransparencyMonth => ({
  month: '2026-10-01',
  reviewsPublished: published,
  reviewsReturned: returned,
  proofsDeleted: 0,
  courseChangesApproved: 0,
  courseChangesRejected: 0,
  reportedKept: 0,
  reportedRemoved: 0,
});

describe('transparencyLead', () => {
  it('says what we published and what went back, in the month that ended', () => {
    const name = monthName('2026-10-01');
    expect(name).toContain('2026');
    expect(transparencyLead(month(12, 37))).toBe(`ב${name} פרסמנו 12 ביקורות, והחזרנו 37 לכותבים בלי לפרסם.`);
    expect(transparencyLead(month(1, 1))).toBe(`ב${name} פרסמנו ביקורת אחת, והחזרנו אחת לכותב בלי לפרסם.`);
    expect(transparencyLead(month(0, 0))).toBe(`ב${name} לא פרסמנו אף ביקורת, ולא החזרנו אף אחת לכותבים.`);
    expect(transparencyLead(month(1234, 2))).toContain('1,234');
  });
});

describe('toTransparencyMonth', () => {
  it('maps a row of transparency_by_month', () => {
    expect(
      toTransparencyMonth({
        month: '2026-10-01',
        reviews_published: 1,
        reviews_returned: 2,
        proofs_deleted: 3,
        course_changes_approved: 4,
        course_changes_rejected: 5,
        reported_reviews_kept: 6,
        reported_reviews_removed: 7,
      }),
    ).toEqual({
      month: '2026-10-01',
      reviewsPublished: 1,
      reviewsReturned: 2,
      proofsDeleted: 3,
      courseChangesApproved: 4,
      courseChangesRejected: 5,
      reportedKept: 6,
      reportedRemoved: 7,
    });
  });
});
```

- [ ] **Step 5: הבדיקות נכשלות**

```bash
pnpm --dir web test -- src/lib/reports src/lib/admin/audit.test.ts src/lib/transparency
```

Expected: ארבעת הקבצים נכשלים, כי `./reasons`, `./group`, `./audit` ו-`./numbers` לא קיימים.

- [ ] **Step 6: הסיבות והטופס**

Create `web/src/lib/reports/reasons.ts`:

```ts
import { isUuid } from '@/lib/reviews/types';

/**
 * דיווח על ביקורת: הסיבות, מה מקבלים מהטופס, ומה הכותב קורא כשהביקורת מוסרת.
 * אותם קודים כמו ב-reports.reason וב-decide_review_reports (20261115230001_reports_and_transparency.sql).
 */
export const REPORT_REASONS = ['privacy', 'illegal', 'false_fact', 'not_graduate', 'other'] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];
export const isReportReason = (value: unknown): value is ReportReason =>
  typeof value === 'string' && (REPORT_REASONS as readonly string[]).includes(value);

/** מה המדווח בוחר, ומה גל רואה בתור. */
export const REPORT_REASON_LABEL: Record<ReportReason, string> = {
  privacy: 'יש בה פרטים של אדם פרטי (שם מלא, טלפון, מייל)',
  illegal: 'יש בה תוכן פוגעני או לא חוקי',
  false_fact: 'כתובה בה עובדה לא נכונה על הקורס',
  not_graduate: 'נראה שמי שכתב לא למד בקורס',
  other: 'סיבה אחרת',
};

/** רק בגלל אלה מסתירים ביקורת עד ההחלטה (מסמך העיצוב של חלק 1, סעיף 6). המסד אוכף את אותו כלל (LM032). */
export const HIDE_REASONS: readonly ReportReason[] = ['privacy', 'illegal'];
export const isUrgent = (reason: ReportReason) => HIDE_REASONS.includes(reason);

/** ההודעה לכותב כשהביקורת מוסרת. מופיעה ב"הביקורות שלי" (reviews.decision_note). */
export const REMOVE_NOTE: Record<ReportReason, string> = {
  privacy: 'הסרנו את הביקורת: היו בה פרטים של אדם פרטי, כמו שם מלא או טלפון.',
  illegal: 'הסרנו את הביקורת: היה בה תוכן שאסור לפרסם.',
  false_fact: 'הסרנו את הביקורת: עובדה שנכתבה בה לא התאימה לסילבוס או לדף הקורס.',
  not_graduate: 'הסרנו את הביקורת: לא הצלחנו לוודא שהיא נכתבה בידי בוגר של הקורס.',
  other: 'הסרנו את הביקורת אחרי בירור.',
};

/** הנימוק, ואחריו מה שגל הוסיף, בשורה אחת ועד 600 תווים. כמו decisionNote בתור הביקורות. */
export function removalNote(reason: ReportReason, extra: string): string {
  const more = extra.trim().replace(/\s+/g, ' ').slice(0, 600);
  return [REMOVE_NOTE[reason], more].filter(Boolean).join(' ');
}

/** אותו גבול כמו reports.details. */
export const DETAILS_MAX = 1000;

export type ReportField = 'reason' | 'details';

export type ReportParse =
  | { ok: true; values: { reviewId: string; reason: ReportReason; details: string | null } }
  | { ok: false; field: ReportField | null; message: string };

/** מה שהטופס שולח, אחרי אותן בדיקות כמו ב-submit_review_report. field: null כשהבעיה לא בשדה שהמבקר ממלא. */
export function parseReportForm(form: FormData): ReportParse {
  const reviewId = form.get('reviewId');
  if (!isUuid(reviewId)) return { ok: false, field: null, message: 'הדיווח לא נשלח. רעננו את הדף ונסו שוב.' };
  const reason = form.get('reason');
  if (!isReportReason(reason)) return { ok: false, field: 'reason', message: 'בחרו מה הבעיה.' };
  const raw = form.get('details');
  const details = (typeof raw === 'string' ? raw : '').replace(/\s+/g, ' ').trim();
  if (details.length > DETAILS_MAX) return { ok: false, field: 'details', message: 'עד 1,000 תווים.' };
  if (reason === 'other' && details === '') return { ok: false, field: 'details', message: 'כתבו בכמה מילים מה הבעיה.' };
  return { ok: true, values: { reviewId, reason, details: details === '' ? null : details } };
}
```

- [ ] **Step 7: התור**

Create `web/src/lib/reports/group.ts`:

```ts
import type { AuthorTitle } from '@/lib/reviews/types';
import { isUrgent, type ReportReason } from './reasons';

export interface ReportEntry {
  id: number;
  reason: ReportReason;
  details: string | null;
  createdAt: string;
}

/** ביקורת שיש עליה דיווח פתוח, כמו שגל רואה אותה בתור. */
export interface ReportedReview {
  reviewId: string;
  /** published: באתר, בזמן הבדיקה. disputed: מוסתרת עד בירור. */
  status: 'published' | 'disputed';
  courseSlug: string;
  courseTitle: string;
  institutionName: string;
  cohortMonth: string;
  publishedAt: string | null;
  body: string;
  /** null: הבוגר בחר להישאר אנונימי. */
  displayName: string | null;
  authorTitle: AuthorTitle;
  vendorResponse: string | null;
}

export interface ReportQueueItem extends ReportedReview {
  /** הדחופים קודם (פרטים אישיים, תוכן לא חוקי), ובתוך כל קבוצה הישן קודם. */
  reports: ReportEntry[];
  /** יש דיווח שמצדיק הסתרה עד בירור, והביקורת עדיין באתר. */
  urgent: boolean;
  /** מתי הגיע הדיווח הראשון. */
  since: string;
}

const byTime = (a: { createdAt: string }, b: { createdAt: string }) => a.createdAt.localeCompare(b.createdAt);

/**
 * פריט אחד לכל ביקורת: ההחלטה של גל היא על הביקורת, וסוגרת את כל הדיווחים הפתוחים שלה (decide_review_reports).
 * הסדר: קודם ביקורת שעוד באתר ויש עליה דיווח דחוף, ואחר כך כל השאר, הישנה ראשונה.
 * דיווח בלי ביקורת ברשימה (היא נמחקה, או ירדה מהאתר בדרך אחרת) לא נכנס.
 * הזמנים ב-ISO מ-PostgREST, באותו פורמט, ולכן השוואה של מחרוזות מסדרת לפי זמן.
 */
export function groupReports(
  reviews: readonly ReportedReview[],
  reports: readonly (ReportEntry & { reviewId: string })[],
): ReportQueueItem[] {
  const byReview = new Map<string, ReportEntry[]>();
  for (const { reviewId, ...entry } of reports) {
    const list = byReview.get(reviewId);
    if (list) list.push(entry);
    else byReview.set(reviewId, [entry]);
  }
  const items = reviews.flatMap((review): ReportQueueItem[] => {
    const list = byReview.get(review.reviewId);
    if (!list || list.length === 0) return [];
    const sorted = [...list].sort((a, b) => Number(isUrgent(b.reason)) - Number(isUrgent(a.reason)) || byTime(a, b));
    return [
      {
        ...review,
        reports: sorted,
        urgent: review.status === 'published' && list.some((r) => isUrgent(r.reason)),
        since: [...list].sort(byTime)[0].createdAt,
      },
    ];
  });
  return items.sort((a, b) => Number(b.urgent) - Number(a.urgent) || a.since.localeCompare(b.since));
}
```

- [ ] **Step 8: היומן**

Create `web/src/lib/admin/audit.ts`:

```ts
import { REPORT_REASON_LABEL, isReportReason } from '@/lib/reports/reasons';
import { PROOF_KIND_LABEL, type ProofKind } from '@/lib/reviews/types';
import { fieldLabel } from './course-fields';
import { REJECT_REASONS, isRejectReason } from './reasons';

/** כל הפעולות ש-audit_log מקבל (audit_log_action_check ב-20261115230001_reports_and_transparency.sql). */
export const AUDIT_ACTIONS = [
  'approve',
  'reject',
  'request_more',
  'author_delete',
  'cleanup_delete',
  'course_approve',
  'course_edit',
  'course_reject',
  'join_request_approve',
  'join_request_reject',
  'report_keep',
  'report_hide',
  'report_remove',
  'vendor_response',
  'vendor_response_remove',
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

const isAuditAction = (action: string): action is AuditAction => (AUDIT_ACTIONS as readonly string[]).includes(action);

const LABEL: Record<AuditAction, string> = {
  approve: 'ביקורת אושרה ופורסמה',
  reject: 'ביקורת נדחתה והוחזרה לכותב',
  request_more: 'התבקשה הוכחה נוספת',
  author_delete: 'הכותב מחק ביקורת',
  cleanup_delete: 'טיוטה ישנה נמחקה',
  course_approve: 'שינוי בקורס אושר',
  course_edit: 'קורס תוקן ידנית',
  course_reject: 'שינוי בקורס נדחה',
  join_request_approve: 'בקשה של מוסד אושרה',
  join_request_reject: 'בקשה של מוסד נדחתה',
  report_keep: 'דיווח נסגר, והביקורת נשארה',
  report_hide: 'ביקורת הוסתרה עד בירור',
  report_remove: 'ביקורת הוסרה אחרי דיווח',
  vendor_response: 'תגובת מוסד פורסמה',
  vendor_response_remove: 'תגובת מוסד הוסרה',
};

/** מה קרה, בעברית. פעולה שעוד אין לה מילים מוצגת כמו שהיא, כדי שלא תיעלם מהיומן. */
export const actionLabel = (action: string) => (isAuditAction(action) ? LABEL[action] : action);

/** יש מנהל אחד, ולכן התפקיד ולא המייל. null הוא הניקוי היומי (cleanup_delete). */
export function actorLabel(action: string, actorId: string | null): string {
  if (actorId === null) return 'הניקוי האוטומטי';
  if (action === 'author_delete') return 'הכותב';
  return 'מנהל';
}

const COURSE_KIND: Record<string, string> = {
  new_course: 'קורס חדש',
  maybe_inactive: 'ייתכן שאינו פעיל',
  fetch_failed: 'דף שלא נטען',
};
const text = (value: unknown) => (typeof value === 'string' ? value : null);

/** הקודים מ-details, במילים. ב-details אין טקסט חופשי (החלטה 8 בתוכנית), ולכן אין כאן מה לחתוך. */
export function detailLabel(action: string, details: Record<string, unknown>): string | null {
  switch (action) {
    case 'approve': {
      const kind = text(details.proof_kind);
      const label = kind && Object.hasOwn(PROOF_KIND_LABEL, kind) ? PROOF_KIND_LABEL[kind as ProofKind] : null;
      return [label, details.has_amount === true ? 'עם סכום' : null].filter(Boolean).join(', ') || null;
    }
    case 'reject': {
      const reason = text(details.reason);
      return reason && isRejectReason(reason) ? REJECT_REASONS[reason] : null;
    }
    case 'course_approve':
    case 'course_edit':
    case 'course_reject': {
      const field = text(details.field);
      if (field) return fieldLabel(field);
      const kind = text(details.kind);
      return kind ? (COURSE_KIND[kind] ?? null) : null;
    }
    case 'report_hide':
    case 'report_remove': {
      const reason = details.reason;
      return isReportReason(reason) ? REPORT_REASON_LABEL[reason] : null;
    }
    case 'report_keep':
      return details.was_hidden === true ? 'הביקורת חזרה לאתר' : null;
    default:
      return null;
  }
}

/** שורה ביומן, כמו ש-/admin/log מציג אותה. */
export interface AuditEntry {
  id: number;
  action: string;
  actorId: string | null;
  createdAt: string;
  details: Record<string, unknown>;
  /** על מה: הקורס, או שם המוסד בבקשה. null: הרשומה כבר נמחקה. */
  target: { title: string; href: string | null } | null;
}
```

- [ ] **Step 9: המספרים**

Create `web/src/lib/transparency/numbers.ts`:

```ts
/**
 * מספרי השקיפות (סבב 5, פריט 33): מה עשינו בכל חודש שנגמר, לכל האתר יחד.
 * השורות באות מ-transparency_by_month (20261115230001_reports_and_transparency.sql, סעיף 7).
 */
export interface TransparencyMonth {
  /** היום הראשון של החודש, 'YYYY-MM-DD'. */
  month: string;
  reviewsPublished: number;
  reviewsReturned: number;
  proofsDeleted: number;
  courseChangesApproved: number;
  courseChangesRejected: number;
  reportedKept: number;
  reportedRemoved: number;
}

export type TransparencyCount = Exclude<keyof TransparencyMonth, 'month'>;

/** שורה מהמסד, כמו ש-PostgREST מחזיר אותה. */
export interface TransparencyRow {
  month: string;
  reviews_published: number;
  reviews_returned: number;
  proofs_deleted: number;
  course_changes_approved: number;
  course_changes_rejected: number;
  reported_reviews_kept: number;
  reported_reviews_removed: number;
}

export const toTransparencyMonth = (row: TransparencyRow): TransparencyMonth => ({
  month: row.month,
  reviewsPublished: row.reviews_published,
  reviewsReturned: row.reviews_returned,
  proofsDeleted: row.proofs_deleted,
  courseChangesApproved: row.course_changes_approved,
  courseChangesRejected: row.course_changes_rejected,
  reportedKept: row.reported_reviews_kept,
  reportedRemoved: row.reported_reviews_removed,
});

/** השורות בטבלה בעמוד השיטה, לפי הסדר. */
export const TRANSPARENCY_ROWS: readonly { key: TransparencyCount; label: string }[] = [
  { key: 'reviewsPublished', label: 'ביקורות שפרסמנו' },
  { key: 'reviewsReturned', label: 'ביקורות שהחזרנו לכותבים בלי לפרסם' },
  { key: 'proofsDeleted', label: 'קבצי הוכחה שמחקנו' },
  { key: 'courseChangesApproved', label: 'שינויים בקורסים שאישרנו' },
  { key: 'courseChangesRejected', label: 'שינויים בקורסים שדחינו' },
  { key: 'reportedKept', label: 'ביקורות שדווחו ונשארו' },
  { key: 'reportedRemoved', label: 'ביקורות שהוסרו אחרי דיווח' },
];

export const formatCount = (n: number) => new Intl.NumberFormat('he-IL').format(n);

/** "אוקטובר 2026". UTC, כי month הוא תאריך בלי שעה. */
export const monthName = (iso: string) =>
  new Intl.DateTimeFormat('he-IL', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(iso));

/** המשפט בראש: "באוקטובר 2026 פרסמנו 12 ביקורות, והחזרנו 37 לכותבים בלי לפרסם." */
export function transparencyLead(m: TransparencyMonth): string {
  const published =
    m.reviewsPublished === 0
      ? 'לא פרסמנו אף ביקורת'
      : m.reviewsPublished === 1
        ? 'פרסמנו ביקורת אחת'
        : `פרסמנו ${formatCount(m.reviewsPublished)} ביקורות`;
  const returned =
    m.reviewsReturned === 0
      ? 'ולא החזרנו אף אחת לכותבים'
      : m.reviewsReturned === 1
        ? 'והחזרנו אחת לכותב בלי לפרסם'
        : `והחזרנו ${formatCount(m.reviewsReturned)} לכותבים בלי לפרסם`;
  return `ב${monthName(m.month)} ${published}, ${returned}.`;
}
```

- [ ] **Step 10: הבדיקות עוברות**

```bash
pnpm --dir web test -- src/lib/reports src/lib/admin/audit.test.ts src/lib/transparency
pnpm --dir web lint && pnpm --dir web exec tsc --noEmit && pnpm --dir web test
```

Expected: 9 בדיקות חדשות עוברות (3, 2, 2 ו-2), וכל השאר ירוקות.

- [ ] **Step 11: Commit**

```bash
git add web/src/lib/reports web/src/lib/admin/audit.ts web/src/lib/admin/audit.test.ts web/src/lib/transparency
git commit -m "feat: הלוגיקה של הדיווחים, היומן ומספרי השקיפות, עם בדיקות"
```

שורה בקובץ הסשן.

---

### Task 5: רענון המטמון: הנתיב, הסקריפט והחישוב הלילי (TDD)

**Files:**
- Modify: `web/src/lib/score/recompute.ts` (`RecomputeResult`, ו-`slugs`)
- Create: `web/src/lib/cache/revalidate.ts`
- Test: `web/src/lib/cache/revalidate.test.ts`
- Create: `web/src/lib/cache/revalidate-client.ts`
- Test: `web/src/lib/cache/revalidate-client.test.ts`
- Create: `web/src/lib/cache/refresh.ts`
- Create: `web/src/app/api/revalidate/route.ts`
- Modify: `web/src/app/admin/actions.ts` (סוף `approveReview`)
- Modify: `web/src/app/api/reviews/delete/route.ts` (הרענון בסוף)
- Modify: `web/scripts/recompute-scores.ts` (הקובץ כולו)
- Modify: `.github/workflows/scores-nightly.yml`
- Modify: `web/.env.example`

לפני שכותבים: `web/node_modules/next/dist/docs/01-app/03-api-reference/04-functions/revalidateTag.md` ו-`updateTag.md`. החתימה: `revalidateTag(tag: string, profile: string | { expire?: number }): void`. מ-Route Handler: `{ expire: 0 }`. `updateTag(tag)` רק בתוך Server Action.

- [ ] **Step 1: הבדיקות של הנתיב**

Create `web/src/lib/cache/revalidate.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { ALWAYS_TAGS, bearerToken, tagsFromBody, tokenMatches } from './revalidate';

describe('tagsFromBody', () => {
  it('refreshes the catalog, the numbers, and each course once', () => {
    expect(tagsFromBody('{"courses":["full-stack-sample","baking-sample","full-stack-sample"]}')).toEqual([
      ...ALWAYS_TAGS,
      'course:full-stack-sample',
      'course:baking-sample',
    ]);
    expect(tagsFromBody('{"courses":[]}')).toEqual([...ALWAYS_TAGS]);
  });

  it('refuses anything that is not a short list of course addresses', () => {
    const tooMany = JSON.stringify({ courses: Array.from({ length: 501 }, (_, i) => `c-${i}`) });
    for (const raw of [
      '',
      'nope',
      'null',
      '{}',
      '{"courses":"all"}',
      '{"courses":["Full"]}',
      '{"courses":["a_b"]}',
      '{"courses":["../catalog"]}',
      '{"courses":[1]}',
      `{"courses":["${'a'.repeat(121)}"]}`,
      tooMany,
    ]) {
      expect(tagsFromBody(raw), raw.slice(0, 40)).toBeNull();
    }
  });
});

describe('the token', () => {
  it('matches only the whole token, and never a short one', () => {
    const token = 'k'.repeat(40);
    expect(tokenMatches(token, token)).toBe(true);
    expect(tokenMatches(`${token}x`, token)).toBe(false);
    expect(tokenMatches('', token)).toBe(false);
    expect(tokenMatches('short', 'short')).toBe(false);
  });

  it('is read from a Bearer header only', () => {
    expect(bearerToken('Bearer abc')).toBe('abc');
    expect(bearerToken('bearer abc')).toBe('');
    expect(bearerToken('Basic abc')).toBe('');
    expect(bearerToken(null)).toBe('');
  });
});
```

- [ ] **Step 2: הבדיקות של הלקוח**

Create `web/src/lib/cache/revalidate-client.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { requestRevalidation, revalidateTarget } from './revalidate-client';

const TOKEN = 't'.repeat(40);
const LIVE_DB = 'https://example.supabase.co';
const LOCAL_DB = 'http://127.0.0.1:54321';
const SEND = { kind: 'send', endpoint: 'https://lamadti.example/api/revalidate', token: TOKEN } as const;

describe('revalidateTarget', () => {
  it('sends only with a token and a site, in the same environment as the database', () => {
    expect(revalidateTarget({})).toMatchObject({ kind: 'skip' });
    expect(revalidateTarget({ REVALIDATE_TOKEN: TOKEN })).toMatchObject({ kind: 'skip' });
    expect(revalidateTarget({ REVALIDATE_TOKEN: TOKEN, REVALIDATE_URL: 'http://lamadti.example' })).toMatchObject({ kind: 'skip' });
    expect(
      revalidateTarget({ REVALIDATE_TOKEN: TOKEN, REVALIDATE_URL: 'https://lamadti.example', NEXT_PUBLIC_SUPABASE_URL: LOCAL_DB }),
    ).toMatchObject({ kind: 'skip' });
    expect(
      revalidateTarget({ REVALIDATE_TOKEN: TOKEN, REVALIDATE_URL: 'http://localhost:3000', NEXT_PUBLIC_SUPABASE_URL: LIVE_DB }),
    ).toMatchObject({ kind: 'skip' });
    expect(
      revalidateTarget({ REVALIDATE_TOKEN: TOKEN, REVALIDATE_URL: 'https://lamadti.example/', NEXT_PUBLIC_SUPABASE_URL: LIVE_DB }),
    ).toEqual(SEND);
    expect(
      revalidateTarget({ REVALIDATE_TOKEN: TOKEN, REVALIDATE_URL: 'http://localhost:3000', NEXT_PUBLIC_SUPABASE_URL: LOCAL_DB }),
    ).toEqual({ kind: 'send', endpoint: 'http://localhost:3000/api/revalidate', token: TOKEN });
  });
});

describe('requestRevalidation', () => {
  it('posts the courses in chunks of 500, with the token only in the header', async () => {
    const calls: RequestInit[] = [];
    const fake = (async (_url: string | URL | Request, init?: RequestInit) => {
      calls.push(init ?? {});
      return new Response('{"ok":true}', { status: 200 });
    }) as typeof fetch;
    const slugs = Array.from({ length: 1001 }, (_, i) => `course-${i}`);
    expect(await requestRevalidation(slugs, SEND, fake)).toBe(3);
    expect(calls.map((c) => (JSON.parse(String(c.body)) as { courses: string[] }).courses.length)).toEqual([500, 500, 1]);
    expect(new Headers(calls[0].headers).get('authorization')).toBe(`Bearer ${TOKEN}`);
    expect(String(calls[0].body)).not.toContain(TOKEN);
  });

  it('fails with the status, and never with the token', async () => {
    const fake = (async () => new Response('{"error":"unauthorized"}', { status: 401 })) as typeof fetch;
    const error = await requestRevalidation(['a'], SEND, fake).catch((e: unknown) => e as Error);
    expect(error.message).toContain('401');
    expect(error.message).not.toContain(TOKEN);
  });
});
```

- [ ] **Step 3: הבדיקות נכשלות**

```bash
pnpm --dir web test -- src/lib/cache
```

Expected: שני הקבצים נכשלים, כי `./revalidate` ו-`./revalidate-client` לא קיימים.

- [ ] **Step 4: הלוגיקה של הנתיב**

Create `web/src/lib/cache/revalidate.ts`:

```ts
import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * POST /api/revalidate (סבב 5, פריט 36): מה הנתיב מקבל, ואיך הוא בודק את הטוקן. טהור, עם בדיקות יחידה.
 * הנתיב עצמו: web/src/app/api/revalidate/route.ts. מי ששולח: web/src/lib/cache/revalidate-client.ts.
 */

/** כמה קורסים בבקשה אחת. הלקוח שולח בחלקים. */
export const MAX_COURSES_PER_REQUEST = 500;
/** הגוף, בבתים: 500 כתובות של עד 120 תווים, עם מרווח. */
export const MAX_REVALIDATE_BODY = 80_000;
/** טוקן בשרת קצר מזה: הנתיב סגור (503), כדי שטעות בהגדרה לא תפתח אותו. */
export const MIN_TOKEN_LENGTH = 32;
/** תמיד: הקטלוג (הציונים ברשימות, ועמודי מוסד ומרצה) ומספרי השקיפות. */
export const ALWAYS_TAGS = ['catalog', 'transparency'] as const;

/** אותו כלל כמו courses.slug במסד. תגית עד 256 תווים (revalidateTag.md), ולכן slug עד 120. */
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const SLUG_MAX = 120;

/** { courses: [slug, ...] } → התגיות לרענון, כל אחת פעם אחת. null: גוף לא תקין. */
export function tagsFromBody(raw: string): string[] | null {
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return null;
  }
  const courses = (body as { courses?: unknown } | null)?.courses;
  if (!Array.isArray(courses) || courses.length > MAX_COURSES_PER_REQUEST) return null;
  if (!courses.every((slug) => typeof slug === 'string' && slug.length <= SLUG_MAX && SLUG.test(slug))) return null;
  return [...ALWAYS_TAGS, ...new Set(courses.map((slug: string) => `course:${slug}`))];
}

/**
 * השוואה בזמן קבוע: SHA-256 של שני הצדדים, באותו אורך, ואז timingSafeEqual. כך גם האורך של הטוקן לא דולף.
 * טוקן צפוי קצר מ-32 תווים לא מתאים לאף טוקן.
 */
export function tokenMatches(given: string, expected: string): boolean {
  if (expected.length < MIN_TOKEN_LENGTH) return false;
  const a = createHash('sha256').update(given).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

/** הטוקן מ-"Authorization: Bearer <טוקן>". '' כשאין, או בכל צורה אחרת. */
export function bearerToken(header: string | null): string {
  const match = header?.match(/^Bearer (\S+)$/);
  return match ? match[1] : '';
}
```

- [ ] **Step 5: הלקוח**

Create `web/src/lib/cache/revalidate-client.ts`:

```ts
import { MAX_COURSES_PER_REQUEST } from './revalidate';

/** לאן לשלוח את הרענון, או למה לדלג. */
export type RevalidateTarget = { kind: 'skip'; reason: string } | { kind: 'send'; endpoint: string; token: string };

const isLocalHost = (host: string) => host === 'localhost' || host === '127.0.0.1';
const hostOf = (url: string | undefined): string | null => {
  try {
    return url ? new URL(url).hostname : null;
  } catch {
    return null;
  }
};

/**
 * מהסביבה של הסקריפט (process.env). בלי REVALIDATE_TOKEN או REVALIDATE_URL: מדלגים. כך מקומית, וב-GitHub עד
 * שגל מוסיף את הסוד. מסד מקומי אף פעם לא מרענן את האתר באוויר, ולהפך. באוויר רק https.
 */
export function revalidateTarget(env: Record<string, string | undefined>): RevalidateTarget {
  const token = env.REVALIDATE_TOKEN?.trim();
  const base = env.REVALIDATE_URL?.trim();
  if (!token) return { kind: 'skip', reason: 'REVALIDATE_TOKEN is not set' };
  if (!base) return { kind: 'skip', reason: 'REVALIDATE_URL is not set' };
  let endpoint: URL;
  try {
    endpoint = new URL('/api/revalidate', base);
  } catch {
    return { kind: 'skip', reason: 'REVALIDATE_URL is not a URL' };
  }
  const siteIsLocal = isLocalHost(endpoint.hostname);
  if (endpoint.protocol !== 'https:' && !siteIsLocal) return { kind: 'skip', reason: 'REVALIDATE_URL must use https' };
  const dbHost = hostOf(env.NEXT_PUBLIC_SUPABASE_URL);
  if (dbHost !== null && isLocalHost(dbHost) !== siteIsLocal) {
    return { kind: 'skip', reason: 'the database and the site are different environments' };
  }
  return { kind: 'send', endpoint: endpoint.href, token };
}

/**
 * שולח את כל הכתובות, בחלקים של 500, ומחזיר כמה בקשות נשלחו. גם רשימה ריקה שולחת בקשה אחת: הקטלוג
 * והמספרים מתרעננים. שגיאה: רק הסטטוס. אף פעם לא הטוקן, ולא גוף התשובה.
 */
export async function requestRevalidation(
  slugs: readonly string[],
  target: Extract<RevalidateTarget, { kind: 'send' }>,
  fetchImpl: typeof fetch = fetch,
): Promise<number> {
  const chunks: string[][] = [];
  for (let i = 0; i < slugs.length; i += MAX_COURSES_PER_REQUEST) chunks.push(slugs.slice(i, i + MAX_COURSES_PER_REQUEST));
  if (chunks.length === 0) chunks.push([]);
  for (const courses of chunks) {
    const response = await fetchImpl(target.endpoint, {
      method: 'POST',
      headers: { authorization: `Bearer ${target.token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ courses }),
    });
    if (!response.ok) throw new Error(`revalidate failed with status ${response.status}`);
  }
  return chunks.length;
}
```

- [ ] **Step 6: הבדיקות עוברות**

```bash
pnpm --dir web test -- src/lib/cache
```

Expected: 7 בדיקות עוברות.

- [ ] **Step 7: החישוב מחזיר את הקורסים שחושבו**

ב-`web/src/lib/score/recompute.ts`:

ב-`RecomputeResult`, אחרי `lines`:

```ts
  /** הכתובות של הקורסים שהציון שלהם נשמר. מי שמחשב מרענן את כולם (סבב 5, פריט 36). */
  slugs: string[];
```

בתחילת `recomputeAllScores`, אחרי `const lines: string[] = [];`:

```ts
  const slugs: string[] = [];
```

אחרי השורה `lines.push(\`${course.slug}: ${result.status} ${shown} (${result.reviewCount} reviews)\`);`:

```ts
      slugs.push(course.slug);
```

ובסוף הפונקציה, במקום `return { lines, failures };`:

```ts
  return { lines, slugs, failures };
```

- [ ] **Step 8: הרענון בתוך פעולות השרת**

Create `web/src/lib/cache/refresh.ts`:

```ts
import 'server-only';
import { updateTag } from 'next/cache';

/**
 * אחרי חישוב ציונים: כל עמוד קורס שחושב, והקטלוג, מתרעננים מיד (סבב 5, פריט 36). ממוצע התחום משותף,
 * ולכן ביקורת אחת מזיזה גם ציונים של קורסים אחרים. הבקשה הבאה לכל עמוד מחכה לנתונים החדשים.
 * רק בתוך Server Action (updateTag.md). בנתיב API: revalidateTag(tag, { expire: 0 }).
 */
export function refreshCourses(slugs: Iterable<string>): void {
  for (const slug of new Set(slugs)) updateTag(`course:${slug}`);
  updateTag('catalog');
}
```

ב-`web/src/app/admin/actions.ts`:

בייבוא, מוסיפים:

```ts
import { refreshCourses } from '@/lib/cache/refresh';
```

ומ-`import { refresh, updateTag } from 'next/cache';` מורידים את `updateTag`:

```ts
import { refresh } from 'next/cache';
```

ב-`approveReview`, במקום הבלוק מ-`// ממוצע התחום משתנה` ועד `return { status: 'done', message: 'פורסם.', warning };`:

```ts
  // ממוצע התחום משתנה, ולכן כל הקורסים, כמו score:recompute.
  let warning: string | undefined;
  let recomputed: string[] = [];
  try {
    const { failures, slugs } = await recomputeAllScores(gate.db, new Date());
    recomputed = slugs;
    if (failures.length > 0) {
      console.error(`recompute after approve: ${failures.length} course(s) failed`);
      warning = `חישוב הציונים נכשל ב-${failures.length} קורסים. להריץ pnpm --dir web score:recompute.`;
    }
  } catch (recomputeError) {
    console.error('recompute after approve failed', recomputeError instanceof Error ? recomputeError.message : 'unknown');
    warning = 'חישוב הציונים נכשל. להריץ pnpm --dir web score:recompute.';
  }
  // מיד, ולא ברקע: הקורס עצמו, כל קורס שהציון שלו חושב, והקטלוג (updateTag.md). גם מרנדר מחדש את התור
  // באותה תשובה (server-actions.md, "A single response carries data and UI").
  refreshCourses([slug, ...recomputed]);
  return { status: 'done', message: 'פורסם.', warning };
```

ב-`web/src/app/api/reviews/delete/route.ts`, במקום הבלוק `if (row?.was_published) { ... }`:

```ts
  if (row?.was_published) {
    // הביקורת כבר נמחקה. חישוב שנכשל לא מחזיר שגיאה לכותב: נרשם ביומן, ו-`pnpm score:recompute` משלים.
    let recomputed: string[] = [];
    try {
      const { failures, slugs } = await recomputeAllScores(admin, new Date());
      recomputed = slugs;
      if (failures.length > 0) console.error(`recompute after delete: ${failures.length} course(s) failed`);
    } catch (error) {
      console.error('recompute after delete failed', error instanceof Error ? error.message : 'unknown error');
    }
    // { expire: 0 }: הבקשה הבאה מחכה לנתונים חדשים (revalidateTag.md). הצורה בלי פרופיל היא deprecated.
    // כל קורס שחושב, כי ממוצע התחום משותף (סבב 5, פריט 36).
    for (const slug of new Set([row.course_slug, ...recomputed])) revalidateTag(`course:${slug}`, { expire: 0 });
    revalidateTag('catalog', { expire: 0 });
  }
```

- [ ] **Step 9: הנתיב**

Create `web/src/app/api/revalidate/route.ts`:

```ts
import { revalidateTag } from 'next/cache';
import { MAX_REVALIDATE_BODY, MIN_TOKEN_LENGTH, bearerToken, tagsFromBody, tokenMatches } from '@/lib/cache/revalidate';
import { readCapped } from '@/lib/server/read-capped';

/**
 * POST /api/revalidate, עם "Authorization: Bearer <REVALIDATE_TOKEN>" ו-{ "courses": [slug, ...] }, עד 500.
 * מרענן מיד את הקטלוג, את מספרי השקיפות ואת העמוד של כל קורס ברשימה (סבב 5, פריט 36).
 * הסקריפט של חישוב הציונים קורא לו בסוף (web/scripts/recompute-scores.ts), גם בחישוב הלילי ב-GitHub Actions.
 * לא נקרא מדפדפן: הטוקן בכותרת ולא בעוגייה, ולכן אין כאן CSRF.
 * { expire: 0 }: הבקשה הבאה לעמוד מחכה לנתונים החדשים. מחוץ ל-Server Action אין updateTag (revalidateTag.md).
 * בלי טוקן בשרת, או קצר מ-32 תווים: 503, והנתיב סגור. טוקן שגוי: 401, בלי לומר מה לא נכון.
 * הטוקן נבדק לפני שקוראים את הגוף. אף שורה כאן לא מדפיסה אותו.
 */
export async function POST(request: Request) {
  const expected = process.env.REVALIDATE_TOKEN ?? '';
  if (expected.length < MIN_TOKEN_LENGTH) return Response.json({ error: 'not_configured' }, { status: 503 });
  if (!tokenMatches(bearerToken(request.headers.get('authorization')), expected)) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  const raw = await readCapped(request, MAX_REVALIDATE_BODY);
  const tags = raw === null ? null : tagsFromBody(raw);
  if (!tags) return Response.json({ error: 'bad_request' }, { status: 400 });

  for (const tag of tags) revalidateTag(tag, { expire: 0 });
  return Response.json({ ok: true, tags: tags.length });
}
```

- [ ] **Step 10: הסקריפט**

Replace `web/scripts/recompute-scores.ts` כולו:

```ts
import { createClient } from '@supabase/supabase-js';
import { requestRevalidation, revalidateTarget } from '../src/lib/cache/revalidate-client';
import type { Database } from '../src/lib/database.types';
import { recomputeAllScores } from '../src/lib/score/recompute';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY');
const db = createClient<Database>(url, secret, { auth: { persistSession: false } });

/**
 * `pnpm score:recompute`: כל הציונים מחדש. הלוגיקה ב-src/lib/score/recompute.ts, משותפת לשרת.
 * בסוף: רענון מיידי של הקטלוג, של המספרים ושל כל עמוד קורס שחושב, דרך /api/revalidate (סבב 5, פריט 36).
 * בלי REVALIDATE_TOKEN או REVALIDATE_URL: מדלג על הרענון, והדפים מתרעננים לבד תוך שעה (cacheLife('hours')).
 * רענון שנכשל: יציאה עם 1, אחרי שהציונים כבר נשמרו. ביומן רק השרת והמספרים, אף פעם לא הטוקן.
 */
async function main() {
  console.log(`target: ${new URL(url!).host}`);
  const { lines, slugs, failures } = await recomputeAllScores(db, new Date());
  for (const line of lines) console.log(line);
  for (const { slug, error } of failures) console.error(`${slug}: failed`, error);

  let failed = failures.length > 0;
  const target = revalidateTarget(process.env);
  if (target.kind === 'skip') {
    console.log(`skip revalidate: ${target.reason}`);
  } else {
    try {
      const requests = await requestRevalidation(slugs, target);
      console.log(
        `revalidated the catalog and ${slugs.length} course page(s) on ${new URL(target.endpoint).host}, in ${requests} request(s)`,
      );
    } catch (error) {
      console.error(error instanceof Error ? error.message : 'revalidate failed');
      failed = true;
    }
  }

  if (failures.length > 0) console.error(`${failures.length} course(s) failed`);
  if (failed) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

- [ ] **Step 11: החישוב הלילי**

ב-`.github/workflows/scores-nightly.yml`:

בהערה בראש הקובץ, אחרי השורה של `schedule`, מוסיפים:

```yaml
# בסוף, הסקריפט מרענן את הדפים באתר דרך /api/revalidate (סבב 5, פריט 36). בלי REVALIDATE_TOKEN: רק הודעה,
# והדפים מתרעננים לבד תוך שעה.
```

תחת `env:` של ה-job, אחרי `SUPABASE_SECRET_KEY`:

```yaml
      # לאן לשלוח את הרענון: הכתובת של האתר באוויר, ולא סוד. הטוקן רק ב-GitHub Secrets.
      REVALIDATE_URL: https://course-compare-il.vercel.app
      REVALIDATE_TOKEN: ${{ secrets.REVALIDATE_TOKEN }}
```

בצעד `Skip without the secret key`, במקום הענף `else`:

```yaml
          else
            echo "run=true" >> "$GITHUB_OUTPUT"
            if [ -z "$REVALIDATE_TOKEN" ]; then
              echo "::notice::REVALIDATE_TOKEN is not in GitHub Secrets yet. Scores are recomputed, and the pages refresh on their own within an hour."
            fi
          fi
```

- [ ] **Step 12: `.env.example`**

בסוף `web/.env.example`:

```
# אופציונלי וסודי: הטוקן של /api/revalidate, שמרענן את הדפים אחרי חישוב הציונים. לפחות 32 תווים.
# באוויר: ב-Vercel וב-GitHub Secrets בלבד. מקומית רק לבדיקה של הנתיב, עם טוקן זמני אחר.
REVALIDATE_TOKEN=
# לאן הסקריפט של הציונים שולח את הרענון. ב-GitHub Actions: הכתובת של האתר באוויר. מקומית: ריק, או
# http://localhost:3000 לבדיקה. מסד מקומי לא מרענן אתר באוויר.
REVALIDATE_URL=
```

- [ ] **Step 13: ירוק**

```bash
pnpm --dir web lint && pnpm --dir web exec tsc --noEmit && pnpm --dir web test
pnpm --dir web build
```

Expected: הכול עובר. בפלט של הבנייה, `/api/revalidate` מופיע כנתיב דינמי (ƒ).

- [ ] **Step 14: הנתיב, מקומית, עם טוקן זמני**

טוקן זמני לבדיקה בלבד, בקובץ שלא נשמר ב-git. לא מדפיסים אותו:

```bash
cd "C:/Users/galsa/Desktop/קורסים השוואות"
node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))" > web/test-results/revalidate-token.txt
```

בטרמינל נפרד (Git Bash), מהתיקייה של הפרויקט:

```bash
REVALIDATE_TOKEN="$(cat web/test-results/revalidate-token.txt)" pnpm --dir web start
```

ואז:

```bash
T="$(cat web/test-results/revalidate-token.txt)"
curl -s -o /dev/null -w "%{http_code} no token\n" -X POST http://localhost:3000/api/revalidate -d '{"courses":[]}'
curl -s -o /dev/null -w "%{http_code} wrong token\n" -X POST -H "authorization: Bearer nope" http://localhost:3000/api/revalidate -d '{"courses":[]}'
curl -s -o /dev/null -w "%{http_code} bad body\n" -X POST -H "authorization: Bearer $T" http://localhost:3000/api/revalidate -d '{"courses":["../x"]}'
curl -s -w " ok\n" -X POST -H "authorization: Bearer $T" -H "content-type: application/json" http://localhost:3000/api/revalidate -d '{"courses":["full-stack-sample"]}'
curl -s -o /dev/null -w "%{http_code} get\n" http://localhost:3000/api/revalidate
REVALIDATE_URL=http://localhost:3000 REVALIDATE_TOKEN="$T" pnpm --dir web score:recompute | tail -2
unset T
rm web/test-results/revalidate-token.txt
```

Expected:
- `401 no token`, `401 wrong token`, `400 bad body`;
- `{"ok":true,"tags":3} ok`;
- `405 get`;
- השורה האחרונה של הסקריפט: `revalidated the catalog and N course page(s) on localhost:3000, in 1 request(s)`.

עוצרים את השרת. מריצים שוב `pnpm --dir web score:recompute` בלי המשתנים, ומצפים לשורה `skip revalidate: REVALIDATE_TOKEN is not set`.

- [ ] **Step 15: Commit**

```bash
git add web/src/lib/cache web/src/lib/score/recompute.ts web/src/app/api/revalidate web/src/app/admin/actions.ts web/src/app/api/reviews/delete/route.ts web/scripts/recompute-scores.ts .github/workflows/scores-nightly.yml web/.env.example
git commit -m "feat: רענון מיידי אחרי חישוב ציונים, דרך /api/revalidate עם טוקן, ובחישוב הלילי"
```

שורה בקובץ הסשן, עם התוצאות של צעד 14: "נבדק מקומית".

---

### Task 6: "לדווח" בעמוד הקורס (Impeccable)

**Files:**
- Create: `.impeccable/surfaces/` (חוזה חדש, דרך `impeccable surface-brief write`)
- Create: `web/src/app/courses/[slug]/report-actions.ts`
- Create: `web/src/components/course/report-review.tsx`
- Modify: `web/src/components/course/reviews-section.tsx` (הייבוא, ה-`ReadTracker` והשורה של "עזר לי")
- Modify: `web/src/components/course/read-tracker.tsx` (ה-`article`)
- Test: `web/e2e/report.spec.ts`

- [ ] **Step 1: חוזה העיצוב**

הקובץ הזמני נכתב ל-`web/test-results/`, שלא נשמר ב-git.

```bash
cd "C:/Users/galsa/Desktop/קורסים השוואות"
mkdir -p web/test-results
cat > web/test-results/report-review-brief.md <<'EOF'
# דיווח על ביקורת

**היקף:** הקישור "לדווח" מתחת לכל ביקורת בעמוד הקורס, והטופס הקצר שנפתח ממנו. קודם לנייד, בעברית מימין לשמאל. המבקר עושה פעולה אחת קטנה (mode: operate).
**מי מגיע:** קורא שראה בביקורת שם של אדם פרטי, טלפון או עובדה לא נכונה, או חושד שמי שכתב לא למד בקורס. גם מוסד שרוצה להגיב.
**המשימה:** לבחור סיבה, להוסיף מילה אם רוצים, ולשלוח. בלי חשבון.
**התוכן:** חמש סיבות, שדה רשות (חובה ב"סיבה אחרת"), שורה שאומרת שהביקורת נשארת באתר בזמן הבדיקה ושדעה נשארת, "לשלוח את הדיווח" ו"ביטול". אחרי השליחה, בעט: "תודה. נבדוק את הדיווח."
**מגבלות:** שקט ולא מבהיל: בלי אדום, בלי סימן אזהרה, בלי מרקר ובלי פתק. "עזר לי" נשאר הפעולה הבולטת מתחת לביקורת. הטופס לא מכסה את הביקורת: לא חלון קופץ.

## Direction contract

THESIS: הערה קטנה בשולי הפתק, ולא כפתור אזעקה. מי שקורא יכול לסמן שמשהו לא בסדר, באותה יד שקטה של הדף. מוותר על חלון קופץ, על צבע אזהרה ועל דגל.

OWN-WORLD: אותו דף מודפס של עמוד הקורס. "לדווח" באפור רך, ב-IBM Plex Sans Hebrew, באותה שורה של "עזר לי". הטופס נפתח על הדף, מתחת לפתק: הסיבות כרדיו אמיתי, השדה בדיו, והתודה בעט כחול, כי זה הקול של האתר.

STORY: המבקר קורא ביקורת, רואה בה טלפון של מרצה, ולוחץ "לדווח". מתחת לפתק נפתחות חמש סיבות. הוא בוחר, שולח, והעט כותב "תודה. נבדוק את הדיווח." הביקורת לא זזה.

FIRST VIEWPORT: הפתק של הביקורת, ומתחתיו שורה אחת: "עזר לי" ו"לדווח". אחרי לחיצה: הטופס מתחת לפתק, והפתק עדיין על המסך.

FORM: הרחבה של העולם של עמוד הקורס, במצב Operate. פקדים רגילים (radio, textarea, buttonVariants) בגופן ובצבעים של הדף. seed:c81c41ae8e27158d

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
EOF
.claude/skills/impeccable/scripts/impeccable surface-brief write web/src/components/course/report-review.tsx web/test-results/report-review-brief.md web/src/components/course/reviews-section.tsx
.claude/skills/impeccable/scripts/impeccable surface-brief list
```

Expected: ברשימה חוזה חדש, שה-target הראשי שלו `web/src/components/course/report-review.tsx`.

- [ ] **Step 2: Impeccable לפני כל עריכת ממשק**

1. טוענים את ה-skill `/impeccable`. אם `.claude/skills/impeccable` חסרה: `npx impeccable install` מתיקיית הפרויקט.
2. Run:
   ```bash
   .claude/skills/impeccable/scripts/impeccable context --target web/src/components/course/report-review.tsx
   ```
   ב-PowerShell או ב-cmd: `.claude\skills\impeccable\scripts\impeccable.cmd context --target web/src/components/course/report-review.tsx`. ממלאים את ההוראות שהפקודה מדפיסה, ולא מריצים אותה שוב.
3. קוראים את `.claude/skills/impeccable/reference/craft-floor.md` ואת `.claude/skills/impeccable/reference/mode-operate.md`.
4. **הכללים, מ-`DESIGN.md`:**
   - **הגופנים:** IBM Plex Sans Hebrew לכל הדיו. התודה בעט: Rubik, בכחול.
   - **בלי צבע מקור:** בלי מרקר, פתק או אדום. דיווח הוא פעולה, לא מקור של מידע (The Source Is The Color Rule).
   - **"לדווח":** פחות בולט מ"עזר לי". אפור רך, ובריחוף קו וצבע של קישור.
   - **הסיבות:** קבוצת רדיו אמיתית. כל שורה לפחות 44 פיקסלים.
   - **תנועה:** בלי JavaScript חדש. אם התודה היא `PenNote`, היא נכתבת לבד (`data-anim="write"`).
   - **הגודל:** קודם לנייד, ברוחב 390. במחשב הפתקים צרים (עד 340 פיקסלים), והטופס ברוחב הפתק.

הקוד בצעדים הבאים הוא נקודת ההתחלה, ועובד. Impeccable משפר אותו בתוך העולם, ולא משנה את מה שבדיקת הקצה מחפשת:
- "לדווח על הביקורת" (השם של הכפתור);
- "דיווח על הביקורת" (התווית של הטופס);
- הסיבות כמו ב-`REPORT_REASON_LABEL`;
- "מה עוד חשוב שנדע? (רשות)" ו"לשלוח את הדיווח";
- "בחרו מה הבעיה." ו"תודה. נבדוק את הדיווח.";
- `id="review-<id>"` על כל ביקורת.

- [ ] **Step 3: הפעולה בשרת**

Create `web/src/app/courses/[slug]/report-actions.ts`:

```ts
'use server';

import { createHmac } from 'node:crypto';
import { headers } from 'next/headers';
import { parseReportForm, type ReportField } from '@/lib/reports/reasons';
import { createAdminClient } from '@/lib/supabase/admin-client';

export type ReportState =
  | { status: 'idle' }
  | { status: 'invalid'; field: ReportField | null; message: string }
  | { status: 'sent' };

const NOT_NOW: ReportState = { status: 'invalid', field: null, message: 'אי אפשר לדווח עכשיו. נסו שוב מאוחר יותר.' };

/**
 * דיווח על ביקורת, בלי חשבון (מסמך העיצוב של סבב 5, סעיף 3). לאורח אין שום הרשאה על reports: הכתיבה עוברת
 * כאן, עם המפתח הסודי, דרך submit_review_report, שבודקת את מגבלת הקצב במסד (5 ביממה לכתובת, 300 בסך הכול).
 * Next בודק ש-Origin תואם ל-Host (server-actions.md, "CSRF check"). שדה המלכודת עוצר בוטים פשוטים.
 * אותו דפוס כמו הבקשה של מוסד (app/institutions/join/actions.ts).
 */
export async function reportReview(_previous: ReportState, form: FormData): Promise<ReportState> {
  // שדה שבן אדם לא רואה ולא ממלא. בוט שממלא אותו מקבל את אותה תשובה, ושום דבר לא נשמר.
  if (String(form.get('website') ?? '') !== '') return { status: 'sent' };

  const parsed = parseReportForm(form);
  if (!parsed.ok) return { status: 'invalid', field: parsed.field, message: parsed.message };

  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) return NOT_NOW;
  let db: ReturnType<typeof createAdminClient>;
  try {
    db = createAdminClient();
  } catch {
    return NOT_NOW;
  }

  // ב-Vercel הכתובת הראשונה ב-x-forwarded-for היא של המבקר (כמו ב-institutions/join). נשמרת רק טביעה: HMAC
  // עם המפתח הסודי, וקידומת משלה, כדי שאי אפשר יהיה לשחזר את הכתובת, ולא לקשר בין שני הטפסים.
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  const clientHash = createHmac('sha256', secret).update(`review-report:${ip}`).digest('hex');

  const { reviewId, reason, details } = parsed.values;
  const { error } = await db.rpc('submit_review_report', {
    p_review_id: reviewId,
    p_reason: reason,
    p_client_hash: clientHash,
    ...(details ? { p_details: details } : {}),
  });
  if (error) {
    if (error.code === 'LM030') {
      return { status: 'invalid', field: null, message: 'כבר קיבלנו מכם חמישה דיווחים היום. אפשר לדווח שוב מחר.' };
    }
    if (error.code === 'LM031') {
      return { status: 'invalid', field: null, message: 'הגיעו היום הרבה דיווחים, והטופס נסגר עד מחר. נסו שוב מחר.' };
    }
    if (error.code === 'P0002') return { status: 'invalid', field: null, message: 'הביקורת כבר לא מוצגת באתר.' };
    console.error('review report failed', error.code);
    return { status: 'invalid', field: null, message: 'הדיווח לא נשלח. נסו שוב בעוד כמה דקות.' };
  }
  // 'duplicate': אותה תשובה, כדי לא לגלות מה נשלח מהכתובת הזו קודם.
  return { status: 'sent' };
}
```

- [ ] **Step 4: הטופס**

Create `web/src/components/course/report-review.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { useActionState, useEffect, useId, useRef, useState } from 'react';
import { reportReview, type ReportState } from '@/app/courses/[slug]/report-actions';
import { buttonVariants } from '@/components/ui/button';
import { DETAILS_MAX, REPORT_REASONS, REPORT_REASON_LABEL, type ReportReason } from '@/lib/reports/reasons';
import { cn } from '@/lib/utils';

const IDLE: ReportState = { status: 'idle' };

const quietLink = 'inline-flex h-11 items-center underline-offset-[3px] hover:text-link-hover hover:underline';

/**
 * "לדווח": קישור שקט ליד "עזר לי", שנפתח לטופס קצר מתחת לפתק (מסמך העיצוב של סבב 5, סעיף 3). בלי חשבון.
 * לא מבהיל: אפור רך, בלי צבע ובלי סימן אזהרה. הביקורת נשארת באתר בזמן הבדיקה, וזה כתוב בטופס.
 * הבחירה והטקסט נשמרים ב-state: אחרי פעולה, React מאפס שדות שלא נשלטים, וטעות לא אמורה למחוק את מה שנכתב.
 * אחרי השליחה הטופס נסגר, והעט אומר תודה. הפוקוס עובר לשורה הזו, כדי שקורא מסך ישמע אותה.
 */
export function ReportReview({ reviewId }: { reviewId: string }) {
  const [open, setOpen] = useState(false);
  const [state, dispatch, pending] = useActionState(reportReview, IDLE);
  const [reason, setReason] = useState<ReportReason | ''>('');
  const [details, setDetails] = useState('');
  const formId = useId();
  const detailsId = useId();
  const errorId = useId();
  const toggle = useRef<HTMLButtonElement>(null);
  const thanks = useRef<HTMLParagraphElement>(null);
  const sent = state.status === 'sent';
  const error = state.status === 'invalid' ? state : null;

  useEffect(() => {
    if (sent) thanks.current?.focus();
  }, [sent]);

  if (sent) {
    return (
      <p
        ref={thanks}
        tabIndex={-1}
        role="status"
        className="flex min-h-11 basis-full items-center font-pen text-[15px] leading-snug font-medium text-pen outline-none"
      >
        תודה. נבדוק את הדיווח.
      </p>
    );
  }

  return (
    <>
      <button
        ref={toggle}
        type="button"
        aria-expanded={open}
        aria-controls={formId}
        onClick={() => setOpen((o) => !o)}
        className={cn(quietLink, 'font-sans text-sm font-semibold text-ink-soft')}
      >
        לדווח<span className="sr-only"> על הביקורת</span>
      </button>
      {open && (
        <form
          id={formId}
          action={dispatch}
          aria-label="דיווח על הביקורת"
          noValidate
          className="basis-full space-y-3 border-t border-rule pt-3 pb-1 font-sans text-[15px] leading-normal"
        >
          <input type="hidden" name="reviewId" value={reviewId} />
          <fieldset aria-describedby={error?.field === 'reason' ? errorId : undefined}>
            <legend className="font-semibold">מה הבעיה בביקורת?</legend>
            <div className="mt-1">
              {REPORT_REASONS.map((r) => (
                <label key={r} className="flex min-h-11 items-center gap-2.5">
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="size-4 flex-none accent-ink"
                  />
                  {REPORT_REASON_LABEL[r]}
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <label htmlFor={detailsId} className="block font-semibold">
              {reason === 'other' ? 'מה הבעיה?' : 'מה עוד חשוב שנדע? (רשות)'}
            </label>
            <textarea
              id={detailsId}
              name="details"
              rows={3}
              maxLength={DETAILS_MAX}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              aria-invalid={error?.field === 'details' ? true : undefined}
              aria-describedby={error?.field === 'details' ? errorId : undefined}
              className="mt-1 block w-full rounded-[4px] border border-ink bg-white p-2.5 text-[15px] text-ink"
            />
          </div>
          {/* מלכודת לבוטים: מוסתרת מהעין ומקורא מסך, בלי טאב ובלי מילוי אוטומטי (report-actions.ts). */}
          <div aria-hidden="true" className="sr-only">
            <label>
              האתר שלכם
              <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
            </label>
          </div>
          <p className="text-[13px] leading-normal text-pretty text-ink-soft">
            הביקורת נשארת באתר בזמן שאנחנו בודקים. דעה של בוגר נשארת גם כשלא מסכימים איתה: אנחנו בודקים עובדות, ומסתירים
            רק פרטים אישיים או תוכן לא חוקי. לא שומרים מי דיווח.{' '}
            <Link href="/privacy#reports" className="underline underline-offset-[3px] hover:text-link-hover">
              מדיניות הפרטיות
            </Link>
          </p>
          {error && (
            <p id={errorId} role="alert" className="font-bold">
              {error.message}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-5">
            <button
              type="submit"
              disabled={pending}
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'h-11 rounded-[4px] border-[1.5px] border-ink px-5 text-[15px] font-bold',
                'disabled:border-line disabled:text-ink-soft disabled:opacity-100',
              )}
            >
              {pending ? 'שולחים…' : 'לשלוח את הדיווח'}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                toggle.current?.focus();
              }}
              className={cn(quietLink, 'text-sm font-semibold underline')}
            >
              ביטול
            </button>
          </div>
        </form>
      )}
    </>
  );
}
```

- [ ] **Step 5: בעמוד הקורס**

ב-`web/src/components/course/read-tracker.tsx`, במקום `<article ref={ref} className={className}>`:

```tsx
    // העוגן #review-<id>: התור של הדיווחים ב-/admin מקשר לביקורת בעמוד, ובדיקות הקצה מוצאות אותה לפיו.
    <article ref={ref} id={`review-${reviewId}`} className={className}>
```

ב-`web/src/components/course/reviews-section.tsx`:

בייבוא, אחרי `import { ReadTracker } from './read-tracker';`:

```tsx
import { ReportReview } from './report-review';
```

ב-`ReadTracker`, במקום `className={cn('lg:max-w-[340px]', i % 2 === 1 && 'xl:mt-8')}`:

```tsx
            className={cn('scroll-mt-6 lg:max-w-[340px]', i % 2 === 1 && 'xl:mt-8')}
```

במקום הבלוק של "עזר לי":

```tsx
            {/*
              "עזר לי" מתחת לפתק, בצד שבו הקריאה מתחילה. פתק ההמשך תלוי בצד השני (משמאל), ולכן שניהם באותו גובה,
              והשורה של הכפתור (44 פיקסלים) מפנה גם לו מקום.
            */}
            <div className="mt-1 ps-1">
              <HelpfulButton reviewId={r.id} count={r.helpfulCount} />
            </div>
```

כותבים:

```tsx
            {/*
              "עזר לי" מתחת לפתק, בצד שבו הקריאה מתחילה. פתק ההמשך תלוי בצד השני (משמאל), ולכן שניהם באותו גובה,
              והשורה של הכפתור (44 פיקסלים) מפנה גם לו מקום. "לדווח" באותה שורה, שקט יותר, והטופס שלו יורד
              לשורה משלו (basis-full).
            */}
            <div className="mt-1 flex flex-wrap items-center gap-x-5 ps-1">
              <HelpfulButton reviewId={r.id} count={r.helpfulCount} />
              <ReportReview reviewId={r.id} />
            </div>
```

- [ ] **Step 6: בדיקת הקצה**

Create `web/e2e/report.spec.ts`:

```ts
import { createClient } from '@supabase/supabase-js';
import { expect, test } from '@playwright/test';
import type { Database } from '../src/lib/database.types';
import { localEnv } from './support/env';

/**
 * סבב 5: מבקר מדווח על ביקורת בלי חשבון. הדיווח נשמר עם טביעה של הכתובת, והביקורת נשארת באתר.
 * הדיווח נמחק בסוף, כדי שלא ייספר במגבלת הקצב (5 ביממה לכתובת) בריצה הבאה.
 */
const SLUG = 'full-stack-sample';

test('a visitor reports a review without an account, and the review stays on the page', async ({ page }) => {
  const db = createClient<Database>(localEnv('NEXT_PUBLIC_SUPABASE_URL'), localEnv('SUPABASE_SECRET_KEY'), {
    auth: { persistSession: false },
  });
  const marker = `בדיקת קצה ${Date.now()}`;

  await page.goto(`/courses/${SLUG}`);
  const review = page.locator('#reviews article').first();
  const reviewId = (await review.getAttribute('id'))?.replace(/^review-/, '') ?? '';
  expect(reviewId).toMatch(/^[0-9a-f-]{36}$/);
  const { data: before } = await db.from('reviews').select('disputed_at').eq('id', reviewId).single();

  try {
    await review.getByRole('button', { name: 'לדווח על הביקורת' }).click();
    const form = review.getByRole('form', { name: 'דיווח על הביקורת' });
    await form.getByRole('button', { name: 'לשלוח את הדיווח' }).click();
    await expect(form.getByText('בחרו מה הבעיה.')).toBeVisible();

    await form.getByRole('radio', { name: /פרטים של אדם פרטי/ }).check();
    await form.getByLabel('מה עוד חשוב שנדע? (רשות)').fill(marker);
    await form.getByRole('button', { name: 'לשלוח את הדיווח' }).click();
    await expect(review.getByText('תודה. נבדוק את הדיווח.')).toBeVisible({ timeout: 15_000 });

    const { data: rows } = await db
      .from('reports')
      .select('reason, details, status, client_hash')
      .eq('review_id', reviewId)
      .eq('details', marker);
    expect(rows).toHaveLength(1);
    expect(rows![0]).toMatchObject({ reason: 'privacy', details: marker, status: 'open' });
    expect(rows![0].client_hash).toMatch(/^[0-9a-f]{64}$/);

    // הביקורת נשארת באתר, עם סימון פנימי בלבד.
    const { data: after } = await db.from('reviews').select('status, disputed_at').eq('id', reviewId).single();
    expect(after!.status).toBe('published');
    expect(after!.disputed_at).not.toBeNull();
    await page.reload();
    await expect(page.locator(`#review-${reviewId}`)).toBeVisible();
  } finally {
    await db.from('reports').delete().eq('review_id', reviewId).eq('details', marker);
    if (before && before.disputed_at === null) await db.from('reviews').update({ disputed_at: null }).eq('id', reviewId);
  }
});
```

- [ ] **Step 7: ירוק**

עוצרים כל שרת על פורט 3000.

```bash
pnpm --dir web lint && pnpm --dir web exec tsc --noEmit && pnpm --dir web test
pnpm --dir web build
pnpm --dir web e2e -- report.spec.ts course-page.spec.ts
```

Expected: הבנייה עוברת. `report.spec.ts` ו-`course-page.spec.ts` עוברות.

- [ ] **Step 8: בעין**

`pnpm --dir web start` בטרמינל נפרד. פותחים `/courses/full-stack-sample#reviews` ב-390 וב-1280, ובודקים:
- "לדווח" פחות בולט מ"עזר לי".
- הטופס נפתח מתחת לפתק, בלי גלילה לרוחב.
- התודה נכתבת בעט.
- הטופס ב-1280 ברוחב הפתק.

תיקונים לפי Impeccable, ושוב `pnpm --dir web build` ו-`e2e`.

- [ ] **Step 9: Commit**

```bash
git add .impeccable/surfaces web/src/app/courses web/src/components/course/report-review.tsx web/src/components/course/reviews-section.tsx web/src/components/course/read-tracker.tsx web/e2e/report.spec.ts
git commit -m "feat: לדווח על ביקורת בלי חשבון, והביקורת נשארת באתר"
```

שורה בקובץ הסשן.

---

### Task 7: התור "דיווחים" ב-/admin, ותגובת מוסד (Impeccable)

**Files:**
- Modify: `.impeccable/surfaces/web-src-app-admin-page-tsx.md` (דרך `impeccable surface-brief write`)
- Create: `web/src/lib/reports/queue.ts`
- Create: `web/src/app/admin/report-actions.ts`
- Create: `web/src/components/admin/report-decide-form.tsx`
- Create: `web/src/components/admin/vendor-response-form.tsx`
- Create: `web/src/components/admin/report-queue-item.tsx`
- Modify: `web/src/app/admin/page.tsx` (הקובץ כולו)
- Test: `web/e2e/report-decision.spec.ts`

- [ ] **Step 1: חוזה התור, עם הדיווחים**

החוזה הקיים מתאר שלושה תורים. כותבים אותו מחדש עם התור הרביעי, תגובת המוסד ויומן הפעולות (משימה 8). ה-seed נשאר:

```bash
cd "C:/Users/galsa/Desktop/קורסים השוואות"
cat > web/test-results/admin-brief.md <<'EOF'
# התור של גל

**היקף:** `/admin` ו-`/admin/log`, למחשב ולנייד, בעברית מימין לשמאל. רק מנהלים. גל בא לעבוד (mode: operate). היומן לקריאה (mode: read).
**מי מגיע:** גל, מהמחשב או מהטלפון, כמה פעמים ביום.
**המשימה:** ארבעה תורים בעמוד אחד, ולכל פריט החלטה:
- **ביקורות לאימות:** לקרוא, לפתוח את ההוכחה, לראות מה המודל מצא, ולהחליט. תוך 48 שעות.
- **דיווחים:** ביקורת שמישהו דיווח עליה, וכל הדיווחים עליה. להשאיר, להסתיר עד בירור (רק פרטים אישיים או תוכן לא חוקי), או להסיר עם נימוק. בתוך הפריט: לצרף, להחליף או להסיר תגובה של המוסד.
- **קורסים לאישור (מהאוסף):** הערך באתר מול הערך בדף, המשפט מהדף ולמה זה בתור. לאשר, לתקן ידנית או לדחות. קורס חדש: לפרסם או לדחות.
- **בקשות של מוסדות:** לבחור את המוסד, ולאשר שהקישור ייכנס לאוסף, או לדחות.
**התוכן:** מעל התורים: דוח הריצה האחרונה של האוסף, ומה כבר הוחלט בביקור הזה. קישור ליומן הפעולות (`/admin/log`): כל החלטה, החדשה ראשונה.
**מגבלות:** ההוכחות, המיילים ומה שהמדווחים כתבו פרטיים. אין בעמוד שום דבר ציבורי. נתוני דוגמה בלבד מקומית. בלי מפתח סודי: הודעה ברורה, ושום פעולה.

## Direction contract

THESIS: שולחן עבודה של עורך: ערימת דפים לבדיקה, אחד אחרי השני, וליד כל אחד המסמך המצורף וההערות. ארבע ערימות באותו עמוד, זו מתחת לזו. המונים בשורת הניווט, ולא בכרטיסים. צפוף ופשוט. מוותר על לוח בקרה עם כרטיסים צבעוניים ומונים גדולים.

OWN-WORLD: אותם צבעים וגופנים של האתר: דיו ב-IBM Plex Sans Hebrew, וצפיפות של רשימה. הצבע מסמן מקור:
- **ביקורת:** קול של בוגר, בפתק צהוב שטוח.
- **תגובת המוסד:** פתק כחול, כמו בעמוד הקורס.
- **המשפט מדף המוסד:** טענת מוסד, עם הקו הכחול של טענה.
- **הערך באתר מול הערך בדף:** שתי עמודות, התווית מעל הערך ובאותו צד.
- **סימונים, סיבות, דיווחים דחופים ומה שעבר את היעד:** דיו מודגשת, בלי צבע חדש.
- **דוח הריצה:** משפט אחד של מספרים בדיו.
- **יומן הפעולות:** שורה לכל פעולה, כמו עמודה בפנקס. מתי ומי באפור רך, מתחת לשורה ובאותו צד.
המהלך היחיד: ההוכחה כמסמך עם מהדק.

STORY: גל פותח את התור, ורואה בשורת הניווט כמה מחכה בכל תור. ביקורת: מאשר עם סוג וסכום, או מחזיר. דיווח: קורא את הביקורת ואת מה שדווח, ומשאיר, מסתיר עד בירור או מסיר. שינוי בקורס: משווה את שני הערכים מול המשפט, ומאשר, מתקן או דוחה. בקשה: בוחר מוסד ומאשר. כל פריט יורד מהרשימה, ושורה מעל הרשימה אומרת מה נעשה. ביומן הוא רואה כל מה שהוחלט, גם לפני שבוע.

FIRST VIEWPORT: הכותרת "מה מחכה להחלטה", ומתחתיה ניווט בעט ("4 תורים בעמוד") עם המונה של כל תור, וקישור ליומן הפעולות. אחריה התור הראשון, עם הפריט הראשון שלו.

FORM: הרחבה של העולם של האתר, במצב Operate. העולם תורם רק גופנים, צבעים, צפיפות ומהלך אחד. הפקדים רגילים: select, שדה מספר, כפתורי רדיו ותיבות סימון, שדה טקסט, `details` לתיקון ידני ולתגובת מוסד, וכפתורים מ-`buttonVariants`. seed:c81c41ae8e27158d

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
EOF
.claude/skills/impeccable/scripts/impeccable surface-brief write web/src/app/admin/page.tsx web/test-results/admin-brief.md \
  web/src/components/admin/queue-item.tsx web/src/components/admin/decide-form.tsx web/src/components/admin/decision-log.tsx \
  web/src/components/admin/course-queue-item.tsx web/src/components/admin/join-request-item.tsx web/src/components/admin/scrape-run-report.tsx \
  web/src/components/admin/report-queue-item.tsx web/src/components/admin/report-decide-form.tsx web/src/components/admin/vendor-response-form.tsx \
  web/src/components/admin/audit-log-list.tsx web/src/app/admin/log/page.tsx
.claude/skills/impeccable/scripts/impeccable surface-brief read web/src/app/admin/page.tsx | head -12
```

Expected: החוזה `web-src-app-admin-page-tsx` עם 11 targets קשורים, וב"המשימה" ארבעה תורים.

- [ ] **Step 2: Impeccable לפני כל עריכת ממשק**

1. טוענים את ה-skill `/impeccable`. אם `.claude/skills/impeccable` חסרה: `npx impeccable install` מתיקיית הפרויקט.
2. Run:
   ```bash
   .claude/skills/impeccable/scripts/impeccable context --target web/src/app/admin/page.tsx
   ```
   ב-PowerShell או ב-cmd: `.claude\skills\impeccable\scripts\impeccable.cmd context --target web/src/app/admin/page.tsx`. ממלאים את ההוראות שהפקודה מדפיסה, ולא מריצים אותה שוב.
3. קוראים את `.claude/skills/impeccable/reference/craft-floor.md` ואת `.claude/skills/impeccable/reference/mode-operate.md`.
4. **הכללים, מהחוזה ומ-`DESIGN.md`:**
   - **הפקדים:** רק מ-`web/src/components/admin/controls.ts`: `control`, `textArea`, `fieldLabel`, `primaryButton`, `outlineButton` ו-`textLink`. אותו כפתור בכל התורים.
   - **הפתקים:** הביקורת בפתק צהוב שטוח (`tape={false}`), ותגובת המוסד בפתק כחול. שום דבר אחר לא על פתק.
   - **דיווח דחוף:** דיו מודגשת. בלי אדום ובלי צבע חדש.
   - **תנועה:** `data-anim="ink"` על כל פריט, כמו בשאר התורים.
   - **הגודל:** קודם לנייד, ברוחב 390. כל פקד לפחות 44 פיקסלים.

הקוד בצעדים הבאים הוא נקודת ההתחלה, ועובד. Impeccable משפר אותו בתוך העולם, ולא משנה את מה שבדיקת הקצה מחפשת:
- **הניווט והכותרות:** "דיווחים" ו-`id="reports"`; `article` לכל פריט, עם `h3` של שם הקורס.
- **הרדיו:** "להשאיר", "להסתיר עד בירור" ו"להסיר".
- **הכפתורים:** "להשאיר את הביקורת", "להסתיר עד בירור" ו"להסיר את הביקורת".
- **הטקסטים:** "מוסתרת עד בירור", והסיבות כמו ב-`REPORT_REASON_LABEL`.
- **הרשימה:** "מה הוחלט עכשיו".

- [ ] **Step 3: הטעינה של התור**

Create `web/src/lib/reports/queue.ts`:

```ts
import 'server-only';
import type { AdminDb } from '@/lib/admin/gate';
import { one } from '@/lib/data/shared';
import type { AuthorTitle, DisplayMode } from '@/lib/reviews/types';
import { groupReports, type ReportEntry, type ReportQueueItem, type ReportedReview } from './group';
import { isReportReason } from './reasons';

type CourseRef = { slug: string; title: string; institutions: { name: string } | { name: string }[] | null };

type ReviewRef = {
  id: string;
  status: string;
  cohort_month: string;
  published_at: string | null;
  body: string;
  display_name: string;
  display_mode: DisplayMode;
  author_title: AuthorTitle;
  courses: CourseRef | CourseRef[] | null;
  vendor_responses: { body: string } | { body: string }[] | null;
};

/** כמה דיווחים פתוחים נטענים. מעבר לזה, הבאים בתור אחרי החלטות. */
const OPEN_REPORTS_LIMIT = 500;

/**
 * הדיווחים הפתוחים, מקובצים לפי ביקורת (groupReports). רק עם המפתח הסודי: reports סגורה לכל השאר.
 * ביקורת שכבר לא באתר ולא מוסתרת לא נכנסת. decide_review_reports ממילא לא תקבל אותה.
 */
export async function loadReportQueue(db: AdminDb): Promise<ReportQueueItem[]> {
  const { data, error } = await db
    .from('reports')
    .select(
      'id, review_id, reason, details, created_at, reviews(id, status, cohort_month, published_at, body, display_name, display_mode, author_title, courses(slug, title, institutions(name)), vendor_responses(body))',
    )
    .eq('status', 'open')
    .order('created_at', { ascending: true })
    .limit(OPEN_REPORTS_LIMIT);
  if (error) throw new Error(`reports query failed: ${error.message}`);

  const reviews = new Map<string, ReportedReview>();
  const entries: (ReportEntry & { reviewId: string })[] = [];
  for (const row of data) {
    if (!isReportReason(row.reason)) continue;
    entries.push({ id: row.id, reviewId: row.review_id, reason: row.reason, details: row.details, createdAt: row.created_at });
    const review = one(row.reviews as unknown as ReviewRef | ReviewRef[] | null);
    if (!review || reviews.has(review.id)) continue;
    if (review.status !== 'published' && review.status !== 'disputed') continue;
    const course = one(review.courses);
    reviews.set(review.id, {
      reviewId: review.id,
      status: review.status,
      courseSlug: course?.slug ?? '',
      courseTitle: course?.title ?? 'קורס שכבר לא באתר',
      institutionName: one(course?.institutions ?? null)?.name ?? '',
      cohortMonth: review.cohort_month,
      publishedAt: review.published_at,
      body: review.body,
      displayName: review.display_mode === 'anonymous' ? null : review.display_name,
      authorTitle: review.author_title,
      vendorResponse: one(review.vendor_responses)?.body ?? null,
    });
  }
  return groupReports([...reviews.values()], entries);
}
```

- [ ] **Step 4: הפעולות של גל**

Create `web/src/app/admin/report-actions.ts`:

```ts
'use server';

import { updateTag } from 'next/cache';
import { requireAdmin } from '@/lib/admin/gate';
import { refreshCourses } from '@/lib/cache/refresh';
import { HIDE_REASONS, isReportReason, removalNote } from '@/lib/reports/reasons';
import { isUuid } from '@/lib/reviews/types';
import { recomputeAllScores } from '@/lib/score/recompute';
import type { DecisionState } from './actions';

function fail(message: string): DecisionState {
  return { status: 'error', message };
}

type ReportDecision = 'keep' | 'hide' | 'remove';
const isReportDecision = (value: unknown): value is ReportDecision =>
  value === 'keep' || value === 'hide' || value === 'remove';

const DONE: Record<ReportDecision, string> = {
  keep: 'הדיווחים נסגרו. הביקורת באתר.',
  hide: 'הוסתרה עד בירור. היא נשארת בתור עד ההחלטה.',
  remove: 'הוסרה מהאתר ומהציון. הכותב רואה למה, ב"הביקורות שלי".',
};

const HIDE_ONLY = 'מסתירים עד בירור רק בגלל פרטים של אדם פרטי או תוכן לא חוקי.';
/** שגיאות שהמסד מחזיר בכוונה. כל השאר נרשם בלוג של השרת. */
const EXPECTED = ['P0002', 'LM032', 'LM033'];

/** קודי השגיאה מ-20261115230001_reports_and_transparency.sql, בעברית לגל. */
function dbMessage(code: string | undefined): string {
  switch (code) {
    case 'P0002':
      return 'אין כאן מה להחליט: אין על הביקורת דיווח פתוח, היא כבר מוסתרת, או שהיא כבר לא באתר. אולי כבר הוחלט עליה בלשונית אחרת: לרענן את הדף.';
    case 'LM032':
      return HIDE_ONLY;
    case 'LM033':
      return 'לביקורת הזו אין תגובה של מוסד להסיר.';
    default:
      return 'ההחלטה לא נשמרה. נסו שוב.';
  }
}

/**
 * ההחלטה של גל על ביקורת שדווחה (מסמך העיצוב של סבב 5, סעיף 4): להשאיר, להסתיר עד בירור, או להסיר עם נימוק.
 * רק המזהה, ההחלטה, הסיבה והמשפט לכותב מגיעים מהטופס. decide_review_reports בודקת שגל מנהל, שיש דיווח פתוח
 * ושהסתרה היא רק מהסיבות המותרות, וכותבת ליומן באותה טרנזקציה.
 * אחר כך: חישוב מחדש של כל הציונים (ביקורת שהוסתרה, חזרה או הוסרה משנה גם את ממוצע התחום), ורענון מיידי של
 * כל עמוד קורס שחושב ושל הקטלוג. updateTag גם מרנדר מחדש את התור באותה תשובה.
 */
export async function decideReports(_previous: DecisionState, form: FormData): Promise<DecisionState> {
  const gate = await requireAdmin();
  if (typeof gate === 'string') return fail(gate);

  const reviewId = form.get('reviewId');
  const decision = form.get('decision');
  const reason = form.get('reason');
  if (!isUuid(reviewId) || !isReportDecision(decision)) return fail('הבקשה לא תקינה.');
  if (decision === 'hide' && !(isReportReason(reason) && HIDE_REASONS.includes(reason))) return fail(HIDE_ONLY);
  if (decision === 'remove' && !isReportReason(reason)) return fail('לבחור למה מסירים.');

  const { data: slug, error } = await gate.db.rpc('decide_review_reports', {
    p_review_id: reviewId,
    p_admin_id: gate.userId,
    p_decision: decision,
    ...(decision !== 'keep' && isReportReason(reason) ? { p_reason: reason } : {}),
    ...(decision === 'remove' && isReportReason(reason) ? { p_note: removalNote(reason, String(form.get('note') ?? '')) } : {}),
  });
  if (error || !slug) {
    if (!error || !EXPECTED.includes(error.code)) console.error('report decision failed', error?.code);
    return fail(dbMessage(error?.code));
  }

  let warning: string | undefined;
  let recomputed: string[] = [];
  try {
    const result = await recomputeAllScores(gate.db, new Date());
    recomputed = result.slugs;
    if (result.failures.length > 0) {
      console.error(`recompute after report decision: ${result.failures.length} course(s) failed`);
      warning = `חישוב הציונים נכשל ב-${result.failures.length} קורסים. להריץ pnpm --dir web score:recompute.`;
    }
  } catch (recomputeError) {
    console.error('recompute after report decision failed', recomputeError instanceof Error ? recomputeError.message : 'unknown');
    warning = 'חישוב הציונים נכשל. להריץ pnpm --dir web score:recompute.';
  }
  refreshCourses([slug, ...recomputed]);
  return { status: 'done', message: DONE[decision], warning };
}

/**
 * תגובת מוסד לביקורת (מסמך העיצוב של סבב 5, סעיף 5): גל מדביק את מה שהמוסד שלח, והיא מופיעה מתחת לביקורת
 * בפתק כחול. intent=remove מסיר אותה. set_vendor_response כותבת ליומן, בלי הטקסט. הציון לא משתנה.
 */
export async function saveVendorResponse(_previous: DecisionState, form: FormData): Promise<DecisionState> {
  const gate = await requireAdmin();
  if (typeof gate === 'string') return fail(gate);

  const reviewId = form.get('reviewId');
  const remove = form.get('intent') === 'remove';
  const body = remove ? '' : String(form.get('body') ?? '').trim();
  if (!isUuid(reviewId)) return fail('הבקשה לא תקינה.');
  if (!remove && body === '') return fail('להדביק את התגובה של המוסד.');
  if (body.length > 2000) return fail('עד 2,000 תווים.');

  const { data: slug, error } = await gate.db.rpc('set_vendor_response', {
    p_review_id: reviewId,
    p_admin_id: gate.userId,
    p_body: body,
  });
  if (error || !slug) {
    if (!error || !EXPECTED.includes(error.code)) console.error('vendor response failed', error?.code);
    return fail(error?.code === 'P0002' ? 'הביקורת כבר לא באתר. לרענן את הדף.' : dbMessage(error?.code));
  }
  updateTag(`course:${slug}`);
  return { status: 'done', message: remove ? 'התגובה הוסרה.' : 'התגובה פורסמה מתחת לביקורת.' };
}
```

- [ ] **Step 5: הטופס של ההחלטה**

Create `web/src/components/admin/report-decide-form.tsx`:

```tsx
'use client';

import { useActionState, useState } from 'react';
import type { DecisionState } from '@/app/admin/actions';
import { decideReports } from '@/app/admin/report-actions';
import { HIDE_REASONS, REPORT_REASONS, REPORT_REASON_LABEL, type ReportReason } from '@/lib/reports/reasons';
import { control, fieldLabel as label, outlineButton, primaryButton, textArea } from './controls';
import { useLogDecision } from './decision-log';

const IDLE: DecisionState = { status: 'idle' };

type Choice = 'keep' | 'hide' | 'remove';
const CHOICE_LABEL: Record<Choice, string> = { keep: 'להשאיר', hide: 'להסתיר עד בירור', remove: 'להסיר' };
const SUBMIT: Record<Choice, string> = { keep: 'להשאיר את הביקורת', hide: 'להסתיר עד בירור', remove: 'להסיר את הביקורת' };
const PENDING: Record<Choice, string> = { keep: 'סוגרים…', hide: 'מסתירים…', remove: 'מסירים…' };
const HINT: Record<Choice, string> = {
  keep: 'הדיווחים נסגרים, והביקורת נשארת באתר. דעה של בוגר נשארת גם כשהמוסד לא מסכים.',
  hide: 'רק לפרטים של אדם פרטי או לתוכן לא חוקי. הביקורת יורדת מהאתר ומהציון, ונשארת כאן עד ההחלטה.',
  remove: 'הביקורת יורדת מהאתר ומהציון. הכותב רואה את הסיבה ב"הביקורות שלי".',
};

/**
 * שלוש ההחלטות על ביקורת שדווחה, בטופס אחד (מסמך העיצוב של סבב 5, סעיף 4). "להסתיר" לא מוצג כשהיא כבר
 * מוסתרת. הסיבה מתחילה מהדיווח הראשון ברשימה, שהוא הדחוף ביותר.
 * החלטה שהצליחה נרשמת ביומן שמעל הרשימה (decision-log.tsx). הפריט מרונדר מחדש באותה תשובה, ולכן הקורא
 * נותן לטופס key לפי המצב של הביקורת: אחרי הסתרה הוא מתחיל שוב מ"להשאיר".
 */
export function ReportDecideForm({
  reviewId,
  courseSlug,
  courseTitle,
  hidden,
  suggested,
}: {
  reviewId: string;
  courseSlug: string;
  courseTitle: string;
  hidden: boolean;
  suggested: ReportReason;
}) {
  const logDecision = useLogDecision();
  const [state, dispatch, pending] = useActionState(async (previous: DecisionState, form: FormData) => {
    const result = await decideReports(previous, form);
    if (result.status === 'done') {
      logDecision({
        id: `report:${reviewId}:${Date.now()}`,
        title: courseTitle,
        message: result.message,
        warning: result.warning,
        href: `/courses/${courseSlug}`,
      });
    }
    return result;
  }, IDLE);
  const [choice, setChoice] = useState<Choice>('keep');
  const [reason, setReason] = useState<ReportReason>(suggested);
  const choices: Choice[] = hidden ? ['keep', 'remove'] : ['keep', 'hide', 'remove'];
  const reasons = choice === 'hide' ? HIDE_REASONS : REPORT_REASONS;
  const shownReason = reasons.includes(reason) ? reason : reasons[0];

  return (
    <form action={dispatch} aria-label="ההחלטה על הדיווחים" className="space-y-3 text-[15px] leading-normal">
      <input type="hidden" name="reviewId" value={reviewId} />
      <fieldset>
        <legend className={label}>ההחלטה</legend>
        <div className="mt-1 flex flex-col">
          {choices.map((c) => (
            <label key={c} className="inline-flex min-h-11 items-center gap-2">
              <input
                type="radio"
                name="decision"
                value={c}
                checked={choice === c}
                onChange={() => setChoice(c)}
                className="size-4 accent-ink"
              />
              {CHOICE_LABEL[c]}
            </label>
          ))}
        </div>
      </fieldset>
      <p className="text-[13px] text-pretty text-ink-soft">{HINT[choice]}</p>
      {choice !== 'keep' && (
        <label className="block">
          <span className={label}>הסיבה</span>
          <select
            name="reason"
            value={shownReason}
            onChange={(e) => setReason(e.target.value as ReportReason)}
            className={control}
          >
            {reasons.map((r) => (
              <option key={r} value={r}>
                {REPORT_REASON_LABEL[r]}
              </option>
            ))}
          </select>
        </label>
      )}
      {choice === 'remove' && (
        <label className="block">
          <span className={label}>עוד משהו לכותב (רשות)</span>
          <textarea name="note" rows={3} maxLength={600} className={textArea} />
        </label>
      )}
      <button type="submit" disabled={pending} className={choice === 'keep' ? primaryButton : outlineButton}>
        {pending ? PENDING[choice] : SUBMIT[choice]}
      </button>
      {state.status === 'error' && (
        <p role="alert" className="font-bold">
          {state.message}
        </p>
      )}
    </form>
  );
}
```

- [ ] **Step 6: תגובת המוסד**

Create `web/src/components/admin/vendor-response-form.tsx`:

```tsx
'use client';

import { useActionState, useState } from 'react';
import type { DecisionState } from '@/app/admin/actions';
import { saveVendorResponse } from '@/app/admin/report-actions';
import { fieldLabel as label, outlineButton, textArea } from './controls';
import { useLogDecision } from './decision-log';

const IDLE: DecisionState = { status: 'idle' };

/**
 * תגובת מוסד לביקורת (מסמך העיצוב של סבב 5, סעיף 5), מקופלת בתוך הפריט. גל מדביק אותה כמו שהמוסד שלח.
 * תגובה חדשה מחליפה את הקודמת. הכפתור שנלחץ שולח intent: publish או remove (FormData עם ה-submitter).
 */
export function VendorResponseForm({
  reviewId,
  courseSlug,
  courseTitle,
  current,
}: {
  reviewId: string;
  courseSlug: string;
  courseTitle: string;
  current: string | null;
}) {
  const logDecision = useLogDecision();
  const [state, dispatch, pending] = useActionState(async (previous: DecisionState, form: FormData) => {
    const result = await saveVendorResponse(previous, form);
    if (result.status === 'done') {
      logDecision({
        id: `response:${reviewId}:${Date.now()}`,
        title: courseTitle,
        message: result.message,
        href: `/courses/${courseSlug}#review-${reviewId}`,
      });
    }
    return result;
  }, IDLE);
  const [body, setBody] = useState(current ?? '');

  return (
    <details className="text-[15px] leading-normal">
      <summary className="inline-flex min-h-11 cursor-pointer items-center font-semibold underline underline-offset-[3px] hover:text-link-hover">
        {current ? 'לעדכן את תגובת המוסד' : 'לצרף תגובה של המוסד'}
      </summary>
      <form action={dispatch} aria-label="תגובת המוסד" className="mt-2 space-y-3">
        <input type="hidden" name="reviewId" value={reviewId} />
        <label className="block">
          <span className={label}>התגובה, כמו שהמוסד שלח אותה</span>
          <textarea
            name="body"
            rows={4}
            maxLength={2000}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className={textArea}
          />
        </label>
        <p className="text-[13px] text-ink-soft">מופיעה מתחת לביקורת, בפתק כחול, מיד אחרי השמירה. ביומן נרשם רק שהיא פורסמה.</p>
        <div className="flex flex-wrap gap-3">
          <button type="submit" name="intent" value="publish" disabled={pending} className={outlineButton}>
            {pending ? 'שומרים…' : 'לפרסם את התגובה'}
          </button>
          {current && (
            <button type="submit" name="intent" value="remove" disabled={pending} className={outlineButton}>
              להסיר את התגובה
            </button>
          )}
        </div>
        {state.status === 'error' && (
          <p role="alert" className="font-bold">
            {state.message}
          </p>
        )}
      </form>
    </details>
  );
}
```

- [ ] **Step 7: הפריט בתור**

Create `web/src/components/admin/report-queue-item.tsx`:

```tsx
import Link from 'next/link';
import { StickyNote } from '@/components/course/marks';
import type { ReportQueueItem } from '@/lib/reports/group';
import { REPORT_REASON_LABEL, isUrgent } from '@/lib/reports/reasons';
import { verifiedLabel } from '@/lib/reviews/types';
import { dateTimeLabel } from './format';
import { ReportDecideForm } from './report-decide-form';
import { VendorResponseForm } from './vendor-response-form';

const monthLabel = (iso: string) =>
  new Intl.DateTimeFormat('he-IL', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(iso));

/**
 * ביקורת אחת שדווחה, וכל הדיווחים הפתוחים עליה (חוזה התור). הביקורת בפתק צהוב שטוח, ותגובת המוסד בפתק כחול.
 * דיווח דחוף (פרטים אישיים, תוכן לא חוקי) מודגש בדיו, בלי צבע. מה שהמדווח כתב מודפס כמו שהוא: רק גל רואה אותו.
 */
export function ReportQueueItemView({ item }: { item: ReportQueueItem }) {
  const headingId = `r-${item.reviewId}`;
  const hidden = item.status === 'disputed';
  return (
    <article aria-labelledby={headingId} data-anim="ink" className="border-t border-rule py-6 lg:py-8">
      <header>
        <h3 id={headingId} className="text-[21px] leading-snug font-bold text-balance">
          <Link
            href={`/courses/${item.courseSlug}#review-${item.reviewId}`}
            className="inline-flex min-h-11 items-center underline decoration-1 underline-offset-[3px] hover:text-link-hover"
          >
            {item.courseTitle}
          </Link>
        </h3>
        <p className="mt-1 font-sans text-[13px] leading-normal text-ink-soft">
          {item.institutionName} · מחזור {monthLabel(item.cohortMonth)}
          {item.publishedAt && ` · פורסמה ${dateTimeLabel(item.publishedAt)}`}
        </p>
        <p className="font-sans text-[13px] leading-normal">
          {hidden ? (
            <strong className="font-bold">מוסתרת עד בירור. לא באתר ולא בציון.</strong>
          ) : (
            <span className="text-ink-soft">באתר, בזמן הבדיקה.</span>
          )}
        </p>
      </header>
      <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-14">
        <section aria-label="הביקורת" className="min-w-0">
          <StickyNote tone="grad" tape={false} className="max-w-[68ch] px-4 pt-4 pb-3.5">
            <p className="text-[13px]">
              {item.displayName ? (
                <>
                  <strong>{item.displayName}</strong>, {verifiedLabel(item.authorTitle)}
                </>
              ) : (
                <strong>{verifiedLabel(item.authorTitle)}</strong>
              )}
            </p>
            <p className="mt-1.5 text-[15px] leading-relaxed whitespace-pre-line lg:text-base">{item.body}</p>
          </StickyNote>
          {item.vendorResponse && (
            <StickyNote tone="institution" tape={false} className="mt-4 max-w-[60ch] px-3 pt-3 pb-2">
              <strong>תגובת המוסד:</strong> {item.vendorResponse}
            </StickyNote>
          )}
        </section>
        <section aria-label="הדיווחים וההחלטה" className="min-w-0 font-sans">
          <h4 className="text-[15px] font-bold">{item.reports.length === 1 ? 'דיווח אחד' : `${item.reports.length} דיווחים`}</h4>
          <ul aria-label="הדיווחים" className="mt-2 space-y-3 text-[15px] leading-normal">
            {item.reports.map((report) => (
              <li key={report.id}>
                <p className={isUrgent(report.reason) ? 'font-bold' : 'font-semibold'}>{REPORT_REASON_LABEL[report.reason]}</p>
                {report.details && <p className="mt-0.5 text-pretty whitespace-pre-line">{report.details}</p>}
                <p className="text-[13px] text-ink-soft">{dateTimeLabel(report.createdAt)}</p>
              </li>
            ))}
          </ul>
          <div className="mt-6 border-t border-rule pt-5">
            <ReportDecideForm
              key={item.status}
              reviewId={item.reviewId}
              courseSlug={item.courseSlug}
              courseTitle={item.courseTitle}
              hidden={hidden}
              suggested={item.reports[0].reason}
            />
          </div>
          <div className="mt-6 border-t border-rule pt-4">
            <VendorResponseForm
              reviewId={item.reviewId}
              courseSlug={item.courseSlug}
              courseTitle={item.courseTitle}
              current={item.vendorResponse}
            />
          </div>
        </section>
      </div>
    </article>
  );
}
```

- [ ] **Step 8: העמוד**

Replace `web/src/app/admin/page.tsx` כולו. זה הקובץ מהענף של התור, עם התור הרביעי (הייבוא, הטעינה, `queues`, `reportsLine` והחלק `#reports`):

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { textLink } from '@/components/admin/controls';
import { CourseQueueItemView } from '@/components/admin/course-queue-item';
import { DecisionLog } from '@/components/admin/decision-log';
import { JoinRequestItem } from '@/components/admin/join-request-item';
import { QueueItemView } from '@/components/admin/queue-item';
import { ReportQueueItemView } from '@/components/admin/report-queue-item';
import { ScrapeRunReportView } from '@/components/admin/scrape-run-report';
import { PenArrow } from '@/components/site/pen';
import { Sheet } from '@/components/site/sheet';
import { COURSE_QUEUE_PAGE, loadCourseQueue, loadJoinRequests, loadLatestRun } from '@/lib/admin/course-queue';
import { adminGate } from '@/lib/admin/gate';
import { loadQueue } from '@/lib/admin/queue';
import type { ReportQueueItem } from '@/lib/reports/group';
import { loadReportQueue } from '@/lib/reports/queue';
import { SITE_NAME } from '@/lib/site';

export const metadata: Metadata = {
  title: `התורים | ${SITE_NAME}`,
  robots: { index: false, follow: false },
};

/**
 * הכול בבקשה: העמוד קורא את ההתחברות, ולכן אין לו מעטפת סטטית (instant.md, "Disabling instant").
 * ה-proxy כבר החזיר 404 לכל מי שאינו מנהל. כאן בודקים שוב, ומי שאינו מנהל מקבל את עמוד ה-404.
 * גם הכותרת בתוך Suspense: מי שאינו מנהל לא רואה שום דבר מהעמוד, אפילו אם ה-proxy לא רץ.
 */
export const instant = false;

export default function AdminPage() {
  return (
    <Suspense fallback={null}>
      <AdminQueues />
    </Suspense>
  );
}

function reviewsLine(count: number): string {
  if (count === 0) return 'אין ביקורות שמחכות לבדיקה. ביקורת חדשה מופיעה כאן כשבוגר שולח אותה עם הוכחה.';
  if (count === 1) return 'ביקורת אחת מחכה. היעד: תשובה תוך 48 שעות.';
  return `${count} ביקורות מחכות, הישנה ראשונה. היעד: תשובה תוך 48 שעות.`;
}

/** כמה ביקורות עם דיווח פתוח, וכמה מהן דחופות ועדיין באתר (groupReports). */
function reportsLine(items: readonly ReportQueueItem[]): string {
  if (items.length === 0) return 'אין דיווחים פתוחים. דיווח מגיע כשמבקר לוחץ "לדווח" מתחת לביקורת.';
  const head = items.length === 1 ? 'ביקורת אחת עם דיווח פתוח.' : `${items.length} ביקורות עם דיווח פתוח, הדחופות ראשונות.`;
  const urgent = items.filter((i) => i.urgent).length;
  if (urgent === 0) return head;
  return `${head} ${urgent === 1 ? 'אחת דחופה' : `${urgent} דחופות`}: פרטים אישיים או תוכן לא חוקי, בביקורת שעדיין באתר.`;
}

function coursesLine(total: number, shown: number): string {
  if (total === 0) return 'אין שינויים שמחכים. שינוי שגרתי עולה לבד, וקורס חדש או שינוי חריג מגיעים לכאן אחרי ריצה של האוסף.';
  if (total === 1) return 'פריט אחד מחכה.';
  if (shown < total) return `${total} פריטים מחכים. כאן ${shown} הישנים, ואחרי כל החלטה עולה הבא בתור.`;
  return `${total} פריטים מחכים, הישן ראשון.`;
}

function requestsLine(count: number): string {
  if (count === 1) return 'בקשה אחת מחכה.';
  return `${count} בקשות מחכות, הישנה ראשונה.`;
}

const sectionTitle = 'pen-rule text-[21px] leading-snug font-bold lg:text-[28px]';
const countText = 'mt-2 font-sans text-[15px] leading-normal text-ink-soft';

async function AdminQueues() {
  // הכול בבקשה, לפני שנוגעים בשעון: getUser של Supabase בודק תפוגה עם Date.now(), והתור מחשב כמה זמן כל
  // ביקורת מחכה (08-caching.md, "Random values and timestamps").
  await connection();
  const gate = await adminGate({ readOnly: true });
  if (gate.kind === 'not-admin') notFound();
  const [reviews, reports, courses, run, join] =
    gate.kind === 'ok'
      ? await Promise.all([
          loadQueue(gate.db),
          loadReportQueue(gate.db),
          loadCourseQueue(gate.db),
          loadLatestRun(gate.db),
          loadJoinRequests(gate.db),
        ])
      : [[], [], { items: [], total: 0 }, null, { requests: [], institutions: [] }];
  const queues = [
    { id: 'reviews', label: 'ביקורות לאימות', count: reviews.length },
    { id: 'reports', label: 'דיווחים', count: reports.length },
    { id: 'courses', label: 'קורסים לאישור', count: courses.total },
    { id: 'requests', label: 'בקשות של מוסדות', count: join.requests.length },
  ];

  return (
    <Sheet className="sheet-long">
      <main className="pb-10 lg:pb-14">
        <h1 className="mt-[22px] text-[30px] leading-tight font-bold lg:mt-12 lg:text-[48px]">מה מחכה להחלטה</h1>
        {gate.kind === 'no-key' ? (
          <div role="alert" className="mt-4 max-w-[60ch] space-y-2 font-sans text-[15px] leading-normal">
            <p className="font-bold">חסר SUPABASE_SECRET_KEY בשרת. בלעדיו אי אפשר לפתוח הוכחות או להחליט.</p>
            <p>אחרי שמוסיפים אותו ב-Vercel, צריך לפרוס מחדש. עד אז שום ביקורת לא מתפרסמת ושום קובץ לא נמחק.</p>
          </div>
        ) : (
          <>
            {/* כמו "N פרקים בעמוד" בעמוד הקורס: העט מסכם את הדף, והמונה ליד כל תור, בלי כרטיסי מונה. */}
            <nav
              aria-label="התורים בעמוד"
              className="mt-1.5 flex flex-wrap items-center gap-x-4 font-sans text-[15px] font-semibold lg:mt-4 lg:text-base"
            >
              <span className="inline-flex min-h-11 items-center font-pen text-[15px] font-medium text-pen lg:text-base">
                {queues.length} תורים בעמוד
                <PenArrow className="ms-1.5 me-0" />
              </span>
              {queues.map((q) => (
                <a key={q.id} href={`#${q.id}`} className={textLink}>
                  {q.label}
                  <span className="ms-1.5 font-bold tabular-nums">{q.count}</span>
                </a>
              ))}
            </nav>
            <DecisionLog>
              <section id="reviews" aria-labelledby="reviews-title" className="mt-8 scroll-mt-4 lg:mt-12 lg:scroll-mt-8">
                <h2 id="reviews-title" className={sectionTitle}>
                  ביקורות לאימות
                </h2>
                <p className={countText}>{reviewsLine(reviews.length)}</p>
                <div className="mt-6">
                  {reviews.map((item) => (
                    <QueueItemView key={item.reviewId} item={item} />
                  ))}
                </div>
              </section>

              <section id="reports" aria-labelledby="reports-title" className="mt-10 scroll-mt-4 lg:mt-16 lg:scroll-mt-8">
                <h2 id="reports-title" className={sectionTitle}>
                  דיווחים
                </h2>
                <p className={countText}>{reportsLine(reports)}</p>
                <div className="mt-6">
                  {reports.map((item) => (
                    <ReportQueueItemView key={item.reviewId} item={item} />
                  ))}
                </div>
              </section>

              <section id="courses" aria-labelledby="courses-title" className="mt-10 scroll-mt-4 lg:mt-16 lg:scroll-mt-8">
                <h2 id="courses-title" className={sectionTitle}>
                  קורסים לאישור
                </h2>
                <ScrapeRunReportView run={run} />
                <p className={countText}>{coursesLine(courses.total, Math.min(courses.items.length, COURSE_QUEUE_PAGE))}</p>
                <div className="mt-6">
                  {courses.items.map((item) => (
                    <CourseQueueItemView key={item.id} item={item} />
                  ))}
                </div>
              </section>

              <section id="requests" aria-labelledby="requests-title" className="mt-10 scroll-mt-4 lg:mt-16 lg:scroll-mt-8">
                <h2 id="requests-title" className={sectionTitle}>
                  בקשות של מוסדות
                </h2>
                <p className={countText}>
                  {join.requests.length === 0 ? (
                    <>
                      אין בקשות. מוסד או מרצה שולחים בקשה מ
                      <Link href="/institutions/join" className={textLink}>
                        הטופס להוספת קורס
                      </Link>
                      .
                    </>
                  ) : (
                    requestsLine(join.requests.length)
                  )}
                </p>
                <div className="mt-6">
                  {join.requests.map((request) => (
                    <JoinRequestItem key={request.id} request={request} institutions={join.institutions} />
                  ))}
                </div>
              </section>
            </DecisionLog>
          </>
        )}
      </main>
    </Sheet>
  );
}
```

אם הקובץ במיזוג שונה מהגרסה של הענף של התור: לא מחליפים אותו כולו. מוסיפים רק את חמשת השינויים שלמעלה, ושומרים כל שינוי אחר.

- [ ] **Step 9: בדיקת הקצה**

Create `web/e2e/report-decision.spec.ts`:

```ts
import { randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { expect, test } from '@playwright/test';
import { ensureLocalAdmin } from '../src/lib/admin/local-admin';
import type { Database } from '../src/lib/database.types';
import { recomputeAllScores } from '../src/lib/score/recompute';
import { localEnv } from './support/env';
import { signIn } from './support/mail';

/**
 * סבב 5: גל מסתיר עד בירור ביקורת שדווחה בגלל פרטים אישיים, ועמוד הקורס מפסיק להראות אותה מיד. אחר כך הוא
 * משאיר אותה, והיא חוזרת מיד. שתי השורות ביומן.
 * ביקורת לבדיקה, על קורס שאף בדיקה אחרת לא קוראת את הציון שלו. היא נמחקת בסוף, והציונים מחושבים שוב.
 */
const SLUG = 'web-basics-sample';
const ADMIN_EMAIL = 'admin-reports-e2e@example.test';

test('the admin hides a reported review until resolved, then keeps it, and the course page follows at once', async ({
  page,
  context,
}) => {
  test.setTimeout(180_000);
  const db = createClient<Database>(localEnv('NEXT_PUBLIC_SUPABASE_URL'), localEnv('SUPABASE_SECRET_KEY'), {
    auth: { persistSession: false },
  });
  const adminId = await ensureLocalAdmin(db, ADMIN_EMAIL);
  const { data: course } = await db.from('courses').select('id').eq('slug', SLUG).single();
  const opening = `ביקורת לבדיקת הדיווחים ${Date.now()}.`;
  const now = new Date().toISOString();
  const { data: review, error } = await db
    .from('reviews')
    .insert({
      course_id: course!.id,
      cohort_month: '2026-01-01',
      body: `${opening} הקורס היה מסודר, והתרגילים בכל שבוע עזרו לי להבין את החומר. המרצה ענתה על שאלות גם אחרי השיעור.`,
      display_name: 'בוגרת לדוגמה',
      display_mode: 'anonymous',
      status: 'published',
      proof_kind: 'invoice',
      verified_at: now,
      published_at: now,
    })
    .select('id')
    .single();
  expect(error).toBeNull();
  const reviewId = review!.id;
  // דיווח כמו שהטופס הציבורי שולח (הטופס עצמו נבדק ב-report.spec.ts).
  const { error: reportError } = await db.rpc('submit_review_report', {
    p_review_id: reviewId,
    p_reason: 'privacy',
    p_client_hash: randomBytes(32).toString('hex'),
    p_details: 'יש בביקורת שם מלא של מרצה פרטית (בדיקת קצה).',
  });
  expect(reportError).toBeNull();
  const coursePage = await context.newPage();

  try {
    await page.goto('/login?next=%2Fadmin');
    await signIn(page, ADMIN_EMAIL);
    await expect(page).toHaveURL(/\/admin$/);
    const item = page.locator('#reports').getByRole('article').filter({ hasText: opening });
    await expect(item).toHaveCount(1);
    await expect(item.getByText(/פרטים של אדם פרטי/).first()).toBeVisible();

    // להסתיר עד בירור: הסיבה מתחילה מהדיווח (פרטים אישיים).
    await item.getByRole('radio', { name: 'להסתיר עד בירור' }).check();
    await item.getByRole('button', { name: 'להסתיר עד בירור' }).click();
    const log = page.getByRole('list', { name: 'מה הוחלט עכשיו' });
    await expect(log).toContainText('הוסתרה עד בירור.', { timeout: 60_000 });
    await expect(item.getByText('מוסתרת עד בירור', { exact: false })).toBeVisible();
    await coursePage.goto(`/courses/${SLUG}`);
    await expect(coursePage.getByText(opening)).toHaveCount(0);

    // להשאיר: הדיווח נסגר, והביקורת חוזרת לעמוד.
    await item.getByRole('radio', { name: 'להשאיר' }).check();
    await item.getByRole('button', { name: 'להשאיר את הביקורת' }).click();
    await expect(log).toContainText('הדיווחים נסגרו. הביקורת באתר.', { timeout: 60_000 });
    await expect(item).toHaveCount(0);
    await coursePage.goto(`/courses/${SLUG}`);
    await expect(coursePage.getByText(opening)).toBeVisible();

    const { data: audit } = await db.from('audit_log').select('action, actor_id').eq('review_id', reviewId).order('id');
    expect(audit).toEqual([
      { action: 'report_hide', actor_id: adminId },
      { action: 'report_keep', actor_id: adminId },
    ]);
    const { data: reports } = await db.from('reports').select('status').eq('review_id', reviewId);
    expect(reports).toEqual([{ status: 'kept' }]);
  } finally {
    // הדיווחים נמחקים עם הביקורת (on delete cascade). השורות ביומן נשארות: הוא לא נמחק.
    await db.from('reviews').delete().eq('id', reviewId);
    await recomputeAllScores(db, new Date());
    await db.auth.admin.deleteUser(adminId);
  }
});
```

- [ ] **Step 10: ירוק**

עוצרים כל שרת על פורט 3000.

```bash
pnpm --dir web lint && pnpm --dir web exec tsc --noEmit && pnpm --dir web test
pnpm --dir web build
pnpm --dir web e2e -- report-decision.spec.ts review.spec.ts course-queue.spec.ts
```

Expected: הבנייה עוברת, ושלוש הבדיקות עוברות. `review.spec.ts` ו-`course-queue.spec.ts` בודקות שהתורים האחרים לא נשברו.

- [ ] **Step 11: בעין**

`pnpm --dir web start` בטרמינל נפרד. מתחברים כמנהל מקומי: `pnpm --dir web admin:local <מייל>`, והקישור מ-Mailpit (`http://127.0.0.1:54324`).

יוצרים דיווח מ"לדווח" בעמוד של `full-stack-sample`. ב-`/admin#reports`, ב-390 וב-1280, בודקים:
- המונה בניווט;
- הפריט: הביקורת, הדיווח והטופס;
- ההחלטה שנרשמת מעל הרשימה;
- תגובת מוסד: לפרסם, לראות בעמוד הקורס, ולהסיר;
- בלי גלילה לרוחב.

בסוף מחליטים "להשאיר", כדי שהדיווח לא יישאר פתוח.

- [ ] **Step 12: Commit**

```bash
git add .impeccable/surfaces web/src/lib/reports/queue.ts web/src/app/admin web/src/components/admin web/e2e/report-decision.spec.ts
git commit -m "feat: תור הדיווחים ב-/admin: להשאיר, להסתיר עד בירור או להסיר, ותגובת מוסד"
```

שורה בקובץ הסשן.

---

### Task 8: יומן הפעולות ב-/admin/log (Impeccable)

**Files:**
- Create: `web/src/lib/admin/audit-log.ts`
- Create: `web/src/components/admin/audit-log-list.tsx`
- Create: `web/src/app/admin/log/page.tsx`
- Modify: `web/src/app/admin/page.tsx` (הקישור ליומן, בניווט)

- [ ] **Step 1: Impeccable לפני כל עריכת ממשק**

1. טוענים את ה-skill `/impeccable`. אם `.claude/skills/impeccable` חסרה: `npx impeccable install` מתיקיית הפרויקט.
2. החוזה כבר כולל את `web/src/app/admin/log/page.tsx` ואת `audit-log-list.tsx` (משימה 7, צעד 1). Run:
   ```bash
   .claude/skills/impeccable/scripts/impeccable context --target web/src/app/admin/log/page.tsx
   ```
   ב-PowerShell או ב-cmd: `.claude\skills\impeccable\scripts\impeccable.cmd context --target web/src/app/admin/log/page.tsx`. ממלאים את ההוראות שהפקודה מדפיסה, ולא מריצים אותה שוב.
3. קוראים את `.claude/skills/impeccable/reference/craft-floor.md` ואת `.claude/skills/impeccable/reference/mode-read.md`.
4. **הכללים, מהחוזה ומ-`DESIGN.md`:**
   - **השורה:** מה קרה, בדיו. על מה, עם קישור. מתי ומי באפור רך, מתחת ובאותו צד. אף פעם לא תאריך בקצה השני של השורה (The Not A Menu Rule).
   - **הגופן:** IBM Plex Sans Hebrew.
   - **הספרות:** ברוחב קבוע (tabular-nums).
   - **תנועה:** `data-anim="ink"` על כל שורה, ו-`.pen-rule` רק אם יש כותרת פרק.
   - **הגודל:** קודם לנייד, ברוחב 390.

הקוד בצעדים הבאים הוא נקודת ההתחלה. Impeccable לא משנה את הכותרת "יומן הפעולות", את `aria-label="הפעולות"`, את "לפעולות ישנות יותר", ואת הקישור "יומן הפעולות" ב-`/admin`.

- [ ] **Step 2: הטעינה**

Create `web/src/lib/admin/audit-log.ts`:

```ts
import 'server-only';
import { one } from '@/lib/data/shared';
import type { AuditEntry } from './audit';
import type { AdminDb } from './gate';

/** כמה שורות בעמוד. */
export const AUDIT_PAGE = 100;

export interface AuditPage {
  entries: AuditEntry[];
  /** המזהה של השורה האחרונה בעמוד, כשיש ישנות ממנה. null: זה העמוד האחרון. */
  olderThan: number | null;
}

type CourseRef = { slug: string; title: string };

const toRecord = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

/**
 * הפעולות ביומן, החדשה ראשונה (מסמך העיצוב של סבב 5, סעיף 6). before: רק שורות עם מזהה קטן ממנו.
 * ליומן אין מפתחות זרים (הוא לא מתעדכן), ולכן היעד של כל שורה נקרא בשלוש שאילתות, ורשומה שנמחקה מחזירה null.
 * רק עם המפתח הסודי: audit_log, reports ו-course_change_queue סגורים לכל השאר.
 */
export async function loadAuditLog(db: AdminDb, before: number | null): Promise<AuditPage> {
  let query = db
    .from('audit_log')
    .select('id, actor_id, action, review_id, course_queue_id, institution_request_id, details, created_at')
    .order('id', { ascending: false })
    .limit(AUDIT_PAGE + 1);
  if (before !== null) query = query.lt('id', before);
  const { data, error } = await query;
  if (error) throw new Error(`audit log query failed: ${error.message}`);
  const rows = data.slice(0, AUDIT_PAGE);

  const reviewIds = [...new Set(rows.flatMap((r) => (r.review_id ? [r.review_id] : [])))];
  const queueIds = [...new Set(rows.flatMap((r) => (r.course_queue_id ? [r.course_queue_id] : [])))];
  const requestIds = [...new Set(rows.flatMap((r) => (r.institution_request_id ? [r.institution_request_id] : [])))];
  const [reviews, queue, requests] = await Promise.all([
    db.from('reviews').select('id, courses(slug, title)').in('id', reviewIds),
    db.from('course_change_queue').select('id, courses(slug, title)').in('id', queueIds),
    db.from('institution_requests').select('id, institution_name').in('id', requestIds),
  ]);
  if (reviews.error || queue.error || requests.error) throw new Error('audit log targets query failed');

  const reviewCourse = new Map(
    reviews.data.map((r) => [r.id, one(r.courses as unknown as CourseRef | CourseRef[] | null)] as const),
  );
  const queueCourse = new Map(
    queue.data.map((q) => [q.id, one(q.courses as unknown as CourseRef | CourseRef[] | null)] as const),
  );
  const requestName = new Map(requests.data.map((r) => [r.id, r.institution_name] as const));

  const entries: AuditEntry[] = rows.map((row) => {
    let target: AuditEntry['target'] = null;
    if (row.review_id) {
      const course = reviewCourse.get(row.review_id);
      if (course) target = { title: course.title, href: `/courses/${course.slug}#review-${row.review_id}` };
    } else if (row.course_queue_id) {
      const course = queueCourse.get(row.course_queue_id);
      if (course) target = { title: course.title, href: `/courses/${course.slug}` };
    } else if (row.institution_request_id) {
      const name = requestName.get(row.institution_request_id);
      if (name) target = { title: name, href: null };
    }
    return {
      id: row.id,
      action: row.action,
      actorId: row.actor_id,
      createdAt: row.created_at,
      details: toRecord(row.details),
      target,
    };
  });
  return { entries, olderThan: data.length > AUDIT_PAGE ? rows[rows.length - 1].id : null };
}
```

- [ ] **Step 3: הרשימה**

Create `web/src/components/admin/audit-log-list.tsx`:

```tsx
import Link from 'next/link';
import { actionLabel, actorLabel, detailLabel, type AuditEntry } from '@/lib/admin/audit';
import { textLink } from './controls';
import { dateTimeLabel } from './format';

/**
 * יומן הפעולות: שורה לכל פעולה, כמו עמודה בפנקס (חוזה התור). מה קרה בדיו, על מה עם קישור, ומתחת, באותו צד,
 * מתי ומי באפור רך. רק קודים מ-details, במילים (detailLabel). אין בהם טקסט חופשי.
 */
export function AuditLogList({ entries }: { entries: AuditEntry[] }) {
  if (entries.length === 0) return <p className="mt-6 font-sans text-[15px]">עוד אין פעולות ביומן.</p>;
  return (
    <ol aria-label="הפעולות" className="mt-6 font-sans text-[15px] leading-normal">
      {entries.map((entry) => {
        const detail = detailLabel(entry.action, entry.details);
        return (
          <li key={entry.id} data-anim="ink" className="border-t border-rule py-3">
            <p className="font-semibold">{actionLabel(entry.action)}</p>
            <p>
              {entry.target ? (
                entry.target.href ? (
                  <Link href={entry.target.href} className={textLink}>
                    {entry.target.title}
                  </Link>
                ) : (
                  entry.target.title
                )
              ) : (
                <span className="text-ink-soft">רשומה שכבר נמחקה</span>
              )}
              {detail && <span> · {detail}</span>}
            </p>
            <p className="text-[13px] text-ink-soft tabular-nums">
              {dateTimeLabel(entry.createdAt)} · {actorLabel(entry.action, entry.actorId)}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
```

- [ ] **Step 4: העמוד**

לפני שכותבים: `web/node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md`, על `searchParams` כ-Promise. כמו `/admin`, העמוד כולו בבקשה (`instant = false`) ובתוך `Suspense`.

Create `web/src/app/admin/log/page.tsx`:

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { AuditLogList } from '@/components/admin/audit-log-list';
import { textLink } from '@/components/admin/controls';
import { Sheet } from '@/components/site/sheet';
import { loadAuditLog } from '@/lib/admin/audit-log';
import { NO_KEY_MESSAGE, adminGate } from '@/lib/admin/gate';
import { SITE_NAME } from '@/lib/site';

export const metadata: Metadata = {
  title: `יומן הפעולות | ${SITE_NAME}`,
  robots: { index: false, follow: false },
};

/** כמו /admin: הכול בבקשה, וה-proxy כבר החזיר 404 לכל מי שאינו מנהל (proxy.ts, matcher '/admin/:path*'). */
export const instant = false;

type Props = { searchParams: Promise<{ before?: string | string[] }> };

export default function AuditLogPage({ searchParams }: Props) {
  return (
    <Suspense fallback={null}>
      <AuditLog searchParams={searchParams} />
    </Suspense>
  );
}

async function AuditLog({ searchParams }: Props) {
  await connection();
  const gate = await adminGate({ readOnly: true });
  if (gate.kind === 'not-admin') notFound();
  const raw = (await searchParams).before;
  const before = typeof raw === 'string' && /^[1-9]\d{0,14}$/.test(raw) ? Number(raw) : null;
  const page = gate.kind === 'ok' ? await loadAuditLog(gate.db, before) : null;

  return (
    <Sheet className="sheet-long">
      <main className="pb-10 lg:pb-14">
        <nav aria-label="מיקום" className="mt-2 font-sans text-[13px] text-ink-soft lg:mt-6 lg:text-sm">
          <Link href="/admin" className={textLink}>
            התורים
          </Link>
        </nav>
        <h1 className="mt-0.5 text-[30px] leading-tight font-bold lg:text-[48px]">יומן הפעולות</h1>
        <p className="mt-2 max-w-[60ch] font-sans text-[15px] leading-normal text-ink-soft">
          כל החלטה בממשק הניהול, וכל מחיקה של ביקורת. היומן לא משתנה ולא נמחק. החדש ראשון.
        </p>
        {gate.kind === 'no-key' && (
          <p role="alert" className="mt-4 font-sans text-[15px] font-bold">
            {NO_KEY_MESSAGE}
          </p>
        )}
        {page && (
          <>
            <AuditLogList entries={page.entries} />
            <p className="mt-6 flex flex-wrap gap-x-6 font-sans text-[15px] font-semibold">
              {page.olderThan !== null && (
                <Link href={`/admin/log?before=${page.olderThan}`} className={textLink}>
                  לפעולות ישנות יותר
                </Link>
              )}
              {before !== null && (
                <Link href="/admin/log" className={textLink}>
                  לפעולות האחרונות
                </Link>
              )}
            </p>
          </>
        )}
      </main>
    </Sheet>
  );
}
```

- [ ] **Step 5: הקישור מ-/admin**

ב-`web/src/app/admin/page.tsx`, בתוך ה-`nav` של התורים, אחרי ה-`queues.map(...)`:

```tsx
              <Link href="/admin/log" className={textLink}>
                יומן הפעולות
              </Link>
```

- [ ] **Step 6: ירוק ובעין**

```bash
pnpm --dir web lint && pnpm --dir web exec tsc --noEmit && pnpm --dir web test
pnpm --dir web build
```

`pnpm --dir web start` בטרמינל נפרד. מתחברים כמנהל מקומי, ופותחים `/admin/log` ב-390 וב-1280. בודקים:
- ההחלטות מהבדיקות של משימות 2 ו-7 מופיעות;
- ביקורת שנמחקה: "רשומה שכבר נמחקה";
- בלי גלילה לרוחב;
- `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/admin/log` בלי התחברות מחזיר 404.

- [ ] **Step 7: Commit**

```bash
git add web/src/lib/admin/audit-log.ts web/src/components/admin/audit-log-list.tsx web/src/app/admin
git commit -m "feat: יומן הפעולות ב-/admin/log"
```

שורה בקובץ הסשן.

---

<!-- המשך: משימות 9 ואילך -->
