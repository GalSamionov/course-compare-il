-- הוספת קורס מקישור. הסשן: docs/sessions/2026-11-15-add-course-link.md.
--
-- הרבה קורסים בישראל לא נמצאים באתר של מוסד: מרצים עצמאיים מוכרים אותם במודעות בפייסבוק ובאינסטגרם, או בדף
-- נחיתה (Wix, Kajabi). האוסף קורא רק את המוסדות שב-scraper/institutions.yaml, ואסור לו לקרוא את פייסבוק.
-- לכן אנשים מוסיפים אותם בעצמם, מקישור:
--   1. בוגר ב-/review (מחובר): הקישור, שם הקורס, שם המרצה או המוסד, ותחום אם יש. נוצר קורס טיוטה, שאינו ציבורי
--      כמו טיוטה של האוסף, והבוגר כותב עליו ביקורת כרגיל, עם הוכחה. רק מי שהוסיף את הקורס מתחיל עליו ביקורת.
--   2. כל אחד ב-/request-course: קישור, ושם והערה אם רוצים. בלי קורס טיוטה.
-- שניהם בתור אחד ב-/admin. אישור: הקורס עולה, והקישור נכנס לאוסף כמו בקשה של מוסד (scrape_pages, source = 'request').
-- קישור לרשת חברתית (פייסבוק, אינסטגרם ודומיהן) לא נכנס לאוסף אף פעם.
--
-- לאורח ולמשתמש מחובר אין קריאה ואין כתיבה בטבלה. הכתיבה רק דרך השרת, עם המפתח הסודי, אחרי שהשרת בדק מי
-- המשתמש (getUser). חריגים: my_course_links() ו-my_course_link() מחזירות למשתמש רק את השורות שלו,
-- ו-private.is_own_link_draft() בודקת במדיניות של הביקורות.
--
-- קודי שגיאה (web/src/lib/course-links/messages.ts):
--   LM040  כבר 3 קורסים חדשים מהמשתמש הזה ביממה
--   LM041  יותר מדי קורסים חדשים ביממה, מכל המשתמשים
--   LM042  כבר 3 בקשות מאותה כתובת ביממה (/request-course)
--   LM043  יותר מדי בקשות ביממה, מכל הכתובות
--   LM044  התחום לא קיים, או שאין סוג קורס
--   LM050  לאישור צריך תחום
--   LM051  התחום מסוג אחר מהשאלון שהבוגר כבר ענה עליו
--   LM052  הקורס למיזוג לא נמצא, או שהוא עוד טיוטה
--   LM053  לבוגר כבר יש ביקורת על אותו מחזור בקורס שנבחר
--   LM054  לאישור של בקשה צריך מוסד קיים, או שם למרצה חדש
--   LM012  (כמו בבקשה של מוסד) הקישור כבר אצל האוסף, תחת מוסד או קורס אחר

-- ===== 1. מוסד בטיוטה: מרצה עצמאי שבוגר הוסיף לא מופיע עד שגל מאשר =====

alter table institutions
  add column status text not null default 'active' check (status in ('draft', 'active'));
drop policy "institutions are public" on institutions;
create policy "institutions are public" on institutions for select using (status = 'active');

-- ===== 2. קורס טיוטה בלי תחום: מרצה בתחום שעוד אין באתר (למשל לק ג'ל) =====
-- רק טיוטה. לפני האישור גל בוחר תחום, והמסד לא מעלה קורס בלי תחום.

alter table courses alter column category_id drop not null;
alter table courses add constraint courses_category_unless_draft check (category_id is not null or status = 'draft');

-- ===== 3. היומן: גם החלטות על קורסים מקישור =====

alter table audit_log add column course_submission_id bigint;
alter table audit_log drop constraint audit_log_action_check;
alter table audit_log add constraint audit_log_action_check check (action in (
  'approve', 'reject', 'request_more', 'author_delete', 'cleanup_delete',
  'course_approve', 'course_edit', 'course_reject',
  'join_request_approve', 'join_request_reject',
  'report_keep', 'report_hide', 'report_remove',
  'vendor_response', 'vendor_response_remove',
  'company_request_contacted', 'company_request_closed',
  'course_link_approve', 'course_link_merge', 'course_link_reject'
));
alter table audit_log drop constraint audit_log_one_target;
alter table audit_log add constraint audit_log_one_target check (
  num_nonnulls(review_id, course_queue_id, institution_request_id, company_request_id, course_submission_id) = 1
  and case
    when action in ('course_approve', 'course_edit', 'course_reject') then course_queue_id is not null
    when action in ('join_request_approve', 'join_request_reject') then institution_request_id is not null
    when action in ('company_request_contacted', 'company_request_closed') then company_request_id is not null
    when action in ('course_link_approve', 'course_link_merge', 'course_link_reject') then course_submission_id is not null
    else review_id is not null
  end
);
create index audit_log_course_submission_idx on audit_log (course_submission_id) where course_submission_id is not null;

-- ===== 4. הקישורים שנשלחו =====

create table course_submissions (
  id bigint generated always as identity primary key,
  -- review: בוגר מחובר ב-/review, עם קורס טיוטה. request: כל אחד ב-/request-course, בלי קורס.
  source text not null check (source in ('review', 'request')),
  -- השרת כבר נרמל ובדק: http(s), בלי שם משתמש וסיסמה, בלי # ובלי פרמטרים של מעקב. הכתובת לא נפתחת בשרת.
  url text not null check (char_length(url) <= 500 and url ~ '^https?://[^\s@]+$'),
  -- private.course_url_key(url), לזיהוי כפילויות.
  url_key text not null check (char_length(url_key) > 0),
  -- review: מה שהבוגר כתב. request: השם, אם כתבו.
  course_title text check (char_length(course_title) between 2 and 160),
  institution_name text check (char_length(institution_name) between 2 and 120),
  category_id uuid references categories(id),
  -- השאלון שהבוגר ענה עליו: מהתחום, או מהבחירה שלו כשאין תחום מתאים.
  course_type course_type,
  -- רק ב-request. רק לגל. נמחק 90 יום אחרי ההחלטה (purge_course_submissions).
  note text check (char_length(note) <= 500),
  -- רק ב-review. מחיקת החשבון משאירה את הקישור ואת השם, בלי המשתמש.
  submitted_by uuid references auth.users(id) on delete set null,
  -- רק ב-request: HMAC-SHA256 של כתובת ה-IP, למגבלת הקצב. נמחק אחרי יומיים.
  client_hash text check (client_hash ~ '^[0-9a-f]{64}$'),
  -- רק ב-review: קורס הטיוטה. במיזוג הטיוטה נמחקת, והשורה נשארת עם merged_into.
  course_id uuid references courses(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'merged', 'rejected')),
  -- בדחייה: הסיבה. בוגר רואה אותה בעמוד הכתיבה.
  decision_reason text check (char_length(decision_reason) between 1 and 300),
  merged_into uuid references courses(id),
  -- הדף שנכנס לאוסף באישור. null: לא נכנס (רשת חברתית, או שעוד לא אושר).
  page_id bigint references scrape_pages(id),
  decided_by uuid,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  check ((status = 'pending') = (decided_at is null)),
  check ((status = 'merged') = (merged_into is not null)),
  check (status <> 'rejected' or decision_reason is not null),
  check (source = 'review' or (submitted_by is null and course_id is null and category_id is null and course_type is null
                               and institution_name is null)),
  check (source = 'request' or (client_hash is null and note is null and course_title is not null
                                and institution_name is not null and course_type is not null))
);
create index course_submissions_pending_idx on course_submissions (created_at) where status = 'pending';
create index course_submissions_created_idx on course_submissions (created_at);
create index course_submissions_user_idx on course_submissions (submitted_by, created_at) where submitted_by is not null;
create index course_submissions_client_idx on course_submissions (client_hash, created_at) where client_hash is not null;
create index course_submissions_course_idx on course_submissions (course_id) where course_id is not null;
create index course_submissions_url_key_idx on course_submissions (url_key);
-- בוגר אחד, קורס אחד, פעם אחת בתור. ובקשה אחת לכל קישור.
create unique index course_submissions_one_per_user on course_submissions (course_id, submitted_by)
  where status = 'pending' and submitted_by is not null;
create unique index course_submissions_one_request_per_url on course_submissions (url_key)
  where status = 'pending' and source = 'request';

alter table course_submissions enable row level security;
revoke all on course_submissions from anon, authenticated;

-- ===== 5א. אינדקסים לזיהוי כפילות =====
-- הבדיקה "כבר באתר" רצה בכל שליחה, גם מהטופס הציבורי. בלי אינדקס היא נרמלה כל קורס וכל דף בכל פעם.
-- הפונקציות immutable. רק service_role ובעל המסד כותבים לטבלאות האלה, ולשניהם יש הרשאה להריץ אותן.

create index courses_url_key_idx on courses (private.course_url_key(page_url));
create index courses_title_key_idx on courses (private.course_title_key(title));
create index scrape_pages_url_key_idx on scrape_pages (private.course_url_key(url));

-- ===== 5. עזרים =====

-- רשתות חברתיות: לא קוראים אותן אף פעם (תנאי השימוש שלהן). אותה רשימה כמו SOCIAL_HOSTS ב-web/src/lib/course-links/url.ts.
create function private.is_social_url(p_url text)
returns boolean
language sql immutable
set search_path = ''
as $$
  select coalesce((
    select bool_or(h = d or h like '%.' || d)
    -- נקודה בסוף השם (facebook.com.) היא אותו אתר.
    from (select rtrim(private.url_host(p_url), '.') as h) x,
         unnest(array[
           'facebook.com', 'fb.com', 'fb.me', 'fb.watch', 'instagram.com', 'instagr.am', 'threads.net', 'threads.com',
           'whatsapp.com', 'wa.me', 'tiktok.com', 'linkedin.com', 'lnkd.in', 'x.com', 'twitter.com', 't.co',
           'youtube.com', 'youtu.be', 'linktr.ee'
         ]) d
  ), false);
$$;

-- slug מטקסט: רק אותיות לטיניות וספרות. שם בעברית נותן את ברירת המחדל.
create function private.ascii_slug(p_text text, p_fallback text, p_max integer)
returns text
language sql immutable
set search_path = ''
as $$
  select coalesce(
    nullif(btrim(left(btrim(regexp_replace(lower(coalesce(p_text, '')), '[^a-z0-9]+', '-', 'g'), '-'), p_max), '-'), ''),
    p_fallback);
$$;

-- שש אותיות אקראיות לסוף ה-slug, כדי ששני קורסים באותו שם לא יתנגשו.
create function private.short_token()
returns text
language sql volatile
set search_path = ''
as $$
  select substr(md5(random()::text || clock_timestamp()::text), 1, 6);
$$;

-- סוג השאלון של קורס מקישור: מהתחום, ואם אין, מהבוגר הראשון שהוסיף אותו.
create function private.link_course_type(p_course_id uuid)
returns public.course_type
language sql stable
set search_path = ''
as $$
  select coalesce(
    (select cat.course_type from public.courses c join public.categories cat on cat.id = c.category_id where c.id = p_course_id),
    (select s.course_type from public.course_submissions s
     where s.course_id = p_course_id and s.course_type is not null
     order by s.created_at, s.id limit 1));
$$;

-- מגבלת הקצב של בוגר: 3 קורסים חדשים ביממה, ו-100 בסך הכול. נקראת רק כשבאמת נוספת שורה.
create function private.course_link_quota(p_user_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.course_submissions s
      where s.submitted_by = p_user_id and s.source = 'review' and s.created_at > now() - interval '1 day') >= 3 then
    raise exception 'too many course links from this user today' using errcode = 'LM040';
  end if;
  if (select count(*) from public.course_submissions s
      where s.source = 'review' and s.created_at > now() - interval '1 day') >= 100 then
    raise exception 'too many course links today' using errcode = 'LM041';
  end if;
end $$;

-- קורס שכבר באתר (לא טיוטה) עם אותו קישור: בדף הקורס, בדף של האוסף, או בקישור שכבר אושר או מוזג אליו.
-- שלוש שאילתות נפרדות, כל אחת על אינדקס (סעיף 5א): הטפסים פתוחים, ובדיקה כזו לא עוברת על כל הקורסים.
create function private.live_course_by_url(p_url_key text)
returns uuid
language sql stable
set search_path = ''
as $$
  select c.id
  from public.courses c
  where c.status <> 'draft'
    and c.id in (
      select c2.id from public.courses c2 where private.course_url_key(c2.page_url) = p_url_key
      union
      select p.course_id from public.scrape_pages p where private.course_url_key(p.url) = p_url_key and p.course_id is not null
      union
      select coalesce(s.merged_into, s.course_id) from public.course_submissions s
      where s.url_key = p_url_key and s.status in ('approved', 'merged'))
  order by (c.status = 'removed'), c.created_at
  limit 1;
$$;

-- הקישור נכנס לאוסף: שורה ב-scrape_pages, כמו באישור של בקשה ממוסד (approve_institution_request).
-- האוסף קורא אותה בריצה הבאה של המוסד, אם המוסד ב-scraper/institutions.yaml והקישור באתר שלו.
create function private.link_page(p_institution_id uuid, p_url text, p_course_id uuid)
returns bigint
language plpgsql
set search_path = ''
as $$
declare
  v_page public.scrape_pages%rowtype;
begin
  insert into public.scrape_pages (institution_id, url, source, course_id)
  values (p_institution_id, p_url, 'request', p_course_id)
  on conflict (url) do nothing;
  select * into v_page from public.scrape_pages where url = p_url for update;
  if v_page.institution_id <> p_institution_id
     or (p_course_id is not null and v_page.course_id is not null and v_page.course_id <> p_course_id) then
    raise exception 'the page belongs to another institution or course' using errcode = 'LM012';
  end if;
  update public.scrape_pages
  set source = 'request', state = 'active', missing_count = 0, course_id = coalesce(p_course_id, course_id)
  where id = v_page.id;
  return v_page.id;
end $$;

-- מוסד בטיוטה שכבר אין לו קורס: נמחק. מוסד פעיל, או שמשהו עוד מפנה אליו, נשאר.
create function private.drop_unused_draft_institution(p_institution_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
begin
  delete from public.institutions i
  where i.id = p_institution_id and i.status = 'draft'
    and not exists (select 1 from public.courses c where c.institution_id = i.id)
    and not exists (select 1 from public.scrape_pages p where p.institution_id = i.id);
exception when foreign_key_violation then
  null;
end $$;

-- ===== 6. ביקורת על קורס טיוטה: רק מי שהוסיף אותו, ורק כל עוד הוא ממתין =====

create function private.is_own_link_draft(p_course_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.course_submissions s
    join public.courses c on c.id = s.course_id
    where s.course_id = p_course_id and s.source = 'review' and s.status = 'pending'
      and s.submitted_by = (select auth.uid()) and c.status = 'draft'
  );
$$;
revoke execute on function private.is_own_link_draft(uuid) from public, anon;
grant execute on function private.is_own_link_draft(uuid) to authenticated;

drop policy "authors start drafts" on reviews;
create policy "authors start drafts" on reviews
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and status = 'draft'
    and (exists (select 1 from courses c where c.id = course_id and c.status <> 'draft')
         or private.is_own_link_draft(course_id))
    and private.open_drafts_of_caller() < 20
  );

-- ===== 7. בוגר ב-/review: הקישור, שם הקורס ושם המרצה או המוסד =====
--
-- השרת קורא אחרי getUser, עם המזהה של המשתמש. מחזירה:
--   {"outcome": "existing", course_id, course_slug, course_title}: הקורס כבר באתר. הבוגר כותב עליו, ושום דבר לא נוסף.
--   {"outcome": "draft", course_id, course_slug, course_title}: קורס טיוטה, חדש או שבוגר אחר כבר הוסיף. הבוגר כותב עליו.
-- כפילות: אותו קישור אחרי נרמול, או אותו שם קורס אצל אותו מוסד (לפי השם, או לפי האתר שלו).
create function submit_course_link(
  p_user_id uuid, p_url text, p_title text, p_institution_name text,
  p_category_id uuid default null, p_course_type public.course_type default null
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_url text := btrim(coalesce(p_url, ''));
  v_title text := btrim(regexp_replace(coalesce(p_title, ''), '\s+', ' ', 'g'));
  v_inst text := btrim(regexp_replace(coalesce(p_institution_name, ''), '\s+', ' ', 'g'));
  v_type public.course_type := p_course_type;
  v_url_key text;
  v_title_key text;
  v_inst_key text;
  v_host text;
  v_social boolean;
  v_course public.courses%rowtype;
  v_course_id uuid;
  v_institution public.institutions%rowtype;
begin
  -- משתמש שלא קיים נעצר במפתח הזר כשנוספת שורה. "כבר באתר" מחזיר רק מידע ציבורי.
  if p_user_id is null then
    raise exception 'no user' using errcode = '22023';
  end if;
  if char_length(v_url) > 500 or v_url !~ '^https?://[^\s@]+$' then
    raise exception 'bad url' using errcode = '22023';
  end if;
  if char_length(v_title) not between 2 and 160 or char_length(v_inst) not between 2 and 120 then
    raise exception 'bad course or institution name' using errcode = '22023';
  end if;
  if p_category_id is not null then
    select c.course_type into v_type from public.categories c where c.id = p_category_id;
    if not found or (p_course_type is not null and p_course_type <> v_type) then
      raise exception 'unknown category' using errcode = 'LM044';
    end if;
  end if;
  if v_type is null then
    raise exception 'no course type' using errcode = 'LM044';
  end if;

  v_url_key := private.course_url_key(v_url);
  v_title_key := private.course_title_key(v_title);
  v_inst_key := private.course_title_key(v_inst);
  v_social := private.is_social_url(v_url);
  -- האתר של מרצה הוא סימן שזה אותו מוסד. דף בפייסבוק לא.
  v_host := case when v_social then null else private.url_host(v_url) end;

  -- 1. כבר באתר: אותו קישור, או אותו שם אצל אותו מוסד. לפני הנעילה: רק קריאה, ועל אינדקסים.
  v_course_id := private.live_course_by_url(v_url_key);
  if v_course_id is null then
    select c.id into v_course_id
    from public.courses c
    join public.institutions i on i.id = c.institution_id
    where c.status <> 'draft'
      and private.course_title_key(c.title) = v_title_key
      and (private.course_title_key(i.name) = v_inst_key or (v_host is not null and private.url_host(i.website) = v_host))
    order by (c.status = 'removed'), c.created_at
    limit 1;
  end if;
  if v_course_id is not null then
    select * into v_course from public.courses where id = v_course_id;
    return jsonb_build_object('outcome', 'existing', 'course_id', v_course.id, 'course_slug', v_course.slug,
                              'course_title', v_course.title);
  end if;

  -- מכאן נעילה אחת לטופס: שתי שליחות במקביל לא יוצרות שני קורסים, ולא עוברות את המגבלה.
  perform pg_advisory_xact_lock(hashtext('public.course_submissions'));

  -- 2. בוגר (אולי אותו בוגר) כבר הוסיף אותו, והוא עוד ממתין: ממשיכים על אותה טיוטה.
  -- הבוגר רואה בה רק את מה שהוא עצמו כתב (my_course_link), ולכן לא יודע שמישהו אחר הוסיף אותה.
  select c.* into v_course
  from public.course_submissions s
  join public.courses c on c.id = s.course_id and c.status = 'draft'
  join public.institutions i on i.id = c.institution_id
  where s.source = 'review' and s.status = 'pending'
    and (s.url_key = v_url_key
      or (private.course_title_key(c.title) = v_title_key and private.course_title_key(i.name) = v_inst_key))
  order by s.created_at, s.id
  limit 1;
  if found then
    if not exists (select 1 from public.course_submissions s
                   where s.course_id = v_course.id and s.submitted_by = p_user_id and s.status = 'pending') then
      perform private.course_link_quota(p_user_id);
      insert into public.course_submissions (source, url, url_key, course_title, institution_name, category_id, course_type,
                                             submitted_by, course_id)
      values ('review', v_url, v_url_key, v_title, v_inst, p_category_id, v_type, p_user_id, v_course.id);
    end if;
    return jsonb_build_object('outcome', 'draft', 'course_id', v_course.id, 'course_slug', v_course.slug,
                              'course_title', v_course.title);
  end if;

  -- 3. קורס חדש, טיוטה. המוסד: אחד שכבר במסד (אותו שם, או אתר באותו מארח), או מרצה עצמאי חדש, בטיוטה.
  perform private.course_link_quota(p_user_id);
  select i.* into v_institution
  from public.institutions i
  where private.course_title_key(i.name) = v_inst_key
     or (v_host is not null and private.url_host(i.website) = v_host)
  order by (private.course_title_key(i.name) = v_inst_key) desc, (i.status = 'active') desc, i.created_at
  limit 1;
  if not found then
    insert into public.institutions (slug, name, kind, status)
    values (private.ascii_slug(v_inst, 'independent', 40) || '-' || private.short_token(), v_inst, 'independent', 'draft')
    returning * into v_institution;
  end if;

  insert into public.courses (slug, institution_id, category_id, title, status, page_url)
  values (
    private.ascii_slug(v_institution.slug, 'course', 30) || '-' || private.ascii_slug(v_title, 'course', 40)
      || '-' || private.short_token(),
    v_institution.id, p_category_id, v_title, 'draft',
    -- דף בפייסבוק הוא לא דף הקורס שיופיע באתר. הקישור עצמו נשמר בשורה של הבוגר.
    case when v_social then null else v_url end
  )
  returning * into v_course;
  insert into public.course_submissions (source, url, url_key, course_title, institution_name, category_id, course_type,
                                         submitted_by, course_id)
  values ('review', v_url, v_url_key, v_title, v_inst, p_category_id, v_type, p_user_id, v_course.id);
  return jsonb_build_object('outcome', 'draft', 'course_id', v_course.id, 'course_slug', v_course.slug,
                            'course_title', v_course.title);
end $$;

-- ===== 8. כל אחד ב-/request-course: קישור, ושם והערה אם רוצים =====
--
-- מחזירה {"outcome": "existing", course_slug, course_title} כשהקורס כבר באתר (זה מידע ציבורי), ואחרת {"outcome": "sent"}.
-- קישור שכבר ממתין (בקשה, או קורס של בוגר) מקבל את אותה תשובה, ושום דבר לא נוסף: לא מגלים מה אחרים שלחו.
-- מגבלת קצב: 3 ביממה לכל כתובת, ו-50 בסך הכול. כמו בבקשה של מוסד.
create function submit_course_request(p_url text, p_name text, p_note text, p_client_hash text)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_url text := btrim(coalesce(p_url, ''));
  v_name text := nullif(btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g')), '');
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_url_key text;
  v_course public.courses%rowtype;
  v_course_id uuid;
begin
  if p_client_hash is null or p_client_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'bad client hash' using errcode = '22023';
  end if;
  if char_length(v_url) > 500 or v_url !~ '^https?://[^\s@]+$' then
    raise exception 'bad url' using errcode = '22023';
  end if;
  if char_length(v_name) not between 2 and 160 or char_length(v_note) > 500 then
    raise exception 'bad name or note' using errcode = '22023';
  end if;
  v_url_key := private.course_url_key(v_url);

  -- כבר באתר: לפני הנעילה ולפני המגבלה. רק קריאה, על אינדקסים, ומידע ציבורי.
  v_course_id := private.live_course_by_url(v_url_key);
  if v_course_id is not null then
    select * into v_course from public.courses where id = v_course_id;
    return jsonb_build_object('outcome', 'existing', 'course_slug', v_course.slug, 'course_title', v_course.title);
  end if;

  perform pg_advisory_xact_lock(hashtext('public.course_submissions'));
  if (select count(*) from public.course_submissions s
      where s.client_hash = p_client_hash and s.created_at > now() - interval '1 day') >= 3 then
    raise exception 'too many requests from this client today' using errcode = 'LM042';
  end if;
  if (select count(*) from public.course_submissions s
      where s.source = 'request' and s.created_at > now() - interval '1 day') >= 50 then
    raise exception 'too many requests today' using errcode = 'LM043';
  end if;
  if exists (select 1 from public.course_submissions s where s.status = 'pending' and s.url_key = v_url_key) then
    return jsonb_build_object('outcome', 'sent');
  end if;

  insert into public.course_submissions (source, url, url_key, course_title, note, client_hash)
  values ('request', v_url, v_url_key, v_name, v_note, p_client_hash);
  return jsonb_build_object('outcome', 'sent');
end $$;

-- ===== 9. הבוגר: הקורסים שהוסיף, כדי ש"הביקורות שלי" ידע מה לכתוב ולאן להמשיך =====
-- רק השורות של המשתמש המחובר, ורק קורס שעדיין טיוטה (קורס שאושר כבר בקטלוג).

-- השם והמוסד כמו שהבוגר עצמו כתב: אם בוגר אחר הוסיף את אותו קורס קודם, לא רואים את מה שהוא כתב.
create function my_course_links()
returns table (course_id uuid, course_title text, institution_name text, status text, decision_reason text)
language sql stable security definer
set search_path = ''
as $$
  select distinct on (s.course_id) s.course_id, s.course_title, s.institution_name, s.status, s.decision_reason
  from public.course_submissions s
  join public.courses c on c.id = s.course_id and c.status = 'draft'
  where s.submitted_by = (select auth.uid()) and s.source = 'review'
  order by s.course_id, s.created_at desc;
$$;
revoke execute on function my_course_links() from public, anon;
grant execute on function my_course_links() to authenticated;

-- ===== 10. עמוד הכתיבה של קורס מקישור (/review/new?course=<id>): רק למי שהוסיף אותו =====
-- נטען בדפדפן, כמו הטיוטה של הביקורת, ולכן העמוד נשאר סטטי. null: הקורס לא שלו, או שכבר לא קיים (מוזג).
-- live_slug: הקורס כבר אושר, והכתיבה ממשיכה בעמוד הרגיל. merged_slug: גל מיזג אותו לקורס שכבר באתר.
-- השם והמוסד כמו שהבוגר עצמו כתב (כמו ב-my_course_links).

create function my_course_link(p_course_id uuid)
returns jsonb
language sql stable security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'course_id', c.id, 'title', s.course_title, 'institution_name', s.institution_name,
    'course_type', private.link_course_type(c.id),
    'status', s.status, 'decision_reason', s.decision_reason,
    'live_slug', case when c.status <> 'draft' then c.slug end,
    'merged_slug', (select m.slug from public.courses m where m.id = s.merged_into and m.status <> 'draft'))
  from public.course_submissions s
  join public.courses c on c.id = s.course_id
  where s.course_id = p_course_id and s.submitted_by = (select auth.uid()) and s.source = 'review'
  order by s.created_at desc
  limit 1;
$$;
revoke execute on function my_course_link(uuid) from public, anon;
grant execute on function my_course_link(uuid) to authenticated;

-- סוג השאלון של קורס, גם כשהוא טיוטה בלי תחום. לשליחת הביקורת (api/reviews/submit).
create function course_link_type(p_course_id uuid)
returns public.course_type
language sql stable
set search_path = ''
as $$
  select private.link_course_type(p_course_id);
$$;

-- ===== 11. התור של גל =====
-- פריט לכל קורס טיוטה (כל הבוגרים שהוסיפו אותו יחד), ופריט לכל בקשה. הישן ראשון.
-- candidates: קורסים באתר שאולי זה הם, למיזוג. url: אותו קישור. title: אותו שם. institution: עוד קורס של אותו מוסד.

create function course_link_queue(p_limit integer default 30)
returns table (
  id bigint, source text, created_at timestamptz, url text, is_social boolean, known_page boolean,
  course_id uuid, course_slug text, course_title text, typed_title text,
  institution_id uuid, institution_name text, institution_kind text, institution_is_new boolean, typed_institution text,
  category_id uuid, category_name text, course_type text, note text,
  submitters integer, reviews jsonb, candidates jsonb, suggested_institution_id uuid, total integer
)
language sql stable
set search_path = ''
as $$
  with pending as (
    select s.*,
           row_number() over (partition by coalesce(s.course_id::text, 'r' || s.id) order by s.created_at, s.id) as n,
           count(*) over (partition by coalesce(s.course_id::text, 'r' || s.id)) as how_many
    from public.course_submissions s
    where s.status = 'pending'
  ),
  item as (
    select p.*, count(*) over () as all_items
    from pending p
    where p.n = 1
    order by p.created_at, p.id
    limit greatest(1, least(coalesce(p_limit, 30), 100))
  ),
  -- materialized: הנרמול של הקורסים באתר פעם אחת, ולא לכל פריט (כמו ב-private.new_course_queue).
  live as materialized (
    select c.id, c.slug, c.title, c.institution_id, li.name as institution,
           private.course_title_key(c.title) as title_key, private.course_title_key(li.name) as inst_key
    from public.courses c
    join public.institutions li on li.id = c.institution_id
    where c.status <> 'draft'
  ),
  -- הקישורים של הקורסים באתר: דף הקורס, הדף אצל האוסף, וקישורים שכבר אושרו או מוזגו אליהם.
  live_url as materialized (
    select c.id, private.course_url_key(c.page_url) as url_key
    from public.courses c
    where c.status <> 'draft' and c.page_url is not null
    union
    select p.course_id, private.course_url_key(p.url)
    from public.scrape_pages p
    join public.courses c on c.id = p.course_id and c.status <> 'draft'
    union
    select coalesce(s.merged_into, s.course_id), s.url_key
    from public.course_submissions s
    where s.status in ('approved', 'merged') and coalesce(s.merged_into, s.course_id) is not null
  ),
  enriched as (
    select it.*,
           c.slug as c_slug, c.title as c_title, c.institution_id as c_institution,
           i.name as i_name, i.kind as i_kind, i.status as i_status,
           cat.id as cat_id, cat.name as cat_name,
           private.course_title_key(coalesce(c.title, it.course_title)) as title_key,
           private.course_title_key(i.name) as inst_key,
           private.is_social_url(it.url) as social
    from item it
    left join public.courses c on c.id = it.course_id
    left join public.institutions i on i.id = c.institution_id
    left join public.categories cat on cat.id = c.category_id
  )
  select
    e.id, e.source, e.created_at, e.url, e.social,
    -- אותו קישור בדיוק, עם / בסוף או בלי. בלי נרמול של כל הדפים: יש אלפים.
    exists (select 1 from public.scrape_pages sp where sp.url in (e.url, e.url || '/', rtrim(e.url, '/'))),
    e.course_id, e.c_slug, coalesce(e.c_title, e.course_title), e.course_title,
    e.c_institution, e.i_name, e.i_kind, e.i_status = 'draft', e.institution_name,
    e.cat_id, e.cat_name, coalesce(private.link_course_type(e.course_id), e.course_type)::text, e.note,
    e.how_many::integer,
    coalesce((select jsonb_object_agg(x.status, x.n)
              from (select r.status::text as status, count(*)::integer as n
                    from public.reviews r where r.course_id = e.course_id group by r.status) x), '{}'::jsonb),
    coalesce((
      select jsonb_agg(jsonb_build_object('course_id', m.id, 'slug', m.slug, 'title', m.title,
                                          'institution', m.institution,
                                          'why', case m.rank when 0 then 'url' when 1 then 'title' else 'institution' end)
                       order by m.rank, m.title)
      from (
        select l.id, l.slug, l.title, l.institution,
               case when exists (select 1 from live_url u where u.id = l.id and u.url_key = e.url_key) then 0
                    when l.title_key = e.title_key then 1
                    else 2 end as rank
        from live l
        where exists (select 1 from live_url u where u.id = l.id and u.url_key = e.url_key)
           or l.title_key = e.title_key
           or l.institution_id = e.c_institution
           or l.inst_key = e.inst_key
           -- בבקשה, השם יכול להיות של המרצה ולא של הקורס.
           or (e.source = 'request' and l.inst_key = e.title_key)
        order by 5, l.title
        limit 8
      ) m), '[]'::jsonb),
    (select si.id from public.institutions si
     where si.status = 'active' and not e.social and private.url_host(si.website) = private.url_host(e.url)
     order by si.created_at limit 1),
    e.all_items::integer
  from enriched e
  order by e.created_at, e.id;
$$;

-- ===== 12. ההחלטות של גל: אישור, מיזוג לקורס קיים, או דחייה עם סיבה. כל אחת בשורה ב-audit_log =====

-- אישור של קורס מבוגר: התחום (חובה אם אין), השם, והמוסד (קיים, או המרצה החדש בשם ובסוג שגל קבע) עולים יחד עם הקורס.
-- כל הבוגרים שהוסיפו אותו מאושרים יחד. אישור של בקשה: הקישור נכנס לאוסף תחת מוסד קיים, או מרצה חדש.
-- מחזירה {course_slug, page_id, social, published_reviews}. published_reviews: כמה ביקורות כבר אומתו, כדי לחשב ציון.
create function approve_course_submission(
  p_submission_id bigint, p_admin_id uuid,
  p_category_id uuid default null, p_title text default null,
  p_institution_id uuid default null, p_institution_name text default null, p_institution_kind text default null
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_s public.course_submissions%rowtype;
  v_course public.courses%rowtype;
  v_inst public.institutions%rowtype;
  v_category uuid;
  v_title text;
  v_inst_name text := nullif(btrim(regexp_replace(coalesce(p_institution_name, ''), '\s+', ' ', 'g')), '');
  v_social boolean;
  v_page_id bigint;
  v_old_institution uuid;
begin
  if not exists (select 1 from public.admins where user_id = p_admin_id) then
    raise exception 'not an admin' using errcode = '42501';
  end if;
  select * into v_s from public.course_submissions where id = p_submission_id and status = 'pending' for update;
  if not found then
    raise exception 'submission % is not pending', p_submission_id using errcode = 'P0002';
  end if;
  if char_length(v_inst_name) not between 2 and 120 then
    raise exception 'bad institution name' using errcode = '22023';
  end if;
  v_social := private.is_social_url(v_s.url);

  if v_s.source = 'review' then
    select * into v_course from public.courses where id = v_s.course_id for update;
    if not found or v_course.status <> 'draft' then
      raise exception 'course % is not a draft', v_s.course_id using errcode = 'P0002';
    end if;
    v_category := coalesce(p_category_id, v_course.category_id);
    if v_category is null then
      raise exception 'a category is required' using errcode = 'LM050';
    end if;
    if not exists (select 1 from public.categories where id = v_category) then
      raise exception 'unknown category' using errcode = 'LM044';
    end if;
    -- הבוגר כבר ענה על השאלון של הסוג שבחר. תחום מסוג אחר היה משאיר תשובות לשאלות אחרות.
    if exists (select 1 from public.reviews r where r.course_id = v_course.id)
       and (select cat.course_type from public.categories cat where cat.id = v_category)
           is distinct from private.link_course_type(v_course.id) then
      raise exception 'the category is of another course type' using errcode = 'LM051';
    end if;
    v_title := coalesce(nullif(btrim(regexp_replace(coalesce(p_title, ''), '\s+', ' ', 'g')), ''), v_course.title);
    if char_length(v_title) not between 2 and 160 then
      raise exception 'bad title' using errcode = '22023';
    end if;

    if p_institution_id is not null and p_institution_id <> v_course.institution_id then
      -- גל מצא שהמוסד כבר במסד, בשם אחר.
      select * into v_inst from public.institutions where id = p_institution_id and status = 'active';
      if not found then
        raise exception 'institution % not found', p_institution_id using errcode = 'LM054';
      end if;
      v_old_institution := v_course.institution_id;
    else
      select * into v_inst from public.institutions where id = v_course.institution_id for update;
      if v_inst.status = 'draft' then
        update public.institutions
        set name = coalesce(v_inst_name, name), kind = coalesce(p_institution_kind, kind), status = 'active'
        where id = v_inst.id
        returning * into v_inst;
      end if;
    end if;

    update public.courses
    set status = 'active', category_id = v_category, title = v_title, institution_id = v_inst.id
    where id = v_course.id;
    insert into public.course_changes (course_id, field, old_value, new_value, source, approved_by)
    values (v_course.id, 'status', '"draft"', '"active"', 'approved', p_admin_id);
    if v_old_institution is not null then
      perform private.drop_unused_draft_institution(v_old_institution);
    end if;
    if not v_social then
      v_page_id := private.link_page(v_inst.id, v_s.url, v_course.id);
    end if;

    update public.course_submissions
    set status = 'approved', decided_by = p_admin_id, decided_at = now(), page_id = v_page_id
    where course_id = v_course.id and status = 'pending';
    insert into public.audit_log (actor_id, action, course_submission_id, details)
    values (p_admin_id, 'course_link_approve', p_submission_id,
            jsonb_strip_nulls(jsonb_build_object('source', 'review', 'course_id', v_course.id, 'page_id', v_page_id,
                                                 'social', v_social)));
    return jsonb_build_object(
      'course_slug', v_course.slug, 'page_id', v_page_id, 'social', v_social,
      'published_reviews', (select count(*) from public.reviews r where r.course_id = v_course.id and r.status = 'published'));
  end if;

  -- בקשה: רק הקישור. פייסבוק ואינסטגרם לא נכנסים לאוסף, ואז גם אין צורך במוסד.
  if not v_social then
    if p_institution_id is not null then
      select * into v_inst from public.institutions where id = p_institution_id and status = 'active';
      if not found then
        raise exception 'institution % not found', p_institution_id using errcode = 'LM054';
      end if;
    elsif v_inst_name is not null then
      insert into public.institutions (slug, name, kind, status)
      values (private.ascii_slug(v_inst_name, 'independent', 40) || '-' || private.short_token(), v_inst_name,
              coalesce(p_institution_kind, 'independent'), 'active')
      returning * into v_inst;
    else
      raise exception 'an institution is required' using errcode = 'LM054';
    end if;
    v_page_id := private.link_page(v_inst.id, v_s.url, null);
  end if;
  update public.course_submissions
  set status = 'approved', decided_by = p_admin_id, decided_at = now(), page_id = v_page_id
  where id = p_submission_id;
  insert into public.audit_log (actor_id, action, course_submission_id, details)
  values (p_admin_id, 'course_link_approve', p_submission_id,
          jsonb_strip_nulls(jsonb_build_object('source', 'request', 'institution_id', v_inst.id, 'page_id', v_page_id,
                                               'social', v_social)));
  return jsonb_build_object('course_slug', null, 'page_id', v_page_id, 'social', v_social, 'published_reviews', 0);
end $$;

-- מיזוג: הקורס כבר באתר. הביקורות של הטיוטה עוברות אליו, הטיוטה נמחקת (אם שום דבר לא מפנה אליה),
-- ומרצה בטיוטה שנשאר בלי קורסים נמחק גם הוא. בבקשה: רק מסמנים לאיזה קורס היא שייכת.
-- מחזירה {course_slug, published_reviews}.
create function merge_course_submission(p_submission_id bigint, p_admin_id uuid, p_target_course_id uuid)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_s public.course_submissions%rowtype;
  v_target public.courses%rowtype;
  v_draft public.courses%rowtype;
  v_published integer := 0;
begin
  if not exists (select 1 from public.admins where user_id = p_admin_id) then
    raise exception 'not an admin' using errcode = '42501';
  end if;
  select * into v_s from public.course_submissions where id = p_submission_id and status = 'pending' for update;
  if not found then
    raise exception 'submission % is not pending', p_submission_id using errcode = 'P0002';
  end if;
  select * into v_target from public.courses where id = p_target_course_id;
  if not found or v_target.status = 'draft' then
    raise exception 'target course % is not on the site', p_target_course_id using errcode = 'LM052';
  end if;

  if v_s.source = 'review' then
    select * into v_draft from public.courses where id = v_s.course_id for update;
    if not found or v_draft.status <> 'draft' then
      raise exception 'course % is not a draft', v_s.course_id using errcode = 'P0002';
    end if;
    if exists (select 1 from public.reviews r where r.course_id = v_draft.id)
       and (select cat.course_type from public.categories cat where cat.id = v_target.category_id)
           is distinct from private.link_course_type(v_draft.id) then
      raise exception 'the target course is of another course type' using errcode = 'LM051';
    end if;
    select count(*) into v_published from public.reviews r where r.course_id = v_draft.id and r.status = 'published';
    begin
      update public.reviews set course_id = v_target.id where course_id = v_draft.id;
    exception when unique_violation then
      raise exception 'the graduate already reviewed that cohort of the target course' using errcode = 'LM053';
    end;
    update public.course_submissions
    set status = 'merged', merged_into = v_target.id, decided_by = p_admin_id, decided_at = now()
    where course_id = v_draft.id and status = 'pending';
    begin
      delete from public.courses where id = v_draft.id;
    exception when foreign_key_violation then
      null; -- למשל מישהו שמר אותה ברשימה. נשארת טיוטה, ולא מופיעה בשום מקום.
    end;
    perform private.drop_unused_draft_institution(v_draft.institution_id);
  else
    update public.course_submissions
    set status = 'merged', merged_into = v_target.id, decided_by = p_admin_id, decided_at = now()
    where id = p_submission_id;
  end if;

  insert into public.audit_log (actor_id, action, course_submission_id, details)
  values (p_admin_id, 'course_link_merge', p_submission_id,
          jsonb_strip_nulls(jsonb_build_object('source', v_s.source, 'course_id', v_draft.id, 'target_course_id', v_target.id)));
  return jsonb_build_object('course_slug', v_target.slug, 'published_reviews', v_published);
end $$;

-- דחייה עם סיבה. קורס של בוגר נשאר טיוטה (ולא ציבורי), והבוגר רואה את הסיבה בעמוד הכתיבה.
-- ביקורת שכבר נשלחה עליו נשארת בתור הביקורות, וגל מחזיר אותה משם כרגיל (הקבצים נמחקים שם).
-- ביומן רק שהייתה סיבה, ולא הטקסט: היומן נשמר לתמיד.
create function reject_course_submission(p_submission_id bigint, p_admin_id uuid, p_reason text)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_s public.course_submissions%rowtype;
  v_reason text := btrim(coalesce(p_reason, ''));
begin
  if not exists (select 1 from public.admins where user_id = p_admin_id) then
    raise exception 'not an admin' using errcode = '42501';
  end if;
  if char_length(v_reason) not between 1 and 300 then
    raise exception 'a reason is required' using errcode = '22023';
  end if;
  select * into v_s from public.course_submissions where id = p_submission_id and status = 'pending' for update;
  if not found then
    raise exception 'submission % is not pending', p_submission_id using errcode = 'P0002';
  end if;
  update public.course_submissions
  set status = 'rejected', decision_reason = v_reason, decided_by = p_admin_id, decided_at = now()
  where status = 'pending' and (id = p_submission_id or (v_s.course_id is not null and course_id = v_s.course_id));
  insert into public.audit_log (actor_id, action, course_submission_id, details)
  values (p_admin_id, 'course_link_reject', p_submission_id,
          jsonb_strip_nulls(jsonb_build_object('source', v_s.source, 'course_id', v_s.course_id)));
end $$;

-- ===== 13. הניקוי היומי (web/src/lib/reviews/cleanup.ts) =====
-- הטביעה של הכתובת אחרי יומיים, וההערה 90 יום אחרי ההחלטה. מחזירה כמה הערות נמחקו.

create function purge_course_submissions()
returns integer
language plpgsql
set search_path = ''
as $$
declare
  v_notes integer;
begin
  update public.course_submissions set note = null
  where note is not null and status <> 'pending' and decided_at < now() - interval '90 days';
  get diagnostics v_notes = row_count;
  update public.course_submissions set client_hash = null
  where client_hash is not null and created_at < now() - interval '2 days';
  return v_notes;
end $$;

-- ===== 14. הרשאות: הכול ל-service_role, חוץ מהפונקציות של המשתמש המחובר למעלה =====

revoke execute on function private.is_social_url(text) from public, anon, authenticated;
revoke execute on function private.ascii_slug(text, text, integer) from public, anon, authenticated;
revoke execute on function private.short_token() from public, anon, authenticated;
revoke execute on function private.link_course_type(uuid) from public, anon, authenticated;
revoke execute on function private.course_link_quota(uuid) from public, anon, authenticated;
revoke execute on function private.live_course_by_url(text) from public, anon, authenticated;
revoke execute on function private.link_page(uuid, text, uuid) from public, anon, authenticated;
revoke execute on function private.drop_unused_draft_institution(uuid) from public, anon, authenticated;
revoke execute on function submit_course_link(uuid, text, text, text, uuid, public.course_type) from public, anon, authenticated;
revoke execute on function submit_course_request(text, text, text, text) from public, anon, authenticated;
revoke execute on function course_link_type(uuid) from public, anon, authenticated;
revoke execute on function course_link_queue(integer) from public, anon, authenticated;
revoke execute on function approve_course_submission(bigint, uuid, uuid, text, uuid, text, text) from public, anon, authenticated;
revoke execute on function merge_course_submission(bigint, uuid, uuid) from public, anon, authenticated;
revoke execute on function reject_course_submission(bigint, uuid, text) from public, anon, authenticated;
revoke execute on function purge_course_submissions() from public, anon, authenticated;

grant execute on function private.is_social_url(text) to service_role;
grant execute on function private.ascii_slug(text, text, integer) to service_role;
grant execute on function private.short_token() to service_role;
grant execute on function private.link_course_type(uuid) to service_role;
grant execute on function private.course_link_quota(uuid) to service_role;
grant execute on function private.live_course_by_url(text) to service_role;
grant execute on function private.link_page(uuid, text, uuid) to service_role;
grant execute on function private.drop_unused_draft_institution(uuid) to service_role;
grant execute on function submit_course_link(uuid, text, text, text, uuid, public.course_type) to service_role;
grant execute on function submit_course_request(text, text, text, text) to service_role;
grant execute on function course_link_type(uuid) to service_role;
grant execute on function course_link_queue(integer) to service_role;
grant execute on function approve_course_submission(bigint, uuid, uuid, text, uuid, text, text) to service_role;
grant execute on function merge_course_submission(bigint, uuid, uuid) to service_role;
grant execute on function reject_course_submission(bigint, uuid, text) to service_role;
grant execute on function purge_course_submissions() to service_role;
