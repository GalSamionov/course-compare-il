-- הסתרת נתוני הדוגמה באתר, לפני שהאתר עולה לציבור ולגוגל. הסשן: docs/sessions/2026-11-16-launch-prep.md.
--
-- מה מוסתר: רק השורות של קבצי ה-seed (supabase/seed.sql ו-seed-2a.sql), לפי המזהים הקבועים שלהן:
--   * 15 קורסים (eeeeeeee-0000-0000-0000-000000000001 עד 015, כל ה-slug-ים נגמרים ב-"-sample") -> טיוטה.
--   * 6 מוסדות (dddddddd-0000-0000-0000-000000000001 עד 006, "... לדוגמה") -> טיוטה.
-- מה מוסתר בלי לגעת בו, כי המסד כבר מסתיר אותו כשהקורס טיוטה (20261113000002_rls_and_append_only.sql):
--   * 70 הביקורות (bbbbbbbb-...), התשובות לשאלון ותגובת המוסד: רק ביקורת של קורס שאינו טיוטה ציבורית
--     (private.is_review_public), וגם הטווח "שילמו בפועל" (course_paid_range).
--   * הציונים (scores): רק של קורס שאינו טיוטה. גם "המובילים לפי בוגרים" ו"סיימתם קורס?" נבנים מהקטלוג.
--   * 4 המרצים (ffffffff-...): מרצה ציבורי רק כשהוא מלמד בקורס שאינו טיוטה.
-- מה לא משתנה:
--   * התחומים (cccccccc-...): הם מה-seed, אבל קורסים אמיתיים כבר משויכים אליהם.
--   * השאלון (metrics) והיומן של השיטה (method_changes).
--   * שום שורה לא נמחקת. כל שינוי סטטוס של קורס נרשם ב-course_changes, ואפשר לבטל אותו.
--
-- בדיקה לקריאה בלבד בענן, 16.11.2026: 69 קורסים פעילים, מהם 15 של ה-seed. 72 מוסדות, מהם 6 של ה-seed.
-- כל 70 הביקורות שפורסמו הן של ה-seed, ואין ביקורת אמיתית. אין קורס אמיתי במוסד לדוגמה, ואין מרצה לדוגמה
-- בקורס אמיתי. אחרי ההסתרה התחום "תכנות" נשאר בלי קורסים (העמוד שלו מציג מצב ריק, בלי noindex למנועי חיפוש).
--
-- הרצה, רק באישור של גל, ולפני (או יחד עם) הפריסה שמורידה את ה-noindex:
--   pnpm exec supabase db query --remote -f supabase/fixes/2026-11-16-hide-sample-data.sql
-- הכול בטרנזקציה אחת. בדיקה שנכשלת (בהתחלה או בסוף) עוצרת את הכול, ושום דבר לא נשמר.
-- בטוח להריץ שוב: בהרצה השנייה אין קורס או מוסד לעדכן.
--
-- אחרי ההרצה:
--   1. בדיקה לקריאה בלבד (צריך לצאת 0 בכל העמודות):
--      pnpm exec supabase db query --remote --read-only "set local role anon; select
--        (select count(id) from courses where id::text like 'eeeeeeee-%') as courses,
--        (select count(id) from institutions where id::text like 'dddddddd-%') as institutions,
--        (select count(id) from reviews where course_id::text like 'eeeeeeee-%') as reviews,
--        (select count(id) from scores where course_id::text like 'eeeeeeee-%') as scores,
--        (select count(id) from lecturers where id::text like 'ffffffff-%') as lecturers"
--   2. הציונים מחדש, ורענון של הקטלוג ושל עמודי הקורסים באתר. אי אפשר ב-SQL: החישוב ב-TypeScript
--      (web/src/lib/score/recompute.ts). הדרך הקצרה היא החישוב הלילי, שרץ גם בהפעלה ידנית:
--        gh workflow run scores-nightly.yml --ref main
--      או מקומית, עם הכתובת והמפתח הסודי של הענן (לא מ-.env.local, שמצביע על המסד בפיי):
--        NEXT_PUBLIC_SUPABASE_URL=<כתובת הענן> SUPABASE_SECRET_KEY=<המפתח> \
--        REVALIDATE_URL=https://course-compare-il.vercel.app REVALIDATE_TOKEN=<הטוקן> pnpm --dir web score:recompute
--      לקורסים אמיתיים זה לא משנה מספר (לאף אחד מהם אין ביקורת), אבל ממוצע התחום כבר לא כולל ביקורות דוגמה.
--   3. העמודים של 15 קורסי הדוגמה במטמון: החישוב מרענן רק קורסים שאינם טיוטה. בלי רענון הם מחזירים 404
--      תוך שעה לבד (cacheLife('hours')), או מיד אחרי פריסה חדשה. רענון מיידי:
--        curl -X POST https://course-compare-il.vercel.app/api/revalidate \
--          -H "Authorization: Bearer $REVALIDATE_TOKEN" -H 'content-type: application/json' \
--          -d '{"courses":["full-stack-sample","ai-tools-sample","home-cooking-sample","web-basics-sample","react-frontend-sample","python-data-sample","ai-weekend-sample","baking-sample","italian-sample","photo-basics-sample","phone-photo-sample","psycho-full-sample","psycho-online-sample","bookkeeping-1-sample","bookkeeping-2-sample"]}'
--
-- לחזור אחורה: אותם שני update-ים עם 'active' במקום 'draft' (המוסדות), ו-undo_course_change על כל שורה
-- שנרשמה כאן ב-course_changes (הקורסים).
--
-- המסד המקומי (בפיי) וה-seed לא משתנים: בדיקות הקצה נשענות על נתוני הדוגמה.

begin;

create temporary table sample_courses (id uuid primary key) on commit drop;
insert into sample_courses
select ('eeeeeeee-0000-0000-0000-' || lpad(g::text, 12, '0'))::uuid from generate_series(1, 15) g;

create temporary table sample_institutions (id uuid primary key) on commit drop;
insert into sample_institutions
select ('dddddddd-0000-0000-0000-' || lpad(g::text, 12, '0'))::uuid from generate_series(1, 6) g;

-- ===== 1. לפני: עוצרים אם משהו לא כמו שבדקנו =====
do $$
declare
  n integer;
  list text;
begin
  -- קורס ציבורי שנראה כמו דוגמה, אבל אין לו מזהה של seed: הוא היה נשאר באתר. לא נוגעים, וגל מחליט.
  -- טיוטות לא נבדקות: הציבור לא רואה אותן ממילא (במסד בפיי יש טיוטות כאלה מבדיקות הקצה).
  select count(*), string_agg(c.slug, ', ') into n, list
  from public.courses c
  left join public.institutions i on i.id = c.institution_id
  where c.id not in (select id from sample_courses) and c.status <> 'draft'
    and (c.slug like '%-sample' or c.title like '%לדוגמה%' or i.id in (select id from sample_institutions)
         or c.page_url ~ '^https?://(www\.)?example\.(com|org|net)(/|$)');
  if n > 0 then
    raise exception 'courses that look like sample data but are not seed rows: %', list;
  end if;

  -- מוסד ציבורי שנראה כמו דוגמה, בלי מזהה של seed.
  select count(*), string_agg(i.slug, ', ') into n, list
  from public.institutions i
  where i.id not in (select id from sample_institutions) and i.status = 'active'
    and (i.slug like 'sample-%' or i.name like '%לדוגמה%' or i.website ~ '^https?://(www\.)?example\.(com|org|net)(/|$)');
  if n > 0 then
    raise exception 'institutions that look like sample data but are not seed rows: %', list;
  end if;

  -- מרצה לדוגמה שמלמד בקורס אמיתי היה נשאר ציבורי.
  select count(*), string_agg(c.slug, ', ') into n, list
  from public.course_lecturers cl
  join public.courses c on c.id = cl.course_id
  where cl.lecturer_id::text like 'ffffffff-%' and c.id not in (select id from sample_courses);
  if n > 0 then
    raise exception 'sample lecturers teach real courses: %', list;
  end if;

  -- ביקורת של בוגר אמיתי (עם כותב) על קורס לדוגמה הייתה נעלמת בלי שאיש החליט על זה.
  select count(*) into n
  from public.reviews r
  where r.course_id in (select id from sample_courses) and r.author_id is not null;
  if n > 0 then
    raise exception '% review(s) by real users on sample courses', n;
  end if;

  -- קורס מקישור שמוזג לקורס לדוגמה.
  select count(*) into n
  from public.course_submissions s
  where s.merged_into in (select id from sample_courses) or s.course_id in (select id from sample_courses);
  if n > 0 then
    raise exception '% course submission(s) point at sample courses', n;
  end if;

  if not exists (select 1 from public.admins) then
    raise exception 'no admin to sign the course_changes rows';
  end if;
end $$;

-- ===== 2. הקורסים: טיוטה, וכל שינוי ביומן =====
with before as (
  select c.id, c.status::text as old_status
  from public.courses c
  where c.id in (select id from sample_courses) and c.status <> 'draft'
),
hidden as (
  update public.courses c
  set status = 'draft'
  from before b
  where c.id = b.id
  returning c.id, b.old_status
)
insert into public.course_changes (course_id, field, old_value, new_value, source, approved_by)
select h.id, 'status', to_jsonb(h.old_status), '"draft"'::jsonb, 'approved',
       (select a.user_id from public.admins a order by a.added_at limit 1)
from hidden h;

-- ===== 3. המוסדות: טיוטה (20261116010001_course_links.sql: מוסד ציבורי רק כשהוא active) =====
update public.institutions
set status = 'draft'
where id in (select id from sample_institutions) and status <> 'draft';

-- ===== 4. אחרי: מה שמבקר בלי התחברות רואה, באותה טרנזקציה =====
set local role anon;
do $$
declare
  visible text;
begin
  select concat_ws(', ',
    nullif(format('courses %s', (select count(id) from public.courses where id::text like 'eeeeeeee-%')), 'courses 0'),
    nullif(format('institutions %s', (select count(id) from public.institutions where id::text like 'dddddddd-%')), 'institutions 0'),
    nullif(format('reviews %s', (select count(id) from public.reviews where course_id::text like 'eeeeeeee-%')), 'reviews 0'),
    nullif(format('scores %s', (select count(id) from public.scores where course_id::text like 'eeeeeeee-%')), 'scores 0'),
    nullif(format('lecturers %s', (select count(id) from public.lecturers where id::text like 'ffffffff-%')), 'lecturers 0'),
    nullif(format('course_lecturers %s', (select count(*) from public.course_lecturers where course_id::text like 'eeeeeeee-%')), 'course_lecturers 0')
  ) into visible;
  if visible <> '' then
    raise exception 'still visible to the public after hiding: %', visible;
  end if;
end $$;
reset role;

commit;
