-- סבב 2ב: מה שמשתמש מחובר שומר לעצמו. קורסים ששמר, ההשוואה שלו (3 מקומות) והתשובות מדף הבית.
-- כל משתמש רואה ומשנה רק את השורות שלו. ההרשאות ניתנות במפורש, רק ל-authenticated:
-- מתוכנית 1, טבלה חדשה לא נפתחת לאף אחד מעצמה, ול-anon אין כאן כלום.
-- מחיקת משתמש מ-auth.users מוחקת את כל השורות שלו (on delete cascade). כך מחיקת חשבון מוחקת הכול.

create table saved_courses (
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, course_id)
);
-- למפתח הזר לקורסים. השליפות של המשתמש עוברות דרך המפתח הראשי.
create index saved_courses_course_idx on saved_courses (course_id);

-- ההשוואה: שלושה מקומות בדיוק. position בין 1 ל-3, ומפתח ראשי (user_id, position), ולכן אין מקום רביעי.
-- כל קורס בהשוואה שמור גם ב-saved_courses. הסרה מהשמורים מוציאה אותו גם מההשוואה.
create table compare_items (
  user_id uuid not null,
  course_id uuid not null,
  position smallint not null check (position between 1 and 3),
  created_at timestamptz not null default now(),
  primary key (user_id, position),
  unique (user_id, course_id),
  foreign key (user_id, course_id) references saved_courses (user_id, course_id) on delete cascade
);

-- התשובות מדף הבית, באותה צורה כמו בכתובת: {"cat": "programming", "why": "switch", "max": "15000"}.
-- הדפדפן קורא אותן עם parseQuery, שמסנן כל ערך לא מוכר. הגודל מוגבל, כי זה שדה שהמשתמש כותב.
create table user_answers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  answers jsonb not null check (jsonb_typeof(answers) = 'object' and octet_length(answers::text) <= 2000),
  updated_at timestamptz not null default now()
);

create trigger user_answers_updated_at before update on user_answers
  for each row execute function set_updated_at();

alter table saved_courses enable row level security;
alter table compare_items enable row level security;
alter table user_answers enable row level security;

-- (select auth.uid()) ולא auth.uid(): הערך מחושב פעם אחת לשאילתה, ולא לכל שורה.
create policy "own saved courses: read" on saved_courses
  for select to authenticated using (user_id = (select auth.uid()));
create policy "own saved courses: add" on saved_courses
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own saved courses: remove" on saved_courses
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "own compare items: read" on compare_items
  for select to authenticated using (user_id = (select auth.uid()));
create policy "own compare items: add" on compare_items
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own compare items: remove" on compare_items
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "own answers: read" on user_answers
  for select to authenticated using (user_id = (select auth.uid()));
create policy "own answers: add" on user_answers
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own answers: change" on user_answers
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- בדיוק מה שהאתר צריך: לשמור ולהסיר קורס, להכניס ולהוציא מההשוואה, ולשמור תשובות (upsert).
grant select, insert, delete on saved_courses to authenticated;
grant select, insert, delete on compare_items to authenticated;
grant select, insert, update on user_answers to authenticated;

-- מחיקת חשבון מוחקת גם את המייל מהרישום של Supabase Auth: הרישום (auth.audit_log_entries) שומר
-- את המייל בכל כניסה, וגם ברשומה על המחיקה עצמה, ולא נמחק עם המשתמש. נתיב המחיקה קורא לזה
-- אחרי שהמשתמש נמחק. רק service_role (המפתח הסודי, בשרת) יכול להריץ: ברירות המחדל מתוכנית 1
-- חוסמות הרצה לכל השאר.
create function forget_auth_log(p_user_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.audit_log_entries
  where payload ->> 'actor_id' = p_user_id::text
     or payload -> 'traits' ->> 'user_id' = p_user_id::text;
$$;
grant execute on function forget_auth_log(uuid) to service_role;
