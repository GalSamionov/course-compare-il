begin;
create extension if not exists pgtap with schema extensions;
select plan(29);

-- אישור בבת אחת בתור של הקורסים (20261116000001_course_queue_bulk.sql).
-- נתוני בדיקה, כ-postgres. כל שאילתה מוגבלת למוסדות של הבדיקה: המסד המקומי משותף, ויכולים להיות בו פריטים אחרים.
insert into auth.users (id, email) values
  ('77777777-0000-0000-0000-00000000000a', 'bk-admin@example.test'),
  ('77777777-0000-0000-0000-00000000000b', 'bk-user@example.test');
insert into admins (user_id) values ('77777777-0000-0000-0000-00000000000a');
insert into categories (id, slug, name, course_type)
values ('77777777-0000-0000-0000-000000000001', 'bk-cat', 'תחום בדיקה', 'career');
insert into institutions (id, slug, name, kind, website) values
  ('77777777-0000-0000-0000-000000000002', 'bk-a', 'מוסד א לבדיקה', 'school', 'https://bk-a.example/'),
  ('77777777-0000-0000-0000-000000000003', 'bk-b', 'מוסד ב לבדיקה', 'school', 'https://bk-b.example/');

-- s: הקורסים של הבדיקה. tag הוא השם הקצר בבדיקות. בטוח: s1 ו-b1. כל השאר עם סיבה.
create temp table s (tag text primary key, course_id uuid, inst uuid, title text, status text, url text, reasons text[], fields jsonb);
insert into s values
  ('live', '77777777-0000-0000-0000-000000000010', '77777777-0000-0000-0000-000000000002', 'קורס קיים', 'active', 'https://bk-a.example/live', null, null),
  ('s1', '77777777-0000-0000-0000-000000000011', '77777777-0000-0000-0000-000000000002', 'קורס בטוח', 'draft', 'https://bk-a.example/safe',
   '{new_course}', '{"title": {"value": "קורס בטוח", "confidence": "high", "issues": []}, "site_price_ils": {"value": 5000, "confidence": "high", "issues": []}}'),
  ('low', '77777777-0000-0000-0000-000000000012', '77777777-0000-0000-0000-000000000002', 'מחיר לא בטוח', 'draft', 'https://bk-a.example/low',
   '{new_course,site_price_ils:low_confidence}', '{"title": {"value": "מחיר לא בטוח", "confidence": "high", "issues": []}, "site_price_ils": {"value": 900, "confidence": "low", "issues": []}}'),
  ('dt1', '77777777-0000-0000-0000-000000000013', '77777777-0000-0000-0000-000000000002', 'Python - למתחילים!', 'draft', 'https://bk-a.example/py-1',
   '{new_course}', '{"title": {"value": "Python - למתחילים!", "confidence": "high", "issues": []}}'),
  ('dt2', '77777777-0000-0000-0000-000000000014', '77777777-0000-0000-0000-000000000002', 'python למתחילים', 'draft', 'https://bk-a.example/py-2',
   '{new_course}', '{"title": {"value": "python למתחילים", "confidence": "high", "issues": []}}'),
  ('du1', '77777777-0000-0000-0000-000000000015', '77777777-0000-0000-0000-000000000002', 'עיצוב', 'draft', 'https://www.bk-a.example/%D7%A2/#top',
   '{new_course}', '{"title": {"value": "עיצוב", "confidence": "high", "issues": []}}'),
  ('du2', '77777777-0000-0000-0000-000000000016', '77777777-0000-0000-0000-000000000002', 'עיצוב מתקדם', 'draft', 'http://bk-a.example/%d7%a2',
   '{new_course}', '{"title": {"value": "עיצוב מתקדם", "confidence": "high", "issues": []}}'),
  ('ex', '77777777-0000-0000-0000-000000000017', '77777777-0000-0000-0000-000000000002', 'קורס  קיים.', 'draft', 'https://bk-a.example/live-copy',
   '{new_course}', '{"title": {"value": "קורס קיים", "confidence": "high", "issues": []}}'),
  ('med', '77777777-0000-0000-0000-000000000018', '77777777-0000-0000-0000-000000000002', 'שדה בינוני', 'draft', 'https://bk-a.example/med',
   '{new_course}', '{"title": {"value": "שדה בינוני", "confidence": "high", "issues": []}, "total_hours": {"value": 40, "confidence": "medium", "issues": []}}'),
  ('past', '77777777-0000-0000-0000-000000000019', '77777777-0000-0000-0000-000000000002', 'מחזור שעבר', 'draft', 'https://bk-a.example/past',
   '{new_course,next_cohort_date:cohort_in_past}', '{"title": {"value": "מחזור שעבר", "confidence": "high", "issues": []}, "next_cohort_date": {"value": "2020-01-01", "confidence": "high", "issues": ["cohort_in_past"]}}'),
  ('pub', '77777777-0000-0000-0000-000000000020', '77777777-0000-0000-0000-000000000002', 'פורסם כבר', 'active', 'https://bk-a.example/published',
   '{new_course}', '{"title": {"value": "פורסם כבר", "confidence": "high", "issues": []}}'),
  ('b1', '77777777-0000-0000-0000-000000000021', '77777777-0000-0000-0000-000000000003', 'קורס של ב', 'draft', 'https://bk-b.example/one',
   '{new_course}', '{"title": {"value": "קורס של ב", "confidence": "high", "issues": []}}');

insert into courses (id, slug, institution_id, category_id, title, status, page_url)
select course_id, 'bk-' || replace(tag, '_', '-'), inst, '77777777-0000-0000-0000-000000000001', title, status::course_status, url from s;
update courses set site_price_ils = 5000 where id = '77777777-0000-0000-0000-000000000011';
insert into scrape_pages (institution_id, url, course_id) select inst, url, course_id from s;
-- לפי הסדר של tag, כדי שהמזהים יעלו באותו סדר.
insert into course_change_queue (page_id, course_id, kind, new_value, reasons)
select p.id, s.course_id, 'new_course', s.fields, s.reasons from s join scrape_pages p on p.course_id = s.course_id
where s.reasons is not null order by s.tag;
-- שינוי בשדה, של הקורס הפעיל: הפונקציות של הרשימה לא נוגעות בו.
insert into course_change_queue (course_id, kind, field, old_value, new_value, confidence, reasons)
values ('77777777-0000-0000-0000-000000000010', 'field', 'site_price_ils', 'null', '7000', 'high', '{price_new}');

create temp table q as
  select s.tag, c.id from s join course_change_queue c on c.course_id = s.course_id and c.kind = 'new_course'
  union all
  select 'field', c.id from course_change_queue c where c.course_id = '77777777-0000-0000-0000-000000000010' and c.kind = 'field';
grant select on q, s to anon, authenticated, service_role;
create function pg_temp.ids(variadic p_tags text[]) returns bigint[] language sql stable
as $$ select array_agg(q.id order by q.id) from q where q.tag = any(p_tags) $$;

-- ===== הרשאות: רק service_role =====

select ok(
  not has_function_privilege('anon', 'public.approve_course_changes(bigint[], uuid)', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.approve_course_changes(bigint[], uuid)', 'EXECUTE')
  and not has_function_privilege('anon', 'public.reject_course_changes(bigint[], uuid)', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.reject_course_changes(bigint[], uuid)', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.course_queue_new_course_groups()', 'EXECUTE')
  and not has_function_privilege('anon', 'public.course_queue_new_course_items(text, uuid, integer)', 'EXECUTE')
  and has_function_privilege('service_role', 'public.approve_course_changes(bigint[], uuid)', 'EXECUTE')
  and has_function_privilege('service_role', 'public.reject_course_changes(bigint[], uuid)', 'EXECUTE')
  and has_function_privilege('service_role', 'public.course_queue_new_course_groups()', 'EXECUTE')
  and has_function_privilege('service_role', 'public.course_queue_new_course_items(text, uuid, integer)', 'EXECUTE'),
  'רק service_role מריץ את הסיכום, הרשימה, והאישור והדחייה בבת אחת'
);
select ok(
  not has_function_privilege('authenticated', 'private.new_course_queue()', 'EXECUTE')
  and not has_function_privilege('anon', 'private.course_url_key(text)', 'EXECUTE')
  and has_function_privilege('service_role', 'private.new_course_queue()', 'EXECUTE'),
  'גם העזרים הפנימיים רק ל-service_role'
);
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "77777777-0000-0000-0000-00000000000b", "role": "authenticated"}', true);
select throws_ok(
  $$select * from approve_course_changes(pg_temp.ids('s1'), '77777777-0000-0000-0000-00000000000a')$$,
  '42501', null, 'משתמש רגיל לא מאשר בבת אחת, גם עם מזהה של מנהל'
);
reset role;

-- ===== נרמול =====

select is(private.course_title_key('  Python - למתחילים! '), 'python למתחילים', 'שם: אותיות קטנות, וסימנים לרווח אחד (גם ליד עברית)');
select ok(
  private.course_url_key('https://www.bk-a.example/%D7%A2/#top') = private.course_url_key('http://bk-a.example/ע')
  and private.course_url_key('https://bk-a.example/view/?ContentID=1') = 'bk-a.example/view?contentid=1'
  and private.course_url_key('https://bk-a.example/view/?ContentID=1') <> private.course_url_key('https://bk-a.example/view/?ContentID=2')
  and private.course_url_key('https://bk-a.example/%ff') = 'bk-a.example/%ff',
  'קישור: מפוענח, בלי www, # ו-/ בסוף. השאילתה נשארת, ו-%XX שאינו UTF-8 נשאר כמו שהוא'
);

-- ===== בטוח, או למה לא =====

select results_eq(
  $$select q.tag, n.causes from private.new_course_queue() n join q on q.id = n.queue_id order by q.tag$$,
  $$values
    ('b1', '{}'::text[]),
    ('dt1', '{duplicate_title}'),
    ('dt2', '{duplicate_title}'),
    ('du1', '{duplicate_url}'),
    ('du2', '{duplicate_url}'),
    ('ex', '{duplicate_existing}'),
    ('low', '{low_confidence}'),
    ('med', '{low_confidence}'),
    ('past', '{cohort_in_past}'),
    ('pub', '{not_draft}'),
    ('s1', '{}')$$,
  'בטוח רק בלי שום סימון: ביטחון גבוה בכל שדה (גם ב-new_value), בלי בעיה, בלי כפילות, ועדיין טיוטה'
);

-- ===== הסיכום לפי מוסד =====

select results_eq(
  $$select institution_name, total, safe, duplicates, safe_ids, cardinality(all_ids)
    from course_queue_new_course_groups() where institution_slug in ('bk-a', 'bk-b') order by institution_slug$$,
  $$values ('מוסד א לבדיקה', 10, 1, 5, pg_temp.ids('s1'), 10), ('מוסד ב לבדיקה', 1, 1, 0, pg_temp.ids('b1'), 1)$$,
  'לכל מוסד: כמה, כמה בטוחים, כמה בחשד לכפילות, ומזהי הבטוחים'
);
select is(
  (select causes from course_queue_new_course_groups() where institution_slug = 'bk-a'),
  '{"low_confidence": 2, "cohort_in_past": 1, "duplicate_title": 2, "duplicate_url": 2, "duplicate_existing": 1, "not_draft": 1}'::jsonb,
  'כמה פריטים יש לכל סיבה'
);
select results_eq(
  $$select jsonb_array_length(samples), samples -> 0 ->> 'title', (samples -> 0 ->> 'safe')::boolean, (samples -> 0 ->> 'price')::integer
    from course_queue_new_course_groups() where institution_slug = 'bk-a'$$,
  $$values (3, 'קורס בטוח', true, 5000)$$,
  'שלושה לדוגמה, הבטוח ראשון, עם השם והמחיר מהטיוטה'
);

-- ===== הרשימות המסוננות =====

select results_eq(
  $$select array_agg(queue_id order by queue_id), max(total) from course_queue_new_course_items('unsafe', '77777777-0000-0000-0000-000000000002', 30)$$,
  $$values (pg_temp.ids('low', 'dt1', 'dt2', 'du1', 'du2', 'ex', 'med', 'past', 'pub'), 9::bigint)$$,
  'רק לא בטוחים, של מוסד אחד'
);
select results_eq(
  $$select q.tag from course_queue_new_course_items('duplicates', '77777777-0000-0000-0000-000000000002', 30) i join q on q.id = i.queue_id$$,
  $$values ('dt1'), ('dt2'), ('du1'), ('du2'), ('ex')$$,
  'חשד לכפילות: כפילויות עומדות זו ליד זו, גם כשרק הקישור משותף'
);
select throws_ok(
  $$select * from course_queue_new_course_items('everything', null, 30)$$,
  '22023', null, 'מסנן לא מוכר נדחה'
);

-- ===== אישור בבת אחת =====

select throws_ok(
  $$select * from approve_course_changes(pg_temp.ids('s1'), '77777777-0000-0000-0000-00000000000b')$$,
  '42501', null, 'רק מנהל מאשר'
);
select throws_ok(
  $$select * from approve_course_changes(array(select generate_series(1, 501)::bigint), '77777777-0000-0000-0000-00000000000a')$$,
  '22023', null, 'עד 500 מזהים בקריאה'
);
-- הפונקציה עצמה לא מחליטה מה בטוח: השרת שולח רק את הבטוחים. כאן גם past, כדי לראות שהיא לא מסננת לפי הסיבה.
select results_eq(
  $$select q.tag, a.course_slug from approve_course_changes(pg_temp.ids('s1', 'past', 'b1', 'field', 'pub'), '77777777-0000-0000-0000-00000000000a') a
    join q on q.id = a.queue_id order by q.tag$$,
  $$values ('b1', 'bk-b1'), ('past', 'bk-past'), ('s1', 'bk-s1')$$,
  'אישור: רק קורסים חדשים שממתינים. שינוי בשדה, וקורס שכבר לא טיוטה, נשארים בתור בלי להפיל את השאר'
);
select results_eq(
  $$select s.tag, c.status::text from s join courses c on c.id = s.course_id where s.tag in ('s1', 'past', 'b1', 'low') order by s.tag$$,
  $$values ('b1', 'active'), ('low', 'draft'), ('past', 'active'), ('s1', 'active')$$,
  'הקורסים שאושרו פעילים, והשאר נשאר טיוטה'
);
select results_eq(
  $$select q.tag, c.status, c.decided_by from q join course_change_queue c on c.id = q.id where q.tag in ('s1', 'b1', 'field', 'pub') order by q.tag$$,
  $$values ('b1', 'approved', '77777777-0000-0000-0000-00000000000a'::uuid), ('field', 'pending', null), ('pub', 'pending', null),
           ('s1', 'approved', '77777777-0000-0000-0000-00000000000a'::uuid)$$,
  'בתור: מה שאושר עם מי שאישר, והשינוי בשדה והקורס שכבר פורסם עדיין ממתינים'
);
select results_eq(
  $$select q.tag, l.action, l.actor_id, l.details from q join audit_log l on l.course_queue_id = q.id order by q.tag$$,
  $$values
    ('b1', 'course_approve', '77777777-0000-0000-0000-00000000000a'::uuid, '{"kind": "new_course", "course_id": "77777777-0000-0000-0000-000000000021"}'::jsonb),
    ('past', 'course_approve', '77777777-0000-0000-0000-00000000000a'::uuid, '{"kind": "new_course", "course_id": "77777777-0000-0000-0000-000000000019"}'::jsonb),
    ('s1', 'course_approve', '77777777-0000-0000-0000-00000000000a'::uuid, '{"kind": "new_course", "course_id": "77777777-0000-0000-0000-000000000011"}'::jsonb)$$,
  'ביומן: שורה אחת לכל קורס שאושר, רק מה הוחלט ועל איזה קורס'
);
select is(
  (select count(*)::integer from course_changes c join s on s.course_id = c.course_id
   where c.field = 'status' and c.old_value = '"draft"' and c.new_value = '"active"' and c.source = 'approved'),
  3,
  'ביומן השינויים של הקורס: טיוטה לפעיל, פעם אחת לכל קורס'
);
select is(
  (select count(*)::integer from approve_course_changes(pg_temp.ids('s1', 'past', 'b1'), '77777777-0000-0000-0000-00000000000a')),
  0,
  'אישור חוזר של אותה רשימה לא מחזיר כלום'
);
select is(
  (select count(*)::integer from audit_log l join q on q.id = l.course_queue_id),
  3,
  'ואין שורה נוספת ביומן'
);
select is(
  (select total from course_queue_new_course_groups() where institution_slug = 'bk-a'),
  8,
  'מה שאושר יורד מהסיכום'
);

-- ===== דחייה בבת אחת =====

select throws_ok(
  $$select * from reject_course_changes(pg_temp.ids('dt1'), '77777777-0000-0000-0000-00000000000b')$$,
  '42501', null, 'רק מנהל דוחה'
);
select results_eq(
  $$select q.tag, r.course_slug from reject_course_changes(pg_temp.ids('dt1', 'dt2', 'field'), '77777777-0000-0000-0000-00000000000a') r
    join q on q.id = r.queue_id order by q.tag$$,
  $$values ('dt1', 'bk-dt1'), ('dt2', 'bk-dt2')$$,
  'דחייה: רק קורסים חדשים שממתינים'
);
select results_eq(
  $$select q.tag, c.status, co.status::text, p.state
    from q join course_change_queue c on c.id = q.id join courses co on co.id = c.course_id join scrape_pages p on p.id = c.page_id
    where q.tag in ('dt1', 'dt2') order by q.tag$$,
  $$values ('dt1', 'rejected', 'draft', 'ignored'), ('dt2', 'rejected', 'draft', 'ignored')$$,
  'הקורס שנדחה נשאר טיוטה, והדף שלו לא נקרא יותר'
);
select is(
  (select count(*)::integer from audit_log l join q on q.id = l.course_queue_id where l.action = 'course_reject'),
  2,
  'ביומן: שורה לכל קורס שנדחה'
);
select is(
  (select count(*)::integer from reject_course_changes(pg_temp.ids('dt1', 'dt2'), '77777777-0000-0000-0000-00000000000a')),
  0,
  'דחייה חוזרת לא מחזירה כלום'
);
select is(
  (select count(*)::integer from audit_log l join q on q.id = l.course_queue_id),
  5,
  'ואין שורות נוספות ביומן'
);
select is(
  (select status from course_change_queue where id = (select id from q where tag = 'field')),
  'pending',
  'השינוי בשדה עדיין ממתין, אחרי האישור והדחייה'
);

select * from finish();
rollback;
