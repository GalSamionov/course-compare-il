begin;
create extension if not exists pgtap with schema extensions;
select plan(5);

-- שני משתמשים, ונתוני בדיקה של משתמש א'. נכתבים כ-postgres, שעוקף את ההרשאות.
insert into auth.users (id, email) values
  ('bbbbbbbb-0000-0000-0000-00000000000a', 'user-a@example.com'),
  ('bbbbbbbb-0000-0000-0000-00000000000b', 'user-b@example.com');
insert into categories (id, slug, name, course_type)
values ('bbbbbbbb-0000-0000-0000-000000000001', 'lists-cat', 'תחום בדיקה', 'career');
insert into institutions (id, slug, name, kind)
values ('bbbbbbbb-0000-0000-0000-000000000002', 'lists-inst', 'מוסד בדיקה', 'independent');
insert into courses (id, slug, institution_id, category_id, title, status)
select ('bbbbbbbb-0000-0000-0000-00000000001' || n)::uuid, 'lists-' || n,
       'bbbbbbbb-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000001', 'קורס ' || n, 'active'
from generate_series(1, 4) as n;
insert into saved_courses (user_id, course_id)
select 'bbbbbbbb-0000-0000-0000-00000000000a', ('bbbbbbbb-0000-0000-0000-00000000001' || n)::uuid
from generate_series(1, 4) as n;
insert into compare_items (user_id, course_id, position) values
  ('bbbbbbbb-0000-0000-0000-00000000000a', 'bbbbbbbb-0000-0000-0000-000000000011', 1),
  ('bbbbbbbb-0000-0000-0000-00000000000a', 'bbbbbbbb-0000-0000-0000-000000000012', 2),
  ('bbbbbbbb-0000-0000-0000-00000000000a', 'bbbbbbbb-0000-0000-0000-000000000013', 3);
insert into user_answers (user_id, answers)
values ('bbbbbbbb-0000-0000-0000-00000000000a', '{"cat": "lists-cat"}');

-- ===== משתמש ב' =====
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "bbbbbbbb-0000-0000-0000-00000000000b", "role": "authenticated"}', true);

-- כל בדיקה מנסה לקרוא ולשנות באותה פקודה. השורה המוחזרת: כמה שורות של א' ב' ראה, וכמה שינה.
select results_eq(
  $$with removed as (delete from saved_courses where user_id = 'bbbbbbbb-0000-0000-0000-00000000000a' returning 1)
    select (select count(*)::int from saved_courses), (select count(*)::int from removed)$$,
  $$values (0, 0)$$,
  'משתמש אחר לא רואה ולא מוחק קורסים ששמר מישהו אחר'
);

select results_eq(
  $$with removed as (delete from compare_items where user_id = 'bbbbbbbb-0000-0000-0000-00000000000a' returning 1)
    select (select count(*)::int from compare_items), (select count(*)::int from removed)$$,
  $$values (0, 0)$$,
  'משתמש אחר לא רואה ולא מוציא קורסים מההשוואה של מישהו אחר'
);

select results_eq(
  $$with changed as (update user_answers set answers = '{}' where user_id = 'bbbbbbbb-0000-0000-0000-00000000000a' returning 1)
    select (select count(*)::int from user_answers), (select count(*)::int from changed)$$,
  $$values (0, 0)$$,
  'משתמש אחר לא רואה ולא משנה את התשובות של מישהו אחר'
);

select throws_ok(
  $$insert into saved_courses (user_id, course_id)
    values ('bbbbbbbb-0000-0000-0000-00000000000a', 'bbbbbbbb-0000-0000-0000-000000000011')$$,
  '42501',
  null,
  'משתמש לא יכול לשמור קורס בשם של מישהו אחר'
);

-- ===== משתמש א' =====
select set_config('request.jwt.claims', '{"sub": "bbbbbbbb-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

select throws_ok(
  $$insert into compare_items (user_id, course_id, position)
    values ('bbbbbbbb-0000-0000-0000-00000000000a', 'bbbbbbbb-0000-0000-0000-000000000014', 4)$$,
  '23514',
  null,
  'בהשוואה יש מקום רק לשלושה קורסים'
);

select * from finish();
rollback;
