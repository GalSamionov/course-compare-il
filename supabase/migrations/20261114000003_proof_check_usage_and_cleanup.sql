-- סבב 3, תיקון מסקירת השרת: מכסת הבדיקות של מודל השפה נשמרת לפני הקריאה, ולא אחרי השליחה.
-- קודם המכסה נספרה משורות ב-proofs עם check_status = 'checked', שנוצרות רק כש-submit_review מצליחה.
-- שליחות במקביל, או טיוטה שהשתנתה בזמן הבדיקה (40001), נתנו קריאות בלי הגבלה.
-- עכשיו השרת מזמין את הבדיקות כאן, בטרנזקציה אחת עם נעילה לכל כותב, ורק אחר כך קורא למודל.
-- הניקוי היומי (web/src/lib/reviews/cleanup.ts) מוחק שורות בנות יותר מיומיים.

-- ===== 1. הבדיקות שהוזמנו: שורה לכל בדיקה =====

create table proof_check_usage (
  -- בלי מפתח זר: השורה נמחקת בניקוי אחרי יומיים בכל מקרה, וחשבון שנמחק לא צריך לחכות לה.
  author_id uuid not null,
  created_at timestamptz not null default now()
);
create index proof_check_usage_author_created_idx on proof_check_usage (author_id, created_at);
alter table proof_check_usage enable row level security;
-- אין מדיניות: anon ו-authenticated לא רואים ולא כותבים כלום. רק service_role, שעוקף RLS.
-- ברירות המחדל של תוכנית 1 כבר חוסמות, וזה במפורש.
revoke all on proof_check_usage from anon, authenticated;

-- ===== 2. הזמנה של בדיקות: עד p_per_day ביממה לכותב =====
-- מחזירה כמה בדיקות אושרו (0 עד p_want), ורושמת אותן. הנעילה לפי הכותב, עד סוף הטרנזקציה:
-- שתי שליחות במקביל של אותו כותב סופרות אחת אחרי השנייה, ולא שתיהן מאותה נקודה.
-- security invoker, ורק service_role רשאי, כמו submit_review.
create function take_proof_checks(p_author_id uuid, p_want integer, p_per_day integer)
returns integer
language plpgsql
set search_path = ''
as $$
declare
  v_used integer;
  v_take integer;
begin
  if p_author_id is null then
    raise exception 'author is required' using errcode = '22004';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_author_id::text, 0));
  select count(*) into v_used
  from public.proof_check_usage u
  where u.author_id = p_author_id and u.created_at > now() - interval '1 day';
  -- least מתעלמת מ-null, ולכן coalesce: קלט חסר מקבל 0, לא את כל המכסה.
  v_take := greatest(0, least(coalesce(p_want, 0), coalesce(p_per_day, 0) - v_used));
  insert into public.proof_check_usage (author_id)
  select p_author_id from generate_series(1, v_take);
  return v_take;
end $$;
revoke execute on function take_proof_checks(uuid, integer, integer) from public, anon, authenticated;
grant execute on function take_proof_checks(uuid, integer, integer) to service_role;
