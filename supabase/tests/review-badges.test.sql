begin;
create extension if not exists pgtap with schema extensions;
select plan(31);

-- "בוגר מאומת" ב-LinkedIn (20261115235001_review_badges.sql): מי יוצר קישור, מה הכרטיס מראה,
-- ומתי הקישור מפסיק לעבוד. המסד המקומי משותף: כל הנתונים כאן במזהים של הבדיקה, והכול מתבטל בסוף.
-- א' כותב, ב' משתמש אחר.
insert into auth.users (id, email) values
  ('88888888-0000-0000-0000-00000000000a', 'badge-a@example.test'),
  ('88888888-0000-0000-0000-00000000000b', 'badge-b@example.test');
insert into categories (id, slug, name, course_type)
values ('88888888-0000-0000-0000-000000000001', 'badge-cat', 'תחום בדיקה', 'career');
insert into institutions (id, slug, name, kind)
values ('88888888-0000-0000-0000-000000000002', 'badge-inst', 'מוסד בדיקה', 'college');
insert into courses (id, slug, institution_id, category_id, title, status) values
  ('88888888-0000-0000-0000-000000000003', 'badge-course', '88888888-0000-0000-0000-000000000002',
   '88888888-0000-0000-0000-000000000001', 'קורס בדיקה', 'active');
-- c1: של א', פורסמה, עם שם. c2: של א', פורסמה, בלי שם. c3: של א', ממתינה. c4: של ב', פורסמה.
insert into reviews (id, course_id, author_id, cohort_month, body, display_name, display_mode, author_title,
                     status, proof_kind, verified_at, published_at, submitted_at)
values
  ('88888888-0000-0000-0000-0000000000c1', '88888888-0000-0000-0000-000000000003', '88888888-0000-0000-0000-00000000000a',
   '2026-01-01', repeat('א', 80), 'דנה כ.', 'first_initial', 'graduate_f', 'published', 'invoice', now(), now(), now()),
  ('88888888-0000-0000-0000-0000000000c2', '88888888-0000-0000-0000-000000000003', '88888888-0000-0000-0000-00000000000a',
   '2026-02-01', repeat('ב', 80), 'בוגר מאומת', 'anonymous', 'graduate_m', 'published', 'invoice', now(), now(), now()),
  ('88888888-0000-0000-0000-0000000000c3', '88888888-0000-0000-0000-000000000003', '88888888-0000-0000-0000-00000000000a',
   '2026-03-01', repeat('ג', 80), 'דנה כ.', 'first_initial', 'graduate_f', 'pending', null, null, null, now()),
  ('88888888-0000-0000-0000-0000000000c4', '88888888-0000-0000-0000-000000000003', '88888888-0000-0000-0000-00000000000b',
   '2026-01-01', repeat('ד', 80), 'יוסי ל.', 'first_initial', 'graduate_m', 'published', 'invoice', now(), now(), now());

-- ===== הרשאות =====

select ok(
  not has_table_privilege('anon', 'public.review_badges', 'SELECT')
  and not has_table_privilege('authenticated', 'public.review_badges', 'SELECT')
  and not has_table_privilege('authenticated', 'public.review_badges', 'INSERT')
  and not has_table_privilege('authenticated', 'public.review_badges', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.review_badges', 'DELETE'),
  'אין גישה ישירה לטבלה: רק דרך הפונקציות'
);
select ok(
  not has_function_privilege('anon', 'public.share_review_badge(uuid, boolean)', 'EXECUTE')
  and not has_function_privilege('anon', 'public.unshare_review_badge(uuid)', 'EXECUTE')
  and not has_function_privilege('anon', 'public.my_review_badges()', 'EXECUTE')
  and has_function_privilege('authenticated', 'public.share_review_badge(uuid, boolean)', 'EXECUTE')
  and has_function_privilege('anon', 'public.review_badge(text)', 'EXECUTE'),
  'אורח רק קורא כרטיס לפי טוקן. יצירה וביטול רק למשתמש מחובר'
);
select ok(
  not has_function_privilege('anon', 'private.new_badge_token()', 'EXECUTE')
  and not has_function_privilege('authenticated', 'private.new_badge_token()', 'EXECUTE'),
  'אף אחד מבחוץ לא מייצר טוקנים'
);

-- הטוקנים שהבדיקות משוות ביניהן. נוצרת כ-postgres, וכל תפקיד יכול לקרוא ולכתוב בה.
create temp table t (name text primary key, token text) on commit drop;
grant all on t to authenticated, anon;

-- ===== כותב א' =====
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "88888888-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

insert into t values ('first', share_review_badge('88888888-0000-0000-0000-0000000000c1'));

select ok((select token ~ '^[A-Za-z0-9_-]{32}$' from t where name = 'first'), 'הטוקן: 32 תווים של base64url');
select is(
  share_review_badge('88888888-0000-0000-0000-0000000000c1'),
  (select token from t where name = 'first'),
  'פעם שנייה: אותו טוקן, והקישור שכבר שותף ממשיך לעבוד'
);
insert into t values ('anon-review', share_review_badge('88888888-0000-0000-0000-0000000000c2', true));
select isnt(
  (select token from t where name = 'anon-review'),
  (select token from t where name = 'first'),
  'לכל ביקורת טוקן משלה'
);
select throws_ok(
  $$select share_review_badge('88888888-0000-0000-0000-0000000000c3')$$,
  'P0002', null, 'ביקורת שעוד לא פורסמה לא מקבלת קישור'
);
select throws_ok(
  $$select share_review_badge('88888888-0000-0000-0000-0000000000c4')$$,
  'P0002', null, 'ביקורת של מישהו אחר: אותה שגיאה כמו ביקורת שלא קיימת'
);
select throws_ok(
  $$select share_review_badge('88888888-0000-0000-0000-0000000000ff')$$,
  'P0002', null, 'ביקורת שלא קיימת'
);
select throws_ok($$select count(*) from review_badges$$, '42501', null, 'גם הכותב לא קורא את הטבלה ישירות');
select is((select count(*)::int from my_review_badges()), 2, 'הכותב רואה את שני הקישורים שלו');

-- ===== הכרטיס, כאורח =====
reset role;
set local role anon;
select results_eq(
  $$select course_slug, course_title, institution_name, shown_name, shown_title::text
    from review_badge((select token from t where name = 'first'))$$,
  $$values ('badge-course', 'קורס בדיקה', 'מוסד בדיקה', null::text, null::text)$$,
  'ברירת המחדל: הקורס והמוסד, בלי שם ובלי "בוגר" או "בוגרת"'
);
select is_empty(
  $$select * from review_badge((select token from t where name = 'anon-review')) where shown_name is not null or shown_title is not null$$,
  'ביקורת בלי שם: גם כשביקשו להראות את השם, אין שם בכרטיס'
);
select is_empty($$select * from review_badge('short')$$, 'טוקן בצורה לא נכונה: כלום');
select is_empty($$select * from review_badge(repeat('A', 32))$$, 'טוקן בצורה נכונה שלא קיים: כלום');
select is_empty($$select * from review_badge(null)$$, 'בלי טוקן: כלום');
select throws_ok(
  $$select share_review_badge('88888888-0000-0000-0000-0000000000c1')$$,
  '42501', null, 'אורח לא יוצר קישור'
);
select throws_ok($$select count(*) from review_badges$$, '42501', null, 'אורח לא קורא את הטבלה');

-- ===== הכותב בוחר להראות את השם =====
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "88888888-0000-0000-0000-00000000000a", "role": "authenticated"}', true);
select is(
  share_review_badge('88888888-0000-0000-0000-0000000000c1', true),
  (select token from t where name = 'first'),
  'שינוי הבחירה לא מחליף את הטוקן'
);
reset role;
set local role anon;
select results_eq(
  $$select shown_name, shown_title::text from review_badge((select token from t where name = 'first'))$$,
  $$values ('דנה כ.', 'graduate_f')$$,
  'עם הבחירה: השם מהביקורת, ו"בוגרת"'
);

-- ===== משתמש ב' =====
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "88888888-0000-0000-0000-00000000000b", "role": "authenticated"}', true);
select is_empty($$select * from my_review_badges()$$, 'משתמש אחר לא רואה את הקישורים של א''');
select is(unshare_review_badge('88888888-0000-0000-0000-0000000000c1'), false, 'משתמש אחר לא מבטל קישור של א''');
select isnt_empty(
  $$select * from review_badge((select token from t where name = 'first'))$$,
  'והקישור של א'' עדיין עובד'
);

-- ===== מתי הקישור מפסיק לעבוד =====
reset role;
update reviews set status = 'disputed' where id = '88888888-0000-0000-0000-0000000000c1';
set local role anon;
select is_empty(
  $$select * from review_badge((select token from t where name = 'first'))$$,
  'ביקורת שהוסתרה בזמן בירור: הקישור לא עובד'
);
reset role;
update reviews set status = 'published' where id = '88888888-0000-0000-0000-0000000000c1';
update courses set status = 'draft' where id = '88888888-0000-0000-0000-000000000003';
set local role anon;
select is_empty(
  $$select * from review_badge((select token from t where name = 'first'))$$,
  'קורס שחזר לטיוטה: הקישור לא עובד'
);
reset role;
update courses set status = 'active' where id = '88888888-0000-0000-0000-000000000003';
update reviews set author_id = null where id = '88888888-0000-0000-0000-0000000000c2';
set local role anon;
select is_empty(
  $$select * from review_badge((select token from t where name = 'anon-review'))$$,
  'חשבון שנמחק (author_id נעשה null): הקישור לא עובד'
);

-- ביטול בידי הכותב, ואז קישור חדש.
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "88888888-0000-0000-0000-00000000000a", "role": "authenticated"}', true);
select is(unshare_review_badge('88888888-0000-0000-0000-0000000000c1'), true, 'הכותב מפסיק לשתף');
select is_empty(
  $$select * from review_badge((select token from t where name = 'first'))$$,
  'והקישור הישן מפסיק לעבוד מיד'
);
select isnt(
  share_review_badge('88888888-0000-0000-0000-0000000000c1'),
  (select token from t where name = 'first'),
  'קישור חדש מקבל טוקן אחר'
);

-- מחיקה של הביקורת מוחקת את הקישור איתה.
reset role;
select lives_ok(
  $$select delete_review('88888888-0000-0000-0000-0000000000c1', 'author_delete', '88888888-0000-0000-0000-00000000000a')$$,
  'הכותב מוחק את הביקורת'
);
select is_empty(
  $$select 1 from review_badges where review_id = '88888888-0000-0000-0000-0000000000c1'$$,
  'ביקורת שנמחקה: גם הקישור נמחק'
);

select * from finish();
rollback;
