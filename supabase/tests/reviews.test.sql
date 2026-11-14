begin;
create extension if not exists pgtap with schema extensions;
select plan(20);

-- נתוני בדיקה, כ-postgres שעוקף את ההרשאות. א' כותב, ב' משתמש אחר, ג' מנהל.
insert into auth.users (id, email) values
  ('33333333-0000-0000-0000-00000000000a', 'writer-a@example.test'),
  ('33333333-0000-0000-0000-00000000000b', 'user-b@example.test'),
  ('33333333-0000-0000-0000-00000000000c', 'admin-c@example.test');
insert into admins (user_id) values ('33333333-0000-0000-0000-00000000000c');
insert into categories (id, slug, name, course_type)
values ('33333333-0000-0000-0000-000000000001', 'rev-cat', 'תחום בדיקה', 'hobby');
insert into institutions (id, slug, name, kind)
values ('33333333-0000-0000-0000-000000000002', 'rev-inst', 'מוסד בדיקה', 'independent');
insert into courses (id, slug, institution_id, category_id, title, status) values
  ('33333333-0000-0000-0000-000000000003', 'rev-active', '33333333-0000-0000-0000-000000000002',
   '33333333-0000-0000-0000-000000000001', 'קורס פעיל', 'active');
insert into metrics (key, label, scale, course_types, sort_order) values
  ('rev_yes', 'כן או לא', 'yes_no', '{hobby}', 98)
on conflict (key) do nothing;
-- ביקורת שפורסמה, ל"עזר לי".
insert into reviews (id, course_id, cohort_month, body, display_name, status, proof_kind, verified_at, published_at)
values ('33333333-0000-0000-0000-000000000010', '33333333-0000-0000-0000-000000000003', '2026-01-01',
        repeat('א', 80), 'בודק', 'published', 'certificate', now(), now());

-- ===== הרשאות, בלי תלות בנתונים =====

select results_eq(
  $$select array_agg(column_name::text collate "default" order by column_name::text collate "default") from information_schema.columns
    where table_schema = 'public' and table_name = 'reviews'
      and has_column_privilege('authenticated', 'public.reviews', column_name, 'UPDATE')$$,
  $$values (array['author_title', 'body', 'cohort_month', 'display_mode', 'display_name', 'finished_month'])$$,
  'כותב משנה רק את העמודות הבטוחות: לא סטטוס, אימות, סוג הוכחה, סכום או פרסום'
);

select results_eq(
  $$select array_agg(column_name::text collate "default" order by column_name::text collate "default") from information_schema.columns
    where table_schema = 'public' and table_name = 'reviews'
      and has_column_privilege('authenticated', 'public.reviews', column_name, 'INSERT')$$,
  $$values (array['author_id', 'author_title', 'body', 'cohort_month', 'course_id', 'display_mode', 'display_name', 'finished_month'])$$,
  'כותב פותח טיוטה רק עם העמודות הבטוחות'
);

select is_empty(
  $$select r, t from unnest(array['anon', 'authenticated']) r,
         unnest(array['proofs', 'admins', 'audit_log', 'review_helpful']) t
    where has_table_privilege(r, 'public.' || t, 'SELECT') or has_any_column_privilege(r, 'public.' || t, 'SELECT')$$,
  'הוכחות, מנהלים, יומן הפעולות ו"עזר לי" סגורים לכל משתמש ציבורי'
);

select is_empty(
  $$select r, f from unnest(array['anon', 'authenticated']) r,
         unnest(array[
           'public.submit_review(uuid, uuid, jsonb)',
           'public.publish_review(uuid, uuid, public.proof_kind, integer)',
           'public.return_review(uuid, uuid, text, text, text)',
           'public.delete_review(uuid, text, uuid)',
           'public.proof_orphans(integer)'
         ]) f
    where has_function_privilege(r, f, 'execute')$$,
  'רק השרת מעביר ביקורת בין מצבים ומוחק אותה'
);

-- ===== כותב א' =====
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "33333333-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

select lives_ok(
  $$insert into reviews (course_id, author_id, cohort_month)
    values ('33333333-0000-0000-0000-000000000003', '33333333-0000-0000-0000-00000000000a', '2026-02-01')$$,
  'כותב פותח טיוטה בלי טקסט, והיא נשמרת'
);

-- מזהה קבוע לטיוטה, לשאר הבדיקות. הכותב לא בוחר מזהה (אין לו הרשאה ל-id), ולכן כ-postgres.
reset role;
update reviews set id = '33333333-0000-0000-0000-000000000020'
where author_id = '33333333-0000-0000-0000-00000000000a';
set local role authenticated;

select throws_ok(
  $$insert into reviews (course_id, author_id, cohort_month, status)
    values ('33333333-0000-0000-0000-000000000003', '33333333-0000-0000-0000-00000000000a', '2026-03-01', 'published')$$,
  '42501',
  null,
  'כותב לא יכול לפרסם בעצמו'
);

select throws_ok(
  $$update reviews set status = 'pending' where id = '33333333-0000-0000-0000-000000000020'$$,
  '42501',
  null,
  'כותב לא יכול לשלוח לבדיקה בלי השרת'
);

select throws_ok(
  $$insert into review_answers (review_id, metric_key, value)
    values ('33333333-0000-0000-0000-000000000020', 'rev_yes', 3)$$,
  '23514',
  null,
  'תשובת כן או לא נשמרת רק כ-1 או כ-5'
);

select lives_ok(
  $$insert into review_answers (review_id, metric_key, value)
    values ('33333333-0000-0000-0000-000000000020', 'rev_yes', 5)$$,
  'כותב עונה בטיוטה שלו'
);

-- העלאה לאחסון: רק לתיקייה שלו.
select lives_ok(
  $$insert into storage.objects (bucket_id, name, owner)
    values ('proofs', '33333333-0000-0000-0000-00000000000a/33333333-0000-0000-0000-000000000020/a.pdf',
            '33333333-0000-0000-0000-00000000000a')$$,
  'כותב מעלה הוכחה לתיקייה שלו'
);

select throws_ok(
  $$insert into storage.objects (bucket_id, name, owner)
    values ('proofs', '33333333-0000-0000-0000-00000000000b/x/b.pdf', '33333333-0000-0000-0000-00000000000a')$$,
  '42501',
  null,
  'כותב לא מעלה לתיקייה של מישהו אחר'
);

-- גם ההוכחה שלו עצמו: לא רואה, לא מחליף ולא מוחק. storage.allow_delete_query עוקף את החסימה של
-- Supabase למחיקה ב-SQL, כדי שהבדיקה תגיע ל-RLS.
select set_config('storage.allow_delete_query', 'true', true);
select results_eq(
  $$with changed as (update storage.objects set name = name || '.x' where bucket_id = 'proofs' returning 1),
         removed as (delete from storage.objects where bucket_id = 'proofs' returning 1)
    select (select count(*)::int from storage.objects where bucket_id = 'proofs'),
           (select count(*)::int from changed), (select count(*)::int from removed)$$,
  $$values (0, 0, 0)$$,
  'אחרי ההעלאה הכותב לא רואה, לא מחליף ולא מוחק את ההוכחה'
);

select throws_ok(
  $$select id from proofs$$,
  '42501',
  null,
  'כותב לא קורא את טבלת ההוכחות'
);

-- ===== משתמש ב' =====
select set_config('request.jwt.claims', '{"sub": "33333333-0000-0000-0000-00000000000b", "role": "authenticated"}', true);

select results_eq(
  $$with changed as (update reviews set body = 'x' where id = '33333333-0000-0000-0000-000000000020' returning 1)
    select (select count(*)::int from reviews where id = '33333333-0000-0000-0000-000000000020'),
           (select count(*)::int from changed),
           (select count(*)::int from my_reviews())$$,
  $$values (0, 0, 0)$$,
  'משתמש אחר לא רואה ולא משנה טיוטה של מישהו אחר'
);

select throws_ok(
  $$insert into review_answers (review_id, metric_key, value)
    values ('33333333-0000-0000-0000-000000000020', 'rev_yes', 1)$$,
  '42501',
  null,
  'משתמש אחר לא עונה בטיוטה של מישהו אחר'
);

select is(is_admin(), false, 'משתמש רגיל אינו מנהל');

-- ===== "עזר לי", בלי התחברות =====
set local role anon;

select results_eq(
  $$select is_helpful, total from toggle_helpful('33333333-0000-0000-0000-000000000010', '11111111-1111-4111-8111-111111111111')
    union all
    select is_helpful, total from toggle_helpful('33333333-0000-0000-0000-000000000010', '22222222-2222-4222-8222-222222222222')
    union all
    select is_helpful, total from toggle_helpful('33333333-0000-0000-0000-000000000010', '11111111-1111-4111-8111-111111111111')$$,
  $$values (true, 1), (true, 2), (false, 1)$$,
  '"עזר לי" נספר פעם אחת לכל דפדפן, ולחיצה שנייה מבטלת'
);

select throws_ok(
  $$select * from toggle_helpful('33333333-0000-0000-0000-000000000020', '11111111-1111-4111-8111-111111111111')$$,
  'P0002',
  null,
  'אי אפשר לסמן "עזר לי" על טיוטה'
);

reset role;

-- ===== אחרי השליחה =====
select throws_ok(
  $$update reviews set status = 'pending' where id = '33333333-0000-0000-0000-000000000020'$$,
  '23514',
  null,
  'ביקורת קצרה מ-80 תווים לא יוצאת מטיוטה'
);

update reviews set body = repeat('ב', 80), display_name = 'א.', status = 'pending'
where id = '33333333-0000-0000-0000-000000000020';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "33333333-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

select results_eq(
  $$with changed as (update reviews set body = repeat('ג', 90) where id = '33333333-0000-0000-0000-000000000020' returning 1)
    select count(*)::int from changed$$,
  $$values (0)$$,
  'אחרי השליחה הכותב כבר לא משנה את הביקורת'
);

select * from finish();
rollback;
