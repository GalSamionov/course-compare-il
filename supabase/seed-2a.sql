-- נתוני דוגמה של תוכנית 2א. כל השמות, המחירים והביקורות לא אמיתיים.
-- הקובץ רץ אחרי seed.sql (ראו supabase/config.toml), ובטוח להריץ אותו שוב:
-- כל הכנסה היא on conflict do nothing, וכל עדכון חל רק על שורה שעוד לא עודכנה.
--
-- למה לקורסי הקריירה החדשים אין תשובות לשאלון:
-- בתחום התכנות יש פחות מ-30 ביקורות, ולכן full-stack-sample נמשך לממוצע של כל ביקורות הקריירה.
-- תשובה חדשה של קורס קריירה הייתה מזיזה את הציון שלו מ-7.9. לכן קורסי הקריירה החדשים מקבלים
-- מעט ביקורות בלי תשובות, כמו ai-tools-sample, והקורסים החדשים עם ציון הם מסוג תחביב או מבחן.

-- 1. מתי מתקיימים שלושת הקורסים של תוכנית 1, לפי השעות ב-schedule שלהם (כולם אחרי 17:00).
update courses
set time_slots = '{evening}'
where slug in ('full-stack-sample', 'ai-tools-sample', 'home-cooking-sample')
  and time_slots = '{}';

-- 2. שני תחומים חדשים.
insert into categories (id, slug, name, parent_id, course_type) values
  ('cccccccc-0000-0000-0000-000000000006', 'photography', 'צילום', null, 'hobby'),
  ('cccccccc-0000-0000-0000-000000000007', 'bookkeeping', 'הנהלת חשבונות', null, 'exam')
on conflict do nothing;

-- 3. ארבעה מוסדות לדוגמה.
insert into institutions (id, slug, name, website, kind) values
  ('dddddddd-0000-0000-0000-000000000003', 'sample-academy', 'אקדמיה לדוגמה', 'https://example.net', 'college'),
  ('dddddddd-0000-0000-0000-000000000004', 'sample-independent', 'מרצה עצמאית לדוגמה', null, 'independent'),
  ('dddddddd-0000-0000-0000-000000000005', 'sample-prep', 'מכון הכנה לדוגמה', 'https://example.com/prep', 'school'),
  ('dddddddd-0000-0000-0000-000000000006', 'sample-studio', 'סטודיו לצילום לדוגמה', 'https://example.org/studio', 'school')
on conflict do nothing;

-- 4. שנים-עשר קורסים. updated_at קבוע, כדי שהמיון של קורסים בלי ציון יהיה צפוי.
-- product_type כאן ולא ב-update נפרד: update מפעיל את ה-trigger, ו-updated_at היה הופך לזמן ההרצה.
insert into courses (
  id, slug, institution_id, category_id, title, status, check_tier,
  site_price_ils, total_hours, lecture_hours, hands_on_hours, duration_months,
  schedule, formats, time_slots, region, next_cohort_date, syllabus,
  admission, class_size_note, certificate, institution_promises,
  page_url, summary_good, summary_weak, last_checked_at, updated_at, product_type
) values
  -- קריירה
  ('eeeeeeee-0000-0000-0000-000000000004', 'web-basics-sample',
   'dddddddd-0000-0000-0000-000000000003', 'cccccccc-0000-0000-0000-000000000002',
   'בניית אתרים מאפס', 'active', 'listed',
   9800, 180, 90, 90, 6,
   'פעמיים בשבוע, ימים ב׳ ו-ד׳, 19:00–22:00', '{online}', '{evening}', null, '2027-01-18',
   '[{"title":"HTML ו-CSS","weak":false},{"title":"JavaScript בסיסי","weak":false},{"title":"וורדפרס","weak":true},{"title":"פרויקט אישי","weak":false}]'::jsonb,
   'בלי דרישות קדם', 'עד 30 תלמידים', 'תעודת סיום של המוסד', 'ליווי אישי עד הפרויקט הראשון',
   'https://example.net/web-basics', null, null, '2026-11-06 10:00:00+02', '2026-10-20 10:00:00+03', 'course'),
  ('eeeeeeee-0000-0000-0000-000000000005', 'react-frontend-sample',
   'dddddddd-0000-0000-0000-000000000004', 'cccccccc-0000-0000-0000-000000000002',
   'פיתוח צד לקוח עם React', 'active', 'listed',
   6400, 96, 32, 64, 4,
   'פעם בשבוע, יום ג׳, 18:30–21:30', '{in_person}', '{evening}', 'תל אביב', '2027-02-02',
   '[{"title":"React ורכיבים","weak":false},{"title":"ניהול מצב","weak":false},{"title":"TypeScript","weak":false},{"title":"בדיקות","weak":true}]'::jsonb,
   'היכרות עם JavaScript', 'עד 12 תלמידים', null, null,
   'https://example.com/react-sample', null, null, '2026-11-06 10:00:00+02', '2026-10-05 10:00:00+03', 'course'),
  ('eeeeeeee-0000-0000-0000-000000000006', 'python-data-sample',
   'dddddddd-0000-0000-0000-000000000003', 'cccccccc-0000-0000-0000-000000000003',
   'ניתוח נתונים עם Python', 'active', 'listed',
   7200, 120, 48, 72, 3,
   'פעמיים בשבוע, ימים א׳ ו-ג׳, 09:00–12:00', '{online}', '{morning}', null, '2027-01-04',
   '[{"title":"Python בסיסי","weak":false},{"title":"pandas","weak":false},{"title":"גרפים","weak":false},{"title":"פרויקט על נתונים אמיתיים","weak":false}]'::jsonb,
   'בלי דרישות קדם', null, 'תעודת סיום של המוסד', 'הכנה לראיונות עבודה',
   'https://example.net/python-data', null, null, '2026-11-06 10:00:00+02', '2026-09-28 10:00:00+03', 'course'),
  ('eeeeeeee-0000-0000-0000-000000000007', 'ai-weekend-sample',
   'dddddddd-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000003',
   'סדנת AI לעסקים קטנים', 'active', 'listed',
   1500, 16, 4, 12, 1,
   'ארבעה מפגשים, ימי שישי, 09:00–13:00', '{in_person}', '{weekend}', 'רמת גן', '2026-12-04',
   '[{"title":"כתיבת הנחיות","weak":false},{"title":"אוטומציה לשירות לקוחות","weak":false}]'::jsonb,
   null, 'עד 15 משתתפים', null, null,
   'https://example.com/ai-weekend', null, null, '2026-11-06 10:00:00+02', '2026-10-12 10:00:00+03', 'workshop'),
  -- תחביב
  ('eeeeeeee-0000-0000-0000-000000000008', 'baking-sample',
   'dddddddd-0000-0000-0000-000000000002', 'cccccccc-0000-0000-0000-000000000004',
   'אפייה ביתית: לחמים ועוגות', 'active', 'listed',
   2200, 32, 8, 24, 2,
   'פעם בשבוע, יום שישי, 09:00–13:00', '{in_person}', '{weekend}', 'חיפה', '2027-01-08',
   '[{"title":"בצקים ושמרים","weak":false},{"title":"מחמצת","weak":false},{"title":"עוגות בחושות","weak":false},{"title":"קישוט עוגות","weak":true}]'::jsonb,
   null, 'עד 10 תלמידים', null, null,
   'https://example.org/baking', 'הרבה עבודה בידיים, ומכל מפגש יוצאים עם מה שאפו.', 'המפגש על קישוט עוגות קצר מדי.',
   '2026-11-06 10:00:00+02', '2026-10-01 10:00:00+03', 'course'),
  ('eeeeeeee-0000-0000-0000-000000000009', 'italian-sample',
   'dddddddd-0000-0000-0000-000000000002', 'cccccccc-0000-0000-0000-000000000004',
   'בישול איטלקי', 'active', 'listed',
   2600, 30, 10, 20, 2,
   'פעם בשבוע, יום ב׳, 18:00–21:00', '{in_person,online}', '{evening}', 'חיפה', '2027-01-11',
   '[{"title":"פסטה טרייה","weak":false},{"title":"רטבים","weak":false},{"title":"ריזוטו","weak":false}]'::jsonb,
   null, 'עד 14 תלמידים', null, null,
   'https://example.org/italian', null, null, '2026-11-06 10:00:00+02', '2026-09-15 10:00:00+03', 'course'),
  ('eeeeeeee-0000-0000-0000-000000000010', 'photo-basics-sample',
   'dddddddd-0000-0000-0000-000000000006', 'cccccccc-0000-0000-0000-000000000006',
   'צילום למתחילים', 'active', 'listed',
   1900, 24, 10, 14, 2,
   'פעם בשבוע, יום שישי, 10:00–13:00', '{in_person}', '{weekend}', 'ירושלים', '2027-01-15',
   '[{"title":"חשיפה ומצב ידני","weak":false},{"title":"קומפוזיציה","weak":false},{"title":"אור טבעי","weak":false},{"title":"עריכה בסיסית","weak":true}]'::jsonb,
   'מצלמה עם מצב ידני', 'עד 12 תלמידים', null, null,
   'https://example.org/studio/basics', null, null, '2026-11-06 10:00:00+02', '2026-09-20 10:00:00+03', 'course'),
  ('eeeeeeee-0000-0000-0000-000000000011', 'phone-photo-sample',
   'dddddddd-0000-0000-0000-000000000006', 'cccccccc-0000-0000-0000-000000000006',
   'צילום בטלפון', 'active', 'listed',
   450, 6, 2, 4, 1,
   'ארבעה מפגשים בזום, יום ד׳, 20:00–21:30', '{online}', '{evening}', null, '2026-12-02',
   '[{"title":"קומפוזיציה","weak":false},{"title":"עריכה באפליקציה","weak":false}]'::jsonb,
   null, null, null, null,
   'https://example.org/studio/phone', null, null, '2026-11-06 10:00:00+02', '2026-10-25 10:00:00+03', 'workshop'),
  -- מבחן ותעודה
  ('eeeeeeee-0000-0000-0000-000000000012', 'psycho-full-sample',
   'dddddddd-0000-0000-0000-000000000005', 'cccccccc-0000-0000-0000-000000000005',
   'הכנה לפסיכומטרי, קורס מלא', 'active', 'listed',
   5900, 150, 120, 30, 3,
   'פעמיים בשבוע, ימים א׳ ו-ד׳, 17:00–21:00', '{in_person}', '{evening}', 'באר שבע', '2027-01-03',
   '[{"title":"חשיבה כמותית","weak":false},{"title":"חשיבה מילולית","weak":true},{"title":"אנגלית","weak":false},{"title":"מבחני תרגול","weak":false}]'::jsonb,
   null, 'עד 20 תלמידים', null, 'שיפור של 60 נקודות, או קורס חוזר בחינם',
   'https://example.com/prep/full', null, null, '2026-11-06 10:00:00+02', '2026-10-08 10:00:00+03', 'course'),
  ('eeeeeeee-0000-0000-0000-000000000013', 'psycho-online-sample',
   'dddddddd-0000-0000-0000-000000000005', 'cccccccc-0000-0000-0000-000000000005',
   'פסיכומטרי אונליין בקצב אישי', 'active', 'listed',
   3200, 120, 100, 20, 4,
   'בקצב אישי: שיעורים מוקלטים, ומפגש שאלות בזום פעם בשבוע', '{online}', '{morning,evening,weekend}', null, null,
   '[{"title":"חשיבה כמותית","weak":false},{"title":"חשיבה מילולית","weak":false},{"title":"אנגלית","weak":false}]'::jsonb,
   null, null, null, null,
   'https://example.com/prep/online', null, null, '2026-11-06 10:00:00+02', '2026-10-18 10:00:00+03', 'course'),
  ('eeeeeeee-0000-0000-0000-000000000014', 'bookkeeping-1-sample',
   'dddddddd-0000-0000-0000-000000000003', 'cccccccc-0000-0000-0000-000000000007',
   'הנהלת חשבונות סוג 1', 'active', 'listed',
   4800, 160, 100, 60, 5,
   'פעמיים בשבוע, ימים ב׳ ו-ה׳, 09:00–13:00', '{in_person}', '{morning}', 'פתח תקווה', '2027-02-07',
   '[{"title":"יסודות","weak":false},{"title":"פקודות יומן","weak":false},{"title":"מע״מ","weak":false},{"title":"הכנה למבחן","weak":false}]'::jsonb,
   null, 'עד 25 תלמידים', 'הכנה למבחן החיצוני. הקורס עצמו לא נותן תעודה.', null,
   'https://example.net/bookkeeping-1', null, null, '2026-11-06 10:00:00+02', '2026-09-10 10:00:00+03', 'course'),
  ('eeeeeeee-0000-0000-0000-000000000015', 'bookkeeping-2-sample',
   'dddddddd-0000-0000-0000-000000000003', 'cccccccc-0000-0000-0000-000000000007',
   'הנהלת חשבונות סוג 2', 'active', 'listed',
   5600, 180, 110, 70, 5,
   'פעמיים בשבוע, ימים א׳ ו-ג׳, 18:00–21:30', '{in_person,online}', '{evening}', 'פתח תקווה', '2027-03-01',
   '[{"title":"דוחות כספיים","weak":false},{"title":"שכר","weak":false},{"title":"הכנה למבחן","weak":false}]'::jsonb,
   'סוג 1, או ניסיון מקביל', null, 'הכנה למבחן החיצוני', null,
   'https://example.net/bookkeeping-2', null, null, '2026-11-06 10:00:00+02', '2026-10-28 10:00:00+03', 'course')
on conflict do nothing;

-- 5. ביקורות. המזהה: bbbbbbbb-0000-0000-<מספר הקורס>-<מספר הביקורת>, בלי התנגשות עם תוכנית 1 (0000 ו-0001).
-- הביקורת הראשונה של כל קורס עם טקסט ושם, והשאר אנונימיות.
insert into reviews (
  id, course_id, cohort_month, body, display_name, display_mode, status,
  proof_kind, paid_bucket_ils, verified_at, published_at
)
select
  ('bbbbbbbb-0000-0000-' || lpad(p.course_no::text, 4, '0') || '-' || lpad(g::text, 12, '0'))::uuid,
  ('eeeeeeee-0000-0000-0000-' || lpad(p.course_no::text, 12, '0'))::uuid,
  p.cohort,
  case when g = 1 then p.first_body
       else 'ביקורת לדוגמה מספר ' || g || ': נתוני דמה לבדיקת האתר בלבד, לא ביקורת אמיתית של בוגר או בוגרת של הקורס.'
  end,
  case when g = 1 then p.first_name else 'בוגר מאומת' end,
  case when g = 1 then 'first_initial'::display_name_mode else 'anonymous'::display_name_mode end,
  'published',
  p.proof::proof_kind,
  -- שלוש חשבוניות לקורס האפייה, כדי שעמוד הקורס יציג את הטווח ששולם בפועל (2,000–3,000 ₪).
  case when p.course_no = 8 and g <= 3 then case when g = 3 then 2500 else 2000 end end,
  timestamptz '2026-06-01 12:00:00+03' + p.course_no * interval '3 days' + g * interval '5 days',
  timestamptz '2026-06-02 12:00:00+03' + p.course_no * interval '3 days' + g * interval '5 days'
from (values
  (4, 2, date '2026-01-01', 'certificate',
   'למדתי לבנות אתר פשוט מאפס. החלק על וורדפרס הרגיש מיושן, אבל הפרויקט האישי עזר לי להבין איך הכול מתחבר.', 'ליאור א.'),
  (6, 1, date '2026-05-01', 'certificate',
   'התרגילים על נתונים אמיתיים היו הכי שימושיים. השיעורים בבוקר התאימו לי, כי אני עובדת במשמרות ערב.', 'נטע ר.'),
  (8, 8, date '2026-04-01', 'invoice',
   'יצאתי מכל מפגש עם לחם או עוגה שאפיתי בעצמי, וההסברים על בצק ושמרים היו ברורים. על קישוט עוגות היה רק מפגש אחד, קצר מדי.', 'שירה מ.'),
  (9, 6, date '2026-04-01', 'certificate',
   'המתכונים טובים והאווירה נעימה, אבל בקבוצה גדולה לא תמיד הספקתי לעבוד בעצמי. הפסטה הטרייה הייתה החלק הכי שימושי.', 'יואב ק.'),
  (10, 7, date '2026-03-01', 'certificate',
   'סוף סוף הבנתי חשיפה ומצב ידני. היציאות לצלם בחוץ עזרו מאוד, והמשוב על התמונות היה ענייני ומפורט.', 'רותם ש.'),
  (11, 2, date '2026-06-01', 'enrollment_email',
   'קורס קצר ומעשי. אחרי ארבעה מפגשים התמונות מהטלפון נראות הרבה יותר טוב, במיוחד באור של ערב.', 'עדי ב.'),
  (12, 9, date '2026-03-01', 'certificate',
   'המורים מסבירים לאט ובסבלנות, ומבחני התרגול דומים למבחן האמיתי. החשיבה המילולית קיבלה פחות זמן ממה שהייתי צריכה.', 'מאיה ג.'),
  (13, 3, date '2026-02-01', 'enrollment_email',
   'הגמישות מצוינת למי שעובד, אבל צריך משמעת עצמית. מפגש השאלות השבועי בזום עזר לי לא להישאר מאחור.', 'אורי ד.'),
  (14, 6, date '2026-01-01', 'certificate',
   'חומר מסודר ותרגול רב לקראת המבחן. המרצה זמינה לשאלות גם בין השיעורים, והקצב מתאים למי שמתחיל מאפס.', 'הדר נ.')
) as p(course_no, n, cohort, proof, first_body, first_name)
cross join lateral generate_series(1, p.n) as g
on conflict do nothing;

-- 6. תשובות לשאלון, רק לקורסי תחביב ומבחן (ראו ההסבר בראש הקובץ).
-- "כן" נשמר כ-5 ו"לא" כ-1. האפייה חזקה, הבישול האיטלקי בינוני.
insert into review_answers (review_id, metric_key, value)
select
  ('bbbbbbbb-0000-0000-' || lpad(r.c::text, 4, '0') || '-' || lpad(g::text, 12, '0'))::uuid,
  m.key,
  case r.c
    when 8 then case m.key
      when 'teaching' then case when g % 4 = 0 then 4 else 5 end
      when 'value' then case when g % 2 = 0 then 4 else 5 end
      else 5 end
    when 9 then case m.key
      when 'teaching' then case when g % 2 = 0 then 3 else 4 end
      when 'value' then 3
      else case when g <= 4 then 5 else 1 end end
    when 10 then case m.key
      when 'teaching' then case when g % 3 = 0 then 4 else 5 end
      when 'value' then 4
      else case when g = 7 then 1 else 5 end end
    when 11 then case m.key
      when 'teaching' then 4
      else 5 end
    when 12 then case m.key
      when 'teaching' then case when g % 3 = 0 then 4 else 5 end
      when 'value' then case when g % 2 = 0 then 3 else 4 end
      else case when g in (3, 7) then 1 else 5 end end
    when 13 then case m.key
      when 'teaching' then case when g = 3 then 3 else 4 end
      when 'value' then 4
      else case when g = 3 then 1 else 5 end end
    when 14 then case m.key
      when 'teaching' then 4
      when 'value' then case when g % 2 = 1 then 5 else 4 end
      else case when g = 6 then 1 else 5 end end
  end
from (values
  (8, 8, 'hobby'), (9, 6, 'hobby'), (10, 7, 'hobby'), (11, 2, 'hobby'),
  (12, 9, 'exam'), (13, 3, 'exam'), (14, 6, 'exam')
) as r(c, n, kind)
cross join lateral generate_series(1, r.n) as g
cross join lateral (
  select unnest(
    case r.kind
      when 'hobby' then array['teaching', 'skill_gained', 'value', 'recommend']
      else array['teaching', 'passed_exam', 'value', 'recommend']
    end
  ) as key
) as m
on conflict do nothing;

-- 7. שני מרצים חדשים. יעל ועומר מתוכנית 1 לא משתנים, כדי שעמוד Full Stack יישאר כמו שהוא.
insert into lecturers (id, slug, name, institution_bio, verified_facts) values
  ('ffffffff-0000-0000-0000-000000000003', 'michal-levi-sample', 'מיכל לוי',
   'אופה מקצועית, עם מאפייה משלה',
   '[{"text":"מפעילה מאפייה שכונתית עם עסק רשום","source_url":"https://example.org/bakery-sample"}]'::jsonb),
  ('ffffffff-0000-0000-0000-000000000004', 'avi-mizrahi-sample', 'אבי מזרחי',
   'מלמד פסיכומטרי כבר 15 שנה', '[]'::jsonb)
on conflict do nothing;

insert into course_lecturers (course_id, lecturer_id, role, sort_order) values
  ('eeeeeeee-0000-0000-0000-000000000008', 'ffffffff-0000-0000-0000-000000000003', 'מלמדת את כל המפגשים', 1),
  ('eeeeeeee-0000-0000-0000-000000000012', 'ffffffff-0000-0000-0000-000000000004', 'מרכז הקורס, מלמד חשיבה כמותית', 1),
  ('eeeeeeee-0000-0000-0000-000000000013', 'ffffffff-0000-0000-0000-000000000004', 'מקליט את השיעורים', 1)
on conflict do nothing;
