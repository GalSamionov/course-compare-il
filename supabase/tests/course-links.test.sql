begin;
create extension if not exists pgtap with schema extensions;
select plan(67);

-- הוספת קורס מקישור (20261116010001_course_links.sql): בוגר ב-/review, ובקשה ב-/request-course.
-- נתוני בדיקה, כ-postgres. כל שאילתה מוגבלת לנתונים האלה: המסד בפיי משותף, ויכולים להיות בו קישורים אחרים.
insert into auth.users (id, email) values
  ('c1c1c1c1-0000-0000-0000-00000000000a', 'cl-admin@example.test'),
  ('c1c1c1c1-0000-0000-0000-00000000000b', 'cl-grad1@example.test'),
  ('c1c1c1c1-0000-0000-0000-00000000000c', 'cl-grad2@example.test'),
  ('c1c1c1c1-0000-0000-0000-00000000000d', 'cl-grad3@example.test'),
  ('c1c1c1c1-0000-0000-0000-00000000000e', 'cl-grad4@example.test');
insert into admins (user_id) values ('c1c1c1c1-0000-0000-0000-00000000000a');
insert into categories (id, slug, name, course_type) values
  ('c1c1c1c1-0000-0000-0000-000000000001', 'cl-career', 'תחום קריירה לבדיקה', 'career'),
  ('c1c1c1c1-0000-0000-0000-000000000002', 'cl-hobby', 'תחום תחביב לבדיקה', 'hobby');
insert into institutions (id, slug, name, kind, website) values
  ('c1c1c1c1-0000-0000-0000-000000000003', 'cl-inst', 'מכללת קישורים לדוגמה', 'college', 'https://www.cl-inst.example/');
insert into courses (id, slug, institution_id, category_id, title, status, page_url) values
  ('c1c1c1c1-0000-0000-0000-000000000004', 'cl-live', 'c1c1c1c1-0000-0000-0000-000000000003',
   'c1c1c1c1-0000-0000-0000-000000000001', 'פייתון למתחילים', 'active', 'https://www.cl-inst.example/courses/python/'),
  ('c1c1c1c1-0000-0000-0000-000000000005', 'cl-scraped-draft', 'c1c1c1c1-0000-0000-0000-000000000003',
   'c1c1c1c1-0000-0000-0000-000000000001', 'טיוטה של האוסף', 'draft', 'https://www.cl-inst.example/courses/new/');

-- ===== הרשאות: הטבלה והפונקציות סגורות לאורח ולמשתמש מחובר =====

select ok(
  not has_table_privilege('anon', 'public.course_submissions', 'SELECT')
  and not has_table_privilege('authenticated', 'public.course_submissions', 'SELECT')
  and not has_table_privilege('anon', 'public.course_submissions', 'INSERT')
  and not has_table_privilege('authenticated', 'public.course_submissions', 'INSERT')
  and not has_table_privilege('authenticated', 'public.course_submissions', 'UPDATE'),
  'הקישורים שנשלחו סגורים לאורח ולמשתמש מחובר'
);
select ok(
  not has_function_privilege('anon', 'public.submit_course_link(uuid, text, text, text, uuid, public.course_type)', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.submit_course_link(uuid, text, text, text, uuid, public.course_type)', 'EXECUTE')
  and not has_function_privilege('anon', 'public.submit_course_request(text, text, text, text)', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.submit_course_request(text, text, text, text)', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.course_link_queue(integer)', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.course_link_type(uuid)', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.approve_course_submission(bigint, uuid, uuid, text, uuid, text, text)', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.merge_course_submission(bigint, uuid, uuid)', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.reject_course_submission(bigint, uuid, text)', 'EXECUTE')
  and not has_function_privilege('anon', 'public.purge_course_submissions()', 'EXECUTE')
  and has_function_privilege('service_role', 'public.submit_course_link(uuid, text, text, text, uuid, public.course_type)', 'EXECUTE')
  and has_function_privilege('service_role', 'public.approve_course_submission(bigint, uuid, uuid, text, uuid, text, text)', 'EXECUTE'),
  'רק service_role מריץ את הפונקציות של הטפסים ושל התור'
);
select ok(
  has_function_privilege('authenticated', 'public.my_course_links()', 'EXECUTE')
  and not has_function_privilege('anon', 'public.my_course_links()', 'EXECUTE')
  and has_function_privilege('authenticated', 'public.my_course_link(uuid)', 'EXECUTE')
  and not has_function_privilege('anon', 'public.my_course_link(uuid)', 'EXECUTE'),
  'רק משתמש מחובר שואל על הקורסים שהוסיף'
);

-- ===== בוגר: קורס שכבר באתר =====
set local role service_role;

select is(
  submit_course_link('c1c1c1c1-0000-0000-0000-00000000000b', 'http://cl-inst.example/courses/python',
                     'משהו אחר', 'מישהו אחר', null, 'career') ->> 'course_slug',
  'cl-live', 'אותו קישור אחרי נרמול (בלי www, http ו-/ בסוף): הקורס שכבר באתר'
);
select is(
  submit_course_link('c1c1c1c1-0000-0000-0000-00000000000b', 'https://cl-inst-landing.example/python',
                     'פייתון - למתחילים!', ' מכללת  קישורים לדוגמה ', null, 'career') ->> 'outcome',
  'existing', 'אותו שם אצל אותו מוסד, מקישור אחר: הקורס שכבר באתר'
);
select is(
  (select count(*)::integer from course_submissions where submitted_by = 'c1c1c1c1-0000-0000-0000-00000000000b'),
  0, 'קורס שכבר באתר לא מוסיף שום שורה'
);

-- ===== בוגר: קורס חדש מקישור לפייסבוק, בלי תחום =====

create temp table d1 as
  select (submit_course_link('c1c1c1c1-0000-0000-0000-00000000000b', 'https://www.facebook.com/cl.dana.nails/posts/1',
                             'לק ג׳ל למתחילות', 'דנה ציפורניים לדוגמה', null, 'hobby') ->> 'course_id')::uuid as id;
grant select on d1 to anon, authenticated, service_role;
select results_eq(
  $$select c.status::text, c.category_id is null, c.page_url is null, i.kind, i.status, i.name
    from courses c join institutions i on i.id = c.institution_id where c.id = (select id from d1)$$,
  $$values ('draft', true, true, 'independent', 'draft', 'דנה ציפורניים לדוגמה')$$,
  'קורס טיוטה בלי תחום, בלי דף קורס מפייסבוק, ומרצה עצמאי חדש בטיוטה'
);
select ok(
  (select slug from courses where id = (select id from d1)) ~ '^[a-z0-9]+(-[a-z0-9]+)*$',
  'ה-slug באותיות לטיניות, גם כששם הקורס בעברית'
);
select is(
  (submit_course_link('c1c1c1c1-0000-0000-0000-00000000000b', 'https://www.facebook.com/cl.dana.nails/posts/1',
                      'לק ג׳ל למתחילות', 'דנה ציפורניים לדוגמה', null, 'hobby') ->> 'course_id')::uuid,
  (select id from d1), 'אותו בוגר שוב: חוזר לאותה טיוטה'
);
select is(
  (submit_course_link('c1c1c1c1-0000-0000-0000-00000000000c', 'https://facebook.com/cl.dana.nails/posts/1/#x',
                      'לק גל', 'דנה ציפורניים לדוגמה', 'c1c1c1c1-0000-0000-0000-000000000002', null) ->> 'course_id')::uuid,
  (select id from d1), 'בוגר אחר עם אותו קישור (בלי www, עם / ו-#) ושם אחר: ממשיך על אותה טיוטה, ולא קורס שני'
);
select is(
  (select count(*)::integer from course_submissions where course_id = (select id from d1)),
  2, 'שורה אחת לכל בוגר, ובלי שורה כפולה לאותו בוגר'
);
select is(course_link_type((select id from d1))::text, 'hobby', 'סוג השאלון: מהבוגר הראשון, כשאין תחום');

-- ===== בדיקות קלט =====

select throws_ok(
  $$select submit_course_link('c1c1c1c1-0000-0000-0000-00000000000b', 'javascript:alert(1)', 'קורס', 'מרצה', null, 'career')$$,
  '22023', null, 'רק קישור http(s)'
);
select throws_ok(
  $$select submit_course_link('c1c1c1c1-0000-0000-0000-00000000000b', 'https://cl-x.example/a', 'קורס', 'מרצה',
                              'c1c1c1c1-0000-0000-0000-000000000001', 'hobby')$$,
  'LM044', null, 'תחום שהסוג שלו לא מתאים לבחירה'
);
select throws_ok(
  $$select submit_course_link('c1c1c1c1-0000-0000-0000-00000000000b', 'https://cl-x.example/a', 'קורס', 'מרצה', null, null)$$,
  'LM044', null, 'בלי תחום ובלי סוג: אין שאלון'
);
select throws_ok(
  $$select submit_course_link('c1c1c1c1-0000-0000-0000-00000000000b', 'https://cl-x.example/' || repeat('a', 500), 'קורס', 'מרצה', null, 'career')$$,
  '22023', null, 'קישור ארוך מ-500 תווים'
);

-- ===== מגבלת קצב: 3 קורסים חדשים ביממה לבוגר =====

select lives_ok(
  $$select submit_course_link('c1c1c1c1-0000-0000-0000-00000000000d', 'https://cl-wix.example/gel', 'ציפורניים מתקדמות', 'סטודיו לדוגמה', null, 'hobby')$$,
  'קורס חדש ראשון ביום'
);
select lives_ok(
  $$select submit_course_link('c1c1c1c1-0000-0000-0000-00000000000d', 'https://cl-other.example/python-course', 'פייתון למתחילים', 'מכללה אחרת לדוגמה', null, 'career')$$,
  'שני'
);
select lives_ok(
  $$select submit_course_link('c1c1c1c1-0000-0000-0000-00000000000d', 'https://cl-kajabi.example/ai', 'בינה מלאכותית לעסקים', 'מרצה לדוגמה', null, 'career')$$,
  'ושלישי'
);
select throws_ok(
  $$select submit_course_link('c1c1c1c1-0000-0000-0000-00000000000d', 'https://cl-fourth.example/x', 'קורס רביעי', 'מרצה רביעי', null, 'career')$$,
  'LM040', null, 'הרביעי ביום נחסם'
);
select is(
  submit_course_link('c1c1c1c1-0000-0000-0000-00000000000d', 'https://cl-wix.example/gel', 'ציפורניים מתקדמות', 'סטודיו לדוגמה', null, 'hobby') ->> 'outcome',
  'draft', 'חזרה לטיוטה שכבר שלו לא נחסמת ולא נספרת'
);

reset role;

-- ===== טיוטה לא ציבורית =====
set local role anon;
select is((select count(*)::integer from courses where id = (select id from d1)), 0, 'אורח לא רואה את קורס הטיוטה');
select is(
  (select count(*)::integer from institutions where name = 'דנה ציפורניים לדוגמה'), 0, 'אורח לא רואה את המרצה בטיוטה'
);
select is((select count(*)::integer from institutions where slug = 'cl-inst'), 1, 'אורח עדיין רואה מוסד פעיל');
select throws_ok($$select count(*) from course_submissions$$, '42501', null, 'אורח לא רואה את הקישורים');
select throws_ok($$select * from my_course_links()$$, '42501', null, 'אורח לא שואל על קורסים שהוסיף');
reset role;

-- ===== ביקורת על הטיוטה: רק מי שהוסיף אותה =====
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "c1c1c1c1-0000-0000-0000-00000000000b", "role": "authenticated"}', true);
select throws_ok($$select count(*) from course_submissions$$, '42501', null, 'משתמש מחובר לא רואה את הקישורים');
select is((select count(*)::integer from courses where id = (select id from d1)), 0, 'גם מי שהוסיף לא קורא את הטיוטה ישירות');
select lives_ok(
  $$insert into reviews (course_id, author_id, cohort_month)
    values ((select id from d1), 'c1c1c1c1-0000-0000-0000-00000000000b', '2026-01-01')$$,
  'מי שהוסיף את הקורס פותח עליו טיוטת ביקורת'
);
select throws_ok(
  $$insert into reviews (course_id, author_id, cohort_month)
    values ('c1c1c1c1-0000-0000-0000-000000000005', 'c1c1c1c1-0000-0000-0000-00000000000b', '2026-01-01')$$,
  '42501', null, 'אבל לא על טיוטה של האוסף'
);
select results_eq(
  $$select course_title, institution_name, status from my_course_links()$$,
  $$values ('לק ג׳ל למתחילות', 'דנה ציפורניים לדוגמה', 'pending')$$,
  'הבוגר רואה רק את הקורס שהוסיף'
);
select is(
  my_course_link((select id from d1)) ->> 'course_type', 'hobby', 'ובעמוד הכתיבה: הקורס שלו, עם סוג השאלון'
);
select set_config('request.jwt.claims', '{"sub": "c1c1c1c1-0000-0000-0000-00000000000e", "role": "authenticated"}', true);
select throws_ok(
  $$insert into reviews (course_id, author_id, cohort_month)
    values ((select id from d1), 'c1c1c1c1-0000-0000-0000-00000000000e', '2026-01-01')$$,
  '42501', null, 'מי שלא הוסיף את הקורס לא פותח עליו ביקורת'
);
select is((select count(*)::integer from my_course_links()), 0, 'ולא רואה אותו ברשימה שלו');
select is(my_course_link((select id from d1)), null, 'וגם לא בעמוד הכתיבה');
reset role;

-- ===== בקשה ב-/request-course =====
set local role service_role;

select is(
  submit_course_request('https://cl-inst.example/courses/python', null, null, repeat('a', 64)) ->> 'course_slug',
  'cl-live', 'בקשה לקורס שכבר באתר: מקבלים את הקורס'
);
select is(
  submit_course_request('https://cl-landing.example/ai-course', '  סדנת AI  ', 'ראיתי מודעה', repeat('a', 64)) ->> 'outcome',
  'sent', 'בקשה חדשה נשמרת'
);
select is(
  submit_course_request('https://cl-landing.example/ai-course/', null, null, repeat('b', 64)) ->> 'outcome',
  'sent', 'אותו קישור שוב (עם / בסוף): אותה תשובה'
);
select results_eq(
  $$select count(*)::integer, min(course_title), min(note) from course_submissions where url_key = 'cl-landing.example/ai-course'$$,
  $$values (1, 'סדנת AI', 'ראיתי מודעה')$$,
  'ונשמרה רק פעם אחת'
);
select lives_ok($$select submit_course_request('https://cl-r2.example/a', null, null, repeat('a', 64))$$, 'בקשה שנייה מאותה כתובת');
select lives_ok($$select submit_course_request('https://cl-r3.example/a', null, null, repeat('a', 64))$$, 'ושלישית');
select throws_ok(
  $$select submit_course_request('https://cl-r4.example/a', null, null, repeat('a', 64))$$,
  'LM042', null, 'הרביעית מאותה כתובת ביממה נחסמת'
);
select throws_ok(
  $$select submit_course_request('https://cl-r5.example/a', null, null, 'not-a-hash')$$,
  '22023', null, 'בלי טביעה תקינה של הכתובת'
);

select is(
  submit_course_request('https://www.cl-inst.example/courses/data', 'דאטה', null, repeat('c', 64)) ->> 'outcome',
  'sent', 'בקשה לקורס חדש באתר של מוסד קיים'
);

-- ===== התור של גל =====

select results_eq(
  $$select source, is_social, institution_is_new, submitters, course_type, reviews ->> 'draft'
    from course_link_queue(100) where course_id = (select id from d1)$$,
  $$values ('review', true, true, 2, 'hobby', '1')$$,
  'פריט אחד לקורס, עם שני הבוגרים, פייסבוק, מרצה חדש והטיוטה של הביקורת'
);
select is(
  (select c ->> 'why' from course_link_queue(100) q, jsonb_array_elements(q.candidates) c
   where q.typed_title = 'פייתון למתחילים' and c ->> 'slug' = 'cl-live'),
  'title', 'קורס באתר עם אותו שם מוצע למיזוג'
);
select is(
  (select suggested_institution_id from course_link_queue(100) where url = 'https://www.cl-inst.example/courses/data'),
  'c1c1c1c1-0000-0000-0000-000000000003'::uuid, 'בקשה לקישור באתר של מוסד קיים: המוסד מוצע'
);

-- ===== אישור =====

select throws_ok(
  $$select approve_course_submission((select min(id) from course_submissions where course_id = (select id from d1)),
                                     'c1c1c1c1-0000-0000-0000-00000000000b', 'c1c1c1c1-0000-0000-0000-000000000002')$$,
  '42501', null, 'רק מנהל מאשר'
);
select throws_ok(
  $$select approve_course_submission((select min(id) from course_submissions where course_id = (select id from d1)),
                                     'c1c1c1c1-0000-0000-0000-00000000000a')$$,
  'LM050', null, 'בלי תחום אי אפשר לאשר'
);
select throws_ok(
  $$select approve_course_submission((select min(id) from course_submissions where course_id = (select id from d1)),
                                     'c1c1c1c1-0000-0000-0000-00000000000a', 'c1c1c1c1-0000-0000-0000-000000000001')$$,
  'LM051', null, 'תחום מסוג אחר מהשאלון שהבוגר כבר ענה עליו'
);
select is(
  approve_course_submission((select min(id) from course_submissions where course_id = (select id from d1)),
                            'c1c1c1c1-0000-0000-0000-00000000000a', 'c1c1c1c1-0000-0000-0000-000000000002',
                            'לק ג׳ל למתחילות', null, 'דנה ציפורניים (לדוגמה)', 'independent') ->> 'page_id',
  null, 'אישור של קורס מפייסבוק: לא נכנס לאוסף'
);
select results_eq(
  $$select c.status::text, c.category_id, i.status, i.name,
           (select count(*)::integer from course_submissions s where s.course_id = c.id and s.status = 'approved')
    from courses c join institutions i on i.id = c.institution_id where c.id = (select id from d1)$$,
  $$values ('active', 'c1c1c1c1-0000-0000-0000-000000000002'::uuid, 'active', 'דנה ציפורניים (לדוגמה)', 2)$$,
  'הקורס והמרצה עלו, עם התחום והשם שגל קבע, ושני הבוגרים אושרו'
);
select is(
  (approve_course_submission((select id from course_submissions where url = 'https://cl-wix.example/gel'),
                             'c1c1c1c1-0000-0000-0000-00000000000a', 'c1c1c1c1-0000-0000-0000-000000000002') ->> 'page_id') is not null,
  true, 'אישור של קישור לאתר: נכנס לאוסף'
);
select results_eq(
  $$select p.source, p.state, p.course_id = s.course_id, p.institution_id = c.institution_id
    from course_submissions s join scrape_pages p on p.id = s.page_id join courses c on c.id = s.course_id
    where s.url = 'https://cl-wix.example/gel'$$,
  $$values ('request', 'active', true, true)$$,
  'כמו בקשה של מוסד: דף פעיל של האוסף, מקושר לקורס ולמוסד'
);

-- ===== מיזוג =====

create temp table dup as
  select course_id as id, id as sid from course_submissions where url = 'https://cl-other.example/python-course';
grant select on dup to anon, authenticated, service_role;
insert into reviews (course_id, author_id, cohort_month)
values ((select id from dup), 'c1c1c1c1-0000-0000-0000-00000000000d', '2026-02-01');
select throws_ok(
  $$select merge_course_submission((select sid from dup), 'c1c1c1c1-0000-0000-0000-00000000000a', 'c1c1c1c1-0000-0000-0000-000000000005')$$,
  'LM052', null, 'אי אפשר למזג לטיוטה'
);
select is(
  merge_course_submission((select sid from dup), 'c1c1c1c1-0000-0000-0000-00000000000a', 'c1c1c1c1-0000-0000-0000-000000000004') ->> 'course_slug',
  'cl-live', 'מיזוג לקורס שכבר באתר'
);
select results_eq(
  $$select (select count(*)::integer from reviews where author_id = 'c1c1c1c1-0000-0000-0000-00000000000d'
            and course_id = 'c1c1c1c1-0000-0000-0000-000000000004'),
           (select count(*)::integer from courses where id = (select id from dup)),
           (select status || ':' || merged_into from course_submissions where id = (select sid from dup))$$,
  $$values (1, 0, 'merged:c1c1c1c1-0000-0000-0000-000000000004')$$,
  'הביקורת עברה לקורס הקיים, והטיוטה נמחקה'
);

-- ===== דחייה =====

select throws_ok(
  $$select reject_course_submission((select id from course_submissions where url = 'https://cl-kajabi.example/ai'),
                                    'c1c1c1c1-0000-0000-0000-00000000000a', '  ')$$,
  '22023', null, 'דחייה רק עם סיבה'
);
select lives_ok(
  $$select reject_course_submission((select id from course_submissions where url = 'https://cl-kajabi.example/ai'),
                                    'c1c1c1c1-0000-0000-0000-00000000000a', 'זה לא קורס, זה וובינר חינמי.')$$,
  'דחייה עם סיבה'
);
select results_eq(
  $$select s.status, s.decision_reason, c.status::text
    from course_submissions s join courses c on c.id = s.course_id where s.url = 'https://cl-kajabi.example/ai'$$,
  $$values ('rejected', 'זה לא קורס, זה וובינר חינמי.', 'draft')$$,
  'הקורס נשאר טיוטה, עם הסיבה'
);
select is(
  (select array_agg(action order by id)::text[] from audit_log
   where course_submission_id in (select id from course_submissions where submitted_by in (
     'c1c1c1c1-0000-0000-0000-00000000000b', 'c1c1c1c1-0000-0000-0000-00000000000c', 'c1c1c1c1-0000-0000-0000-00000000000d'))),
  array['course_link_approve', 'course_link_approve', 'course_link_merge', 'course_link_reject'],
  'כל החלטה בשורה ביומן'
);
select throws_ok(
  $$select approve_course_submission((select id from course_submissions where url_key = 'cl-landing.example/ai-course'),
                                     'c1c1c1c1-0000-0000-0000-00000000000a')$$,
  'LM054', null, 'בקשה לקישור לאתר: לאישור צריך מוסד'
);
select is(
  (approve_course_submission((select id from course_submissions where url_key = 'cl-landing.example/ai-course'),
                             'c1c1c1c1-0000-0000-0000-00000000000a', null, null, null, 'סדנאות AI לדוגמה', null)
   ->> 'page_id') is not null,
  true, 'בקשה מאושרת עם מרצה חדש'
);
select results_eq(
  $$select i.kind, i.status, p.source, p.course_id is null
    from course_submissions s
    join scrape_pages p on p.id = s.page_id
    join institutions i on i.id = p.institution_id
    where s.url_key = 'cl-landing.example/ai-course'$$,
  $$values ('independent', 'active', 'request', true)$$,
  'בקשה שאושרה עם מרצה חדש: הקישור נכנס לאוסף, והאוסף ימצא בו קורס חדש'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "c1c1c1c1-0000-0000-0000-00000000000d", "role": "authenticated"}', true);
select throws_ok(
  $$insert into reviews (course_id, author_id, cohort_month)
    select course_id, 'c1c1c1c1-0000-0000-0000-00000000000d', '2026-03-01' from my_course_links() where status = 'rejected'$$,
  '42501', null, 'על קורס שנדחה כבר אי אפשר לפתוח ביקורת'
);
reset role;

-- ===== הניקוי היומי =====
update course_submissions set created_at = now() - interval '3 days' where url_key = 'cl-landing.example/ai-course';
set local role service_role;
select lives_ok($$select purge_course_submissions()$$, 'הניקוי רץ');
select is(
  (select client_hash from course_submissions where url_key = 'cl-landing.example/ai-course'),
  null, 'הטביעה של הכתובת נמחקת אחרי יומיים'
);
reset role;

select * from finish();
rollback;
