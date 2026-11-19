-- שלב 3 של "לא יודעים למי לפנות?": הנתונים. מסמך העיצוב: docs/superpowers/specs/2026-11-17-who-to-turn-to-design.md, "שלב 3".
-- התוכנית: docs/superpowers/plans/2026-11-19-stage-3-data.md.

-- ===== 1. העיר של המוסד =====
-- כשהקורס לא כותב איפה הוא, ואינו אונליין, "העובדות" מראות את העיר של המוסד, עם "לפי כתובת המוסד"
-- (web/src/lib/course/facts.ts). הערכים, כמו ב-courses.region:
--   * עיר אחת בעברית, למשל 'תל אביב';
--   * 'אונליין': מוסד שמלמד רק אונליין. אז כתוב "לפי המוסד";
--   * null: למוסד כמה סניפים, או שלא מצאנו כתובת.
-- המקורות: supabase/fixes/2026-11-19-institution-cities.sql (המחקר מ-19.11.2026), ומוסד חדש מקבל אותה
-- מ-scraper/institutions.yaml כשהאוסף יוצר אותו.
alter table institutions
  add column city text
  check (city is null or (city = btrim(city) and char_length(city) between 2 and 40));

-- institutions פתוחה לציבור רק בעמודות שנפתחו במפורש (20261113000002_rls_and_append_only.sql).
grant select (city) on institutions to anon, authenticated;

-- ===== 2. מספר המפגשים =====
-- "8 מפגשים", "91 מפגשים": כשהדף כותב כמה מפגשים יש בקורס כולו. null: לא כתוב.
-- courses קריאה לציבור ברמת הטבלה (רק קורסים שאינם טיוטה), ולכן גם העמודה הזו.
alter table courses
  add column session_count integer check (session_count between 1 and 1000);

-- ===== 3. המתכונות שהאתר מכיר =====
-- עד עכשיו לא הייתה בדיקה, והאתר זרק בשקט ערך שהוא לא מכיר (web/src/lib/search/types.ts, COURSE_FORMATS).
-- אותה רשימה כאן ושם. לפני העלייה לענן בודקים שאין שם ערך אחר (התוכנית, "צעדים בענן").
alter table courses
  add constraint courses_formats_known
  check (formats <@ array['online', 'in_person', 'hybrid', 'recorded']::text[]);

-- ===== 4. האוסף כותב גם את מספר המפגשים =====
-- אותה פונקציה מ-20261114200001_course_scraper.sql, עם session_count ברשימה הסגורה.
-- הרשימה חייבת להתאים ל-FIELDS ב-scraper/lamadti_scraper/fields.py. ההרשאות נשמרות ב-create or replace.
create or replace function private.scraper_set_course_field(p_course_id uuid, p_field text, p_value jsonb)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if p_field is null or p_field not in (
    'title', 'site_price_ils', 'total_hours', 'lecture_hours', 'hands_on_hours', 'duration_months', 'session_count',
    'schedule', 'formats', 'region', 'time_slots', 'next_cohort_date', 'syllabus', 'admission', 'class_size_note',
    'certificate', 'institution_promises', 'video_url'
  ) then
    raise exception 'field % is not writable by the scraper', p_field using errcode = '42501';
  end if;
  execute format(
    'update public.courses c set %1$I = (jsonb_populate_record(null::public.courses, $1)).%1$I where c.id = $2',
    p_field
  ) using jsonb_build_object(p_field, coalesce(p_value, 'null'::jsonb)), p_course_id;
end $$;
