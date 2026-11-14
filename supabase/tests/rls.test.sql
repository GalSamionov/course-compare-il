begin;
create extension if not exists pgtap with schema extensions;
select plan(25);

-- נתוני בדיקה. נכתבים כ-postgres, שעוקף את ההרשאות.
insert into categories (id, slug, name, course_type)
values ('aaaaaaaa-0000-0000-0000-000000000001', 'test-cat', 'תחום בדיקה', 'career');
insert into institutions (id, slug, name, kind, business_number)
values ('aaaaaaaa-0000-0000-0000-000000000002', 'test-inst', 'מוסד בדיקה', 'independent', '123456789');
insert into courses (id, slug, institution_id, category_id, title, status) values
  ('aaaaaaaa-0000-0000-0000-000000000003', 'test-active', 'aaaaaaaa-0000-0000-0000-000000000002',
   'aaaaaaaa-0000-0000-0000-000000000001', 'קורס פעיל', 'active'),
  ('aaaaaaaa-0000-0000-0000-000000000004', 'test-draft', 'aaaaaaaa-0000-0000-0000-000000000002',
   'aaaaaaaa-0000-0000-0000-000000000001', 'קורס טיוטה', 'draft'),
  ('aaaaaaaa-0000-0000-0000-000000000009', 'test-two', 'aaaaaaaa-0000-0000-0000-000000000002',
   'aaaaaaaa-0000-0000-0000-000000000001', 'שתי חשבוניות', 'active');
insert into reviews (
  id, course_id, cohort_month, body, display_name, status, proof_kind, paid_bucket_ils, verified_at, published_at
) values
  ('aaaaaaaa-0000-0000-0000-000000000005', 'aaaaaaaa-0000-0000-0000-000000000003', '2026-03-01',
   repeat('א', 80), 'בודק', 'published', 'invoice', 12500, now(), now()),
  -- ביקורת שלא פורסמה עם סכום גבוה: אסור שתשפיע על הטווח.
  ('aaaaaaaa-0000-0000-0000-000000000006', 'aaaaaaaa-0000-0000-0000-000000000003', '2026-03-01',
   repeat('ב', 80), 'בודק', 'pending', 'invoice', 99000, null, null),
  ('aaaaaaaa-0000-0000-0000-000000000007', 'aaaaaaaa-0000-0000-0000-000000000003', '2026-03-01',
   repeat('ג', 80), 'בודק', 'published', 'invoice', 13000, now(), now()),
  ('aaaaaaaa-0000-0000-0000-000000000008', 'aaaaaaaa-0000-0000-0000-000000000003', '2026-03-01',
   repeat('ד', 80), 'בודק', 'published', 'invoice', 14000, now(), now()),
  -- הוכחה שאינה חשבונית: אסור שתשפיע על הטווח.
  ('aaaaaaaa-0000-0000-0000-000000000013', 'aaaaaaaa-0000-0000-0000-000000000003', '2026-03-01',
   repeat('ח', 80), 'בודק', 'published', 'certificate', 50000, now(), now()),
  ('aaaaaaaa-0000-0000-0000-000000000010', 'aaaaaaaa-0000-0000-0000-000000000009', '2026-03-01',
   repeat('ו', 80), 'בודק', 'published', 'invoice', 5000, now(), now()),
  ('aaaaaaaa-0000-0000-0000-000000000011', 'aaaaaaaa-0000-0000-0000-000000000009', '2026-03-01',
   repeat('ז', 80), 'בודק', 'published', 'invoice', 6000, now(), now()),
  -- סבב 3: הטווח מופיע רק מ-5 חשבוניות. לקורס הפעיל עוד שתיים (סך הכול 5), ולקורס השני עוד שתיים (סך הכול 4).
  ('aaaaaaaa-0000-0000-0000-000000000016', 'aaaaaaaa-0000-0000-0000-000000000003', '2026-03-01',
   repeat('י', 80), 'בודק', 'published', 'invoice', 15500, now(), now()),
  ('aaaaaaaa-0000-0000-0000-000000000017', 'aaaaaaaa-0000-0000-0000-000000000003', '2026-03-01',
   repeat('כ', 80), 'בודק', 'published', 'invoice', 16000, now(), now()),
  ('aaaaaaaa-0000-0000-0000-000000000018', 'aaaaaaaa-0000-0000-0000-000000000009', '2026-03-01',
   repeat('ל', 80), 'בודק', 'published', 'invoice', 5500, now(), now()),
  ('aaaaaaaa-0000-0000-0000-000000000019', 'aaaaaaaa-0000-0000-0000-000000000009', '2026-03-01',
   repeat('מ', 80), 'בודק', 'published', 'invoice', 6500, now(), now()),
  -- ביקורת שפורסמה בקורס טיוטה: לא ציבורית.
  ('aaaaaaaa-0000-0000-0000-000000000014', 'aaaaaaaa-0000-0000-0000-000000000004', '2026-03-01',
   repeat('ט', 80), 'בודק', 'published', 'invoice', 1000, now(), now());
insert into method_changes (version, summary, reason) values ('test', 'בדיקה', 'בדיקה');
insert into scores (course_id, kind, status, value, review_count, method_version) values
  ('aaaaaaaa-0000-0000-0000-000000000003', 'graduate', 'scored', 8.2, 23, 'test'),
  ('aaaaaaaa-0000-0000-0000-000000000004', 'graduate', 'scored', 7.0, 9, 'test');
insert into metrics (key, label, scale, course_types, sort_order)
values ('test_m', 'בדיקה', 'likert5', '{career}', 99);
insert into review_answers (review_id, metric_key, value)
values ('aaaaaaaa-0000-0000-0000-000000000005', 'test_m', 5);
insert into vendor_responses (review_id, body) values
  ('aaaaaaaa-0000-0000-0000-000000000005', 'תגובה לביקורת שפורסמה'),
  ('aaaaaaaa-0000-0000-0000-000000000006', 'תגובה לביקורת שלא פורסמה');
insert into lecturers (id, slug, name) values
  ('aaaaaaaa-0000-0000-0000-000000000012', 'test-lec', 'מרצה בקורס טיוטה'),
  ('aaaaaaaa-0000-0000-0000-000000000015', 'test-lec-pub', 'מרצה בקורס פעיל');
insert into course_lecturers (course_id, lecturer_id) values
  ('aaaaaaaa-0000-0000-0000-000000000004', 'aaaaaaaa-0000-0000-0000-000000000012'),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000015');

-- ===== אנונימי =====
set local role anon;

select results_eq(
  $$select slug from courses where slug like 'test-%' order by slug$$,
  $$values ('test-active'), ('test-two')$$,
  'אנונימי רואה רק קורסים שאינם טיוטה'
);

select results_eq(
  $$select count(*)::int from reviews where id in (
      'aaaaaaaa-0000-0000-0000-000000000005', 'aaaaaaaa-0000-0000-0000-000000000006',
      'aaaaaaaa-0000-0000-0000-000000000014')$$,
  $$values (1)$$,
  'אנונימי רואה רק ביקורות שפורסמו, ורק בקורס שאינו טיוטה'
);

select results_eq(
  $$select count(*)::int from scores where course_id in (
      'aaaaaaaa-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000004')$$,
  $$values (1)$$,
  'אנונימי רואה ציונים רק של קורסים שאינם טיוטה'
);

select results_eq(
  $$select min_ils, max_ils, invoice_count from course_paid_range('aaaaaaaa-0000-0000-0000-000000000003')$$,
  $$values (12000, 18000, 5)$$,
  'טווח מ-5 חשבוניות שפורסמו, מעוגל החוצה ל-2,000, בלי ביקורת שלא פורסמה ובלי הוכחה שאינה חשבונית'
);

select is_empty(
  $$select * from course_paid_range('aaaaaaaa-0000-0000-0000-000000000009')$$,
  'אין טווח מארבע חשבוניות'
);

select throws_ok(
  $$select paid_bucket_ils from reviews$$,
  '42501',
  null,
  'אנונימי לא רואה כמה שילם בוגר מסוים'
);

select throws_ok(
  $$select business_number from institutions$$,
  '42501',
  null,
  'אנונימי לא רואה מספר עוסק'
);

select throws_ok(
  $$select * from review_answers$$,
  '42501',
  null,
  'אנונימי לא רואה תשובות של ביקורת בודדת'
);

select is_empty(
  $$select 1 from vendor_responses where review_id = 'aaaaaaaa-0000-0000-0000-000000000006'$$,
  'תגובת מוסד לביקורת שלא פורסמה מוסתרת'
);

select results_eq(
  $$select count(*)::int from vendor_responses where review_id = 'aaaaaaaa-0000-0000-0000-000000000005'$$,
  $$values (1)$$,
  'תגובת מוסד לביקורת שפורסמה גלויה'
);

select is_empty(
  $$select 1 from lecturers where slug = 'test-lec'$$,
  'מרצה שמלמד רק בקורס טיוטה מוסתר'
);

select is_empty(
  $$select 1 from course_lecturers where course_id = 'aaaaaaaa-0000-0000-0000-000000000004'$$,
  'מרצים של קורס טיוטה מוסתרים'
);

select throws_ok(
  $$insert into courses (slug, institution_id, category_id, title)
    values ('hack', 'aaaaaaaa-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 'x')$$,
  '42501',
  null,
  'אנונימי לא יכול להוסיף קורס'
);

select throws_ok(
  $$update courses set title = 'x'$$,
  '42501',
  null,
  'אנונימי לא יכול לשנות קורס'
);

select throws_ok(
  $$delete from scores$$,
  '42501',
  null,
  'אנונימי לא יכול למחוק ציון'
);

reset role;

-- ===== בדיקות על הרשאות, בלי תלות בנתונים =====
select is_empty(
  $$select r, c
    from unnest(array['anon', 'authenticated']) r,
         unnest(array['author_id', 'proof_kind', 'paid_bucket_ils', 'verified_at', 'excluded_reason', 'created_at',
                      'finished_month', 'decision_note', 'read_count', 'submitted_at', 'disputed_at', 'updated_at']) c
    where has_column_privilege(r, 'public.reviews', c, 'select')$$,
  'עמודות פרטיות של ביקורות חסומות לכל משתמש ציבורי'
);

select is_empty(
  $$select c.relname
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity$$,
  'הרשאות ברמת השורה פעילות בכל טבלה'
);

select is_empty(
  $$select c.relname, r.rolname, p.priv
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    cross join (values ('anon'), ('authenticated')) r(rolname)
    cross join (values ('INSERT'), ('UPDATE'), ('DELETE'), ('TRUNCATE'), ('REFERENCES'), ('TRIGGER')) p(priv)
    where n.nspname = 'public' and c.relkind in ('r', 'p')
      and (
        has_table_privilege(r.rolname, c.oid, p.priv)
        -- הרשאה לעמודות בודדות (מסבב 3) לא נראית ב-has_table_privilege.
        or (p.priv in ('INSERT', 'UPDATE', 'REFERENCES') and has_any_column_privilege(r.rolname, c.oid, p.priv))
      )
      -- תוכנית 2ב: משתמש מחובר כותב ברשימות האישיות שלו, ורק בהרשאות האלה. ההגבלה לשורות שלו ב-RLS.
      -- סבב 3: כותב שומר טיוטה ועונה בה. אילו עמודות בדיוק: reviews.test.sql.
      and (r.rolname, c.relname, p.priv) not in (
        ('authenticated', 'saved_courses', 'INSERT'), ('authenticated', 'saved_courses', 'DELETE'),
        ('authenticated', 'compare_items', 'INSERT'), ('authenticated', 'compare_items', 'DELETE'),
        ('authenticated', 'user_answers', 'INSERT'), ('authenticated', 'user_answers', 'UPDATE'),
        ('authenticated', 'reviews', 'INSERT'), ('authenticated', 'reviews', 'UPDATE'),
        ('authenticated', 'review_answers', 'INSERT'), ('authenticated', 'review_answers', 'UPDATE'),
        ('authenticated', 'review_answers', 'DELETE')
      )$$,
  'אין הרשאת כתיבה ציבורית, חוץ מהרשימות האישיות ומהטיוטה של משתמש מחובר'
);

-- ===== השרת, שכותב עם המפתח הסודי =====
set local role service_role;

select throws_ok(
  $$update scores set value = 9.9 where course_id = 'aaaaaaaa-0000-0000-0000-000000000003'$$,
  'P0001',
  'scores rows are append-only',
  'גם השרת לא יכול לשנות ציון'
);

select throws_ok(
  $$delete from scores where course_id = 'aaaaaaaa-0000-0000-0000-000000000003'$$,
  'P0001',
  'scores rows are append-only',
  'גם השרת לא יכול למחוק ציון'
);

select throws_ok(
  $$update method_changes set summary = 'x' where version = 'test'$$,
  'P0001',
  'method_changes rows are append-only',
  'גם השרת לא יכול לשנות את יומן השיטה'
);

reset role;

select throws_ok(
  $$truncate scores$$,
  'P0001',
  'scores rows are append-only',
  'אי אפשר לרוקן את טבלת הציונים'
);

select throws_ok(
  $$insert into reviews (course_id, cohort_month, body, display_name, status)
    values ('aaaaaaaa-0000-0000-0000-000000000003', '2026-03-01', repeat('ה', 80), 'x', 'published')$$,
  '23514',
  null,
  'ביקורת לא מתפרסמת בלי אימות'
);

select throws_ok(
  $$insert into reviews (course_id, cohort_month, body, display_name, display_mode, status)
    values ('aaaaaaaa-0000-0000-0000-000000000003', '2026-03-01', repeat('ה', 80), 'דנה כהן', 'anonymous', 'draft')$$,
  '23514',
  null,
  'ביקורת אנונימית לא שומרת שם אמיתי'
);

create table public.test_future_table (id integer);
select ok(
  not has_table_privilege('anon', 'public.test_future_table', 'select')
  and not has_table_privilege('anon', 'public.test_future_table', 'insert')
  and not has_table_privilege('authenticated', 'public.test_future_table', 'insert'),
  'טבלה חדשה לא נפתחת לציבור מעצמה'
);

select * from finish();
rollback;
