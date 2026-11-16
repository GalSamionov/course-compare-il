-- פנייה של חברה שמחפשת קורס, הרצאה או סדנה לעובדים (/companies). גל החליט ב-15.11.2026 להתמקד בחברות:
-- הן הקונות שמשלמות. הטופס בודק ביקוש, ולכן אין כאן מחיר ואין התחייבות, רק פרטים לשיחת היכרות.
-- אותו דפוס כמו institution_requests (20261115210001_course_queue_admin.sql): אורח ומשתמש מחובר לא רואים ולא
-- כותבים. הכתיבה רק דרך פעולת השרת, עם המפתח הסודי, דרך submit_company_request ומגבלת הקצב שבה.
--
-- קודי שגיאה שהשרת מתרגם לעברית (web/src/app/companies/actions.ts ו-web/src/app/admin/company-actions.ts):
--   LM040  יותר מדי פניות מאותה כתובת ביממה
--   LM041  יותר מדי פניות ביממה, מכל הכתובות
--   P0002  הפנייה לא קיימת, או כבר במצב הזה
--   23514  ערך שהמסד לא מקבל (אורך, מייל, טלפון או בחירה שאינה ברשימה)

-- ===== 1. היומן: גם פניות של חברות =====
-- אותה רשימה כמו ב-20261115230001, ועוד שתי פעולות על פנייה. ב-details רק המצב הקודם, אף פעם לא פרטים
-- של הפונה: היומן לא נמחק, והפנייה עצמה נמחקת (סעיף 4).

alter table audit_log add column company_request_id bigint;
alter table audit_log drop constraint audit_log_action_check;
alter table audit_log add constraint audit_log_action_check check (action in (
  'approve', 'reject', 'request_more', 'author_delete', 'cleanup_delete',
  'course_approve', 'course_edit', 'course_reject',
  'join_request_approve', 'join_request_reject',
  'report_keep', 'report_hide', 'report_remove',
  'vendor_response', 'vendor_response_remove',
  'company_request_contacted', 'company_request_closed'
));
alter table audit_log drop constraint audit_log_one_target;
alter table audit_log add constraint audit_log_one_target check (
  num_nonnulls(review_id, course_queue_id, institution_request_id, company_request_id) = 1
  and case
    when action in ('course_approve', 'course_edit', 'course_reject') then course_queue_id is not null
    when action in ('join_request_approve', 'join_request_reject') then institution_request_id is not null
    when action in ('company_request_contacted', 'company_request_closed') then company_request_id is not null
    else review_id is not null
  end
);
create index audit_log_company_request_idx on audit_log (company_request_id) where company_request_id is not null;

-- ===== 2. הפניות =====

create table company_requests (
  id bigint generated always as identity primary key,
  -- שורה אחת, בלי תווי בקרה. השרת והפונקציה כבר ניקו רווחים וסימני כיווניות.
  company_name text not null check (char_length(company_name) between 2 and 120 and company_name !~ '[[:cntrl:]]'),
  contact_name text not null check (char_length(contact_name) between 2 and 80 and contact_name !~ '[[:cntrl:]]'),
  -- מייל פשוט בלבד, בלי ? & = או #: ב-/admin הוא קישור mailto, ותווים כאלה היו מוסיפים לו נושא וגוף.
  email text not null check (char_length(email) <= 254 and email ~ '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$'),
  -- ספרות בלבד, עם + בהתחלה אם יש. ב-/admin הוא קישור tel.
  phone text check (phone ~ '^\+?[0-9]{9,15}$'),
  -- "מה אתם מחפשים": טקסט חופשי עד 1,000 תווים. מעבר שורה מותר, שאר תווי הבקרה לא.
  needs text not null check (char_length(needs) between 3 and 1000 and needs !~ '[\x01-\x09\x0b-\x1f\x7f]'),
  -- כמה עובדים ישתתפו, בטווחים.
  team_size text check (team_size in ('1-10', '11-50', '51-200', '201-1000', '1000+')),
  format text check (format in ('course', 'lecture', 'workshop', 'unsure')),
  timing text check (timing in ('month', 'quarter', 'half_year', 'unknown')),
  -- HMAC-SHA256 של כתובת ה-IP, עם מפתח שיש רק לשרת. רק למגבלת הקצב, ונמחק אחרי יומיים.
  client_hash text check (client_hash ~ '^[0-9a-f]{64}$'),
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  contacted_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  check ((status = 'closed') = (closed_at is not null)),
  check (status <> 'contacted' or contacted_at is not null),
  check (status <> 'new' or contacted_at is null)
);
create index company_requests_open_idx on company_requests (created_at desc) where status <> 'closed';
create index company_requests_client_idx on company_requests (client_hash, created_at) where client_hash is not null;
create index company_requests_created_idx on company_requests (created_at);
create index company_requests_closed_idx on company_requests (closed_at) where status = 'closed';

alter table company_requests enable row level security;
-- אין מדיניות: אורח ומשתמש מחובר לא רואים ולא כותבים. רק service_role, שעוקף RLS.
revoke all on company_requests from anon, authenticated;

-- ===== 3. הטופס הציבורי, דרך פעולת השרת =====

-- שורה אחת: בלי סימני כיווניות (שהיו יכולים להפוך טקסט ב-/admin), וכל רצף של רווחים ותווי בקרה הופך לרווח.
create function private.clean_line(p_text text)
returns text
language sql immutable
set search_path = ''
as $$
  select btrim(regexp_replace(regexp_replace(coalesce(p_text, ''), '[‪-‮⁦-⁩]', '', 'g'),
                              '[[:space:][:cntrl:]]+', ' ', 'g'));
$$;

-- טקסט חופשי: אותו ניקוי, אבל מעברי שורה נשארים (עד שורה ריקה אחת ברצף).
create function private.clean_text(p_text text)
returns text
language sql immutable
set search_path = ''
as $$
  select btrim(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(replace(coalesce(p_text, ''), E'\r\n', E'\n'), '[‪-‮⁦-⁩\x01-\x09\x0b-\x1f\x7f]', ' ', 'g'),
          '[  ]+', ' ', 'g'),
        ' *\n *', E'\n', 'g'),
      E'\n{3,}', E'\n\n', 'g'),
    E' \n');
$$;
revoke execute on function private.clean_line(text) from public, anon, authenticated;
revoke execute on function private.clean_text(text) from public, anon, authenticated;
grant execute on function private.clean_line(text) to service_role;
grant execute on function private.clean_text(text) to service_role;

-- מחזירה 'created', או 'duplicate' כשאותו מייל כבר שלח את אותו טקסט והפנייה עוד פתוחה (ואז לא נוסף כלום).
-- מגבלת קצב: 3 ביממה לכל כתובת, ו-100 ביממה בסך הכול. נעילה אחת, כדי ששתי שליחות במקביל לא יעברו את המגבלה.
-- הבדיקות של אורך, מייל, טלפון ובחירות: בטבלה (23514). השרת בודק אותן קודם, עם הודעה ליד כל שדה.
create function submit_company_request(
  p_company_name text, p_contact_name text, p_email text, p_needs text, p_client_hash text,
  p_phone text default null, p_team_size text default null, p_format text default null, p_timing text default null
)
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_company text := private.clean_line(p_company_name);
  v_contact text := private.clean_line(p_contact_name);
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_needs text := private.clean_text(p_needs);
  v_phone text := nullif(regexp_replace(coalesce(p_phone, ''), '[\s().-]', '', 'g'), '');
begin
  if p_client_hash is null or p_client_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'bad client hash' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtext('public.company_requests'));
  if (select count(*) from public.company_requests r
      where r.client_hash = p_client_hash and r.created_at > now() - interval '1 day') >= 3 then
    raise exception 'too many requests from this client today' using errcode = 'LM040';
  end if;
  if (select count(*) from public.company_requests r where r.created_at > now() - interval '1 day') >= 100 then
    raise exception 'too many requests today' using errcode = 'LM041';
  end if;
  if exists (
    select 1 from public.company_requests r
    where r.status <> 'closed' and r.email = v_email and r.needs = v_needs and r.created_at > now() - interval '1 day'
  ) then
    return 'duplicate';
  end if;
  insert into public.company_requests (company_name, contact_name, email, phone, needs, team_size, format, timing, client_hash)
  values (v_company, v_contact, v_email, v_phone, v_needs,
          nullif(p_team_size, ''), nullif(p_format, ''), nullif(p_timing, ''), p_client_hash);
  return 'created';
end $$;

-- ===== 4. ב-/admin: חזרנו אליהם, או סגרנו =====
-- contacted: רק מפנייה חדשה. closed: מחדשה או ממי שכבר חזרנו אליו. פנייה סגורה לא נפתחת שוב.
create function set_company_request_status(p_request_id bigint, p_admin_id uuid, p_status text)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_status text;
begin
  if not exists (select 1 from public.admins where user_id = p_admin_id) then
    raise exception 'not an admin' using errcode = '42501';
  end if;
  if p_status is null or p_status not in ('contacted', 'closed') then
    raise exception 'unknown status' using errcode = '22023';
  end if;
  select status into v_status from public.company_requests where id = p_request_id for update;
  if v_status is null
     or (p_status = 'contacted' and v_status <> 'new')
     or (p_status = 'closed' and v_status = 'closed') then
    raise exception 'request % cannot become %', p_request_id, p_status using errcode = 'P0002';
  end if;

  if p_status = 'contacted' then
    update public.company_requests set status = 'contacted', contacted_at = now() where id = p_request_id;
  else
    update public.company_requests set status = 'closed', closed_at = now() where id = p_request_id;
  end if;
  insert into public.audit_log (actor_id, action, company_request_id, details)
  values (p_admin_id, 'company_request_' || p_status, p_request_id, jsonb_build_object('from', v_status));
end $$;

-- ===== 5. הניקוי היומי (web/src/lib/reviews/cleanup.ts, ומדיניות הפרטיות) =====
-- פנייה שנסגרה נמחקת כולה 12 חודשים אחרי הסגירה. הטביעה של הכתובת: אחרי יומיים. מחזירה כמה פניות נמחקו.
create function purge_company_requests()
returns integer
language plpgsql
set search_path = ''
as $$
declare
  v_deleted integer;
begin
  delete from public.company_requests where status = 'closed' and closed_at < now() - interval '12 months';
  get diagnostics v_deleted = row_count;
  update public.company_requests set client_hash = null
  where client_hash is not null and created_at < now() - interval '2 days';
  return v_deleted;
end $$;

revoke execute on function submit_company_request(text, text, text, text, text, text, text, text, text) from public, anon, authenticated;
revoke execute on function set_company_request_status(bigint, uuid, text) from public, anon, authenticated;
revoke execute on function purge_company_requests() from public, anon, authenticated;
grant execute on function submit_company_request(text, text, text, text, text, text, text, text, text) to service_role;
grant execute on function set_company_request_status(bigint, uuid, text) to service_role;
grant execute on function purge_company_requests() to service_role;
