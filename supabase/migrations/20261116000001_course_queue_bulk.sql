-- אישור בבת אחת בתור של הקורסים. הריצה המלאה הראשונה של האוסף הכניסה לתור 764 קורסים חדשים מ-49 מוסדות,
-- וגל לא יאשר אותם אחד אחד. הסשן: docs/sessions/2026-11-15-bulk-approve.md.
--
-- כאן:
--   1. נרמול של שם קורס ושל קישור, להשוואה;
--   2. לכל קורס חדש שממתין: למה הוא לא "בטוח" (ריק: בטוח). מקור אחד גם לעמוד הניהול וגם לפעולה;
--   3. הסיכום לפי מוסד, והרשימות המסוננות, לעמוד הניהול. העמוד לא טוען 800 שורות;
--   4. אישור ודחייה של רשימת פריטים. כל פריט עובר דרך approve_course_change או reject_course_change, ולכן
--      אותם כללים ואותו יומן: שורה ב-audit_log לכל פריט (רק מה הוחלט, על איזה קורס. בלי פרטים אישיים).
--
-- שום דבר כאן לא מאשר לבד. קורס חדש עדיין עובר אישור (סעיף 5): האישור הוא לחיצה של גל, על מוסד אחד,
-- אחרי שלב אישור עם המספר. הכול ל-service_role בלבד.

-- ===== 1. נרמול =====

-- %XX לתווים, כדי ש-%D7%99, %d7%99 ו-"י" ייחשבו אותו קישור. רצף שאינו UTF-8 תקין: הטקסט כמו שהוא.
create function private.url_decode(p_text text)
returns text
language plpgsql immutable
set search_path = ''
as $$
begin
  return coalesce(convert_from(
    (select string_agg(
       case when t.m[1] ~ '^%[0-9A-Fa-f]{2}$' then decode(substr(t.m[1], 2), 'hex') else convert_to(t.m[1], 'UTF8') end,
       ''::bytea order by t.n)
     from regexp_matches(p_text, '%[0-9A-Fa-f]{2}|[^%]+|%', 'g') with ordinality as t(m, n)),
    'UTF8'), p_text);
exception when character_not_in_repertoire then
  return p_text;
end $$;

-- שם קורס להשוואה: אותיות קטנות, וכל רצף של סימנים שאינם אות או ספרה (גם בעברית) הופך לרווח אחד.
-- "Python - למתחילים!" ו-"python למתחילים" הם אותו שם. null: אין שם.
create function private.course_title_key(p_title text)
returns text
language sql immutable
set search_path = ''
as $$
  select nullif(btrim(regexp_replace(lower(coalesce(p_title, '')), '[^[:alnum:]]+', ' ', 'g')), '');
$$;

-- קישור להשוואה: מפוענח, באותיות קטנות, בלי http(s)://, בלי www., בלי # ובלי / בסוף הנתיב.
-- השאילתה (?...) נשארת: באתרים מסוימים היא מה שמזהה את הקורס (?ContentID=143).
create function private.course_url_key(p_url text)
returns text
language sql immutable
set search_path = ''
as $$
  select nullif(
    regexp_replace(
      regexp_replace(lower(private.url_decode(split_part(coalesce(p_url, ''), '#', 1))), '^https?://(www\.)?', ''),
      '/+(\?|$)', '\1'),
    '');
$$;

-- ===== 2. קורס חדש בתור: בטוח, או למה לא =====
--
-- causes: למה הקורס לא בטוח לאישור בבת אחת. ריק: בטוח.
--   * כל סימון של שדה מהאוסף (scraper/lamadti_scraper/decide.py, _new_course, ו-sanity.py): low_confidence,
--     quote_not_found, cohort_in_past, price_out_of_range ועוד. נקרא גם מ-reasons ("site_price_ils:low_confidence")
--     וגם מהשדות עצמם ב-new_value (confidence שאינו high, או issues), כדי שפריט שנכתב אחרת לא ייחשב בטוח בטעות.
--     שדה מסומן לא נכנס לטיוטה, אבל השם נכנס גם כשהוא מסומן, ושדה חסר הוא קורס חסר. לכן כל סימון: לא בטוח.
--   * duplicate_title: עוד קורס חדש של אותו מוסד בתור, עם אותו שם אחרי נרמול.
--   * duplicate_url: עוד קורס חדש בתור עם אותו קישור אחרי נרמול.
--   * duplicate_existing: כבר יש באתר קורס שאינו טיוטה עם אותו שם באותו מוסד, או עם אותו קישור.
--   * not_draft: אין קורס, או שהוא כבר לא טיוטה. אישור ייכשל.
create function private.new_course_queue()
returns table (
  queue_id bigint, institution_id uuid, course_slug text, title text, price integer, page_url text,
  created_at timestamptz, title_key text, url_key text, dup_group bigint, causes text[]
)
language sql stable
set search_path = ''
as $$
  with item as (
    select q.id, q.created_at, q.reasons,
           case when jsonb_typeof(q.new_value) = 'object' then q.new_value else '{}'::jsonb end as fields,
           c.id as course_id, c.institution_id, c.slug, c.title, c.site_price_ils, c.status::text as status,
           coalesce(p.url, c.page_url) as url,
           private.course_title_key(c.title) as title_key,
           private.course_url_key(coalesce(p.url, c.page_url)) as url_key
    from public.course_change_queue q
    left join public.courses c on c.id = q.course_id
    left join public.scrape_pages p on p.id = q.page_id
    where q.status = 'pending' and q.kind = 'new_course'
  ),
  counted as (
    select i.*,
           count(*) over (partition by i.institution_id, i.title_key) as same_title,
           count(*) over (partition by i.url_key) as same_url,
           min(i.id) over (partition by i.institution_id, i.title_key) as first_same_title,
           min(i.id) over (partition by i.url_key) as first_same_url
    from item i
  ),
  live as (
    select c.id, c.institution_id, private.course_title_key(c.title) as title_key, private.course_url_key(c.page_url) as url_key
    from public.courses c
    where c.status <> 'draft'
  )
  select f.id, f.institution_id, f.slug, f.title, f.site_price_ils, f.url, f.created_at, f.title_key, f.url_key,
    -- כפילויות באותה קבוצה, כדי שברשימה הן יעמדו זו ליד זו: הפריט הראשון עם אותו שם או אותו קישור.
    least(case when f.title_key is not null then f.first_same_title end,
          case when f.url_key is not null then f.first_same_url end, f.id),
    array(
      select distinct s.cause from (
        select case when r like '%:%' then split_part(r, ':', 2) else r end as cause
        from unnest(f.reasons) r
        where r <> 'new_course'
        union all
        select 'low_confidence' from jsonb_each(f.fields) e where e.value ->> 'confidence' is distinct from 'high'
        union all
        select jsonb_array_elements_text(e.value -> 'issues') from jsonb_each(f.fields) e
        where jsonb_typeof(e.value -> 'issues') = 'array'
        union all
        select 'duplicate_title' where f.title_key is not null and f.same_title > 1
        union all
        select 'duplicate_url' where f.url_key is not null and f.same_url > 1
        union all
        select 'duplicate_existing' where exists (
          select 1 from live l
          where l.id is distinct from f.course_id
            and ((l.institution_id = f.institution_id and l.title_key = f.title_key) or l.url_key = f.url_key)
        )
        union all
        select 'not_draft' where f.status is distinct from 'draft'
      ) s
      where s.cause <> ''
      order by s.cause
    )
  from counted f;
$$;

revoke execute on function private.url_decode(text) from public, anon, authenticated;
revoke execute on function private.course_title_key(text) from public, anon, authenticated;
revoke execute on function private.course_url_key(text) from public, anon, authenticated;
revoke execute on function private.new_course_queue() from public, anon, authenticated;
grant execute on function private.url_decode(text) to service_role;
grant execute on function private.course_title_key(text) to service_role;
grant execute on function private.course_url_key(text) to service_role;
grant execute on function private.new_course_queue() to service_role;

-- ===== 3. לעמוד הניהול =====

-- שורה לכל מוסד עם קורסים חדשים בתור, הגדול ראשון. causes: כמה פריטים יש לכל סיבה ({"low_confidence": 40}).
-- safe_ids ו-all_ids: מה שגל רואה בעמוד, ומה שהפעולה תאשר או תדחה (אחרי בדיקה חוזרת בשרת).
-- samples: שלושה לדוגמה, מהבטוחים קודם. השם והמחיר מהטיוטה, כלומר מה שיעלה לאתר.
create function course_queue_new_course_groups()
returns table (
  institution_id uuid, institution_slug text, institution_name text, total integer, safe integer, duplicates integer,
  causes jsonb, safe_ids bigint[], all_ids bigint[], samples jsonb, oldest timestamptz
)
language sql stable
set search_path = ''
as $$
  with n as materialized (
    select q.*, q.causes = '{}'::text[] as is_safe,
           row_number() over (partition by q.institution_id order by q.causes = '{}'::text[] desc, q.created_at, q.queue_id) as rn
    from private.new_course_queue() q
    where q.institution_id is not null
  ),
  cause_counts as (
    select x.institution_id, jsonb_object_agg(x.cause, x.cnt) as causes
    from (
      select n.institution_id, u.cause, count(*)::integer as cnt
      from n cross join unnest(n.causes) as u(cause)
      group by 1, 2
    ) x
    group by 1
  ),
  grouped as (
    select n.institution_id,
           count(*)::integer as total,
           count(*) filter (where n.is_safe)::integer as safe,
           count(*) filter (where n.causes && array['duplicate_title', 'duplicate_url', 'duplicate_existing'])::integer as duplicates,
           coalesce(array_agg(n.queue_id order by n.queue_id) filter (where n.is_safe), '{}') as safe_ids,
           array_agg(n.queue_id order by n.queue_id) as all_ids,
           jsonb_agg(jsonb_build_object('id', n.queue_id, 'title', n.title, 'price', n.price, 'url', n.page_url, 'safe', n.is_safe)
                     order by n.rn) filter (where n.rn <= 3) as samples,
           min(n.created_at) as oldest
    from n
    group by n.institution_id
  )
  select g.institution_id, i.slug, i.name, g.total, g.safe, g.duplicates, coalesce(c.causes, '{}'::jsonb),
         g.safe_ids, g.all_ids, g.samples, g.oldest
  from grouped g
  join public.institutions i on i.id = g.institution_id
  left join cause_counts c on c.institution_id = g.institution_id
  order by g.total desc, i.name;
$$;

-- הפריטים לרשימה המסוננת, הישן ראשון. הפריטים עצמם נטענים אחר כך, רק אלה שבעמוד.
-- p_filter: all, safe, unsafe, או duplicates (שם: מסודרים לפי קבוצה, כדי שכפילויות יעמדו זו ליד זו).
-- total: כמה עונים למסנן בסך הכול, לפני ה-limit.
create function course_queue_new_course_items(p_filter text, p_institution_id uuid default null, p_limit integer default 30)
returns table (queue_id bigint, institution_id uuid, causes text[], total bigint)
language plpgsql stable
set search_path = ''
as $$
begin
  if p_filter is null or p_filter not in ('all', 'safe', 'unsafe', 'duplicates') then
    raise exception 'unknown filter %', p_filter using errcode = '22023';
  end if;
  return query
    select n.queue_id, n.institution_id, n.causes, count(*) over ()
    from private.new_course_queue() n
    where (p_institution_id is null or n.institution_id = p_institution_id)
      and case p_filter
            when 'safe' then n.causes = '{}'::text[]
            when 'unsafe' then n.causes <> '{}'::text[]
            when 'duplicates' then n.causes && array['duplicate_title', 'duplicate_url', 'duplicate_existing']
            else true
          end
    order by case when p_filter = 'duplicates' then n.dup_group end, n.created_at, n.queue_id
    limit least(greatest(coalesce(p_limit, 30), 1), 1000);
end $$;

-- ===== 4. אישור ודחייה של רשימה =====
-- רק פריטים מסוג new_course שעדיין ממתינים. כל השאר (שינוי בשדה, פריט שכבר הוחלט) מדלגים עליו, ולכן קריאה
-- חוזרת עם אותם מזהים לא משנה כלום. עד 500 מזהים בקריאה: השרת שולח 100 בכל פעם.
-- מחזירות את הפריטים שהוחלטו עכשיו, וה-slug של הקורס, לרענון העמודים.

create function approve_course_changes(p_ids bigint[], p_admin_id uuid)
returns table (queue_id bigint, course_slug text)
language plpgsql
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_id bigint;
begin
  if not exists (select 1 from public.admins a where a.user_id = p_admin_id) then
    raise exception 'not an admin' using errcode = '42501';
  end if;
  if coalesce(cardinality(p_ids), 0) > 500 then
    raise exception 'too many items in one call' using errcode = '22023';
  end if;
  for v_id in
    select q.id from public.course_change_queue q
    where q.id = any(p_ids) and q.status = 'pending' and q.kind = 'new_course'
    order by q.id
    for update
  loop
    begin
      perform public.approve_course_change(v_id, p_admin_id);
    exception when no_data_found then
      -- הקורס כבר לא טיוטה (P0002): הפריט נשאר בתור, וגל מחליט עליו לבד. שאר הרשימה ממשיכה.
      continue;
    end;
    queue_id := v_id;
    course_slug := (select c.slug from public.course_change_queue q join public.courses c on c.id = q.course_id where q.id = v_id);
    return next;
  end loop;
end $$;

-- דחייה: כמו reject_course_change. הקורס נשאר טיוטה, והדף שלו לא נקרא יותר.
create function reject_course_changes(p_ids bigint[], p_admin_id uuid)
returns table (queue_id bigint, course_slug text)
language plpgsql
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_id bigint;
begin
  if not exists (select 1 from public.admins a where a.user_id = p_admin_id) then
    raise exception 'not an admin' using errcode = '42501';
  end if;
  if coalesce(cardinality(p_ids), 0) > 500 then
    raise exception 'too many items in one call' using errcode = '22023';
  end if;
  for v_id in
    select q.id from public.course_change_queue q
    where q.id = any(p_ids) and q.status = 'pending' and q.kind = 'new_course'
    order by q.id
    for update
  loop
    perform public.reject_course_change(v_id, p_admin_id);
    queue_id := v_id;
    course_slug := (select c.slug from public.course_change_queue q join public.courses c on c.id = q.course_id where q.id = v_id);
    return next;
  end loop;
end $$;

revoke execute on function course_queue_new_course_groups() from public, anon, authenticated;
revoke execute on function course_queue_new_course_items(text, uuid, integer) from public, anon, authenticated;
revoke execute on function approve_course_changes(bigint[], uuid) from public, anon, authenticated;
revoke execute on function reject_course_changes(bigint[], uuid) from public, anon, authenticated;
grant execute on function course_queue_new_course_groups() to service_role;
grant execute on function course_queue_new_course_items(text, uuid, integer) to service_role;
grant execute on function approve_course_changes(bigint[], uuid) to service_role;
grant execute on function reject_course_changes(bigint[], uuid) to service_role;
