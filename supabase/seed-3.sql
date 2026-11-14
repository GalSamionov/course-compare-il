-- נתוני דוגמה של סבב 3. כל השמות והסכומים לא אמיתיים.
-- קובץ חדש, ולא שינוי ב-seed.sql או ב-seed-2a.sql: db push --include-seed זוכר כל קובץ לפי hash ולא מריץ שוב קובץ
-- שהשתנה. כל עדכון חל רק על שורה שעוד לא עודכנה, ולכן בטוח להריץ שוב.
-- אין כאן מנהל: קבצי ה-seed עולים לענן. מנהל מקומי: pnpm --dir web admin:local <email>.

-- "בוגרת" ו"בוגר" ליד השם, כמו בציור ("נועה ר., בוגרת מאומתת").
update reviews set author_title = 'graduate_f'
where id = 'bbbbbbbb-0000-0000-0000-000000000001' and author_title = 'none';
update reviews set author_title = 'graduate_m'
where id = 'bbbbbbbb-0000-0000-0000-000000000002' and author_title = 'none';

-- טווח "שילמו בפועל" מופיע מסבב 3 רק מ-5 חשבוניות. לקורס האפייה היו 3 (seed-2a.sql), ועכשיו 5,
-- כדי שעוד קורס לדוגמה יציג טווח: 2,000–4,000 ₪.
update reviews set paid_bucket_ils = 2000
where id = 'bbbbbbbb-0000-0000-0008-000000000004' and paid_bucket_ils is null;
update reviews set paid_bucket_ils = 3000
where id = 'bbbbbbbb-0000-0000-0008-000000000005' and paid_bucket_ils is null;
