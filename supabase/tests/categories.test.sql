begin;
create extension if not exists pgtap with schema extensions;
select plan(19);

-- עץ התחומים (20261116040001_new_categories.sql). הבדיקות קוראות את התחומים לפי slug, ולא משנות אותם.

-- ===== התחומים החדשים: שם, אב וסוג =====

select results_eq(
  $$ select c.slug, c.name, p.slug, c.course_type::text
     from categories c left join categories p on p.id = c.parent_id
     where c.slug in ('ai-at-work', 'ai-automation', 'ai-no-code', 'ai-content', 'data-analysis', 'cyber',
                      'digital-marketing', 'beauty', 'nails')
     order by c.slug $$,
  $$ values
     ('ai-at-work', 'AI בעבודה ולפי מקצוע', 'technology', 'career'),
     ('ai-automation', 'אוטומציות וסוכני AI', 'technology', 'career'),
     ('ai-content', 'AI ליצירת תוכן ווידאו', 'technology', 'career'),
     ('ai-no-code', 'בניית אפליקציות בלי קוד', 'technology', 'career'),
     ('beauty', 'יופי וטיפוח', null, 'career'),
     ('cyber', 'סייבר', 'technology', 'career'),
     ('data-analysis', 'דאטה', 'technology', 'career'),
     ('digital-marketing', 'שיווק דיגיטלי', null, 'career'),
     ('nails', 'ציפורניים ולק ג׳ל', 'beauty', 'career') $$,
  'nine new categories, with their parent and course type'
);

-- התחומים הקיימים שומרים על המזהים שלהם בענן (seed.sql מדלג עליהם, והקורסים לדוגמה מצביעים עליהם).
select results_eq(
  $$ select slug, id::text from categories
     where slug in ('technology', 'programming', 'ai', 'cooking', 'psychometric', 'photography', 'bookkeeping')
     order by id $$,
  $$ values
     ('technology', 'cccccccc-0000-0000-0000-000000000001'),
     ('programming', 'cccccccc-0000-0000-0000-000000000002'),
     ('ai', 'cccccccc-0000-0000-0000-000000000003'),
     ('cooking', 'cccccccc-0000-0000-0000-000000000004'),
     ('psychometric', 'cccccccc-0000-0000-0000-000000000005'),
     ('photography', 'cccccccc-0000-0000-0000-000000000006'),
     ('bookkeeping', 'cccccccc-0000-0000-0000-000000000007') $$,
  'existing categories keep the ids they have in production'
);

-- ===== שתי רמות בלבד: הקוד באתר מניח תחום ותחום-אב =====

select is_empty(
  $$ select c.slug from categories c
     join categories p on p.id = c.parent_id
     where p.parent_id is not null
       and c.slug !~ '^(test|cl|cq|bk|rp|badge|rev|scr|lists)-' $$,
  'no category is three levels deep'
);

-- ===== ai יצא משימוש =====

select is(
  (select replaced_by from categories where slug = 'ai'),
  '{ai-at-work,ai-automation,ai-no-code,ai-content}'::text[],
  'ai is replaced by the four AI categories'
);

select is_empty(
  $$ select r.slug from categories c, unnest(c.replaced_by) as r(slug)
     where not exists (
       select 1 from categories n
       where n.slug = r.slug and n.replaced_by = '{}'
         and n.parent_id is not distinct from c.parent_id and n.course_type = c.course_type
     ) $$,
  'every replacement exists, is active, and is a sibling of the same course type'
);

select is_empty(
  $$ select c.slug from categories c
     join categories child on child.parent_id = c.id
     where c.replaced_by <> '{}' $$,
  'a retired category has no sub-categories'
);

select is(
  (select array_agg(slug order by slug) from categories where replaced_by <> '{}'),
  '{ai}'::text[],
  'ai is the only retired category'
);

-- ===== תיאורים =====

select is(
  (select count(*)::int from categories
   where replaced_by = '{}' and description is not null
     and slug in ('technology', 'programming', 'ai-at-work', 'ai-automation', 'ai-no-code', 'ai-content',
                  'data-analysis', 'cyber', 'digital-marketing', 'beauty', 'nails', 'cooking', 'psychometric',
                  'photography', 'bookkeeping')),
  15,
  'all fifteen active categories have a description'
);

select is(
  (select description from categories where slug = 'ai-no-code'),
  'לבנות אתר או אפליקציה בעזרת AI, בלי לכתוב קוד בעצמכם: Lovable, Base44, Cursor.',
  'the no-code category names the tools'
);

select throws_ok(
  $$ update categories set description = 'קצר' where slug = 'nails' $$,
  '23514', null,
  'a description shorter than 10 characters is rejected'
);

select throws_ok(
  $$ update categories set description = repeat('א', 161) where slug = 'nails' $$,
  '23514', null,
  'a description longer than 160 characters is rejected'
);

select throws_ok(
  $$ update categories set replaced_by = '{nails}' where slug = 'nails' $$,
  '23514', null,
  'a category cannot be replaced by itself'
);

select lives_ok(
  $$ update categories set description = null where slug = 'nails' $$,
  'description is optional (a category added later may not have one yet)'
);

-- ===== קריאה ציבורית: האתר והאוסף קוראים את העמודות החדשות =====

set local role anon;

select is(
  (select description from categories where slug = 'cyber'),
  'אבטחת מידע והגנת סייבר: רשתות, SOC ובדיקות חדירה.',
  'a visitor reads the description'
);

select is(
  (select replaced_by from categories where slug = 'ai'),
  '{ai-at-work,ai-automation,ai-no-code,ai-content}'::text[],
  'a visitor reads replaced_by'
);

select throws_ok(
  $$ update categories set description = 'ניסיון של אורח לשנות' where slug = 'cyber' $$,
  '42501', null,
  'a visitor cannot change a description'
);

reset role;

-- ===== seed.sql עדיין עובד אחרי המיגרציה: הקורסים לדוגמה בתחומים הקיימים =====

select is(
  (select c.slug from courses x join categories c on c.id = x.category_id where x.slug = 'full-stack-sample'),
  'programming',
  'the sample full stack course is still in programming'
);

-- ב-ai אחרי seed.sql, וב-ai-at-work אחרי קובץ התיקון (גם הוא נבדק על המסד בפיי).
select ok(
  (select c.slug from courses x join categories c on c.id = x.category_id where x.slug = 'ai-tools-sample')
    in ('ai', 'ai-at-work'),
  'the sample AI course is in ai, or in ai-at-work after the fix file'
);

select is(
  (select count(*)::int from categories where slug in ('photography', 'bookkeeping') and description is not null),
  2,
  'categories from seed-2a.sql get their description from the migration'
);

select * from finish();
rollback;
