-- נתוני דוגמה בלבד. שמות המוסדות, המחירים והביקורות לא אמיתיים.

insert into metrics (key, label, scale, course_types, in_score, sort_order) values
  ('teaching', 'איכות הוראה', 'likert5', '{career,hobby,exam}', true, 1),
  ('hands_on', 'עשייה בפועל', 'likert5', '{career}', true, 2),
  ('up_to_date', 'עדכניות', 'likert5', '{career}', true, 3),
  ('value', 'ערך לכסף', 'likert5', '{career,hobby,exam}', true, 4),
  ('outcome_3m', 'אחרי 3 חודשים', 'likert5', '{career}', true, 5),
  ('skill_gained', 'רכשתי את המיומנות', 'yes_no', '{hobby}', true, 6),
  ('passed_exam', 'עברתי את המבחן', 'yes_no', '{exam}', true, 7),
  ('recommend', 'ממליץ', 'yes_no', '{career,hobby,exam}', false, 8);

insert into method_changes (version, summary, reason) values
  ('2026-11-13.1', 'גרסה ראשונה של ציון הבוגרים', 'עלייה לאוויר');

insert into categories (id, slug, name, parent_id, course_type) values
  ('cccccccc-0000-0000-0000-000000000001', 'technology', 'טכנולוגיה', null, 'career'),
  ('cccccccc-0000-0000-0000-000000000002', 'programming', 'תכנות', 'cccccccc-0000-0000-0000-000000000001', 'career'),
  ('cccccccc-0000-0000-0000-000000000003', 'ai', 'בינה מלאכותית', 'cccccccc-0000-0000-0000-000000000001', 'career'),
  ('cccccccc-0000-0000-0000-000000000004', 'cooking', 'בישול', null, 'hobby'),
  ('cccccccc-0000-0000-0000-000000000005', 'psychometric', 'פסיכומטרי', null, 'exam');

insert into institutions (id, slug, name, website, kind) values
  ('dddddddd-0000-0000-0000-000000000001', 'sample-college', 'מכללה לדוגמה', 'https://example.com', 'college'),
  ('dddddddd-0000-0000-0000-000000000002', 'sample-kitchen', 'בית ספר לבישול לדוגמה', 'https://example.org', 'school');

insert into courses (
  id, slug, institution_id, category_id, title, status, check_tier,
  site_price_ils, total_hours, lecture_hours, hands_on_hours, duration_months,
  schedule, formats, region, next_cohort_date, syllabus,
  lecturers_note, admission, class_size_note, certificate, institution_promises,
  video_url, page_url, summary_good, summary_weak, last_checked_at
) values
  ('eeeeeeee-0000-0000-0000-000000000001', 'full-stack-sample',
   'dddddddd-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000002',
   'פיתוח Full Stack', 'active', 'listed',
   14900, 420, 160, 260, 8,
   'שלוש פעמים בשבוע, ימים א׳, ג׳ ו-ה׳, 18:00–22:00', '{online,in_person}', 'תל אביב', '2027-01-10',
   '[{"title":"HTML, CSS ו-JavaScript","weak":false},
     {"title":"React לבניית ממשקים","weak":false},
     {"title":"Node.js ושרתים","weak":false},
     {"title":"מסדי נתונים SQL","weak":false},
     {"title":"Git ועבודה בצוות","weak":false},
     {"title":"פריסה לענן AWS","weak":true},
     {"title":"פרויקט מסכם","weak":false}]'::jsonb,
   '2 מרצים', 'ראיון ומבחן התאמה. לא צריך ניסיון קודם.',
   'עד 25 תלמידים', 'תעודת סיום של המוסד. לא תעודה ממשלתית.', 'ליווי השמה במשך 6 חודשים',
   'https://example.com/video-sample', 'https://example.com/full-stack',
   'הרבה תרגול אמיתי, ופרויקט מסכם שאפשר להראות בראיון עבודה.',
   'התמיכה בין המפגשים איטית, והקצב בחודש השני מהיר מדי למי שעובד.',
   '2026-11-06 10:00:00+02'),
  ('eeeeeeee-0000-0000-0000-000000000002', 'ai-tools-sample',
   'dddddddd-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000003',
   'כלי AI לעבודה יומיומית', 'active', 'listed',
   2900, 24, 8, 16, 2,
   'פעם בשבוע, יום ב׳, 18:00–21:00', '{online}', null, '2026-12-07',
   '[{"title":"כתיבת הנחיות","weak":false},{"title":"אוטומציה של משימות","weak":false}]'::jsonb,
   null, null, null, 'תעודת השתתפות', null,
   null, 'https://example.com/ai-tools', null, null, '2026-11-06 10:00:00+02'),
  ('eeeeeeee-0000-0000-0000-000000000003', 'home-cooking-sample',
   'dddddddd-0000-0000-0000-000000000002', 'cccccccc-0000-0000-0000-000000000004',
   'בישול ביתי למתחילים', 'active', 'listed',
   1800, 30, 6, 24, 2.5,
   'פעם בשבוע, יום ה׳, 17:00–20:00', '{in_person}', 'חיפה', '2027-02-04',
   '[{"title":"סכינים ובסיסים","weak":false},{"title":"רטבים","weak":false}]'::jsonb,
   null, null, 'עד 12 תלמידים', null, null,
   null, 'https://example.org/cooking', null, null, '2026-11-06 10:00:00+02');

-- 23 ביקורות דוגמה לקורס Full Stack. שתי הראשונות עם טקסט מלא.
-- cohort_month הוא חודש פתיחת המחזור. הקורס נמשך 8 חודשים, ולכן הביקורות מתפרסמות אחרי הסיום.
insert into reviews (
  id, course_id, cohort_month, body, display_name, display_mode, status,
  proof_kind, paid_bucket_ils, verified_at, published_at, follow_up_text
)
select
  ('bbbbbbbb-0000-0000-0000-' || lpad(g::text, 12, '0'))::uuid,
  'eeeeeeee-0000-0000-0000-000000000001',
  case when g % 2 = 0 then date '2025-09-01' else date '2025-07-01' end,
  case g
    when 1 then 'הרבה תרגול אמיתי ופרויקט מסכם שהראיתי בראיונות. החלק על ענן הרגיש ישן, והתמיכה בין המפגשים הייתה איטית.'
    when 2 then 'המרצים טובים, אבל הקצב בחודש השני היה מהיר מדי בשביל מי שעובד במשרה מלאה. בסוף הצלחתי לסיים את הפרויקט.'
    else 'ביקורת לדוגמה מספר ' || g || ': נתוני דמה לבדיקת העמוד בלבד, לא ביקורת אמיתית של בוגר או בוגרת של הקורס.'
  end,
  case g when 1 then 'נועה ר.' when 2 then 'דני ל.' else 'בוגר מאומת' end,
  case when g <= 2 then 'first_initial'::display_name_mode else 'anonymous'::display_name_mode end,
  'published',
  'invoice',
  case when g <= 6 then 12500 + (g % 3) * 1000 else null end,
  timestamptz '2026-05-01 12:00:00+03' + (g * interval '6 days'),
  timestamptz '2026-05-02 12:00:00+03' + (g * interval '6 days'),
  case g when 1 then 'התחלתי לעבוד כמפתחת ג׳וניור' else null end
from generate_series(1, 23) as g;

insert into review_answers (review_id, metric_key, value)
select
  ('bbbbbbbb-0000-0000-0000-' || lpad(g::text, 12, '0'))::uuid,
  m.key,
  case m.key
    when 'teaching' then case when g % 3 = 0 then 4 else 5 end
    when 'hands_on' then case when g % 2 = 0 then 4 else 5 end
    when 'up_to_date' then case when g % 4 = 0 then 3 else 4 end
    when 'value' then case when g % 2 = 0 then 3 else 4 end
    when 'outcome_3m' then case when g % 3 = 0 then 3 else 4 end
    when 'recommend' then case when g % 8 = 0 then 1 else 5 end
  end
-- recommend: ביקורות 8 ו-16 עונות "לא", כלומר 21 מתוך 23 ממליצים.
-- outcome_3m: רק 14 הראשונות ענו על שאלת ההמשך.
from generate_series(1, 23) as g
cross join (values ('teaching'), ('hands_on'), ('up_to_date'), ('value'), ('outcome_3m'), ('recommend')) as m(key)
where m.key <> 'outcome_3m' or g <= 14;

insert into vendor_responses (review_id, body) values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'פרק הענן עודכן במחזור ספטמבר.');

-- מרצים לדוגמה. יעל מלמדת בשני קורסים, ולעומר אין עובדות שבדקנו.
insert into lecturers (id, slug, name, institution_bio, verified_facts) values
  ('ffffffff-0000-0000-0000-000000000001', 'yael-cohen-sample', 'יעל כהן',
   'מפתחת בכירה עם 10 שנות ניסיון בתעשייה',
   '[{"text":"בנתה ומתחזקת ספריית קוד פתוח עם אלפי משתמשים","source_url":"https://example.com/open-source-sample"}]'::jsonb),
  ('ffffffff-0000-0000-0000-000000000002', 'omer-sagi-sample', 'עומר שגיא',
   'מפתח Full Stack בחברת סטארט-אפ', '[]'::jsonb);

insert into course_lecturers (course_id, lecturer_id, role, sort_order) values
  ('eeeeeeee-0000-0000-0000-000000000001', 'ffffffff-0000-0000-0000-000000000001', 'מרצה ראשית, מלמדת 4 מתוך 7 הפרקים', 1),
  ('eeeeeeee-0000-0000-0000-000000000001', 'ffffffff-0000-0000-0000-000000000002', 'מתרגל, מלווה את הפרויקט המסכם', 2),
  ('eeeeeeee-0000-0000-0000-000000000002', 'ffffffff-0000-0000-0000-000000000001', 'מרצה', 1);

update courses
set lecturers_summary = 'יעל מסבירה מצוין ועונה גם בין המפגשים. בפרויקט המסכם היה קשה להשיג את עומר.'
where slug = 'full-stack-sample';

-- 3 ביקורות לקורס ה-AI: לא מספיק לציון.
insert into reviews (id, course_id, cohort_month, body, display_name, display_mode, status, proof_kind, verified_at, published_at)
select
  ('bbbbbbbb-0000-0000-0001-' || lpad(g::text, 12, '0'))::uuid,
  'eeeeeeee-0000-0000-0000-000000000002',
  date '2026-06-01',
  'ביקורת לדוגמה מספר ' || g || ' על קורס ה-AI: נתוני דמה לבדיקת העמוד בלבד, לא ביקורת אמיתית של בוגר.',
  'בוגר מאומת', 'anonymous', 'published', 'certificate',
  timestamptz '2026-09-01 12:00:00+03' + (g * interval '1 day'),
  timestamptz '2026-09-02 12:00:00+03' + (g * interval '1 day')
from generate_series(1, 3) as g;
