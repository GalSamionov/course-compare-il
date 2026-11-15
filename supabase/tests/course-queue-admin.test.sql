begin;
create extension if not exists pgtap with schema extensions;
select plan(34);

-- תוכנית 5ב: התור של הקורסים, היומן, ובקשה של מוסד להוסיף קורס (20261115210001_course_queue_admin.sql).
-- נתוני בדיקה, כ-postgres. כל שאילתה מוגבלת לנתונים האלה: המסד המקומי משותף, ויכולות להיות בו בקשות אחרות.
insert into auth.users (id, email) values
  ('66666666-0000-0000-0000-00000000000a', 'cq-admin@example.test'),
  ('66666666-0000-0000-0000-00000000000b', 'cq-user@example.test');
insert into admins (user_id) values ('66666666-0000-0000-0000-00000000000a');
insert into categories (id, slug, name, course_type)
values ('66666666-0000-0000-0000-000000000001', 'cq-cat', 'תחום בדיקה', 'career');
insert into institutions (id, slug, name, kind, website) values
  ('66666666-0000-0000-0000-000000000002', 'cq-inst', 'מוסד בדיקה', 'school', 'https://www.cq.example/'),
  ('66666666-0000-0000-0000-000000000004', 'cq-other', 'מוסד אחר', 'school', 'https://other.example/'),
  ('66666666-0000-0000-0000-000000000005', 'cq-nosite', 'מוסד בלי אתר', 'school', null);
insert into courses (id, slug, institution_id, category_id, title, status, site_price_ils) values
  ('66666666-0000-0000-0000-000000000003', 'cq-course', '66666666-0000-0000-0000-000000000002',
   '66666666-0000-0000-0000-000000000001', 'קורס בדיקה', 'active', 10000),
  ('66666666-0000-0000-0000-000000000006', 'cq-draft', '66666666-0000-0000-0000-000000000002',
   '66666666-0000-0000-0000-000000000001', 'קורס חדש', 'draft', null);
insert into course_change_queue (course_id, kind, field, old_value, new_value, quote, confidence, reasons) values
  ('66666666-0000-0000-0000-000000000003', 'field', 'site_price_ils', '10000', '14500', 'המחיר: 14,500 ₪', 'high', '{price_jump}'),
  ('66666666-0000-0000-0000-000000000003', 'field', 'total_hours', '120', '400', 'סך הכול 400 שעות', 'medium', '{low_confidence}'),
  ('66666666-0000-0000-0000-000000000003', 'field', 'certificate', 'null', '"תעודה"', 'תעודה', 'low', '{low_confidence}'),
  ('66666666-0000-0000-0000-000000000003', 'field', 'region', '"מרכז"', '"צפון"', 'בצפון', 'low', '{low_confidence}'),
  ('66666666-0000-0000-0000-000000000006', 'new_course', null, null, '{}', null, null, '{new_course}');
create temp table q as
  select field, kind, id from course_change_queue where course_id in ('66666666-0000-0000-0000-000000000003', '66666666-0000-0000-0000-000000000006');
grant select on q to anon, authenticated, service_role;

-- ===== הציבור: לא רואה ולא כותב =====

select ok(
  not has_table_privilege('anon', 'public.institution_requests', 'SELECT')
  and not has_table_privilege('authenticated', 'public.institution_requests', 'SELECT')
  and not has_table_privilege('anon', 'public.institution_requests', 'INSERT')
  and not has_table_privilege('authenticated', 'public.institution_requests', 'INSERT')
  and not has_table_privilege('authenticated', 'public.audit_log', 'SELECT')
  and not has_table_privilege('anon', 'public.audit_log', 'INSERT'),
  'הבקשות והיומן סגורים לאורח ולמשתמש מחובר'
);
select ok(
  not has_function_privilege('anon', 'public.submit_institution_request(text, text, text, text)', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.submit_institution_request(text, text, text, text)', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.approve_institution_request(bigint, uuid, uuid)', 'EXECUTE')
  and not has_function_privilege('anon', 'public.reject_institution_request(bigint, uuid)', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.purge_institution_requests()', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.approve_course_change(bigint, uuid, jsonb, boolean)', 'EXECUTE')
  and has_function_privilege('service_role', 'public.submit_institution_request(text, text, text, text)', 'EXECUTE')
  and has_function_privilege('service_role', 'public.approve_course_change(bigint, uuid, jsonb, boolean)', 'EXECUTE'),
  'רק service_role מריץ את הפונקציות של הטופס ושל התור'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "66666666-0000-0000-0000-00000000000b", "role": "authenticated"}', true);
select throws_ok($$select count(*) from course_change_queue$$, '42501', null, 'משתמש רגיל לא רואה את התור של הקורסים');
select throws_ok($$select count(*) from institution_requests$$, '42501', null, 'משתמש רגיל לא רואה את הבקשות');
select throws_ok($$select count(*) from scrape_runs$$, '42501', null, 'משתמש רגיל לא רואה את דוח הריצה');
select throws_ok(
  $$insert into institution_requests (institution_name, course_url, contact_email, client_hash)
    values ('מוסד', 'https://cq.example/a', 'a@cq.example', repeat('a', 64))$$,
  '42501', null, 'משתמש רגיל לא מוסיף בקשה ישירות'
);
select throws_ok(
  $$select submit_institution_request('מוסד', 'https://cq.example/a', 'a@cq.example', repeat('a', 64))$$,
  '42501', null, 'משתמש רגיל לא מריץ את הפונקציה של הטופס'
);
select throws_ok(
  $$select approve_course_change((select id from q where field = 'site_price_ils'), '66666666-0000-0000-0000-00000000000a')$$,
  '42501', null, 'משתמש רגיל לא מאשר שינוי, גם עם מזהה של מנהל'
);
reset role;
set local role anon;
select throws_ok(
  $$select submit_institution_request('מוסד', 'https://cq.example/a', 'a@cq.example', repeat('a', 64))$$,
  '42501', null, 'אורח לא מריץ את הפונקציה של הטופס'
);
reset role;

-- ===== הטופס, דרך השרת: מגבלת קצב =====
set local role service_role;

select is(submit_institution_request('  מוסד   בדיקה ', 'https://cq.example/courses/one', ' Contact@CQ.example ', repeat('1', 64)), 'created', 'בקשה ראשונה נשמרת');
select results_eq(
  $$select institution_name, contact_email, status from institution_requests where course_url = 'https://cq.example/courses/one'$$,
  $$values ('מוסד בדיקה', 'contact@cq.example', 'pending')$$,
  'השם בלי רווחים מיותרים, והמייל באותיות קטנות'
);
select is(submit_institution_request('מוסד בדיקה', 'https://CQ.example/courses/ONE', 'x@cq.example', repeat('2', 64)), 'duplicate', 'אותו קישור שכבר ממתין לא נכנס פעמיים');
select is(submit_institution_request('מוסד בדיקה', 'https://cq.example/courses/two', 'contact@cq.example', repeat('1', 64)), 'created', 'בקשה שנייה מאותה כתובת');
select is(submit_institution_request('מוסד בדיקה', 'https://cq.example/courses/three', 'contact@cq.example', repeat('1', 64)), 'created', 'בקשה שלישית מאותה כתובת');
select throws_ok(
  $$select submit_institution_request('מוסד בדיקה', 'https://cq.example/courses/four', 'contact@cq.example', repeat('1', 64))$$,
  'LM001', null, 'בקשה רביעית ביממה מאותה כתובת נחסמת'
);
select throws_ok(
  $$select submit_institution_request('מוסד', 'https://cq.example/x', 'a@cq.example', 'not-a-hash')$$,
  '22023', null, 'בלי טביעה תקינה של הכתובת אין בקשה'
);
-- המגבלה הכוללת: משלימים ל-50 בקשות ביממה, מכתובות שונות.
insert into institution_requests (institution_name, course_url, contact_email, client_hash)
select 'מוסד', 'https://cq.example/bulk/' || g, 'bulk@cq.example', encode(sha256(convert_to('cq-bulk-' || g, 'UTF8')), 'hex')
from generate_series(1, greatest(0, 50 - (select count(*) from institution_requests where created_at > now() - interval '1 day'))) g;
select throws_ok(
  $$select submit_institution_request('מוסד', 'https://cq.example/courses/five', 'new@cq.example', repeat('3', 64))$$,
  'LM002', null, 'אחרי 50 בקשות ביממה, מכל הכתובות, הטופס נחסם'
);

-- ===== אישור ודחייה של בקשה =====

select throws_ok(
  $$select approve_institution_request((select id from institution_requests where course_url = 'https://cq.example/courses/one'),
    '66666666-0000-0000-0000-00000000000b', '66666666-0000-0000-0000-000000000002')$$,
  '42501', null, 'רק מנהל מאשר בקשה'
);
select throws_ok(
  $$select approve_institution_request((select id from institution_requests where course_url = 'https://cq.example/courses/one'),
    '66666666-0000-0000-0000-00000000000a', '66666666-0000-0000-0000-000000000004')$$,
  'LM010', null, 'קישור שלא באתר של המוסד שנבחר לא נכנס לאוסף'
);
select throws_ok(
  $$select approve_institution_request((select id from institution_requests where course_url = 'https://cq.example/courses/one'),
    '66666666-0000-0000-0000-00000000000a', '66666666-0000-0000-0000-000000000005')$$,
  'LM011', null, 'מוסד בלי אתר: אי אפשר לבדוק את הקישור'
);
select lives_ok(
  $$select approve_institution_request((select id from institution_requests where course_url = 'https://cq.example/courses/one'),
    '66666666-0000-0000-0000-00000000000a', '66666666-0000-0000-0000-000000000002')$$,
  'אישור: הקישור באתר של המוסד (עם www או בלי)'
);
select results_eq(
  $$select p.institution_id, p.source, p.state, r.status
    from institution_requests r join scrape_pages p on p.id = r.page_id
    where r.course_url = 'https://cq.example/courses/one'$$,
  $$values ('66666666-0000-0000-0000-000000000002'::uuid, 'request', 'active', 'approved')$$,
  'הקישור נכנס לדפים של האוסף, מסומן כבקשה'
);
select lives_ok(
  $$select reject_institution_request((select id from institution_requests where course_url = 'https://cq.example/courses/two'), '66666666-0000-0000-0000-00000000000a')$$,
  'דחייה של בקשה'
);
select results_eq(
  $$select l.action, l.actor_id
    from audit_log l join institution_requests r on r.id = l.institution_request_id
    where r.course_url in ('https://cq.example/courses/one', 'https://cq.example/courses/two')
    order by r.course_url$$,
  $$values ('join_request_approve', '66666666-0000-0000-0000-00000000000a'::uuid), ('join_request_reject', '66666666-0000-0000-0000-00000000000a'::uuid)$$,
  'שתי ההחלטות על בקשות ביומן'
);

-- ===== התור של הקורסים: כל החלטה ביומן =====

select lives_ok(
  $$select approve_course_change((select id from q where field = 'site_price_ils'), '66666666-0000-0000-0000-00000000000a')$$,
  'אישור של שינוי מחיר'
);
select lives_ok(
  $$select approve_course_change((select id from q where field = 'total_hours'), '66666666-0000-0000-0000-00000000000a', '140', true)$$,
  'תיקון ידני של השעות'
);
select lives_ok(
  $$select reject_course_change((select id from q where field = 'certificate'), '66666666-0000-0000-0000-00000000000a')$$,
  'דחייה של שינוי בתעודה'
);
select lives_ok(
  $$select approve_course_change((select id from q where field = 'region'), '66666666-0000-0000-0000-00000000000a', null, true)$$,
  'תיקון ידני לערך ריק'
);
select throws_ok(
  $$select approve_course_change((select id from q where kind = 'new_course'), '66666666-0000-0000-0000-00000000000a', '{"title": "x"}', true)$$,
  'LM020', null, 'תיקון ידני רק לשדה, לא לקורס חדש'
);
select results_eq(
  $$select site_price_ils, total_hours, certificate, region from courses where id = '66666666-0000-0000-0000-000000000003'$$,
  $$values (14500, 140, null::text, null::text)$$,
  'המחיר החדש, השעות של גל, התעודה לא השתנתה, והאזור ריק (ולא "צפון" מהדף)'
);
select results_eq(
  $$select l.action, l.details ->> 'field' from audit_log l join q on q.id = l.course_queue_id order by q.id$$,
  $$values ('course_approve', 'site_price_ils'), ('course_edit', 'total_hours'), ('course_reject', 'certificate'), ('course_edit', 'region')$$,
  'כל החלטה בתור של הקורסים ביומן, עם השדה'
);
select throws_ok(
  $$insert into audit_log (actor_id, action, review_id, course_queue_id)
    values ('66666666-0000-0000-0000-00000000000a', 'course_approve', gen_random_uuid(), (select id from q where field = 'certificate'))$$,
  '23514', null, 'שורה ביומן היא על דבר אחד בדיוק'
);

-- ===== הניקוי: המייל 90 יום אחרי ההחלטה, והטביעה אחרי יומיים =====
reset role;
update institution_requests set decided_at = now() - interval '91 days', created_at = now() - interval '92 days'
where course_url = 'https://cq.example/courses/two';
set local role service_role;
select ok(purge_institution_requests() >= 1, 'הניקוי רץ');
select results_eq(
  $$select course_url, contact_email is null, client_hash is null from institution_requests
    where course_url in ('https://cq.example/courses/two', 'https://cq.example/courses/three') order by course_url$$,
  $$values ('https://cq.example/courses/three', false, false), ('https://cq.example/courses/two', true, true)$$,
  'המייל והטביעה נמחקו רק בבקשה הישנה שהוחלט עליה'
);

select * from finish();
rollback;
