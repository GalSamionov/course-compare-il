-- קורס מקישור שגל מיזג לקורס קיים: הבוגר שחוזר ל-/review/new?course=<הטיוטה> צריך לעבור לקורס שאליו מוזג.
--
-- הבאג (סקירה של PR 2): merge_course_submission מוחקת את הטיוטה, וה-FK עם on delete set null מאפס את
-- course_submissions.course_id. my_course_link חיפשה לפי course_id, עם join לקורס, ולכן לא מצאה כלום,
-- ו-merged_slug לא חזר אף פעם. הבוגר ראה "הקורס לא נמצא" במקום לעבור לקורס הנכון.
--
-- התיקון: draft_course_id שומר את הטיוטה, בלי FK, ולכן לא מתאפס במחיקה. הוא נקבע בכל פעם ש-course_id נקבע
-- (טריגר, כולל שורות קיימות), ו-my_course_link מחפשת לפיו, עם left join לקורס.

alter table public.course_submissions add column draft_course_id uuid;

update public.course_submissions set draft_course_id = course_id where course_id is not null;

create function private.keep_draft_course_id()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.course_id is not null then
    new.draft_course_id := coalesce(new.draft_course_id, new.course_id);
  end if;
  return new;
end $$;

create trigger course_submissions_keep_draft_course_id
before insert or update of course_id on public.course_submissions
for each row execute function private.keep_draft_course_id();

create index course_submissions_draft_course_id on public.course_submissions (draft_course_id)
where draft_course_id is not null;

-- כמו ב-20261116010001, חוץ מהחיפוש: לפי draft_course_id, ו-left join לקורס (שאולי כבר נמחק במיזוג).
-- course_id בתשובה הוא הקורס שהבוגר ביקש, גם אם הטיוטה כבר לא קיימת.
create or replace function my_course_link(p_course_id uuid)
returns jsonb
language sql stable security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'course_id', p_course_id, 'title', s.course_title, 'institution_name', s.institution_name,
    'course_type', case when c.id is not null then private.link_course_type(c.id) end,
    'status', s.status, 'decision_reason', s.decision_reason,
    'live_slug', case when c.status <> 'draft' then c.slug end,
    'merged_slug', (select m.slug from public.courses m where m.id = s.merged_into and m.status <> 'draft'))
  from public.course_submissions s
  left join public.courses c on c.id = s.course_id
  where s.draft_course_id = p_course_id and s.submitted_by = (select auth.uid()) and s.source = 'review'
  order by s.created_at desc
  limit 1;
$$;
