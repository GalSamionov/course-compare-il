-- אחרי המיגרציה 20261116040001_new_categories.sql: הקורסים שבענן עוד בתחום ai עוברים לתחומים החדשים.
--
-- הרשימה: 55 קורסים ב-ai, בשאילתה לקריאה בלבד ב-16.11.2026 (5 פעילים, 50 טיוטות של האוסף). כל קורס סווג לפי
-- השם, ואם יש, לפי הסילבוס שהאוסף שמר. רובם הגיעו ל-ai כי זה היה התחום היחיד של המוסד באוסף.
--   * 39 עוברים: 25 לארבעת תחומי ה-AI, 5 לשיווק דיגיטלי, 6 לדאטה, 1 לסייבר, 2 לתכנות.
--   * כשלא היה ברור לאיזה תחום AI: "AI בעבודה ולפי מקצוע", הכללי מהארבעה. מסומנים "לא בטוח".
--   * 16 נשארים ב-ai: אינם קורסי AI, ואין להם תחום באתר (ניהול, עיצוב UX/UI, סולארי, טיפול בבישול...).
--     ההחלטה של גל, בתור או בעמוד הניהול. רק אחד מהם פעיל: "ניהול פרויקטים" של כנרת.
--
-- הרצה, רק באישור של גל, אחרי שהמיגרציה עלתה לענן:
--   supabase db query --remote -f supabase/fixes/2026-11-16-recategorize-ai.sql
-- אחרי ההרצה: pnpm --dir web score:recompute מול הענן (הציון נשען על ממוצע התחום), ורענון הקטלוג
-- (הוא נשמר לשעה, או פריסה חדשה).
--
-- בטוח להריץ שוב: קורס זז רק אם הוא עדיין ב-ai, ורק אם ה-slug שלו עדיין תואם למזהה.

with moves (id, slug, target) as (values
  -- ===== AI בעבודה ולפי מקצוע (ai-at-work) =====
  ('ae4239be-305e-4d74-b945-13cfa4d8fb08'::uuid, '360-kinneret-ai-027317', 'ai-at-work'),                -- AI בעבודה - כלים שעובדים בשבילכם
  ('fa11dcfe-451a-4005-9518-693b8e7e1765'::uuid, '360-kinneret-ai-8cd8f5', 'ai-at-work'),                -- AI למנהלים - לקבל החלטות חכמות יותר
  ('00e54a33-97af-4380-925e-84292c2a5d53'::uuid, 'ceu-ono-course-a0d903', 'ai-at-work'),                 -- יישומי בינה מלאכותית למנהלים
  ('1343de5c-9f29-425c-b9a3-7c3d8b42eaae'::uuid, 'ceu-ono-course-b3ac6a', 'ai-at-work'),                 -- יישומי בינה מלאכותית למנהלים (עוד עותק)
  ('2ce78aac-6f63-4a68-9f0d-87122699ccdf'::uuid, 'cont-edu-technion-ai-0a7e02', 'ai-at-work'),           -- 360 AI - כלים יישומיים לעבודה עם בינה מלאכותית
  ('aeb230a6-2b98-4c09-89ad-4a15261d90de'::uuid, 'hackeru-ai-management-expert-7c21e2', 'ai-at-work'),   -- AI Management Expert
  ('7c7a3887-8bac-4ad0-9e73-c995a59d67b9'::uuid, 'lahav-abc-198c32', 'ai-at-work'),                      -- AI למנהלים: ניהול וטכנולוגיות AI מתקדמות
  ('71d34086-abf4-41f8-9a67-25e0bc2c2c83'::uuid, 'lahav-ai-aefc6a', 'ai-at-work'),                       -- מובילי AI בארגונים
  ('f8a30433-13f3-4122-9095-6b9fd73c5036'::uuid, 'lahav-ai-bdd108', 'ai-at-work'),                       -- AI למהנדסים
  ('eeeeeeee-0000-0000-0000-000000000002'::uuid, 'ai-tools-sample', 'ai-at-work'),                       -- כלי AI לעבודה יומיומית (לדוגמה)
  ('eeeeeeee-0000-0000-0000-000000000007'::uuid, 'ai-weekend-sample', 'ai-at-work'),                     -- סדנת AI לעסקים קטנים (לדוגמה)
  ('606f73c4-342d-4275-b26a-21e04b8f3068'::uuid, 'ipc-ai-applications-course-40de5d', 'ai-at-work'),     -- יישום בינה מלאכותית: כמה תחומי AI, הכללי
  ('fb792922-e147-4884-8949-019a5380154c'::uuid, 'letsai-letsaifullcourse-8d9b2c', 'ai-at-work'),        -- לא בטוח: GenAI Master, בלי סילבוס
  ('9a6f60fb-4bfd-48ed-8ad7-72b49c0f6762'::uuid, 'svcollege-ai-df8c1e', 'ai-at-work'),                   -- לא בטוח: AI mastermind, בלי סילבוס
  ('0bb26841-ca3c-4340-aca4-3a135fc0ac3e'::uuid, 'svcollege-ai-d57fab', 'ai-at-work'),                   -- לא בטוח: AI mastermind (עוד עותק)
  ('41a6fb7f-42f0-4363-90a0-6880fe31e93d'::uuid, 'svcollege-ai-architect-ff06c4', 'ai-at-work'),         -- לא בטוח: AI ARCHITECT, אולי אוטומציות
  ('c53584d1-be21-4419-a30d-4d1b8e48e1d8'::uuid, 'ipc-ai-5dbc6c', 'ai-at-work'),                         -- לא בטוח: ארכיטקט מערכות AI יישומיות
  ('e8291d06-9510-41f4-9cea-88855a3311a7'::uuid, 'cont-edu-technion-ai-50808e', 'ai-at-work'),           -- לא בטוח: הכשרת מפתחי AI, אין תחום של פיתוח AI
  ('0ad883d5-7882-4233-9528-e604383abe8f'::uuid, 'lahav-marketing-39365c', 'ai-at-work'),                -- לא בטוח: מנהלי שיווק בכירים בעידן ה-AI, אולי שיווק דיגיטלי

  -- ===== אוטומציות וסוכני AI (ai-automation) =====
  ('3992b687-b7be-4efd-8184-3d09428dcdbc'::uuid, 'hackeru-ai-solutions-architect-05dd53', 'ai-automation'), -- מיישם AI בארגונים: אוטומציות No-Code וסוכנים

  -- ===== בניית אפליקציות בלי קוד (ai-no-code) =====
  ('abb504cd-09d7-469f-9029-0d22940a8fc5'::uuid, 'ipc-ai-0c82f1', 'ai-no-code'),                         -- עיצוב ובניית אתרים בשילוב AI: Wix, Elementor

  -- ===== AI ליצירת תוכן ווידאו (ai-content) =====
  ('27a49af7-1be6-42de-a543-9f2495fa43ec'::uuid, 'ceu-ono-ai-2-6e03bf', 'ai-content'),                   -- הפקת שירים בעזרת AI
  ('cb4dcc24-5e5c-495a-8ade-aed6461910ba'::uuid, 'hackeru-ai-18173c', 'ai-content'),                     -- היכרות עם AI ויזואלי - מחוללי תמונה
  ('6e330f2d-a301-4098-85b5-90f3d9169b6e'::uuid, 'hackeru-ai-f53503', 'ai-content'),                     -- כלי AI למעצבים
  ('b4a825e9-c434-4d0d-910b-c26e201a932f'::uuid, 'openu-ai-music-sound-067a22', 'ai-content'),           -- יצירת מוזיקה ושירים עם בינה מלאכותית

  -- ===== שיווק דיגיטלי (digital-marketing) =====
  ('5acdb6ce-676a-4b2d-bb10-b52427a77112'::uuid, 'johnbryce-seo-and-social-media-courses-2984e0', 'digital-marketing'), -- קורס שיווק דיגיטלי
  ('0a78a00f-3384-40fb-8f1d-0a4f5137d716'::uuid, 'openu-360-youtube-a70a47', 'digital-marketing'),       -- שיווק דיגיטלי וניהול מדיה חברתית בשילוב AI
  ('08c86c39-0888-4dfb-b959-a25fd784f3e9'::uuid, 'openu-advertising-5-7bc414', 'digital-marketing'),     -- אותו שם, דף אחר
  ('f697add6-d500-4da8-bffa-ac9de91bef80'::uuid, 'svcollege-digital-marketing-course-d36242', 'digital-marketing'), -- שיווק דיגיטלי וניהול סושיאל
  ('f4f4b6c9-1606-490e-87de-8b9e5ead7a71'::uuid, '360-kinneret-ai-marketing-aa19a9', 'digital-marketing'), -- AI Marketing: הסילבוס הוא שיווק דיגיטלי

  -- ===== דאטה (data-analysis) =====
  ('4b265a46-7bd9-497d-b542-281d5839958b'::uuid, 'cont-edu-technion-big-data-analyst-a55fcb', 'data-analysis'), -- Big Data Analyst with GenAI
  ('1e995534-361d-4d7b-9c16-b84c57eb7378'::uuid, 'hackeru-data-analyst-bi-e595bc', 'data-analysis'),     -- דאטה אנליסט ובינה עסקית
  ('efa15f37-be92-4c8e-8505-922d545382f6'::uuid, 'hackeru-data-master-823908', 'data-analysis'),         -- דאטה אנליסט עם התמחות BI
  ('acde8e14-6f58-4959-8a75-1240e125a601'::uuid, 'ipc-bi-data-analyst-course-fca169', 'data-analysis'),  -- דאטה אנליסט ו-BI
  ('bdcb53f7-136b-42e9-9e11-f4743089f4b0'::uuid, 'johnbryce-data-analyst-62f4a0', 'data-analysis'),      -- Data Analyst AI Expert
  ('eeeeeeee-0000-0000-0000-000000000006'::uuid, 'python-data-sample', 'data-analysis'),                 -- ניתוח נתונים עם Python (לדוגמה)

  -- ===== סייבר (cyber) =====
  ('a4aa16a4-f4a8-4e6a-a87e-fe1cff2ec994'::uuid, 'hackeru-course-191276', 'cyber'),                      -- מה הקשר בין סייבר לבינה מלאכותית? (הרצאה)

  -- ===== תכנות (programming), תחום קיים =====
  ('154cd2fa-313e-447a-b0fa-cad1104c8776'::uuid, 'cont-edu-technion-tcnp-net-b7f416', 'programming'),    -- מפתחי תוכנה בסביבת NET.
  ('fe1dc8ba-d95f-4799-9e66-b2d4e284561e'::uuid, 'hackeru-ai-x-developer-35df8b', 'programming')         -- AI X-Developer: מסלול פיתוח למתכנתים
)
-- נשארים ב-ai, ולא כאן (16): 360-kinneret-management-leadership-development-0e52dc, 360-kinneret-health-consulting-ce53ed,
-- 360-kinneret-project-management-bff026 (פעיל), ceu-ono-2-30b477, ceu-ono-course-25f7b9, ceu-ono-dpo-ef0577,
-- cont-edu-technion-data-science-camp-b30046 (לתלמידי תיכון), cont-edu-technion-course-9d631c,
-- cont-edu-technion-course-e74158, hackeru-graphic-design-9d6a4a, hackeru-ux-ui-2fc973,
-- johnbryce-ai-product-design-ux-ui-24cbbb, johnbryce-big-data-ml-no-sql-db-project-management-074db2,
-- johnbryce-fast-track-product-management-c83c80, openu-communication-2-007627, openu-home-design-home-styling-55ad7b.
update public.courses c
set category_id = target.id
from moves m
join public.categories target on target.slug = m.target and target.replaced_by = '{}'
where c.id = m.id
  and c.slug = m.slug
  and c.category_id = (select id from public.categories where slug = 'ai')
returning c.slug, m.target;
