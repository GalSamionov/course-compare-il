# תוכנית 4: מוסדות, מרצים והשוואה

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** עמוד מוסד (`/institutions/[slug]`) ועמוד מרצה (`/lecturers/[slug]`) עם כל הקורסים שלהם, כל קורס עם הציון שלו ובלי ציון כולל. השוואה מלאה ב-`/compare` של עד 3 קורסים, מהמגש או מקישור `?c=`, עם אותו סימון מקור בכל תא כמו בעמוד הקורס, ועיצוב אמיתי לנייד. "המובילים לפי בוגרים" בכל עמוד תחום. "לשלוח בוואטסאפ" בעמוד הקורס.

**Architecture:**
- **בלי שינוי במסד.** ל-`lecturers` כבר יש `slug` ייחודי וחובה, וכל מה שהעמודים קוראים פתוח לקריאה ציבורית. לכן אין migration, אין בדיקות מסד, ואין שום כתיבה לענן.
- **כל הנתונים של קורס מגיעים מ-`getCoursePage`,** אותה פונקציה של עמוד הקורס, מהמטמון. כך הציון, מספר המאומתים והטווח זהים בכל עמוד. עמוד הקורס מקבל שני שדות: `institutionSlug` ו-`productType`.
- **שתי פונקציות חדשות במטמון:** `getInstitutionPage` ו-`getLecturerPage`. הן מחזירות את הפרטים ואת רשימת ה-slugs של הקורסים, עם `cacheLife('hours')` והתגיות `institution:<slug>` או `lecturer:<slug>`, ו-`catalog`.
- **כל העמודים החדשים סטטיים,** עם `ensureStatic = 'navigation'` ו-`generateStaticParams`, כמו עמוד הקורס. slug שלא קיים מחזיר 404 אמיתי.
- **ההשוואה סטטית גם היא.** העמוד מכיל את נתוני ההשוואה של כל הקורסים בקטלוג (`getCompareCourses`). רכיב בדפדפן, בתוך `<Suspense>`, קורא את `?c=` ואת המגש (`useAccount`), ובונה את השורות בפונקציה טהורה (`buildCompareRows`).
- **לוגיקה טהורה עם בדיקות יחידה:** הקריאה של `?c=`, השורות של ההשוואה, המובילים, הקישור לוואטסאפ, והסדר של הקורסים.

**Tech Stack:** Next.js 16.4.6 (Cache Components, `ensureStatic`, `use cache`, `cacheTag`, `useSearchParams` בתוך `<Suspense>`), React 19.3, TypeScript, Tailwind CSS v4, shadcn/ui, Supabase (PostgREST עם המפתח הציבורי), Vitest, Playwright, pnpm.

**מקור:**
- מסמך העיצוב: `docs/superpowers/specs/2026-11-15-round-4-institutions-compare-design.md`. הוא המקור, ובמקום שהוא שותק: `docs/superpowers/specs/2026-11-13-course-comparison-part1-design.md`, סעיפים 4 ו-8.
- `docs/ROADMAP.md`, פריטים 25, 26, 28, 29 ו-30.
- `docs/superpowers/plans/notes-for-plan-2.md`: "ההשוואה של מבקר לא מחובר" ו"קורס שהוסר מהאתר".
- שפת העיצוב: `DESIGN.md`. חוזה עמוד הקורס: `.impeccable/surfaces/course-page.md`.
- `web/AGENTS.md`: לפני שימוש ב-API של Next קוראים את המדריך שלו ב-`web/node_modules/next/dist/docs/`. ההחלטות על Next כאן מצטטות את הקובץ שממנו הן באות.

---

## איך עובדים בתוכנית הזו

- **תיקייה:** כל הפקודות רצות מ-`C:/Users/galsa/Desktop/קורסים השוואות`, ב-Git Bash. בנתיב יש אותיות עבריות, ולכן תמיד במירכאות. פקודות של האתר: `pnpm --dir web ...`.
- **ענף:** `plan-1-foundation`, כמו בסבבים הקודמים. פריסות יוצאות רק ממנו (`docs/STATUS.md`).
- **מסד מקומי:** Docker Desktop רץ, ו-`pnpm db:start` כבר הופעל. המיילים נתפסים ב-Mailpit, `http://127.0.0.1:54324`. אין צורך ב-`db:reset`: הסבב לא משנה את המסד.
- **סודות:** `web/.env.local` כבר מכיל את המפתחות המקומיים. לא מדפיסים אותו, לא מעתיקים ממנו ולא מכניסים ל-git.
- **בדיקות, במינימום (בקשה של גל: "לא להגזים בבדיקות ובסבבי סקירה, לקדם את המוצר שרואים"):**
  - **pgTAP:** אין. הסבב לא מוסיף אובייקט במסד או הרשאה.
  - **בדיקות יחידה** ללוגיקה טהורה (משימות 1–3).
  - **בדיקות קצה:** אחת להשוואה, אחת לעמוד מוסד ואחת לעמוד מרצה. ועוד שורה בבדיקות הקיימות של עמוד הקורס ועמוד התחום.
- **סקירה:** בלי סבב סקירת קוד. אין כאן מסד, הרשאות או סודות. הממשק עובר את סקירת הסיום של Impeccable (משימה 10), סבב אחד.
- **כל משימה מסתיימת ירוקה:**
  - תמיד: `pnpm --dir web lint`, `pnpm --dir web exec tsc --noEmit` ו-`pnpm --dir web test`.
  - משימות ממשק: גם `pnpm --dir web build`, ובדיקת הקצה של המשימה.
- **שרת התצוגה רץ עם `next start`.** לפני כל בדיקה בדפדפן בונים מחדש (`pnpm --dir web build`), ואז `pnpm --dir web start`. אחרת רואים את הבנייה הקודמת.
- **בדיקות קצה:** `playwright.config.ts` משתמש בשרת קיים על פורט 3000 אם יש כזה. לפני `pnpm --dir web e2e` עוצרים כל שרת על 3000, כדי שהבדיקה תבנה את הקוד החדש. הבדיקות רצות כ-Pixel 7 (נייד).
- **עיצוב: כל משימת ממשק (4–9) עוברת דרך Impeccable.** הצעד הראשון בכל אחת קבוע, וכתוב מחדש בכל משימה כדי שאפשר יהיה לקרוא אותה לבד:
  1. טוענים את ה-skill `/impeccable`. אם `.claude/skills/impeccable` חסרה: `npx impeccable install` מתיקיית הפרויקט.
  2. `.claude/skills/impeccable/scripts/impeccable context --target <הקובץ>`. ב-PowerShell או ב-cmd: `.claude\skills\impeccable\scripts\impeccable.cmd context --target <הקובץ>`. ממלאים את ההוראות שהפקודה מדפיסה, ולא מריצים אותה שוב.
  3. קוראים את `.claude/skills/impeccable/reference/craft-floor.md` לפני כל עריכת ממשק, ואת `.claude/skills/impeccable/reference/mode-read.md` (כל המשטחים בסבב הזה במצב Read).
  4. `DESIGN.md` גובר. העיצוב החדש: IBM Plex Sans Hebrew לכל הדיו, Rubik בכחול לעט, דף לבן על שולחן בהיר. צבע מסמן מקור בלבד: ירוק נבדק מול מסמך, צהוב בוגרים, ורוד חולשה, קו כחול טענה של המוסד. כפתור, הודעה או שגיאה לא מקבלים מרקר או פתק. האתר מדבר רק בעט. בלי אייקוני גליף, בלי לוגו של וואטסאפ: כל סימן מצויר ב-SVG. אף פעם לא ממשק גנרי. shadcn/ui הוא הבסיס לרכיבים (`buttonVariants`).
  5. **תנועה:** אותם כלים כמו בשאר האתר, בלי JavaScript חדש. `MotionObserver` (`web/src/components/site/motion-observer.tsx`) מפעיל כל אחד מהם כשהוא נכנס למסך:
     - `.pen-rule` מתחת לכל כותרת פרק (קו העט נמשך);
     - `Mark` (`.hl`, המרקר נמרח);
     - `PenNote` (`data-anim="write"`, העט כותב);
     - `StickyNote` (`data-anim="stick"`, הפתק נדבק);
     - שורה ברשימה: `data-anim="ink"` (השורה נכתבת אל הדף);
     - `PenNumber` ו-`PenLoop` (`data-anim="draw"`, העט מקיף).
  6. קודם לנייד, ברוחב 390. כל פקד לפחות 44 פיקסלים. אין גלילה לרוחב.

  הקוד בכל משימת ממשק הוא נקודת התחלה שעובדת. Impeccable משפר אותו בתוך העולם, ולא מחליף את ההתנהגות: אותם שמות של כפתורים, קישורים, `data-row` ו-`id`, כי בדיקות הקצה מחפשות אותם.
- **תיאום עם סשנים אחרים:**
  - **לא נוגעים בכלל:** `web/src/app/admin/**`, `web/src/components/admin/**`, `web/src/app/institutions/join/**` ו-`web/src/app/guides/**`.
  - **קבצים משותפים שסשן התנועה עורך גם הוא.** עריכה קטנה ומוסיפה בלבד, בדיוק כמו בצעדים, בלי לסדר מחדש קוד שמסביב:
    - `web/src/components/course/course-actions.tsx` (משימות 5 ו-9);
    - `web/src/app/categories/[slug]/page.tsx` (משימה 7);
    - `web/src/app/courses/[slug]/page.tsx` (משימות 4 ו-5);
    - `web/src/components/course/lecturers-section.tsx` (משימה 6);
    - `web/src/components/course/at-a-glance.tsx` (משימה 1);
    - `web/src/components/account/compare-tray.tsx` (משימה 9).
  - **בהתנגשות במיזוג** באחד מהם: שומרים את שני הצדדים. התנועה מוסיפה תכונות, והסבב הזה מוסיף שורות.
- **תיעוד סשן:** לפי `CLAUDE.md`, בקובץ `docs/sessions/2026-11-15-round-4.md` (קיים). שורה אחרי כל קומיט ובדיקה, עם הסטטוס הכן (נבדק / נכתב, לא נבדק / לא הושלם).
- **קומיטים:** כל commit מסתיים בשורת ה-Co-Authored-By מההוראות של הסשן.
- **לוכסן הפוך:** קוד עם `\` (ביטויים רגולריים) נכתב עם כלי עריכת קבצים, לא עם heredoc ב-bash.

## החלטות שהתוכנית נשענת עליהן

1. **בלי migration.** `lecturers.slug` הוא `text not null unique` מ-`20261113000001_core_schema.sql`, ולכל ארבעת המרצים בנתוני הדוגמה יש slug. נבדק בזמן הכתיבה מול המסד המקומי, עם המפתח הציבורי:
   - `lecturers?select=slug,name,institution_bio,verified_facts,course_lecturers(role,courses(slug,title,status))&slug=eq.yael-cohen-sample` מחזיר את יעל עם שני הקורסים והתפקידים.
   - `lecturers?select=slug` מחזיר 4 מרצים.
   - `institutions?select=id,slug,name,website,kind&slug=eq.sample-kitchen` מחזיר את האתר והסוג.
   - `courses?select=slug,status,institutions(slug)&status=neq.draft` מחזיר את ה-slug של המוסד של כל קורס.
2. **אין ציון למוסד ואין ציון למרצה** (גל, 15.11.2026). בשני העמודים רק הציון של כל קורס, והערה בעט שאומרת למה. בעמוד המרצה הציון מסומן "ציון הבוגרים לקורס". בעמוד המוסד יש ספירה של הקורסים ושל הבוגרים המאומתים, וזו ספירה ולא ציון.
3. **הנתונים של כל קורס מ-`getCoursePage`.** עמוד מוסד ועמוד מרצה קוראים לה לכל קורס. היא כבר במטמון, עם התגית `course:<slug>`. לפי `revalidateTag.md`: "invalidates data with specific tags across all pages that use those tags". לכן אישור של ביקורת (`updateTag('course:<slug>')`, `updateTag('catalog')` ב-`web/src/app/admin/actions.ts`) מרענן גם את העמודים החדשים.
4. **שתי תגיות לכל פונקציה חדשה:** `cacheTag('institution:<slug>', 'catalog')`. לפי `cacheTag.md`: "You can assign multiple tags to a single cache entry by passing multiple string values". `catalog` מרוענן בכל אישור, וממשק התור של הקורסים (סשן אחר) מרענן אותו כשקורס חדש מתפרסם.
5. **הסדר של הקורסים בעמוד מוסד ומרצה** (`compareByScore`): קודם עם ציון, מהגבוה לנמוך; אחריהם בלי ציון, מי שיש לו יותר ביקורות מאומתות קודם; ובסוף מה שכבר לא מוצע. בתיקו לפי השם בעברית.
6. **מוסד בלי קורס שאינו טיוטה מחזיר 404.** גם מרצה, אבל אצלו המסד כבר מסתיר אותו (המדיניות "lecturers of non-draft courses are public"). `generateStaticParams` של המוסדות נבנה מהקורסים, ולכן מוסד בלי קורס ציבורי לא נבנה מראש.
7. **`/institutions/join` גובר על `[slug]`:** כתובת קבועה קודמת לכתובת דינמית. ה-not-found של `[slug]` חל רק בתוך `[slug]`.
8. **ההשוואה סטטית:**
   - `getCompareCourses()` קוראת ל-`getCoursePage` לכל קורס בקטלוג, ומצמצמת כל אחד ל-`CompareCourse` (בלי ביקורות, סילבוס וסרטון).
   - `CompareFromUrl` רץ בדפדפן, בתוך `<Suspense>`. לפי `ensureStatic.md`, "Client hooks such as `useParams()` and `useSearchParams()` are also allowed", גם עם `'navigation'`. זה בדיוק מה שהמחברת עושה (`notebook.tsx`).
   - שינוי בכתובת הוא `window.history.replaceState`, שמעדכן את `useSearchParams` בלי בקשה לשרת. כך גם המחברת.
   - **הגבול:** כמו הקטלוג, מספיק לכמה מאות קורסים. כתוב בהערות (משימה 11).
9. **`?c=` גובר על המגש.** במצב קישור, "להוציא" ו"להחזיר" משנים רק את הכתובת. במצב מגש, הם קוראים ל-`toggleCompare`, שמשנה את המגש בדפדפן או בחשבון. כשעוברים בין המצבים, הרשימה של מה שהוצא מתאפסת (`key` לפי המצב).
10. **מה שהוצא מחכה בתחתית עד סוף הביקור,** ב-`useState`. מחובר רואה שם גם את מה ששמר ולא בהשוואה: הוצאה מהמגש של מחובר משאירה את הקורס בשמורים ממילא.
11. **השורות של ההשוואה נבנות בפונקציה טהורה** (`buildCompareRows`), עם אותו סימון מקור כמו ברכיב המקביל בעמוד הקורס:
    - `paid` ירוק (`at-a-glance.tsx`, `price-section.tsx`);
    - `duration` ירוק, ושעות העשייה בלי סימון (`about-section.tsx`);
    - `outcome`, `good` ו-`lecturersSummary` צהובים;
    - ציונים לפי שאלה: פס במרקר הצהוב (`grads-section.tsx`);
    - `weak` ורוד, ואם אין סיכום חולשה, הפרק החלש בסילבוס;
    - `classSize`, `promises`, והערת המוסד על המרצים כשאין מרצים: קו כחול;
    - כל השאר בלי סימון, כמו בעמוד הקורס.

    שורה שאין בה ערך לאף קורס יורדת.
12. **הטבלה בנייד:** ראש דביק עם מספר מוקף ושם לכל קורס. שורה מסוג `figure` (מספר קצר) נשארת בעמודות מתחת לראש. שורה מסוג `text` (משפט) יורדת: כל תא בשורה משלו, עם המספר של הקורס. התווית של כל שורה בשורה משלה מעליה. במחשב: עמודת תוויות ועמודה לכל קורס. ה-DOM אחד, עם `role="table"`, `row`, `columnheader`, `rowheader` ו-`cell` על רכיבי `div`, כי רשת CSS על `<table>` מוחקת את הסמנטיקה בחלק מהדפדפנים.
13. **`outcomeHeadline` עובר ל-`web/src/lib/format.ts`,** כי גם ההשוואה צריכה אותו, וקוד ב-`lib` לא מייבא מ-`components`. `at-a-glance.tsx` מייבא אותו משם ומייצא אותו הלאה, כך ש-`about-section.tsx` לא משתנה.
14. **`isProductType` עובר ל-`web/src/lib/search/types.ts`,** כי גם `course-page.ts` צריך אותו. `catalog.ts` מייבא אותו משם.
15. **`verifiedFactsOf` עובר ל-`web/src/lib/data/shared.ts`,** כי עמוד הקורס ועמוד המרצה צריכים בדיוק את אותו סינון: עובדה בלי קישור תקין למקור לא מוצגת.
16. **וואטסאפ:**
    - הקישור: `https://wa.me/?text=<הודעה>\n<כתובת>`, עם `encodeURIComponent` (`whatsappHref`).
    - ההודעה: `courseShareTitle`, שורה חדשה, `courseShareDescription` (`courseShareMessage`).
    - הכתובת נבנית בשרת מ-`SITE_URL`, כמו בתמונת השיתוף. בדפדפן `process.env.SITE_URL` לא קיים.
    - "שיתוף אחר" רק כש-`navigator.share` קיים וגם `(pointer: coarse)`, דרך `useSyncExternalStore` עם `false` בשרת, כדי שלא תהיה אי-התאמה בהידרציה.
17. **המובילים:** עד 3, רק `score.status === 'scored'`, מהתחום ומתחומי המשנה (כמו הספירה ב-`catalog.ts`). בתיקו `verifiedCount`. אין שום מיון לפי מספר בוגרים בלי ציון, ובוודאי לא לפי נרשמים.
18. **בלי Zod ובלי תלויות חדשות.**

## איפה המקורות לא מסכימים, ומה הוחלט

1. **"עמוד נפרד לכל מרצה, עם... הממוצע של הבוגרים שלו"** (מסמך חלק 1, סעיף 8) מול ההחלטה של גל: אין ממוצע. גל גובר (החלטה 2).
2. **"`lecturers` may have no slug. If so, add one in a NEW migration"** (הבקשה): יש slug. אין migration (החלטה 1).
3. **"עמודים סטטיים" מול השוואה לפי הכתובת:** קריאה של `searchParams` בשרת אסורה עם `'navigation'` (`ensureStatic.md`: "Runtime data, such as `cookies()`, `headers()`, and server-side `searchParams`"). לכן הכתובת נקראת בדפדפן (החלטה 8).
4. **"Institution claims get the blue underline"** מול טבלת מוסדות בלי טקסט של המוסד: הטענות הן "המוסד מבטיח" של כל קורס (מסמך העיצוב, סעיף 2).

## מבנה הקבצים בתוכנית הזו

```
web/src/lib/search/types.ts                        # isProductType
web/src/lib/data/catalog.ts                        # מייבא את isProductType
web/src/lib/data/shared.ts                         # VerifiedFact, verifiedFactsOf
web/src/lib/data/course-page.ts                    # institutionSlug, productType, verifiedFactsOf
web/src/lib/format.ts                              # outcomeHeadline (עבר מ-at-a-glance)
web/src/components/course/at-a-glance.tsx          # מייבא ומייצא את outcomeHeadline
web/src/lib/advisor/sample-course.ts               # השדות החדשים
web/src/lib/data/course-order.ts                   # חדש: compareByScore
web/src/lib/data/course-order.test.ts              # 2 בדיקות
web/src/lib/data/institution-page.ts               # חדש: getInstitutionPage, getInstitutionSlugs
web/src/lib/data/lecturer-page.ts                  # חדש: getLecturerPage, getLecturerSlugs
web/src/lib/compare/param.ts                       # חדש: ?c=, pickCompared, slotsLeftText
web/src/lib/compare/param.test.ts                  # 5 בדיקות
web/src/lib/compare/rows.ts                        # חדש: CompareCourse, toCompareCourse, buildCompareRows
web/src/lib/compare/rows.test.ts                   # 6 בדיקות
web/src/lib/search/top.ts                          # חדש: topByGraduates
web/src/lib/search/top.test.ts                     # 2 בדיקות
web/src/lib/og/share-text.ts                       # courseShareMessage, compareShareMessage, whatsappHref
web/src/lib/og/share-text.test.ts                  # 3 בדיקות נוספות
.impeccable/surfaces/*.md                          # שני חוזים חדשים (דרך impeccable surface-brief write)
web/src/components/course/course-row.tsx           # חדש: קורס ברשימה של מוסד ומרצה
web/src/app/institutions/[slug]/page.tsx           # העמוד במקום "בקרוב"
web/src/app/institutions/[slug]/not-found.tsx      # חדש
web/src/app/courses/[slug]/page.tsx                # החותמת מקשרת למוסד; share ל-CourseActions
web/e2e/institution.spec.ts                        # חדש: 2 בדיקות
web/src/components/course/share-links.tsx          # חדש: "לשלוח בוואטסאפ" ו"שיתוף אחר"
web/src/components/course/course-actions.tsx       # share; קישורים לעמוד ההשוואה
web/e2e/course-page.spec.ts                        # הקישור לוואטסאפ
web/src/components/lecturer/lecturer-about.tsx     # חדש: לפי המוסד, ומה בדקנו
web/src/app/lecturers/[slug]/page.tsx              # חדש
web/src/app/lecturers/[slug]/not-found.tsx         # חדש
web/src/components/course/lecturers-section.tsx    # השם מקשר לעמוד המרצה; initials מיוצא
web/e2e/lecturer.spec.ts                           # חדש: 2 בדיקות
web/src/components/category/top-by-graduates.tsx   # חדש
web/src/app/categories/[slug]/page.tsx             # הרכיב ב-headSide
web/e2e/catalog.spec.ts                            # המובילים בתחום הבישול
web/src/lib/data/compare.ts                        # חדש: getCompareCourses
web/src/components/compare/compare-table.tsx       # חדש: הטבלה והתאים
web/src/components/compare/compare-shelf.tsx       # חדש: מה שהוצא, ומה ששמרתם
web/src/components/compare/compare-from-url.tsx    # חדש: הכתובת, המגש והפעולות
web/src/app/compare/page.tsx                       # העמוד במקום "בקרוב"
web/src/components/account/compare-tray.tsx        # "נפתח בקרוב" יורד, ובמקומו כמה מקומות נשארו
web/e2e/compare.spec.ts                            # חדש: 2 בדיקות
DESIGN.md, .impeccable/design.json                 # אחרי סקירת הסיום
docs/STATUS.md, docs/ROADMAP.md, docs/superpowers/plans/notes-for-plan-2.md, docs/sessions/2026-11-15-round-4.md
```

---

### Task 1: הנתונים: עמוד מוסד, עמוד מרצה, ומה שעמוד הקורס מוסיף

**Files:**
- Modify: `web/src/lib/search/types.ts` (אחרי `PRODUCT_TYPES`)
- Modify: `web/src/lib/data/catalog.ts` (הייבוא, ושורת `isProductType`)
- Modify: `web/src/lib/data/shared.ts` (הקובץ כולו)
- Modify: `web/src/lib/data/course-page.ts` (הייבוא, `LecturerView`, `CoursePageData`, השאילתה וההחזרה)
- Modify: `web/src/lib/format.ts` (ייבוא בראש, ופונקציה בסוף)
- Modify: `web/src/components/course/at-a-glance.tsx` (ראש הקובץ בלבד)
- Modify: `web/src/lib/advisor/sample-course.ts`
- Create: `web/src/lib/data/course-order.ts`
- Test: `web/src/lib/data/course-order.test.ts`
- Create: `web/src/lib/data/institution-page.ts`
- Create: `web/src/lib/data/lecturer-page.ts`

- [ ] **Step 1: הבדיקה של הסדר**

Create `web/src/lib/data/course-order.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { sampleCourse } from '@/lib/advisor/sample-course';
import { compareByScore } from './course-order';
import type { CoursePageData } from './course-page';

const scored = (title: string, value: number, status: CoursePageData['status'] = 'active') =>
  sampleCourse({ title, status, score: { status: 'scored', value, reviewCount: 6, recommendPct: null, stale: false } });
const unscored = (title: string, reviews: number) =>
  sampleCourse({
    title,
    reviewTotal: reviews,
    score: { status: 'not_enough_reviews', reviewCount: reviews, reviewsNeeded: 5 - reviews },
  });

describe('compareByScore', () => {
  it('puts scored courses first, highest first, then the ones closest to a score, and removed ones last', () => {
    const list = [unscored('ג', 0), scored('ב', 7.1), scored('א', 9.5, 'removed'), scored('ד', 9), unscored('ה', 3)];
    expect(list.sort(compareByScore).map((c) => c.title)).toEqual(['ד', 'ב', 'ה', 'ג', 'א']);
  });

  it('breaks a tie by the title', () => {
    expect([scored('ב', 8), scored('א', 8)].sort(compareByScore).map((c) => c.title)).toEqual(['א', 'ב']);
  });
});
```

- [ ] **Step 2: להריץ ולראות שנכשלת**

Run: `pnpm --dir web test src/lib/data/course-order.test.ts`
Expected: FAIL, `Failed to resolve import "./course-order"`.

- [ ] **Step 3: `isProductType` במקום אחד**

In `web/src/lib/search/types.ts`, replace:

```ts
export const PRODUCT_TYPES: readonly ProductType[] = ['course', 'workshop', 'lecture'];
```

with:

```ts
export const PRODUCT_TYPES: readonly ProductType[] = ['course', 'workshop', 'lecture'];
/** ערך מהמסד (courses.product_type), שאולי לא מוכר לקוד. */
export const isProductType = (value: string): value is ProductType => (PRODUCT_TYPES as readonly string[]).includes(value);
```

In `web/src/lib/data/catalog.ts`, replace:

```ts
import {
  COURSE_FORMATS,
  PRODUCT_TYPES,
  TIME_SLOTS,
  type Catalog,
  type CategoryEntry,
  type CourseFormat,
  type CourseSummary,
  type ProductType,
  type RowScore,
  type TimeSlot,
} from '@/lib/search/types';
```

with:

```ts
import {
  COURSE_FORMATS,
  TIME_SLOTS,
  isProductType,
  type Catalog,
  type CategoryEntry,
  type CourseFormat,
  type CourseSummary,
  type RowScore,
  type TimeSlot,
} from '@/lib/search/types';
```

ומוחקים מאותו קובץ את השורה:

```ts
const isProductType = (value: string): value is ProductType => (PRODUCT_TYPES as readonly string[]).includes(value);
```

- [ ] **Step 4: `verifiedFactsOf` במקום אחד**

Replace the whole of `web/src/lib/data/shared.ts` with:

```ts
import { safeHttpUrl } from '@/lib/safe-url';

/** שאילתה שנכשלה זורקת שגיאה, כדי שהבנייה תיכשל ולא תציג בשקט רשימה ריקה. */
export function queryError(what: string, error: { message: string }): Error {
  return new Error(`${what} query failed: ${error.message}`, { cause: error });
}

/** PostgREST מחזיר קשר "אחד" לפעמים כאובייקט ולפעמים כמערך. */
export function one<T>(ref: T | T[] | null): T | null {
  return Array.isArray(ref) ? (ref[0] ?? null) : ref;
}

/** עובדה שבדקנו בעצמנו על מרצה, עם קישור למקור. */
export interface VerifiedFact {
  text: string;
  sourceUrl: string;
}

/**
 * lecturers.verified_facts מהמסד. עובדה בלי טקסט או בלי קישור תקין למקור לא מוצגת:
 * ההבטחה היא שלכל עובדה שבדקנו יש מקור. עמוד הקורס ועמוד המרצה משתמשים בזה.
 */
export function verifiedFactsOf(raw: unknown): VerifiedFact[] {
  return (Array.isArray(raw) ? (raw as unknown[]) : []).flatMap((f) => {
    const fact = f as { text?: unknown; source_url?: unknown } | null;
    const sourceUrl = safeHttpUrl(fact?.source_url);
    return typeof fact?.text === 'string' && fact.text !== '' && sourceUrl ? [{ text: fact.text, sourceUrl }] : [];
  });
}
```

- [ ] **Step 5: עמוד הקורס מקבל את ה-slug של המוסד ואת סוג המוצר**

In `web/src/lib/data/course-page.ts`, replace:

```ts
import type { AuthorTitle } from '@/lib/reviews/types';
import { one, queryError } from './shared';
```

with:

```ts
import type { AuthorTitle } from '@/lib/reviews/types';
import { isProductType, type ProductType } from '@/lib/search/types';
import { one, queryError, verifiedFactsOf, type VerifiedFact } from './shared';
```

Replace:

```ts
  verifiedFacts: { text: string; sourceUrl: string }[];
```

with:

```ts
  verifiedFacts: VerifiedFact[];
```

Replace:

```ts
  status: Exclude<Database['public']['Enums']['course_status'], 'draft'>;
  institutionName: string;
```

with:

```ts
  status: Exclude<Database['public']['Enums']['course_status'], 'draft'>;
  /** קורס, סדנה או הרצאה. */
  productType: ProductType;
  institutionName: string;
  /** לקישור לעמוד המוסד (סבב 4). */
  institutionSlug: string;
```

Replace:

```ts
lecturers_summary, last_checked_at, institutions(name), categories(name, slug)',
```

with:

```ts
lecturers_summary, last_checked_at, product_type, institutions(name, slug), categories(name, slug)',
```

Replace:

```ts
  const institution = one(course.institutions as { name: string } | { name: string }[] | null);
```

with:

```ts
  const institution = one(course.institutions as { name: string; slug: string } | { name: string; slug: string }[] | null);
```

Replace:

```ts
      // עובדה בלי טקסט או בלי קישור תקין למקור לא מוצגת: ההבטחה היא שלכל עובדה שנבדקה יש מקור.
      verifiedFacts: (Array.isArray(lecturer.verified_facts) ? (lecturer.verified_facts as unknown[]) : []).flatMap(
        (f) => {
          const fact = f as { text?: unknown; source_url?: unknown } | null;
          const sourceUrl = safeHttpUrl(fact?.source_url);
          return typeof fact?.text === 'string' && fact.text !== '' && sourceUrl
            ? [{ text: fact.text, sourceUrl }]
            : [];
        },
      ),
```

with:

```ts
      verifiedFacts: verifiedFactsOf(lecturer.verified_facts),
```

Replace:

```ts
    status: course.status as CoursePageData['status'],
    institutionName: institution?.name ?? '',
```

with:

```ts
    status: course.status as CoursePageData['status'],
    productType: isProductType(course.product_type) ? course.product_type : 'course',
    institutionName: institution?.name ?? '',
    institutionSlug: institution?.slug ?? '',
```

`safeHttpUrl` נשאר בשימוש בקובץ (`videoUrl`), ולכן הייבוא שלו לא משתנה.

- [ ] **Step 6: `outcomeHeadline` עובר ל-`format.ts`**

In `web/src/lib/format.ts`, add at the top of the file:

```ts
import type { OutcomeView } from '@/lib/data/course-page';
```

and add at the end of the file:

```ts
/** מה קרה לבוגרים, במילים של אנשים. אותו ניסוח ב"בקצרה", בפתק של "על הקורס" ובהשוואה. */
export function outcomeHeadline(outcome: OutcomeView): string {
  switch (outcome.kind) {
    case 'after_3m':
      return `${outcome.n} בוגרים ענו 3 חודשים אחרי הסיום`;
    case 'skill_gained':
      return `${outcome.yes} מתוך ${outcome.n} אומרים שרכשו את המיומנות`;
    case 'passed_exam':
      return `${outcome.yes} מתוך ${outcome.n} אומרים שעברו את המבחן`;
  }
}
```

In `web/src/components/course/at-a-glance.tsx`, replace:

```tsx
import type { CoursePageData, OutcomeView } from '@/lib/data/course-page';
import { PAID_RANGE_LEAD, formatIls, formatPaidRange, invoiceCountText } from '@/lib/format';
import { Mark } from './marks';

/** מה קרה לבוגרים, במילים של אנשים. אותו ניסוח ב"בקצרה" ובפתק של "על הקורס". */
export function outcomeHeadline(outcome: OutcomeView): string {
  switch (outcome.kind) {
    case 'after_3m':
      return `${outcome.n} בוגרים ענו 3 חודשים אחרי הסיום`;
    case 'skill_gained':
      return `${outcome.yes} מתוך ${outcome.n} אומרים שרכשו את המיומנות`;
    case 'passed_exam':
      return `${outcome.yes} מתוך ${outcome.n} אומרים שעברו את המבחן`;
  }
}
```

with:

```tsx
import type { CoursePageData } from '@/lib/data/course-page';
import { PAID_RANGE_LEAD, formatIls, formatPaidRange, invoiceCountText, outcomeHeadline } from '@/lib/format';
import { Mark } from './marks';

/** עבר ל-lib/format.ts, כי גם ההשוואה משתמשת בו. מיוצא מכאן בשביל about-section.tsx. */
export { outcomeHeadline };
```

שאר הקובץ לא משתנה.

- [ ] **Step 7: נתוני הבדיקה**

In `web/src/lib/advisor/sample-course.ts`, replace:

```ts
    status: 'active',
    institutionName: 'סדנה לדוגמה',
```

with:

```ts
    status: 'active',
    productType: 'course',
    institutionName: 'סדנה לדוגמה',
    institutionSlug: 'sample-kitchen',
```

- [ ] **Step 8: הסדר**

Create `web/src/lib/data/course-order.ts`:

```ts
import type { CoursePageData } from './course-page';

type Orderable = Pick<CoursePageData, 'title' | 'status' | 'score' | 'reviewTotal'>;

/**
 * הסדר של הקורסים בעמוד מוסד ובעמוד מרצה:
 * - קודם קורסים עם ציון, מהגבוה לנמוך;
 * - אחריהם קורסים בלי ציון, מי שיש לו יותר ביקורות מאומתות קודם (הוא הכי קרוב לציון);
 * - ובסוף קורסים שכבר לא מוצעים.
 * בתיקו לפי השם. זה סדר של קורסים, לא ציון למוסד או למרצה.
 */
export function compareByScore(a: Orderable, b: Orderable): number {
  const removed = Number(a.status === 'removed') - Number(b.status === 'removed');
  if (removed !== 0) return removed;
  const scoreA = a.score.status === 'scored' ? a.score.value : null;
  const scoreB = b.score.status === 'scored' ? b.score.value : null;
  if (scoreA !== null && scoreB === null) return -1;
  if (scoreA === null && scoreB !== null) return 1;
  if (scoreA !== null && scoreB !== null && scoreA !== scoreB) return scoreB - scoreA;
  if (a.reviewTotal !== b.reviewTotal) return b.reviewTotal - a.reviewTotal;
  return a.title.localeCompare(b.title, 'he');
}
```

- [ ] **Step 9: להריץ ולראות שעוברת**

Run: `pnpm --dir web test src/lib/data/course-order.test.ts`
Expected: PASS, `2 passed`.

- [ ] **Step 10: עמוד המוסד במטמון**

Create `web/src/lib/data/institution-page.ts`:

```ts
import { cacheLife, cacheTag } from 'next/cache';
import { safeHttpUrl } from '@/lib/safe-url';
import { createPublicClient } from '@/lib/supabase/public-client';
import { one, queryError } from './shared';

/** הסוגים שבמסד (institutions.kind). */
export type InstitutionKind = 'college' | 'school' | 'independent' | 'university' | 'other';

const KINDS: readonly InstitutionKind[] = ['college', 'school', 'independent', 'university', 'other'];
const isKind = (value: string): value is InstitutionKind => (KINDS as readonly string[]).includes(value);

/** מה כתוב ליד השם. "עסק עצמאי" ולא "מרצה עצמאי": אין לנו מין דקדוקי של המוסד. */
export const INSTITUTION_KIND_LABEL: Record<InstitutionKind, string> = {
  college: 'מכללה',
  school: 'בית ספר',
  university: 'אוניברסיטה',
  independent: 'עסק עצמאי',
  other: 'מוסד לימודים',
};

export interface InstitutionPageData {
  slug: string;
  name: string;
  kind: InstitutionKind;
  /** רק כתובת http או https תקינה (safeHttpUrl). */
  website: string | null;
  /** הקורסים שאינם טיוטה, גם מה שכבר לא מוצע. הפרטים של כל אחד מ-getCoursePage, מהמטמון של עמוד הקורס. */
  courseSlugs: string[];
}

/**
 * עמוד המוסד, מהמטמון של Next. נשמר לשעות. catalog: אישור של ביקורת או של קורס כבר מרענן את התגית הזו.
 * אין כאן ציון למוסד (החלטה של גל, 15.11.2026): רק הרשימה, והציון של כל קורס מגיע מעמוד הקורס.
 */
export async function getInstitutionPage(slug: string): Promise<InstitutionPageData | null> {
  'use cache';
  cacheLife('hours');
  cacheTag(`institution:${slug}`, 'catalog');
  return loadInstitutionPage(slug);
}

/** המוסדות שיש להם קורס שאינו טיוטה, לבנייה מראש. שאילתה שנכשלה זורקת שגיאה, כדי שהבנייה תיכשל ולא תדלג בשקט. */
export async function getInstitutionSlugs(): Promise<string[]> {
  const { data, error } = await createPublicClient().from('courses').select('institutions(slug)').neq('status', 'draft');
  if (error) throw queryError('institution slugs', error);
  const slugs = data.flatMap((row) => {
    const institution = one(row.institutions as { slug: string } | { slug: string }[] | null);
    return institution ? [institution.slug] : [];
  });
  return [...new Set(slugs)].sort();
}

/** הטעינה עצמה, בלי מטמון. מוסד בלי אף קורס שאינו טיוטה מחזיר null, ולכן 404: לא מפרסמים עמוד ריק. */
export async function loadInstitutionPage(slug: string): Promise<InstitutionPageData | null> {
  const db = createPublicClient();
  const { data: institution, error } = await db
    .from('institutions')
    .select('id, slug, name, website, kind')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw queryError('institution', error);
  if (!institution) return null;

  const { data: courses, error: coursesError } = await db
    .from('courses')
    .select('slug')
    .eq('institution_id', institution.id)
    .neq('status', 'draft')
    .order('slug');
  if (coursesError) throw queryError('institution courses', coursesError);
  if (courses.length === 0) return null;

  return {
    slug: institution.slug,
    name: institution.name,
    kind: isKind(institution.kind) ? institution.kind : 'other',
    website: safeHttpUrl(institution.website),
    courseSlugs: courses.map((course) => course.slug),
  };
}
```

- [ ] **Step 11: עמוד המרצה במטמון**

Create `web/src/lib/data/lecturer-page.ts`:

```ts
import { cacheLife, cacheTag } from 'next/cache';
import { createPublicClient } from '@/lib/supabase/public-client';
import { one, queryError, verifiedFactsOf, type VerifiedFact } from './shared';

export interface LecturerPageData {
  slug: string;
  name: string;
  /** טענה של המוסד, לא נבדקה. */
  institutionBio: string | null;
  /** רק מה שבדקנו בעצמנו, עם קישור למקור. */
  verifiedFacts: VerifiedFact[];
  /** הקורסים שהוא מלמד, והתפקיד בכל אחד. הפרטים של כל קורס מ-getCoursePage. */
  courses: { slug: string; role: string | null }[];
}

/** עמוד המרצה, מהמטמון. כמו עמוד המוסד: לשעות, ו-catalog מרענן אותו. אין ציון למרצה (החלטה של גל, 15.11.2026). */
export async function getLecturerPage(slug: string): Promise<LecturerPageData | null> {
  'use cache';
  cacheLife('hours');
  cacheTag(`lecturer:${slug}`, 'catalog');
  return loadLecturerPage(slug);
}

/** המרצים לבנייה מראש. ההרשאות במסד מחזירות רק מרצים שיש להם קורס שאינו טיוטה. */
export async function getLecturerSlugs(): Promise<string[]> {
  const { data, error } = await createPublicClient().from('lecturers').select('slug').order('slug');
  if (error) throw queryError('lecturer slugs', error);
  return data.map((row) => row.slug);
}

type CourseLink = { role: string | null; courses: { slug: string } | { slug: string }[] | null };

/** הטעינה עצמה, בלי מטמון. מרצה בלי קורס שאינו טיוטה מחזיר null, ולכן 404. */
export async function loadLecturerPage(slug: string): Promise<LecturerPageData | null> {
  const { data, error } = await createPublicClient()
    .from('lecturers')
    .select('slug, name, institution_bio, verified_facts, course_lecturers(role, courses(slug))')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw queryError('lecturer', error);
  if (!data) return null;
  // ההרשאות במסד מחזירות רק שורות של קורסים שאינם טיוטה.
  const courses = ((data.course_lecturers ?? []) as unknown as CourseLink[]).flatMap((row) => {
    const course = one(row.courses);
    return course ? [{ slug: course.slug, role: row.role }] : [];
  });
  if (courses.length === 0) return null;
  return {
    slug: data.slug,
    name: data.name,
    institutionBio: data.institution_bio,
    verifiedFacts: verifiedFactsOf(data.verified_facts),
    courses,
  };
}
```

- [ ] **Step 12: הכול ירוק**

```bash
cd "C:/Users/galsa/Desktop/קורסים השוואות"
pnpm --dir web lint && pnpm --dir web exec tsc --noEmit && pnpm --dir web test
```

Expected: בלי שגיאות. בדיקות היחידה: 117 (115 ועוד 2). אם `tsc` מתלונן על `product_type` או על `institutions(name, slug)`, הטיפוסים ב-`web/src/lib/database.types.ts` כבר כוללים את העמודות. מתקנים את ה-cast, לא את הקובץ שנוצר.

- [ ] **Step 13: Commit**

```bash
git add web/src/lib web/src/components/course/at-a-glance.tsx
git commit -m "feat: הנתונים של עמוד מוסד ועמוד מרצה, וה-slug של המוסד בעמוד הקורס"
```

---

### Task 2: ההשוואה: הכתובת והשורות (TDD)

**Files:**
- Create: `web/src/lib/compare/param.ts`
- Test: `web/src/lib/compare/param.test.ts`
- Create: `web/src/lib/compare/rows.ts`
- Test: `web/src/lib/compare/rows.test.ts`

- [ ] **Step 1: הבדיקות של הכתובת**

Create `web/src/lib/compare/param.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { compareHref, parseCompareParam, pickCompared, slotsLeftText } from './param';

describe('parseCompareParam', () => {
  it('reads the slugs in the order of the link', () => {
    expect(parseCompareParam('full-stack-sample,baking-sample')).toEqual(['full-stack-sample', 'baking-sample']);
  });

  it('drops spaces, capitals, repeats and anything that is not a slug, and keeps at most 3', () => {
    expect(parseCompareParam(' Full-Stack-Sample , baking-sample,full-stack-sample')).toEqual([
      'full-stack-sample',
      'baking-sample',
    ]);
    expect(parseCompareParam('../admin,a b,,ok-1,<x>')).toEqual(['ok-1']);
    expect(parseCompareParam('a,b,c,d')).toEqual(['a', 'b', 'c']);
    expect(parseCompareParam(null)).toEqual([]);
  });

  it('reads back the link it builds, also when the commas are encoded', () => {
    const href = compareHref(['a-sample', 'b-sample']);
    expect(href).toBe('/compare?c=a-sample,b-sample');
    expect(parseCompareParam(new URL(href, 'https://example.com').searchParams.get('c'))).toEqual(['a-sample', 'b-sample']);
    expect(parseCompareParam(new URLSearchParams('c=a-sample%2Cb-sample').get('c'))).toEqual(['a-sample', 'b-sample']);
  });
});

describe('pickCompared', () => {
  const courses = [
    { id: '1', slug: 'a' },
    { id: '2', slug: 'b' },
  ];

  it('keeps the order of the link or the tray, and reports what is no longer on the site', () => {
    expect(pickCompared(courses, { slugs: ['b', 'gone', 'a'] })).toEqual({ chosen: [courses[1], courses[0]], missing: ['gone'] });
    expect(pickCompared(courses, { ids: ['2', '9'] })).toEqual({ chosen: [courses[1]], missing: ['9'] });
  });
});

describe('slotsLeftText', () => {
  it('says how many places are left', () => {
    expect([0, 1, 2, 3].map((n) => slotsLeftText(n))).toEqual([
      'נשארו 3 מקומות',
      'נשארו 2 מקומות',
      'נשאר מקום אחד',
      'ההשוואה מלאה',
    ]);
  });
});
```

- [ ] **Step 2: הבדיקות של השורות**

Create `web/src/lib/compare/rows.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { sampleCourse } from '@/lib/advisor/sample-course';
import { buildCompareRows, toCompareCourse, type CompareSection } from './rows';

const rowOf = (sections: CompareSection[], key: string) => sections.flatMap((s) => s.rows).find((r) => r.key === key);
const course = (overrides: Parameters<typeof sampleCourse>[0] = {}) => toCompareCourse(sampleCourse(overrides));

describe('buildCompareRows', () => {
  it('marks each cell with the same source as the course page', () => {
    const sections = buildCompareRows([course()]);
    expect(rowOf(sections, 'paid')?.cells[0]).toEqual({
      text: 'בין 2,000 ל-4,000 ₪',
      source: 'verified',
      sub: 'לפי 5 חשבוניות ומעלה',
    });
    expect(rowOf(sections, 'duration')?.cells[0]).toEqual({
      text: '2 חודשים, 24 שעות',
      source: 'verified',
      sub: 'מהן 18 שעות עשייה',
    });
    expect(rowOf(sections, 'good')?.cells[0]).toEqual({ text: 'הרבה עבודה בידיים', source: 'grads' });
    expect(rowOf(sections, 'weak')?.cells[0]).toEqual({ text: 'המחמצת קצרה מדי', source: 'weak' });
    expect(rowOf(sections, 'classSize')?.cells[0]).toEqual({ text: 'עד 12 משתתפים', source: 'claim' });
    expect(rowOf(sections, 'promises')?.cells[0]).toEqual({ text: 'כל משתתף יוצא עם מחמצת משלו', source: 'claim' });
    expect(rowOf(sections, 'sitePrice')?.cells[0]).toEqual({ text: '1,200 ₪' });
  });

  it('falls back to the weak chapter of the syllabus, like "בקצרה"', () => {
    expect(rowOf(buildCompareRows([course({ summaryWeak: null })]), 'weak')?.cells[0]).toEqual({
      lead: 'פרק חלש:',
      text: 'מחמצת',
      source: 'weak',
    });
  });

  it('shows the score with the verified count, or how many reviews are missing', () => {
    const scored = course({ score: { status: 'scored', value: 7.9, reviewCount: 23, recommendPct: 91, stale: false } });
    const waiting = course({
      id: 'b',
      slug: 'b-sample',
      score: { status: 'not_enough_reviews', reviewCount: 3, reviewsNeeded: 2 },
    });
    const sections = buildCompareRows([scored, waiting]);
    expect(rowOf(sections, 'score')?.cells).toEqual([
      { text: '7.9', big: true, sub: '23 בוגרים מאומתים' },
      { text: 'עוד אין ציון', sub: '3 ביקורות מאומתות, עוד 2 ביקורות עד לציון' },
    ]);
    expect(rowOf(sections, 'recommend')?.cells).toEqual([{ text: '91%' }, { text: null, missing: 'עוד אין ציון' }]);
  });

  it('keeps one row per question across the courses, and says when a course has no answer yet', () => {
    const a = course({ metrics: [{ key: 'teaching', label: 'איכות הוראה', mean: 4.2, n: 6 }] });
    const b = course({
      id: 'b',
      slug: 'b-sample',
      metrics: [
        { key: 'teaching', label: 'איכות הוראה', mean: 3.8, n: 6 },
        { key: 'value', label: 'ערך לכסף', mean: 4, n: 6 },
      ],
    });
    const metrics = buildCompareRows([a, b]).find((s) => s.key === 'metrics');
    expect(metrics?.rows.map((r) => r.label)).toEqual(['איכות הוראה', 'ערך לכסף']);
    expect(metrics?.rows[1].cells).toEqual([
      { text: null, missing: 'אין עדיין' },
      { text: '4.0', source: 'grads', bar: 4 },
    ]);
  });

  it('drops a row that no course has, and keeps a row that one course has', () => {
    const a = course({ admission: null, certificate: 'תעודת סיום' });
    const b = course({ id: 'b', slug: 'b-sample', admission: null, certificate: null });
    const keys = buildCompareRows([a, b]).flatMap((s) => s.rows.map((r) => r.key));
    expect(keys).not.toContain('admission');
    expect(keys).toContain('certificate');
  });

  it('links each lecturer to their page, with the role', () => {
    const c = course({
      lecturers: [{ slug: 'yael-sample', name: 'יעל', role: 'מרצה', institutionBio: null, verifiedFacts: [], otherCoursesCount: 0 }],
    });
    expect(rowOf(buildCompareRows([c]), 'lecturers')?.cells[0]).toEqual({
      text: 'יעל',
      links: [{ href: '/lecturers/yael-sample', label: 'יעל', sub: 'מרצה' }],
    });
  });
});
```

- [ ] **Step 3: להריץ ולראות שנכשלות**

Run: `pnpm --dir web test src/lib/compare`
Expected: FAIL, `Failed to resolve import "./param"` ו-`Failed to resolve import "./rows"`.

- [ ] **Step 4: הכתובת**

Create `web/src/lib/compare/param.ts`:

```ts
import { MAX_COMPARE } from '@/lib/account/lists';

/** הפרמטר בכתובת: /compare?c=full-stack-sample,baking-sample */
export const COMPARE_PARAM = 'c';

/** אותו כלל כמו האילוץ על courses.slug במסד. */
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * הקורסים מקישור: לפי הסדר, בלי רווחים, באותיות קטנות, בלי כפילויות, ועד 3.
 * כל מה שאינו slug נזרק, כך שקישור שגוי לא שובר את העמוד.
 */
export function parseCompareParam(value: string | null): string[] {
  if (!value) return [];
  const slugs = value
    .split(',')
    .map((part) => part.trim().toLowerCase())
    .filter((part) => SLUG.test(part));
  return [...new Set(slugs)].slice(0, MAX_COMPARE);
}

/** קישור להשוואה. גם בלי קורסים נשאר `?c=`, כדי שהעמוד יישאר במצב קישור ולא יעבור למגש. */
export function compareHref(slugs: readonly string[]): string {
  return `/compare?${COMPARE_PARAM}=${slugs.join(',')}`;
}

/**
 * הקורסים להשוואה, לפי הסדר של הקישור או של המגש. missing: מה שלא נמצא בקטלוג,
 * כי הוסר מהאתר או כי הקישור שגוי.
 */
export function pickCompared<T extends { id: string; slug: string }>(
  courses: readonly T[],
  ref: { slugs: readonly string[] } | { ids: readonly string[] },
): { chosen: T[]; missing: string[] } {
  const bySlug = 'slugs' in ref;
  const keys = bySlug ? ref.slugs : ref.ids;
  const chosen: T[] = [];
  const missing: string[] = [];
  for (const key of keys) {
    const course = courses.find((c) => (bySlug ? c.slug : c.id) === key);
    if (course) chosen.push(course);
    else missing.push(key);
  }
  return { chosen, missing };
}

/** "נשארו 2 מקומות": בעמוד ההשוואה ובמגש באזור האישי. */
export function slotsLeftText(taken: number): string {
  const left = Math.max(0, MAX_COMPARE - taken);
  if (left === 0) return 'ההשוואה מלאה';
  if (left === 1) return 'נשאר מקום אחד';
  return `נשארו ${left} מקומות`;
}
```

- [ ] **Step 5: השורות**

Create `web/src/lib/compare/rows.ts`:

```ts
import type { CoursePageData, OutcomeView } from '@/lib/data/course-page';
import {
  PAID_RANGE_LEAD,
  formatHebrewDate,
  formatIls,
  formatPaidRange,
  invoiceCountText,
  outcomeHeadline,
  reviewsToScoreText,
  verifiedGraduatesText,
  verifiedReviewsText,
} from '@/lib/format';
import { FORMAT_LABEL } from '@/lib/search/types';

/** מה שעמוד ההשוואה צריך מכל קורס: חלק מעמוד הקורס, בלי ביקורות, סילבוס וסרטון. כך העמוד הסטטי קטן. */
export type CompareCourse = Pick<
  CoursePageData,
  | 'id'
  | 'slug'
  | 'title'
  | 'institutionName'
  | 'institutionSlug'
  | 'score'
  | 'sitePrice'
  | 'paid'
  | 'costPerHandsOnHour'
  | 'totalHours'
  | 'handsOnHours'
  | 'durationMonths'
  | 'schedule'
  | 'formats'
  | 'region'
  | 'nextCohortDate'
  | 'admission'
  | 'classSizeNote'
  | 'certificate'
  | 'institutionPromises'
  | 'summaryGood'
  | 'summaryWeak'
  | 'metrics'
  | 'outcome'
  | 'lecturersNote'
  | 'lecturersSummary'
> & {
  /** הפרק הראשון שסומן כחלש בסילבוס. מוצג כשאין סיכום חולשה של הבוגרים, כמו ב"בקצרה". */
  weakChapter: string | null;
  lecturers: { slug: string; name: string; role: string | null }[];
};

export function toCompareCourse(page: CoursePageData): CompareCourse {
  return {
    id: page.id,
    slug: page.slug,
    title: page.title,
    institutionName: page.institutionName,
    institutionSlug: page.institutionSlug,
    score: page.score,
    sitePrice: page.sitePrice,
    paid: page.paid,
    costPerHandsOnHour: page.costPerHandsOnHour,
    totalHours: page.totalHours,
    handsOnHours: page.handsOnHours,
    durationMonths: page.durationMonths,
    schedule: page.schedule,
    formats: page.formats,
    region: page.region,
    nextCohortDate: page.nextCohortDate,
    admission: page.admission,
    classSizeNote: page.classSizeNote,
    certificate: page.certificate,
    institutionPromises: page.institutionPromises,
    summaryGood: page.summaryGood,
    summaryWeak: page.summaryWeak,
    metrics: page.metrics,
    outcome: page.outcome,
    lecturersNote: page.lecturersNote,
    lecturersSummary: page.lecturersSummary,
    weakChapter: page.syllabus.find((item) => item.weak)?.title ?? null,
    lecturers: page.lecturers.map(({ slug, name, role }) => ({ slug, name, role })),
  };
}

/** מאיפה המידע בתא: אותו סימון כמו בעמוד הקורס. בלי: דיו רגילה. */
export type CellSource = 'verified' | 'grads' | 'weak' | 'claim';

export interface CompareCell {
  /** הערך. null: אין לנו את זה לקורס הזה, ומוצג `missing`. */
  text: string | null;
  source?: CellSource;
  /** מילים מודגשות לפני הערך, בלי סימון: "פרק חלש:". */
  lead?: string;
  /** שורה קטנה מתחת, בלי סימון: "לפי 5 חשבוניות ומעלה". */
  sub?: string;
  /** מה כתוב כשאין ערך. */
  missing?: string;
  /** הציון: מספר גדול. */
  big?: boolean;
  /** ממוצע מתוך 5: פס במרקר הצהוב, כמו בטבלה של עמוד הקורס. */
  bar?: number;
  /** מרצים: קישור לעמוד של כל אחד, והתפקיד. */
  links?: { href: string; label: string; sub: string | null }[];
}

export interface CompareRow {
  key: string;
  label: string;
  /** figure: מספר קצר, ובנייד התאים נשארים בעמודות. text: משפט, ובנייד כל תא בשורה משלו. */
  kind: 'figure' | 'text';
  /** תא לכל קורס, לפי הסדר. */
  cells: CompareCell[];
}

export interface CompareSection {
  key: string;
  title: string;
  rows: CompareRow[];
}

const NO_DATA = 'אין נתון';

/** תא של טקסט מהקורס: הערך עם הסימון שלו, או מה כתוב כשאין. */
function said(value: string | null, source?: CellSource, missing = NO_DATA): CompareCell {
  return value ? { text: value, source } : { text: null, missing };
}

/** כמו תיבת הציון בעמוד הקורס. */
function scoreCell(score: CompareCourse['score']): CompareCell {
  if (score.status === 'scored') {
    return { text: score.value.toFixed(1), big: true, sub: verifiedGraduatesText(score.reviewCount) };
  }
  if (score.status === 'not_enough_reviews' && score.reviewCount > 0) {
    const reviews = verifiedReviewsText(score.reviewCount);
    return {
      text: 'עוד אין ציון',
      sub: score.reviewsNeeded > 0 ? `${reviews}, ${reviewsToScoreText(score.reviewsNeeded)}` : reviews,
    };
  }
  return { text: 'עוד אין ציון', sub: 'עוד אין ביקורות מאומתות' };
}

function outcomeCell(outcome: OutcomeView | null): CompareCell {
  if (!outcome) return { text: null, missing: 'עוד אין מספיק תשובות' };
  return {
    text: outcomeHeadline(outcome),
    source: 'grads',
    sub: outcome.kind === 'after_3m' ? `בממוצע ${outcome.mean.toFixed(1)} מתוך 5` : undefined,
  };
}

/** כמו "משך" ב"על הקורס": חודשים ושעות במרקר ירוק, ושעות העשייה בלי סימון. */
function durationCell(c: CompareCourse): CompareCell {
  const duration = [
    c.durationMonths !== null ? `${c.durationMonths} חודשים` : null,
    c.totalHours !== null ? `${c.totalHours} שעות` : null,
  ]
    .filter(Boolean)
    .join(', ');
  const handsOn =
    c.handsOnHours === null ? undefined : `${c.totalHours !== null ? 'מהן ' : ''}${c.handsOnHours} שעות עשייה`;
  if (!duration) return handsOn ? { text: handsOn } : { text: null, missing: NO_DATA };
  return { text: duration, source: 'verified', sub: handsOn };
}

/** כמו "איך" ב"על הקורס": "אונליין או בכיתה, תל אביב". */
function howText(c: CompareCourse): string | null {
  const formats = c.formats.map((f) => (FORMAT_LABEL as Record<string, string>)[f] ?? f).join(' או ');
  if (!formats) return null;
  return c.region ? `${formats}, ${c.region}` : formats;
}

function lecturersCell(c: CompareCourse): CompareCell {
  if (c.lecturers.length === 0) return said(c.lecturersNote, 'claim');
  return {
    text: c.lecturers.map((l) => l.name).join(', '),
    links: c.lecturers.map((l) => ({ href: `/lecturers/${l.slug}`, label: l.name, sub: l.role })),
  };
}

/**
 * השורות של ההשוואה, בחלקים לפי הסדר של עמוד הקורס. בכל תא אותו סימון מקור כמו ברכיב המקביל בעמוד הקורס.
 * שורה שאין בה ערך לאף קורס יורדת, וחלק בלי שורות יורד. אין "מנצח": שום ערך לא מסומן כטוב יותר.
 */
export function buildCompareRows(courses: readonly CompareCourse[]): CompareSection[] {
  const row = (key: string, label: string, kind: CompareRow['kind'], cell: (c: CompareCourse) => CompareCell): CompareRow => ({
    key,
    label,
    kind,
    cells: courses.map(cell),
  });

  // השאלות לפי הסדר שבו הן מופיעות בקורסים. לכל קורס הן כבר ממוינות לפי sort_order.
  const questions = new Map<string, string>();
  for (const c of courses) for (const m of c.metrics) if (!questions.has(m.key)) questions.set(m.key, m.label);

  const sections: CompareSection[] = [
    {
      key: 'score',
      title: 'ציון הבוגרים',
      rows: [
        row('score', 'ציון מתוך 10', 'figure', (c) => scoreCell(c.score)),
        row('recommend', 'ממליצים', 'figure', (c) =>
          c.score.status === 'scored' && c.score.recommendPct !== null
            ? { text: `${Math.round(c.score.recommendPct)}%` }
            : { text: null, missing: 'עוד אין ציון' },
        ),
        row('outcome', 'מה קרה לבוגרים', 'text', (c) => outcomeCell(c.outcome)),
      ],
    },
    {
      key: 'price',
      title: 'מחיר',
      rows: [
        row('sitePrice', 'באתר המוסד', 'figure', (c) =>
          c.sitePrice !== null ? { text: formatIls(c.sitePrice) } : { text: null, missing: 'המוסד לא מפרסם מחיר' },
        ),
        row('paid', PAID_RANGE_LEAD, 'figure', (c) =>
          c.paid
            ? { text: formatPaidRange(c.paid), source: 'verified', sub: invoiceCountText(c.paid) }
            : { text: null, missing: 'עוד אין מספיק חשבוניות' },
        ),
        row('costPerHour', 'לשעת עשייה', 'figure', (c) =>
          c.costPerHandsOnHour !== null
            ? { text: formatIls(c.costPerHandsOnHour), sub: 'לפי המחיר באתר' }
            : { text: null, missing: NO_DATA },
        ),
      ],
    },
    {
      key: 'grads',
      title: 'מה הבוגרים אומרים',
      rows: [
        row('good', 'טוב', 'text', (c) => said(c.summaryGood, 'grads')),
        row('weak', 'חלש', 'text', (c) =>
          c.summaryWeak
            ? { text: c.summaryWeak, source: 'weak' }
            : c.weakChapter
              ? { lead: 'פרק חלש:', text: c.weakChapter, source: 'weak' }
              : { text: null, missing: NO_DATA },
        ),
      ],
    },
    {
      key: 'metrics',
      title: 'ציונים לפי שאלה, מתוך 5',
      rows: [...questions].map(([key, label]) =>
        row(`metric:${key}`, label, 'figure', (c) => {
          const metric = c.metrics.find((m) => m.key === key);
          return metric
            ? { text: metric.mean.toFixed(1), source: 'grads', bar: metric.mean }
            : { text: null, missing: 'אין עדיין' };
        }),
      ),
    },
    {
      key: 'about',
      title: 'על הקורס',
      rows: [
        row('duration', 'משך', 'figure', durationCell),
        row('schedule', 'מתי', 'text', (c) => said(c.schedule)),
        row('how', 'איך', 'text', (c) => said(howText(c))),
        row('nextCohort', 'המחזור הבא', 'figure', (c) => said(c.nextCohortDate ? formatHebrewDate(c.nextCohortDate) : null)),
        row('admission', 'תנאי קבלה', 'text', (c) => said(c.admission)),
        row('classSize', 'בכיתה', 'text', (c) => said(c.classSizeNote, 'claim')),
        row('certificate', 'תעודה', 'text', (c) => said(c.certificate)),
        row('promises', 'המוסד מבטיח', 'text', (c) => said(c.institutionPromises, 'claim')),
      ],
    },
    {
      key: 'lecturers',
      title: 'מרצים',
      rows: [
        row('lecturers', 'מרצים', 'text', lecturersCell),
        row('lecturersSummary', 'מה הבוגרים אומרים על המרצים', 'text', (c) => said(c.lecturersSummary, 'grads')),
      ],
    },
  ];

  return sections
    .map((section) => ({ ...section, rows: section.rows.filter((r) => r.cells.some((cell) => cell.text !== null)) }))
    .filter((section) => section.rows.length > 0);
}
```

הערה על הבדיקות: `toEqual` מתעלם משדות שערכם `undefined`. לכן `said()` מחזיר `{ text, source: undefined }`, והבדיקה משווה ל-`{ text }`.

- [ ] **Step 6: להריץ ולראות שעוברות**

Run: `pnpm --dir web test src/lib/compare`
Expected: PASS, `11 passed` (5 ו-6).

- [ ] **Step 7: הכול ירוק, ו-Commit**

```bash
pnpm --dir web lint && pnpm --dir web exec tsc --noEmit && pnpm --dir web test
git add web/src/lib/compare
git commit -m "feat: ההשוואה: הקריאה של ?c= והשורות, עם הסימון של עמוד הקורס"
```

Expected: 128 בדיקות יחידה עוברות.

---

### Task 3: המובילים והקישור לוואטסאפ (TDD)

**Files:**
- Create: `web/src/lib/search/top.ts`
- Test: `web/src/lib/search/top.test.ts`
- Modify: `web/src/lib/og/share-text.ts` (ייבוא, ושלוש פונקציות בסוף)
- Test: `web/src/lib/og/share-text.test.ts` (ייבוא, ושלושה `describe` בסוף)

- [ ] **Step 1: הבדיקות של המובילים**

Create `web/src/lib/search/top.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { topByGraduates } from './top';
import type { CourseSummary } from './types';

const course = (slug: string, overrides: Partial<CourseSummary> = {}): CourseSummary => ({
  id: slug,
  slug,
  title: slug,
  institutionName: 'מוסד לדוגמה',
  categorySlug: 'cooking',
  categoryName: 'בישול',
  categoryParentSlug: null,
  courseType: 'hobby',
  productType: 'course',
  score: { status: 'none' },
  verifiedCount: 0,
  sitePrice: null,
  formats: [],
  timeSlots: [],
  updatedAt: '2026-11-01T00:00:00Z',
  highlight: null,
  ...overrides,
});
const scored = (value: number, verifiedCount: number) => ({ score: { status: 'scored' as const, value }, verifiedCount });

describe('topByGraduates', () => {
  it('ranks only courses with a score, highest first, from the category and its sub-categories', () => {
    const courses = [
      course('baking', scored(9, 8)),
      course('home', { score: { status: 'not_enough_reviews', reviewsNeeded: 5 }, verifiedCount: 40 }),
      course('italian', scored(7.1, 6)),
      course('python', { categorySlug: 'ai', categoryParentSlug: 'technology', ...scored(9.5, 12) }),
      course('fullstack', { categorySlug: 'programming', categoryParentSlug: 'technology', ...scored(7.9, 23) }),
    ];
    expect(topByGraduates(courses, 'cooking').map((c) => c.slug)).toEqual(['baking', 'italian']);
    expect(topByGraduates(courses, 'technology').map((c) => c.slug)).toEqual(['python', 'fullstack']);
    expect(topByGraduates(courses, 'photography')).toEqual([]);
  });

  it('breaks a tie by the number of verified graduates, and keeps at most 3', () => {
    const courses = ['a', 'b', 'c', 'd'].map((slug, i) => course(slug, scored(8, 10 + i)));
    expect(topByGraduates(courses, 'cooking').map((c) => c.slug)).toEqual(['d', 'c', 'b']);
  });
});
```

- [ ] **Step 2: הבדיקות של וואטסאפ**

In `web/src/lib/og/share-text.test.ts`, replace:

```ts
import { courseShareDescription } from './share-text';
```

with:

```ts
import { compareShareMessage, courseShareDescription, courseShareMessage, whatsappHref } from './share-text';
```

and add at the end of the file:

```ts
describe('courseShareMessage', () => {
  it('puts the title of the link above its description', () => {
    expect(courseShareMessage({ title: 'אפייה', institutionName: 'סדנה לדוגמה', score: { status: 'none' }, paid: null })).toBe(
      'אפייה, סדנה לדוגמה\nעוד אין ביקורות מאומתות על הקורס. אף מוכר לא משלם לנו. נתוני דוגמה.',
    );
  });
});

describe('whatsappHref', () => {
  it('sends the message and then the address, as one encoded text', () => {
    const href = whatsappHref('שורה ראשונה, עם & ו-?', 'https://example.com/compare?c=a,b');
    expect(href.startsWith('https://wa.me/?text=')).toBe(true);
    expect(new URL(href).searchParams.get('text')).toBe('שורה ראשונה, עם & ו-?\nhttps://example.com/compare?c=a,b');
  });
});

describe('compareShareMessage', () => {
  it('names the courses and who pays us', () => {
    expect(compareShareMessage(['פיתוח Full Stack', 'אפייה ביתית'])).toBe(
      'השוואה בלמדתי: פיתוח Full Stack, אפייה ביתית. אף מוכר לא משלם לנו. נתוני דוגמה.',
    );
  });
});
```

- [ ] **Step 3: להריץ ולראות שנכשלות**

Run: `pnpm --dir web test src/lib/search/top.test.ts src/lib/og/share-text.test.ts`
Expected: FAIL. `Failed to resolve import "./top"`, ו-`courseShareMessage is not a function` (או שגיאת ייבוא).

- [ ] **Step 4: המובילים**

Create `web/src/lib/search/top.ts`:

```ts
import type { CourseSummary, RowScore } from './types';

/** כמה מובילים בעמוד תחום. */
export const TOP_LIMIT = 3;

export type ScoredSummary = CourseSummary & { score: Extract<RowScore, { status: 'scored' }> };

const isScored = (course: CourseSummary): course is ScoredSummary => course.score.status === 'scored';

/**
 * המובילים לפי בוגרים בתחום ובתחומי המשנה שלו (החלטה של גל, 15.11.2026):
 * - רק קורסים שיש להם ציון, כלומר 5 ביקורות מאומתות ומעלה (MIN_REVIEWS);
 * - מהציון הגבוה לנמוך, ובתיקו מי שיש לו יותר בוגרים מאומתים;
 * - אף פעם לא לפי מספר נרשמים: את המספר הזה רק המוסד יודע, ואי אפשר לבדוק אותו (ROADMAP, פריט 29).
 */
export function topByGraduates(courses: readonly CourseSummary[], categorySlug: string, limit = TOP_LIMIT): ScoredSummary[] {
  return courses
    .filter((c) => c.categorySlug === categorySlug || c.categoryParentSlug === categorySlug)
    .filter(isScored)
    .sort(
      (a, b) =>
        b.score.value - a.score.value ||
        b.verifiedCount - a.verifiedCount ||
        (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0),
    )
    .slice(0, limit);
}
```

- [ ] **Step 5: ההודעות והקישור לוואטסאפ**

In `web/src/lib/og/share-text.ts`, replace:

```ts
import { SAMPLE_DATA } from '@/lib/site';
```

with:

```ts
import { SAMPLE_DATA, SITE_NAME } from '@/lib/site';
```

and add at the end of the file:

```ts
/** ההודעה בוואטסאפ: הכותרת של הקישור, ומתחתיה התיאור. אותו ניסוח כמו בתצוגה של הקישור עצמו. */
export function courseShareMessage(course: Pick<CoursePageData, 'title' | 'institutionName' | 'score' | 'paid'>): string {
  return `${courseShareTitle(course)}\n${courseShareDescription(course)}`;
}

/** הודעה על השוואה: שמות הקורסים, ומי משלם לנו. */
export function compareShareMessage(titles: readonly string[]): string {
  const parts = [`השוואה ב${SITE_NAME}: ${titles.join(', ')}.`, 'אף מוכר לא משלם לנו.'];
  if (SAMPLE_DATA) parts.push('נתוני דוגמה.');
  return parts.join(' ');
}

/**
 * קישור ששולח הודעה בוואטסאפ, בלי נמען מראש (wa.me/?text=). הכתובת בשורה האחרונה:
 * וואטסאפ מציג ממנה את תמונת השיתוף (opengraph-image.tsx).
 */
export function whatsappHref(message: string, url: string): string {
  return `https://wa.me/?text=${encodeURIComponent(`${message}\n${url}`)}`;
}
```

- [ ] **Step 6: להריץ ולראות שעוברות**

Run: `pnpm --dir web test src/lib/search/top.test.ts src/lib/og/share-text.test.ts`
Expected: PASS. `top.test.ts`: 2. `share-text.test.ts`: 5 (2 קיימות ו-3 חדשות).

- [ ] **Step 7: הכול ירוק, ו-Commit**

```bash
pnpm --dir web lint && pnpm --dir web exec tsc --noEmit && pnpm --dir web test
git add web/src/lib/search/top.ts web/src/lib/search/top.test.ts web/src/lib/og
git commit -m "feat: המובילים לפי בוגרים, והקישור לוואטסאפ"
```

Expected: 133 בדיקות יחידה עוברות.

---

### Task 4: עמוד מוסד (Impeccable)

**Files:**
- Create: `.impeccable/surfaces/` (חוזה חדש לעמוד מוסד ולעמוד מרצה, דרך `impeccable surface-brief write`)
- Create: `web/src/components/course/course-row.tsx`
- Modify: `web/src/app/institutions/[slug]/page.tsx` (הקובץ כולו)
- Create: `web/src/app/institutions/[slug]/not-found.tsx`
- Modify: `web/src/app/courses/[slug]/page.tsx` (החותמת בלבד)
- Test: `web/e2e/institution.spec.ts`

- [ ] **Step 1: חוזה העיצוב של עמוד מוסד ועמוד מרצה**

שני משטחים חדשים באותו עולם, באותו חוזה. הקובץ הזמני נכתב ל-`web/test-results/`, שלא נשמר ב-git.

```bash
cd "C:/Users/galsa/Desktop/קורסים השוואות"
mkdir -p web/test-results
cat > web/test-results/institution-lecturer-brief.md <<'EOF'
# עמוד מוסד ועמוד מרצה

**היקף:** `/institutions/[slug]` ו-`/lecturers/[slug]`, קודם לנייד, בעברית מימין לשמאל. המבקר צריך להבין (mode: read).
**מי מגיע:** מי שבוחר קורס ורוצה לדעת מה עוד המוסד מוכר, או מי מלמד. בדרך כלל מהחותמת של המוסד או משם המרצה בעמוד קורס.
**המשימה:** לראות את כל הקורסים של המוסד או של המרצה, כל אחד עם הציון שלו מהבוגרים שלו, ולעבור לקורס.
**התוכן:** מוסד: שם, סוג, אתר, כמה קורסים ובוגרים, וכל הקורסים (ציון ומספר מאומתים, מחיר באתר, מה ששולם בפועל כשיש, ומה המוסד מבטיח בקו כחול). מרצה: שם, מה המוסד אומר (קו כחול), מה בדקנו (ירוק, עם מקור), וכל הקורסים, עם המוסד, התפקיד ומה הבוגרים אומרים על המרצים בכל קורס (פתק צהוב).
**מגבלות:** אין ציון למוסד ואין ציון למרצה, ולא ממוצע (החלטה של גל, 15.11.2026). כל הנתונים לדוגמה. אין שמות של מוסדות אמיתיים.

## Direction contract

THESIS: עמוד מוסד או מרצה הוא דף אינדקס בסוף הסיכום: רשימה של קורסים, כל אחד עם הציון שלו, כמו שורות במחברת. מוותר על "פרופיל" עם ציון כולל, כוכבים, לוגו או תמונה.

OWN-WORLD: אותו דף מודפס של עמוד הקורס. IBM Plex Sans Hebrew לכל הדיו, Rubik בכחול לעט. שם המוסד בחותמת דיו, כי הוא עובדה. טענה של המוסד בקו כחול, עובדה שבדקנו במרקר ירוק עם קישור למקור, מה ששולם בפועל בירוק, ופתק צהוב רק לקול של בוגרים. הערה אחת בעט אומרת למה אין ציון כולל.

STORY: המבקר מגיע מהחותמת או משם המרצה. הוא רואה מי זה, ואת ההערה בעט שאין כאן ציון כולל. הוא עובר על הקורסים, שכל אחד מהם נכתב אל הדף כשורה במחברת, ונכנס לקורס שמעניין אותו.

FIRST VIEWPORT: בנייד: מיקום ("קורסים"), השם, שורה של סוג, כמה קורסים ואתר (מוסד) או ראשי תיבות בעיגול דיו (מרצה), ההערה בעט, והקורס הראשון. במחשב: הכותרת והפרטים מימין, ההערה בעט משמאל, והרשימה ברוחב הדף.

FORM: הרחבה של העולם של עמוד הקורס, במצב Read. שורות קורס בסגנון הרשימה של המחברת (ruled-row), עם הציון והמחיר מאותו צד של השם. seed:c81c41ae8e27158d

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
EOF
.claude/skills/impeccable/scripts/impeccable surface-brief write "web/src/app/institutions/[slug]/page.tsx" web/test-results/institution-lecturer-brief.md "web/src/app/lecturers/[slug]/page.tsx" web/src/components/course/course-row.tsx web/src/components/lecturer/lecturer-about.tsx
.claude/skills/impeccable/scripts/impeccable surface-brief list
```

Expected: ברשימה חמישה חוזים: ארבעת הקיימים, והחדש.

- [ ] **Step 2: Impeccable לפני כל עריכת ממשק**

1. טוענים את ה-skill `/impeccable`. אם `.claude/skills/impeccable` חסרה: `npx impeccable install` מתיקיית הפרויקט.
2. Run:
   ```bash
   .claude/skills/impeccable/scripts/impeccable context --target "web/src/app/institutions/[slug]/page.tsx"
   ```
   ב-PowerShell או ב-cmd: `.claude\skills\impeccable\scripts\impeccable.cmd context --target "web/src/app/institutions/[slug]/page.tsx"`. ממלאים את ההוראות שהפקודה מדפיסה, ולא מריצים אותה שוב.
3. קוראים את `.claude/skills/impeccable/reference/craft-floor.md` ואת `.claude/skills/impeccable/reference/mode-read.md`.
4. הכללים, מ-`DESIGN.md`:
   - IBM Plex Sans Hebrew לכל הדיו, Rubik בכחול לעט בלבד, דף לבן על שולחן בהיר.
   - צבע מקור רק למקור: הטווח ששולם בירוק, "המוסד מבטיח" בקו כחול. שום ציון לא מקבל מרקר.
   - רשימה לא נבנית כמו תפריט: הציון והמחיר מאותו צד של השם, או מתחתיו, ולא בקצה השני עם נקודות (The Not A Menu Rule).
   - תנועה: `.pen-rule` מתחת לכותרת "הקורסים במוסד", `data-anim="ink"` על כל שורה (כבר ב-`CourseRow`), `PenNote` להערה. `MotionObserver` מפעיל אותם, בלי JavaScript חדש.
   - קודם לנייד, ברוחב 390. כל פקד לפחות 44 פיקסלים. אין גלילה לרוחב.

הקוד בצעדים הבאים הוא נקודת ההתחלה, ועובד. Impeccable משפר אותו בתוך העולם, ולא משנה את הטקסטים, הכותרות וה-`id` שבדיקת הקצה מחפשת: "אין כאן ציון למוסד. לכל קורס יש ציון משלו, רק מהבוגרים שלו.", "לאתר המוסד", `#courses`, ו-`h3` לכל קורס.

- [ ] **Step 3: קורס ברשימה**

Create `web/src/components/course/course-row.tsx`:

```tsx
import Link from 'next/link';
import type { CoursePageData } from '@/lib/data/course-page';
import {
  PAID_RANGE_LEAD,
  formatIls,
  formatPaidRange,
  invoiceCountText,
  reviewsToScoreText,
  verifiedGraduatesText,
  verifiedReviewsText,
} from '@/lib/format';
import { PRODUCT_TYPE_LABEL } from '@/lib/search/types';
import { Mark } from './marks';

/** יעד מגע של 44 פיקסלים, בלי להגדיל את השורה: השוליים השליליים מחזירים את הגובה. כמו ברשימת הקורסים. */
const titleLink =
  '-my-2.5 inline-flex min-h-11 items-center decoration-[1.5px] underline-offset-4 hover:text-link-hover hover:underline';
const smallLink = 'underline decoration-1 underline-offset-[3px] hover:text-link-hover';

/**
 * קורס ברשימה של עמוד מוסד או מרצה. השם, ומתחתיו, מאותו צד: הציון של הקורס עם מספר הבוגרים המאומתים,
 * המחיר באתר, ומה ששולם בפועל כשיש (מרקר ירוק). כל ציון הוא של הקורס: אין ציון למוסד או למרצה (החלטה של גל).
 * השורה נכתבת אל הדף כשהיא נכנסת למסך (data-anim="ink"), כמו שורה ברשימת הקורסים.
 * children: שורות נוספות. בעמוד מוסד: מה המוסד מבטיח. בעמוד מרצה: התפקיד, ומה הבוגרים אומרים על המרצים.
 */
export function CourseRow({
  course,
  showInstitution = false,
  scoreLabel = 'ציון בוגרים מתוך 10',
  children,
}: {
  course: CoursePageData;
  /** בעמוד מרצה: שם המוסד, עם קישור לעמוד שלו. */
  showInstitution?: boolean;
  scoreLabel?: string;
  children?: React.ReactNode;
}) {
  const { score } = course;
  const product = PRODUCT_TYPE_LABEL[course.productType];
  const removed = course.status === 'removed';
  return (
    <article
      data-anim="ink"
      className="ruled-row grid gap-y-2 py-4 lg:grid-cols-[minmax(0,1.6fr)_10rem_minmax(0,1fr)] lg:gap-x-8 lg:py-5"
    >
      <div className="min-w-0">
        <h3 className="text-[19px] leading-snug font-bold lg:text-[21px]">
          <Link href={`/courses/${course.slug}`} className={titleLink}>
            {course.title}
          </Link>
        </h3>
        {(showInstitution || product || removed) && (
          <p className="mt-0.5 font-sans text-sm leading-normal text-ink-soft lg:text-[15px]">
            {showInstitution && course.institutionSlug && (
              <Link href={`/institutions/${course.institutionSlug}`} className={smallLink}>
                {course.institutionName}
              </Link>
            )}
            {showInstitution && product && ' · '}
            {product}
            {removed && (
              <span className="font-semibold text-ink">
                {showInstitution || product ? ' · ' : ''}הקורס כבר לא מוצע
              </span>
            )}
          </p>
        )}
        {children}
      </div>
      <p className="font-sans text-sm leading-snug lg:pt-1">
        {score.status === 'scored' ? (
          <>
            <span className="block text-[26px] leading-none font-bold tabular-nums lg:text-[34px]">
              {score.value.toFixed(1)}
            </span>
            <span className="mt-1 block">{scoreLabel}</span>
            <span className="block text-ink-soft">{verifiedGraduatesText(score.reviewCount)}</span>
          </>
        ) : (
          <>
            <strong className="block">עוד אין ציון בוגרים</strong>
            {score.status === 'not_enough_reviews' && score.reviewCount > 0 && (
              <span className="block text-ink-soft">{verifiedReviewsText(score.reviewCount)}</span>
            )}
            {score.status === 'not_enough_reviews' && score.reviewsNeeded > 0 && (
              <span className="block text-ink-soft">{reviewsToScoreText(score.reviewsNeeded)}</span>
            )}
          </>
        )}
      </p>
      <p className="font-sans text-[15px] leading-normal tabular-nums lg:pt-1">
        {course.sitePrice !== null ? (
          <>
            באתר המוסד: <bdi dir="rtl">{formatIls(course.sitePrice)}</bdi>
          </>
        ) : (
          <span className="text-ink-soft">המוסד לא מפרסם מחיר</span>
        )}
        {course.paid && (
          <span className="mt-1.5 block">
            <Mark source="verified">
              {PAID_RANGE_LEAD} <bdi dir="rtl">{formatPaidRange(course.paid)}</bdi>
            </Mark>
            <span className="block text-[13px] text-ink-soft">{invoiceCountText(course.paid)}</span>
          </span>
        )}
      </p>
    </article>
  );
}
```

- [ ] **Step 4: העמוד**

Replace the whole of `web/src/app/institutions/[slug]/page.tsx` with:

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CourseRow } from '@/components/course/course-row';
import { Claim, PenNote } from '@/components/course/marks';
import { SourceLegend } from '@/components/course/source-legend';
import { Sheet } from '@/components/site/sheet';
import { compareByScore } from '@/lib/data/course-order';
import { getCoursePage, type CoursePageData } from '@/lib/data/course-page';
import { INSTITUTION_KIND_LABEL, getInstitutionPage, getInstitutionSlugs } from '@/lib/data/institution-page';
import { verifiedGraduatesText } from '@/lib/format';
import { SITE_NAME } from '@/lib/site';

/**
 * כמו עמוד הקורס: העמוד כולו סטטי, ומוסד שלא נבנה מראש נבנה בבקשה הראשונה.
 * כך notFound() רץ לפני שהתשובה מתחילה, ומוסד שלא קיים מחזיר 404 אמיתי.
 * /institutions/join הוא עמוד נפרד, וכתובת קבועה גוברת על [slug].
 */
export const ensureStatic = 'navigation';

export async function generateStaticParams() {
  const slugs = await getInstitutionSlugs();
  return slugs.map((slug) => ({ slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const institution = await getInstitutionPage(slug);
  if (!institution) return {};
  return {
    title: `${institution.name}: כל הקורסים באתר | ${SITE_NAME}`,
    description: `הקורסים של ${institution.name} באתר, לכל אחד ציון משלו מבוגרים מאומתים בלבד. אף מוכר לא משלם לנו.`,
  };
}

const textLink = 'underline decoration-1 underline-offset-[3px] hover:text-link-hover';
const navLink = `inline-flex min-h-11 items-center ${textLink}`;

const coursesText = (n: number) => (n === 1 ? 'קורס אחד באתר' : `${n} קורסים באתר`);
const gradsText = (n: number) => (n === 0 ? 'עוד אין בוגרים מאומתים' : verifiedGraduatesText(n));

/** פרטי המוסד, וכל הקורסים שלו. אין ציון למוסד (החלטה של גל, 15.11.2026): הספירה בראש העמוד היא ספירה, לא ציון. */
export default async function InstitutionPage({ params }: Props) {
  const { slug } = await params;
  const institution = await getInstitutionPage(slug);
  if (!institution) notFound();
  const courses = (await Promise.all(institution.courseSlugs.map((s) => getCoursePage(s))))
    .filter((course): course is CoursePageData => course !== null)
    .sort(compareByScore);
  const grads = courses.reduce((sum, course) => sum + course.reviewTotal, 0);

  return (
    <Sheet>
      <main>
        <nav aria-label="מיקום" className="mt-2 font-sans text-[13px] text-ink-soft lg:mt-6 lg:text-sm">
          <Link href="/courses" className={navLink}>
            קורסים
          </Link>
        </nav>
        <header className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)] lg:items-end lg:gap-x-16">
          <div>
            <h1 className="mt-0.5 text-[30px] leading-tight font-bold text-balance lg:text-[54px] lg:leading-[1.06]">
              {institution.name}
            </h1>
            <p className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-sans text-[15px] text-ink-soft lg:mt-4 lg:text-base">
              <span>{INSTITUTION_KIND_LABEL[institution.kind]}</span>
              <span>
                {coursesText(courses.length)}, {gradsText(grads)}
              </span>
              {institution.website && (
                <a href={institution.website} target="_blank" rel="noopener noreferrer" className={`${navLink} text-ink`}>
                  לאתר המוסד<span className="sr-only"> (נפתח בחלון חדש)</span>
                </a>
              )}
            </p>
          </div>
          <PenNote arrow className="mt-3 text-base font-medium lg:mt-0 lg:pb-1 lg:text-lg">
            אין כאן ציון למוסד. לכל קורס יש ציון משלו, רק מהבוגרים שלו.
          </PenNote>
        </header>

        <SourceLegend variant="inline" />

        <section id="courses" aria-labelledby="courses-title" className="mt-10 scroll-mt-6 lg:mt-14">
          <h2 id="courses-title" className="pen-rule text-[21px] font-bold lg:text-[28px]">
            הקורסים במוסד
          </h2>
          <ol className="mt-4">
            {courses.map((course) => (
              <li key={course.slug}>
                <CourseRow course={course}>
                  {course.institutionPromises && (
                    <p className="mt-1.5 text-[15px] leading-relaxed">
                      <span className="font-sans font-bold">המוסד מבטיח:</span> <Claim>{course.institutionPromises}</Claim>
                    </p>
                  )}
                </CourseRow>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </Sheet>
  );
}
```

- [ ] **Step 5: 404**

Create `web/src/app/institutions/[slug]/not-found.tsx`:

```tsx
import Link from 'next/link';
import { Sheet } from '@/components/site/sheet';
import { SITE_NAME } from '@/lib/site';

export default function InstitutionNotFound() {
  return (
    <Sheet narrow>
      <main className="py-16">
        <title>{`המוסד לא נמצא | ${SITE_NAME}`}</title>
        <h1 className="text-2xl font-bold lg:text-[40px]">המוסד לא נמצא</h1>
        <p className="mt-2 font-sans text-ink-soft">
          ייתכן שהקישור שגוי, או שאין לו עוד קורסים באתר.{' '}
          <Link href="/courses" className="underline underline-offset-[3px]">
            לכל הקורסים
          </Link>
        </p>
      </main>
    </Sheet>
  );
}
```

- [ ] **Step 6: החותמת בעמוד הקורס מקשרת למוסד**

In `web/src/app/courses/[slug]/page.tsx`, replace:

```tsx
              <Stamp>{course.institutionName}</Stamp>
```

with:

```tsx
              {course.institutionSlug ? (
                <Link href={`/institutions/${course.institutionSlug}`} className="inline-flex min-h-11 items-center hover:text-link-hover">
                  <Stamp>{course.institutionName}</Stamp>
                </Link>
              ) : (
                <Stamp>{course.institutionName}</Stamp>
              )}
```

`Link` כבר מיובא בקובץ.

- [ ] **Step 7: בדיקת הקצה**

Create `web/e2e/institution.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('the institution page lists its courses, each with its own score, and no score for the institution', async ({ page }) => {
  // מהחותמת בעמוד הקורס.
  await page.goto('/courses/full-stack-sample');
  await page.getByRole('link', { name: 'מכללה לדוגמה' }).click();
  await expect(page).toHaveURL(/\/institutions\/sample-college$/);

  await expect(page.getByRole('heading', { level: 1, name: 'מכללה לדוגמה' })).toBeVisible();
  await expect(page.getByRole('link', { name: /לאתר המוסד/ })).toHaveAttribute('href', 'https://example.com');
  await expect(page.getByText('אין כאן ציון למוסד. לכל קורס יש ציון משלו, רק מהבוגרים שלו.')).toBeVisible();

  // קודם הקורס עם ציון, אחריו מי שקרוב יותר לציון (3 ביקורות), ואז קורס בלי ביקורות.
  await expect(page.locator('#courses h3')).toHaveText(['פיתוח Full Stack', 'כלי AI לעבודה יומיומית', 'סדנת AI לעסקים קטנים']);
  const fullStack = page.locator('#courses article').first();
  await expect(fullStack.getByText('23 בוגרים מאומתים')).toBeVisible();
  await expect(fullStack.locator('mark[data-source="verified"]')).toContainText('בין 12,000 ל-16,000 ₪');
  await expect(fullStack.locator('[data-source="claim"]')).toContainText('ליווי השמה במשך 6 חודשים');
});

test('an unknown institution returns 404', async ({ page }) => {
  const response = await page.goto('/institutions/no-such-institution');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'המוסד לא נמצא' })).toBeVisible();
});
```

- [ ] **Step 8: ליטוש בעזרת Impeccable, בנייה, ובדיקה בדפדפן**

עוברים עם Impeccable על `web/src/app/institutions/[slug]/page.tsx` ועל `web/src/components/course/course-row.tsx` לפי צעד 2, ומשפרים בתוך העולם.

```bash
pnpm --dir web lint && pnpm --dir web exec tsc --noEmit && pnpm --dir web test && pnpm --dir web build
```

Expected: הבנייה עוברת, וברשימת העמודים שנבנו מופיעים `/institutions/sample-college` ושאר המוסדות לדוגמה.

בטרמינל נפרד: `pnpm --dir web start`. פותחים את `http://localhost:3000/institutions/sample-college` ברוחב 390 וב-1280 ובודקים:
- לטקסט יש ריווח מהקצוות, ואין גלילה לרוחב;
- השורות נכתבות אל הדף כשהן נכנסות למסך, וקו העט נמשך מתחת לכותרת;
- הטווח ששולם בירוק, "המוסד מבטיח" בקו כחול, ואין שום ציון כולל.

עוצרים את השרת.

- [ ] **Step 9: בדיקת הקצה**

```bash
pnpm --dir web e2e institution.spec.ts course-page.spec.ts
```

Expected: `7 passed` (2 חדשות ו-5 של עמוד הקורס, שעדיין מוצאות את "יעל כהן" ואת שאר החלקים).

- [ ] **Step 10: Commit**

```bash
git add .impeccable/surfaces "web/src/app/institutions/[slug]" web/src/components/course/course-row.tsx "web/src/app/courses/[slug]/page.tsx" web/e2e/institution.spec.ts
git commit -m "feat: עמוד מוסד עם כל הקורסים שלו, בלי ציון למוסד"
```

---

### Task 5: "לשלוח בוואטסאפ" בעמוד הקורס (Impeccable)

**Files:**
- Create: `web/src/components/course/share-links.tsx`
- Modify: `web/src/components/course/course-actions.tsx` (ייבוא, פרמטר, ושורה אחת)
- Modify: `web/src/app/courses/[slug]/page.tsx` (ייבוא, משתנה אחד, ו-`share` בשתי הקריאות ל-`CourseActions`)
- Test: `web/e2e/course-page.spec.ts` (שלוש שורות בבדיקה הראשונה)

- [ ] **Step 1: Impeccable לפני כל עריכת ממשק**

1. טוענים את ה-skill `/impeccable`. אם `.claude/skills/impeccable` חסרה: `npx impeccable install` מתיקיית הפרויקט.
2. Run:
   ```bash
   .claude/skills/impeccable/scripts/impeccable context --target web/src/components/course/course-actions.tsx
   ```
   ב-PowerShell או ב-cmd: `.claude\skills\impeccable\scripts\impeccable.cmd context --target web/src/components/course/course-actions.tsx`. ממלאים את ההוראות שהפקודה מדפיסה, ולא מריצים אותה שוב.
3. קוראים את `.claude/skills/impeccable/reference/craft-floor.md` ואת `.claude/skills/impeccable/reference/mode-read.md`.
4. הכללים, מ-`DESIGN.md`:
   - הכפתור בדיו, Plex, בלי מרקר ובלי פתק. בלי לוגו של וואטסאפ ובלי ספריית אייקונים: אם צריך סימן, הוא מצויר ב-SVG בעט.
   - באותה שורה של "לשמור", ובאותו גובה של 44 פיקסלים לפחות.
   - בלי צל: זה רכיב ממשק (The Objects Only Rule).
   - העריכה של `course-actions.tsx` קטנה: הייבוא, הפרמטר והשורה שבצעד 3. סשן התנועה עורך את אותו קובץ.

הטקסטים "לשלוח בוואטסאפ" ו"שיתוף אחר" נשארים, כי בדיקת הקצה מחפשת את הראשון.

- [ ] **Step 2: הרכיב**

Create `web/src/components/course/share-links.tsx`:

```tsx
'use client';

import { useSyncExternalStore } from 'react';
import { whatsappHref } from '@/lib/og/share-text';
import { cn } from '@/lib/utils';

/** שיתוף של המערכת: רק בטלפון (מסך מגע), ורק כשהדפדפן תומך. במחשב נשאר וואטסאפ בלבד. */
function canShareNatively(): boolean {
  return typeof navigator.share === 'function' && window.matchMedia('(pointer: coarse)').matches;
}
const noSubscribe = () => () => {};

const linkClass =
  'inline-flex min-h-11 items-center font-sans text-[15px] font-semibold underline decoration-1 underline-offset-[3px] hover:text-link-hover';

/**
 * "לשלוח בוואטסאפ": קישור ל-wa.me עם ההודעה של קישור משותף והכתובת. וואטסאפ הוא ברירת המחדל,
 * כי שם שואלים על קורסים (PRODUCT.md). בטלפון שתומך בשיתוף של המערכת יש גם "שיתוף אחר".
 * false בשרת ובהידרציה, ומיד אחר כך הערך האמיתי: כך ה-HTML והדפדפן מסכימים.
 */
export function ShareLinks({ text, url, className }: { text: string; url: string; className?: string }) {
  const native = useSyncExternalStore(noSubscribe, canShareNatively, () => false);

  async function share() {
    try {
      await navigator.share({ text, url });
    } catch {
      // המבקר סגר את חלון השיתוף, או שהדפדפן חסם. אין מה לעשות.
    }
  }

  return (
    <span className={cn('inline-flex flex-wrap items-center gap-x-3.5', className)}>
      <a href={whatsappHref(text, url)} target="_blank" rel="noopener noreferrer" className={linkClass}>
        לשלוח בוואטסאפ<span className="sr-only"> (נפתח בחלון חדש)</span>
      </a>
      {native && (
        <button type="button" onClick={() => void share()} className={linkClass}>
          שיתוף אחר
        </button>
      )}
    </span>
  );
}
```

- [ ] **Step 3: בפעולות של עמוד הקורס**

In `web/src/components/course/course-actions.tsx`, replace:

```tsx
import { cn } from '@/lib/utils';
```

with:

```tsx
import { cn } from '@/lib/utils';
import { ShareLinks } from './share-links';
```

Replace:

```tsx
  title,
  stacked = false,
}: {
  courseId: string;
  slug: string;
  title: string;
```

with:

```tsx
  title,
  share,
  stacked = false,
}: {
  courseId: string;
  slug: string;
  title: string;
  /** "לשלוח בוואטסאפ": ההודעה והכתובת, מהשרת (share-text.ts). */
  share?: { text: string; url: string };
```

Replace:

```tsx
        <SaveButton courseId={courseId} title={title} />
      </div>
```

with:

```tsx
        <SaveButton courseId={courseId} title={title} />
        {share && <ShareLinks text={share.text} url={share.url} />}
      </div>
```

- [ ] **Step 4: ההודעה והכתובת, בשרת**

In `web/src/app/courses/[slug]/page.tsx`, replace:

```tsx
import { courseShareDescription, courseShareTitle } from '@/lib/og/share-text';
import { SITE_NAME } from '@/lib/site';
```

with:

```tsx
import { courseShareDescription, courseShareMessage, courseShareTitle } from '@/lib/og/share-text';
import { SITE_NAME, SITE_URL } from '@/lib/site';
```

Replace:

```tsx
  const reviewCount = course.reviewTotal;
```

with:

```tsx
  const reviewCount = course.reviewTotal;
  // "לשלוח בוואטסאפ": אותו טקסט כמו בתצוגה של קישור משותף, והכתובת המלאה (SITE_URL, כמו בתמונת השיתוף).
  const share = { text: courseShareMessage(course), url: `${SITE_URL}/courses/${course.slug}` };
```

Replace:

```tsx
                <CourseActions courseId={course.id} slug={course.slug} title={course.title} stacked />
```

with:

```tsx
                <CourseActions courseId={course.id} slug={course.slug} title={course.title} share={share} stacked />
```

Replace:

```tsx
              <CourseActions courseId={course.id} slug={course.slug} title={course.title} />
```

with:

```tsx
              <CourseActions courseId={course.id} slug={course.slug} title={course.title} share={share} />
```

- [ ] **Step 5: שורה בבדיקת הקצה של עמוד הקורס**

In `web/e2e/course-page.spec.ts`, replace:

```ts
  await expect(page.locator('#price').getByText('חצי מהבוגרים שילמו בין 12,000 ל-16,000 ₪')).toBeVisible();
});
```

with:

```ts
  await expect(page.locator('#price').getByText('חצי מהבוגרים שילמו בין 12,000 ל-16,000 ₪')).toBeVisible();
  // סבב 4: "לשלוח בוואטסאפ", עם הטקסט של קישור משותף והכתובת של הקורס. בנייד רק הפעולות שבסוף העמוד גלויות.
  const whatsapp = page.getByRole('link', { name: /לשלוח בוואטסאפ/ });
  await expect(whatsapp).toHaveAttribute('href', /^https:\/\/wa\.me\/\?text=/);
  expect(decodeURIComponent((await whatsapp.getAttribute('href')) ?? '')).toContain('/courses/full-stack-sample');
});
```

- [ ] **Step 6: ליטוש, בנייה, ובדיקה בדפדפן**

עוברים עם Impeccable על `share-links.tsx` ועל השורה ב-`course-actions.tsx`, לפי צעד 1.

```bash
pnpm --dir web lint && pnpm --dir web exec tsc --noEmit && pnpm --dir web test && pnpm --dir web build
```

בטרמינל נפרד: `pnpm --dir web start`. ב-`http://localhost:3000/courses/full-stack-sample`:
- **ברוחב 390:** "לשלוח בוואטסאפ" בסוף העמוד, ליד "לשמור". לחיצה פותחת לשונית של wa.me עם ההודעה.
- **ברוחב 1280:** אותו דבר בעמודה הצדדית.
- **בדפדפן של מחשב:** "שיתוף אחר" לא מופיע.

עוצרים את השרת.

- [ ] **Step 7: בדיקת הקצה, ו-Commit**

```bash
pnpm --dir web e2e course-page.spec.ts
git add web/src/components/course/share-links.tsx web/src/components/course/course-actions.tsx "web/src/app/courses/[slug]/page.tsx" web/e2e/course-page.spec.ts
git commit -m "feat: לשלוח בוואטסאפ מעמוד הקורס"
```

Expected: `5 passed`.

---

### Task 6: עמוד מרצה (Impeccable)

**Files:**
- Create: `web/src/components/lecturer/lecturer-about.tsx`
- Create: `web/src/app/lecturers/[slug]/page.tsx`
- Create: `web/src/app/lecturers/[slug]/not-found.tsx`
- Modify: `web/src/components/course/lecturers-section.tsx` (ייבוא, `export` אחד, והשם בכותרת)
- Test: `web/e2e/lecturer.spec.ts`

- [ ] **Step 1: Impeccable לפני כל עריכת ממשק**

1. טוענים את ה-skill `/impeccable`. אם `.claude/skills/impeccable` חסרה: `npx impeccable install` מתיקיית הפרויקט.
2. Run:
   ```bash
   .claude/skills/impeccable/scripts/impeccable context --target "web/src/app/lecturers/[slug]/page.tsx"
   ```
   ב-PowerShell או ב-cmd: `.claude\skills\impeccable\scripts\impeccable.cmd context --target "web/src/app/lecturers/[slug]/page.tsx"`. ממלאים את ההוראות שהפקודה מדפיסה, ולא מריצים אותה שוב. החוזה הוא זה שנכתב במשימה 4 (עמוד מוסד ועמוד מרצה).
3. קוראים את `.claude/skills/impeccable/reference/craft-floor.md` ואת `.claude/skills/impeccable/reference/mode-read.md`.
4. הכללים, מ-`DESIGN.md`:
   - "לפי המוסד" בקו כחול, "מה בדקנו" במרקר ירוק עם קישור למקור, ו"מה הבוגרים אומרים על המרצים" בפתק צהוב. אותם רכיבים (`Claim`, `Mark`, `StickyNote`) כמו ב"על המרצים" בעמוד הקורס.
   - ראשי תיבות בעיגול דיו כפול, כמו בעמוד הקורס. אין תמונות של מרצים, ולא ממציאים.
   - שום ציון למרצה. הציון בכל שורה מסומן "ציון הבוגרים לקורס".
   - תנועה: `.pen-rule` מתחת לכל כותרת פרק, המרקר נמרח, ההערה בעט נכתבת, והפתק נדבק. `MotionObserver` מפעיל את כולם.
   - העריכה של `lecturers-section.tsx` קטנה: הייבוא, ה-`export` והקישור שבצעד 5. סשן התנועה עורך את אותו קובץ.
   - קודם לנייד, ברוחב 390. כל פקד לפחות 44 פיקסלים. אין גלילה לרוחב.

הטקסטים שבדיקת הקצה מחפשת נשארים: "אין כאן ציון למרצה. המרצים מתחלפים בין מחזורים, ולכל קורס יש ציון משלו.", "התפקיד בקורס:", `#courses`, ו-`h3` לכל קורס.

- [ ] **Step 2: מה ידוע על המרצה**

Create `web/src/components/lecturer/lecturer-about.tsx`:

```tsx
import { Claim, Mark } from '@/components/course/marks';
import type { LecturerPageData } from '@/lib/data/lecturer-page';

/**
 * מה המוסד אומר (קו כחול, טענה שלא בדקנו), ומה בדקנו בעצמנו (מרקר ירוק, עם קישור למקור).
 * אותו ניסוח כמו ב"על המרצים" בעמוד הקורס.
 */
export function LecturerAbout({ lecturer }: { lecturer: LecturerPageData }) {
  return (
    <section id="about" aria-labelledby="about-title" className="mt-10 scroll-mt-6 lg:mt-14 lg:max-w-[68ch]">
      <h2 id="about-title" className="pen-rule text-[21px] font-bold lg:text-[28px]">
        מה ידוע
      </h2>
      {lecturer.institutionBio && (
        <p className="mt-3 text-[15px] leading-relaxed lg:text-[17px]">
          <span className="font-sans font-bold">לפי המוסד:</span> <Claim>{lecturer.institutionBio}</Claim>
        </p>
      )}
      <p className="mt-2 text-[15px] leading-relaxed lg:text-[17px]">
        <span className="font-sans font-bold">מה בדקנו:</span>{' '}
        {lecturer.verifiedFacts.length > 0 ? (
          lecturer.verifiedFacts.map((fact, i) => (
            <a key={`${i}-${fact.text}`} href={fact.sourceUrl} target="_blank" rel="noopener noreferrer" className="me-1">
              <Mark source="verified">{fact.text}</Mark>
              <span className="sr-only"> (נפתח בחלון חדש)</span>
            </a>
          ))
        ) : (
          <span className="text-ink-soft">לא מצאנו מידע ציבורי שאפשר לבדוק.</span>
        )}
      </p>
    </section>
  );
}
```

- [ ] **Step 3: העמוד**

Create `web/src/app/lecturers/[slug]/page.tsx`:

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CourseRow } from '@/components/course/course-row';
import { initials } from '@/components/course/lecturers-section';
import { PenNote, StickyNote } from '@/components/course/marks';
import { SourceLegend } from '@/components/course/source-legend';
import { LecturerAbout } from '@/components/lecturer/lecturer-about';
import { Sheet } from '@/components/site/sheet';
import { compareByScore } from '@/lib/data/course-order';
import { getCoursePage } from '@/lib/data/course-page';
import { getLecturerPage, getLecturerSlugs } from '@/lib/data/lecturer-page';
import { SITE_NAME } from '@/lib/site';

/** כמו עמוד הקורס ועמוד המוסד: סטטי, ו-404 אמיתי למרצה שלא קיים. */
export const ensureStatic = 'navigation';

export async function generateStaticParams() {
  const slugs = await getLecturerSlugs();
  return slugs.map((slug) => ({ slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const lecturer = await getLecturerPage(slug);
  if (!lecturer) return {};
  return {
    title: `${lecturer.name}: הקורסים באתר | ${SITE_NAME}`,
    description: `הקורסים באתר ש${lecturer.name} מלמד או מלמדת בהם, מה המוסד אומר ומה בדקנו. אף מוכר לא משלם לנו.`,
  };
}

const navLink = 'inline-flex min-h-11 items-center underline decoration-1 underline-offset-[3px] hover:text-link-hover';
const coursesText = (n: number) => (n === 1 ? 'קורס אחד באתר' : `${n} קורסים באתר`);

/**
 * המרצה: מה המוסד אומר, מה בדקנו, וכל הקורסים, עם התפקיד ומה הבוגרים אומרים על המרצים בכל קורס.
 * אין ציון למרצה (החלטה של גל, 15.11.2026): הציון בכל שורה הוא של הקורס, מכל הבוגרים שלו.
 */
export default async function LecturerPage({ params }: Props) {
  const { slug } = await params;
  const lecturer = await getLecturerPage(slug);
  if (!lecturer) notFound();
  const pages = await Promise.all(lecturer.courses.map((course) => getCoursePage(course.slug)));
  const courses = lecturer.courses
    .flatMap((link, i) => {
      const page = pages[i];
      return page ? [{ role: link.role, page }] : [];
    })
    .sort((a, b) => compareByScore(a.page, b.page));

  return (
    <Sheet>
      <main>
        <nav aria-label="מיקום" className="mt-2 font-sans text-[13px] text-ink-soft lg:mt-6 lg:text-sm">
          <Link href="/courses" className={navLink}>
            קורסים
          </Link>
        </nav>
        <header className="mt-0.5 grid grid-cols-[52px_minmax(0,1fr)] items-center gap-x-3 lg:grid-cols-[72px_minmax(0,1fr)] lg:gap-x-5">
          {/* ראשי תיבות בעיגול דיו: אין לנו תמונות של מרצים, ולא ממציאים. */}
          <div
            aria-hidden="true"
            className="flex size-[52px] items-center justify-center rounded-full border-[1.5px] border-ink font-sans text-lg font-bold shadow-[inset_0_0_0_3px_white,inset_0_0_0_4px_var(--color-ink)] lg:size-[72px] lg:text-2xl"
          >
            {initials(lecturer.name)}
          </div>
          <div>
            <h1 className="text-[30px] leading-tight font-bold text-balance lg:text-[54px] lg:leading-[1.06]">{lecturer.name}</h1>
            <p className="mt-1 font-sans text-[15px] text-ink-soft lg:text-base">{coursesText(courses.length)}</p>
          </div>
        </header>
        <PenNote arrow className="mt-3 max-w-[46ch] text-base font-medium lg:mt-5 lg:text-lg">
          אין כאן ציון למרצה. המרצים מתחלפים בין מחזורים, ולכל קורס יש ציון משלו.
        </PenNote>

        <SourceLegend variant="inline" />
        <LecturerAbout lecturer={lecturer} />

        <section id="courses" aria-labelledby="courses-title" className="mt-10 scroll-mt-6 lg:mt-14">
          <h2 id="courses-title" className="pen-rule text-[21px] font-bold lg:text-[28px]">
            הקורסים
          </h2>
          <p className="mt-1.5 font-sans text-[13px] text-ink-soft">
            לפי אתרי המוסדות. המרצים משתנים בין מחזורים.
          </p>
          <ol className="mt-4">
            {courses.map(({ role, page }) => (
              <li key={page.slug}>
                <CourseRow course={page} showInstitution scoreLabel="ציון הבוגרים לקורס">
                  {role && <p className="mt-1 font-sans text-sm">התפקיד בקורס: {role}</p>}
                  {page.lecturersSummary && (
                    <StickyNote
                      tone="grad"
                      tilt={-1}
                      tiltLg={-1.4}
                      className="mt-5 mb-2 ml-6 px-3 pt-4 pb-2.5 text-sm lg:ml-0 lg:max-w-[340px] lg:text-[15px]"
                    >
                      <strong>מה הבוגרים אומרים על המרצים בקורס:</strong> {page.lecturersSummary}
                    </StickyNote>
                  )}
                </CourseRow>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </Sheet>
  );
}
```

- [ ] **Step 4: 404**

Create `web/src/app/lecturers/[slug]/not-found.tsx`:

```tsx
import Link from 'next/link';
import { Sheet } from '@/components/site/sheet';
import { SITE_NAME } from '@/lib/site';

export default function LecturerNotFound() {
  return (
    <Sheet narrow>
      <main className="py-16">
        <title>{`לא מצאנו את המרצה | ${SITE_NAME}`}</title>
        <h1 className="text-2xl font-bold lg:text-[40px]">לא מצאנו את המרצה</h1>
        <p className="mt-2 font-sans text-ink-soft">
          ייתכן שהקישור שגוי, או שאין לו עוד קורסים באתר.{' '}
          <Link href="/courses" className="underline underline-offset-[3px]">
            לכל הקורסים
          </Link>
        </p>
      </main>
    </Sheet>
  );
}
```

- [ ] **Step 5: השם ב"על המרצים" מקשר לעמוד המרצה**

In `web/src/components/course/lecturers-section.tsx`, replace:

```tsx
import type { CoursePageData } from '@/lib/data/course-page';
```

with:

```tsx
import Link from 'next/link';
import type { CoursePageData } from '@/lib/data/course-page';
```

Replace:

```tsx
const initials = (name: string) =>
```

with:

```tsx
export const initials = (name: string) =>
```

Replace:

```tsx
              <h3 className="text-lg leading-snug font-bold lg:text-xl">{lecturer.name}</h3>
```

with:

```tsx
              <h3 className="text-lg leading-snug font-bold lg:text-xl">
                <Link
                  href={`/lecturers/${lecturer.slug}`}
                  className="-my-2.5 inline-flex min-h-11 items-center decoration-[1.5px] underline-offset-4 hover:text-link-hover hover:underline"
                >
                  {lecturer.name}
                </Link>
              </h3>
```

- [ ] **Step 6: בדיקת הקצה**

Create `web/e2e/lecturer.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('the lecturer page shows what the institution says, what we checked, and the courses, with no score for the lecturer', async ({
  page,
}) => {
  // מהשם ב"על המרצים" בעמוד הקורס.
  await page.goto('/courses/full-stack-sample');
  await page.getByRole('link', { name: 'יעל כהן' }).click();
  await expect(page).toHaveURL(/\/lecturers\/yael-cohen-sample$/);

  await expect(page.getByRole('heading', { level: 1, name: 'יעל כהן' })).toBeVisible();
  await expect(page.getByText('אין כאן ציון למרצה. המרצים מתחלפים בין מחזורים, ולכל קורס יש ציון משלו.')).toBeVisible();
  await expect(page.locator('[data-source="claim"]', { hasText: 'מפתחת בכירה עם 10 שנות ניסיון בתעשייה' })).toBeVisible();
  await expect(page.getByRole('link', { name: /בנתה ומתחזקת ספריית קוד פתוח/ })).toHaveAttribute(
    'href',
    'https://example.com/open-source-sample',
  );

  await expect(page.locator('#courses h3')).toHaveText(['פיתוח Full Stack', 'כלי AI לעבודה יומיומית']);
  await expect(page.getByText('התפקיד בקורס: מרצה ראשית, מלמדת 4 מתוך 7 הפרקים')).toBeVisible();
  await expect(page.getByText(/יעל מסבירה מצוין/)).toBeVisible();
});

test('an unknown lecturer returns 404', async ({ page }) => {
  const response = await page.goto('/lecturers/no-such-lecturer');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'לא מצאנו את המרצה' })).toBeVisible();
});
```

- [ ] **Step 7: ליטוש, בנייה, ובדיקה בדפדפן**

עוברים עם Impeccable על `web/src/app/lecturers/[slug]/page.tsx` ועל `lecturer-about.tsx`, לפי צעד 1.

```bash
pnpm --dir web lint && pnpm --dir web exec tsc --noEmit && pnpm --dir web test && pnpm --dir web build
```

Expected: ברשימת העמודים שנבנו ארבעה מרצים: `avi-mizrahi-sample`, `michal-levi-sample`, `omer-sagi-sample` ו-`yael-cohen-sample`.

בטרמינל נפרד: `pnpm --dir web start`. בודקים ברוחב 390 וב-1280:
- `/lecturers/yael-cohen-sample`: קו כחול, מרקר ירוק עם קישור, שני קורסים, ופתק צהוב תחת Full Stack בלבד.
- `/lecturers/omer-sagi-sample`: "לא מצאנו מידע ציבורי שאפשר לבדוק."
- לטקסט יש ריווח מהקצוות, ואין גלילה לרוחב.

עוצרים את השרת.

- [ ] **Step 8: בדיקת הקצה, ו-Commit**

```bash
pnpm --dir web e2e lecturer.spec.ts course-page.spec.ts
git add web/src/components/lecturer "web/src/app/lecturers" web/src/components/course/lecturers-section.tsx web/e2e/lecturer.spec.ts
git commit -m "feat: עמוד מרצה: מה המוסד אומר, מה בדקנו, והקורסים, בלי ציון למרצה"
```

Expected: `7 passed`.

---

### Task 7: "המובילים לפי בוגרים" בעמוד התחום (Impeccable)

**Files:**
- Create: `web/src/components/category/top-by-graduates.tsx`
- Modify: `web/src/app/categories/[slug]/page.tsx` (ייבוא, ו-`headSide`)
- Test: `web/e2e/catalog.spec.ts` (שורה בבדיקה הראשונה)

- [ ] **Step 1: Impeccable לפני כל עריכת ממשק**

1. טוענים את ה-skill `/impeccable`. אם `.claude/skills/impeccable` חסרה: `npx impeccable install` מתיקיית הפרויקט.
2. Run:
   ```bash
   .claude/skills/impeccable/scripts/impeccable context --target "web/src/app/categories/[slug]/page.tsx"
   ```
   ב-PowerShell או ב-cmd: `.claude\skills\impeccable\scripts\impeccable.cmd context --target "web/src/app/categories/[slug]/page.tsx"`. ממלאים את ההוראות שהפקודה מדפיסה, ולא מריצים אותה שוב.
3. קוראים את `.claude/skills/impeccable/reference/craft-floor.md` ואת `.claude/skills/impeccable/reference/mode-read.md`.
4. הכללים, מ-`DESIGN.md`:
   - מספרים מוקפים בעט (`PenNumber`, `data-anim="draw"`), ושם, ציון ובוגרים מאותו צד (The Not A Menu Rule).
   - בלי מרקר על הציון: זה האתר שמונה, לא מקור. אם מקיפים משהו, בעט (`PenLoop`).
   - ההערה על הכלל בעט, ו-`.pen-rule` מתחת לכותרת.
   - **העריכה של `page.tsx` קטנה:** הייבוא, והרכיב בתוך `headSide`. סשן התנועה עורך את אותו קובץ. לא נוגעים ב-`notebook-page.tsx`. אם המיקום ב-`headSide` לא עובד במחשב (העמודה מיושרת לתחתית), מותר להזיז את הרכיב לתחילת `after`. זו העריכה היחידה המותרת בקובץ.
   - קודם לנייד, ברוחב 390.

- [ ] **Step 2: הרכיב**

Create `web/src/components/category/top-by-graduates.tsx`:

```tsx
import Link from 'next/link';
import { PenNote } from '@/components/course/marks';
import { PenNumber } from '@/components/site/pen';
import { verifiedGraduatesText } from '@/lib/format';
import { MIN_REVIEWS } from '@/lib/score/constants';
import { topByGraduates } from '@/lib/search/top';
import type { CourseSummary } from '@/lib/search/types';

/**
 * "המובילים לפי בוגרים": עד שלושה קורסים בתחום, לפי ציון הבוגרים, רק מתוך קורסים שיש להם ציון
 * (5 ביקורות מאומתות ומעלה), עם מספר הבוגרים המאומתים ליד כל אחד (החלטה של גל, 15.11.2026).
 * אף פעם לא לפי מספר נרשמים. בלי קורס עם ציון: שורה אחת בעט, שמסבירה למה אין רשימה.
 */
export function TopByGraduates({ courses, categorySlug }: { courses: readonly CourseSummary[]; categorySlug: string }) {
  const top = topByGraduates(courses, categorySlug);
  return (
    <section aria-labelledby="top-title" className="mt-6 font-sans lg:mt-5">
      <h2 id="top-title" className="pen-rule text-[19px] leading-snug font-bold lg:text-[21px]">
        המובילים לפי בוגרים
      </h2>
      {top.length === 0 ? (
        <PenNote arrow className="mt-2">
          עוד אין בתחום קורס עם ציון. מדרגים רק מ-{MIN_REVIEWS} ביקורות מאומתות.
        </PenNote>
      ) : (
        <>
          <ol className="mt-3 space-y-2">
            {top.map((course, i) => (
              <li key={course.slug} className="grid grid-cols-[30px_minmax(0,1fr)] items-start gap-x-2.5">
                <PenNumber n={i + 1} className="mt-2" />
                <div>
                  <Link
                    href={`/courses/${course.slug}`}
                    className="inline-flex min-h-11 items-center text-base leading-snug font-bold hover:text-link-hover hover:underline"
                  >
                    {course.title}
                  </Link>
                  <p className="-mt-1 text-sm leading-snug text-ink-soft tabular-nums">
                    <span className="text-base font-bold text-ink">{course.score.value.toFixed(1)}</span> ציון בוגרים,{' '}
                    {verifiedGraduatesText(course.verifiedCount)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <PenNote arrow className="mt-2.5 text-sm">
            רק קורסים עם {MIN_REVIEWS} ביקורות מאומתות ומעלה. לא לפי מספר נרשמים.
          </PenNote>
        </>
      )}
    </section>
  );
}
```

- [ ] **Step 3: בעמוד התחום**

In `web/src/app/categories/[slug]/page.tsx`, replace:

```tsx
import { PenNote } from '@/components/course/marks';
```

with:

```tsx
import { TopByGraduates } from '@/components/category/top-by-graduates';
import { PenNote } from '@/components/course/marks';
```

Replace:

```tsx
      headSide={
        <PenNote arrow className="text-base font-medium lg:text-lg">
          בתחום: {coursesText(category.courseCount)}, {gradsText(category.gradCount)}.
        </PenNote>
      }
```

with:

```tsx
      headSide={
        <>
          <PenNote arrow className="text-base font-medium lg:text-lg">
            בתחום: {coursesText(category.courseCount)}, {gradsText(category.gradCount)}.
          </PenNote>
          <TopByGraduates courses={catalog.courses} categorySlug={category.slug} />
        </>
      }
```

- [ ] **Step 4: שורה בבדיקת הקצה של עמוד התחום**

In `web/e2e/catalog.spec.ts`, replace:

```ts
  await expect(page.getByText('חסרות עוד 5 ביקורות.')).toBeVisible();
});
```

with:

```ts
  await expect(page.getByText('חסרות עוד 5 ביקורות.')).toBeVisible();
  // סבב 4: המובילים לפי בוגרים, רק קורסים עם ציון, מהגבוה לנמוך. בישול ביתי למתחילים (בלי ציון) לא שם.
  await expect(page.locator('section[aria-labelledby="top-title"] li a')).toHaveText(['אפייה ביתית: לחמים ועוגות', 'בישול איטלקי']);
});
```

- [ ] **Step 5: ליטוש, בנייה, ובדיקה בדפדפן**

עוברים עם Impeccable על `top-by-graduates.tsx`, לפי צעד 1.

```bash
pnpm --dir web lint && pnpm --dir web exec tsc --noEmit && pnpm --dir web test && pnpm --dir web build
```

בטרמינל נפרד: `pnpm --dir web start`. בודקים ברוחב 390 וב-1280:
- `/categories/cooking`: אפייה (9.0, 8 בוגרים מאומתים) ובישול איטלקי (7.1, 6).
- `/categories/technology`: Full Stack בלבד, מתחום המשנה תכנות.
- `/categories/ai`: השורה בעט "עוד אין בתחום קורס עם ציון".
- במחשב הכותרת והרכיב לא נדחקים זה לזה. אם כן, מזיזים לפי צעד 1.

עוצרים את השרת.

- [ ] **Step 6: בדיקת הקצה, ו-Commit**

```bash
pnpm --dir web e2e catalog.spec.ts
git add web/src/components/category "web/src/app/categories/[slug]/page.tsx" web/e2e/catalog.spec.ts
git commit -m "feat: המובילים לפי בוגרים בכל תחום, רק קורסים עם ציון"
```

Expected: `2 passed`.

---

### Task 8: עמוד ההשוואה (Impeccable)

**Files:**
- Create: `.impeccable/surfaces/` (חוזה חדש לעמוד ההשוואה)
- Create: `web/src/lib/data/compare.ts`
- Create: `web/src/components/compare/compare-table.tsx`
- Create: `web/src/components/compare/compare-shelf.tsx`
- Create: `web/src/components/compare/compare-from-url.tsx`
- Modify: `web/src/app/compare/page.tsx` (הקובץ כולו)

- [ ] **Step 1: חוזה העיצוב של ההשוואה**

```bash
cd "C:/Users/galsa/Desktop/קורסים השוואות"
mkdir -p web/test-results
cat > web/test-results/compare-brief.md <<'EOF'
# עמוד ההשוואה

**היקף:** `/compare`, קודם לנייד, בעברית מימין לשמאל. המבקר צריך להבין ולבחור (mode: read).
**מי מגיע:** מי שהוסיף 2 או 3 קורסים להשוואה בעמודי הקורסים, או מי שקיבל קישור להשוואה בוואטסאפ.
**המשימה:** לראות את הקורסים זה לצד זה, שורה לכל עובדה ולכל שאלה, ולהבין מאיפה כל מספר בא.
**התוכן:** עד 3 קורסים. שורות: ציון ומספר מאומתים, ממליצים, מה קרה לבוגרים, מחיר באתר, מה ששולם בפועל, לשעת עשייה, טוב, חלש, ציונים לפי שאלה, משך, מתי, איך, המחזור הבא, תנאי קבלה, בכיתה, תעודה, המוסד מבטיח, מרצים ומה הבוגרים אומרים עליהם. כמה מקומות נשארו. "להוציא" לכל קורס, ומה שהוצא מחכה בתחתית. "לשלוח בוואטסאפ".
**מגבלות:** אותו סימון מקור בכל תא כמו בעמוד הקורס. אין "מנצח" בשורה: הצבע הוא רק מקור. כל הנתונים לדוגמה.

## Direction contract

THESIS: ההשוואה היא דף אחד במחברת, מחולק לעמודות ביד: מספר מוקף בעט לכל קורס בראש העמודה, ושורות שנמשכות עד קצה הנייר. מוותר על טבלת מחירים של חנות, על וי ואיקס ירוקים ואדומים, ועל הדגשה של הערך "הטוב".

OWN-WORLD: אותו דף מודפס. Plex לדיו, Rubik בכחול לעט. בכל תא אותו סימון כמו בעמוד הקורס: מרקר ירוק למה שבדקנו מול מסמך, צהוב לבוגרים (גם פסי הציון לפי שאלה), ורוד לחולשה, קו כחול לטענת המוסד. מספרי הקורסים בעיגולי עט. "נשארו N מקומות" בעט.

STORY: המבקר רואה את הקורסים בראש, ממוספרים. בגלילה הראש נשאר למעלה, והוא קורא שורה אחרי שורה. בנייד מספרים קצרים עומדים בעמודות מתחת לראש, ומשפטים ארוכים יורדים אחד מתחת לשני, כל אחד עם המספר של הקורס שלו. הוא מוציא קורס, והקורס מחכה בתחתית כדי להחזיר אותו. בסוף הוא שולח את ההשוואה בוואטסאפ.

FIRST VIEWPORT: בנייד: "השוואה", שורה על מה יש בעמוד, המקרא בשורה, כמה מקומות נשארו, והראש הדביק עם המספרים והשמות. במחשב: אותו דבר, עם עמודת התוויות מימין ועמודה לכל קורס.

FORM: הרחבה של העולם של עמוד הקורס, במצב Read. טבלה אחת (role=table) שבנייד נפרשת אחרת: ראש דביק, שורות מספרים בעמודות ושורות טקסט בערימה עם המספר של הקורס. seed:c81c41ae8e27158d

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
EOF
.claude/skills/impeccable/scripts/impeccable surface-brief write web/src/app/compare/page.tsx web/test-results/compare-brief.md web/src/components/compare/compare-from-url.tsx web/src/components/compare/compare-table.tsx web/src/components/compare/compare-shelf.tsx
.claude/skills/impeccable/scripts/impeccable surface-brief list
```

Expected: שישה חוזים.

- [ ] **Step 2: Impeccable לפני כל עריכת ממשק**

1. טוענים את ה-skill `/impeccable`. אם `.claude/skills/impeccable` חסרה: `npx impeccable install` מתיקיית הפרויקט.
2. Run:
   ```bash
   .claude/skills/impeccable/scripts/impeccable context --target web/src/app/compare/page.tsx
   ```
   ב-PowerShell או ב-cmd: `.claude\skills\impeccable\scripts\impeccable.cmd context --target web/src/app/compare/page.tsx`. ממלאים את ההוראות שהפקודה מדפיסה, ולא מריצים אותה שוב.
3. קוראים את `.claude/skills/impeccable/reference/craft-floor.md` ואת `.claude/skills/impeccable/reference/mode-read.md`.
4. **העיצוב בנייד נקבע כאן, דרך Impeccable.** נקודת המוצא (מסמך העיצוב, סעיף 2): ראש דביק עם מספר מוקף ושם; שורות `figure` בעמודות; שורות `text` בערימה עם המספר של הקורס. Impeccable בודק אותה מול החלופה, קורס אחד בכל החלקה עם אינדקס של שורות, ובוחר. אם הוא בוחר בחלופה, נשארים אותם `role`, אותם `data-row` ואותם שמות של כפתורים, כי בדיקת הקצה (משימה 9) מחפשת אותם. ההחלטה נרשמת בקובץ הסשן.
5. הכללים, מ-`DESIGN.md`:
   - בכל תא אותו סימון כמו בעמוד הקורס, ורק הוא (החלטה 11). בלי "מנצח", בלי וי ואיקס, בלי צבע לערך הגבוה.
   - מספרים בספרות ברוחב קבוע (The Tabular Figures Rule).
   - הראש הדביק בלי צל: קו דיו מתחתיו (The Objects Only Rule).
   - תנועה: `.pen-rule` מתחת לכותרת של כל חלק, `data-anim="ink"` על כל שורה, `PenNumber` (`data-anim="draw"`) בראש, המרקרים והפסים נמרחים. `MotionObserver` מפעיל אותם גם על תוכן שנוסף אחרי הטעינה (MutationObserver).
   - קודם לנייד, ברוחב 390. כל פקד לפחות 44 פיקסלים. **אין גלילה לרוחב**, גם עם 3 קורסים.

השמות שבדיקת הקצה מחפשת:
- כפתורים: "להוציא את <שם הקורס> מההשוואה", "להחזיר את <שם הקורס> להשוואה";
- טקסטים: "זו השוואה מקישור", "עוד לא בחרתם קורסים להשוואה", "נשארו 2 מקומות";
- `role="columnheader"` עם שם הקורס;
- `data-row="paid"` ו-`data-row="promises"`.

- [ ] **Step 3: הנתונים**

Create `web/src/lib/data/compare.ts`:

```ts
import { toCompareCourse, type CompareCourse } from '@/lib/compare/rows';
import { getCatalog } from './catalog';
import { getCoursePage } from './course-page';

/**
 * כל הקורסים שאפשר להשוות: הקורסים בקטלוג (פעילים, או שאולי כבר לא פעילים), כל אחד מהמטמון של עמוד הקורס.
 * העמוד סטטי, והדפדפן בוחר מהרשימה לפי הכתובת או המגש. מספיק לכמה מאות קורסים, כמו הקטלוג.
 * בלי מטמון משלה: היא מרכיבה פונקציות שכבר במטמון, והתגיות שלהן (catalog, course:<slug>) חלות על העמוד.
 */
export async function getCompareCourses(): Promise<CompareCourse[]> {
  const { courses } = await getCatalog();
  const pages = await Promise.all(courses.map((course) => getCoursePage(course.slug)));
  return pages.flatMap((page) => (page ? [toCompareCourse(page)] : []));
}
```

- [ ] **Step 4: הטבלה**

Create `web/src/components/compare/compare-table.tsx`:

```tsx
import Link from 'next/link';
import { Claim, Mark } from '@/components/course/marks';
import { PenNumber } from '@/components/site/pen';
import type { CompareCell, CompareCourse, CompareSection } from '@/lib/compare/rows';
import { cn } from '@/lib/utils';

/**
 * בנייד: עמודה לכל קורס, והתווית של כל שורה בשורה משלה מעליה.
 * במחשב: עמודת תוויות מימין, ועמודה לכל קורס. --cols: כמה קורסים בהשוואה.
 */
const grid =
  'grid grid-cols-[repeat(var(--cols),minmax(0,1fr))] gap-x-3 lg:grid-cols-[11rem_repeat(var(--cols),minmax(0,1fr))] lg:gap-x-6';
const smallLink = 'underline decoration-1 underline-offset-[3px] hover:text-link-hover';

/** תא אחד, עם אותו סימון כמו בעמוד הקורס. */
function CellView({ cell }: { cell: CompareCell }) {
  if (cell.text === null) return <span className="text-[13px] leading-snug text-ink-soft">{cell.missing ?? 'אין נתון'}</span>;
  if (cell.bar !== undefined) {
    // כמו בטבלה של "מה הבוגרים אומרים": פס במרקר הצהוב באורך הממוצע מתוך 5, והמספר לידו.
    return (
      <span className="flex items-center gap-2">
        <span aria-hidden="true" className="relative h-[15px] flex-1">
          <span
            className="hl hl-grads absolute inset-y-0 start-0 block p-0"
            data-tilt="a"
            style={{ width: `${Math.max(4, Math.min(100, (cell.bar / 5) * 100))}%` }}
          />
        </span>
        <span className="w-7 text-left font-bold tabular-nums">{cell.text}</span>
      </span>
    );
  }
  const value = cell.links ? (
    <span className="flex flex-col gap-1">
      {cell.links.map((link) => (
        <span key={link.href}>
          <Link href={link.href} className={cn('font-semibold', smallLink)}>
            {link.label}
          </Link>
          {link.sub && <span className="block text-[13px] leading-snug text-ink-soft">{link.sub}</span>}
        </span>
      ))}
    </span>
  ) : cell.source === 'claim' ? (
    <Claim>{cell.text}</Claim>
  ) : cell.source ? (
    <Mark source={cell.source}>{cell.text}</Mark>
  ) : (
    cell.text
  );
  return (
    <span className="block">
      {cell.lead && <span className="font-bold">{cell.lead} </span>}
      <span
        className={
          cell.big ? 'text-[30px] leading-none font-bold tabular-nums lg:text-[40px]' : 'text-[15px] leading-relaxed lg:text-base'
        }
      >
        {value}
      </span>
      {cell.sub && <span className="mt-0.5 block text-[13px] leading-snug text-ink-soft">{cell.sub}</span>}
    </span>
  );
}

const tableName = (n: number) => (n === 1 ? 'השוואה של קורס אחד' : `השוואה של ${n} קורסים`);

/**
 * הטבלה: ראש דביק עם מספר מוקף ושם לכל קורס, שורה עם המוסד ו"להוציא", וחלק לכל נושא.
 * role על div ולא <table>: רשת CSS על רכיבי טבלה מוחקת את הסמנטיקה בחלק מהדפדפנים.
 * שורת figure נשארת בעמודות גם בנייד. בשורת text כל תא יורד לשורה משלו בנייד, עם המספר של הקורס.
 */
export function CompareTable({
  courses,
  sections,
  busy,
  onRemove,
}: {
  courses: readonly CompareCourse[];
  sections: readonly CompareSection[];
  /** הקורס שהפעולה עליו עוד רצה. */
  busy: string | null;
  onRemove: (course: CompareCourse) => void;
}) {
  return (
    <div
      role="table"
      aria-label={tableName(courses.length)}
      style={{ '--cols': courses.length } as React.CSSProperties}
      className="mt-4 font-sans lg:mt-6"
    >
      <div role="rowgroup" className="sticky top-0 z-[2] border-b-[1.5px] border-ink bg-paper pt-2 pb-2.5">
        <div role="row" className={grid}>
          <span role="columnheader" className="sr-only lg:not-sr-only lg:self-end lg:text-sm lg:text-ink-soft">
            מה משווים
          </span>
          {courses.map((course, i) => (
            <div role="columnheader" key={course.id} className="min-w-0">
              <span className="flex items-start gap-1.5">
                <PenNumber n={i + 1} className="size-[26px] text-[15px]" />
                <Link
                  href={`/courses/${course.slug}`}
                  className="line-clamp-3 text-[15px] leading-snug font-bold hover:text-link-hover hover:underline lg:text-[17px]"
                >
                  {course.title}
                </Link>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div role="rowgroup">
        <div role="row" data-row="institution" className={cn(grid, 'ruled-row py-3')}>
          <span role="rowheader" className="col-span-full text-[13px] font-bold lg:col-span-1 lg:text-[15px]">
            המוסד
          </span>
          {courses.map((course) => (
            <div role="cell" key={course.id} className="mt-1 min-w-0 lg:mt-0">
              <Link href={`/institutions/${course.institutionSlug}`} className={cn('text-sm leading-snug', smallLink)}>
                {course.institutionName}
              </Link>
              <button
                type="button"
                disabled={busy === course.id}
                onClick={() => onRemove(course)}
                aria-label={`להוציא את ${course.title} מההשוואה`}
                className="flex h-11 items-center text-sm font-semibold underline underline-offset-[3px] hover:text-link-hover"
              >
                להוציא
              </button>
            </div>
          ))}
        </div>
      </div>

      {sections.map((section) => (
        <div role="rowgroup" key={section.key}>
          <div role="row" className="mt-8 lg:mt-10">
            <span role="rowheader" aria-colspan={courses.length + 1} className="block">
              <h2 className="pen-rule text-[19px] font-bold lg:text-[24px]">{section.title}</h2>
            </span>
          </div>
          {section.rows.map((row) => (
            <div role="row" key={row.key} data-row={row.key} data-anim="ink" className={cn(grid, 'ruled-row py-3 lg:py-3.5')}>
              <span role="rowheader" className="col-span-full text-[13px] font-bold lg:col-span-1 lg:text-[15px]">
                {row.label}
              </span>
              {row.cells.map((cell, i) => (
                <div
                  role="cell"
                  key={courses[i].id}
                  className={cn(
                    'mt-1 min-w-0 lg:mt-0',
                    row.kind === 'text' && 'max-lg:col-span-full max-lg:mt-2 max-lg:grid max-lg:grid-cols-[26px_minmax(0,1fr)] max-lg:gap-x-2',
                  )}
                >
                  {row.kind === 'text' && <PenNumber n={i + 1} className="size-[24px] text-[14px] lg:hidden" />}
                  <CellView cell={cell} />
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: מה שהוצא, ומה ששמרתם**

Create `web/src/components/compare/compare-shelf.tsx`:

```tsx
import Link from 'next/link';
import { PenNote } from '@/components/course/marks';
import { buttonVariants } from '@/components/ui/button';
import type { CompareCourse } from '@/lib/compare/rows';
import { cn } from '@/lib/utils';

/**
 * בתחתית העמוד: קורסים שהוצאו בביקור הזה, עם "להחזיר", ולמחובר גם מה ששמר ולא בהשוואה, עם "להוסיף".
 * כשההשוואה מלאה הכפתורים מושבתים, וכתוב בעט שצריך להוציא קורס קודם.
 */
export function CompareShelf({
  removed,
  saved,
  full,
  busy,
  onAdd,
}: {
  removed: readonly CompareCourse[];
  saved: readonly CompareCourse[];
  full: boolean;
  busy: string | null;
  onAdd: (course: CompareCourse) => void;
}) {
  const items = [
    ...removed.map((course) => ({ course, verb: 'להחזיר' })),
    ...saved.map((course) => ({ course, verb: 'להוסיף' })),
  ];
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="shelf-title" className="mt-12 font-sans lg:mt-16">
      <h2 id="shelf-title" className="pen-rule text-[21px] font-bold lg:text-[28px]">
        {removed.length > 0 ? 'מה שהוצאתם' : 'מה ששמרתם'}
      </h2>
      {full && (
        <PenNote arrow className="mt-2">
          ההשוואה מלאה. כדי להחזיר קורס, מוציאים אחד מלמעלה.
        </PenNote>
      )}
      <ul className="mt-3">
        {items.map(({ course, verb }) => (
          <li key={course.id} data-anim="ink" className="ruled-row flex flex-wrap items-center gap-x-4 gap-y-1.5 py-3">
            <span className="min-w-0 flex-1">
              <Link href={`/courses/${course.slug}`} className="text-base leading-snug font-bold hover:text-link-hover hover:underline">
                {course.title}
              </Link>
              <span className="block text-sm text-ink-soft">{course.institutionName}</span>
            </span>
            <button
              type="button"
              disabled={full || busy === course.id}
              onClick={() => onAdd(course)}
              aria-label={`${verb} את ${course.title} להשוואה`}
              className={cn(buttonVariants({ variant: 'outline' }), 'h-11 border-[1.5px] border-ink px-3 text-[15px] font-bold')}
            >
              {verb}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 6: הכתובת, המגש והפעולות**

Create `web/src/components/compare/compare-from-url.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { PenNote } from '@/components/course/marks';
import { ShareLinks } from '@/components/course/share-links';
import { MAX_COMPARE } from '@/lib/account/lists';
import { toggleCompare, useAccount } from '@/lib/account/store';
import { COMPARE_PARAM, compareHref, parseCompareParam, pickCompared, slotsLeftText } from '@/lib/compare/param';
import { buildCompareRows, type CompareCourse } from '@/lib/compare/rows';
import { compareShareMessage } from '@/lib/og/share-text';
import { CompareShelf } from './compare-shelf';
import { CompareTable } from './compare-table';

type Props = { courses: readonly CompareCourse[]; siteUrl: string };
type Note = 'full' | 'error' | null;

const textLink = 'underline decoration-1 underline-offset-[3px] hover:text-link-hover';

/**
 * ההשוואה, מהכתובת או מהמגש. חייבת להיות בתוך <Suspense>: בדף שנבנה מראש,
 * useSearchParams ידוע רק בדפדפן (use-search-params.md, "Prerendering"), כמו במחברת.
 * - ?c=slug1,slug2: קישור ששיתפו. הוא גובר על המגש.
 * - בלי c: המגש. בדפדפן למי שלא התחבר, ובחשבון למי שהתחבר.
 * key לפי המצב: כשעוברים מקישור למגש, הרשימה של מה שהוצא מתחילה מחדש.
 */
export function CompareFromUrl({ courses, siteUrl }: Props) {
  const params = useSearchParams();
  const account = useAccount();
  const fromLink = params.has(COMPARE_PARAM);

  if (!fromLink && account.status === 'loading') {
    return (
      <p role="status" className="mt-6 font-sans text-[15px] text-ink-soft">
        טוענים את ההשוואה שלכם
      </p>
    );
  }
  if (!fromLink && account.status === 'error') {
    return (
      <p role="alert" className="mt-6 font-sans text-[15px] font-bold">
        לא הצלחנו לטעון את ההשוואה. נסו לרענן את הדף.
      </p>
    );
  }

  const trayIds =
    account.status === 'signed-in'
      ? account.compare.map((slot) => slot.courseId)
      : account.status === 'signed-out'
        ? account.compare
        : [];
  const { chosen, missing } = fromLink
    ? pickCompared(courses, { slugs: parseCompareParam(params.get(COMPARE_PARAM)) })
    : pickCompared(courses, { ids: trayIds });
  const savedIds = account.status === 'signed-in' ? account.saved : [];

  return (
    <CompareView
      key={fromLink ? 'link' : 'tray'}
      courses={courses}
      siteUrl={siteUrl}
      fromLink={fromLink}
      chosen={chosen}
      missing={missing}
      savedIds={savedIds}
    />
  );
}

function CompareView({
  courses,
  siteUrl,
  fromLink,
  chosen,
  missing,
  savedIds,
}: Props & {
  fromLink: boolean;
  chosen: CompareCourse[];
  /** slug מהקישור, או מזהה מהמגש, של קורס שכבר לא בקטלוג. */
  missing: string[];
  savedIds: readonly string[];
}) {
  /** ה-slug של כל קורס שהוצא בביקור הזה, האחרון ראשון. */
  const [removed, setRemoved] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<Note>(null);

  const chosenIds = new Set(chosen.map((c) => c.id));
  const removedCourses = removed.flatMap((slug) => courses.find((c) => c.slug === slug && !chosenIds.has(c.id)) ?? []);
  const removedIds = new Set(removedCourses.map((c) => c.id));
  const saved = savedIds.flatMap((id) =>
    chosenIds.has(id) || removedIds.has(id) ? [] : (courses.find((c) => c.id === id) ?? []),
  );
  const full = chosen.length >= MAX_COMPARE;

  /** במצב קישור: הכתובת היא מקור האמת. replaceState מעדכן את useSearchParams בלי בקשה לשרת. */
  function writeLink(slugs: string[]) {
    window.history.replaceState(null, '', compareHref(slugs));
  }

  async function remove(course: CompareCourse) {
    setNote(null);
    if (fromLink) {
      writeLink(chosen.filter((c) => c.id !== course.id).map((c) => c.slug));
    } else {
      setBusy(course.id);
      const result = await toggleCompare(course.id);
      setBusy(null);
      if (result !== 'ok') {
        setNote('error');
        return;
      }
    }
    setRemoved((list) => [course.slug, ...list.filter((slug) => slug !== course.slug)]);
  }

  async function add(course: CompareCourse) {
    setNote(null);
    if (full) {
      setNote('full');
      return;
    }
    if (fromLink) {
      writeLink([...chosen.map((c) => c.slug), course.slug]);
    } else {
      setBusy(course.id);
      const result = await toggleCompare(course.id);
      setBusy(null);
      if (result !== 'ok') {
        setNote(result === 'full' ? 'full' : 'error');
        return;
      }
    }
    setRemoved((list) => list.filter((slug) => slug !== course.slug));
  }

  /** קורס שהוסר מהאתר ועדיין תופס מקום במגש (notes-for-plan-2.md, "קורס שהוסר מהאתר"). */
  async function dropMissing(id: string) {
    setBusy(id);
    const result = await toggleCompare(id);
    setBusy(null);
    setNote(result === 'ok' ? null : 'error');
  }

  return (
    <>
      <div className="mt-5 space-y-2 font-sans text-[15px] lg:mt-6">
        {fromLink && (
          <PenNote arrow className="text-base">
            זו השוואה מקישור. ההשוואה שלכם לא השתנתה.{' '}
            <Link href="/compare" className={textLink}>
              להשוואה שלכם
            </Link>
          </PenNote>
        )}
        {fromLink && missing.length > 0 && (
          <p className="text-ink-soft">
            {missing.length === 1 ? 'קורס אחד מהקישור כבר לא באתר.' : `${missing.length} קורסים מהקישור כבר לא באתר.`}
          </p>
        )}
        {!fromLink &&
          missing.map((id) => (
            <p key={id} className="flex flex-wrap items-center gap-x-3">
              <span>קורס בהשוואה כבר לא מוצע באתר.</span>
              <button
                type="button"
                disabled={busy === id}
                onClick={() => void dropMissing(id)}
                className="inline-flex h-11 items-center font-semibold underline underline-offset-[3px] hover:text-link-hover"
              >
                לפנות את המקום
              </button>
            </p>
          ))}
        {chosen.length > 0 && (
          <PenNote className="text-base">
            {chosen.length} מתוך {MAX_COMPARE}. {slotsLeftText(chosen.length)}.
          </PenNote>
        )}
        {note && (
          <p role="status" className="font-semibold">
            {note === 'full' ? 'בהשוואה כבר יש 3 קורסים. מוציאים אחד, ואז מחזירים.' : 'לא הצלחנו לעדכן את ההשוואה. נסו שוב.'}
          </p>
        )}
      </div>

      {chosen.length === 0 ? (
        <div className="mt-6 font-sans">
          <p className="text-[17px] font-bold">
            {fromLink ? 'בקישור אין קורסים שאנחנו מכירים.' : 'עוד לא בחרתם קורסים להשוואה.'}
          </p>
          <p className="mt-1 text-[15px] leading-normal text-ink-soft">
            מוסיפים מעמוד של קורס, בכפתור &quot;להשוואה (עד 3)&quot;.{' '}
            <Link href="/courses" className={`${textLink} text-ink`}>
              לכל הקורסים
            </Link>
          </p>
        </div>
      ) : (
        <>
          <CompareTable courses={chosen} sections={buildCompareRows(chosen)} busy={busy} onRemove={(c) => void remove(c)} />
          <div className="mt-6">
            <ShareLinks
              text={compareShareMessage(chosen.map((c) => c.title))}
              url={`${siteUrl}${compareHref(chosen.map((c) => c.slug))}`}
            />
          </div>
        </>
      )}

      <CompareShelf removed={removedCourses} saved={saved} full={full} busy={busy} onAdd={(c) => void add(c)} />
    </>
  );
}
```

- [ ] **Step 7: העמוד**

Replace the whole of `web/src/app/compare/page.tsx` with:

```tsx
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CompareFromUrl } from '@/components/compare/compare-from-url';
import { SourceLegend } from '@/components/course/source-legend';
import { Sheet } from '@/components/site/sheet';
import { getCompareCourses } from '@/lib/data/compare';
import { SITE_NAME, SITE_URL } from '@/lib/site';

/**
 * העמוד סטטי: הנתונים של כל הקורסים מהמטמון, והכתובת והמגש נקראים בדפדפן, בתוך <Suspense>.
 * קריאה של searchParams בשרת אסורה עם 'navigation' (ensureStatic.md), וזה גם לא נחוץ.
 */
export const ensureStatic = 'navigation';

export const metadata: Metadata = {
  title: `השוואה | ${SITE_NAME}`,
  description: 'עד שלושה קורסים זה לצד זה, באותו סימון מקור כמו בעמוד הקורס. אף מוכר לא משלם לנו.',
};

export default async function ComparePage() {
  const courses = await getCompareCourses();
  return (
    <Sheet>
      <main>
        <h1 className="mt-[22px] text-[30px] leading-tight font-bold lg:mt-12 lg:text-[54px]">השוואה</h1>
        <p className="mt-2 max-w-[60ch] font-sans text-[15px] leading-normal text-ink-soft lg:mt-3 lg:text-lg">
          עד שלושה קורסים זה לצד זה, שורה לכל עובדה ולכל שאלה. בכל תא אותו סימון כמו בעמוד הקורס.
        </p>
        <SourceLegend variant="inline" />
        <Suspense
          fallback={
            <p role="status" className="mt-6 font-sans text-[15px] text-ink-soft">
              טוענים את ההשוואה
            </p>
          }
        >
          <CompareFromUrl courses={courses} siteUrl={SITE_URL} />
        </Suspense>
      </main>
    </Sheet>
  );
}
```

- [ ] **Step 8: ליטוש בעזרת Impeccable, ובנייה**

עוברים עם Impeccable על ארבעת הקבצים של ההשוואה, לפי צעד 2. כאן נקבע העיצוב בנייד.

```bash
pnpm --dir web lint && pnpm --dir web exec tsc --noEmit && pnpm --dir web test && pnpm --dir web build
```

Expected: הבנייה עוברת, ו-`/compare` מסומן כסטטי. אם הבנייה נכשלת עם שגיאת `ensureStatic` ("Runtime data" או "Uncached data"), משהו קורא נתוני בקשה בשרת. רק `CompareFromUrl`, בדפדפן, קורא את הכתובת.

- [ ] **Step 9: בדיקה בדפדפן**

בטרמינל נפרד: `pnpm --dir web start`. בודקים ברוחב 390 וב-1280:
- `/compare?c=full-stack-sample,baking-sample,italian-sample`:
  - שלוש עמודות, והראש נשאר למעלה בגלילה;
  - בנייד, "טוב" ו"המוסד מבטיח" יורדים כל אחד לשורה משלו, עם המספר של הקורס;
  - הטווח ששולם בירוק (בשני קורסים), "המוסד מבטיח" בקו כחול, ופסי הציון בצהוב;
  - אין גלילה לרוחב.
- `/compare?c=psycho-full-sample`: עמודה אחת, ו"נשארו 2 מקומות".
- `/compare?c=no-such`: "בקישור אין קורסים שאנחנו מכירים" ו"קורס אחד מהקישור כבר לא באתר".
- `/compare` בדפדפן נקי: "עוד לא בחרתם קורסים להשוואה".
- "להוציא" בקישור משנה את הכתובת, והקורס מופיע בתחתית עם "להחזיר".
- "לשלוח בוואטסאפ" מתחת לטבלה, עם הכתובת `?c=`.

עוצרים את השרת.

- [ ] **Step 10: Commit**

```bash
git add .impeccable/surfaces web/src/lib/data/compare.ts web/src/components/compare web/src/app/compare/page.tsx
git commit -m "feat: עמוד ההשוואה: עד 3 קורסים, מהמגש או מקישור, באותו סימון מקור"
```

---

### Task 9: הדרכים לעמוד ההשוואה, ובדיקת הקצה (Impeccable)

**Files:**
- Modify: `web/src/components/account/compare-tray.tsx` (ייבוא, ההערה בראש, וההערה בעט ליד הקישור)
- Modify: `web/src/components/course/course-actions.tsx` (שלוש ההערות אחרי "להשוואה")
- Test: `web/e2e/compare.spec.ts`

- [ ] **Step 1: Impeccable לפני כל עריכת ממשק**

1. טוענים את ה-skill `/impeccable`. אם `.claude/skills/impeccable` חסרה: `npx impeccable install` מתיקיית הפרויקט.
2. Run:
   ```bash
   .claude/skills/impeccable/scripts/impeccable context --target web/src/components/account/compare-tray.tsx
   ```
   ב-PowerShell או ב-cmd: `.claude\skills\impeccable\scripts\impeccable.cmd context --target web/src/components/account/compare-tray.tsx`. ממלאים את ההוראות שהפקודה מדפיסה, ולא מריצים אותה שוב.
3. קוראים את `.claude/skills/impeccable/reference/craft-floor.md`.
4. הכללים, מ-`DESIGN.md`: ההערה בשוליים נשארת בעט, עם `PenArrow`. הקישורים בהערות בדיו עם קו דק. העריכות בשני הקבצים קטנות, בדיוק כמו בצעדים: סשן התנועה עורך את שניהם.

- [ ] **Step 2: המגש באזור האישי**

In `web/src/components/account/compare-tray.tsx`, replace:

```tsx
import { MAX_COMPARE } from '@/lib/account/lists';
```

with:

```tsx
import { MAX_COMPARE } from '@/lib/account/lists';
import { slotsLeftText } from '@/lib/compare/param';
```

Replace:

```tsx
 * מקום שהתפנה נשאר ריק במקום שלו. עמוד ההשוואה עצמו נבנה בסבב 4, ולכן ליד הקישור אליו כתוב בעט "נפתח בקרוב".
```

with:

```tsx
 * מקום שהתפנה נשאר ריק במקום שלו. ליד הקישור לעמוד ההשוואה כתוב בעט כמה מקומות נשארו.
```

Replace:

```tsx
        <p className={marginNote}>
          <PenArrow />נפתח בקרוב
        </p>
```

with:

```tsx
        <p className={marginNote}>
          <PenArrow />
          {slotsLeftText(slots.length)}
        </p>
```

- [ ] **Step 3: מעמוד הקורס לעמוד ההשוואה**

כך גם מבקר שלא התחבר מגיע להשוואה שלו (`notes-for-plan-2.md`, "ההשוואה של מבקר לא מחובר").

In `web/src/components/course/course-actions.tsx`, replace:

```tsx
        {note === 'added-local' && (
          <PenNote arrow className="mt-2.5">נוסף להשוואה. היא נשמרת בדפדפן הזה, ואחרי התחברות תעבור לאזור שלכם.</PenNote>
        )}
        {note === 'added' && (
          <PenNote arrow className="mt-2.5">
            נוסף להשוואה ולשמורים.{' '}
            <Link href="/me#compare" className="underline underline-offset-[3px]">
              לאזור שלי
            </Link>
          </PenNote>
        )}
        {note === 'full' && (
          <PenNote arrow className="mt-2.5">
            בהשוואה כבר יש 3 קורסים.{' '}
            {account.status === 'signed-in' ? (
              <Link href="/me#compare" className="underline underline-offset-[3px]">
                להוציא אחד באזור שלי
              </Link>
            ) : (
              'אפשר להוציא קורס מהעמוד שלו.'
            )}
          </PenNote>
        )}
```

with:

```tsx
        {note === 'added-local' && (
          <PenNote arrow className="mt-2.5">
            נוסף להשוואה. היא נשמרת בדפדפן הזה, ואחרי התחברות תעבור לאזור שלכם.{' '}
            <Link href="/compare" className="underline underline-offset-[3px]">
              לעמוד ההשוואה
            </Link>
          </PenNote>
        )}
        {note === 'added' && (
          <PenNote arrow className="mt-2.5">
            נוסף להשוואה ולשמורים.{' '}
            <Link href="/compare" className="underline underline-offset-[3px]">
              לעמוד ההשוואה
            </Link>
          </PenNote>
        )}
        {note === 'full' && (
          <PenNote arrow className="mt-2.5">
            בהשוואה כבר יש 3 קורסים.{' '}
            <Link href="/compare" className="underline underline-offset-[3px]">
              להוציא אחד בעמוד ההשוואה
            </Link>
          </PenNote>
        )}
```

- [ ] **Step 4: בדיקת הקצה**

Create `web/e2e/compare.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('a shared link shows the courses side by side, with the same marks as the course page', async ({ page }) => {
  await page.goto('/compare?c=full-stack-sample,baking-sample');
  await expect(page.getByRole('columnheader', { name: /פיתוח Full Stack/ })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: /אפייה ביתית/ })).toBeVisible();
  await expect(page.getByText(/זו השוואה מקישור/)).toBeVisible();

  // מה ששולם בפועל בירוק, בשני הקורסים. מה שהמוסד מבטיח בקו כחול.
  await expect(page.locator('[data-row="paid"] mark[data-source="verified"]')).toHaveCount(2);
  await expect(page.locator('[data-row="promises"] [data-source="claim"]').first()).toBeVisible();

  // להוציא בקישור משנה רק את הכתובת, והקורס מחכה בתחתית.
  await page.getByRole('button', { name: 'להוציא את אפייה ביתית: לחמים ועוגות מההשוואה' }).click();
  await expect(page).toHaveURL(/\/compare\?c=full-stack-sample$/);
  await page.getByRole('button', { name: 'להחזיר את אפייה ביתית: לחמים ועוגות להשוואה' }).click();
  await expect(page).toHaveURL(/\/compare\?c=full-stack-sample,baking-sample$/);
});

test('a visitor who did not log in sees the comparison from this browser, and can take a course out and back', async ({
  page,
}) => {
  await page.goto('/courses/italian-sample');
  const compareButton = page.getByRole('checkbox', { name: 'להשוואה (עד 3)' });
  // עד שהדפדפן יודע שהמבקר לא מחובר, הלחיצה לא עושה כלום. מנסים שוב עד שהקורס בפנים.
  await expect(async () => {
    await compareButton.click();
    await expect(compareButton).toBeChecked({ timeout: 1000 });
  }).toPass();
  await page.getByRole('link', { name: 'לעמוד ההשוואה' }).click();

  await expect(page).toHaveURL(/\/compare$/);
  await expect(page.getByRole('columnheader', { name: /בישול איטלקי/ })).toBeVisible();
  await expect(page.getByText(/נשארו 2 מקומות/)).toBeVisible();

  await page.getByRole('button', { name: 'להוציא את בישול איטלקי מההשוואה' }).click();
  await expect(page.getByText('עוד לא בחרתם קורסים להשוואה.')).toBeVisible();
  await page.getByRole('button', { name: 'להחזיר את בישול איטלקי להשוואה' }).click();
  await expect(page.getByRole('columnheader', { name: /בישול איטלקי/ })).toBeVisible();
});
```

- [ ] **Step 5: בנייה ובדיקות קצה**

```bash
pnpm --dir web lint && pnpm --dir web exec tsc --noEmit && pnpm --dir web test
pnpm --dir web e2e compare.spec.ts account.spec.ts
```

Expected: `4 passed` (2 חדשות ו-2 של האזור האישי). אם הבדיקה השנייה נכשלת על "לעמוד ההשוואה", בודקים שההערה `added-local` מופיעה ושיש בה רק קישור אחד בשם הזה.

בדפדפן (אחרי `pnpm --dir web build` ו-`pnpm --dir web start`): מתחברים מקומית, מוסיפים שני קורסים להשוואה, ובודקים ב-`/me#compare` שליד הקישור כתוב בעט "נשאר מקום אחד", ושב-`/compare` מופיעים השניים, ובתחתית מה ששמרתם. עוצרים את השרת.

- [ ] **Step 6: Commit**

```bash
git add web/src/components/account/compare-tray.tsx web/src/components/course/course-actions.tsx web/e2e/compare.spec.ts
git commit -m "feat: מעמוד הקורס ומהאזור האישי לעמוד ההשוואה, ובדיקת קצה להשוואה"
```

---

### Task 10: סקירת הסיום של Impeccable, ו-`DESIGN.md`

**Files:**
- Modify: קבצי הממשק של משימות 4–9, לפי הממצאים
- Modify: `DESIGN.md`, `.impeccable/design.json` (דרך `impeccable-documenter`)

החוזים החדשים נגמרים בשורת FINISH: "unreviewed and undocumented is unfinished". לכן הסבב נגמר בסקירת סיום, בתיקונים ובתיעוד. סבב סקירה אחד, לפי הבקשה של גל.

- [ ] **Step 1: צילומים ברוחב טלפון ומחשב**

הצילומים בלי תנועה (`reducedMotion: 'reduce'`): עם תנועה, מה שעוד לא נכנס למסך שקוף בצילום של כל הדף. התיקייה `.impeccable/review/` לא נשמרת ב-git.

```bash
cd "C:/Users/galsa/Desktop/קורסים השוואות"
pnpm --dir web build
mkdir -p .impeccable/review/round4/mobile .impeccable/review/round4/desktop
cat > web/test-results/shots-round4.mjs <<'EOF'
import { chromium } from '@playwright/test';

const base = 'http://localhost:3000';
const pages = [
  ['01-institution', '/institutions/sample-college'],
  ['02-lecturer', '/lecturers/yael-cohen-sample'],
  ['03-lecturer-no-facts', '/lecturers/omer-sagi-sample'],
  ['04-compare-three', '/compare?c=full-stack-sample,baking-sample,italian-sample'],
  ['05-compare-one', '/compare?c=psycho-full-sample'],
  ['06-compare-empty', '/compare'],
  ['07-category', '/categories/cooking'],
  ['08-category-no-score', '/categories/ai'],
  ['09-course', '/courses/full-stack-sample'],
];
const sizes = { mobile: { width: 390, height: 844 }, desktop: { width: 1280, height: 900 } };

const browser = await chromium.launch();
let overflow = 0;
for (const [size, viewport] of Object.entries(sizes)) {
  const context = await browser.newContext({ viewport, reducedMotion: 'reduce', storageState: 'e2e/intro-seen.json' });
  const page = await context.newPage();
  for (const [name, path] of pages) {
    await page.goto(base + path, { waitUntil: 'networkidle' });
    if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)) {
      console.log(`גלילה לרוחב: ${size} ${path}`);
      overflow++;
    }
    await page.screenshot({ path: `../.impeccable/review/round4/${size}/${name}.png`, fullPage: true });
  }
  // הראש הדביק של ההשוואה, באמצע הגלילה.
  await page.goto(`${base}/compare?c=full-stack-sample,baking-sample,italian-sample`, { waitUntil: 'networkidle' });
  await page.mouse.wheel(0, 1400);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `../.impeccable/review/round4/${size}/10-compare-scrolled.png` });
  await context.close();
}
await browser.close();
process.exit(overflow ? 1 : 0);
EOF
```

בטרמינל נפרד: `pnpm --dir web start`. ואז:

```bash
cd web && node test-results/shots-round4.mjs; cd ..
ls .impeccable/review/round4/mobile .impeccable/review/round4/desktop
```

Expected: הסקריפט יוצא בלי "גלילה לרוחב". בכל תיקייה עשרה צילומים, מ-`01-institution.png` עד `10-compare-scrolled.png`.

- [ ] **Step 2: סקירת הסיום**

שולחים את `impeccable-finish-reviewer`, בלי היסטוריה של השיחה, עם:
- **הבקשה:** "סבב 4: עמוד מוסד, עמוד מרצה, השוואה של עד 3 קורסים (מהמגש או מקישור), 'המובילים לפי בוגרים' בעמוד תחום, ו'לשלוח בוואטסאפ' בעמוד הקורס. לפי `docs/superpowers/specs/2026-11-15-round-4-institutions-compare-design.md`, סעיפים 2–7 ו-10. אין ציון למוסד ואין ציון למרצה."
- **החוזים:** החוזה של עמוד מוסד ומרצה, והחוזה של ההשוואה (`impeccable surface-brief list` מראה את הנתיבים שלהם), ו-`.impeccable/surfaces/course-page.md`.
- **הקבצים:**
  - `web/src/app/institutions/[slug]/page.tsx`, `web/src/app/lecturers/[slug]/page.tsx`, `web/src/components/course/course-row.tsx` ו-`web/src/components/lecturer/lecturer-about.tsx`;
  - `web/src/app/compare/page.tsx` ו-`web/src/components/compare/*.tsx`;
  - `web/src/components/category/top-by-graduates.tsx`;
  - `web/src/components/course/share-links.tsx` ו-`web/src/components/course/course-actions.tsx`.
- **הצילומים:** `.impeccable/review/round4/mobile/*.png` ו-`.impeccable/review/round4/desktop/*.png`.
- **שפת העיצוב:** `DESIGN.md` ו-`.claude/skills/impeccable/reference/craft-floor.md`.
- **הציורים כרפרנס לעולם (אין comp מאושר לסבב הזה):** `design/canvas/Chosen.dc.html` ו-`design/canvas/Me.dc.html`.
- **התנועה:** `web/src/components/site/motion-observer.tsx` ו-`web/src/app/globals.css` ("תנועה"). לבדוק שהעמודים החדשים זזים כמו השאר.

מבקשים רשימה מסודרת של תיקונים מהותיים.

- [ ] **Step 3: תיקונים, וצילום אחד נוסף**

מתקנים כל ממצא מהותי, לפי הסדר. **לא משנים** את מה שבדיקות הקצה מחפשות:
- **כפתורים וקישורים:**
  - "להוציא את <קורס> מההשוואה" ו"להחזיר את <קורס> להשוואה";
  - "לעמוד ההשוואה", "לשלוח בוואטסאפ" ו"לאתר המוסד";
  - "מכללה לדוגמה" ו"יעל כהן" כקישורים בעמוד הקורס.
- **טקסטים:**
  - "זו השוואה מקישור", "עוד לא בחרתם קורסים להשוואה." ו"נשארו 2 מקומות";
  - "אין כאן ציון למוסד. לכל קורס יש ציון משלו, רק מהבוגרים שלו.";
  - "אין כאן ציון למרצה. המרצים מתחלפים בין מחזורים, ולכל קורס יש ציון משלו.";
  - "התפקיד בקורס:", "המוסד לא נמצא" ו"לא מצאנו את המרצה".
- **מבנה:**
  - `role="columnheader"`, `data-row="paid"`, `data-row="promises"`, `#courses`, ו-`h3` לכל קורס בעמוד מוסד ומרצה;
  - `section[aria-labelledby="top-title"]`.

אחר כך:

```bash
pnpm --dir web lint && pnpm --dir web exec tsc --noEmit && pnpm --dir web test && pnpm --dir web build
```

מפעילים מחדש את `pnpm --dir web start` (הבנייה החדשה), ומריצים שוב את הסקריפט של צעד 1. בודקים בצילומים שהתיקונים נכנסו, ושבנייד לטקסט יש ריווח מהקצוות. ממצא שדורש שינוי בשפת העיצוב עצמה נרשם בקובץ הסשן, וגל מחליט. בלי סבב סקירה שני.

- [ ] **Step 4: `DESIGN.md`**

שולחים את `impeccable-documenter`, עם הקבצים, החוזים והצילומים מצעד 3. מבקשים לרשום ב-`DESIGN.md` וב-`.impeccable/design.json` את מה שנבנה בפועל:
- **שורת קורס בעמוד מוסד ומרצה:** הציון והמחיר מאותו צד, והטווח בירוק;
- **ההשוואה:** הראש הדביק עם המספרים המוקפים, שורות `figure` ו-`text` בנייד, ו"נשארו N מקומות";
- **"המובילים לפי בוגרים":** המספרים המוקפים, והשורה על הכלל;
- **"לשלוח בוואטסאפ":** בלי לוגו;
- **"נפתח בקרוב"** כבר לא ליד הקישור להשוואה.

הנגזר מהקוד, לא מהכוונות.

- [ ] **Step 5: הכול ירוק, ו-Commit**

עוצרים את השרת.

```bash
pnpm --dir web e2e
git add DESIGN.md .impeccable web/src
git commit -m "design: סקירת הסיום של סבב 4, והשפה ב-DESIGN.md"
```

Expected: 23 בדיקות קצה. 19 עוברות, ו-4 של היועץ מדלגות בלי מפתח. אם התיקונים לא נגעו בקוד, רק ב-`DESIGN.md` וב-`.impeccable`, ה-commit כולל רק אותם.

---

### Task 11: תיעוד ופריסה

**Files:**
- אין שינוי בקוד.
- Modify: `docs/STATUS.md`
- Modify: `docs/ROADMAP.md`
- Modify: `docs/superpowers/plans/notes-for-plan-2.md`
- Modify: `docs/sessions/2026-11-15-round-4.md`

**לפני שמתחילים:** כל הבדיקות המקומיות ירוקות (`test`, `tsc`, `lint`, `build`, `e2e`), ו-`git status` נקי.

- [ ] **Step 1: המסד בענן לא משתנה**

לסבב הזה אין migration ואין קובץ נתונים חדש. **לא מריצים `db push`.** הוא היה מעלה גם את `20261114200001_course_scraper.sql`, שמחכה להחלטה נפרדת של גל (`docs/STATUS.md`). בדיקה לקריאה בלבד, שאף migration של הסבב לא נוסף בטעות:

```bash
cd "C:/Users/galsa/Desktop/קורסים השוואות"
git diff --name-only b0d601a -- supabase/
pnpm exec supabase db push --remote --dry-run
```

Expected:
- `git diff` לא מחזיר כלום.
- בבדיקת היבש: רק `20261114200001_course_scraper.sql` ממתין. זה לא חלק מהסבב, ולא מעלים אותו.

**אם בכל זאת נוסף migration בסבב הזה:** עוצרים. מציגים לגל את הקובץ ואת הפלט של `--dry-run`, ומסבירים שה-push יעלה גם את המיגרציה של האוסף. מריצים `pnpm exec supabase db push --remote --include-seed` רק אחרי "כן" מפורש של גל בצ'אט.

- [ ] **Step 2: עוצרים: הפריסה מחכה לאישור של גל**

מציגים לגל:
- מה עולה: עמוד מוסד, עמוד מרצה, השוואה, המובילים ו"לשלוח בוואטסאפ";
- שאין שום שינוי במסד בענן;
- את הצילומים מ-`.impeccable/review/round4/mobile/`.

ממשיכים רק אחרי "כן" מפורש של גל בצ'אט.

- [ ] **Step 3: פריסה (אחרי "כן" של גל)**

```bash
git branch --show-current
cd web
vercel deploy --prod --yes --force
cd ..
```

Expected:
- הענף: `plan-1-foundation`. פורסים רק ממנו. אחרת סבב 3 יירד מהאתר (`docs/STATUS.md`).
- הבנייה ב-Vercel עוברת. `--force` חובה: בלעדיו Vercel משתמש במטמון בנייה ישן, ופעם זה כבר העלה CSS ישן.

- [ ] **Step 4: לבדוק את האתר באוויר**

```bash
for p in / /compare "/compare?c=full-stack-sample,baking-sample" /institutions/sample-college /lecturers/yael-cohen-sample /categories/cooking /courses/full-stack-sample /me; do curl -s -o /dev/null -w "%{http_code} $p\n" "https://course-compare-il.vercel.app$p"; done
for p in /institutions/no-such-institution /lecturers/no-such-lecturer /admin; do curl -s -o /dev/null -w "%{http_code} $p\n" "https://course-compare-il.vercel.app$p"; done
curl -s https://course-compare-il.vercel.app/courses/full-stack-sample | grep -o 'https://wa.me/?text=' | head -1
curl -s https://course-compare-il.vercel.app/categories/cooking | grep -o 'המובילים לפי בוגרים' | head -1
curl -s https://course-compare-il.vercel.app/institutions/sample-college | grep -o 'אין כאן ציון למוסד' | head -1
```

Expected:
- `200` לכל העמודים ברשימה הראשונה.
- `404` לשלושה בשנייה.
- `https://wa.me/?text=`, `המובילים לפי בוגרים` ו-`אין כאן ציון למוסד`.

- [ ] **Step 5: בנייד, לטקסט יש ריווח מהקצוות**

```bash
pnpm --dir web exec playwright screenshot --viewport-size "390, 844" --full-page "https://course-compare-il.vercel.app/compare?c=full-stack-sample,baking-sample,italian-sample" test-results/prod-compare-390.png
pnpm --dir web exec playwright screenshot --viewport-size "390, 844" --full-page "https://course-compare-il.vercel.app/institutions/sample-college" test-results/prod-institution-390.png
pnpm --dir web exec playwright screenshot --viewport-size "390, 844" --full-page "https://course-compare-il.vercel.app/lecturers/yael-cohen-sample" test-results/prod-lecturer-390.png
pnpm --dir web exec playwright screenshot --viewport-size "390, 844" --full-page "https://course-compare-il.vercel.app/courses/full-stack-sample" test-results/prod-course-390.png
```

הצילומים נשמרים ב-`web/test-results/`. קוראים אותם:
- לטקסט יש ריווח מהקצוות, ואין שום דבר שיוצא מהדף (הבדיקה מ-`docs/STATUS.md`, אחרי כל פריסה).
- בהשוואה: שלושה מספרים מוקפים בראש, ושורות הטקסט בערימה.
- בעמוד הקורס: "לשלוח בוואטסאפ" ליד "לשמור".

הערה: עם תנועה, חלק ממה שמתחת לקצה המסך שקוף בצילום של כל הדף. מה שחשוב כאן הוא הריווח מהקצוות, ולא מה שגלוי.

- [ ] **Step 6: גל בנייד**

גל מסמן:
- [ ] **השוואה:** מוסיף שלושה קורסים מעמודי הקורסים, פותח את "לעמוד ההשוואה", גולל ורואה שהראש נשאר, ושולח את ההשוואה בוואטסאפ לעצמו. הקישור נפתח עם אותם שלושה קורסים.
- [ ] **עמוד מוסד:** מהחותמת בעמוד הקורס.
- [ ] **עמוד מרצה:** מהשם ב"על המרצים".
- [ ] **"לשלוח בוואטסאפ"** מעמוד קורס: ההודעה, ותמונת השיתוף בוואטסאפ.
- [ ] **"שיתוף אחר":** מופיע בטלפון.

**התיעוד:**

- [ ] **Step 7: `docs/STATUS.md`**

- **"עודכן":** "15.11.2026, אחרי פריסת סבב 4."
- **תחת "איפה אנחנו", "שלב":** "תוכניות 1, 2א, 2ב, 2ג, 3 ו-4 בוצעו, בענף `plan-1-foundation`."
- **מוסיפים, אחרי "ביקורות מאומתות (סבב 3), באוויר":**
  - **מוסדות, מרצים והשוואה (סבב 4), באוויר:**
    - **עמוד מוסד** (`/institutions/<slug>`), מהחותמת בעמוד הקורס: כל הקורסים, כל אחד עם הציון שלו, מספר המאומתים, המחיר באתר והטווח ששולם. אין ציון למוסד (גל).
    - **עמוד מרצה** (`/lecturers/<slug>`), מהשם ב"על המרצים": מה המוסד אומר (קו כחול), מה בדקנו (ירוק), הקורסים והתפקיד, ומה הבוגרים אומרים על המרצים. אין ציון למרצה (גל).
    - **השוואה** (`/compare`): עד 3 קורסים, מהמגש (גם בלי התחברות) או מקישור `?c=`. אותו סימון מקור בכל תא. בנייד ראש דביק, ושורות טקסט בערימה.
    - **"המובילים לפי בוגרים"** בכל תחום: רק קורסים עם ציון, עד 3.
    - **"לשלוח בוואטסאפ"** בעמוד הקורס ובהשוואה.
    - **בלי שינוי במסד.**
- **"הפריסה האחרונה":** השם של הפריסה מצעד 3, והקומיט, ומה נבדק אחריה (צעדים 4 ו-5).
- **"בדיקות":** המספרים מהריצה האחרונה. צפוי: 98 בדיקות מסד (בלי שינוי), 133 בדיקות יחידה (115 ועוד 18), ו-23 בדיקות קצה (19 עוברות בלי מפתח, ו-4 של היועץ).
- **תחת "הצעדים הבאים":** סעיף 3 (סבב 4) מסומן כבוצע, עם "פריט 27 עבר לסשן של תור השינויים".

- [ ] **Step 8: `docs/ROADMAP.md`**

- **"עודכן":** "15.11.2026, עם סבב 4."
- **תחת "## סבב 4: מוסדות, מרצים והשוואה",** שורה ראשונה: "**נבנה ב-15.11.2026**, חוץ מפריט 27, שעבר לסשן של תור השינויים. מסמך העיצוב: `docs/superpowers/specs/2026-11-15-round-4-institutions-compare-design.md`."
- **פריט 26:** מוסיפים "בלי ציון למרצה (גל, 15.11.2026)."
- **פריט 25:** מוסיפים "בלי ציון למוסד (גל, 15.11.2026)."
- **פריט 29:** מחליפים את התת-סעיף "לפי מה מדרגים" ב: "**לפי מה מדרגים (גל, 15.11.2026):** ציון הבוגרים, רק קורסים עם ציון (5 ביקורות מאומתות ומעלה), מהגבוה לנמוך, עם מספר הבוגרים המאומתים ליד כל אחד."

- [ ] **Step 9: `notes-for-plan-2.md`: מה חדש**

מוסיפים בסוף הקובץ:

```markdown
## מתוכנית 4

- **עמוד ההשוואה מכיל את כל הקורסים:** הוא סטטי, ושולח לדפדפן את נתוני ההשוואה של כל הקורסים בקטלוג (בערך קילובייט לקורס). כמו הקטלוג, זה מספיק לכמה מאות קורסים. מעבר לזה: נתיב שמחזיר רק את 3 הקורסים מהכתובת, או רינדור בשרת בתוך `<Suspense>`, בלי `ensureStatic = 'navigation'` בעמוד הזה.
- **מה שהוצא מההשוואה נשמר רק עד סוף הביקור,** בזיכרון של הדף. מחובר רואה אותו גם אחר כך, כי הוא נשאר בשמורים.
- **`/institutions/join` תופס את ה-slug `join`:** מוסד עם ה-slug הזה לא יקבל עמוד. כשהאוסף יוצר מוסדות, לפסול אותו.
- **אין טקסט של המוסד על עצמו:** בעמוד המוסד הטענות הן "המוסד מבטיח" של כל קורס. אם ירצו "לפי המוסד" גם למוסד, צריך עמודה ב-`institutions`.
- **אין קישור להשוואה בתפריט העליון:** מגיעים אליה מההערה אחרי "להשוואה (עד 3)" ומהאזור האישי. כשיש כבר קורסים במגש, אפשר להוסיף "השוואה (2)" לתפריט.
```

- [ ] **Step 10: קובץ הסשן**

`docs/sessions/2026-11-15-round-4.md`:
- **"תקציר":** במקום "יעודכן בסוף", משפט אחד על מה שנבנה ומה באוויר.
- **"קומיטים":** שורה לכל commit של המשימות, עם הסטטוס הכן.
- **"מה צריך לבדוק בסשן הבא":**
  - מה שגל לא סימן בצעד 6;
  - שההשוואה עובדת למשתמש מחובר באוויר (רק גל יכול להתחבר עד סבב 6);
  - שהעמודים החדשים מתרעננים אחרי אישור ביקורת ב-`/admin`.

- [ ] **Step 11: Commit**

```bash
git add docs/STATUS.md docs/ROADMAP.md docs/superpowers/plans/notes-for-plan-2.md docs/sessions/2026-11-15-round-4.md
git commit -m "docs: סבב 4 באוויר: עמוד מוסד, עמוד מרצה, השוואה, המובילים ווואטסאפ"
```

לא דוחפים בלי אישור של גל.

---

## מה תוכנית 4 לא כוללת (בכוונה)

- **בקשה של מוסד להוסיף קורס, ותגובת מוסד לביקורת (פריט 27):** בסשן של תור השינויים. לא נוגעים ב-`/admin` ולא ב-`/institutions/join`.
- **עמודי המדריכים (`/guides`):** בסשן נפרד.
- **שינוי במסד:** אין migration, אין קובץ נתונים, ואין `db push`.
- **טקסט של המוסד על עצמו:** צריך עמודה. ראו ההערות.
- **קישור להשוואה בתפריט העליון:** ראו ההערות.
- **נתונים מובנים (schema.org):** גם לעמוד הקורס עוד אין. ביחד, לפני הסרת noindex.
- **עמוד כל הביקורות של קורס:** נשאר "בקרוב".

## בדיקה עצמית

**כיסוי של מסמך העיצוב ושל הבקשה:**

| דרישה | משימה |
|---|---|
| §3 `/institutions/[slug]` במקום "בקרוב", בלי לגעת ב-`/institutions/join` | 4 |
| §3 הפרטים מ-`institutions`, והאתר דרך `safeHttpUrl` | 1 (`loadInstitutionPage`), 4 |
| §3 כל הקורסים, עם ציון ומספר מאומתים, מחיר באתר, וטווח כשיש | 1 (`compareByScore`), 4 (`CourseRow`) |
| §2 ו-§3 בלי ציון למוסד, עם הערה בעט | 4 |
| §3 טענות המוסד בקו כחול | 4 ("המוסד מבטיח" עם `Claim`) |
| §4 `/lecturers/[slug]`, ו-404 למרצה שלא קיים | 1, 6 |
| §4 הקורסים מ-`course_lecturers` עם התפקיד | 1 (`loadLecturerPage`), 6 |
| §4 `institution_bio` בקו כחול, `verified_facts` בירוק עם קישורים | 1 (`verifiedFactsOf`), 6 (`LecturerAbout`) |
| §4 מה הבוגרים אומרים על המרצים, מכל קורס | 6 (`StickyNote`) |
| §2 ו-§4 בלי ציון למרצה | 6 ("ציון הבוגרים לקורס", והערה בעט) |
| §2 slug למרצים: אין צורך ב-migration | החלטה 1, משימה 11 צעד 1 |
| §4 קישור מ"על המרצים" | 6 |
| §5 עד 3 קורסים בעמודות, שורה לכל עובדה ושאלה, אותו סימון | 2 (`buildCompareRows`), 8 (`CompareTable`) |
| §5 המגש: בדפדפן למבקר, בחשבון למחובר | 8 (`CompareFromUrl`), 9 (בדיקת הקצה) |
| §5 `?c=` גובר על המגש | 2 (`parseCompareParam`), 8 |
| §5 כמה מקומות נשארו, ומה שהוצא נשאר בתחתית | 2 (`slotsLeftText`), 8 (`CompareShelf`), 9 |
| §5 עיצוב אמיתי לנייד, דרך Impeccable | 8 (צעד 2), 10 |
| §5 "נפתח בקרוב" יורד מ-`compare-tray.tsx` | 9 |
| §5 קורס שהוסר מהאתר במגש, slug לא מוכר בקישור | 2 (`pickCompared`), 8 |
| §6 המובילים: לפי ציון, רק עם ציון, מהגבוה לנמוך, עם מספר המאומתים, לא לפי נרשמים | 3 (`topByGraduates`), 7 |
| §6 עריכה קטנה של `categories/[slug]/page.tsx`, כרכיב | 7 |
| §7 `https://wa.me/?text=` עם הטקסט של `share-text.ts` והכתובת | 3 (`courseShareMessage`, `whatsappHref`), 5 |
| §7 `navigator.share` בטלפון, וואטסאפ ברירת המחדל | 5 (`ShareLinks`) |
| §7 עריכה קטנה של `course-actions.tsx` | 5, 9 |
| §8 סטטי ובמטמון (`cacheTag`, `cacheLife`), 404 אמיתי | 1, 4, 6, 8 |
| §10 Impeccable בכל משימת ממשק, `context --target`, `craft-floor.md`, `DESIGN.md`, תנועה | 4–9 (הצעד הראשון), 10 |
| סקירת סיום עם `impeccable-finish-reviewer`, ואחריה תיקונים | 10 |
| §12 בדיקות יחידה: `?c=`, שורות, מובילים, וואטסאפ, סדר | 1, 2, 3 |
| §12 בדיקות קצה: השוואה, מוסד, מרצה | 9, 4, 6 |
| pgTAP רק אם יש אובייקט במסד: אין | "איך עובדים" |
| תיאום: לא נוגעים ב-`/admin`, ב-`/institutions/join` וב-`/guides`. עריכות קטנות בקבצים משותפים | "איך עובדים", 4, 5, 6, 7, 9 |
| תיעוד: STATUS, קובץ הסשן, ROADMAP | 11 |
| migration בענן רק אחרי אישור, עם `--dry-run` | 11 צעד 1 (אין migration, ואין `db push`) |
| פריסה עם `--force` רק אחרי אישור, ובדיקה בנייד שיש ריווח | 11 צעדים 2–5 |

**מילים אסורות:** אין "TBD", "TODO", "להשלים אחר כך" או "כמו במשימה N". כל צעד שמשנה קוד מציג את הקוד. הצעד הקבוע של Impeccable כתוב מחדש בכל משימה.

**עקביות שמות בין המשימות:**
- **משימה 1:**
  - `isProductType` (`search/types.ts`), `VerifiedFact` ו-`verifiedFactsOf` (`data/shared.ts`), ו-`outcomeHeadline` (`format.ts`, מיוצא גם מ-`at-a-glance.tsx`).
  - `CoursePageData.institutionSlug`, `CoursePageData.productType` ו-`compareByScore(a, b)`.
  - `InstitutionKind`, `INSTITUTION_KIND_LABEL`, `InstitutionPageData`, `getInstitutionPage(slug)`, `getInstitutionSlugs()` ו-`loadInstitutionPage(slug)`.
  - `LecturerPageData`, `getLecturerPage(slug)`, `getLecturerSlugs()` ו-`loadLecturerPage(slug)`.
- **משימה 2:**
  - `COMPARE_PARAM`, `parseCompareParam(value)`, `compareHref(slugs)`, `pickCompared(courses, { slugs } | { ids })` (מחזירה `{ chosen, missing }`) ו-`slotsLeftText(taken)`.
  - `CompareCourse`, `toCompareCourse(page)`, `CellSource`, `CompareCell`, `CompareRow`, `CompareSection` ו-`buildCompareRows(courses)`.
  - מפתחות השורות: `score`, `recommend`, `outcome`, `sitePrice`, `paid`, `costPerHour`, `good`, `weak`, `metric:<key>`, `duration`, `schedule`, `how`, `nextCohort`, `admission`, `classSize`, `certificate`, `promises`, `lecturers` ו-`lecturersSummary`. ובטבלה גם `institution`.
- **משימה 3:** `TOP_LIMIT`, `ScoredSummary`, `topByGraduates(courses, categorySlug, limit?)`, `courseShareMessage(course)`, `compareShareMessage(titles)` ו-`whatsappHref(message, url)`.
- **משימות 4–6:**
  - `CourseRow({ course, showInstitution?, scoreLabel?, children? })`;
  - `ShareLinks({ text, url, className? })`, ו-`CourseActions` עם `share?: { text, url }`;
  - `LecturerAbout({ lecturer })`, ו-`initials` מ-`lecturers-section.tsx`.
- **משימות 7–8:** `TopByGraduates({ courses, categorySlug })`, `getCompareCourses()`, `CompareTable({ courses, sections, busy, onRemove })`, `CompareShelf({ removed, saved, full, busy, onAdd })` ו-`CompareFromUrl({ courses, siteUrl })`.
- **מה שבדיקות הקצה מחפשות:**
  - **קישורים:** "מכללה לדוגמה", "יעל כהן", "לאתר המוסד", "לשלוח בוואטסאפ" ו"לעמוד ההשוואה".
  - **כפתורים:** "להשוואה (עד 3)", "להוציא את <קורס> מההשוואה" ו"להחזיר את <קורס> להשוואה".
  - **טקסטים:** ההערות על אין ציון, "התפקיד בקורס:", "זו השוואה מקישור", "עוד לא בחרתם קורסים להשוואה." ו"נשארו 2 מקומות".
  - **מבנה:** `#courses h3`, `#courses article`, `role="columnheader"`, `data-row="paid"`, `data-row="promises"`, `mark[data-source="verified"]`, `[data-source="claim"]` ו-`section[aria-labelledby="top-title"]`.

**אומת בזמן הכתיבה, בלי לשנות את המאגר:**
- **השאילתות** של `loadLecturerPage`, `getLecturerSlugs`, `loadInstitutionPage` ו-`getInstitutionSlugs` רצו מול המסד המקומי עם המפתח הציבורי, והחזירו את מה שהצעדים מצפים לו (החלטה 1).
- **הציונים בנתוני הדוגמה, במסד המקומי:**
  - **בישול:** אפייה 9.0 (8 ביקורות), איטלקי 7.1 (6), ובישול ביתי בלי ציון.
  - **המכללה לדוגמה:** Full Stack 7.9 (23), כלי AI עם 3 ביקורות, וסדנת AI בלי ביקורות.
  - **בינה מלאכותית:** אין קורס עם ציון.

  לפי אלה נכתבו הסדר והתוצאות בבדיקות הקצה.
- **Next:**
  - ב-`ensureStatic.md`: `useSearchParams` מותר בתוך `<Suspense>`, ו-`searchParams` בשרת אסור, עם `'navigation'`.
  - ב-`cacheTag.md`: כמה תגיות בקריאה אחת.
  - ב-`revalidateTag.md`: תגית מרעננת כל עמוד שמשתמש בה.
- **לא נבדק:**
  - `tsc`, `lint` והבנייה עם הקוד החדש, ובמיוחד הטיפוס שהשאילתה נותנת ל-`course_lecturers(role, courses(slug))`, וכללי `react-hooks`.
  - בדיקות היחידה והקצה החדשות.
  - שהטבלה של ההשוואה נקראת נכון בקורא מסך עם `role` על `div`.
  - הפריסה.

## פתוח (לגל)

1. **קישור להשוואה בתפריט העליון:** לא בסבב הזה. אם גל רוצה, "השוואה (2)" ליד "האזור שלי".
2. **הספירה בראש עמוד המוסד** ("3 קורסים באתר, 26 בוגרים מאומתים"): ספירה ולא ציון. אם גם היא נראית כמו דירוג של המוסד, מורידים את הבוגרים ומשאירים רק את הקורסים.
3. **הציון בכל שורה בעמוד המרצה:** מסומן "ציון הבוגרים לקורס". אם גל מעדיף שבעמוד המרצה לא יהיה שום ציון, זו מחיקה של שורה אחת ב-`CourseRow`.
4. **עד 3 מובילים בכל תחום:** אם גל רוצה 5, זה `TOP_LIMIT`.
