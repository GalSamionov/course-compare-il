begin;
create extension if not exists pgtap with schema extensions;
select plan(36);

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
   '33333333-0000-0000-0000-000000000001', 'קורס פעיל', 'active'),
  ('33333333-0000-0000-0000-000000000004', 'rev-draft', '33333333-0000-0000-0000-000000000002',
   '33333333-0000-0000-0000-000000000001', 'קורס טיוטה', 'draft');
insert into metrics (key, label, scale, course_types, sort_order) values
  ('rev_yes', 'כן או לא', 'yes_no', '{hobby}', 98)
on conflict (key) do nothing;
-- ביקורות שפורסמו: אחת בקורס פעיל, ל"עזר לי" ולספירת קריאות, ואחת בקורס טיוטה, שאינה ציבורית.
insert into reviews (id, course_id, cohort_month, body, display_name, status, proof_kind, verified_at, published_at)
values
  ('33333333-0000-0000-0000-000000000010', '33333333-0000-0000-0000-000000000003', '2026-01-01',
   repeat('א', 80), 'בודק', 'published', 'certificate', now(), now()),
  ('33333333-0000-0000-0000-000000000011', '33333333-0000-0000-0000-000000000004', '2026-01-01',
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
           'public.submit_review(uuid, uuid, jsonb, jsonb)',
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

-- העלאה לאחסון: רק '<uid>/<טיוטה שלו>/<uuid>.<pdf|jpg|png>', כמו uploadProof ב-reviews/browser.ts.
select lives_ok(
  $$insert into storage.objects (bucket_id, name, owner, owner_id)
    values ('proofs',
            '33333333-0000-0000-0000-00000000000a/33333333-0000-0000-0000-000000000020/f0000000-0000-4000-8000-000000000001.pdf',
            '33333333-0000-0000-0000-00000000000a', '33333333-0000-0000-0000-00000000000a')$$,
  'כותב מעלה הוכחה לטיוטה שלו'
);

select throws_ok(
  $$insert into storage.objects (bucket_id, name, owner, owner_id)
    values ('proofs', '33333333-0000-0000-0000-00000000000a/33333333-0000-0000-0000-000000000020/a.pdf',
            '33333333-0000-0000-0000-00000000000a', '33333333-0000-0000-0000-00000000000a')$$,
  '42501',
  null,
  'שם קובץ שאינו מזהה אקראי נחסם'
);

select throws_ok(
  $$insert into storage.objects (bucket_id, name, owner, owner_id)
    values ('proofs',
            '33333333-0000-0000-0000-00000000000a/33333333-0000-0000-0000-000000000020/f0000000-0000-4000-8000-000000000002.jpeg',
            '33333333-0000-0000-0000-00000000000a', '33333333-0000-0000-0000-00000000000a')$$,
  '42501',
  null,
  'סיומת אחרת נחסמת, גם jpeg'
);

select throws_ok(
  $$insert into storage.objects (bucket_id, name, owner, owner_id)
    values ('proofs',
            '33333333-0000-0000-0000-00000000000b/33333333-0000-0000-0000-000000000020/f0000000-0000-4000-8000-000000000003.pdf',
            '33333333-0000-0000-0000-00000000000a', '33333333-0000-0000-0000-00000000000a')$$,
  '42501',
  null,
  'כותב לא מעלה לתיקייה של מישהו אחר'
);

-- עד 30 קבצים ליממה למשתמש. עוד 29, כאילו הועלו היום.
reset role;
insert into storage.objects (bucket_id, name, owner, owner_id)
select 'proofs',
       '33333333-0000-0000-0000-00000000000a/33333333-0000-0000-0000-000000000020/' || gen_random_uuid() || '.pdf',
       '33333333-0000-0000-0000-00000000000a', '33333333-0000-0000-0000-00000000000a'
from generate_series(1, 29);
set local role authenticated;

select throws_ok(
  $$insert into storage.objects (bucket_id, name, owner, owner_id)
    values ('proofs',
            '33333333-0000-0000-0000-00000000000a/33333333-0000-0000-0000-000000000020/f0000000-0000-4000-8000-000000000004.pdf',
            '33333333-0000-0000-0000-00000000000a', '33333333-0000-0000-0000-00000000000a')$$,
  '42501',
  null,
  'הקובץ ה-31 ביממה נחסם'
);

-- הקבצים "הועלו" לפני יומיים, כדי שהתקרה לא תשפיע על הבדיקות הבאות.
reset role;
update storage.objects set created_at = now() - interval '2 days'
where bucket_id = 'proofs' and owner_id = '33333333-0000-0000-0000-00000000000a';
set local role authenticated;

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

select throws_ok(
  $$insert into storage.objects (bucket_id, name, owner, owner_id)
    values ('proofs',
            '33333333-0000-0000-0000-00000000000b/33333333-0000-0000-0000-000000000020/f0000000-0000-4000-8000-000000000005.pdf',
            '33333333-0000-0000-0000-00000000000b', '33333333-0000-0000-0000-00000000000b')$$,
  '42501',
  null,
  'משתמש לא מעלה הוכחה לטיוטה של מישהו אחר, גם מהתיקייה שלו'
);

select is(is_admin(), false, 'משתמש רגיל אינו מנהל');

-- ===== "עזר לי" וספירת קריאות, בלי התחברות =====
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

select count_review_read('33333333-0000-0000-0000-000000000010');
select count_review_read('33333333-0000-0000-0000-000000000011');
reset role;

select results_eq(
  $$select read_count from reviews
    where id in ('33333333-0000-0000-0000-000000000010', '33333333-0000-0000-0000-000000000011') order by id$$,
  $$values (1), (0)$$,
  'קריאה נספרת רק בביקורת ציבורית, ולא בביקורת שפורסמה בקורס טיוטה'
);

-- ===== השליחה לבדיקה =====
select throws_ok(
  $$update reviews set status = 'pending' where id = '33333333-0000-0000-0000-000000000020'$$,
  '23514',
  null,
  'ביקורת קצרה מ-80 תווים לא יוצאת מטיוטה'
);

update reviews set body = repeat('ב', 80), display_name = 'א.'
where id = '33333333-0000-0000-0000-000000000020';
set local role service_role;

select throws_ok(
  $$select submit_review(
      '33333333-0000-0000-0000-000000000020', '33333333-0000-0000-0000-00000000000a',
      jsonb_build_array(jsonb_build_object(
        'path', '33333333-0000-0000-0000-00000000000b/33333333-0000-0000-0000-000000000020/f0000000-0000-4000-8000-000000000001.pdf',
        'sha256', repeat('a', 64), 'kind', 'invoice', 'mime', 'application/pdf', 'size', 1000, 'check_status', 'not_checked')),
      '{}')$$,
  '22023',
  null,
  'השרת לא מצרף הוכחה מתיקייה של מישהו אחר'
);

-- מה שהשרת בדק: מה שבמסד עכשיו, חוץ מהתשובה, שהכותב שינה מאז.
select throws_ok(
  $$select submit_review(
      '33333333-0000-0000-0000-000000000020', '33333333-0000-0000-0000-00000000000a',
      jsonb_build_array(jsonb_build_object(
        'path', '33333333-0000-0000-0000-00000000000a/33333333-0000-0000-0000-000000000020/f0000000-0000-4000-8000-000000000001.pdf',
        'sha256', repeat('a', 64), 'kind', 'invoice', 'mime', 'application/pdf', 'size', 1000, 'check_status', 'not_checked')),
      (select jsonb_build_object('cohort_month', cohort_month, 'finished_month', finished_month, 'body', body,
                                 'display_name', display_name, 'display_mode', display_mode, 'author_title', author_title,
                                 'answers', jsonb_build_object('rev_yes', 1))
       from reviews where id = '33333333-0000-0000-0000-000000000020'))$$,
  '40001',
  null,
  'טיוטה שהשתנתה אחרי הבדיקה לא נשלחת'
);

select lives_ok(
  $$select submit_review(
      '33333333-0000-0000-0000-000000000020', '33333333-0000-0000-0000-00000000000a',
      jsonb_build_array(jsonb_build_object(
        'path', '33333333-0000-0000-0000-00000000000a/33333333-0000-0000-0000-000000000020/f0000000-0000-4000-8000-000000000001.pdf',
        'sha256', repeat('a', 64), 'kind', 'invoice', 'mime', 'application/pdf', 'size', 1000, 'check_status', 'not_checked')),
      (select jsonb_build_object('cohort_month', cohort_month, 'finished_month', finished_month, 'body', body,
                                 'display_name', display_name, 'display_mode', display_mode, 'author_title', author_title,
                                 'answers', jsonb_build_object('rev_yes', 5))
       from reviews where id = '33333333-0000-0000-0000-000000000020'))$$,
  'השרת שולח לבדיקה טיוטה שלא השתנתה מאז שנבדקה'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "33333333-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

select results_eq(
  $$with changed as (update reviews set body = repeat('ג', 90) where id = '33333333-0000-0000-0000-000000000020' returning 1)
    select count(*)::int from changed$$,
  $$values (0)$$,
  'אחרי השליחה הכותב כבר לא משנה את הביקורת'
);

select throws_ok(
  $$insert into storage.objects (bucket_id, name, owner, owner_id)
    values ('proofs',
            '33333333-0000-0000-0000-00000000000a/33333333-0000-0000-0000-000000000020/f0000000-0000-4000-8000-000000000006.pdf',
            '33333333-0000-0000-0000-00000000000a', '33333333-0000-0000-0000-00000000000a')$$,
  '42501',
  null,
  'אחרי השליחה כבר לא מעלים הוכחה לביקורת'
);

-- ===== מנהל, כותב ויומן: גם השרת לא סומך על מה שהוא עצמו מעביר =====
reset role;
set local role service_role;

select throws_ok(
  $$select publish_review('33333333-0000-0000-0000-000000000020', '33333333-0000-0000-0000-00000000000b', 'invoice', 12500)$$,
  '42501',
  null,
  'רק מנהל מפרסם'
);

select throws_ok(
  $$select return_review('33333333-0000-0000-0000-000000000020', '33333333-0000-0000-0000-00000000000b', 'reject', 'other', 'x')$$,
  '42501',
  null,
  'רק מנהל מחזיר לטיוטה'
);

select is(
  publish_review('33333333-0000-0000-0000-000000000020', '33333333-0000-0000-0000-00000000000c', 'invoice', 12500),
  'rev-active',
  'מנהל מפרסם, ומקבל את כתובת הקורס'
);

select results_eq(
  $$select details from audit_log where review_id = '33333333-0000-0000-0000-000000000020' and action = 'approve'$$,
  $$values ('{"proof_kind": "invoice", "has_amount": true}'::jsonb)$$,
  'היומן שומר שהיה סכום, ולא את הסכום'
);

select throws_ok(
  $$select * from delete_review('33333333-0000-0000-0000-000000000020', 'author_delete', '33333333-0000-0000-0000-00000000000b')$$,
  '42501',
  null,
  'מחיקה בשם כותב רק של ביקורת שלו'
);

-- ===== עד 20 טיוטות פתוחות למשתמש. לכותב א' כבר אין טיוטה: היא פורסמה =====
reset role;
set local role authenticated;

select throws_ok(
  $$insert into reviews (course_id, author_id, cohort_month)
    select '33333333-0000-0000-0000-000000000003'::uuid, '33333333-0000-0000-0000-00000000000a'::uuid,
           (date '2000-01-01' + make_interval(months => g))::date
    from generate_series(1, 21) g$$,
  '42501',
  null,
  '21 טיוטות לא נכנסות, גם בבקשה אחת'
);

select lives_ok(
  $$insert into reviews (course_id, author_id, cohort_month)
    select '33333333-0000-0000-0000-000000000003'::uuid, '33333333-0000-0000-0000-00000000000a'::uuid,
           (date '2000-01-01' + make_interval(months => g))::date
    from generate_series(1, 20) g$$,
  '20 טיוטות פתוחות נכנסות'
);

select * from finish();
rollback;
