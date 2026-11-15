-- קריאה ציבורית בלבד. כתיבה נעשית רק בשרת, עם המפתח הסודי.
-- הרשאות כתיבה למשתמשים מחוברים נוספות בתוכנית 2, כל אחת במפורש.

alter table categories enable row level security;
alter table institutions enable row level security;
alter table courses enable row level security;
alter table metrics enable row level security;
alter table reviews enable row level security;
alter table review_answers enable row level security;
alter table vendor_responses enable row level security;
alter table scores enable row level security;
alter table method_changes enable row level security;
alter table lecturers enable row level security;
alter table course_lecturers enable row level security;

create policy "categories are public" on categories for select using (true);
create policy "institutions are public" on institutions for select using (true);
create policy "metrics are public" on metrics for select using (true);
create policy "method changes are public" on method_changes for select using (true);

create policy "non-draft courses are public" on courses
  for select using (status <> 'draft');

create policy "course lecturers of non-draft courses are public" on course_lecturers
  for select using (
    exists (select 1 from courses c where c.id = course_lecturers.course_id and c.status <> 'draft')
  );

create policy "lecturers of non-draft courses are public" on lecturers
  for select using (
    exists (
      select 1
      from course_lecturers cl
      join courses c on c.id = cl.course_id
      where cl.lecturer_id = lecturers.id and c.status <> 'draft'
    )
  );

create policy "scores of non-draft courses are public" on scores
  for select using (
    exists (select 1 from courses c where c.id = scores.course_id and c.status <> 'draft')
  );

create policy "published reviews of non-draft courses are public" on reviews
  for select using (
    status = 'published'
    and exists (select 1 from courses c where c.id = reviews.course_id and c.status <> 'draft')
  );

create policy "responses to published reviews are public" on vendor_responses
  for select using (
    exists (select 1 from reviews r where r.id = vendor_responses.review_id and r.status = 'published')
  );

-- review_answers: אין מדיניות קריאה. התשובות של כל ביקורת לא ציבוריות,
-- והעמוד מציג רק את הממוצעים שבטבלת הציונים.

create function forbid_change() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception '% rows are append-only', tg_table_name;
end $$;

create trigger scores_append_only before update or delete on scores
  for each row execute function forbid_change();
create trigger scores_no_truncate before truncate on scores
  for each statement execute function forbid_change();
create trigger method_changes_append_only before update or delete on method_changes
  for each row execute function forbid_change();
create trigger method_changes_no_truncate before truncate on method_changes
  for each statement execute function forbid_change();

-- בתוכנית 1 אין כתיבה ציבורית בכלל.
revoke insert, update, delete, truncate, references, trigger on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

-- טבלאות, רצפים ופונקציות שייווצרו בעתיד לא נפתחים לציבור מעצמם. כל הרשאה ניתנת במפורש.
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke execute on functions from anon, authenticated;
alter default privileges for role postgres revoke execute on functions from public;

-- תשובות לשאלון של כל ביקורת: לא ציבוריות.
revoke select on review_answers from anon, authenticated;

-- ביקורות: רק העמודות הציבוריות.
-- author_id, proof_kind, paid_bucket_ils, verified_at ו-excluded_reason לא נחשפים.
revoke select on reviews from anon, authenticated;
grant select (id, course_id, cohort_month, body, display_name, display_mode, status, published_at, follow_up_text)
  on reviews to anon, authenticated;

-- מוסדות: בלי מספר עוסק. אצל עוסק יחיד זה מספר תעודת הזהות שלו.
revoke select on institutions from anon, authenticated;
grant select (id, slug, name, website, kind, created_at) on institutions to anon, authenticated;

-- טווח מה ששולם בפועל: רק מחשבוניות, רק בקורס שאינו טיוטה, ורק כשיש לפחות 3,
-- כדי שאי אפשר יהיה לזהות סכום של אדם אחד.
create function course_paid_range(p_course_id uuid)
returns table (min_ils integer, max_ils integer, invoice_count integer)
language sql stable security definer
set search_path = ''
as $$
  select min(r.paid_bucket_ils), max(r.paid_bucket_ils) + 500, count(*)::integer
  from public.reviews r
  join public.courses c on c.id = r.course_id and c.status <> 'draft'
  where r.course_id = p_course_id
    and r.status = 'published'
    and r.proof_kind = 'invoice'
    and r.paid_bucket_ils is not null
  having count(*) >= 3;
$$;
revoke execute on function course_paid_range(uuid) from public;
grant execute on function course_paid_range(uuid) to anon, authenticated;
