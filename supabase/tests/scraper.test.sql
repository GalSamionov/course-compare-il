begin;
create extension if not exists pgtap with schema extensions;
select plan(22);

-- נתוני בדיקה, כ-postgres. כל שאילתה מוגבלת לנתונים האלה: במסד המקומי יכולים להיות נתונים של הדגמת האוסף. מנהל אחד, מוסד, תחום וקורס פעיל.
insert into auth.users (id, email) values ('55555555-0000-0000-0000-00000000000c', 'scraper-admin@example.test');
insert into admins (user_id) values ('55555555-0000-0000-0000-00000000000c');
insert into categories (id, slug, name, course_type)
values ('55555555-0000-0000-0000-000000000001', 'scr-cat', 'תחום בדיקה', 'career');
insert into institutions (id, slug, name, kind)
values ('55555555-0000-0000-0000-000000000002', 'scr-inst', 'מוסד בדיקה', 'school');
insert into courses (id, slug, institution_id, category_id, title, status, site_price_ils, page_url) values
  ('55555555-0000-0000-0000-000000000003', 'scr-active', '55555555-0000-0000-0000-000000000002',
   '55555555-0000-0000-0000-000000000001', 'קורס פעיל', 'active', 10000, 'https://scr.example/courses/active');

-- ===== הרשאות =====

select ok(
  not has_table_privilege('anon', 'public.course_snapshots', 'SELECT')
  and not has_table_privilege('authenticated', 'public.course_changes', 'SELECT')
  and not has_table_privilege('authenticated', 'public.course_change_queue', 'SELECT')
  and not has_table_privilege('anon', 'public.scrape_pages', 'SELECT')
  and not has_table_privilege('anon', 'public.scrape_runs', 'SELECT'),
  'הציבור לא רואה את טבלאות האוסף'
);
select ok(
  not has_function_privilege('authenticated', 'public.scraper_apply_page(bigint, jsonb)', 'EXECUTE')
  and not has_function_privilege('anon', 'public.approve_course_change(bigint, uuid, jsonb)', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.undo_course_change(bigint, uuid)', 'EXECUTE')
  and has_function_privilege('service_role', 'public.scraper_apply_page(bigint, jsonb)', 'EXECUTE'),
  'רק service_role מריץ את פונקציות האוסף והתור'
);

-- ===== ריצה, דף חדש וקורס חדש =====

create temp table t (k text primary key, v bigint);
insert into t values ('run', scraper_start_run('local', 'replay'));
select throws_ok($$select scraper_start_run('local', 'replay')$$, '55006', null, 'שתי ריצות במקביל אסורות');

select is(
  scraper_apply_page((select v from t where k = 'run'), jsonb_build_object(
    'institution_id', '55555555-0000-0000-0000-000000000002', 'url', 'https://scr.example/courses/new',
    'outcome', 'changed', 'fetched_at', '2026-11-14T03:00:00Z',
    'snapshot', jsonb_build_object('fetch_method', 'http', 'content_hash', repeat('a', 64), 'page_text', 'דף', 'extracted', '{}'::jsonb, 'model', 'replay'),
    'new_course', jsonb_build_object('slug', 'scr-inst-new-abc123', 'category_id', '55555555-0000-0000-0000-000000000001',
      'title', 'קורס חדש', 'fields', jsonb_build_object('site_price_ils', 9000, 'formats', jsonb_build_array('online'), 'next_cohort_date', '2027-01-10')),
    'queue', jsonb_build_array(jsonb_build_object('kind', 'new_course', 'new', '{}'::jsonb, 'reasons', jsonb_build_array('new_course')))
  )) - 'course_id',
  '{"auto": 0, "queued": 1}'::jsonb,
  'קורס חדש: פריט אחד בתור'
);
select results_eq(
  $$select status::text, site_price_ils, formats, next_cohort_date from courses where slug = 'scr-inst-new-abc123'$$,
  $$values ('draft', 9000, array['online'], date '2027-01-10')$$,
  'קורס חדש נוצר כטיוטה, עם השדות בסוגים הנכונים'
);
select is(
  (select course_id from scrape_pages where url = 'https://scr.example/courses/new'),
  (select id from courses where slug = 'scr-inst-new-abc123'),
  'הדף מקושר לטיוטה'
);

-- ===== שינוי אוטומטי בקורס קיים, ושינוי שהקדים אותו =====

select is(
  scraper_apply_page((select v from t where k = 'run'), jsonb_build_object(
    'institution_id', '55555555-0000-0000-0000-000000000002', 'url', 'https://scr.example/courses/active',
    'course_id', '55555555-0000-0000-0000-000000000003', 'outcome', 'changed', 'fetched_at', '2026-11-14T03:00:00Z',
    'snapshot', jsonb_build_object('fetch_method', 'http', 'content_hash', repeat('b', 64), 'page_text', 'דף', 'extracted', '{}'::jsonb),
    'auto_changes', jsonb_build_array(
      jsonb_build_object('field', 'site_price_ils', 'old', 10000, 'new', 11000, 'quote', 'מחיר 11,000'),
      jsonb_build_object('field', 'total_hours', 'old', 100, 'new', 120, 'quote', '120 שעות'))
  )) - 'course_id',
  '{"auto": 1, "queued": 1}'::jsonb,
  'שינוי שהערך הישן שלו תואם עולה לבד. שינוי שהערך במסד כבר אחר עובר לתור'
);
select is((select site_price_ils from courses where slug = 'scr-active'), 11000, 'המחיר עודכן');
select is(
  (select reasons from course_change_queue where course_id = '55555555-0000-0000-0000-000000000003' and field = 'total_hours' and status = 'pending'),
  array['changed_since_read'],
  'הסיבה בתור: הערך השתנה מאז שהאוסף קרא אותו'
);
select results_eq(
  $$select field, old_value, new_value, source from course_changes where course_id = '55555555-0000-0000-0000-000000000003'$$,
  $$values ('site_price_ils', '10000'::jsonb, '11000'::jsonb, 'auto')$$,
  'השינוי נרשם ביומן כ"עלה לבד"'
);
select throws_ok(
  $$select private.scraper_set_course_field('55555555-0000-0000-0000-000000000003', 'status', '"removed"')$$,
  '42501', null, 'האוסף לא כותב שדות מחוץ לרשימה'
);

-- ===== העותקים והיומן לא משתנים =====

select throws_ok($$update course_snapshots set page_text = 'x'$$, 'P0001', null, 'אי אפשר לשנות עותק');
select throws_ok($$delete from course_changes$$, 'P0001', null, 'אי אפשר למחוק מהיומן');

-- ===== דף שנכשל שלוש פעמים, וקורס שנעלם פעמיים =====

select scraper_apply_page((select v from t where k = 'run'), jsonb_build_object(
  'institution_id', '55555555-0000-0000-0000-000000000002', 'url', 'https://scr.example/courses/broken', 'outcome', 'failed', 'error', 'timeout'))
from generate_series(1, 3);
select is(
  (select count(*)::integer from course_change_queue q join scrape_pages p on p.id = q.page_id
   where p.url = 'https://scr.example/courses/broken' and q.kind = 'fetch_failed' and q.status = 'pending'),
  1, 'דף שלא נטען שלוש פעמים נכנס לתור, פעם אחת'
);
select is(scraper_mark_missing((select v from t where k = 'run'), '55555555-0000-0000-0000-000000000002', array['https://scr.example/courses/new', 'https://scr.example/courses/broken']), 0, 'פעם ראשונה שהדף חסר: עוד לא מסמנים');
select is(scraper_mark_missing((select v from t where k = 'run'), '55555555-0000-0000-0000-000000000002', array['https://scr.example/courses/new', 'https://scr.example/courses/broken']), 1, 'פעם שנייה ברציפות: מסומן');
select is((select status::text from courses where slug = 'scr-active'), 'maybe_inactive', 'הקורס "ייתכן שאינו פעיל"');

-- ===== ההחלטות של גל =====

select lives_ok(
  $$select approve_course_change((select q.id from course_change_queue q join courses c on c.id = q.course_id where c.slug = 'scr-inst-new-abc123' and q.kind = 'new_course' and q.status = 'pending'), '55555555-0000-0000-0000-00000000000c')$$,
  'אישור של קורס חדש'
);
select is((select status::text from courses where slug = 'scr-inst-new-abc123'), 'active', 'הקורס החדש עלה לאוויר');
select lives_ok(
  $$select reject_course_change((select id from course_change_queue where course_id = '55555555-0000-0000-0000-000000000003' and kind = 'maybe_inactive' and status = 'pending'), '55555555-0000-0000-0000-00000000000c')$$,
  'דחייה של "ייתכן שאינו פעיל"'
);
select lives_ok(
  $$select undo_course_change((select id from course_changes where course_id = '55555555-0000-0000-0000-000000000003' and field = 'site_price_ils' and source = 'auto'), '55555555-0000-0000-0000-00000000000c')$$,
  'ביטול של שינוי שעלה לבד'
);
select results_eq(
  $$select status::text, site_price_ils from courses where slug = 'scr-active'$$,
  $$values ('active', 10000)$$,
  'הקורס חזר לפעיל, והמחיר חזר לקודם'
);

select * from finish();
rollback;
