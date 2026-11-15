begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

-- ===== הרשאות: רק השרת =====

select ok(
  (select relrowsecurity from pg_class where oid = 'public.proof_check_usage'::regclass),
  'RLS פעיל על מכסת הבדיקות'
);

select is_empty(
  $$select r, p from unnest(array['anon', 'authenticated']) r,
         unnest(array['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE']) p
    where has_table_privilege(r, 'public.proof_check_usage', p)
       or (p in ('SELECT', 'INSERT', 'UPDATE') and has_any_column_privilege(r, 'public.proof_check_usage', p))$$,
  'משתמש ציבורי לא קורא ולא כותב במכסת הבדיקות'
);

select is_empty(
  $$select r from unnest(array['anon', 'authenticated']) r
    where has_function_privilege(r, 'public.take_proof_checks(uuid, integer, integer)', 'execute')$$,
  'משתמש ציבורי לא מזמין בדיקות'
);

select ok(
  has_function_privilege('service_role', 'public.take_proof_checks(uuid, integer, integer)', 'execute'),
  'השרת מזמין בדיקות'
);

-- ===== עד p_per_day ביממה, כמו שהשרת קורא (service_role) =====
-- שורות ישנות מיממה לא נספרות. כ-postgres, כי לשרת אין סיבה לכתוב ישירות.
insert into proof_check_usage (author_id, created_at)
select '44444444-0000-0000-0000-00000000000c', now() - interval '25 hours' from generate_series(1, 6);

set local role service_role;

select is(
  (select array[
     take_proof_checks('44444444-0000-0000-0000-00000000000a', 4, 6),
     take_proof_checks('44444444-0000-0000-0000-00000000000a', 4, 6),
     take_proof_checks('44444444-0000-0000-0000-00000000000a', 1, 6)
   ]),
  array[4, 2, 0],
  'ארבע, ואז רק השתיים שנשארו, ואז כלום: לא יותר מ-6 ביממה'
);

select is(
  (select count(*)::integer from proof_check_usage where author_id = '44444444-0000-0000-0000-00000000000a'),
  6,
  'כל בדיקה שאושרה נרשמה'
);

select is(
  take_proof_checks('44444444-0000-0000-0000-00000000000b', 2, 6),
  2,
  'המכסה של כותב אחד לא נוגעת באחר'
);

select is(
  take_proof_checks('44444444-0000-0000-0000-00000000000c', 3, 6),
  3,
  'בדיקות מלפני יותר מיממה לא נספרות'
);

select is(
  (select array[
     take_proof_checks('44444444-0000-0000-0000-00000000000d', -3, 6),
     take_proof_checks('44444444-0000-0000-0000-00000000000d', null, 6),
     take_proof_checks('44444444-0000-0000-0000-00000000000d', 2, null)
   ]),
  array[0, 0, 0],
  'בקשה שלילית או חסרה לא מקבלת כלום'
);

select * from finish();
rollback;
