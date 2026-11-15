begin;
create extension if not exists pgtap with schema extensions;
select plan(40);

-- פנייה של חברה מ-/companies (20261115233001_company_requests.sql): אין קריאה ואין כתיבה לציבור, מגבלת הקצב,
-- הבדיקות של הערכים, ההחלטות של גל ביומן, והניקוי. המסד המקומי משותף: כל שאילתה מוגבלת לנתונים של הבדיקה.
insert into auth.users (id, email) values
  ('77777777-0000-0000-0000-00000000000a', 'cr-admin@example.test'),
  ('77777777-0000-0000-0000-00000000000b', 'cr-user@example.test');
insert into admins (user_id) values ('77777777-0000-0000-0000-00000000000a');

-- ===== הציבור: לא רואה ולא כותב =====

select ok(
  not has_table_privilege('anon', 'public.company_requests', 'SELECT')
  and not has_table_privilege('authenticated', 'public.company_requests', 'SELECT')
  and not has_table_privilege('anon', 'public.company_requests', 'INSERT')
  and not has_table_privilege('authenticated', 'public.company_requests', 'INSERT')
  and not has_table_privilege('anon', 'public.company_requests', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.company_requests', 'DELETE'),
  'לאורח ולמשתמש מחובר אין שום הרשאה על הפניות'
);
select ok(
  not has_function_privilege('anon', 'public.submit_company_request(text, text, text, text, text, text, text, text, text)', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.submit_company_request(text, text, text, text, text, text, text, text, text)', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.set_company_request_status(bigint, uuid, text)', 'EXECUTE')
  and not has_function_privilege('anon', 'public.purge_company_requests()', 'EXECUTE')
  and has_function_privilege('service_role', 'public.submit_company_request(text, text, text, text, text, text, text, text, text)', 'EXECUTE')
  and has_function_privilege('service_role', 'public.set_company_request_status(bigint, uuid, text)', 'EXECUTE')
  and has_function_privilege('service_role', 'public.purge_company_requests()', 'EXECUTE'),
  'רק השרת, עם המפתח הסודי, מריץ את הפונקציות'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "77777777-0000-0000-0000-00000000000b", "role": "authenticated"}', true);
select throws_ok($$select count(*) from company_requests$$, '42501', null, 'משתמש מחובר לא רואה את הפניות');
select throws_ok(
  $$insert into company_requests (company_name, contact_name, email, needs) values ('חברה', 'דנה', 'a@cr.example', 'סדנה')$$,
  '42501', null, 'משתמש מחובר לא מוסיף פנייה ישירות'
);
select throws_ok(
  $$select submit_company_request('חברה', 'דנה', 'a@cr.example', 'סדנה', repeat('a', 64))$$,
  '42501', null, 'משתמש מחובר לא מריץ את הפונקציה של הטופס'
);
select throws_ok(
  $$select set_company_request_status(1, '77777777-0000-0000-0000-00000000000a', 'closed')$$,
  '42501', null, 'משתמש מחובר לא משנה מצב, גם עם מזהה של מנהל'
);
reset role;
set local role anon;
select throws_ok($$select count(*) from company_requests$$, '42501', null, 'אורח לא רואה את הפניות');
select throws_ok(
  $$select submit_company_request('חברה', 'דנה', 'a@cr.example', 'סדנה', repeat('a', 64))$$,
  '42501', null, 'אורח לא מריץ את הפונקציה של הטופס'
);
reset role;

-- ===== הטופס, דרך השרת: ניקוי, כפילות ומגבלת קצב =====
set local role service_role;

select is(
  submit_company_request('  חברה   לדוגמה' || E'\t' || 'בע"מ ', ' דנה  כהן ', ' Buyer@CR.Example ',
    E'  צריך   סדנה\r\n\r\n\r\n\r\nלצוות  ‮של 12 ', repeat('1', 64), ' 050-123 4567 ', '11-50', 'workshop', 'quarter'),
  'created', 'פנייה ראשונה נשמרת'
);
select results_eq(
  $$select company_name, contact_name, email, phone, needs, team_size, format, timing, status
    from company_requests where email = 'buyer@cr.example'$$,
  $$values ('חברה לדוגמה בע"מ', 'דנה כהן', 'buyer@cr.example', '0501234567', E'צריך סדנה\n\nלצוות של 12',
            '11-50', 'workshop', 'quarter', 'new')$$,
  'הערכים נשמרים נקיים: רווחים, אותיות קטנות במייל, ספרות בטלפון, בלי סימן כיווניות, ועד שורה ריקה אחת'
);
select is(
  submit_company_request('חברה לדוגמה', 'דנה', 'buyer@cr.example', E'צריך סדנה\n\nלצוות של 12', repeat('2', 64)),
  'duplicate', 'אותו מייל עם אותו טקסט, כשהפנייה עוד פתוחה, לא נכנס פעמיים'
);
select is(
  (select count(*)::int from company_requests where email = 'buyer@cr.example'), 1, 'ובמסד יש פנייה אחת'
);
select is(
  submit_company_request('חברה שנייה', 'נועם', 'second@cr.example', 'הרצאה על אבטחת מידע', repeat('1', 64)),
  'created', 'פנייה שנייה מאותה כתובת, בלי שדות הבחירה'
);
select is(
  (select row(phone, team_size, format, timing)::text from company_requests where email = 'second@cr.example'),
  '(,,,)', 'שדות שלא מולאו נשמרים ריקים'
);
select is(
  submit_company_request('חברה שלישית', 'רוני', 'third@cr.example', 'קורס אקסל', repeat('1', 64), '', '', '', ''),
  'created', 'פנייה שלישית מאותה כתובת. בחירה ריקה נשמרת כריקה'
);
select throws_ok(
  $$select submit_company_request('חברה רביעית', 'שי', 'fourth@cr.example', 'סדנה', repeat('1', 64))$$,
  'LM040', null, 'פנייה רביעית מאותה כתובת באותה יממה נחסמת'
);
select throws_ok(
  $$select submit_company_request('חברה', 'שי', 'x@cr.example', 'סדנה', 'not-a-hash')$$,
  '22023', null, 'בלי טביעה תקינה של הכתובת, לא נשמר כלום'
);

-- ===== הבדיקות של הערכים, גם אם משהו עקף את השרת =====
select throws_ok(
  $$select submit_company_request('חברה', 'שי', 'a@cr.example?subject=x', 'סדנה', repeat('4', 64))$$,
  '23514', null, 'מייל עם ? לא נכנס: ב-/admin הוא קישור mailto'
);
select throws_ok(
  $$select submit_company_request('חברה', 'שי', 'no-at-sign', 'סדנה', repeat('4', 64))$$,
  '23514', null, 'מייל בלי @ לא נכנס'
);
select throws_ok(
  $$select submit_company_request('ח', 'שי', 'a@cr.example', 'סדנה', repeat('4', 64))$$,
  '23514', null, 'שם חברה של תו אחד לא נכנס'
);
select throws_ok(
  $$select submit_company_request(repeat('ח', 121), 'שי', 'a@cr.example', 'סדנה', repeat('4', 64))$$,
  '23514', null, 'שם חברה מעל 120 תווים לא נכנס'
);
select throws_ok(
  $$select submit_company_request('חברה', '   ', 'a@cr.example', 'סדנה', repeat('4', 64))$$,
  '23514', null, 'שם איש קשר ריק לא נכנס'
);
select throws_ok(
  $$select submit_company_request('חברה', 'שי', 'a@cr.example', '   ', repeat('4', 64))$$,
  '23514', null, 'בלי "מה אתם מחפשים" לא נכנס'
);
select throws_ok(
  $$select submit_company_request('חברה', 'שי', 'a@cr.example', repeat('א', 1001), repeat('4', 64))$$,
  '23514', null, '"מה אתם מחפשים" מעל 1,000 תווים לא נכנס'
);
select lives_ok(
  $$select submit_company_request('חברה', 'שי', 'max@cr.example', repeat('א', 1000), repeat('4', 64))$$,
  '1,000 תווים בדיוק נכנסים'
);
select throws_ok(
  $$select submit_company_request('חברה', 'שי', 'a@cr.example', 'סדנה', repeat('4', 64), '050-CALL-ME')$$,
  '23514', null, 'טלפון עם אותיות לא נכנס'
);
select throws_ok(
  $$select submit_company_request('חברה', 'שי', 'a@cr.example', 'סדנה', repeat('4', 64), null, '5000')$$,
  '23514', null, 'מספר עובדים שאינו ברשימה לא נכנס'
);
select throws_ok(
  $$select submit_company_request('חברה', 'שי', 'a@cr.example', 'סדנה', repeat('4', 64), null, null, 'webinar', 'someday')$$,
  '23514', null, 'מבנה או מועד שאינם ברשימה לא נכנסים'
);

-- מגבלה כוללת: 100 ביממה, מכל הכתובות. משלימים עד 100 ישירות, כ-postgres.
reset role;
insert into company_requests (company_name, contact_name, email, needs, client_hash)
select 'מילוי', 'מילוי', 'fill' || g || '@cr.example', 'מילוי', repeat('5', 64)
from generate_series(1, greatest(0, 100 - (select count(*) from company_requests where created_at > now() - interval '1 day'))) g;
set local role service_role;
select throws_ok(
  $$select submit_company_request('חברה', 'שי', 'late@cr.example', 'סדנה', repeat('6', 64))$$,
  'LM041', null, 'אחרי 100 פניות ביממה, מכל הכתובות, הטופס נסגר עד מחר'
);

-- ===== ב-/admin: חזרנו אליהם, ואז סגרנו =====
select throws_ok(
  $$select set_company_request_status((select id from company_requests where email = 'buyer@cr.example'),
    '77777777-0000-0000-0000-00000000000b', 'contacted')$$,
  '42501', null, 'מי שאינו מנהל לא משנה מצב, גם דרך השרת'
);
select throws_ok(
  $$select set_company_request_status((select id from company_requests where email = 'buyer@cr.example'),
    '77777777-0000-0000-0000-00000000000a', 'new')$$,
  '22023', null, 'אי אפשר להחזיר פנייה ל"חדשה"'
);
select lives_ok(
  $$select set_company_request_status((select id from company_requests where email = 'buyer@cr.example'),
    '77777777-0000-0000-0000-00000000000a', 'contacted')$$,
  'סימון "חזרנו אליהם"'
);
select throws_ok(
  $$select set_company_request_status((select id from company_requests where email = 'buyer@cr.example'),
    '77777777-0000-0000-0000-00000000000a', 'contacted')$$,
  'P0002', null, 'פעמיים "חזרנו אליהם" לא נרשם פעמיים'
);
select lives_ok(
  $$select set_company_request_status((select id from company_requests where email = 'buyer@cr.example'),
    '77777777-0000-0000-0000-00000000000a', 'closed')$$,
  'סגירה של פנייה שחזרנו אליה'
);
select lives_ok(
  $$select set_company_request_status((select id from company_requests where email = 'second@cr.example'),
    '77777777-0000-0000-0000-00000000000a', 'closed')$$,
  'סגירה ישר מ"חדשה"'
);
select throws_ok(
  $$select set_company_request_status((select id from company_requests where email = 'second@cr.example'),
    '77777777-0000-0000-0000-00000000000a', 'closed')$$,
  'P0002', null, 'פנייה סגורה לא נסגרת שוב'
);
select results_eq(
  $$select r.email, l.action, l.details ->> 'from' from audit_log l join company_requests r on r.id = l.company_request_id
    where r.email in ('buyer@cr.example', 'second@cr.example') order by l.id$$,
  $$values ('buyer@cr.example', 'company_request_contacted', 'new'), ('buyer@cr.example', 'company_request_closed', 'contacted'),
           ('second@cr.example', 'company_request_closed', 'new')$$,
  'כל שינוי מצב ביומן, עם המצב הקודם ובלי פרטי הפונה'
);
select throws_ok(
  $$insert into audit_log (actor_id, action, review_id, company_request_id)
    values ('77777777-0000-0000-0000-00000000000a', 'company_request_closed', gen_random_uuid(),
            (select id from company_requests where email = 'buyer@cr.example'))$$,
  '23514', null, 'שורה ביומן היא על דבר אחד בדיוק'
);

-- ===== הניקוי: פנייה סגורה נמחקת 12 חודשים אחרי הסגירה, והטביעה אחרי יומיים =====
reset role;
update company_requests set closed_at = now() - interval '13 months', created_at = now() - interval '14 months'
where email = 'buyer@cr.example';
update company_requests set created_at = now() - interval '3 days' where email = 'third@cr.example';
set local role service_role;
select ok(purge_company_requests() >= 1, 'הניקוי רץ');
select results_eq(
  $$select email, status, client_hash is null from company_requests
    where email in ('buyer@cr.example', 'second@cr.example', 'third@cr.example') order by email$$,
  $$values ('second@cr.example', 'closed', false), ('third@cr.example', 'new', true)$$,
  'רק הפנייה שנסגרה לפני יותר מ-12 חודשים נמחקה. פנייה פתוחה נשארת, והטביעה הישנה שלה נמחקה'
);

select * from finish();
rollback;
