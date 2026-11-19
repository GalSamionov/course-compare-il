begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

-- שלב 3 (20261119000001_stage3_data.sql): העיר של המוסד, מספר המפגשים, והמתכונות שהאתר מכיר.
-- נתוני בדיקה, כ-postgres. הכול מתבטל ב-rollback בסוף.
insert into categories (id, slug, name, course_type)
values ('33333333-0000-0000-0000-000000000001', 's3-cat', 'תחום בדיקה', 'career');
insert into institutions (id, slug, name, kind)
values ('33333333-0000-0000-0000-000000000002', 's3-inst', 'מוסד בדיקה', 'school');
insert into courses (id, slug, institution_id, category_id, title, status) values
  ('33333333-0000-0000-0000-000000000003', 's3-course', '33333333-0000-0000-0000-000000000002',
   '33333333-0000-0000-0000-000000000001', 'קורס בדיקה', 'active');

-- ===== העיר של המוסד =====

select has_column('public', 'institutions', 'city', 'למוסד יש עיר');
select ok(has_column_privilege('anon', 'public.institutions', 'city', 'SELECT'), 'הציבור קורא את העיר של המוסד');
select lives_ok($$update institutions set city = 'תל אביב' where slug = 's3-inst'$$, 'עיר אחת בעברית');
select lives_ok($$update institutions set city = 'אונליין' where slug = 's3-inst'$$, 'מוסד שמלמד רק אונליין');
select throws_ok($$update institutions set city = ' חיפה' where slug = 's3-inst'$$, '23514', null, 'בלי רווחים בקצוות');
select throws_ok($$update institutions set city = '' where slug = 's3-inst'$$, '23514', null, 'עיר ריקה היא null, לא טקסט');

-- ===== מספר המפגשים =====

select ok(has_column_privilege('anon', 'public.courses', 'session_count', 'SELECT'), 'הציבור קורא את מספר המפגשים');
select throws_ok($$update courses set session_count = 0 where slug = 's3-course'$$, '23514', null, 'לפחות מפגש אחד');
select lives_ok(
  $$select private.scraper_set_course_field('33333333-0000-0000-0000-000000000003', 'session_count', '8'::jsonb)$$,
  'האוסף כותב את מספר המפגשים'
);
select is((select session_count from courses where slug = 's3-course'), 8, 'מספר המפגשים נכתב');

-- ===== המתכונות =====

select lives_ok($$update courses set formats = '{hybrid,recorded}' where slug = 's3-course'$$, 'משולב ומוקלט הן מתכונות');
select throws_ok($$update courses set formats = '{zoom}' where slug = 's3-course'$$, '23514', null, 'מתכונת שהאתר לא מכיר נדחית');

select * from finish();
rollback;
