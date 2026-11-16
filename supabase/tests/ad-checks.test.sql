begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

-- ===== הרשאות: רק השרת =====

select is_empty(
  $$select r, t, p from unnest(array['anon', 'authenticated']) r,
         unnest(array['private.ad_checks', 'private.ad_check_usage']) t,
         unnest(array['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE']) p
    where has_table_privilege(r, t, p)$$,
  'משתמש ציבורי לא קורא ולא כותב במטמון ובמכסה'
);

select ok(
  (select bool_and(relrowsecurity) from pg_class
   where oid in ('private.ad_checks'::regclass, 'private.ad_check_usage'::regclass)),
  'RLS פעיל על שתי הטבלאות'
);

select is_empty(
  $$select r, f from unnest(array['anon', 'authenticated']) r,
         unnest(array['public.take_ad_check(text)', 'public.get_ad_check(text)',
                      'public.save_ad_check(text, jsonb)', 'public.purge_ad_checks()']) f
    where has_function_privilege(r, f, 'execute')$$,
  'משתמש ציבורי לא מריץ אף פונקציה של הבדיקה'
);

select ok(
  has_function_privilege('service_role', 'public.take_ad_check(text)', 'execute')
  and has_function_privilege('service_role', 'public.save_ad_check(text, jsonb)', 'execute'),
  'השרת מריץ את הפונקציות'
);

-- ===== המכסה: 3 לכל כתובת, כמו שהשרת קורא =====

set local role service_role;

select is(
  (select array[
     take_ad_check(repeat('a', 64)), take_ad_check(repeat('a', 64)),
     take_ad_check(repeat('a', 64)), take_ad_check(repeat('a', 64))]),
  array[true, true, true, false],
  'המכסה נעצרת ב-3 לאותה כתובת'
);

select ok(take_ad_check(repeat('b', 64)), 'כתובת אחרת עדיין בודקת');

select throws_ok(
  $$select take_ad_check('*')$$,
  '22023', null,
  'אי אפשר להעביר את השורה של כל האתר כטביעה'
);

reset role;

-- המונה של האתר: 4 בדיקות שעברו (3 + 1). הרביעית של a לא נספרה.
select is(
  (select n from private.ad_check_usage where ip_hash = '*' and day = (now() at time zone 'Asia/Jerusalem')::date),
  4,
  'המונה של האתר סופר רק בדיקות שעברו'
);

-- 300 לכל האתר: גם כתובת חדשה נעצרת.
update private.ad_check_usage set n = 300
where ip_hash = '*' and day = (now() at time zone 'Asia/Jerusalem')::date;
set local role service_role;
select ok(not take_ad_check(repeat('c', 64)), 'אחרי 300 באתר, גם כתובת חדשה לא בודקת');

-- ===== המטמון: 24 שעות =====

select is(
  (select get_ad_check('https://example.com/a') -> 'result'),
  null,
  'בלי תוצאה שמורה: null'
);
select lives_ok(
  $$select save_ad_check('https://example.com/a', '{"claims": {}, "flags": []}'::jsonb)$$,
  'השרת שומר תוצאה'
);
select is(
  (select get_ad_check('https://example.com/a') -> 'result'),
  '{"claims": {}, "flags": []}'::jsonb,
  'תוצאה שנשמרה חוזרת'
);
reset role;
update private.ad_checks set checked_at = now() - interval '25 hours' where url_norm = 'https://example.com/a';
set local role service_role;
select is(get_ad_check('https://example.com/a'), null, 'תוצאה בת יותר מיממה לא חוזרת');

-- ===== הניקוי: תוצאות מלפני 7 ימים =====
reset role;
update private.ad_checks set checked_at = now() - interval '8 days' where url_norm = 'https://example.com/a';
set local role service_role;
select is(purge_ad_checks(), 1, 'הניקוי מוחק תוצאה מלפני 7 ימים');

select * from finish();
rollback;
