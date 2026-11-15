-- בדיקת קישור עם AI: "ראיתם מודעה? הדביקו את הקישור" (docs/superpowers/specs/2026-11-15-ad-check-design.md).
-- ב-/request-course מבקר מדביק קישור לדף שמודעה מובילה אליו. השרת קורא את הדף, ומודל שפה מוצא בו את הדגלים
-- של המדריך. כאן: המטמון של התוצאות, המכסה, והניקוי. טקסט הדף לא נשמר בכלל, רק התוצאה.
-- הכול בסכמה private, ורק השרת (service_role) מגיע לפונקציות. לאורח ולמשתמש מחובר אין שום גישה.

-- ===== 1. המטמון: תוצאה אחת לכל קישור מנורמל =====

create table private.ad_checks (
  url_norm text primary key check (char_length(url_norm) <= 500 and url_norm ~ '^https?://'),
  -- רק התוצאה: טענות ודגלים עם ציטוטים קצרים מהדף. בלי הטקסט של הדף.
  result jsonb not null check (jsonb_typeof(result) = 'object' and octet_length(result::text) <= 20000),
  checked_at timestamptz not null default now()
);
create index ad_checks_checked_at_idx on private.ad_checks (checked_at);
alter table private.ad_checks enable row level security;
-- בלי מדיניות: anon ו-authenticated לא רואים ולא כותבים. יש להם usage על הסכמה private (בשביל עזרים
-- של RLS), ולכן גם revoke מפורש.
revoke all on private.ad_checks from public, anon, authenticated;

-- ===== 2. המכסה: שורה לכל יום ולכל טביעת כתובת, ושורה '*' לכל האתר =====

create table private.ad_check_usage (
  day date not null,
  -- HMAC של כתובת ה-IP (64 תווים הקסה), או '*' לסך הכול של האתר.
  ip_hash text not null check (ip_hash = '*' or ip_hash ~ '^[0-9a-f]{64}$'),
  n integer not null default 0 check (n >= 0),
  primary key (day, ip_hash)
);
alter table private.ad_check_usage enable row level security;
revoke all on private.ad_check_usage from public, anon, authenticated;

-- ===== 3. take_ad_check: עוד בדיקה אחת, אם נשאר =====
-- 3 ביום לכל כתובת, ו-300 ביום לכל האתר. היום לפי שעון ישראל, כמו "אפשר שוב מחר" בהודעה.
-- מחזירה false בלי לספור, כשאחד המונים מלא. הנעילה עד סוף הטרנזקציה: שתי בדיקות במקביל נספרות אחת אחרי השנייה.
-- תוצאה מהמטמון לא מגיעה לכאן, ולכן לא נספרת.
create function take_ad_check(p_ip_hash text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_day date := (now() at time zone 'Asia/Jerusalem')::date;
  v_mine integer;
  v_all integer;
begin
  if p_ip_hash is null or p_ip_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'bad ip hash' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtext('private.ad_check_usage'));
  select coalesce(sum(u.n) filter (where u.ip_hash = p_ip_hash), 0),
         coalesce(sum(u.n) filter (where u.ip_hash = '*'), 0)
    into v_mine, v_all
  from private.ad_check_usage u
  where u.day = v_day and u.ip_hash in (p_ip_hash, '*');
  if v_mine >= 3 or v_all >= 300 then
    return false;
  end if;
  insert into private.ad_check_usage as u (day, ip_hash, n)
  values (v_day, p_ip_hash, 1), (v_day, '*', 1)
  on conflict (day, ip_hash) do update set n = u.n + 1;
  return true;
end $$;

-- ===== 4. המטמון: קריאה (רק מ-24 השעות האחרונות) וכתיבה =====

-- null: אין תוצאה, או שהיא ישנה מיממה. אחרת {"result": ..., "checked_at": ...}.
create function get_ad_check(p_url text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object('result', a.result, 'checked_at', a.checked_at)
  from private.ad_checks a
  where a.url_norm = p_url and a.checked_at > now() - interval '24 hours';
$$;

-- שומרת תוצאה חדשה, או מחליפה ישנה, ומחזירה מתי נבדק.
create function save_ad_check(p_url text, p_result jsonb)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_at timestamptz;
begin
  if p_url is null or char_length(p_url) > 500 or p_url !~ '^https?://[^\s@]+$' then
    raise exception 'bad url' using errcode = '22023';
  end if;
  insert into private.ad_checks as a (url_norm, result, checked_at)
  values (p_url, p_result, now())
  on conflict (url_norm) do update set result = excluded.result, checked_at = excluded.checked_at
  returning a.checked_at into v_at;
  return v_at;
end $$;

-- ===== 5. הניקוי היומי (web/src/lib/reviews/cleanup.ts) =====
-- תוצאות מלפני 7 ימים, ומונים מלפני יומיים. מחזירה כמה תוצאות נמחקו.

create function purge_ad_checks()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_checks integer;
begin
  delete from private.ad_checks where checked_at < now() - interval '7 days';
  get diagnostics v_checks = row_count;
  delete from private.ad_check_usage where day < (now() at time zone 'Asia/Jerusalem')::date - 2;
  return v_checks;
end $$;

-- ===== 6. הרשאות: רק השרת =====

revoke execute on function take_ad_check(text) from public, anon, authenticated;
revoke execute on function get_ad_check(text) from public, anon, authenticated;
revoke execute on function save_ad_check(text, jsonb) from public, anon, authenticated;
revoke execute on function purge_ad_checks() from public, anon, authenticated;

grant execute on function take_ad_check(text) to service_role;
grant execute on function get_ad_check(text) to service_role;
grant execute on function save_ad_check(text, jsonb) to service_role;
grant execute on function purge_ad_checks() to service_role;
