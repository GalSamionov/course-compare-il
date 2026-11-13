-- נתוני דוגמה של תוכנית 2א. כל השמות, המחירים והביקורות לא אמיתיים.
-- הקובץ רץ אחרי seed.sql (ראו supabase/config.toml), ובטוח להריץ אותו שוב:
-- כל הכנסה היא on conflict do nothing, וכל עדכון חל רק על שורה שעוד לא עודכנה.

-- 1. מתי מתקיימים שלושת הקורסים של תוכנית 1, לפי השעות ב-schedule שלהם (כולם אחרי 17:00).
update courses
set time_slots = '{evening}'
where slug in ('full-stack-sample', 'ai-tools-sample', 'home-cooking-sample')
  and time_slots = '{}';
