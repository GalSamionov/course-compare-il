-- סבב 5: האוסף השבועי. מסמך העיצוב של חלק 1, סעיפים 4, 5 ו-10. התוכנית: docs/superpowers/plans/2026-11-14-plan-5-weekly-scraper.md.
-- ההחלטה מה עולה לבד ומה עובר לתור נעשית ב-Python (scraper/lamadti_scraper/decide.py).
-- כאן: הטבלאות, ופונקציות שכותבות כל דף בטרנזקציה אחת. כולן ל-service_role בלבד, וכל הטבלאות סגורות לציבור.

-- ===== 1. דוח ריצה =====

create table scrape_runs (
  id bigint generated always as identity primary key,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running' check (status in ('running', 'completed', 'aborted', 'failed')),
  trigger text not null check (trigger in ('schedule', 'manual', 'local')),
  model text,
  pages_checked integer not null default 0,
  pages_unchanged integer not null default 0,
  pages_changed integer not null default 0,
  pages_new integer not null default 0,
  pages_failed integer not null default 0,
  pages_skipped integer not null default 0,
  changes_auto integer not null default 0,
  changes_queued integer not null default 0,
  courses_missing integer not null default 0,
  abort_reason text,
  -- פירוט לכל מוסד: מה נמצא, מה נכשל ולמה.
  report jsonb not null default '{}'::jsonb check (jsonb_typeof(report) = 'object'),
  check ((status = 'running') = (finished_at is null))
);
create index scrape_runs_started_idx on scrape_runs (started_at desc);

-- ===== 2. הדפים: המצב של כל כתובת בין ריצה לריצה =====

create table scrape_pages (
  id bigint generated always as identity primary key,
  institution_id uuid not null references institutions(id),
  url text not null unique check (url ~ '^https?://'),
  course_id uuid references courses(id),
  -- ignored: גל דחה את הקורס החדש. הדף לא נקרא יותר.
  state text not null default 'active' check (state in ('active', 'not_course', 'ignored')),
  last_hash text check (last_hash ~ '^[0-9a-f]{64}$'),
  -- החילוץ האחרון, כדי לזהות מה השתנה מאז ושינוי ניסוח בלבד.
  last_extracted jsonb,
  last_snapshot_id bigint,
  fail_count integer not null default 0 check (fail_count >= 0),
  missing_count integer not null default 0 check (missing_count >= 0),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz,
  last_fetched_at timestamptz,
  last_error text
);
create index scrape_pages_institution_idx on scrape_pages (institution_id);
-- קורס אחד, דף אחד: שני דפים לא מעדכנים את אותו קורס.
create unique index scrape_pages_one_page_per_course on scrape_pages (course_id) where course_id is not null;

-- ===== 3. עותקים של הדף: רק כשהתוכן השתנה =====

create table course_snapshots (
  id bigint generated always as identity primary key,
  run_id bigint not null references scrape_runs(id),
  page_id bigint not null references scrape_pages(id),
  course_id uuid references courses(id),
  fetched_at timestamptz not null,
  fetch_method text not null check (fetch_method in ('http', 'browser')),
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  page_text text not null,
  -- { is_course_page, category, truncated, fields: { שדה: { found, value, quote, confidence } } }
  extracted jsonb not null default '{}'::jsonb check (jsonb_typeof(extracted) = 'object'),
  model text,
  created_at timestamptz not null default now()
);
create index course_snapshots_course_idx on course_snapshots (course_id, fetched_at desc);
create index course_snapshots_page_idx on course_snapshots (page_id, fetched_at desc);
alter table scrape_pages
  add constraint scrape_pages_last_snapshot_fk foreign key (last_snapshot_id) references course_snapshots(id);

-- ===== 4. תור האישור (סעיף 10, "קורסים לאישור") =====

create table course_change_queue (
  id bigint generated always as identity primary key,
  run_id bigint references scrape_runs(id),
  page_id bigint references scrape_pages(id),
  snapshot_id bigint references course_snapshots(id),
  course_id uuid references courses(id),
  kind text not null check (kind in ('new_course', 'field', 'maybe_inactive', 'fetch_failed')),
  field text,
  old_value jsonb,
  new_value jsonb,
  quote text,
  confidence text check (confidence in ('high', 'medium', 'low')),
  reasons text[] not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'superseded')),
  decided_by uuid,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  check ((kind = 'field') = (field is not null)),
  check ((status in ('approved', 'rejected')) = (decided_at is not null)),
  check (course_id is not null or page_id is not null)
);
-- פריט ממתין אחד לכל קורס (או דף), סוג ושדה. פריט חדש מחליף את הקודם (superseded).
create unique index course_change_queue_one_pending
  on course_change_queue (kind, coalesce(field, ''), coalesce(course_id::text, 'page:' || page_id::text))
  where status = 'pending';
create index course_change_queue_pending_idx on course_change_queue (created_at) where status = 'pending';

-- ===== 5. יומן השינויים: כל שינוי שנכתב ל-courses (סעיף 4) =====

create table course_changes (
  id bigint generated always as identity primary key,
  course_id uuid not null references courses(id),
  field text not null,
  old_value jsonb,
  new_value jsonb,
  -- auto: עלה לבד. approved: גל החליט בתור. undo: גל ביטל שינוי קודם.
  source text not null check (source in ('auto', 'approved', 'undo')),
  approved_by uuid,
  queue_id bigint references course_change_queue(id),
  run_id bigint references scrape_runs(id),
  snapshot_id bigint references course_snapshots(id),
  reverts_id bigint references course_changes(id),
  quote text,
  created_at timestamptz not null default now(),
  check ((source = 'auto') = (approved_by is null)),
  check ((source = 'undo') = (reverts_id is not null))
);
create index course_changes_course_idx on course_changes (course_id, created_at desc);

-- העותקים והיומן לא משתנים ולא נמחקים (סעיף 4: "שורות ב-course_changes אי אפשר לעדכן או למחוק").
create trigger course_snapshots_append_only before update or delete on course_snapshots
  for each row execute function forbid_change();
create trigger course_snapshots_no_truncate before truncate on course_snapshots
  for each statement execute function forbid_change();
create trigger course_changes_append_only before update or delete on course_changes
  for each row execute function forbid_change();
create trigger course_changes_no_truncate before truncate on course_changes
  for each statement execute function forbid_change();

-- ===== 6. הרשאות: אין מדיניות, ולכן רק service_role (שעוקף RLS) =====

alter table scrape_runs enable row level security;
alter table scrape_pages enable row level security;
alter table course_snapshots enable row level security;
alter table course_change_queue enable row level security;
alter table course_changes enable row level security;
revoke all on scrape_runs, scrape_pages, course_snapshots, course_change_queue, course_changes from anon, authenticated;

-- ===== 7. תאריך העדכון של קורס =====
-- הקטלוג ממיין קורסים בלי ציון לפי updated_at (סעיף 8). בדיקה שבועית שלא שינתה כלום מעדכנת רק את
-- last_checked_at, ולא צריכה להזיז את הקורס בראש הרשימה.
create function courses_set_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (to_jsonb(new) - 'last_checked_at' - 'updated_at') = (to_jsonb(old) - 'last_checked_at' - 'updated_at') then
    new.updated_at := old.updated_at;
  else
    new.updated_at := now();
  end if;
  return new;
end $$;
drop trigger courses_updated_at on courses;
create trigger courses_updated_at before update on courses
  for each row execute function courses_set_updated_at();

-- ===== 8. עזרים פנימיים (בסכמה private, ש-PostgREST לא חושף) =====

grant usage on schema private to service_role;

-- הערך הנוכחי של שדה בקורס, כ-jsonb. null של SQL הופך ל-null של JSON, כדי שההשוואה תהיה פשוטה.
create function private.scraper_course_value(p_course_id uuid, p_field text)
returns jsonb
language sql stable
set search_path = ''
as $$
  select coalesce((select to_jsonb(c) -> p_field from public.courses c where c.id = p_course_id), 'null'::jsonb);
$$;

-- כתיבה של שדה אחד. רק השדות שהאוסף ממלא (scraper/lamadti_scraper/fields.py). כל השאר נדחה.
-- jsonb_populate_record ממיר את הערך לסוג של העמודה: תאריך, מספר, מערך טקסט או jsonb.
create function private.scraper_set_course_field(p_course_id uuid, p_field text, p_value jsonb)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if p_field is null or p_field not in (
    'title', 'site_price_ils', 'total_hours', 'lecture_hours', 'hands_on_hours', 'duration_months', 'schedule',
    'formats', 'region', 'time_slots', 'next_cohort_date', 'syllabus', 'admission', 'class_size_note', 'certificate',
    'institution_promises', 'video_url'
  ) then
    raise exception 'field % is not writable by the scraper', p_field using errcode = '42501';
  end if;
  execute format(
    'update public.courses c set %1$I = (jsonb_populate_record(null::public.courses, $1)).%1$I where c.id = $2',
    p_field
  ) using jsonb_build_object(p_field, coalesce(p_value, 'null'::jsonb)), p_course_id;
end $$;

-- פריט לתור. פריט ממתין קודם עם אותו מפתח מסומן superseded. מחזיר 1.
create function private.scraper_enqueue(
  p_run_id bigint, p_page_id bigint, p_snapshot_id bigint, p_course_id uuid, p_item jsonb
)
returns integer
language plpgsql
set search_path = ''
as $$
declare
  v_kind text := p_item ->> 'kind';
  v_field text := nullif(p_item ->> 'field', '');
begin
  update public.course_change_queue q
  set status = 'superseded'
  where q.status = 'pending' and q.kind = v_kind and coalesce(q.field, '') = coalesce(v_field, '')
    and coalesce(q.course_id::text, 'page:' || q.page_id::text) = coalesce(p_course_id::text, 'page:' || p_page_id::text);
  insert into public.course_change_queue
    (run_id, page_id, snapshot_id, course_id, kind, field, old_value, new_value, quote, confidence, reasons)
  values (
    p_run_id, p_page_id, p_snapshot_id, p_course_id, v_kind, v_field,
    p_item -> 'old', p_item -> 'new', p_item ->> 'quote', p_item ->> 'confidence',
    coalesce(array(select jsonb_array_elements_text(coalesce(p_item -> 'reasons', '[]'::jsonb))), '{}')
  );
  return 1;
end $$;

revoke execute on function private.scraper_course_value(uuid, text) from public, anon, authenticated;
revoke execute on function private.scraper_set_course_field(uuid, text, jsonb) from public, anon, authenticated;
revoke execute on function private.scraper_enqueue(bigint, bigint, bigint, uuid, jsonb) from public, anon, authenticated;
grant execute on function private.scraper_course_value(uuid, text) to service_role;
grant execute on function private.scraper_set_course_field(uuid, text, jsonb) to service_role;
grant execute on function private.scraper_enqueue(bigint, bigint, bigint, uuid, jsonb) to service_role;

-- ===== 9. הפונקציות של האוסף =====

-- ריצה חדשה. ריצה ש"רצה" יותר מ-12 שעות נפלה באמצע: מסומנת failed. שתי ריצות במקביל אסורות.
create function scraper_start_run(p_trigger text, p_model text)
returns bigint
language plpgsql
set search_path = ''
as $$
declare
  v_id bigint;
begin
  update public.scrape_runs
  set status = 'failed', finished_at = now(), abort_reason = 'did not finish (stale)'
  where status = 'running' and started_at < now() - interval '12 hours';
  if exists (select 1 from public.scrape_runs where status = 'running') then
    raise exception 'another scraper run is still running' using errcode = '55006';
  end if;
  insert into public.scrape_runs (trigger, model) values (p_trigger, p_model) returning id into v_id;
  return v_id;
end $$;

-- דף אחד, בטרנזקציה אחת. p_page הוא PagePlan.payload() מ-decide.py:
-- { institution_id, url, outcome, fetched_at, course_id, error, snapshot, new_course, auto_changes, queue }
-- מחזיר { auto, queued } לדוח. שינוי אוטומטי נכתב רק אם הערך במסד עדיין זהה ל-old, אחרת הוא עובר לתור.
create function scraper_apply_page(p_run_id bigint, p_page jsonb)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_outcome text := p_page ->> 'outcome';
  v_url text := p_page ->> 'url';
  v_institution uuid := (p_page ->> 'institution_id')::uuid;
  v_fetched timestamptz := coalesce((p_page ->> 'fetched_at')::timestamptz, now());
  v_new_course jsonb := nullif(p_page -> 'new_course', 'null'::jsonb);
  v_page public.scrape_pages%rowtype;
  v_course uuid;
  v_snapshot bigint;
  v_item jsonb;
  v_field text;
  v_auto integer := 0;
  v_queued integer := 0;
begin
  if v_outcome is null or v_outcome not in ('unchanged', 'changed', 'not_course', 'failed') then
    raise exception 'unknown outcome %', v_outcome using errcode = '22023';
  end if;
  if not exists (select 1 from public.scrape_runs where id = p_run_id and status = 'running') then
    raise exception 'run % is not running', p_run_id using errcode = '55000';
  end if;

  insert into public.scrape_pages (institution_id, url, course_id)
  values (v_institution, v_url, nullif(p_page ->> 'course_id', '')::uuid)
  on conflict (url) do nothing;
  select * into v_page from public.scrape_pages where url = v_url for update;
  if v_page.institution_id <> v_institution then
    raise exception 'page % belongs to another institution', v_url using errcode = '22023';
  end if;
  v_course := v_page.course_id;
  update public.scrape_pages set last_seen_at = now(), missing_count = 0 where id = v_page.id;

  -- דף שלא נטען: נבדק שוב בשבוע הבא. בפעם השלישית ברציפות נכנס לתור (סעיף 5, "כשמשהו נכשל").
  if v_outcome = 'failed' then
    update public.scrape_pages
    set fail_count = fail_count + 1, last_error = left(p_page ->> 'error', 300)
    where id = v_page.id
    returning fail_count into v_page.fail_count;
    if v_page.fail_count = 3 then
      v_queued := private.scraper_enqueue(p_run_id, v_page.id, null, v_course, jsonb_build_object(
        'kind', 'fetch_failed', 'reasons', jsonb_build_array('failed_3_times', left(p_page ->> 'error', 100))));
    end if;
    return jsonb_build_object('auto', 0, 'queued', v_queued);
  end if;

  update public.scrape_pages set fail_count = 0, last_error = null, last_fetched_at = v_fetched where id = v_page.id;
  if v_course is not null then
    update public.courses set last_checked_at = v_fetched where id = v_course;
  end if;
  if v_outcome = 'unchanged' then
    return jsonb_build_object('auto', 0, 'queued', 0);
  end if;

  -- קורס חדש: טיוטה, שהציבור לא רואה (RLS: status <> 'draft').
  if v_new_course is not null and v_course is null then
    insert into public.courses (slug, institution_id, category_id, title, status, page_url, last_checked_at)
    values (v_new_course ->> 'slug', v_institution, (v_new_course ->> 'category_id')::uuid,
            v_new_course ->> 'title', 'draft', v_url, v_fetched)
    returning id into v_course;
    for v_field in select jsonb_object_keys(coalesce(v_new_course -> 'fields', '{}'::jsonb)) loop
      perform private.scraper_set_course_field(v_course, v_field, v_new_course -> 'fields' -> v_field);
    end loop;
    update public.scrape_pages set course_id = v_course where id = v_page.id;
  end if;

  insert into public.course_snapshots
    (run_id, page_id, course_id, fetched_at, fetch_method, content_hash, page_text, extracted, model)
  values (
    p_run_id, v_page.id, v_course, v_fetched,
    p_page -> 'snapshot' ->> 'fetch_method', p_page -> 'snapshot' ->> 'content_hash', p_page -> 'snapshot' ->> 'page_text',
    coalesce(p_page -> 'snapshot' -> 'extracted', '{}'::jsonb), p_page -> 'snapshot' ->> 'model'
  )
  returning id into v_snapshot;
  update public.scrape_pages
  set last_hash = p_page -> 'snapshot' ->> 'content_hash',
      last_extracted = p_page -> 'snapshot' -> 'extracted',
      last_snapshot_id = v_snapshot,
      state = case when v_outcome = 'not_course' then 'not_course' else 'active' end
  where id = v_page.id;

  for v_item in select * from jsonb_array_elements(coalesce(p_page -> 'auto_changes', '[]'::jsonb)) loop
    v_field := v_item ->> 'field';
    if private.scraper_course_value(v_course, v_field) = coalesce(v_item -> 'old', 'null'::jsonb) then
      perform private.scraper_set_course_field(v_course, v_field, v_item -> 'new');
      insert into public.course_changes (course_id, field, old_value, new_value, source, run_id, snapshot_id, quote)
      values (v_course, v_field, v_item -> 'old', v_item -> 'new', 'auto', p_run_id, v_snapshot, v_item ->> 'quote');
      v_auto := v_auto + 1;
    else
      -- הערך במסד השתנה מאז שהאוסף קרא אותו (גל תיקן בינתיים): לא דורסים, שואלים.
      v_queued := v_queued + private.scraper_enqueue(p_run_id, v_page.id, v_snapshot, v_course,
        jsonb_build_object('kind', 'field', 'field', v_field, 'old', private.scraper_course_value(v_course, v_field),
                           'new', v_item -> 'new', 'quote', v_item ->> 'quote', 'confidence', 'high',
                           'reasons', jsonb_build_array('changed_since_read')));
    end if;
  end loop;

  for v_item in select * from jsonb_array_elements(coalesce(p_page -> 'queue', '[]'::jsonb)) loop
    if v_course is null and v_item ->> 'kind' <> 'fetch_failed' then
      continue;  -- דף שאינו קורס ולא מקושר לקורס: אין מה לשאול
    end if;
    v_queued := v_queued + private.scraper_enqueue(p_run_id, v_page.id, v_snapshot, v_course, v_item);
  end loop;

  return jsonb_build_object('auto', v_auto, 'queued', v_queued, 'course_id', v_course);
end $$;

-- דפים מוכרים של המוסד שלא נמצאו בגילוי הפעם. בפעם השנייה ברציפות הקורס מסומן "ייתכן שאינו פעיל"
-- ונכנס לתור (סעיף 5.6). האוסף קורא לזה רק כשהגילוי של המוסד הצליח. מחזיר כמה קורסים סומנו.
create function scraper_mark_missing(p_run_id bigint, p_institution_id uuid, p_seen_urls text[])
returns integer
language plpgsql
set search_path = ''
as $$
declare
  v_page record;
  v_marked integer := 0;
begin
  if not exists (select 1 from public.scrape_runs where id = p_run_id and status = 'running') then
    raise exception 'run % is not running', p_run_id using errcode = '55000';
  end if;
  for v_page in
    update public.scrape_pages p
    set missing_count = p.missing_count + 1
    where p.institution_id = p_institution_id and p.state = 'active' and not (p.url = any(coalesce(p_seen_urls, '{}')))
    returning p.id, p.course_id, p.missing_count
  loop
    if v_page.missing_count = 2 and v_page.course_id is not null then
      update public.courses set status = 'maybe_inactive' where id = v_page.course_id and status = 'active';
      if found then
        insert into public.course_changes (course_id, field, old_value, new_value, source, run_id)
        values (v_page.course_id, 'status', '"active"', '"maybe_inactive"', 'auto', p_run_id);
        perform private.scraper_enqueue(p_run_id, v_page.id, null, v_page.course_id,
          '{"kind": "maybe_inactive", "reasons": ["missing_twice"]}'::jsonb);
        v_marked := v_marked + 1;
      end if;
    end if;
  end loop;
  return v_marked;
end $$;

-- סוף הריצה: הסטטוס, המונים והדוח (סעיף 5, "סיכום הריצה").
create function scraper_finish_run(p_run_id bigint, p_status text, p_counts jsonb, p_report jsonb, p_abort_reason text default null)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if p_status not in ('completed', 'aborted', 'failed') then
    raise exception 'unknown status %', p_status using errcode = '22023';
  end if;
  update public.scrape_runs
  set status = p_status,
      finished_at = now(),
      pages_checked = coalesce((p_counts ->> 'pages_checked')::integer, 0),
      pages_unchanged = coalesce((p_counts ->> 'pages_unchanged')::integer, 0),
      pages_changed = coalesce((p_counts ->> 'pages_changed')::integer, 0),
      pages_new = coalesce((p_counts ->> 'pages_new')::integer, 0),
      pages_failed = coalesce((p_counts ->> 'pages_failed')::integer, 0),
      pages_skipped = coalesce((p_counts ->> 'pages_skipped')::integer, 0),
      changes_auto = coalesce((p_counts ->> 'changes_auto')::integer, 0),
      changes_queued = coalesce((p_counts ->> 'changes_queued')::integer, 0),
      courses_missing = coalesce((p_counts ->> 'courses_missing')::integer, 0),
      report = coalesce(p_report, '{}'::jsonb),
      abort_reason = p_abort_reason
  where id = p_run_id and status = 'running';
  if not found then
    raise exception 'run % is not running', p_run_id using errcode = '55000';
  end if;
end $$;

-- ===== 10. ההחלטות של גל בתור (ממשק הניהול, סעיף 10) =====

-- אישור, או תיקון (p_value): השדה נכתב, קורס חדש עולה לאוויר, קורס שנעלם מוסר.
create function approve_course_change(p_queue_id bigint, p_admin_id uuid, p_value jsonb default null)
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

  if v_item.kind = 'field' then
    v_old := private.scraper_course_value(v_item.course_id, v_item.field);
    v_new := coalesce(p_value, v_item.new_value, 'null'::jsonb);
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
end $$;

-- דחייה: השדה נשאר כמו שהוא. קורס חדש שנדחה נשאר טיוטה, והדף שלו לא נקרא יותר.
-- קורס שסומן "ייתכן שאינו פעיל" חוזר לפעיל.
create function reject_course_change(p_queue_id bigint, p_admin_id uuid)
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
end $$;

-- ביטול בלחיצה של שינוי שנכתב (סעיף 5.6): הערך הקודם חוזר, ונרשמת שורה חדשה. רק אם השדה לא השתנה מאז.
create function undo_course_change(p_change_id bigint, p_admin_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_change public.course_changes%rowtype;
  v_current jsonb;
begin
  if not exists (select 1 from public.admins where user_id = p_admin_id) then
    raise exception 'not an admin' using errcode = '42501';
  end if;
  select * into v_change from public.course_changes where id = p_change_id;
  if not found then
    raise exception 'change % not found', p_change_id using errcode = 'P0002';
  end if;
  perform 1 from public.courses where id = v_change.course_id for update;
  v_current := private.scraper_course_value(v_change.course_id, v_change.field);
  if v_current <> coalesce(v_change.new_value, 'null'::jsonb) then
    raise exception 'field % changed again since change %', v_change.field, p_change_id using errcode = '40001';
  end if;
  if v_change.field = 'status' then
    update public.courses set status = (v_change.old_value #>> '{}')::public.course_status where id = v_change.course_id;
  else
    perform private.scraper_set_course_field(v_change.course_id, v_change.field, v_change.old_value);
  end if;
  insert into public.course_changes (course_id, field, old_value, new_value, source, approved_by, reverts_id)
  values (v_change.course_id, v_change.field, v_change.new_value, v_change.old_value, 'undo', p_admin_id, v_change.id);
end $$;

revoke execute on function scraper_start_run(text, text) from public, anon, authenticated;
revoke execute on function scraper_apply_page(bigint, jsonb) from public, anon, authenticated;
revoke execute on function scraper_mark_missing(bigint, uuid, text[]) from public, anon, authenticated;
revoke execute on function scraper_finish_run(bigint, text, jsonb, jsonb, text) from public, anon, authenticated;
revoke execute on function approve_course_change(bigint, uuid, jsonb) from public, anon, authenticated;
revoke execute on function reject_course_change(bigint, uuid) from public, anon, authenticated;
revoke execute on function undo_course_change(bigint, uuid) from public, anon, authenticated;
grant execute on function scraper_start_run(text, text) to service_role;
grant execute on function scraper_apply_page(bigint, jsonb) to service_role;
grant execute on function scraper_mark_missing(bigint, uuid, text[]) to service_role;
grant execute on function scraper_finish_run(bigint, text, jsonb, jsonb, text) to service_role;
grant execute on function approve_course_change(bigint, uuid, jsonb) to service_role;
grant execute on function reject_course_change(bigint, uuid) to service_role;
grant execute on function undo_course_change(bigint, uuid) to service_role;
