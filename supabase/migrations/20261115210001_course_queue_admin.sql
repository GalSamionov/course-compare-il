-- סבב 5, תוכנית 5ב: ההחלטות של גל על קורסים נרשמות ב-audit_log, ובקשה של מוסד להוסיף קורס.
-- התוכנית: docs/superpowers/plans/2026-11-15-plan-5b-course-queue.md. מסמך העיצוב של חלק 1, סעיפים 5 ו-10.
-- כל הפונקציות כאן ל-service_role בלבד. לאורח ולמשתמש מחובר אין כאן שום קריאה ושום כתיבה.
--
-- קודי שגיאה שהשרת מתרגם לעברית (web/src/lib/admin/course-queue.ts ו-web/src/lib/institutions/join.ts):
--   LM001  יותר מדי בקשות מאותה כתובת ביממה
--   LM002  יותר מדי בקשות ביממה, מכל הכתובות
--   LM010  הקישור לא באתר של המוסד שנבחר
--   LM011  למוסד שנבחר אין אתר במסד
--   LM012  הקישור כבר שייך למוסד אחר אצל האוסף
--   LM020  תיקון ידני רק לשדה, לא לקורס חדש או לקורס שנעלם

-- ===== 1. היומן: גם קורסים ובקשות של מוסדות (סעיף 10: "כל פעולה נרשמת ב-audit_log") =====

alter table audit_log alter column review_id drop not null;
alter table audit_log add column course_queue_id bigint, add column institution_request_id bigint;
alter table audit_log drop constraint audit_log_action_check;
alter table audit_log add constraint audit_log_action_check check (action in (
  'approve', 'reject', 'request_more', 'author_delete', 'cleanup_delete',
  'course_approve', 'course_edit', 'course_reject',
  'join_request_approve', 'join_request_reject'
));
-- כל שורה על דבר אחד בדיוק, והפעולה מתאימה לו. בלי מפתחות זרים, כמו review_id: היומן לא מתעדכן.
alter table audit_log add constraint audit_log_one_target check (
  num_nonnulls(review_id, course_queue_id, institution_request_id) = 1
  and case
    when action in ('course_approve', 'course_edit', 'course_reject') then course_queue_id is not null
    when action in ('join_request_approve', 'join_request_reject') then institution_request_id is not null
    else review_id is not null
  end
);
create index audit_log_course_queue_idx on audit_log (course_queue_id) where course_queue_id is not null;
create index audit_log_institution_request_idx on audit_log (institution_request_id) where institution_request_id is not null;

-- ===== 2. ההחלטות בתור של הקורסים: אותה התנהגות, ועכשיו גם ביומן =====

-- אישור, או תיקון של גל (p_edit, והערך ב-p_value): השדה נכתב, קורס חדש עולה לאוויר, קורס שנעלם מוסר.
-- p_edit נפרד מ-p_value: דרך PostgREST, null של JSON מגיע כ-NULL של SQL, ותיקון לערך ריק היה נקרא כאישור
-- של הערך מהדף. לכן החתימה מוחלפת (drop ו-create), וההרשאות ניתנות מחדש למטה.
drop function approve_course_change(bigint, uuid, jsonb);
create function approve_course_change(p_queue_id bigint, p_admin_id uuid, p_value jsonb default null, p_edit boolean default false)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_item public.course_change_queue%rowtype;
  v_old jsonb;
  v_new jsonb;
  v_status text;
begin
  if not exists (select 1 from public.admins where user_id = p_admin_id) then
    raise exception 'not an admin' using errcode = '42501';
  end if;
  select * into v_item from public.course_change_queue where id = p_queue_id and status = 'pending' for update;
  if not found then
    raise exception 'queue item % is not pending', p_queue_id using errcode = 'P0002';
  end if;
  if p_edit and v_item.kind <> 'field' then
    raise exception 'only a field change can be edited' using errcode = 'LM020';
  end if;

  if v_item.kind = 'field' then
    v_old := private.scraper_course_value(v_item.course_id, v_item.field);
    v_new := case when p_edit then coalesce(p_value, 'null'::jsonb) else coalesce(v_item.new_value, 'null'::jsonb) end;
    perform private.scraper_set_course_field(v_item.course_id, v_item.field, v_new);
    insert into public.course_changes (course_id, field, old_value, new_value, source, approved_by, queue_id, run_id, snapshot_id, quote)
    values (v_item.course_id, v_item.field, v_old, v_new, 'approved', p_admin_id, v_item.id, v_item.run_id, v_item.snapshot_id, v_item.quote);
  elsif v_item.kind = 'new_course' then
    update public.courses set status = 'active' where id = v_item.course_id and status = 'draft';
    if not found then
      raise exception 'course % is not a draft', v_item.course_id using errcode = 'P0002';
    end if;
    insert into public.course_changes (course_id, field, old_value, new_value, source, approved_by, queue_id, run_id, snapshot_id)
    values (v_item.course_id, 'status', '"draft"', '"active"', 'approved', p_admin_id, v_item.id, v_item.run_id, v_item.snapshot_id);
  elsif v_item.kind = 'maybe_inactive' then
    select status::text into v_status from public.courses where id = v_item.course_id for update;
    if v_status in ('active', 'maybe_inactive') then
      update public.courses set status = 'removed' where id = v_item.course_id;
      insert into public.course_changes (course_id, field, old_value, new_value, source, approved_by, queue_id, run_id)
      values (v_item.course_id, 'status', to_jsonb(v_status), '"removed"', 'approved', p_admin_id, v_item.id, v_item.run_id);
    end if;
  end if;
  -- fetch_failed: רק "ראיתי". הדף ממשיך להיבדק כל שבוע.

  update public.course_change_queue set status = 'approved', decided_by = p_admin_id, decided_at = now() where id = p_queue_id;
  -- הערכים עצמם כבר ב-course_changes. ביומן: מה הוחלט, ועל איזה קורס ושדה.
  insert into public.audit_log (actor_id, action, course_queue_id, details)
  values (p_admin_id, case when p_edit then 'course_edit' else 'course_approve' end, p_queue_id,
          jsonb_strip_nulls(jsonb_build_object('kind', v_item.kind, 'field', v_item.field, 'course_id', v_item.course_id)));
end $$;

revoke execute on function approve_course_change(bigint, uuid, jsonb, boolean) from public, anon, authenticated;
grant execute on function approve_course_change(bigint, uuid, jsonb, boolean) to service_role;

-- דחייה: השדה נשאר כמו שהוא. קורס חדש שנדחה נשאר טיוטה, והדף שלו לא נקרא יותר.
-- קורס שסומן "ייתכן שאינו פעיל" חוזר לפעיל. create or replace שומר את ההרשאות (רק service_role).
create or replace function reject_course_change(p_queue_id bigint, p_admin_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_item public.course_change_queue%rowtype;
begin
  if not exists (select 1 from public.admins where user_id = p_admin_id) then
    raise exception 'not an admin' using errcode = '42501';
  end if;
  select * into v_item from public.course_change_queue where id = p_queue_id and status = 'pending' for update;
  if not found then
    raise exception 'queue item % is not pending', p_queue_id using errcode = 'P0002';
  end if;

  if v_item.kind = 'new_course' then
    update public.scrape_pages set state = 'ignored' where id = v_item.page_id;
  elsif v_item.kind = 'maybe_inactive' then
    update public.courses set status = 'active' where id = v_item.course_id and status = 'maybe_inactive';
    if found then
      insert into public.course_changes (course_id, field, old_value, new_value, source, approved_by, queue_id, run_id)
      values (v_item.course_id, 'status', '"maybe_inactive"', '"active"', 'approved', p_admin_id, v_item.id, v_item.run_id);
    end if;
    update public.scrape_pages set missing_count = 0 where id = v_item.page_id;
  end if;

  update public.course_change_queue set status = 'rejected', decided_by = p_admin_id, decided_at = now() where id = p_queue_id;
  insert into public.audit_log (actor_id, action, course_queue_id, details)
  values (p_admin_id, 'course_reject', p_queue_id,
          jsonb_strip_nulls(jsonb_build_object('kind', v_item.kind, 'field', v_item.field, 'course_id', v_item.course_id)));
end $$;

-- ===== 3. דפים שאושרו מבקשה: האוסף קורא אותם גם כשהם לא במפת האתר =====

alter table scrape_pages
  add column source text not null default 'discovered' check (source in ('discovered', 'request'));

-- ===== 4. בקשה של מוסד להוסיף קורס (/institutions/join) =====

create table institution_requests (
  id bigint generated always as identity primary key,
  institution_name text not null check (char_length(institution_name) between 2 and 120),
  -- השרת כבר בדק שזו כתובת http(s) תקינה, בלי שם משתמש וסיסמה. הכתובת לא נפתחת עד שגל מאשר.
  course_url text not null check (char_length(course_url) <= 500 and course_url ~ '^https?://[^\s@]+$'),
  -- רק לגל, ב-/admin. נמחק 90 יום אחרי ההחלטה (purge_institution_requests, בניקוי היומי).
  -- מייל פשוט בלבד, בלי ? & = או #: ב-/admin הוא קישור mailto, ותווים כאלה היו מוסיפים לו נושא וגוף.
  contact_email text check (char_length(contact_email) <= 254 and contact_email ~ '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$'),
  -- HMAC-SHA256 של כתובת ה-IP, עם מפתח שיש רק לשרת. רק למגבלת הקצב, ונמחק אחרי יומיים.
  client_hash text check (client_hash ~ '^[0-9a-f]{64}$'),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  institution_id uuid references institutions(id),
  page_id bigint references scrape_pages(id),
  decided_by uuid,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  check ((status = 'pending') = (decided_at is null)),
  check ((status = 'approved') = (page_id is not null and institution_id is not null)),
  check (status <> 'pending' or contact_email is not null)
);
create index institution_requests_pending_idx on institution_requests (created_at) where status = 'pending';
create index institution_requests_client_idx on institution_requests (client_hash, created_at) where client_hash is not null;
create index institution_requests_created_idx on institution_requests (created_at);
-- אותו קישור לא ממתין פעמיים.
create unique index institution_requests_one_pending_url on institution_requests (lower(course_url)) where status = 'pending';

alter table institution_requests enable row level security;
revoke all on institution_requests from anon, authenticated;

-- המארח של כתובת, באותיות קטנות ובלי www. null כשאין. אותו כלל כמו same_site באוסף (scraper/lamadti_scraper/config.py).
create function private.url_host(p_url text)
returns text
language sql immutable
set search_path = ''
as $$
  select nullif(regexp_replace(lower(substring(p_url from '^https?://([^/:?#]+)')), '^www\.', ''), '');
$$;
revoke execute on function private.url_host(text) from public, anon, authenticated;
grant execute on function private.url_host(text) to service_role;

-- הטופס הציבורי, דרך פעולת השרת. מחזירה 'created', או 'duplicate' כשאותו קישור כבר ממתין (ואז לא נוסף כלום).
-- מגבלת קצב: 3 ביממה לכל כתובת, ו-50 ביממה בסך הכול. נעילה אחת, כדי ששתי שליחות במקביל לא יעברו את המגבלה.
create function submit_institution_request(
  p_institution_name text, p_course_url text, p_contact_email text, p_client_hash text
)
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_name text := btrim(regexp_replace(coalesce(p_institution_name, ''), '\s+', ' ', 'g'));
  v_url text := btrim(coalesce(p_course_url, ''));
  v_email text := lower(btrim(coalesce(p_contact_email, '')));
begin
  if p_client_hash is null or p_client_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'bad client hash' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtext('public.institution_requests'));
  if (select count(*) from public.institution_requests r
      where r.client_hash = p_client_hash and r.created_at > now() - interval '1 day') >= 3 then
    raise exception 'too many requests from this client today' using errcode = 'LM001';
  end if;
  if (select count(*) from public.institution_requests r where r.created_at > now() - interval '1 day') >= 50 then
    raise exception 'too many requests today' using errcode = 'LM002';
  end if;
  if exists (select 1 from public.institution_requests r where r.status = 'pending' and lower(r.course_url) = lower(v_url)) then
    return 'duplicate';
  end if;
  insert into public.institution_requests (institution_name, course_url, contact_email, client_hash)
  values (v_name, v_url, v_email, p_client_hash);
  return 'created';
end $$;

-- אישור: גל בוחר מוסד שכבר קיים, והקישור חייב להיות באתר שלו (סעיף 5: מאספים רק מאתר המוסד עצמו).
-- הקישור נכנס לדפים של האוסף, והאוסף קורא אותו בכל ריצה של המוסד (גם אם הוא לא במפת האתר).
-- דף שגל דחה בעבר חוזר לקריאה: הבקשה המאושרת היא החלטה חדשה. מחזירה את מזהה הדף.
create function approve_institution_request(p_request_id bigint, p_admin_id uuid, p_institution_id uuid)
returns bigint
language plpgsql
set search_path = ''
as $$
declare
  v_request public.institution_requests%rowtype;
  v_website text;
  v_page public.scrape_pages%rowtype;
begin
  if not exists (select 1 from public.admins where user_id = p_admin_id) then
    raise exception 'not an admin' using errcode = '42501';
  end if;
  select * into v_request from public.institution_requests where id = p_request_id and status = 'pending' for update;
  if not found then
    raise exception 'request % is not pending', p_request_id using errcode = 'P0002';
  end if;
  select i.website into v_website from public.institutions i where i.id = p_institution_id;
  if not found then
    raise exception 'institution % not found', p_institution_id using errcode = 'P0002';
  end if;
  if private.url_host(v_website) is null then
    raise exception 'the institution has no website' using errcode = 'LM011';
  end if;
  if private.url_host(v_request.course_url) is distinct from private.url_host(v_website) then
    raise exception 'the link is not on the institution site' using errcode = 'LM010';
  end if;

  insert into public.scrape_pages (institution_id, url, source)
  values (p_institution_id, v_request.course_url, 'request')
  on conflict (url) do nothing;
  select * into v_page from public.scrape_pages where url = v_request.course_url for update;
  if v_page.institution_id <> p_institution_id then
    raise exception 'the page belongs to another institution' using errcode = 'LM012';
  end if;
  update public.scrape_pages set source = 'request', state = 'active', missing_count = 0 where id = v_page.id;

  update public.institution_requests
  set status = 'approved', institution_id = p_institution_id, page_id = v_page.id, decided_by = p_admin_id, decided_at = now()
  where id = p_request_id;
  insert into public.audit_log (actor_id, action, institution_request_id, details)
  values (p_admin_id, 'join_request_approve', p_request_id,
          jsonb_build_object('institution_id', p_institution_id, 'page_id', v_page.id));
  return v_page.id;
end $$;

create function reject_institution_request(p_request_id bigint, p_admin_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if not exists (select 1 from public.admins where user_id = p_admin_id) then
    raise exception 'not an admin' using errcode = '42501';
  end if;
  update public.institution_requests set status = 'rejected', decided_by = p_admin_id, decided_at = now()
  where id = p_request_id and status = 'pending';
  if not found then
    raise exception 'request % is not pending', p_request_id using errcode = 'P0002';
  end if;
  insert into public.audit_log (actor_id, action, institution_request_id, details)
  values (p_admin_id, 'join_request_reject', p_request_id, '{}'::jsonb);
end $$;

-- הניקוי היומי (web/src/lib/reviews/cleanup.ts): המייל 90 יום אחרי ההחלטה, והטביעה של הכתובת אחרי יומיים.
-- מחזירה כמה מיילים נמחקו.
create function purge_institution_requests()
returns integer
language plpgsql
set search_path = ''
as $$
declare
  v_emails integer;
begin
  update public.institution_requests set contact_email = null
  where contact_email is not null and status <> 'pending' and decided_at < now() - interval '90 days';
  get diagnostics v_emails = row_count;
  update public.institution_requests set client_hash = null
  where client_hash is not null and created_at < now() - interval '2 days';
  return v_emails;
end $$;

revoke execute on function submit_institution_request(text, text, text, text) from public, anon, authenticated;
revoke execute on function approve_institution_request(bigint, uuid, uuid) from public, anon, authenticated;
revoke execute on function reject_institution_request(bigint, uuid) from public, anon, authenticated;
revoke execute on function purge_institution_requests() from public, anon, authenticated;
grant execute on function submit_institution_request(text, text, text, text) to service_role;
grant execute on function approve_institution_request(bigint, uuid, uuid) to service_role;
grant execute on function reject_institution_request(bigint, uuid) to service_role;
grant execute on function purge_institution_requests() to service_role;
