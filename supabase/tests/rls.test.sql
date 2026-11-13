begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

-- נתוני בדיקה. נכתבים כמשתמש-על, שעוקף את ההרשאות.
insert into categories (id, slug, name, course_type)
values ('aaaaaaaa-0000-0000-0000-000000000001', 'test-cat', 'תחום בדיקה', 'career');
insert into institutions (id, slug, name, kind)
values ('aaaaaaaa-0000-0000-0000-000000000002', 'test-inst', 'מוסד בדיקה', 'school');
insert into courses (id, slug, institution_id, category_id, title, status) values
  ('aaaaaaaa-0000-0000-0000-000000000003', 'test-active', 'aaaaaaaa-0000-0000-0000-000000000002',
   'aaaaaaaa-0000-0000-0000-000000000001', 'קורס פעיל', 'active'),
  ('aaaaaaaa-0000-0000-0000-000000000004', 'test-draft', 'aaaaaaaa-0000-0000-0000-000000000002',
   'aaaaaaaa-0000-0000-0000-000000000001', 'קורס טיוטה', 'draft');
insert into reviews (
  id, course_id, cohort_month, body, display_name, status, proof_kind, paid_bucket_ils, verified_at, published_at
) values
  ('aaaaaaaa-0000-0000-0000-000000000005', 'aaaaaaaa-0000-0000-0000-000000000003', '2026-03-01',
   repeat('א', 80), 'בודק', 'published', 'invoice', 12500, now(), now()),
  ('aaaaaaaa-0000-0000-0000-000000000006', 'aaaaaaaa-0000-0000-0000-000000000003', '2026-03-01',
   repeat('ב', 80), 'בודק', 'pending', null, null, null, null),
  ('aaaaaaaa-0000-0000-0000-000000000007', 'aaaaaaaa-0000-0000-0000-000000000003', '2026-03-01',
   repeat('ג', 80), 'בודק', 'published', 'invoice', 13000, now(), now()),
  ('aaaaaaaa-0000-0000-0000-000000000008', 'aaaaaaaa-0000-0000-0000-000000000003', '2026-03-01',
   repeat('ד', 80), 'בודק', 'published', 'invoice', 14000, now(), now());
insert into method_changes (version, summary, reason) values ('test', 'בדיקה', 'בדיקה');
insert into scores (course_id, kind, status, value, review_count, method_version)
values ('aaaaaaaa-0000-0000-0000-000000000003', 'graduate', 'scored', 8.2, 23, 'test');

set local role anon;

select results_eq(
  $$select slug from courses where slug like 'test-%' order by slug$$,
  $$values ('test-active')$$,
  'אנונימי רואה רק קורסים שאינם טיוטה'
);

select results_eq(
  $$select count(*)::int from reviews where id in (
      'aaaaaaaa-0000-0000-0000-000000000005', 'aaaaaaaa-0000-0000-0000-000000000006')$$,
  $$values (1)$$,
  'אנונימי רואה רק ביקורות שפורסמו'
);

select results_eq(
  $$select count(*)::int from scores where course_id = 'aaaaaaaa-0000-0000-0000-000000000003'$$,
  $$values (1)$$,
  'אנונימי רואה ציונים'
);

select throws_ok(
  $$insert into courses (slug, institution_id, category_id, title)
    values ('hack', 'aaaaaaaa-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 'x')$$,
  '42501',
  null,
  'אנונימי לא יכול להוסיף קורס'
);

select throws_ok(
  $$insert into reviews (course_id, cohort_month, body, display_name, status)
    values ('aaaaaaaa-0000-0000-0000-000000000003', '2026-03-01', repeat('ג', 80), 'x', 'published')$$,
  '42501',
  null,
  'אנונימי לא יכול להוסיף ביקורת'
);

select throws_ok(
  $$insert into scores (course_id, kind, status, value, review_count, method_version)
    values ('aaaaaaaa-0000-0000-0000-000000000003', 'graduate', 'scored', 10, 1, 'x')$$,
  '42501',
  null,
  'אנונימי לא יכול להוסיף ציון'
);

select throws_ok(
  $$select paid_bucket_ils from reviews$$,
  '42501',
  null,
  'אנונימי לא רואה כמה שילם בוגר מסוים'
);

select results_eq(
  $$select min_ils, max_ils, invoice_count from course_paid_range('aaaaaaaa-0000-0000-0000-000000000003')$$,
  $$values (12500, 14500, 3)$$,
  'טווח מחירים מוצג משלוש חשבוניות, בלי סכום של אדם אחד'
);

reset role;

select throws_ok(
  $$update scores set value = 9.9 where course_id = 'aaaaaaaa-0000-0000-0000-000000000003'$$,
  'P0001',
  'scores rows are append-only',
  'אי אפשר לשנות ציון, גם כמשתמש-על'
);

select throws_ok(
  $$delete from scores where course_id = 'aaaaaaaa-0000-0000-0000-000000000003'$$,
  'P0001',
  'scores rows are append-only',
  'אי אפשר למחוק ציון, גם כמשתמש-על'
);

select throws_ok(
  $$insert into reviews (course_id, cohort_month, body, display_name, status)
    values ('aaaaaaaa-0000-0000-0000-000000000003', '2026-03-01', repeat('ה', 80), 'x', 'published')$$,
  '23514',
  null,
  'ביקורת לא מתפרסמת בלי אימות, גם כמשתמש-על'
);

select * from finish();
rollback;
