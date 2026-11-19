-- העיר של כל מוסד (institutions.city), שלב 3 של "לא יודעים למי לפנות?". התוכנית: docs/superpowers/plans/2026-11-19-stage-3-data.md.
-- נוצר מ-docs/research/2026-11-19-institution-cities.csv עם scraper/tools/cities_to_sql.py. לא עורכים ביד: מתקנים את המחקר ומריצים שוב.
-- רק מוסדות בעיר אחת, ו"אונליין" למוסד שמלמד רק אונליין. "כמה סניפים" ו"לא נמצא" נשארים null.
-- מעדכן רק מוסד שעוד אין לו עיר: בטוח להריץ שוב, ותיקון ביד לא נדרס. מוסד שעוד לא בטבלה לא משתנה.
--
-- הרצה, באישור של גל, אחרי שהמיגרציה 20261119000001_stage3_data.sql עלתה לענן:
--   pnpm exec supabase db query --remote --yes -f supabase/fixes/2026-11-19-institution-cities.sql
-- בדיקה אחרי, לקריאה בלבד:
--   pnpm exec supabase db query --remote --read-only "select count(*) filter (where city is not null) as with_city, count(*) filter (where city = 'אונליין') as online from institutions"

update institutions i
set city = v.city
from (values
  ('360-kinneret', 'צמח'),
  ('allonkira', 'תל אביב'),
  ('alonshabo', 'תל אביב'),
  ('ani-mator', 'תל אביב'),
  ('attilio', 'אור יהודה'),
  ('automation', 'תל אביב'),
  ('bishulim-school', 'תל אביב'),
  ('biu', 'רמת גן'),
  ('campus', 'אונליין'),
  ('ce-tcb', 'באר שבע'),
  ('ceu-ono', 'קריית אונו'),
  ('coding-academy', 'רמת גן'),
  ('culinarycampus', 'ירושלים'),
  ('dangourmet', 'תל אביב'),
  ('danon', 'תל אביב'),
  ('developers', 'רמת גן'),
  ('dmasters', 'אונליין'),
  ('ecomschool', 'בני ברק'),
  ('experis', 'תל אביב'),
  ('galia-cakes', 'ירושלים'),
  ('golbergpsyhometry', 'תל אביב'),
  ('hackeru', 'רמת גן'),
  ('hamama', 'אונליין'),
  ('handesaim-shenkar', 'תל אביב'),
  ('hasharon-college', 'כפר סבא'),
  ('hcba', 'חיפה'),
  ('heshev-college', 'כפר סבא'),
  ('hit', 'חולון'),
  ('hitech-school-biu', 'רמת גן'),
  ('hodaya-uxui', 'אונליין'),
  ('hpix', 'אשקלון'),
  ('int-college', 'תל אביב'),
  ('ipc', 'ירושלים'),
  ('israelcybercampus', 'הרצליה'),
  ('itsafe', 'רעננה'),
  ('jolt', 'אונליין'),
  ('kobiyonasi', 'רמת גן'),
  ('lahav', 'תל אביב'),
  ('machon-noam', 'בני ברק'),
  ('minshar', 'תל אביב'),
  ('musrara', 'ירושלים'),
  ('naya-college', 'הרצליה'),
  ('nextcollege', 'ירושלים'),
  ('onlinegraphic', 'אונליין'),
  ('richerschool', 'רמת גן'),
  ('rt-ed', 'תל אביב'),
  ('see-security', 'רמת גן'),
  ('studiogavra', 'תל אביב'),
  ('successcollege', 'תל אביב'),
  ('svcollege', 'תל אביב'),
  ('tafnit1', 'חולון'),
  ('teamim', 'ירושלים'),
  ('techswitch', 'עפולה'),
  ('tiltan', 'חיפה'),
  ('yvc', 'עמק יזרעאל'),
  ('zefat', 'צפת'),
  ('ai360', 'תל אביב')
) as v(slug, city)
where i.slug = v.slug and i.city is null;
