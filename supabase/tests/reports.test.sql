begin;
create extension if not exists pgtap with schema extensions;
select plan(41);

-- תוכנית 5ג: דיווח על ביקורת, ההחלטות של גל, תגובת מוסד והניקוי (20261115230001_reports_and_transparency.sql).
-- נתוני בדיקה, כ-postgres. כל שאילתה מוגבלת לנתונים האלה: המסד בפיי משותף, ויכולים להיות בו דיווחים אחרים.
insert into auth.users (id, email) values
  ('77777777-0000-0000-0000-00000000000a', 'rp-admin@example.test'),
  ('77777777-0000-0000-0000-00000000000b', 'rp-user@example.test');
insert into admins (user_id) values ('77777777-0000-0000-0000-00000000000a');
insert into categories (id, slug, name, course_type)
values ('77777777-0000-0000-0000-000000000001', 'rp-cat', 'תחום בדיקה', 'career');
insert into institutions (id, slug, name, kind)
values ('77777777-0000-0000-0000-000000000002', 'rp-inst', 'מוסד בדיקה', 'school');
insert into courses (id, slug, institution_id, category_id, title, status) values
  ('77777777-0000-0000-0000-000000000003', 'rp-course', '77777777-0000-0000-0000-000000000002',
   '77777777-0000-0000-0000-000000000001', 'קורס בדיקה', 'active');
-- c1, c2, c3 פורסמו. c4 ממתינה לבדיקה, ולכן לא מוצגת באתר.
insert into reviews (id, course_id, author_id, cohort_month, body, display_name, status, proof_kind, verified_at, published_at, submitted_at)
select v.id::uuid, '77777777-0000-0000-0000-000000000003', '77777777-0000-0000-0000-00000000000b', v.month::date,
       repeat('ביקורת לבדיקה. ', 8), 'בוגר בדיקה', v.status::review_status,
       case when v.status = 'published' then 'invoice'::proof_kind end,
       case when v.status = 'published' then now() end,
       case when v.status = 'published' then now() end,
       now()
from (values
  ('77777777-0000-0000-0000-0000000000c1', '2026-01-01', 'published'),
  ('77777777-0000-0000-0000-0000000000c2', '2026-02-01', 'published'),
  ('77777777-0000-0000-0000-0000000000c3', '2026-03-01', 'published'),
  ('77777777-0000-0000-0000-0000000000c4', '2026-04-01', 'pending')
) as v(id, month, status);

-- ===== הציבור: לא רואה ולא כותב =====

select ok(
  not has_table_privilege('anon', 'public.reports', 'SELECT')
  and not has_table_privilege('authenticated', 'public.reports', 'SELECT')
  and not has_table_privilege('anon', 'public.reports', 'INSERT')
  and not has_table_privilege('authenticated', 'public.reports', 'INSERT')
  and not has_table_privilege('authenticated', 'public.reports', 'UPDATE')
  and not has_table_privilege('anon', 'public.reports', 'DELETE'),
  'הדיווחים סגורים לאורח ולמשתמש מחובר'
);
select ok(
  not has_function_privilege('anon', 'public.submit_review_report(uuid, text, text, text)', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.submit_review_report(uuid, text, text, text)', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.decide_review_reports(uuid, uuid, text, text, text)', 'EXECUTE')
  and not has_function_privilege('anon', 'public.set_vendor_response(uuid, uuid, text)', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.purge_reports()', 'EXECUTE')
  and has_function_privilege('service_role', 'public.submit_review_report(uuid, text, text, text)', 'EXECUTE')
  and has_function_privilege('service_role', 'public.decide_review_reports(uuid, uuid, text, text, text)', 'EXECUTE')
  and has_function_privilege('service_role', 'public.set_vendor_response(uuid, uuid, text)', 'EXECUTE'),
  'רק service_role מריץ את הפונקציות שכותבות'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "77777777-0000-0000-0000-00000000000b", "role": "authenticated"}', true);
select throws_ok($$select count(*) from reports$$, '42501', null, 'משתמש מחובר לא רואה דיווחים');
select throws_ok(
  $$select submit_review_report('77777777-0000-0000-0000-0000000000c1', 'privacy', repeat('a', 64))$$,
  '42501', null, 'משתמש מחובר לא מדווח ישירות, רק דרך השרת'
);
reset role;
set local role anon;
select throws_ok(
  $$insert into reports (review_id, reason) values ('77777777-0000-0000-0000-0000000000c1', 'privacy')$$,
  '42501', null, 'אורח לא מוסיף דיווח ישירות'
);
reset role;

-- ===== דיווח, דרך השרת =====
set local role service_role;

select is(
  submit_review_report('77777777-0000-0000-0000-0000000000c1', 'privacy', repeat('1', 64), '  שם   מלא של   מרצה  '),
  'created', 'דיווח נשמר'
);
select results_eq(
  $$select reason, details, status from reports where review_id = '77777777-0000-0000-0000-0000000000c1'$$,
  $$values ('privacy', 'שם מלא של מרצה', 'open')$$,
  'הפירוט בלי רווחים מיותרים'
);
select ok(
  (select status = 'published' and disputed_at is not null from reviews where id = '77777777-0000-0000-0000-0000000000c1'),
  'הביקורת נשארת באתר, ומסומנת שיש עליה דיווח'
);
select is(
  submit_review_report('77777777-0000-0000-0000-0000000000c1', 'false_fact', repeat('1', 64)),
  'duplicate', 'אותה כתובת על אותה ביקורת: לא נוסף דיווח'
);
select is(
  (select count(*)::integer from reports where review_id = '77777777-0000-0000-0000-0000000000c1'),
  1, 'עדיין דיווח אחד'
);
select throws_ok(
  $$select submit_review_report('77777777-0000-0000-0000-0000000000c2', 'other', repeat('2', 64), '   ')$$,
  '22023', null, 'סיבה אחרת בלי פירוט'
);
select throws_ok(
  $$select submit_review_report('77777777-0000-0000-0000-0000000000c2', 'spam', repeat('2', 64))$$,
  '22023', null, 'סיבה שלא ברשימה'
);
select throws_ok(
  $$select submit_review_report('77777777-0000-0000-0000-0000000000c2', 'privacy', 'not-a-hash')$$,
  '22023', null, 'בלי טביעה תקינה של הכתובת'
);
select throws_ok(
  $$select submit_review_report('77777777-0000-0000-0000-0000000000c4', 'privacy', repeat('2', 64))$$,
  'P0002', null, 'על ביקורת שלא מוצגת באתר אי אפשר לדווח'
);
-- מגבלת הקצב לכתובת: חמישה דיווחים של כתובת 3 כבר היום.
insert into reports (review_id, reason, client_hash)
select '77777777-0000-0000-0000-0000000000c3', 'false_fact', repeat('3', 64) from generate_series(1, 5);
select throws_ok(
  $$select submit_review_report('77777777-0000-0000-0000-0000000000c2', 'privacy', repeat('3', 64))$$,
  'LM030', null, 'דיווח שישי ביממה מאותה כתובת נחסם'
);
-- המגבלה הכוללת: משלימים ל-300 דיווחים ביממה, מכתובות שונות.
insert into reports (review_id, reason, details, client_hash)
select '77777777-0000-0000-0000-0000000000c3', 'false_fact', 'rp-bulk', encode(sha256(convert_to('rp-bulk-' || g, 'UTF8')), 'hex')
from generate_series(1, greatest(0, 300 - (select count(*) from reports where created_at > now() - interval '1 day'))) g;
select throws_ok(
  $$select submit_review_report('77777777-0000-0000-0000-0000000000c2', 'privacy', repeat('4', 64))$$,
  'LM031', null, 'אחרי 300 דיווחים ביממה, מכל הכתובות, הטופס נחסם'
);
delete from reports where review_id = '77777777-0000-0000-0000-0000000000c3';

-- ===== ההחלטות של גל =====

select throws_ok(
  $$select decide_review_reports('77777777-0000-0000-0000-0000000000c2', '77777777-0000-0000-0000-00000000000a', 'keep')$$,
  'P0002', null, 'בלי דיווח פתוח אין מה להחליט'
);
select is(
  submit_review_report('77777777-0000-0000-0000-0000000000c2', 'privacy', repeat('5', 64), 'הטלפון של המרצה'),
  'created', 'דיווח על ביקורת שנייה'
);
select throws_ok(
  $$select decide_review_reports('77777777-0000-0000-0000-0000000000c2', '77777777-0000-0000-0000-00000000000b', 'keep')$$,
  '42501', null, 'רק מנהל מחליט'
);
select throws_ok(
  $$select decide_review_reports('77777777-0000-0000-0000-0000000000c2', '77777777-0000-0000-0000-00000000000a', 'hide', 'false_fact')$$,
  'LM032', null, 'מסתירים עד בירור רק בגלל פרטים אישיים או תוכן לא חוקי'
);
select lives_ok(
  $$select decide_review_reports('77777777-0000-0000-0000-0000000000c2', '77777777-0000-0000-0000-00000000000a', 'hide', 'privacy')$$,
  'הסתרה עד בירור'
);
select results_eq(
  $$select r.status::text, (select count(*)::integer from reports p where p.review_id = r.id and p.status = 'open')
    from reviews r where r.id = '77777777-0000-0000-0000-0000000000c2'$$,
  $$values ('disputed', 1)$$,
  'מוסתרת, והדיווח עדיין פתוח'
);
reset role;
set local role anon;
select is(
  (select count(*)::integer from reviews where id = '77777777-0000-0000-0000-0000000000c2'),
  0, 'אורח לא רואה ביקורת מוסתרת'
);
reset role;
set local role service_role;
select lives_ok(
  $$select decide_review_reports('77777777-0000-0000-0000-0000000000c2', '77777777-0000-0000-0000-00000000000a', 'keep')$$,
  'להשאיר: הביקורת חוזרת'
);
select results_eq(
  $$select r.status::text, r.disputed_at is null,
           (select string_agg(distinct p.status, ',') from reports p where p.review_id = r.id)
    from reviews r where r.id = '77777777-0000-0000-0000-0000000000c2'$$,
  $$values ('published', true, 'kept')$$,
  'באתר שוב, בלי סימון, והדיווח נסגר'
);
select lives_ok(
  $$select decide_review_reports('77777777-0000-0000-0000-0000000000c1', '77777777-0000-0000-0000-00000000000a', 'remove', 'privacy',
    'הסרנו את הביקורת: היו בה פרטים של אדם פרטי.')$$,
  'הסרה עם נימוק'
);
select results_eq(
  $$select r.status::text, r.decision_note,
           (select string_agg(distinct p.status, ',') from reports p where p.review_id = r.id)
    from reviews r where r.id = '77777777-0000-0000-0000-0000000000c1'$$,
  $$values ('removed', 'הסרנו את הביקורת: היו בה פרטים של אדם פרטי.', 'removed')$$,
  'הוסרה, הכותב רואה למה, והדיווח נסגר'
);
select throws_ok(
  $$select decide_review_reports('77777777-0000-0000-0000-0000000000c1', '77777777-0000-0000-0000-00000000000a', 'keep')$$,
  'P0002', null, 'אחרי הסרה אין דיווח פתוח'
);
select results_eq(
  $$select action from audit_log
    where review_id in ('77777777-0000-0000-0000-0000000000c1', '77777777-0000-0000-0000-0000000000c2') order by id$$,
  $$values ('report_hide'), ('report_keep'), ('report_remove')$$,
  'כל החלטה ביומן'
);
select ok(
  not exists (
    select 1 from audit_log
    where review_id in ('77777777-0000-0000-0000-0000000000c1', '77777777-0000-0000-0000-0000000000c2')
      and (details::text like '%מרצה%' or details::text like '%הסרנו%')
  ),
  'ביומן רק קודים ומזהים, בלי מה שהמדווח או גל כתבו'
);

-- ===== תגובת מוסד =====

select lives_ok(
  $$select set_vendor_response('77777777-0000-0000-0000-0000000000c3', '77777777-0000-0000-0000-00000000000a', '  המוסד מבהיר: הפרק עודכן.  ')$$,
  'תגובה של מוסד'
);
select lives_ok(
  $$select set_vendor_response('77777777-0000-0000-0000-0000000000c3', '77777777-0000-0000-0000-00000000000a', 'תגובה מעודכנת.')$$,
  'תגובה שנייה מחליפה את הראשונה'
);
reset role;
set local role anon;
select results_eq(
  $$select body from vendor_responses where review_id = '77777777-0000-0000-0000-0000000000c3'$$,
  $$values ('תגובה מעודכנת.')$$,
  'אורח רואה תגובה אחת, העדכנית'
);
reset role;
set local role service_role;
select throws_ok(
  $$select set_vendor_response('77777777-0000-0000-0000-0000000000c3', '77777777-0000-0000-0000-00000000000b', 'x')$$,
  '42501', null, 'רק מנהל מעלה תגובה'
);
select throws_ok(
  $$select set_vendor_response('77777777-0000-0000-0000-0000000000c4', '77777777-0000-0000-0000-00000000000a', 'x')$$,
  'P0002', null, 'רק לביקורת שבאתר או שמוסתרת עד בירור'
);
select lives_ok(
  $$select set_vendor_response('77777777-0000-0000-0000-0000000000c3', '77777777-0000-0000-0000-00000000000a', '   ')$$,
  'תגובה ריקה מסירה את התגובה'
);
select throws_ok(
  $$select set_vendor_response('77777777-0000-0000-0000-0000000000c3', '77777777-0000-0000-0000-00000000000a', '')$$,
  'LM033', null, 'אין תגובה להסיר'
);
select results_eq(
  $$select action from audit_log where review_id = '77777777-0000-0000-0000-0000000000c3' order by id$$,
  $$values ('vendor_response'), ('vendor_response'), ('vendor_response_remove')$$,
  'התגובות ביומן'
);
select throws_ok(
  $$insert into audit_log (actor_id, action, review_id)
    values ('77777777-0000-0000-0000-00000000000a', 'report_snooze', '77777777-0000-0000-0000-0000000000c3')$$,
  '23514', null, 'פעולה שלא ברשימה לא נכנסת ליומן'
);

-- ===== הניקוי: הפירוט 90 יום אחרי ההחלטה, והטביעה אחרי יומיים =====
reset role;
update reports set decided_at = now() - interval '91 days', created_at = now() - interval '92 days'
where review_id = '77777777-0000-0000-0000-0000000000c2';
set local role service_role;
select ok(purge_reports() >= 1, 'הניקוי רץ');
select results_eq(
  $$select review_id = '77777777-0000-0000-0000-0000000000c2', details is null, client_hash is null
    from reports
    where review_id in ('77777777-0000-0000-0000-0000000000c1', '77777777-0000-0000-0000-0000000000c2')
    order by review_id$$,
  $$values (false, false, false), (true, true, true)$$,
  'הפירוט והטביעה נמחקו רק בדיווח הישן שהוחלט עליו'
);

select * from finish();
rollback;
