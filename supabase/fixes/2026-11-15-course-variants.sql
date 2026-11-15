-- אופציונלי, אחרי 2026-11-15-series-sessions.sql: עוד דפים שהם אותו קורס, או אירוע שכבר היה.
--
-- רק פריטים ממתינים בתור, ורק קורסים שהם טיוטה. ב-15.11.2026, בשאילתה לקריאה בלבד:
--   * 33 דפים שהם גרסה של קורס: מסלול בוקר או ערב ("קורס קונדיטוריה - ערב"), דף הרשמה ("רישום לסדנת ..."),
--     או עותק ("(העתק)"). רובם אצל אטיליו ואלון שבו.
--     מה קורה: נדחים, והדף נקרא מחדש בריצה הבאה. האוסף מאחד אותם לקורס אחד עם כל המסלולים.
--   * 5 אירועים שכבר היו: שנה שעברה בשם ("חנוכה 2024", "וובינר ינואר 23").
--     מה קורה: נדחים, והדף לא נקרא יותר (כמו דחייה בתור).
--
-- לא כאן:
--   * כפילויות בלי שום סימון בשם: 61 פריטים, ב-29 קבוצות של אותו שם. התור כבר מסמן אותן כ"אותו שם כמו
--     קורס אחר בתור", ואפשר לדחות שם.
--   * "סבתא בישלה - השומרונים - 1 מאי 2024" אצל אטיליו: אירוע מ-2024 שכבר אושר והוא באתר. ההחלטה של גל.
--
-- הרצה, רק באישור של גל: supabase db query --remote -f supabase/fixes/2026-11-15-course-variants.sql
-- בטוח להריץ שוב: בהרצה השנייה אין פריט ממתין שמתאים.

with variants as (
  select q.id as queue_id, q.course_id
  from public.course_change_queue q
  join public.courses c on c.id = q.course_id
  where q.kind = 'new_course' and q.status = 'pending' and c.status = 'draft'
    and (
      c.title ~* '^\s*(רישום|הרשמה)\s+ל'
      or c.title ~* '\s[-–—|,:]\s*(בוקר|ערב|סופ["״''׳]?ש|סוף שבוע|morning|evening|weekend)\s*$'
      or c.title ~* '\((העתק|copy)\)'
    )
),
past_events as (
  select q.id as queue_id, q.page_id
  from public.course_change_queue q
  join public.courses c on c.id = q.course_id
  where q.kind = 'new_course' and q.status = 'pending' and c.status = 'draft'
    and q.id not in (select queue_id from variants)
    and (
      c.title ~ '(^|[^0-9.])[0-9]{1,2}[./][0-9]{1,2}[./]20(1[0-9]|2[0-5])([^0-9]|$)'
      or c.title ~ '(ינואר|פברואר|מרץ|מרס|אפריל|מאי|יוני|יולי|אוגוסט|ספטמבר|אוקטובר|נובמבר|דצמבר)\s*(20)?(1[0-9]|2[0-5])([^0-9]|$)'
      or c.title ~ 'ב?-?20(1[0-9]|2[0-5])\s*$'
    )
),
rejected as (
  update public.course_change_queue q
  set status = 'rejected',
      decided_by = (select a.user_id from public.admins a order by a.added_at limit 1),
      decided_at = now(),
      reasons = array_append(q.reasons, case when q.id in (select queue_id from variants) then 'גרסה של קורס אחר' else 'אירוע שכבר היה' end::text)
  where q.id in (select queue_id from variants union all select queue_id from past_events)
  returning q.id
),
released as (
  update public.scrape_pages p
  set course_id = null, state = 'active', last_hash = null, last_extracted = null, missing_count = 0
  from variants v
  where p.course_id = v.course_id
  returning p.id
),
ignored as (
  update public.scrape_pages p
  set state = 'ignored'
  from past_events e
  where p.id = e.page_id
  returning p.id
),
detached as (
  update public.courses c
  set page_url = null
  from variants v
  where c.id = v.course_id and c.status = 'draft' and c.page_url is not null
  returning c.id
)
select
  (select count(*) from variants) as variants,
  (select count(*) from past_events) as past_events,
  (select count(*) from rejected) as queue_items_rejected,
  (select count(*) from released) as pages_released,
  (select count(*) from ignored) as pages_ignored,
  (select count(*) from detached) as drafts_detached;
