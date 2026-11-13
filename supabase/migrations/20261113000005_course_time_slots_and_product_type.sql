-- שתי עמודות לסבב 2א. ההרשאות לא משתנות: טבלת הקורסים קריאה לציבור ברמת הטבלה
-- (רק קורסים שאינם טיוטה), ולכן גם העמודות האלה קריאות.

-- מתי הקורס מתקיים: ערבים, בקרים או סופ"ש. דף הבית מסנן לפיה (השורה "מתי ואיך").
-- schedule נשאר טקסט חופשי לתצוגה. אי אפשר לגזור ממנו את הסינון באמינות.
-- מערך ריק אומר שאין לנו מידע.
alter table courses
  add column time_slots text[] not null default '{}'
  check (time_slots <@ array['morning', 'evening', 'weekend']::text[]);

-- סוג המוצר: קורס, סדנה או הרצאה. כך המבנה מוכן מראש להרצאות ולמסלול החברות (מסמך העיצוב, 3א.9).
alter table courses
  add column product_type text not null default 'course'
  check (product_type in ('course', 'workshop', 'lecture'));
