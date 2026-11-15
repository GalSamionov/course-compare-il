begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

-- תוכנית 5ג: מספרי השקיפות (transparency_by_month). הספירות כאן הן הפרש: לפני ואחרי פעולות הבדיקה,
-- כי המסד בפיי משותף ויש בו כבר פעולות.
create temp table before_t as select * from transparency_by_month(3);
-- אמצע החודש הקודם, בשעון ישראל.
create temp table moments as
select ((date_trunc('month', now() at time zone 'Asia/Jerusalem') - interval '15 days') at time zone 'Asia/Jerusalem') as last_month;

insert into audit_log (actor_id, action, review_id, created_at)
select null, a, gen_random_uuid(), (select last_month from moments)
from unnest(array['approve', 'approve', 'reject', 'request_more', 'report_keep', 'report_remove']) a;
insert into audit_log (actor_id, action, course_queue_id, created_at)
select null, t.a, 900000 + t.n, (select last_month from moments)
from unnest(array['course_approve', 'course_edit', 'course_reject']) with ordinality as t(a, n);
insert into proofs (sha256, claimed_kind, mime_type, size_bytes, check_status, file_deleted_at)
values (repeat('e', 64), 'invoice', 'application/pdf', 1000, 'not_checked', (select last_month from moments));
-- החודש הנוכחי: לא נספר.
insert into audit_log (actor_id, action, review_id) values (null, 'approve', gen_random_uuid());
create temp table after_t as select * from transparency_by_month(3);

select ok(
  has_function_privilege('anon', 'public.transparency_by_month(integer)', 'EXECUTE')
  and has_function_privilege('authenticated', 'public.transparency_by_month(integer)', 'EXECUTE'),
  'אורח ומשתמש מחובר קוראים את המספרים'
);
select results_eq(
  $$select a.reviews_published - coalesce(b.reviews_published, 0),
           a.reviews_returned - coalesce(b.reviews_returned, 0),
           a.proofs_deleted - coalesce(b.proofs_deleted, 0),
           a.course_changes_approved - coalesce(b.course_changes_approved, 0),
           a.course_changes_rejected - coalesce(b.course_changes_rejected, 0),
           a.reported_reviews_kept - coalesce(b.reported_reviews_kept, 0),
           a.reported_reviews_removed - coalesce(b.reported_reviews_removed, 0)
    from after_t a left join before_t b using (month)
    where a.month = (date_trunc('month', now() at time zone 'Asia/Jerusalem') - interval '1 month')::date$$,
  $$values (2, 2, 1, 2, 1, 1, 1)$$,
  'בחודש הקודם: כל פעולה נספרת בשורה שלה'
);
select ok(
  not exists (select 1 from after_t where month >= date_trunc('month', now() at time zone 'Asia/Jerusalem')::date),
  'החודש הנוכחי לא מוצג'
);
select ok(
  (select count(*) from transparency_by_month(100)) <= 12,
  'עד 12 חודשים'
);
select is(
  pg_get_function_result('public.transparency_by_month(integer)'::regprocedure),
  'TABLE(month date, reviews_published integer, reviews_returned integer, proofs_deleted integer, course_changes_approved integer, course_changes_rejected integer, reported_reviews_kept integer, reported_reviews_removed integer)',
  'רק חודש וספירות: בלי מזהה, קורס או מוסד'
);
select ok(
  (select p.prosecdef and p.proconfig @> array['search_path=""']
   from pg_proc p where p.oid = 'public.transparency_by_month(integer)'::regprocedure),
  'security definer, עם search_path ריק'
);
set local role anon;
select ok((select count(*) from transparency_by_month(3)) >= 1, 'אורח קורא את המספרים');
select throws_ok($$select count(*) from audit_log$$, '42501', null, 'אורח לא קורא את היומן עצמו');
reset role;

select * from finish();
rollback;
