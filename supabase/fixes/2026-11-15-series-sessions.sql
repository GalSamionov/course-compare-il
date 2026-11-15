-- מפגשים של סדרה בתור הקורסים: דחייה, ואיפוס הדפים כדי שהריצה הבאה של האוסף תאחד אותם לקורס אחד.
--
-- רקע: בריצה האמיתית הראשונה (15.11.2026) כל מפגש בסדרת סדנאות נכנס כקורס נפרד, למשל
-- "... | בצק פריך (מפגש 1 מתוך 3) מחזור 7". האוסף מאחד עכשיו מפגשים, מחזורים ומסלולים של אותו קורס
-- (scraper/lamadti_scraper/series.py), אבל רק בדפים שעוד לא מקושרים לקורס. הקובץ הזה מנתק את הדפים האלה.
--
-- מה הוא עושה, רק בקורסים שהם טיוטה (לא נוגע בקורס שבאתר):
--   1. פריט ממתין בתור: נדחה, עם הסיבה "מפגש של סדרה".
--   2. הדף של כל קורס כזה (גם של 12 הקורסים שאושרו והוסתרו): מנותק מהקורס, ונקרא מחדש בריצה הבאה.
--   3. הטיוטה נשארת טיוטה, בלי page_url, כדי שהאוסף לא יקשר אליה את הדף שוב.
--
-- ב-15.11.2026, בשאילתה לקריאה בלבד: 20 קורסים, 8 פריטים ממתינים ו-12 שאושרו והוסתרו. כולם אצל אלון שבו.
--
-- הרצה, רק באישור של גל: supabase db query --remote -f supabase/fixes/2026-11-15-series-sessions.sql
-- בטוח להריץ שוב: בהרצה השנייה אין פריט ממתין לדחות, ואין דף שעוד מקושר לקורסים האלה.
-- אחרי ההרצה: הריצה הבאה של האוסף יוצרת קורס אחד לכל סדרה, עם פריט אחד בתור.

with targets as (
  select q.id as queue_id, q.status, q.course_id
  from public.course_change_queue q
  join public.courses c on c.id = q.course_id
  where q.kind = 'new_course'
    and q.status in ('pending', 'approved')
    and c.status = 'draft'
    and (
      c.title ~* '(מפגש|שיעור|חלק|session|lesson|part)\s*\d{1,2}\s*(מתוך|/|of)\s*\d{1,2}'
      or c.title ~* '(מחזור|cohort)\s*(מס[''׳]\s*)?#?\s*\d{1,3}'
    )
),
rejected as (
  update public.course_change_queue q
  set status = 'rejected',
      decided_by = (select a.user_id from public.admins a order by a.added_at limit 1),
      decided_at = now(),
      -- array_append ולא ||: עם מחרוזת בלי סוג, || מנסה לקרוא אותה כמערך ונכשל.
      reasons = array_append(q.reasons, 'מפגש של סדרה'::text)
  from targets t
  where q.id = t.queue_id and t.status = 'pending'
  returning q.id
),
released as (
  update public.scrape_pages p
  set course_id = null, state = 'active', last_hash = null, last_extracted = null, missing_count = 0
  from targets t
  where p.course_id = t.course_id
  returning p.id
),
detached as (
  update public.courses c
  set page_url = null
  from targets t
  where c.id = t.course_id and c.status = 'draft' and c.page_url is not null
  returning c.id
)
select
  (select count(*) from targets) as courses,
  (select count(*) from rejected) as queue_items_rejected,
  (select count(*) from released) as pages_released,
  (select count(*) from detached) as drafts_detached;
