-- ביקורת אנונימית: השם השמור הוא תמיד "בוגר מאומת".
-- העמודה display_name פתוחה לקריאה ציבורית, ולכן שם אמיתי לא נשמר בה אף פעם כשהכותב ביקש להישאר אנונימי.
alter table reviews add constraint reviews_anonymous_display_name
  check (display_mode <> 'anonymous' or display_name = 'בוגר מאומת');
