-- סבב 3: ביקורות מאומתות.
-- כותב שומר טיוטה בעצמו (RLS והרשאות לעמודות), והשרת עם המפתח הסודי מעביר אותה בין המצבים.
-- הוכחות, "עזר לי", מנהלים ויומן הפעולות: טבלאות בלי שום הרשאה ציבורית. מה שהציבור צריך עובר בפונקציות.
-- מסמך העיצוב: docs/superpowers/specs/2026-11-14-round-3-verified-reviews-design.md, סעיף 7.

-- ===== 1. reviews: עמודות חדשות, ואילוצים שמתאימים לטיוטה =====

create type author_title as enum ('graduate_m', 'graduate_f', 'none');

alter table reviews
  add column finished_month date
    check (finished_month is null or finished_month = date_trunc('month', finished_month)::date),
  -- "בוגר", "בוגרת" או בלי. מוצג ליד השם בפתק.
  add column author_title author_title not null default 'none',
  add column updated_at timestamptz not null default now(),
  -- מתי נשלחה לבדיקה. התור מסודר לפיה, ו"יותר משלוש ביקורות לאותו קורס ביממה" נספר לפיה.
  add column submitted_at timestamptz,
  -- ביקורת במחלוקת נשארת "פורסם" (notes-for-plan-2.md). מסלול הדיווחים בסבב 5.
  add column disputed_at timestamptz,
  -- ההודעה של גל לכותב, כשהביקורת חוזרת לטיוטה.
  add column decision_note text check (decision_note is null or char_length(decision_note) <= 1000),
  -- רק הכותב רואה, ב"הביקורות שלי".
  add column read_count integer not null default 0 check (read_count >= 0),
  -- גלוי לכולם, על הכפתור "עזר לי". לא משפיע על הסדר.
  add column helpful_count integer not null default 0 check (helpful_count >= 0),
  add constraint reviews_finished_after_start check (finished_month is null or finished_month >= cohort_month);

-- טיוטה נשמרת בכל מעבר צעד, ולכן הגוף והשם יכולים להיות ריקים בה. ביקורת שנשלחה עומדת באורך המלא.
alter table reviews drop constraint reviews_body_check;
alter table reviews
  alter column body set default '',
  alter column display_name set default '',
  add constraint reviews_body_length check (
    char_length(body) <= 2000 and (status = 'draft' or char_length(body) >= 80)
  ),
  add constraint reviews_display_name_length check (
    char_length(display_name) <= 60 and (status = 'draft' or char_length(btrim(display_name)) >= 1)
  );

-- updated_at משתנה רק כשהתוכן או המצב משתנים. "עזר לי" וספירת קריאות לא נחשבים שינוי.
create trigger reviews_updated_at
  before update of course_id, cohort_month, finished_month, body, display_name, display_mode, author_title, status
  on reviews for each row execute function set_updated_at();

-- הערה מ-notes-for-plan-2.md: גם לתגובת מוסד.
alter table vendor_responses add column updated_at timestamptz not null default now();
create trigger vendor_responses_updated_at before update on vendor_responses
  for each row execute function set_updated_at();

-- ===== 2. סכמה פרטית לפונקציות עזר של המדיניות =====
-- PostgREST חושף רק את public (supabase/config.toml, [api] schemas). פונקציה כאן אי אפשר לקרוא מבחוץ.

create schema private;
grant usage on schema private to anon, authenticated;

-- האם ביקורת ציבורית. מדיניות שקוראת את reviews בהרשאות של המשתמש הייתה נשברת אם עמודה תיחסם.
create function private.is_review_public(p_review_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.reviews r
    join public.courses c on c.id = r.course_id
    where r.id = p_review_id and r.status = 'published' and c.status <> 'draft'
  );
$$;
grant execute on function private.is_review_public(uuid) to anon, authenticated;

-- האם הביקורת היא טיוטה של המשתמש המחובר. author_id לא פתוח לקריאה, ולכן בפונקציה.
create function private.is_own_draft(p_review_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.reviews r
    where r.id = p_review_id and r.author_id = (select auth.uid()) and r.status = 'draft'
  );
$$;
grant execute on function private.is_own_draft(uuid) to authenticated;

drop policy "responses to published reviews are public" on vendor_responses;
create policy "responses to published reviews are public" on vendor_responses
  for select using (private.is_review_public(review_id));

-- ===== 3. כותב: טיוטה משלו, רק בעמודות בטוחות =====
-- RLS לא משווה שורה ישנה לחדשה. לכן הכותב מקבל הרשאה רק לעמודות שמותר לו לשנות,
-- ו-status, verified_at, proof_kind, paid_bucket_ils, published_at ו-excluded_reason לא ביניהן.

create policy "authors read their own reviews" on reviews
  for select to authenticated using (author_id = (select auth.uid()));
create policy "authors start drafts" on reviews
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and status = 'draft'
    and exists (select 1 from courses c where c.id = course_id and c.status <> 'draft')
  );
create policy "authors change their own drafts" on reviews
  for update to authenticated
  using (author_id = (select auth.uid()) and status = 'draft')
  with check (author_id = (select auth.uid()) and status = 'draft');

grant insert (course_id, author_id, cohort_month, finished_month, body, display_name, display_mode, author_title)
  on reviews to authenticated;
grant update (cohort_month, finished_month, body, display_name, display_mode, author_title)
  on reviews to authenticated;
-- author_title ו-helpful_count מוצגים בפתק, ולכן ציבוריים. read_count, decision_note, finished_month
-- ושאר העמודות החדשות לא: הכותב קורא אותן דרך my_reviews().
grant select (author_title, helpful_count) on reviews to anon, authenticated;

-- תשובות לשאלון: הכותב קורא וכותב רק בטיוטה שלו. לציבור אין כלום, כמו קודם.
create policy "authors read answers of their drafts" on review_answers
  for select to authenticated using (private.is_own_draft(review_id));
create policy "authors answer in their drafts" on review_answers
  for insert to authenticated with check (private.is_own_draft(review_id));
create policy "authors change answers in their drafts" on review_answers
  for update to authenticated
  using (private.is_own_draft(review_id))
  with check (private.is_own_draft(review_id));
create policy "authors remove answers from their drafts" on review_answers
  for delete to authenticated using (private.is_own_draft(review_id));
-- upsert של PostgREST כותב את כל העמודות שבבקשה גם ב-ON CONFLICT DO UPDATE, ולכן update על שלושתן.
grant select (review_id, metric_key, value), insert (review_id, metric_key, value),
  update (review_id, metric_key, value) on review_answers to authenticated;
grant delete on review_answers to authenticated;

-- שאלת כן או לא נשמרת רק כ-1 (לא) או כ-5 (כן). ככה הציון מחשב אותה (score/compute.ts).
create function check_answer_scale() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.value not in (1, 5)
     and exists (select 1 from public.metrics m where m.key = new.metric_key and m.scale = 'yes_no') then
    raise exception 'yes/no answers are stored as 1 or 5' using errcode = '23514';
  end if;
  return new;
end $$;
create trigger review_answers_scale before insert or update on review_answers
  for each row execute function check_answer_scale();

-- ===== 4. הוכחות: רק השרת =====

create type proof_status as enum ('pending', 'approved', 'rejected', 'more_requested');

create table proofs (
  id uuid primary key default gen_random_uuid(),
  -- on delete set null: הטביעה נשארת גם אחרי שהביקורת נמחקה, כדי לזהות את אותו קובץ בפעם הבאה.
  review_id uuid references reviews(id) on delete set null,
  author_id uuid references auth.users(id) on delete set null,
  -- '<author>/<review>/<file>'. מתרוקן כשהקובץ נמחק מהאחסון.
  storage_path text unique,
  -- SHA-256 בהקסה. בלי אילוץ ייחודיות: שגיאת כפילות הייתה מגלה לכותב שמישהו אחר העלה את אותה חשבונית.
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  claimed_kind proof_kind not null,
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'application/pdf')),
  size_bytes integer not null check (size_bytes between 1 and 10485760),
  status proof_status not null default 'pending',
  -- הבדיקה של מודל השפה: checked, not_checked (אין מפתח, או קובץ שלא נשלח לבדיקה) או failed.
  check_status text not null check (check_status in ('checked', 'not_checked', 'failed')),
  -- מה המודל קרא מהקובץ, ואי-ההתאמות. מתרוקן בהחלטה: נשארים רק הטביעה, הסוג וההחלטה.
  check_result jsonb,
  -- duplicate, duplicate_same_review, busy_course (יותר משלוש ביקורות לקורס ביממה).
  flags text[] not null default '{}',
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  file_deleted_at timestamptz,
  check (storage_path is null or file_deleted_at is null)
);
create index proofs_sha256_idx on proofs (sha256);
create index proofs_review_idx on proofs (review_id);
create index proofs_author_created_idx on proofs (author_id, created_at);
alter table proofs enable row level security;
-- אין מדיניות ואין הרשאה: anon ו-authenticated לא רואים כלום. רק service_role, שעוקף RLS.

-- ===== 5. "עזר לי": מזהה מגובב של הדפדפן =====

create table review_helpful (
  review_id uuid not null references reviews(id) on delete cascade,
  browser_hash text not null check (browser_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  primary key (review_id, browser_hash)
);
alter table review_helpful enable row level security;

-- ===== 6. מנהלים ויומן הפעולות =====

create table admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  added_at timestamptz not null default now()
);
alter table admins enable row level security;

-- בלי מפתח זר ל-auth.users: on delete set null היה מעדכן שורה, והיומן לא מתעדכן.
create table audit_log (
  id bigint generated always as identity primary key,
  -- null: הניקוי האוטומטי.
  actor_id uuid,
  action text not null check (action in ('approve', 'reject', 'request_more', 'author_delete', 'cleanup_delete')),
  review_id uuid not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table audit_log enable row level security;
create trigger audit_log_append_only before update or delete on audit_log
  for each row execute function forbid_change();
create trigger audit_log_no_truncate before truncate on audit_log
  for each statement execute function forbid_change();

-- ===== 7. פונקציות שהדפדפן קורא (RPC) =====
-- כל אחת מסננת לפי auth.uid() או בודקת את הקלט בעצמה, וניתנת רק לתפקידים שצריכים אותה.

-- "הביקורות שלי", והמשך של טיוטה: כולל העמודות שרק הכותב רואה, והתשובות.
create function my_reviews()
returns table (
  id uuid,
  course_id uuid,
  status public.review_status,
  cohort_month date,
  finished_month date,
  body text,
  display_name text,
  display_mode public.display_name_mode,
  author_title public.author_title,
  decision_note text,
  read_count integer,
  helpful_count integer,
  updated_at timestamptz,
  submitted_at timestamptz,
  published_at timestamptz,
  answers jsonb
)
language sql stable security definer
set search_path = ''
as $$
  select r.id, r.course_id, r.status, r.cohort_month, r.finished_month, r.body, r.display_name, r.display_mode,
         r.author_title, r.decision_note, r.read_count, r.helpful_count, r.updated_at, r.submitted_at, r.published_at,
         coalesce(
           (select jsonb_object_agg(a.metric_key, a.value) from public.review_answers a where a.review_id = r.id),
           '{}'::jsonb
         )
  from public.reviews r
  where r.author_id = (select auth.uid())
  order by r.updated_at desc;
$$;
grant execute on function my_reviews() to authenticated;

-- האם המשתמש המחובר מנהל. הפרוקסי של /admin ועמוד התור שואלים, בלי המפתח הסודי.
create function is_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins a where a.user_id = (select auth.uid()));
$$;
grant execute on function is_admin() to authenticated;

-- "עזר לי": לחיצה ראשונה מוסיפה, שנייה מבטלת. נשמרת רק טביעה של המזהה האקראי מהדפדפן.
create function toggle_helpful(p_review_id uuid, p_browser_id text)
returns table (is_helpful boolean, total integer)
language plpgsql security definer
set search_path = ''
as $$
declare
  v_hash text;
  v_removed integer;
begin
  if p_browser_id is null
     or p_browser_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    raise exception 'invalid browser id' using errcode = '22023';
  end if;
  if not private.is_review_public(p_review_id) then
    raise exception 'review not found' using errcode = 'P0002';
  end if;
  v_hash := encode(sha256(convert_to(p_browser_id, 'UTF8')), 'hex');
  delete from public.review_helpful h where h.review_id = p_review_id and h.browser_hash = v_hash;
  get diagnostics v_removed = row_count;
  if v_removed = 0 then
    insert into public.review_helpful (review_id, browser_hash) values (p_review_id, v_hash);
  end if;
  update public.reviews r
  set helpful_count = (select count(*) from public.review_helpful h where h.review_id = p_review_id)
  where r.id = p_review_id
  returning r.helpful_count into total;
  is_helpful := v_removed = 0;
  return next;
end $$;
grant execute on function toggle_helpful(uuid, text) to anon, authenticated;

-- קריאה של ביקורת שפורסמה. "פעם אחת לדפדפן" נשמר בדפדפן (localStorage). המספר גלוי רק לכותב.
create function count_review_read(p_review_id uuid)
returns void
language sql security definer
set search_path = ''
as $$
  update public.reviews set read_count = read_count + 1
  where id = p_review_id and status = 'published';
$$;
grant execute on function count_review_read(uuid) to anon, authenticated;

-- ===== 8. מעברי מצב: רק השרת (service_role) =====
-- security invoker: רצות בהרשאות של מי שקורא להן, ורק service_role רשאי. ברירות המחדל מתוכנית 1
-- חוסמות הרצה לכל השאר.

-- שליחה לבדיקה. השרת כבר בדק את הצעדים, הוריד את הקבצים, חישב טביעות והריץ את מודל השפה.
-- p_proofs: [{ "path", "sha256", "kind", "mime", "size", "check_status", "check_result" }]
create function submit_review(p_review_id uuid, p_author_id uuid, p_proofs jsonb)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_course uuid;
  v_busy boolean;
begin
  select r.course_id into v_course
  from public.reviews r
  where r.id = p_review_id and r.author_id = p_author_id and r.status = 'draft'
  for update;
  if v_course is null then
    raise exception 'review % is not a draft of this author', p_review_id using errcode = 'P0002';
  end if;

  update public.reviews
  set status = 'pending', submitted_at = now(), decision_note = null
  where id = p_review_id;

  -- יותר משלוש ביקורות לאותו קורס ביממה (מסמך העיצוב של חלק 1, סעיף 6). רק סימון לגל.
  select count(*) > 3 into v_busy
  from public.reviews r
  where r.course_id = v_course and r.submitted_at > now() - interval '1 day';

  insert into public.proofs (
    review_id, author_id, storage_path, sha256, claimed_kind, mime_type, size_bytes,
    check_status, check_result, flags
  )
  select
    p_review_id, p_author_id, f.path, f.sha256, f.kind::public.proof_kind, f.mime, f.size,
    f.check_status, f.check_result,
    array_remove(array[
      case when exists (
        select 1 from public.proofs o
        where o.sha256 = f.sha256 and o.review_id is distinct from p_review_id
      ) then 'duplicate' end,
      case when exists (
        select 1 from public.proofs o where o.sha256 = f.sha256 and o.review_id = p_review_id
      ) then 'duplicate_same_review' end,
      case when v_busy then 'busy_course' end
    ], null)
  from jsonb_to_recordset(p_proofs) as f(
    path text, sha256 text, kind text, mime text, size integer, check_status text, check_result jsonb
  );
end $$;
grant execute on function submit_review(uuid, uuid, jsonb) to service_role;

-- אישור: הקבצים כבר נמחקו מהאחסון (דרך ה-API). מפרסם, ומשאיר בהוכחה רק טביעה, סוג והחלטה.
-- p_paid_bucket: רק לחשבונית, במדרגות של 500. null כשאין סכום.
create function publish_review(
  p_review_id uuid, p_admin_id uuid, p_proof_kind public.proof_kind, p_paid_bucket integer default null
)
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_slug text;
begin
  update public.proofs
  set status = 'approved', decided_at = now(), storage_path = null, check_result = null,
      file_deleted_at = coalesce(file_deleted_at, now())
  where review_id = p_review_id and status = 'pending';

  update public.reviews r
  set status = 'published', verified_at = now(), published_at = now(), proof_kind = p_proof_kind,
      paid_bucket_ils = p_paid_bucket, decision_note = null
  from public.courses c
  where r.id = p_review_id and r.status = 'pending' and c.id = r.course_id
  returning c.slug into v_slug;
  if v_slug is null then
    raise exception 'review % is not pending', p_review_id using errcode = 'P0002';
  end if;

  insert into public.audit_log (actor_id, action, review_id, details)
  values (p_admin_id, 'approve', p_review_id,
          jsonb_build_object('proof_kind', p_proof_kind, 'paid_bucket_ils', p_paid_bucket));
  return v_slug;
end $$;
grant execute on function publish_review(uuid, uuid, public.proof_kind, integer) to service_role;

-- דחייה, או בקשה להוכחה נוספת: הביקורת חוזרת לטיוטה עם ההודעה של גל, והכותב מעלה הוכחה אחרת.
create function return_review(p_review_id uuid, p_admin_id uuid, p_action text, p_reason text, p_note text)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if p_action not in ('reject', 'request_more') then
    raise exception 'unknown action %', p_action using errcode = '22023';
  end if;
  update public.proofs
  set status = case when p_action = 'reject' then 'rejected' else 'more_requested' end::public.proof_status,
      decided_at = now(), storage_path = null, check_result = null,
      file_deleted_at = coalesce(file_deleted_at, now())
  where review_id = p_review_id and status = 'pending';

  update public.reviews set status = 'draft', decision_note = p_note
  where id = p_review_id and status = 'pending';
  if not found then
    raise exception 'review % is not pending', p_review_id using errcode = 'P0002';
  end if;

  insert into public.audit_log (actor_id, action, review_id, details)
  values (p_admin_id, p_action, p_review_id, jsonb_build_object('reason', p_reason));
end $$;
grant execute on function return_review(uuid, uuid, text, text, text) to service_role;

-- מחיקת ביקורת: בידי הכותב, או בניקוי של טיוטה ישנה. הקבצים כבר נמחקו מהאחסון.
-- מחזירה את כתובת הקורס, והאם הביקורת הייתה מפורסמת (ואז צריך לחשב ציונים מחדש).
-- p_actor_id: הכותב, או null בניקוי האוטומטי.
create function delete_review(p_review_id uuid, p_action text, p_actor_id uuid default null)
returns table (course_slug text, was_published boolean)
language plpgsql
set search_path = ''
as $$
declare
  v_status public.review_status;
begin
  if p_action not in ('author_delete', 'cleanup_delete') then
    raise exception 'unknown action %', p_action using errcode = '22023';
  end if;
  select r.status, c.slug into v_status, course_slug
  from public.reviews r join public.courses c on c.id = r.course_id
  where r.id = p_review_id
  for update of r;
  if v_status is null then
    raise exception 'review % not found', p_review_id using errcode = 'P0002';
  end if;

  update public.proofs
  set storage_path = null, check_result = null, file_deleted_at = coalesce(file_deleted_at, now())
  where review_id = p_review_id;
  delete from public.reviews where id = p_review_id;

  insert into public.audit_log (actor_id, action, review_id, details)
  values (p_actor_id, p_action, p_review_id, jsonb_build_object('status', v_status));
  was_published := v_status = 'published';
  return next;
end $$;
grant execute on function delete_review(uuid, text, uuid) to service_role;

-- קבצים בתיקיית ההוכחות שאף הוכחה פתוחה לא מצביעה עליהם, ושהועלו לפני יותר מ-p_age_hours שעות.
-- רק קריאה של storage.objects. המחיקה עצמה דרך ה-API של Storage (protect_delete חוסם מחיקה ב-SQL).
create function proof_orphans(p_age_hours integer)
returns setof text
language sql stable
set search_path = ''
as $$
  select o.name
  from storage.objects o
  where o.bucket_id = 'proofs'
    and o.created_at < now() - make_interval(hours => p_age_hours)
    and not exists (select 1 from public.proofs p where p.storage_path = o.name)
  order by o.created_at;
$$;
grant execute on function proof_orphans(integer) to service_role;

-- ===== 9. טווח "כמה שילמו באמת": רק מ-5 חשבוניות, ומעוגל החוצה ל-2,000 ש"ח =====
-- מסמך העיצוב של סבב 3, סעיף 2: כך המוסד לא יכול לזהות בוגר לפי הסכום שהוא שילם.
-- paid_bucket_ils הוא תחילת מדרגה של 500, ולכן הקצה העליון של המדרגה הגבוהה הוא +500.

create or replace function course_paid_range(p_course_id uuid)
returns table (min_ils integer, max_ils integer, invoice_count integer)
language sql stable security definer
set search_path = ''
as $$
  select (floor(min(r.paid_bucket_ils) / 2000.0) * 2000)::integer,
         (ceil((max(r.paid_bucket_ils) + 500) / 2000.0) * 2000)::integer,
         count(*)::integer
  from public.reviews r
  join public.courses c on c.id = r.course_id and c.status <> 'draft'
  where r.course_id = p_course_id
    and r.status = 'published'
    and r.proof_kind = 'invoice'
    and r.paid_bucket_ils is not null
  having count(*) >= 5;
$$;

-- ===== 10. האחסון: תיקייה פרטית, ומשתמש מחובר רק מעלה לתיקייה שלו =====
-- הגודל והסוג נאכפים ב-Storage עצמו. בלי מדיניות קריאה, החלפה או מחיקה: את כל אלה עושה השרת.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('proofs', 'proofs', false, 10485760, array['image/jpeg', 'image/png', 'application/pdf'])
on conflict (id) do update
set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "authors upload proofs to their own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'proofs' and (storage.foldername(name))[1] = (select auth.uid())::text);
