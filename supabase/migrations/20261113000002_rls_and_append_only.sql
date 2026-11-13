-- קריאה ציבורית בלבד. כתיבה נעשית רק בשרת, עם המפתח הסודי.
-- הרשאות כתיבה למשתמשים מחוברים נוספות בתוכנית 2.

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
create policy "lecturers are public" on lecturers for select using (true);
create policy "lecturers of non-draft courses are public" on course_lecturers
  for select using (
    exists (select 1 from courses c where c.id = course_id and c.status <> 'draft')
  );
create policy "institutions are public" on institutions for select using (true);
create policy "metrics are public" on metrics for select using (true);
create policy "scores are public" on scores for select using (true);
create policy "method changes are public" on method_changes for select using (true);

create policy "non-draft courses are public" on courses
  for select using (status <> 'draft');

create policy "published reviews are public" on reviews
  for select using (status = 'published');

create policy "answers of published reviews are public" on review_answers
  for select using (
    exists (select 1 from reviews r where r.id = review_id and r.status = 'published')
  );

create policy "responses to published reviews are public" on vendor_responses
  for select using (
    exists (select 1 from reviews r where r.id = review_id and r.status = 'published')
  );

create function forbid_change() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception '% rows are append-only', tg_table_name;
end $$;

create trigger scores_append_only before update or delete on scores
  for each row execute function forbid_change();
create trigger method_changes_append_only before update or delete on method_changes
  for each row execute function forbid_change();

-- בתוכנית 1 אין כתיבה ציבורית בכלל. תוכנית 2 תפתח רק את מה שצריך.
revoke insert, update, delete on all tables in schema public from anon, authenticated;

-- ביקורות: רק העמודות הציבוריות.
-- author_id, proof_kind, paid_bucket_ils, verified_at ו-excluded_reason לא נחשפים.
revoke select on reviews from anon, authenticated;
grant select (id, course_id, cohort_month, body, display_name, display_mode, status, published_at, follow_up_text)
  on reviews to anon, authenticated;

-- טווח מה ששולם בפועל, רק כשיש לפחות 3 חשבוניות, כדי שאי אפשר יהיה לזהות סכום של אדם אחד.
create function course_paid_range(p_course_id uuid)
returns table (min_ils integer, max_ils integer, invoice_count integer)
language sql stable security definer
set search_path = ''
as $$
  select min(r.paid_bucket_ils), max(r.paid_bucket_ils) + 500, count(*)::integer
  from public.reviews r
  where r.course_id = p_course_id and r.status = 'published' and r.paid_bucket_ils is not null
  having count(*) >= 3;
$$;
revoke execute on function course_paid_range(uuid) from public;
grant execute on function course_paid_range(uuid) to anon, authenticated;
