-- סבב 5, תוכנית 5ג: דיווח על ביקורת, ההחלטות של גל עליו, תגובת מוסד, ומספרי השקיפות.
-- התוכנית: docs/superpowers/plans/2026-11-15-plan-5-reports-transparency.md.
-- מסמך העיצוב: docs/superpowers/specs/2026-11-15-round-5-reports-transparency-design.md, סעיפים 3–7 ו-9.
-- אחרי 20261115210001_course_queue_admin.sql: ביומן כבר יש יעד אחד בכל שורה (audit_log_one_target), ופעולה
-- שאינה של קורס או של בקשה חייבת review_id. כל הפעולות החדשות כאן על ביקורת.
-- הפונקציות שכותבות: ל-service_role בלבד. לאורח ולמשתמש מחובר: רק מספרי השקיפות.
--
-- קודי שגיאה שהשרת מתרגם לעברית (web/src/app/courses/[slug]/report-actions.ts ו-web/src/app/admin/report-actions.ts):
--   LM030  יותר מדי דיווחים מאותה כתובת ביממה
--   LM031  יותר מדי דיווחים ביממה, מכל הכתובות
--   LM032  הסתרה עד בירור רק לפרטים של אדם פרטי או לתוכן לא חוקי
--   LM033  אין תגובה של מוסד להסיר
--   P0002  הביקורת לא מוצגת באתר, או שאין עליה דיווח פתוח, או שהיא כבר מוסתרת

-- ===== 1. היומן: גם דיווחים ותגובות של מוסדות =====
-- אותה רשימה כמו ב-20261115210001, ועוד חמש פעולות על ביקורת. ב-details רק קודים ומזהים, אף פעם לא טקסט
-- חופשי: היומן לא נמחק, וטקסט של דיווח יכול לכלול שם של אדם פרטי.

alter table audit_log drop constraint audit_log_action_check;
alter table audit_log add constraint audit_log_action_check check (action in (
  'approve', 'reject', 'request_more', 'author_delete', 'cleanup_delete',
  'course_approve', 'course_edit', 'course_reject',
  'join_request_approve', 'join_request_reject',
  'report_keep', 'report_hide', 'report_remove',
  'vendor_response', 'vendor_response_remove'
));

-- ===== 2. דיווחים (מסמך העיצוב של חלק 1, סעיף 4) =====

create table reports (
  id bigint generated always as identity primary key,
  -- כותב שמוחק את הביקורת שלו מוחק גם את הדיווחים עליה. ההחלטות נשארות ביומן.
  review_id uuid not null references reviews(id) on delete cascade,
  reason text not null check (reason in ('privacy', 'illegal', 'false_fact', 'not_graduate', 'other')),
  -- מה שהמדווח כתב. רק לגל, ב-/admin. נמחק 90 יום אחרי ההחלטה (purge_reports).
  details text check (details is null or char_length(details) between 1 and 1000),
  -- HMAC-SHA256 של כתובת ה-IP, עם מפתח שיש רק לשרת. רק למגבלת הקצב, ונמחק אחרי יומיים (purge_reports).
  client_hash text check (client_hash ~ '^[0-9a-f]{64}$'),
  status text not null default 'open' check (status in ('open', 'kept', 'removed')),
  decided_by uuid,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  check ((status = 'open') = (decided_at is null))
);
create index reports_open_idx on reports (review_id, created_at) where status = 'open';
create index reports_client_idx on reports (client_hash, created_at) where client_hash is not null;
create index reports_created_idx on reports (created_at);

alter table reports enable row level security;
-- אין מדיניות: אורח ומשתמש מחובר לא רואים ולא כותבים. רק service_role, שעוקף RLS.
-- ברירות המחדל של תוכנית 1 כבר חוסמות, וזה במפורש.
revoke all on reports from anon, authenticated;

-- ===== 3. דיווח, מהטופס הציבורי, דרך פעולת השרת =====
-- מחזירה 'created', או 'duplicate' כשאותה כתובת כבר דיווחה על אותה ביקורת והדיווח עוד פתוח (ואז לא נוסף כלום).
-- מגבלת קצב: 5 ביממה לכל כתובת, ו-300 ביממה בסך הכול. נעילה אחת, כמו submit_institution_request.
-- הביקורת נשארת באתר (סעיף 6). disputed_at מסמן שיש עליה דיווח פתוח, ולא מוצג לציבור.
create function submit_review_report(p_review_id uuid, p_reason text, p_client_hash text, p_details text default null)
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_details text := nullif(btrim(regexp_replace(coalesce(p_details, ''), '\s+', ' ', 'g')), '');
begin
  if p_client_hash is null or p_client_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'bad client hash' using errcode = '22023';
  end if;
  if p_reason is null or p_reason not in ('privacy', 'illegal', 'false_fact', 'not_graduate', 'other') then
    raise exception 'unknown reason' using errcode = '22023';
  end if;
  if p_reason = 'other' and v_details is null then
    raise exception 'other needs details' using errcode = '22023';
  end if;
  if char_length(v_details) > 1000 then
    raise exception 'details are too long' using errcode = '22023';
  end if;
  -- רק ביקורת שמוצגת באתר: פורסמה, בקורס שאינו טיוטה. אותו כלל כמו private.is_review_public.
  if not exists (
    select 1 from public.reviews r join public.courses c on c.id = r.course_id
    where r.id = p_review_id and r.status = 'published' and c.status <> 'draft'
  ) then
    raise exception 'review not found' using errcode = 'P0002';
  end if;

  perform pg_advisory_xact_lock(hashtext('public.reports'));
  if exists (
    select 1 from public.reports r
    where r.review_id = p_review_id and r.client_hash = p_client_hash and r.status = 'open'
  ) then
    return 'duplicate';
  end if;
  if (select count(*) from public.reports r
      where r.client_hash = p_client_hash and r.created_at > now() - interval '1 day') >= 5 then
    raise exception 'too many reports from this client today' using errcode = 'LM030';
  end if;
  if (select count(*) from public.reports r where r.created_at > now() - interval '1 day') >= 300 then
    raise exception 'too many reports today' using errcode = 'LM031';
  end if;

  insert into public.reports (review_id, reason, details, client_hash)
  values (p_review_id, p_reason, v_details, p_client_hash);
  update public.reviews set disputed_at = coalesce(disputed_at, now()) where id = p_review_id;
  return 'created';
end $$;

-- ===== 4. ההחלטה של גל, על כל הדיווחים הפתוחים של ביקורת אחת (סעיף 10, "דיווחים") =====
-- keep: הביקורת נשארת (או חוזרת, אם הוסתרה), והדיווחים נסגרים. דעה נשארת.
-- hide: הביקורת יורדת מהאתר ומהציון עד ההחלטה (status = 'disputed', שכבר לא ציבורי), והדיווחים נשארים פתוחים.
--       רק לפרטים של אדם פרטי או לתוכן לא חוקי (סעיף 6). המסד אוכף.
-- remove: הביקורת מוסרת (status = 'removed'), והכותב רואה ב"הביקורות שלי" את p_note. הדיווחים נסגרים.
-- ביומן: מספרי הדיווחים והסיבה. p_note נשמרת רק בביקורת, שהכותב יכול למחוק.
-- מחזירה את הכתובת של הקורס, לרענון העמוד.
create function decide_review_reports(
  p_review_id uuid, p_admin_id uuid, p_decision text, p_reason text default null, p_note text default null
)
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_status public.review_status;
  v_slug text;
  v_reports jsonb;
begin
  if not exists (select 1 from public.admins where user_id = p_admin_id) then
    raise exception 'not an admin' using errcode = '42501';
  end if;
  if p_decision is null or p_decision not in ('keep', 'hide', 'remove') then
    raise exception 'unknown decision' using errcode = '22023';
  end if;

  select r.status, c.slug into v_status, v_slug
  from public.reviews r join public.courses c on c.id = r.course_id
  where r.id = p_review_id
  for update of r;
  select jsonb_agg(p.id order by p.id) into v_reports
  from public.reports p where p.review_id = p_review_id and p.status = 'open';
  if v_status is null or v_status not in ('published', 'disputed') or v_reports is null then
    raise exception 'review % has no open report', p_review_id using errcode = 'P0002';
  end if;

  if p_decision = 'keep' then
    update public.reviews set disputed_at = null where id = p_review_id;
    -- רק כשהיא מוסתרת: עדכון של status מזיז את updated_at (reviews_updated_at), ואת הסדר ב"הביקורות שלי".
    if v_status = 'disputed' then
      update public.reviews set status = 'published' where id = p_review_id;
    end if;
    update public.reports set status = 'kept', decided_by = p_admin_id, decided_at = now()
    where review_id = p_review_id and status = 'open';
    insert into public.audit_log (actor_id, action, review_id, details)
    values (p_admin_id, 'report_keep', p_review_id,
            jsonb_build_object('reports', v_reports, 'was_hidden', v_status = 'disputed'));
  elsif p_decision = 'hide' then
    if p_reason is null or p_reason not in ('privacy', 'illegal') then
      raise exception 'hide is only for privacy or illegal content' using errcode = 'LM032';
    end if;
    if v_status = 'disputed' then
      raise exception 'review % is already hidden', p_review_id using errcode = 'P0002';
    end if;
    update public.reviews set status = 'disputed' where id = p_review_id;
    insert into public.audit_log (actor_id, action, review_id, details)
    values (p_admin_id, 'report_hide', p_review_id, jsonb_build_object('reports', v_reports, 'reason', p_reason));
  else
    if p_reason is null or p_reason not in ('privacy', 'illegal', 'false_fact', 'not_graduate', 'other') then
      raise exception 'unknown reason' using errcode = '22023';
    end if;
    update public.reviews set status = 'removed', decision_note = p_note where id = p_review_id;
    update public.reports set status = 'removed', decided_by = p_admin_id, decided_at = now()
    where review_id = p_review_id and status = 'open';
    insert into public.audit_log (actor_id, action, review_id, details)
    values (p_admin_id, 'report_remove', p_review_id, jsonb_build_object('reports', v_reports, 'reason', p_reason));
  end if;
  return v_slug;
end $$;

-- ===== 5. תגובת מוסד (סעיף 6: "גל מעלה אותה"), מתחת לביקורת בפתק כחול =====

alter table vendor_responses
  add constraint vendor_responses_body_length check (char_length(btrim(body)) between 1 and 2000);

-- p_body ריק: מוחקת את התגובה. אחרת: מוסיפה, או מחליפה את הקיימת (vendor_responses_review_idx).
-- רק לביקורת שפורסמה, או שמוסתרת עד בירור. ביומן רק שהתגובה פורסמה או הוסרה, בלי הטקסט.
-- מחזירה את הכתובת של הקורס.
create function set_vendor_response(p_review_id uuid, p_admin_id uuid, p_body text)
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_slug text;
  v_body text := nullif(btrim(coalesce(p_body, '')), '');
begin
  if not exists (select 1 from public.admins where user_id = p_admin_id) then
    raise exception 'not an admin' using errcode = '42501';
  end if;
  select c.slug into v_slug
  from public.reviews r join public.courses c on c.id = r.course_id
  where r.id = p_review_id and r.status in ('published', 'disputed')
  for update of r;
  if v_slug is null then
    raise exception 'review % is not on the site', p_review_id using errcode = 'P0002';
  end if;

  if v_body is null then
    delete from public.vendor_responses where review_id = p_review_id;
    if not found then
      raise exception 'review % has no response', p_review_id using errcode = 'LM033';
    end if;
    insert into public.audit_log (actor_id, action, review_id, details)
    values (p_admin_id, 'vendor_response_remove', p_review_id, '{}'::jsonb);
  else
    if char_length(v_body) > 2000 then
      raise exception 'response is too long' using errcode = '22023';
    end if;
    insert into public.vendor_responses (review_id, body) values (p_review_id, v_body)
    on conflict (review_id) do update set body = excluded.body;
    insert into public.audit_log (actor_id, action, review_id, details)
    values (p_admin_id, 'vendor_response', p_review_id, '{}'::jsonb);
  end if;
  return v_slug;
end $$;

-- ===== 6. הניקוי היומי (web/src/lib/reviews/cleanup.ts, ומדיניות הפרטיות) =====
-- מה שהמדווח כתב: 90 יום אחרי ההחלטה. הטביעה של הכתובת: אחרי יומיים. מחזירה כמה טקסטים נמחקו.
create function purge_reports()
returns integer
language plpgsql
set search_path = ''
as $$
declare
  v_details integer;
begin
  update public.reports set details = null
  where details is not null and status <> 'open' and decided_at < now() - interval '90 days';
  get diagnostics v_details = row_count;
  update public.reports set client_hash = null
  where client_hash is not null and created_at < now() - interval '2 days';
  return v_details;
end $$;

revoke execute on function submit_review_report(uuid, text, text, text) from public, anon, authenticated;
revoke execute on function decide_review_reports(uuid, uuid, text, text, text) from public, anon, authenticated;
revoke execute on function set_vendor_response(uuid, uuid, text) from public, anon, authenticated;
revoke execute on function purge_reports() from public, anon, authenticated;
grant execute on function submit_review_report(uuid, text, text, text) to service_role;
grant execute on function decide_review_reports(uuid, uuid, text, text, text) to service_role;
grant execute on function set_vendor_response(uuid, uuid, text) to service_role;
grant execute on function purge_reports() to service_role;
