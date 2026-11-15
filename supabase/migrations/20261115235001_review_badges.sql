-- "בוגר מאומת" ב-LinkedIn: קישור לשיתוף, אחרי שביקורת מתפרסמת (docs/b2b/2026-11-15-go-to-market.md, מסלול 2).
-- זו הכרה ולא תגמול: אין כאן ספירה של שיתופים או של צפיות, ואין נקודות.
--
-- הקישור הוא /verified/<token>. הטוקן אקראי (24 בתים, 192 ביט), ונשמר רק כאן. אי אפשר לנחש אותו,
-- ואי אפשר לגזור ממנו את הביקורת, את הכותב או את המחזור.
-- הכרטיס מראה רק את הקורס, את המוסד ו"בוגר/ת מאומת/ת". השם מופיע רק אם הכותב בחר בזה, ורק אם בביקורת עצמה
-- הוא לא בחר "בלי שם". הטקסט של הביקורת לא מופיע אף פעם.
-- הקישור עובד רק כל עוד הביקורת מוצגת באתר (private.is_review_public) והחשבון של הכותב קיים.
-- ביקורת שנמחקה: השורה כאן נמחקת איתה (on delete cascade). ביקורת שהוסתרה או חשבון שנמחק: הקישור מחזיר 404.

create table review_badges (
  review_id uuid primary key references reviews(id) on delete cascade,
  -- base64url של 24 בתים אקראיים: בדיוק 32 תווים.
  token text not null unique check (token ~ '^[A-Za-z0-9_-]{32}$'),
  show_name boolean not null default false,
  created_at timestamptz not null default now()
);

alter table review_badges enable row level security;
-- אין מדיניות: אורח ומשתמש מחובר לא קוראים ולא כותבים ישירות. רק דרך הפונקציות למטה.
revoke all on review_badges from anon, authenticated;

-- טוקן חדש: 24 בתים מ-pgcrypto, ב-base64url ובלי ריפוד.
create function private.new_badge_token()
returns text
language sql volatile
set search_path = ''
as $$
  select translate(encode(extensions.gen_random_bytes(24), 'base64'), '+/', '-_');
$$;
revoke execute on function private.new_badge_token() from public, anon, authenticated;

-- הכותב יוצר קישור לביקורת שלו שפורסמה, או משנה אם השם מופיע בו. מחזירה את הטוקן.
-- פעם שנייה מחזירה את אותו טוקן: הקישור שכבר שותף ממשיך לעבוד.
-- ביקורת של מישהו אחר, ביקורת שלא פורסמה וביקורת שלא קיימת: אותה שגיאה, כדי לא לגלות מה קיים.
create function share_review_badge(p_review_id uuid, p_show_name boolean default false)
returns text
language plpgsql security definer
set search_path = ''
as $$
declare
  v_mode public.display_name_mode;
  v_token text;
begin
  select r.display_mode into v_mode
  from public.reviews r
  where r.id = p_review_id and r.author_id = (select auth.uid());
  if v_mode is null or not private.is_review_public(p_review_id) then
    raise exception 'review not found' using errcode = 'P0002';
  end if;

  insert into public.review_badges (review_id, token, show_name)
  -- בביקורת בלי שם אין שם להראות.
  values (p_review_id, private.new_badge_token(), coalesce(p_show_name, false) and v_mode <> 'anonymous')
  on conflict (review_id) do update set show_name = excluded.show_name
  returning token into v_token;
  return v_token;
end $$;

-- הכותב מפסיק לשתף: הקישור מפסיק לעבוד מיד. קישור חדש יקבל טוקן אחר.
create function unshare_review_badge(p_review_id uuid)
returns boolean
language plpgsql security definer
set search_path = ''
as $$
begin
  delete from public.review_badges b
  using public.reviews r
  where b.review_id = p_review_id and r.id = b.review_id and r.author_id = (select auth.uid());
  return found;
end $$;

-- הקישורים של המשתמש המחובר, ל"הביקורות שלי".
create function my_review_badges()
returns table (review_id uuid, token text, show_name boolean)
language sql stable security definer
set search_path = ''
as $$
  select b.review_id, b.token, b.show_name
  from public.review_badges b
  join public.reviews r on r.id = b.review_id
  where r.author_id = (select auth.uid());
$$;

-- הכרטיס עצמו, לכל אחד שיש לו את הקישור. רק מה שמופיע בו: הקורס, המוסד, ואם הכותב בחר, השם והתואר שלו.
-- shown_title: "בוגר" או "בוגרת" רק עם השם. בלי השם, הכרטיס אומר "בוגר/ת מאומת/ת".
create function review_badge(p_token text)
returns table (
  course_slug text,
  course_title text,
  institution_name text,
  shown_name text,
  shown_title public.author_title
)
language sql stable security definer
set search_path = ''
as $$
  select c.slug, c.title, i.name,
         case when b.show_name and r.display_mode <> 'anonymous' then r.display_name end,
         case when b.show_name and r.display_mode <> 'anonymous' then r.author_title end
  from public.review_badges b
  join public.reviews r on r.id = b.review_id
  join public.courses c on c.id = r.course_id
  join public.institutions i on i.id = c.institution_id
  where p_token ~ '^[A-Za-z0-9_-]{32}$'
    and b.token = p_token
    and r.author_id is not null
    and private.is_review_public(r.id);
$$;

revoke execute on function share_review_badge(uuid, boolean) from public, anon;
revoke execute on function unshare_review_badge(uuid) from public, anon;
revoke execute on function my_review_badges() from public, anon;
revoke execute on function review_badge(text) from public;
grant execute on function share_review_badge(uuid, boolean) to authenticated;
grant execute on function unshare_review_badge(uuid) to authenticated;
grant execute on function my_review_badges() to authenticated;
grant execute on function review_badge(text) to anon, authenticated, service_role;
