-- התחומים החדשים, לפי ההחלטה של גל ב-16.11.2026.
--
-- 1. "בינה מלאכותית" (ai) מתחלק לארבעה תחומים אחים תחת "טכנולוגיה". לא רמה שלישית: הקטלוג, הסינון בחיפוש,
--    "הכי הרבה בוגרים" ופירורי הלחם מניחים תחום ותחום-אב בלבד (פירוט ב-docs/sessions/2026-11-16-new-categories.md).
--    ai לא נמחק: קורסים בענן עוד מצביעים עליו עד supabase/fixes/2026-11-16-recategorize-ai.sql, וקישורים ישנים
--    (/categories/ai, ?cat=ai) עוברים לתחומים שב-replaced_by.
-- 2. חדשים: שיווק דיגיטלי, דאטה, סייבר, ויופי וטיפוח עם תחום אחד, "ציפורניים ולק ג׳ל" (פיילוט).
-- 3. לכל תחום תיאור קצר, לאתר ולאוסף (המודל בוחר תחום לפי השם והתיאור).
--
-- למה כל העץ כאן, גם התחומים הקיימים: במסד חדש (pnpm db:reset, ה-CI) המיגרציות רצות לפני seed.sql, ואז
-- "טכנולוגיה" עוד לא קיים כשצריך לתלות תחתיו את התחומים החדשים. לכן התחומים הקיימים נוצרים כאן עם המזהים
-- שכבר יש להם בענן (מ-seed.sql, נבדק ב-16.11.2026), ו-seed.sql מדלג עליהם (on conflict do nothing).
-- בענן הם כבר קיימים, ושם רק נוסף להם תיאור.

alter table public.categories
  add column description text
    check (description is null or char_length(description) between 10 and 160),
  -- תחום שיצא משימוש: התחומים שהחליפו אותו, לפי slug. ריק: התחום פעיל.
  add column replaced_by text[] not null default '{}'
    check (not (slug = any (replaced_by)));

comment on column public.categories.description is
  'תיאור קצר בעברית, בלי שפה שיווקית. באתר מתחת לשם, ולאוסף כדי לבחור תחום לקורס.';
comment on column public.categories.replaced_by is
  'תחום שיצא משימוש: ה-slug של התחומים שהחליפו אותו. לא מופיע ברשימות, וקישורים אליו עוברים אליהם. ריק: פעיל.';

-- 1. תחומים בלי אב. הקיימים עם המזהים שלהם בענן, והחדשים עם מזהה חדש.
insert into public.categories (id, slug, name, parent_id, course_type) values
  ('cccccccc-0000-0000-0000-000000000001', 'technology', 'טכנולוגיה', null, 'career'),
  ('cccccccc-0000-0000-0000-000000000004', 'cooking', 'בישול', null, 'hobby'),
  ('cccccccc-0000-0000-0000-000000000005', 'psychometric', 'פסיכומטרי', null, 'exam'),
  ('cccccccc-0000-0000-0000-000000000006', 'photography', 'צילום', null, 'hobby'),
  ('cccccccc-0000-0000-0000-000000000007', 'bookkeeping', 'הנהלת חשבונות', null, 'exam'),
  (gen_random_uuid(), 'digital-marketing', 'שיווק דיגיטלי', null, 'career'),
  (gen_random_uuid(), 'beauty', 'יופי וטיפוח', null, 'career')
on conflict do nothing;

-- 2. תחומי משנה. האב לפי slug, כי בענן הוא כבר קיים.
insert into public.categories (id, slug, name, parent_id, course_type)
select t.id, t.slug, t.name, p.id, t.course_type::public.course_type
from (values
  ('cccccccc-0000-0000-0000-000000000002'::uuid, 'programming', 'תכנות', 'technology', 'career'),
  ('cccccccc-0000-0000-0000-000000000003'::uuid, 'ai', 'בינה מלאכותית', 'technology', 'career'),
  (gen_random_uuid(), 'ai-at-work', 'AI בעבודה ולפי מקצוע', 'technology', 'career'),
  (gen_random_uuid(), 'ai-automation', 'אוטומציות וסוכני AI', 'technology', 'career'),
  (gen_random_uuid(), 'ai-no-code', 'בניית אפליקציות בלי קוד', 'technology', 'career'),
  (gen_random_uuid(), 'ai-content', 'AI ליצירת תוכן ווידאו', 'technology', 'career'),
  (gen_random_uuid(), 'data-analysis', 'דאטה', 'technology', 'career'),
  (gen_random_uuid(), 'cyber', 'סייבר', 'technology', 'career'),
  (gen_random_uuid(), 'nails', 'ציפורניים ולק ג׳ל', 'beauty', 'career')
) as t (id, slug, name, parent_slug, course_type)
join public.categories p on p.slug = t.parent_slug
on conflict do nothing;

-- 3. התיאורים. גם לתחומים הקיימים, כדי שכל פתק ברשימה ייראה אותו דבר.
update public.categories c
set description = d.description
from (values
  ('technology', 'מקצועות ההייטק: תכנות, דאטה, סייבר ועבודה עם כלי AI.'),
  ('programming', 'לכתוב קוד: אתרים, אפליקציות ותוכנה, מהבסיס ועד Full Stack.'),
  ('ai', 'התחום הישן של AI. מ-16.11.2026 הוא מחולק לארבעה תחומים, ב-replaced_by.'),
  ('ai-at-work', 'להשתמש בכלים כמו ChatGPT בעבודה, או בכלי AI של מקצוע מסוים: ניהול, הוראה, הנדסה.'),
  ('ai-automation', 'לבנות תהליכים שרצים לבד וסוכני AI, בכלים כמו n8n ו-Make.'),
  ('ai-no-code', 'לבנות אתר או אפליקציה בעזרת AI, בלי לכתוב קוד בעצמכם: Lovable, Base44, Cursor.'),
  ('ai-content', 'ליצור טקסט, תמונות, מוזיקה ווידאו בכלי AI.'),
  ('data-analysis', 'לנתח נתונים ולהציג אותם: Excel, SQL, Python ו-Power BI.'),
  ('cyber', 'אבטחת מידע והגנת סייבר: רשתות, SOC ובדיקות חדירה.'),
  ('digital-marketing', 'שיווק ופרסום ברשת: קמפיינים ממומנים, רשתות חברתיות ו-SEO.'),
  ('beauty', 'הכשרות למקצועות היופי והטיפוח.'),
  ('nails', 'הכשרה מקצועית למניקור, לק ג׳ל ובניית ציפורניים.'),
  ('cooking', 'בישול ואפייה, לבית או למטבח מקצועי, כולל קונדיטוריה.'),
  ('psychometric', 'הכנה למבחן הפסיכומטרי, בכיתה או אונליין.'),
  ('photography', 'צילום ועריכת תמונות, ממצלמה ראשונה ועד עבודה מקצועית.'),
  ('bookkeeping', 'הנהלת חשבונות ושכר, כולל הכנה למבחנים של סוג 1, 2 ו-3.')
) as d (slug, description)
where c.slug = d.slug;

-- 4. ai יוצא משימוש. הקורסים שבו עוברים בקובץ התיקון, לא כאן: בענן זה מידע, לא מבנה.
update public.categories
set replaced_by = '{ai-at-work,ai-automation,ai-no-code,ai-content}'
where slug = 'ai';
