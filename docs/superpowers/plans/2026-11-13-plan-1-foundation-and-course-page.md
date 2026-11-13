# תוכנית 1: שלד, מבנה נתונים, ציון בוגרים ועמוד הקורס

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** אתר Next.js שקורא מ-Supabase מקומי ומציג עמוד קורס בעיצוב שנבחר. ציון הבוגרים בעמוד מחושב בקוד שנבדק בבדיקות.

**Architecture:**
- **האתר:** אפליקציית Next.js (App Router, TypeScript) בתיקייה `web/`.
- **המסד:** Supabase מקומי (Docker). ה-migrations והבדיקות שלו בתיקייה `supabase/` בשורש.
- **ציון הבוגרים:** מודול TypeScript טהור בלי תלויות, שנבדק ב-Vitest.
- **חישוב הציונים:** סקריפט שמחשב ציון לכל קורס ומוסיף שורה לטבלת `scores`.
- **עמוד הקורס:** נבנה בשרת. קורא נתונים ציבוריים בלבד, דרך הרשאות ברמת השורה (RLS).

**Tech Stack:** Next.js (latest), React, TypeScript, Tailwind CSS v4, shadcn/ui, Supabase (Postgres, CLI דרך npm), pgTAP, Vitest, Playwright, pnpm, GitHub Actions.

**מקור:** `docs/superpowers/specs/2026-11-13-course-comparison-part1-design.md`. העיצוב: `design/canvas/Chosen.dc.html` ו-`.impeccable/surfaces/course-page.md`.

---

## מפת התוכניות של חלק 1

מסמך העיצוב מכסה כמה תת-מערכות, ולכן חלק 1 מחולק לחמש תוכניות. כל אחת מסתיימת בתוכנה שעובדת:

1. **תוכנית 1 (המסמך הזה):** שלד, מבנה נתונים בסיסי, הרשאות, ציון בוגרים ועמוד קורס עם נתוני דוגמה.
2. **תוכנית 2:** ביקורות מאומתות:
   - התחברות, העלאת הוכחה, שאלון וטקסט.
   - האימות: מודל שפה, ואחריו גל.
   - מחיקת ההוכחה, שאלת ההמשך במייל.
   - דיווחים וממשק הניהול.
   - טבלאות חדשות: `proofs`, `follow_ups`, `reports`, `audit_log`.
3. **תוכנית 3:** האוסף השבועי ב-Python וב-GitHub Actions, תור האישור לקורסים, ודוח הריצה. טבלאות חדשות: `course_snapshots`, `course_changes`, `collector_runs`.
4. **תוכנית 4:** שאר האתר הציבורי:
   - דף בית, עמוד תחום, עמוד מוסד, השוואה.
   - עמודי השיטה ו"מי משלם לנו".
   - תמונות שיתוף (Open Graph) ונתונים מובנים.
   - סיכומי "מה טוב" ו"מה חלש".
5. **תוכנית 5:** עלייה לאוויר:
   - Supabase ענן, Vercel ודומיין.
   - שירות מיילים, ניטור.
   - סקירת סיום של Impeccable ו-`DESIGN.md`.

## מבנה הקבצים בתוכנית הזו

```
package.json                       # כלי Supabase CLI וסקריפטים של המסד
supabase/config.toml               # נוצר על ידי supabase init
supabase/migrations/20261113000001_core_schema.sql
supabase/migrations/20261113000002_rls_and_append_only.sql
supabase/seed.sql                  # נתוני דוגמה, מסומנים כדוגמה
supabase/tests/rls.test.sql        # בדיקות pgTAP להרשאות
.github/workflows/ci.yml
web/                               # נוצר על ידי create-next-app
web/.env.example
web/src/app/layout.tsx             # עברית, RTL, גופנים
web/src/app/globals.css            # טוקנים של העיצוב
web/src/app/courses/[slug]/page.tsx
web/src/app/courses/[slug]/not-found.tsx
web/src/lib/score/types.ts
web/src/lib/score/constants.ts
web/src/lib/score/compute.ts
web/src/lib/score/compute.test.ts
web/src/lib/format.ts
web/src/lib/format.test.ts
web/src/lib/supabase/public-client.ts
web/src/lib/database.types.ts      # נוצר מהמסד
web/src/lib/data/course-page.ts
web/src/components/course/marks.tsx
web/src/components/course/source-legend.tsx
web/src/components/course/score-box.tsx
web/src/components/course/video-section.tsx
web/src/components/course/about-section.tsx
web/src/components/course/lecturers-section.tsx
web/src/components/course/price-section.tsx
web/src/components/course/grads-section.tsx
web/src/components/course/reviews-section.tsx
web/src/components/course/course-actions.tsx
web/scripts/recompute-scores.ts
web/e2e/course-page.spec.ts
web/playwright.config.ts
web/vitest.config.ts
```

---

### Task 1: שלד האתר ב-Next.js

**Files:**
- Create: `web/` (create-next-app)
- Create: `web/vitest.config.ts`
- Modify: `web/package.json` (scripts)

- [ ] **Step 1: ליצור את האפליקציה**

```bash
cd "C:/Users/galsa/Desktop/קורסים השוואות"
pnpm create next-app@latest web --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm --yes
```

Expected: נוצרה התיקייה `web/` עם `src/app/page.tsx`, ו-Tailwind v4 מוגדר ב-`src/app/globals.css`.

- [ ] **Step 2: לוודא שהבנייה עובדת בנתיב העברי**

```bash
cd web && pnpm build
```

Expected: `✓ Compiled successfully`. **אם הבנייה נכשלת בשגיאה שמזכירה נתיב, קידוד או `ENOENT` על התיקייה העברית** (בבניית אב-טיפוס shadcn, Parcel נכשל על הנתיב הזה):
1. משכפלים את המאגר לנתיב באנגלית: `git clone https://github.com/GalSamionov/course-compare-il.git "C:/Users/galsa/dev/course-compare-il"`.
2. מעבירים לשם את התיקייה `web/`.
3. ממשיכים את כל התוכנית משם, ומעדכנים את `CLAUDE.md` ואת `docs/STATUS.md` שהפרויקט עבר.

- [ ] **Step 3: להתקין כלי בדיקה**

```bash
cd web
pnpm add -D vitest @vitest/coverage-v8 @playwright/test tsx
pnpm add @supabase/supabase-js
pnpm exec playwright install chromium
```

- [ ] **Step 4: הגדרת Vitest**

Create `web/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
```

- [ ] **Step 5: סקריפטים ב-`web/package.json`**

מוסיפים לבלוק `"scripts"` (בלי למחוק את הקיימים):

```json
"test": "vitest run",
"test:watch": "vitest",
"e2e": "playwright test",
"score:recompute": "node --env-file=.env.local --import tsx scripts/recompute-scores.ts"
```

- [ ] **Step 6: לוודא ש-Vitest רץ**

```bash
pnpm test
```

Expected: `No test files found`. אין עדיין קבצי בדיקה, והפקודה עצמה עובדת.

- [ ] **Step 7: Commit**

```bash
cd ..
git add web
git commit -m "feat: שלד אתר Next.js עם Vitest ו-Playwright"
```

---

### Task 2: Supabase מקומי ומבנה הנתונים הבסיסי

**Files:**
- Create: `package.json` (שורש)
- Create: `supabase/config.toml` (supabase init)
- Create: `supabase/migrations/20261113000001_core_schema.sql`

- [ ] **Step 1: Supabase CLI בשורש הפרויקט**

Create `package.json`:

```json
{
  "name": "course-compare-il",
  "private": true,
  "scripts": {
    "db:start": "supabase start",
    "db:stop": "supabase stop",
    "db:reset": "supabase db reset",
    "db:test": "supabase test db",
    "db:status": "supabase status",
    "db:types": "supabase gen types typescript --local > web/src/lib/database.types.ts"
  }
}
```

```bash
pnpm add -D supabase
pnpm exec supabase init
```

Expected: נוצרה התיקייה `supabase/` עם `config.toml`. אם `supabase init` שואל על הגדרות של VS Code או Deno, עונים "no".

- [ ] **Step 2: להפעיל את Supabase המקומי**

Docker Desktop צריך לרוץ.

```bash
pnpm db:start
```

Expected: רשימה עם `API URL: http://127.0.0.1:54321`, מפתח ציבורי (`anon key`, או בגרסאות חדשות `Publishable key`), ומפתח סודי (`service_role key` או `Secret key`).

- [ ] **Step 3: ה-migration של מבנה הנתונים**

Create `supabase/migrations/20261113000001_core_schema.sql`:

```sql
-- מבנה הנתונים הבסיסי של חלק 1.
-- טבלאות של ביקורות ואימות (proofs, follow_ups, reports, audit_log) נוספות בתוכנית 2.
-- טבלאות של האוסף (course_snapshots, course_changes) נוספות בתוכנית 3.

create type course_type as enum ('career', 'hobby', 'exam');
create type check_tier as enum ('full', 'partial', 'listed');
create type course_status as enum ('draft', 'active', 'maybe_inactive', 'removed');
create type review_status as enum ('draft', 'pending', 'published', 'disputed', 'removed');
create type proof_kind as enum (
  'invoice', 'graduate_list', 'certificate', 'enrollment_email',
  'employer_letter', 'screenshot', 'project'
);
create type score_kind as enum ('graduate', 'full');
create type metric_scale as enum ('likert5', 'yes_no');
create type display_name_mode as enum ('full', 'first_initial', 'anonymous');

create table categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  parent_id uuid references categories(id),
  course_type course_type not null,
  created_at timestamptz not null default now()
);

create table institutions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  website text,
  kind text not null check (kind in ('college', 'school', 'independent', 'university', 'other')),
  business_number text,
  created_at timestamptz not null default now()
);

create table courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  institution_id uuid not null references institutions(id),
  category_id uuid not null references categories(id),
  title text not null,
  status course_status not null default 'draft',
  check_tier check_tier not null default 'listed',
  site_price_ils integer check (site_price_ils between 50 and 100000),
  total_hours integer check (total_hours between 1 and 3000),
  lecture_hours integer check (lecture_hours >= 0),
  hands_on_hours integer check (hands_on_hours >= 0),
  duration_months numeric(4, 1),
  schedule text,
  formats text[] not null default '{}',
  region text,
  next_cohort_date date,
  syllabus jsonb not null default '[]'::jsonb,
  lecturers_note text,
  admission text,
  class_size_note text,
  certificate text,
  institution_promises text,
  video_url text,
  page_url text,
  summary_good text,
  summary_weak text,
  lecturers_summary text,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index courses_category_idx on courses (category_id);
create index courses_institution_idx on courses (institution_id);

create function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger courses_updated_at before update on courses
  for each row execute function set_updated_at();

-- מרצים. institution_bio היא טענה של המוסד שלא נבדקה.
-- verified_facts: [{ "text": "...", "source_url": "https://..." }], רק מה שבדקנו בעצמנו.
create table lecturers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  institution_bio text,
  verified_facts jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table course_lecturers (
  course_id uuid not null references courses(id) on delete cascade,
  lecturer_id uuid not null references lecturers(id) on delete cascade,
  role text,
  sort_order integer not null default 1,
  primary key (course_id, lecturer_id)
);
create index course_lecturers_lecturer_idx on course_lecturers (lecturer_id);

create table metrics (
  key text primary key,
  label text not null,
  scale metric_scale not null,
  course_types course_type[] not null,
  in_score boolean not null default true,
  sort_order integer not null
);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id),
  author_id uuid references auth.users(id),
  cohort_month date not null,
  body text not null check (char_length(body) between 80 and 2000),
  display_name text not null,
  display_mode display_name_mode not null default 'first_initial',
  status review_status not null default 'draft',
  proof_kind proof_kind,
  paid_bucket_ils integer check (paid_bucket_ils % 500 = 0),
  verified_at timestamptz,
  published_at timestamptz,
  follow_up_text text,
  excluded_reason text,
  created_at timestamptz not null default now()
);
create unique index reviews_one_per_cohort
  on reviews (author_id, course_id, cohort_month) where author_id is not null;
create index reviews_course_status_idx on reviews (course_id, status);

-- תשובה "כן" נשמרת כ-5 ו"לא" כ-1, כדי שכל השאלות יהיו בסולם אחד.
create table review_answers (
  review_id uuid not null references reviews(id) on delete cascade,
  metric_key text not null references metrics(key),
  value smallint not null check (value between 1 and 5),
  answered_at timestamptz not null default now(),
  primary key (review_id, metric_key)
);

create table vendor_responses (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references reviews(id) on delete cascade,
  body text not null,
  posted_at timestamptz not null default now()
);

create table scores (
  id bigint generated always as identity primary key,
  course_id uuid not null references courses(id),
  kind score_kind not null,
  status text not null check (status in ('scored', 'not_enough_reviews')),
  value numeric(3, 1),
  review_count integer not null,
  reviews_needed integer,
  recommend_pct integer,
  per_metric jsonb not null default '{}'::jsonb,
  stale boolean not null default false,
  method_version text not null,
  computed_at timestamptz not null default now(),
  expires_at timestamptz
);
create index scores_course_latest_idx on scores (course_id, kind, computed_at desc);

create table method_changes (
  id bigint generated always as identity primary key,
  version text not null unique,
  summary text not null,
  reason text not null,
  changed_at timestamptz not null default now()
);
```

- [ ] **Step 4: להריץ את ה-migration**

```bash
pnpm db:reset
```

Expected: `Finished supabase db reset on branch main.`, בלי שגיאות SQL. `seed.sql` עוד לא קיים, ולכן אזהרה עליו היא בסדר.

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml supabase
git commit -m "feat: Supabase מקומי ומבנה נתונים בסיסי"
```

---

### Task 3: הרשאות, טבלאות שאי אפשר לשנות, ובדיקות pgTAP

**Files:**
- Create: `supabase/migrations/20261113000002_rls_and_append_only.sql`
- Create: `supabase/tests/rls.test.sql`

- [ ] **Step 1: לכתוב את הבדיקה שנכשלת**

Create `supabase/tests/rls.test.sql`:

```sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

-- נתוני בדיקה. נכתבים כמשתמש-על, שעוקף את ההרשאות.
insert into categories (id, slug, name, course_type)
values ('aaaaaaaa-0000-0000-0000-000000000001', 'test-cat', 'תחום בדיקה', 'career');
insert into institutions (id, slug, name, kind)
values ('aaaaaaaa-0000-0000-0000-000000000002', 'test-inst', 'מוסד בדיקה', 'school');
insert into courses (id, slug, institution_id, category_id, title, status) values
  ('aaaaaaaa-0000-0000-0000-000000000003', 'test-active', 'aaaaaaaa-0000-0000-0000-000000000002',
   'aaaaaaaa-0000-0000-0000-000000000001', 'קורס פעיל', 'active'),
  ('aaaaaaaa-0000-0000-0000-000000000004', 'test-draft', 'aaaaaaaa-0000-0000-0000-000000000002',
   'aaaaaaaa-0000-0000-0000-000000000001', 'קורס טיוטה', 'draft');
insert into reviews (id, course_id, cohort_month, body, display_name, status, published_at) values
  ('aaaaaaaa-0000-0000-0000-000000000005', 'aaaaaaaa-0000-0000-0000-000000000003', '2026-03-01',
   repeat('א', 80), 'בודק', 'published', now()),
  ('aaaaaaaa-0000-0000-0000-000000000006', 'aaaaaaaa-0000-0000-0000-000000000003', '2026-03-01',
   repeat('ב', 80), 'בודק', 'pending', null);
insert into scores (course_id, kind, status, value, review_count, method_version)
values ('aaaaaaaa-0000-0000-0000-000000000003', 'graduate', 'scored', 8.2, 23, 'test');

set local role anon;

select results_eq(
  $$select slug from courses where slug like 'test-%' order by slug$$,
  $$values ('test-active')$$,
  'אנונימי רואה רק קורסים שאינם טיוטה'
);

select results_eq(
  $$select count(*)::int from reviews where id in (
      'aaaaaaaa-0000-0000-0000-000000000005', 'aaaaaaaa-0000-0000-0000-000000000006')$$,
  $$values (1)$$,
  'אנונימי רואה רק ביקורות שפורסמו'
);

select results_eq(
  $$select count(*)::int from scores where course_id = 'aaaaaaaa-0000-0000-0000-000000000003'$$,
  $$values (1)$$,
  'אנונימי רואה ציונים'
);

select throws_ok(
  $$insert into courses (slug, institution_id, category_id, title)
    values ('hack', 'aaaaaaaa-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 'x')$$,
  '42501',
  null,
  'אנונימי לא יכול להוסיף קורס'
);

select throws_ok(
  $$insert into reviews (course_id, cohort_month, body, display_name, status)
    values ('aaaaaaaa-0000-0000-0000-000000000003', '2026-03-01', repeat('ג', 80), 'x', 'published')$$,
  '42501',
  null,
  'אנונימי לא יכול להוסיף ביקורת'
);

select throws_ok(
  $$insert into scores (course_id, kind, status, value, review_count, method_version)
    values ('aaaaaaaa-0000-0000-0000-000000000003', 'graduate', 'scored', 10, 1, 'x')$$,
  '42501',
  null,
  'אנונימי לא יכול להוסיף ציון'
);

reset role;

select throws_ok(
  $$update scores set value = 9.9 where course_id = 'aaaaaaaa-0000-0000-0000-000000000003'$$,
  'P0001',
  'scores rows are append-only',
  'אי אפשר לשנות ציון, גם כמשתמש-על'
);

select throws_ok(
  $$delete from scores where course_id = 'aaaaaaaa-0000-0000-0000-000000000003'$$,
  'P0001',
  'scores rows are append-only',
  'אי אפשר למחוק ציון, גם כמשתמש-על'
);

select * from finish();
rollback;
```

- [ ] **Step 2: להריץ ולוודא שהבדיקה נכשלת**

```bash
pnpm db:test
```

Expected: FAIL. אנונימי רואה גם את קורס הטיוטה (עוד אין הרשאות), והעדכון והמחיקה של ציון לא זורקים שגיאה.

- [ ] **Step 3: ה-migration של ההרשאות**

Create `supabase/migrations/20261113000002_rls_and_append_only.sql`:

```sql
-- קריאה ציבורית בלבד. כתיבה נעשית רק בשרת, עם המפתח הסודי.
-- הרשאות כתיבה למשתמשים מחוברים נוספות בתוכנית 2.

alter table categories enable row level security;
alter table institutions enable row level security;
alter table courses enable row level security;
alter table metrics enable row level security;
alter table reviews enable row level security;
alter table review_answers enable row level security;
alter table vendor_responses enable row level security;
alter table scores enable row level security;
alter table method_changes enable row level security;
alter table lecturers enable row level security;
alter table course_lecturers enable row level security;

create policy "categories are public" on categories for select using (true);
create policy "lecturers are public" on lecturers for select using (true);
create policy "lecturers of non-draft courses are public" on course_lecturers
  for select using (
    exists (select 1 from courses c where c.id = course_id and c.status <> 'draft')
  );
create policy "institutions are public" on institutions for select using (true);
create policy "metrics are public" on metrics for select using (true);
create policy "scores are public" on scores for select using (true);
create policy "method changes are public" on method_changes for select using (true);

create policy "non-draft courses are public" on courses
  for select using (status <> 'draft');

create policy "published reviews are public" on reviews
  for select using (status = 'published');

create policy "answers of published reviews are public" on review_answers
  for select using (
    exists (select 1 from reviews r where r.id = review_id and r.status = 'published')
  );

create policy "responses to published reviews are public" on vendor_responses
  for select using (
    exists (select 1 from reviews r where r.id = review_id and r.status = 'published')
  );

create function forbid_change() returns trigger
language plpgsql as $$
begin
  raise exception '% rows are append-only', tg_table_name;
end $$;

create trigger scores_append_only before update or delete on scores
  for each row execute function forbid_change();
create trigger method_changes_append_only before update or delete on method_changes
  for each row execute function forbid_change();
```

- [ ] **Step 4: להריץ ולוודא שהבדיקה עוברת**

```bash
pnpm db:reset && pnpm db:test
```

Expected: `rls.test.sql .. ok`, `All tests successful.`, ו-8 בדיקות שעברו.

- [ ] **Step 5: Commit**

```bash
git add supabase
git commit -m "feat: הרשאות קריאה ציבורית וטבלאות ציונים שאי אפשר לשנות"
```

---

### Task 4: נתוני דוגמה

**Files:**
- Create: `supabase/seed.sql`

- [ ] **Step 1: לכתוב את נתוני הדוגמה**

Create `supabase/seed.sql`:

```sql
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
   14900, 420, 160, 260, 7,
   'פעמיים בשבוע, ימים א׳ ו-ד׳, 18:00–21:30', '{online,in_person}', 'תל אביב', '2027-01-12',
   '[{"title":"HTML, CSS ו-JavaScript","weak":false},
     {"title":"React לבניית ממשקים","weak":false},
     {"title":"Node.js ושרתים","weak":false},
     {"title":"מסדי נתונים SQL","weak":false},
     {"title":"Git ועבודה בצוות","weak":false},
     {"title":"פריסה לענן AWS","weak":true},
     {"title":"פרויקט מסכם","weak":false}]'::jsonb,
   '3 מרצים, כולם מפתחים פעילים', 'ראיון ומבחן התאמה. לא צריך ניסיון קודם.',
   'עד 25 תלמידים', 'תעודת סיום של המוסד. לא תעודה ממשלתית.', 'ליווי השמה במשך 6 חודשים',
   'https://example.com/video-sample', 'https://example.com/full-stack',
   'הרבה תרגול אמיתי, ופרויקט מסכם שאפשר להראות בראיון עבודה.',
   'התמיכה בין המפגשים איטית, והקצב בחודש השני מהיר מדי למי שעובד.',
   '2026-11-06 10:00:00+02'),
  ('eeeeeeee-0000-0000-0000-000000000002', 'ai-tools-sample',
   'dddddddd-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000003',
   'כלי AI לעבודה יומיומית', 'active', 'listed',
   2900, 24, 8, 16, 1,
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
insert into reviews (
  id, course_id, cohort_month, body, display_name, display_mode, status,
  proof_kind, paid_bucket_ils, verified_at, published_at, follow_up_text
)
select
  ('bbbbbbbb-0000-0000-0000-' || lpad(g::text, 12, '0'))::uuid,
  'eeeeeeee-0000-0000-0000-000000000001',
  case when g % 2 = 0 then date '2025-11-01' else date '2026-03-01' end,
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
  timestamptz '2026-04-01 12:00:00+03' + (g * interval '6 days'),
  timestamptz '2026-04-02 12:00:00+03' + (g * interval '6 days'),
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
  date '2026-09-01',
  'ביקורת לדוגמה מספר ' || g || ' על קורס ה-AI: נתוני דמה לבדיקת העמוד בלבד, לא ביקורת אמיתית של בוגר.',
  'בוגר מאומת', 'anonymous', 'published', 'certificate',
  timestamptz '2026-10-01 12:00:00+03' + (g * interval '1 day'),
  timestamptz '2026-10-02 12:00:00+03' + (g * interval '1 day')
from generate_series(1, 3) as g;
```

- [ ] **Step 2: לטעון את הנתונים ולוודא שהבדיקות עדיין עוברות**

```bash
pnpm db:reset && pnpm db:test
```

Expected: הטעינה עוברת בלי שגיאות, ו-`All tests successful.` (8 בדיקות).

- [ ] **Step 3: Commit**

```bash
git add supabase/seed.sql
git commit -m "feat: נתוני דוגמה לשלושה קורסים"
```

---

### Task 5: חישוב ציון הבוגרים (TDD)

**Files:**
- Create: `web/src/lib/score/types.ts`
- Create: `web/src/lib/score/constants.ts`
- Create: `web/src/lib/score/compute.ts`
- Test: `web/src/lib/score/compute.test.ts`

- [ ] **Step 1: טיפוסים וקבועים**

Create `web/src/lib/score/types.ts`:

```ts
export type CourseType = 'career' | 'hobby' | 'exam';

export type MetricKey =
  | 'teaching'
  | 'hands_on'
  | 'up_to_date'
  | 'value'
  | 'outcome_3m'
  | 'skill_gained'
  | 'passed_exam'
  | 'recommend';

/** תשובות בסולם 1 עד 5. בשאלות כן או לא: כן = 5, לא = 1. */
export interface ReviewForScore {
  publishedAt: Date;
  excluded: boolean;
  answers: Partial<Record<MetricKey, number>>;
}

export type MetricMeans = Partial<Record<MetricKey, number>>;

export interface MetricResult {
  mean: number;
  n: number;
}

export interface ScoreInput {
  courseType: CourseType;
  reviews: ReviewForScore[];
  categoryPrior: MetricMeans;
  categoryReviewCount: number;
  typePrior: MetricMeans;
  now: Date;
}

export type ScoreResult =
  | {
      status: 'not_enough_reviews';
      reviewCount: number;
      reviewsNeeded: number;
      methodVersion: string;
    }
  | {
      status: 'scored';
      value: number;
      reviewCount: number;
      recommendPct: number | null;
      perMetric: Partial<Record<MetricKey, MetricResult>>;
      stale: boolean;
      methodVersion: string;
    };
```

Create `web/src/lib/score/constants.ts`:

```ts
import type { CourseType, MetricKey } from './types';

export const METHOD_VERSION = '2026-11-13.1';
export const MIN_REVIEWS = 5;
export const PRIOR_WEIGHT = 5;
export const WINDOW_MONTHS = 24;
export const STALE_MONTHS = 12;
export const MIN_OUTCOME_ANSWERS = 3;
export const CATEGORY_PRIOR_MIN_REVIEWS = 30;
export const NEUTRAL_MEAN = 3;

/** משקלות לפי סוג קורס. "ממליץ" לא נכנס לציון. */
export const WEIGHTS: Record<CourseType, Partial<Record<MetricKey, number>>> = {
  career: { teaching: 0.25, hands_on: 0.25, outcome_3m: 0.2, up_to_date: 0.15, value: 0.15 },
  hobby: { skill_gained: 0.4, teaching: 0.35, value: 0.25 },
  exam: { passed_exam: 0.45, teaching: 0.3, value: 0.25 },
};
```

- [ ] **Step 2: לכתוב את הבדיקות שנכשלות**

Create `web/src/lib/score/compute.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { computeGraduateScore } from './compute';
import type { MetricKey, MetricMeans, ReviewForScore, ScoreInput } from './types';

const now = new Date('2026-11-13T00:00:00Z');
const daysAgo = (days: number) => new Date(now.getTime() - days * 86_400_000);

function review(
  answers: Partial<Record<MetricKey, number>>,
  opts: { daysAgo?: number; excluded?: boolean } = {},
): ReviewForScore {
  return { publishedAt: daysAgo(opts.daysAgo ?? 10), excluded: opts.excluded ?? false, answers };
}

const flatPrior: MetricMeans = {
  teaching: 3, hands_on: 3, up_to_date: 3, value: 3, outcome_3m: 3, skill_gained: 3, passed_exam: 3,
};
const perfectCareer = { teaching: 5, hands_on: 5, up_to_date: 5, value: 5, outcome_3m: 5, recommend: 5 };

function input(reviews: ReviewForScore[], overrides: Partial<ScoreInput> = {}): ScoreInput {
  return {
    courseType: 'career',
    reviews,
    categoryPrior: flatPrior,
    categoryReviewCount: 100,
    typePrior: flatPrior,
    now,
    ...overrides,
  };
}

const times = <T>(n: number, make: (i: number) => T): T[] => Array.from({ length: n }, (_, i) => make(i));

describe('computeGraduateScore', () => {
  it('returns not_enough_reviews below five reviews', () => {
    const result = computeGraduateScore(input(times(4, () => review(perfectCareer))));
    expect(result).toEqual({
      status: 'not_enough_reviews',
      reviewCount: 4,
      reviewsNeeded: 1,
      methodVersion: '2026-11-13.1',
    });
  });

  it('pulls five perfect reviews toward the prior', () => {
    // כל שאלה: (5×5 + 5×3) / 10 = 4, ובסולם 10: 7.5
    const result = computeGraduateScore(input(times(5, () => review(perfectCareer))));
    expect(result.status).toBe('scored');
    if (result.status !== 'scored') return;
    expect(result.value).toBe(7.5);
    expect(result.reviewCount).toBe(5);
    expect(result.recommendPct).toBe(100);
  });

  it('ignores excluded reviews and reviews older than 24 months', () => {
    const reviews = [
      ...times(5, () => review(perfectCareer)),
      review({ ...perfectCareer, teaching: 1 }, { excluded: true }),
      review({ ...perfectCareer, teaching: 1 }, { daysAgo: 800 }),
    ];
    const result = computeGraduateScore(input(reviews));
    if (result.status !== 'scored') throw new Error('expected scored');
    expect(result.reviewCount).toBe(5);
    expect(result.value).toBe(7.5);
  });

  it('drops the outcome metric when fewer than three graduates answered it', () => {
    // הוראה ועשייה: 7.5. עדכניות וערך: (5×1 + 5×3) / 10 = 2, ובסולם 10: 2.5
    // (0.25×7.5 + 0.25×7.5 + 0.15×2.5 + 0.15×2.5) / 0.8 = 5.625, מעוגל ל-5.6
    const base = { teaching: 5, hands_on: 5, up_to_date: 1, value: 1 };
    const reviews = [
      review({ ...base, outcome_3m: 1 }),
      review({ ...base, outcome_3m: 1 }),
      ...times(3, () => review(base)),
    ];
    const result = computeGraduateScore(input(reviews));
    if (result.status !== 'scored') throw new Error('expected scored');
    expect(result.value).toBe(5.6);
  });

  it('uses the category prior only when the category has at least 30 reviews', () => {
    const reviews = times(5, () => review(perfectCareer));
    const highPrior: MetricMeans = { teaching: 5, hands_on: 5, up_to_date: 5, value: 5, outcome_3m: 5 };
    const lowPrior: MetricMeans = { teaching: 1, hands_on: 1, up_to_date: 1, value: 1, outcome_3m: 1 };

    const thin = computeGraduateScore(
      input(reviews, { categoryPrior: highPrior, typePrior: lowPrior, categoryReviewCount: 29 }),
    );
    const rich = computeGraduateScore(
      input(reviews, { categoryPrior: highPrior, typePrior: lowPrior, categoryReviewCount: 30 }),
    );
    if (thin.status !== 'scored' || rich.status !== 'scored') throw new Error('expected scored');
    expect(thin.value).toBe(5); // (25 + 5) / 10 = 3, ובסולם 10: 5
    expect(rich.value).toBe(10);
  });

  it('scores hobby courses with yes/no answers mapped to 5 and 1', () => {
    // מיומנות: ממוצע 4.2, ואחרי משיכה לממוצע 3.6, ובסולם 10: 6.5. הוראה וערך: 7.5
    // 0.4×6.5 + 0.35×7.5 + 0.25×7.5 = 7.1
    const yes = { skill_gained: 5, teaching: 5, value: 5 };
    const reviews = [...times(4, () => review(yes)), review({ ...yes, skill_gained: 1 })];
    const result = computeGraduateScore(input(reviews, { courseType: 'hobby' }));
    if (result.status !== 'scored') throw new Error('expected scored');
    expect(result.value).toBe(7.1);
  });

  it('computes the share of graduates who recommend the course', () => {
    const reviews = [...times(4, () => review(perfectCareer)), review({ ...perfectCareer, recommend: 1 })];
    const result = computeGraduateScore(input(reviews));
    if (result.status !== 'scored') throw new Error('expected scored');
    expect(result.recommendPct).toBe(80);
  });

  it('marks the score stale when the newest review is older than 12 months', () => {
    const old = computeGraduateScore(input(times(5, () => review(perfectCareer, { daysAgo: 400 }))));
    const fresh = computeGraduateScore(input(times(5, () => review(perfectCareer, { daysAgo: 10 }))));
    if (old.status !== 'scored' || fresh.status !== 'scored') throw new Error('expected scored');
    expect(old.stale).toBe(true);
    expect(fresh.stale).toBe(false);
  });
});
```

- [ ] **Step 3: להריץ ולוודא שהבדיקות נכשלות**

```bash
cd web && pnpm test
```

Expected: FAIL עם `Failed to resolve import "./compute"`.

- [ ] **Step 4: לממש את החישוב**

Create `web/src/lib/score/compute.ts`:

```ts
import {
  CATEGORY_PRIOR_MIN_REVIEWS,
  METHOD_VERSION,
  MIN_OUTCOME_ANSWERS,
  MIN_REVIEWS,
  NEUTRAL_MEAN,
  PRIOR_WEIGHT,
  STALE_MONTHS,
  WEIGHTS,
  WINDOW_MONTHS,
} from './constants';
import type { MetricKey, MetricMeans, MetricResult, ReviewForScore, ScoreInput, ScoreResult } from './types';

export function monthsBefore(date: Date, months: number): Date {
  const d = new Date(date.getTime());
  d.setUTCMonth(d.getUTCMonth() - months);
  return d;
}

/** ביקורות שנספרות: לא הוצאו מהציון, ופורסמו ב-24 החודשים האחרונים. */
export function eligibleReviews(reviews: ReviewForScore[], now: Date): ReviewForScore[] {
  const cutoff = monthsBefore(now, WINDOW_MONTHS);
  return reviews.filter((r) => !r.excluded && r.publishedAt >= cutoff);
}

export function metricResults(reviews: ReviewForScore[]): Partial<Record<MetricKey, MetricResult>> {
  const sums = new Map<MetricKey, { total: number; n: number }>();
  for (const review of reviews) {
    for (const [key, value] of Object.entries(review.answers) as [MetricKey, number][]) {
      const s = sums.get(key) ?? { total: 0, n: 0 };
      s.total += value;
      s.n += 1;
      sums.set(key, s);
    }
  }
  const result: Partial<Record<MetricKey, MetricResult>> = {};
  for (const [key, s] of sums) result[key] = { mean: s.total / s.n, n: s.n };
  return result;
}

export function metricMeans(reviews: ReviewForScore[]): MetricMeans {
  const means: MetricMeans = {};
  for (const [key, r] of Object.entries(metricResults(reviews)) as [MetricKey, MetricResult][]) {
    means[key] = r.mean;
  }
  return means;
}

const toTen = (mean: number) => ((mean - 1) / 4) * 10;
const round1 = (x: number) => Math.round(x * 10) / 10;

export function computeGraduateScore(input: ScoreInput): ScoreResult {
  const reviews = eligibleReviews(input.reviews, input.now);
  if (reviews.length < MIN_REVIEWS) {
    return {
      status: 'not_enough_reviews',
      reviewCount: reviews.length,
      reviewsNeeded: MIN_REVIEWS - reviews.length,
      methodVersion: METHOD_VERSION,
    };
  }

  const prior = input.categoryReviewCount >= CATEGORY_PRIOR_MIN_REVIEWS ? input.categoryPrior : input.typePrior;
  const perMetric = metricResults(reviews);

  let weighted = 0;
  let weightSum = 0;
  for (const [key, weight] of Object.entries(WEIGHTS[input.courseType]) as [MetricKey, number][]) {
    const result = perMetric[key];
    const n = result?.n ?? 0;
    if (key === 'outcome_3m' && n < MIN_OUTCOME_ANSWERS) continue;
    const priorMean = prior[key] ?? NEUTRAL_MEAN;
    const shrunk = (n * (result?.mean ?? 0) + PRIOR_WEIGHT * priorMean) / (n + PRIOR_WEIGHT);
    weighted += weight * toTen(shrunk);
    weightSum += weight;
  }

  const recommend = perMetric.recommend;
  const recommendPct = recommend
    ? Math.round((reviews.filter((r) => r.answers.recommend === 5).length / recommend.n) * 100)
    : null;

  const newest = Math.max(...reviews.map((r) => r.publishedAt.getTime()));
  const stale = newest < monthsBefore(input.now, STALE_MONTHS).getTime();

  return {
    status: 'scored',
    value: round1(weighted / weightSum),
    reviewCount: reviews.length,
    recommendPct,
    perMetric,
    stale,
    methodVersion: METHOD_VERSION,
  };
}
```

- [ ] **Step 5: להריץ ולוודא שהבדיקות עוברות**

```bash
pnpm test
```

Expected: `8 passed`.

- [ ] **Step 6: Commit**

```bash
cd ..
git add web/src/lib/score
git commit -m "feat: חישוב ציון הבוגרים עם בדיקות"
```

---

### Task 6: טיפוסי המסד, חיבור ל-Supabase, וסקריפט שמחשב ציונים

**Files:**
- Create: `web/.env.example`
- Create: `web/src/lib/database.types.ts` (נוצר)
- Create: `web/src/lib/supabase/public-client.ts`
- Create: `web/scripts/recompute-scores.ts`

- [ ] **Step 1: משתני סביבה**

Create `web/.env.example`:

```bash
# מקומי: הערכים מ-pnpm db:status בשורש הפרויקט
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
# סודי: רק לסקריפטים בשרת. אף פעם לא בקוד שרץ בדפדפן.
SUPABASE_SECRET_KEY=
```

מעתיקים ל-`web/.env.local` וממלאים:
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: המפתח שמסומן `anon key` או `Publishable key`.
- `SUPABASE_SECRET_KEY`: המפתח שמסומן `service_role key` או `Secret key`.

הקובץ `.env.local` לא נכנס ל-git, כי `.gitignore` מכסה את `.env.*`.

- [ ] **Step 2: ליצור את טיפוסי המסד**

```bash
pnpm db:types
```

Expected: נוצר `web/src/lib/database.types.ts`, ויש בו `courses:`, `reviews:` ו-`scores:`.

- [ ] **Step 3: חיבור ציבורי ל-Supabase**

Create `web/src/lib/supabase/public-client.ts`:

```ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

/** חיבור עם המפתח הציבורי. רואה רק מה שההרשאות מתירות. */
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
  return createClient<Database>(url, key, { auth: { persistSession: false } });
}
```

- [ ] **Step 4: הסקריפט שמחשב ציונים**

Create `web/scripts/recompute-scores.ts`:

```ts
import { createClient } from '@supabase/supabase-js';
import { computeGraduateScore, eligibleReviews, metricMeans } from '../src/lib/score/compute';
import type { CourseType, MetricKey, ReviewForScore } from '../src/lib/score/types';
import type { Database } from '../src/lib/database.types';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY');
const db = createClient<Database>(url, secret, { auth: { persistSession: false } });

type CategoryRef = { course_type: CourseType } | { course_type: CourseType }[] | null;
const courseTypeOf = (ref: CategoryRef): CourseType => (Array.isArray(ref) ? ref[0].course_type : ref!.course_type);

async function main() {
  const now = new Date();

  const { data: courses, error: coursesError } = await db
    .from('courses')
    .select('id, slug, category_id, categories(course_type)')
    .neq('status', 'draft');
  if (coursesError) throw coursesError;

  const { data: rows, error: reviewsError } = await db
    .from('reviews')
    .select('course_id, published_at, excluded_reason, review_answers(metric_key, value)')
    .eq('status', 'published');
  if (reviewsError) throw reviewsError;

  const byCourse = new Map<string, ReviewForScore[]>();
  for (const row of rows) {
    const review: ReviewForScore = {
      publishedAt: new Date(row.published_at!),
      excluded: row.excluded_reason !== null,
      answers: Object.fromEntries(row.review_answers.map((a) => [a.metric_key as MetricKey, a.value])),
    };
    byCourse.set(row.course_id, [...(byCourse.get(row.course_id) ?? []), review]);
  }

  const byCategory = new Map<string, ReviewForScore[]>();
  const byType = new Map<CourseType, ReviewForScore[]>();
  for (const course of courses) {
    const reviews = eligibleReviews(byCourse.get(course.id) ?? [], now);
    const type = courseTypeOf(course.categories as CategoryRef);
    byCategory.set(course.category_id, [...(byCategory.get(course.category_id) ?? []), ...reviews]);
    byType.set(type, [...(byType.get(type) ?? []), ...reviews]);
  }

  for (const course of courses) {
    const type = courseTypeOf(course.categories as CategoryRef);
    const categoryReviews = byCategory.get(course.category_id) ?? [];
    const result = computeGraduateScore({
      courseType: type,
      reviews: byCourse.get(course.id) ?? [],
      categoryPrior: metricMeans(categoryReviews),
      categoryReviewCount: categoryReviews.length,
      typePrior: metricMeans(byType.get(type) ?? []),
      now,
    });

    const row =
      result.status === 'scored'
        ? {
            course_id: course.id,
            kind: 'graduate' as const,
            status: 'scored',
            value: result.value,
            review_count: result.reviewCount,
            recommend_pct: result.recommendPct,
            per_metric: result.perMetric,
            stale: result.stale,
            method_version: result.methodVersion,
          }
        : {
            course_id: course.id,
            kind: 'graduate' as const,
            status: 'not_enough_reviews',
            value: null,
            review_count: result.reviewCount,
            reviews_needed: result.reviewsNeeded,
            method_version: result.methodVersion,
          };

    const { error } = await db.from('scores').insert(row);
    if (error) throw error;
    const shown = result.status === 'scored' ? result.value : `need ${result.reviewsNeeded} more`;
    console.log(`${course.slug}: ${result.status} ${shown} (${result.reviewCount} reviews)`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

- [ ] **Step 5: להריץ את הסקריפט**

```bash
cd web && pnpm score:recompute
```

Expected: שלוש שורות, שתי הראשונות בדיוק כך, והשלישית עם הציון שחושב:

```
full-stack-sample: scored <ציון בין 6 ל-9> (23 reviews)
ai-tools-sample: not_enough_reviews need 2 more (3 reviews)
home-cooking-sample: not_enough_reviews need 5 more (0 reviews)
```

אם `tsc` מתלונן על `per_metric` (טיפוס `Json`), מוסיפים `as unknown as Database['public']['Tables']['scores']['Insert']['per_metric']` ליד `result.perMetric`.

- [ ] **Step 6: Commit**

```bash
cd ..
git add web/.env.example web/src/lib/database.types.ts web/src/lib/supabase web/scripts
git commit -m "feat: חיבור ל-Supabase וסקריפט שמחשב ציונים"
```

---

### Task 7: פונקציות תצוגה (TDD)

**Files:**
- Create: `web/src/lib/format.ts`
- Test: `web/src/lib/format.test.ts`

- [ ] **Step 1: לכתוב את הבדיקות שנכשלות**

Create `web/src/lib/format.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { costPerHandsOnHour, formatHebrewDate, formatIls, formatPaidRange, paidRange } from './format';

describe('formatIls', () => {
  it('adds thousands separators and the shekel sign', () => {
    expect(formatIls(14900)).toBe('14,900 ₪');
  });
});

describe('paidRange', () => {
  it('needs at least three invoices', () => {
    expect(paidRange([12500, 13500])).toBeNull();
  });
  it('spans the lowest bucket to the top of the highest bucket', () => {
    expect(paidRange([13500, 12500, 14500])).toEqual({ min: 12500, max: 15000, count: 3 });
  });
});

describe('formatPaidRange', () => {
  it('writes the range with an en dash', () => {
    expect(formatPaidRange({ min: 12500, max: 15000, count: 6 })).toBe('12,500–15,000 ₪');
  });
});

describe('costPerHandsOnHour', () => {
  it('rounds the price per hands-on hour', () => {
    expect(costPerHandsOnHour(14900, 260)).toBe(57);
  });
  it('returns null when a value is missing', () => {
    expect(costPerHandsOnHour(null, 260)).toBeNull();
    expect(costPerHandsOnHour(14900, 0)).toBeNull();
  });
});

describe('formatHebrewDate', () => {
  it('writes day.month.year in Israel time', () => {
    expect(formatHebrewDate('2026-11-06T08:00:00Z')).toBe('6.11.2026');
  });
});
```

- [ ] **Step 2: להריץ ולוודא שהבדיקות נכשלות**

```bash
cd web && pnpm test
```

Expected: FAIL עם `Failed to resolve import "./format"`.

- [ ] **Step 3: לממש**

Create `web/src/lib/format.ts`:

```ts
const ilsNumber = new Intl.NumberFormat('he-IL', { maximumFractionDigits: 0 });

export function formatIls(amount: number): string {
  return `${ilsNumber.format(amount)} ₪`;
}

export interface PaidRange {
  min: number;
  max: number;
  count: number;
}

/** טווח מה ששולם בפועל. מוצג רק כשיש לפחות 3 חשבוניות, כדי שאי אפשר יהיה לזהות אף אחד. */
export function paidRange(buckets: number[]): PaidRange | null {
  if (buckets.length < 3) return null;
  return { min: Math.min(...buckets), max: Math.max(...buckets) + 500, count: buckets.length };
}

export function formatPaidRange(range: PaidRange): string {
  return `${ilsNumber.format(range.min)}–${ilsNumber.format(range.max)} ₪`;
}

export function costPerHandsOnHour(price: number | null, handsOnHours: number | null): number | null {
  if (!price || !handsOnHours) return null;
  return Math.round(price / handsOnHours);
}

export function formatHebrewDate(iso: string): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jerusalem',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${get('day')}.${get('month')}.${get('year')}`;
}
```

- [ ] **Step 4: להריץ ולוודא שהבדיקות עוברות**

```bash
pnpm test
```

Expected: `15 passed`, מתוכן 8 בדיקות ציון ו-7 בדיקות תצוגה.

- [ ] **Step 5: Commit**

```bash
cd ..
git add web/src/lib/format.ts web/src/lib/format.test.ts
git commit -m "feat: פונקציות תצוגה למחיר, טווח תשלום ותאריך"
```

---

### Task 8: טעינת הנתונים של עמוד הקורס

**Files:**
- Create: `web/src/lib/data/course-page.ts`

- [ ] **Step 1: לכתוב את הטעינה**

Create `web/src/lib/data/course-page.ts`:

```ts
import { createPublicClient } from '@/lib/supabase/public-client';
import { costPerHandsOnHour, paidRange, type PaidRange } from '@/lib/format';

export interface SyllabusItem {
  title: string;
  weak: boolean;
}

export interface MetricRow {
  key: string;
  label: string;
  mean: number;
  n: number;
}

export interface ReviewView {
  id: string;
  displayName: string;
  cohortMonth: string;
  body: string;
  followUp: string | null;
  vendorResponse: string | null;
}

export interface LecturerView {
  slug: string;
  name: string;
  role: string | null;
  /** טענה של המוסד, לא נבדקה. */
  institutionBio: string | null;
  /** רק מה שבדקנו בעצמנו, עם קישור למקור. */
  verifiedFacts: { text: string; sourceUrl: string }[];
  otherCoursesCount: number;
}

export type ScoreView =
  | { status: 'scored'; value: number; reviewCount: number; recommendPct: number | null; stale: boolean }
  | { status: 'not_enough_reviews'; reviewCount: number; reviewsNeeded: number }
  | { status: 'none' };

export interface CoursePageData {
  slug: string;
  title: string;
  institutionName: string;
  categoryName: string;
  categorySlug: string;
  region: string | null;
  formats: string[];
  sitePrice: number | null;
  totalHours: number | null;
  handsOnHours: number | null;
  durationMonths: number | null;
  schedule: string | null;
  nextCohortDate: string | null;
  syllabus: SyllabusItem[];
  lecturersNote: string | null;
  admission: string | null;
  classSizeNote: string | null;
  certificate: string | null;
  institutionPromises: string | null;
  videoUrl: string | null;
  summaryGood: string | null;
  summaryWeak: string | null;
  lecturers: LecturerView[];
  lecturersSummary: string | null;
  lastCheckedAt: string | null;
  score: ScoreView;
  metrics: MetricRow[];
  outcome: { n: number; mean: number } | null;
  paid: PaidRange | null;
  costPerHandsOnHour: number | null;
  reviews: ReviewView[];
}

const REVIEWS_ON_PAGE = 5;

export async function getCoursePage(slug: string): Promise<CoursePageData | null> {
  const db = createPublicClient();

  const { data: course, error } = await db
    .from('courses')
    .select('*, institutions(name), categories(name, slug)')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  if (!course) return null;

  const [{ data: scoreRow }, { data: metricDefs }, { data: reviewRows }, { data: lecturerRows }] = await Promise.all([
    db
      .from('scores')
      .select('*')
      .eq('course_id', course.id)
      .eq('kind', 'graduate')
      .order('computed_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    db.from('metrics').select('key, label, sort_order').order('sort_order'),
    db
      .from('reviews')
      .select('id, display_name, cohort_month, body, follow_up_text, paid_bucket_ils, published_at, vendor_responses(body)')
      .eq('course_id', course.id)
      .order('published_at', { ascending: false }),
    db
      .from('course_lecturers')
      .select('role, sort_order, lecturers(slug, name, institution_bio, verified_facts, course_lecturers(count))')
      .eq('course_id', course.id)
      .order('sort_order'),
  ]);

  const one = <T,>(ref: T | T[] | null): T | null => (Array.isArray(ref) ? (ref[0] ?? null) : ref);
  const institution = one(course.institutions as { name: string } | { name: string }[] | null);
  const category = one(course.categories as { name: string; slug: string } | { name: string; slug: string }[] | null);

  type LecturerRef = {
    slug: string;
    name: string;
    institution_bio: string | null;
    verified_facts: unknown;
    course_lecturers: { count: number }[];
  };
  const lecturers: LecturerView[] = (lecturerRows ?? [])
    .map((row) => ({ role: row.role, lecturer: one(row.lecturers as unknown as LecturerRef | LecturerRef[] | null) }))
    .filter((x): x is { role: string | null; lecturer: LecturerRef } => x.lecturer !== null)
    .map(({ role, lecturer }) => ({
      slug: lecturer.slug,
      name: lecturer.name,
      role,
      institutionBio: lecturer.institution_bio,
      verifiedFacts: ((lecturer.verified_facts ?? []) as { text: string; source_url: string }[]).map((f) => ({
        text: f.text,
        sourceUrl: f.source_url,
      })),
      // ההרשאות סופרות רק קורסים שאינם טיוטה, כולל הקורס הזה. לכן מורידים 1.
      otherCoursesCount: Math.max(0, (lecturer.course_lecturers[0]?.count ?? 1) - 1),
    }));

  let score: ScoreView = { status: 'none' };
  if (scoreRow?.status === 'scored' && scoreRow.value !== null) {
    score = {
      status: 'scored',
      value: Number(scoreRow.value),
      reviewCount: scoreRow.review_count,
      recommendPct: scoreRow.recommend_pct,
      stale: scoreRow.stale,
    };
  } else if (scoreRow?.status === 'not_enough_reviews') {
    score = {
      status: 'not_enough_reviews',
      reviewCount: scoreRow.review_count,
      reviewsNeeded: scoreRow.reviews_needed ?? 0,
    };
  }

  const perMetric = (scoreRow?.per_metric ?? {}) as Record<string, { mean: number; n: number }>;
  const metrics: MetricRow[] = (metricDefs ?? [])
    .filter((m) => m.key !== 'recommend' && perMetric[m.key])
    .map((m) => ({ key: m.key, label: m.label, mean: perMetric[m.key].mean, n: perMetric[m.key].n }));
  const outcomeResult = perMetric.outcome_3m;

  const rows = reviewRows ?? [];
  const buckets = rows.map((r) => r.paid_bucket_ils).filter((b): b is number => b !== null);

  return {
    slug: course.slug,
    title: course.title,
    institutionName: institution?.name ?? '',
    categoryName: category?.name ?? '',
    categorySlug: category?.slug ?? '',
    region: course.region,
    formats: course.formats,
    sitePrice: course.site_price_ils,
    totalHours: course.total_hours,
    handsOnHours: course.hands_on_hours,
    durationMonths: course.duration_months === null ? null : Number(course.duration_months),
    schedule: course.schedule,
    nextCohortDate: course.next_cohort_date,
    syllabus: (course.syllabus as unknown as SyllabusItem[]) ?? [],
    lecturersNote: course.lecturers_note,
    admission: course.admission,
    classSizeNote: course.class_size_note,
    certificate: course.certificate,
    institutionPromises: course.institution_promises,
    videoUrl: course.video_url,
    summaryGood: course.summary_good,
    summaryWeak: course.summary_weak,
    lecturers,
    lecturersSummary: course.lecturers_summary,
    lastCheckedAt: course.last_checked_at,
    score,
    metrics,
    outcome: outcomeResult && outcomeResult.n >= 3 ? outcomeResult : null,
    paid: paidRange(buckets),
    costPerHandsOnHour: costPerHandsOnHour(course.site_price_ils, course.hands_on_hours),
    reviews: rows.slice(0, REVIEWS_ON_PAGE).map((r) => ({
      id: r.id,
      displayName: r.display_name,
      cohortMonth: r.cohort_month,
      body: r.body,
      followUp: r.follow_up_text,
      vendorResponse: one(r.vendor_responses as { body: string } | { body: string }[] | null)?.body ?? null,
    })),
  };
}
```

- [ ] **Step 2: לוודא שהקוד מתקמפל**

```bash
cd web && pnpm exec tsc --noEmit
```

Expected: אין שגיאות. אם יש שגיאות טיפוס על `institutions` או `categories`, ה-cast שבקוד מכסה את שתי הצורות. בודקים שהשמות ב-`database.types.ts` תואמים.

- [ ] **Step 3: Commit**

```bash
cd ..
git add web/src/lib/data
git commit -m "feat: טעינת הנתונים של עמוד קורס"
```

---

### Task 9: מערכת העיצוב: גופנים, טוקנים ורכיבי סימון

**Files:**
- Modify: `web/src/app/layout.tsx`
- Modify: `web/src/app/globals.css`
- Create: `web/src/components/course/marks.tsx`
- Create: `web/src/components/course/source-legend.tsx`

- [ ] **Step 1: shadcn/ui**

```bash
cd web
pnpm dlx shadcn@latest init --defaults
pnpm dlx shadcn@latest add button
```

אם `init` בכל זאת שואל שאלות, בוחרים: סגנון ברירת המחדל, צבע בסיס `neutral`, ומשתני CSS.

Expected: נוצרו `components.json` ו-`src/components/ui/button.tsx`, ובלוק `:root` עם משתני צבע נוסף ל-`globals.css`.

- [ ] **Step 2: טוקנים בקובץ `globals.css`**

ב-`web/src/app/globals.css`:
1. מוחקים את הבלוק `.dark { ... }`. לגרסה הראשונה אין מצב כהה.
2. מחליפים את ערכי `:root` שיצר shadcn בבלוק הבא.
3. מוסיפים את בלוק `@theme` ואת הבסיס שבסופו, מתחת ל-`@import "tailwindcss";` ומתחת לשורות ה-import של shadcn.

```css
:root {
  --radius: 0.25rem;
  --background: #ffffff;
  --foreground: #1c1c1c;
  --card: #ffffff;
  --card-foreground: #1c1c1c;
  --popover: #ffffff;
  --popover-foreground: #1c1c1c;
  --primary: #1c1c1c;
  --primary-foreground: #ffffff;
  --secondary: #ffffff;
  --secondary-foreground: #1c1c1c;
  --muted: #f4f4f4;
  --muted-foreground: #555555;
  --accent: #fff27a;
  --accent-foreground: #1c1c1c;
  --destructive: #b3261e;
  --border: #dadada;
  --input: #1c1c1c;
  --ring: #2f5fe0;
}

@theme inline {
  --color-ink: #1c1c1c;
  --color-ink-soft: #555555;
  --color-rule: #dadada;
  --color-mark-verified: #9bea8a;
  --color-mark-grads: #ffea3d;
  --color-mark-weak: #ffb0d3;
  --color-claim: #2f5fe0;
  --color-note-grad: #fff27a;
  --color-note-grad-light: #fffbd0;
  --color-note-institution: #b9ddf5;
  --color-pen: #1f3fbf;
  --font-serif: var(--font-noto-serif-hebrew), serif;
  --font-sans: var(--font-assistant), sans-serif;
  --font-pen: var(--font-playpen), cursive;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-serif);
}

::selection {
  background: var(--color-mark-grads);
  color: #000000;
}
```

- [ ] **Step 3: שפה, כיוון וגופנים ב-`layout.tsx`**

Replace `web/src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import { Assistant, Noto_Serif_Hebrew, Playpen_Sans_Hebrew } from 'next/font/google';
import './globals.css';

const serif = Noto_Serif_Hebrew({
  subsets: ['hebrew', 'latin'],
  weight: ['400', '600', '700'],
  variable: '--font-noto-serif-hebrew',
});
const sans = Assistant({
  subsets: ['hebrew', 'latin'],
  weight: ['400', '600', '700'],
  variable: '--font-assistant',
});
const pen = Playpen_Sans_Hebrew({
  subsets: ['hebrew'],
  weight: ['500'],
  variable: '--font-playpen',
});

export const metadata: Metadata = {
  title: '[שם האתר]',
  description: 'השוואת קורסים עצמאית בישראל. אף מוכר לא משלם לנו.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={`${serif.variable} ${sans.variable} ${pen.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
```

אם `Playpen_Sans_Hebrew` לא קיים ב-`next/font/google` בגרסה שהותקנה (השגיאה היא `Unknown font`):
1. מוחקים את ה-import ואת `pen`.
2. מוסיפים ב-`<head>` את `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playpen+Sans+Hebrew:wght@500&display=swap" />`.
3. ב-`@theme` משנים ל-`--font-pen: 'Playpen Sans Hebrew', cursive;`.

- [ ] **Step 4: רכיבי הסימון**

Create `web/src/components/course/marks.tsx`:

```tsx
import { cn } from '@/lib/utils';

type MarkSource = 'verified' | 'grads' | 'weak';

const markColor: Record<MarkSource, string> = {
  verified: 'bg-mark-verified',
  grads: 'bg-mark-grads',
  weak: 'bg-mark-weak',
};

/** מרקר בצבע המקור: ירוק נבדק מול מסמך, צהוב בוגרים, ורוד חולשה. */
export function Mark({ source, children }: { source: MarkSource; children: React.ReactNode }) {
  return <mark className={cn('px-0.5 text-inherit', markColor[source])}>{children}</mark>;
}

/** טענה של המוסד שלא בדקנו: קו כחול מתחת לטקסט. */
export function Claim({ children }: { children: React.ReactNode }) {
  return (
    <span className="underline decoration-claim decoration-2 underline-offset-[5px]">{children}</span>
  );
}

/** הערה קצרה של האתר לקורא, בכתב יד בעט כחול. */
export function PenNote({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn('font-pen text-[15px] leading-snug text-pen -rotate-1', className)}>{children}</p>
  );
}

type NoteTone = 'grad' | 'grad-light' | 'institution';

const noteColor: Record<NoteTone, string> = {
  grad: 'bg-note-grad',
  'grad-light': 'bg-note-grad-light',
  institution: 'bg-note-institution',
};

/** פתק דביק: צהוב לקול של בוגר, כחול לקול של המוסד. */
export function StickyNote({
  tone,
  tilt = 0,
  className,
  children,
}: {
  tone: NoteTone;
  tilt?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'font-sans text-[13px] leading-snug shadow-[0_8px_12px_-6px_rgba(40,40,20,0.4)]',
        noteColor[tone],
        className,
      )}
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 5: מקרא הסימונים**

Create `web/src/components/course/source-legend.tsx`:

```tsx
import { Claim } from './marks';

export function SourceLegend() {
  return (
    <section aria-label="מקרא הסימונים" className="mt-8 font-sans text-[13px] leading-normal">
      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
        <span>
          <span className="bg-mark-verified px-1.5">ירוק</span> נבדק מול מסמך
        </span>
        <span>
          <span className="bg-mark-grads px-1.5">צהוב</span> מה שבוגרים אמרו
        </span>
        <span>
          <span className="bg-mark-weak px-1.5">ורוד</span> נקודת חולשה
        </span>
        <span>
          <Claim>קו כחול</Claim> המוסד אומר, לא נבדק
        </span>
      </div>
      <p className="mt-1 text-ink-soft">פתקים באותם צבעים: פתק צהוב הוא בוגר, פתק כחול הוא המוסד.</p>
    </section>
  );
}
```

- [ ] **Step 6: לוודא שהבנייה עוברת**

```bash
pnpm build
```

Expected: `✓ Compiled successfully`.

- [ ] **Step 7: Commit**

```bash
cd ..
git add web
git commit -m "feat: מערכת העיצוב: גופנים עבריים, טוקנים ורכיבי מרקר ופתק"
```

---

### Task 10: עמוד הקורס

**Files:**
- Create: `web/src/components/course/score-box.tsx`
- Create: `web/src/components/course/video-section.tsx`
- Create: `web/src/components/course/about-section.tsx`
- Create: `web/src/components/course/lecturers-section.tsx`
- Create: `web/src/components/course/price-section.tsx`
- Create: `web/src/components/course/grads-section.tsx`
- Create: `web/src/components/course/reviews-section.tsx`
- Create: `web/src/components/course/course-actions.tsx`
- Create: `web/src/app/courses/[slug]/page.tsx`
- Create: `web/src/app/courses/[slug]/not-found.tsx`

- [ ] **Step 1: תיבת הציון**

Create `web/src/components/course/score-box.tsx`:

```tsx
import type { ScoreView } from '@/lib/data/course-page';
import { StickyNote } from './marks';

export function ScoreBox({ score }: { score: ScoreView }) {
  return (
    <section aria-label="ציון בוגרים" className="relative mt-5 flex items-center gap-4 border-[1.5px] border-ink px-4 py-3">
      {score.status === 'scored' ? (
        <>
          <span data-testid="score-value" className="text-[52px] font-bold leading-none">
            {score.value.toFixed(1)}
          </span>
          <div className="font-sans text-sm leading-snug">
            <p className="font-bold">ציון בוגרים מתוך 10</p>
            <p>{score.reviewCount} בוגרים מאומתים</p>
            {score.recommendPct !== null && <p>{score.recommendPct}% ממליצים</p>}
            {score.stale && <p className="text-ink-soft">ייתכן שהתיישן: אין ביקורת חדשה כבר שנה</p>}
          </div>
        </>
      ) : (
        <div className="font-sans text-sm leading-snug">
          <p className="font-bold">עוד אין ציון בוגרים</p>
          {score.status === 'not_enough_reviews' && (
            <p>
              {score.reviewCount} ביקורות מאומתות. עוד {score.reviewsNeeded} ביקורות עד לציון.
            </p>
          )}
        </div>
      )}
      <StickyNote tone="grad" tilt={-4} className="absolute -bottom-6 -left-1.5 w-[118px] px-2 py-1.5">
        את הקורס עצמו עוד לא בדקנו
      </StickyNote>
    </section>
  );
}
```

- [ ] **Step 2: הסרטון**

Create `web/src/components/course/video-section.tsx`:

```tsx
import { PenNote, StickyNote } from './marks';

export function VideoSection({ url }: { url: string }) {
  return (
    <section id="video" aria-label="סרטון של המוסד" className="relative mt-7">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex aspect-video items-center justify-center bg-[#23262b] focus-visible:outline-2 focus-visible:outline-claim"
      >
        <span className="flex size-16 items-center justify-center rounded-full bg-white">
          <svg aria-hidden="true" width="22" height="24" viewBox="0 0 22 24">
            <path d="M20 12L3 22V2z" fill="#1c1c1c" />
          </svg>
        </span>
        <span className="sr-only">צפייה בסרטון של המוסד (נפתח בחלון חדש)</span>
      </a>
      <StickyNote tone="institution" tilt={3} className="absolute -top-3.5 -right-2 w-[136px] px-2 py-1.5">
        סרטון של המוסד. לא ערכנו אותו.
      </StickyNote>
      <PenNote className="mt-1">← זה שיווק. את הדעות תמצאו למטה</PenNote>
    </section>
  );
}
```

- [ ] **Step 3: על הקורס ועל המרצים**

Create `web/src/components/course/about-section.tsx`:

```tsx
import type { CoursePageData } from '@/lib/data/course-page';
import { formatHebrewDate } from '@/lib/format';
import { Claim, Mark, StickyNote } from './marks';

const formatLabels: Record<string, string> = {
  online: 'אונליין',
  in_person: 'בכיתה',
  hybrid: 'משולב',
  recorded: 'מוקלט',
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="font-sans font-bold">{label}</dt>
      <dd className="m-0">{children}</dd>
    </>
  );
}

export function AboutSection({ course }: { course: CoursePageData }) {
  const formats = course.formats.map((f) => formatLabels[f] ?? f).join(' או ');
  return (
    <section id="about" className="mt-7">
      <h2 className="inline-block border-b-2 border-ink pb-0.5 text-[21px] font-bold">על הקורס</h2>

      {course.syllabus.length > 0 && (
        <>
          <h3 className="mt-4 font-sans text-base font-bold">מה לומדים, {course.syllabus.length} פרקים</h3>
          <ol className="mt-1 list-decimal pr-6">
            {course.syllabus.map((item) => (
              <li key={item.title}>{item.weak ? <Mark source="weak">{item.title}</Mark> : item.title}</li>
            ))}
          </ol>
        </>
      )}

      <dl className="mt-4 grid grid-cols-[112px_minmax(0,1fr)] gap-x-3 gap-y-2 text-[15px] leading-relaxed">
        {course.totalHours !== null && (
          <Row label="משך">
            <Mark source="verified">
              {course.durationMonths !== null ? `${course.durationMonths} חודשים, ` : ''}
              {course.totalHours} שעות
            </Mark>
            {course.handsOnHours !== null && `, מהן ${course.handsOnHours} שעות עשייה`}
          </Row>
        )}
        {course.schedule && <Row label="מתי">{course.schedule}</Row>}
        {formats && <Row label="איך">{course.region ? `${formats}, ${course.region}` : formats}</Row>}
        {course.nextCohortDate && <Row label="המחזור הבא">{formatHebrewDate(course.nextCohortDate)}</Row>}
        {course.lecturersNote && course.lecturers.length === 0 && (
          <Row label="מרצים">
            <Claim>{course.lecturersNote}</Claim>
          </Row>
        )}
        {course.admission && <Row label="תנאי קבלה">{course.admission}</Row>}
        {course.classSizeNote && (
          <Row label="בכיתה">
            <Claim>{course.classSizeNote}</Claim>
          </Row>
        )}
        {course.certificate && <Row label="תעודה">{course.certificate}</Row>}
        {course.institutionPromises && (
          <Row label="המוסד מבטיח">
            <Claim>{course.institutionPromises}</Claim>
          </Row>
        )}
      </dl>

      {course.outcome && (
        <StickyNote tone="grad" tilt={1} className="mt-4 ml-8 px-3 py-2.5 text-sm">
          <strong>מה קרה בפועל:</strong> {course.outcome.n} בוגרים ענו 3 חודשים אחרי הסיום. ציון התוצאה:{' '}
          {course.outcome.mean.toFixed(1)} מתוך 5.
        </StickyNote>
      )}
    </section>
  );
}
```

Create `web/src/components/course/lecturers-section.tsx`:

```tsx
import type { CoursePageData } from '@/lib/data/course-page';
import { formatHebrewDate } from '@/lib/format';
import { Claim, Mark, PenNote, StickyNote } from './marks';

const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('');

const otherCoursesText = (n: number) => (n === 1 ? 'מרצה גם בקורס נוסף אחד באתר' : `מרצה גם ב-${n} קורסים נוספים באתר`);

export function LecturersSection({ course }: { course: CoursePageData }) {
  if (course.lecturers.length === 0) return null;
  return (
    <section id="lecturers" className="mt-7">
      <h2 className="inline-block border-b-2 border-ink pb-0.5 text-[21px] font-bold">על המרצים</h2>
      <p className="mt-1.5 font-sans text-[13px] text-ink-soft">
        המרצים משתנים בין מחזורים. הרשימה לפי אתר המוסד
        {course.nextCohortDate ? `, למחזור שנפתח ב-${formatHebrewDate(course.nextCohortDate)}` : ''}.
      </p>

      <div className="mt-4 flex flex-col gap-5">
        {course.lecturers.map((lecturer) => (
          <article key={lecturer.slug} className="grid grid-cols-[52px_minmax(0,1fr)] gap-x-3">
            <div
              aria-hidden="true"
              className="flex size-[52px] items-center justify-center rounded-full border-[1.5px] border-ink font-sans text-lg font-bold"
            >
              {initials(lecturer.name)}
            </div>
            <div>
              <h3 className="text-lg leading-snug font-bold">{lecturer.name}</h3>
              {lecturer.role && <p className="font-sans text-sm text-ink-soft">{lecturer.role}</p>}
              {lecturer.institutionBio && (
                <p className="mt-1.5 text-[15px] leading-relaxed">
                  <span className="font-sans font-bold">לפי המוסד:</span> <Claim>{lecturer.institutionBio}</Claim>
                </p>
              )}
              <p className="mt-1 text-[15px] leading-relaxed">
                <span className="font-sans font-bold">מה בדקנו:</span>{' '}
                {lecturer.verifiedFacts.length > 0 ? (
                  lecturer.verifiedFacts.map((fact) => (
                    <a key={fact.text} href={fact.sourceUrl} target="_blank" rel="noopener noreferrer" className="me-1">
                      <Mark source="verified">{fact.text}</Mark>
                    </a>
                  ))
                ) : (
                  <span className="text-ink-soft">לא מצאנו מידע ציבורי שאפשר לבדוק.</span>
                )}
              </p>
              {lecturer.otherCoursesCount > 0 && (
                <PenNote className="mt-0.5 text-sm">← {otherCoursesText(lecturer.otherCoursesCount)}</PenNote>
              )}
            </div>
          </article>
        ))}
      </div>

      {course.lecturersSummary && (
        <StickyNote tone="grad" tilt={-1} className="mt-5 ml-6 px-3 py-2.5 text-sm">
          <strong>מה הבוגרים אומרים על המרצים:</strong> {course.lecturersSummary}
        </StickyNote>
      )}
    </section>
  );
}
```

- [ ] **Step 4: מחיר**

Create `web/src/components/course/price-section.tsx`:

```tsx
import type { CoursePageData } from '@/lib/data/course-page';
import { formatIls, formatPaidRange } from '@/lib/format';
import { Mark, PenNote } from './marks';

export function PriceSection({ course }: { course: CoursePageData }) {
  return (
    <section id="price" className="mt-7">
      <h2 className="inline-block border-b-2 border-ink pb-0.5 text-[21px] font-bold">מחיר</h2>
      <p className="mt-2.5">
        {course.sitePrice !== null ? `${formatIls(course.sitePrice)} באתר המוסד.` : 'המוסד לא מפרסם מחיר.'}{' '}
        {course.paid && (
          <Mark source="verified">
            לפי {course.paid.count} חשבוניות, בוגרים שילמו בפועל {formatPaidRange(course.paid)}
          </Mark>
        )}
        {course.costPerHandsOnHour !== null && `, כלומר כ-${formatIls(course.costPerHandsOnHour)} לשעת עשייה.`}
      </p>
      {course.paid && <PenNote className="mt-1">← שווה לשאול על הנחה לפני שנרשמים</PenNote>}
    </section>
  );
}
```

- [ ] **Step 5: מה הבוגרים אומרים**

Create `web/src/components/course/grads-section.tsx`:

```tsx
import type { CoursePageData } from '@/lib/data/course-page';
import { Mark } from './marks';

export function GradsSection({ course }: { course: CoursePageData }) {
  if (!course.summaryGood && !course.summaryWeak && course.metrics.length === 0) return null;
  return (
    <section id="grads" className="mt-7">
      <h2 className="inline-block border-b-2 border-ink pb-0.5 text-[21px] font-bold">מה הבוגרים אומרים</h2>
      {course.summaryGood && (
        <p className="mt-2.5">
          <strong className="font-sans">טוב:</strong> <Mark source="grads">{course.summaryGood}</Mark>
        </p>
      )}
      {course.summaryWeak && (
        <p className="mt-2">
          <strong className="font-sans">חלש:</strong> <Mark source="weak">{course.summaryWeak}</Mark>
        </p>
      )}
      {course.metrics.length > 0 && (
        <table className="mt-3.5 w-full border-collapse font-sans text-[15px] tabular-nums">
          <caption className="pb-1 text-right font-bold">ציונים לפי שאלה, מתוך 5</caption>
          <tbody>
            {course.metrics.map((m) => (
              <tr key={m.key} className="border-b border-rule last:border-b-0">
                <th scope="row" className="py-1.5 text-right font-normal">
                  {m.label}
                </th>
                <td className="text-left font-bold">{m.mean.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
```

- [ ] **Step 6: ביקורות**

Create `web/src/components/course/reviews-section.tsx`:

```tsx
import type { ReviewView } from '@/lib/data/course-page';
import { StickyNote } from './marks';

const cohortLabel = (iso: string) =>
  new Intl.DateTimeFormat('he-IL', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(iso));

export function ReviewsSection({ reviews, total }: { reviews: ReviewView[]; total: number }) {
  if (reviews.length === 0) return null;
  return (
    <section id="reviews" className="mt-7">
      <h2 className="mb-3.5 inline-block border-b-2 border-ink pb-0.5 text-[21px] font-bold">ביקורות</h2>
      <div className="flex flex-col gap-6">
        {reviews.map((r, i) => (
          <div key={r.id}>
            <StickyNote
              tone="grad"
              tilt={i % 2 === 0 ? 0.6 : -0.8}
              className={`relative px-4 pt-3.5 ${r.followUp ? 'pb-8' : 'pb-3.5'}`}
            >
              <article>
                <p className="text-[13px]">
                  <strong>{r.displayName}</strong>, בוגר מאומת, מחזור {cohortLabel(r.cohortMonth)}
                </p>
                <p className="mt-1.5 font-serif text-[15px] leading-relaxed">{r.body}</p>
              </article>
              {r.followUp && (
                <StickyNote tone="grad-light" tilt={-4} className="absolute -bottom-6 left-2.5 w-[164px] px-2.5 py-1.5">
                  <strong>אחרי 3 חודשים:</strong> {r.followUp}
                </StickyNote>
              )}
            </StickyNote>
            {r.vendorResponse && (
              <StickyNote tone="institution" tilt={-1.5} className="mt-8 mr-14 px-3 py-2">
                <strong>תגובת המוסד:</strong> {r.vendorResponse}
              </StickyNote>
            )}
          </div>
        ))}
      </div>
      {total > reviews.length && (
        <p className="mt-3.5 font-sans text-[15px] font-semibold">
          <a href="#all-reviews" className="underline underline-offset-4">
            לכל {total} הביקורות
          </a>
        </p>
      )}
    </section>
  );
}
```

ניסוח מגדרי: "בוגר מאומת" הוא ברירת המחדל. הטופס בתוכנית 2 ישמור בחירה של "בוגרת" או "בוגר", ואז הטקסט יתעדכן.

- [ ] **Step 7: הכפתורים**

Create `web/src/components/course/course-actions.tsx`:

```tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';

/** כתיבת ביקורת נבנית בתוכנית 2, והשוואה בתוכנית 4. */
export function CourseActions({ slug }: { slug: string }) {
  return (
    <div className="mt-6 flex gap-2.5 font-sans">
      <Button asChild className="h-[50px] flex-1 text-base font-bold">
        <Link href={`/courses/${slug}/review`}>כתיבת ביקורת</Link>
      </Button>
      <Button asChild variant="outline" className="h-[50px] flex-1 border-[1.5px] border-ink text-base font-bold">
        <Link href={`/compare?add=${slug}`}>להשוואה (עד 3)</Link>
      </Button>
    </div>
  );
}
```

אם גרסת ה-Button שהותקנה לא תומכת ב-`asChild` (בגרסאות חדשות של shadcn המאפיין נקרא `render`), משתמשים ב-`<Link>` עם `className={buttonVariants({ variant: 'outline' })}`. את `buttonVariants` מייבאים מאותו קובץ.

- [ ] **Step 8: העמוד**

Create `web/src/app/courses/[slug]/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AboutSection } from '@/components/course/about-section';
import { CourseActions } from '@/components/course/course-actions';
import { GradsSection } from '@/components/course/grads-section';
import { LecturersSection } from '@/components/course/lecturers-section';
import { PriceSection } from '@/components/course/price-section';
import { ReviewsSection } from '@/components/course/reviews-section';
import { ScoreBox } from '@/components/course/score-box';
import { SourceLegend } from '@/components/course/source-legend';
import { VideoSection } from '@/components/course/video-section';
import { getCoursePage } from '@/lib/data/course-page';
import { formatHebrewDate } from '@/lib/format';

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCoursePage(slug);
  if (!course) return {};
  const scoreText = course.score.status === 'scored' ? ` ציון בוגרים ${course.score.value.toFixed(1)} מתוך 10.` : '';
  return {
    title: `${course.title}, ${course.institutionName} | [שם האתר]`,
    description: `מה באמת לומדים, כמה שילמו בפועל ומה אומרים בוגרים מאומתים.${scoreText}`,
  };
}

export default async function CoursePage({ params }: Props) {
  const { slug } = await params;
  const course = await getCoursePage(slug);
  if (!course) notFound();

  const reviewCount = course.score.status === 'none' ? course.reviews.length : course.score.reviewCount;

  return (
    <div className="mx-auto max-w-[680px] px-[22px] pb-12">
      <header className="flex items-center justify-between border-b border-rule pt-4 pb-3 font-sans">
        <span className="text-[19px] font-bold">[שם האתר]</span>
        <span className="text-xs text-ink-soft">אף מוכר לא משלם לנו</span>
      </header>

      <main>
        <nav aria-label="מיקום" className="mt-3.5 font-sans text-[13px] text-ink-soft">
          <a href="/courses" className="hover:underline">קורסים</a> ›{' '}
          <a href={`/categories/${course.categorySlug}`} className="hover:underline">{course.categoryName}</a>
        </nav>
        <h1 className="mt-0.5 text-[30px] leading-tight font-bold">{course.title}</h1>
        <p className="mt-1 font-sans text-[15px] text-ink-soft">
          {course.institutionName}
          {course.region ? `, ${course.region}` : ''}
        </p>
        <nav aria-label="בעמוד הזה" className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 font-sans text-[15px] font-semibold">
          {course.videoUrl && <a href="#video">סרטון</a>}
          <a href="#about">על הקורס</a>
          {course.lecturers.length > 0 && <a href="#lecturers">מרצים</a>}
          <a href="#price">מחיר</a>
          <a href="#grads">מה הבוגרים אומרים</a>
          <a href="#reviews">ביקורות ({reviewCount})</a>
        </nav>

        <ScoreBox score={course.score} />
        <SourceLegend />
        {course.videoUrl && <VideoSection url={course.videoUrl} />}
        <AboutSection course={course} />
        <LecturersSection course={course} />
        <PriceSection course={course} />
        <GradsSection course={course} />
        <ReviewsSection reviews={course.reviews} total={reviewCount} />
        <CourseActions slug={course.slug} />

        {course.lastCheckedAt && (
          <p className="mt-4 font-sans text-[13px] text-ink-soft">
            פרטי הקורס נבדקו מול אתר המוסד ב-{formatHebrewDate(course.lastCheckedAt)}.{' '}
            <a href="/method" className="underline">איך אנחנו מסכמים ומי משלם לנו</a>
          </p>
        )}
      </main>
    </div>
  );
}
```

Create `web/src/app/courses/[slug]/not-found.tsx`:

```tsx
export default function CourseNotFound() {
  return (
    <main className="mx-auto max-w-[680px] px-[22px] py-16">
      <h1 className="text-2xl font-bold">הקורס לא נמצא</h1>
      <p className="mt-2 font-sans text-ink-soft">ייתכן שהקישור שגוי, או שהקורס הוסר מהקטלוג.</p>
    </main>
  );
}
```

- [ ] **Step 9: לראות את העמוד**

```bash
cd web && pnpm dev
```

פותחים את `http://localhost:3000/courses/full-stack-sample`, ומוודאים:
- העמוד מימין לשמאל.
- יש תיבת ציון עם פתק צהוב.
- מופיע מקרא הסימונים.
- הסרטון עם פתק כחול.
- ב"על הקורס" יש מרקר ורוד על "פריסה לענן AWS", וקו כחול מתחת להבטחות.
- ב"על המרצים" יש שני מרצים עם ראשי תיבות, קו כחול על "לפי המוסד", ומרקר ירוק על "מה בדקנו" אצל יעל. אצל עומר כתוב "לא מצאנו מידע ציבורי שאפשר לבדוק". אצל יעל יש הערת עט "מרצה גם בקורס נוסף אחד באתר", ובסוף החלק פתק צהוב.
- המחיר מופיע עם מרקר ירוק.
- הביקורות מופיעות כפתקים, עם הפתק של שאלת ההמשך ועם תגובת המוסד.

משווים מול `design/canvas/Chosen.dc.html`.

- [ ] **Step 10: Commit**

```bash
cd ..
git add web/src
git commit -m "feat: עמוד קורס בעיצוב סיכום עם מרקרים ופתקים"
```

---

### Task 11: בדיקות מקצה לקצה

**Files:**
- Create: `web/playwright.config.ts`
- Test: `web/e2e/course-page.spec.ts`

- [ ] **Step 1: הגדרת Playwright**

Create `web/playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://localhost:3000' },
  projects: [{ name: 'mobile', use: { ...devices['Pixel 7'] } }],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
```

- [ ] **Step 2: לכתוב את הבדיקות**

Create `web/e2e/course-page.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('course page shows the score, the legend and every section', async ({ page }) => {
  await page.goto('/courses/full-stack-sample');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.getByRole('heading', { level: 1, name: 'פיתוח Full Stack' })).toBeVisible();
  await expect(page.getByTestId('score-value')).toHaveText(/^\d{1,2}\.\d$/);
  await expect(page.getByText('23 בוגרים מאומתים')).toBeVisible();
  await expect(page.getByText('את הקורס עצמו עוד לא בדקנו')).toBeVisible();
  await expect(page.getByLabel('מקרא הסימונים')).toBeVisible();
  for (const name of ['על הקורס', 'על המרצים', 'מחיר', 'מה הבוגרים אומרים', 'ביקורות']) {
    await expect(page.getByRole('heading', { level: 2, name })).toBeVisible();
  }
  await expect(page.getByRole('heading', { level: 3, name: 'יעל כהן' })).toBeVisible();
  await expect(page.getByText('מרצה גם בקורס נוסף אחד באתר')).toBeVisible();
  await expect(page.getByText('לא מצאנו מידע ציבורי שאפשר לבדוק.')).toBeVisible();
  await expect(page.getByText('נועה ר.')).toBeVisible();
  await expect(page.getByText('פרק הענן עודכן במחזור ספטמבר.')).toBeVisible();
  await expect(page.getByText('לכל 23 הביקורות')).toBeVisible();
});

test('a course with too few reviews says how many are missing', async ({ page }) => {
  await page.goto('/courses/ai-tools-sample');
  await expect(page.getByText('עוד 2 ביקורות עד לציון.')).toBeVisible();
  await expect(page.getByTestId('score-value')).toHaveCount(0);
});

test('an unknown course returns 404', async ({ page }) => {
  const response = await page.goto('/courses/no-such-course');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'הקורס לא נמצא' })).toBeVisible();
});
```

- [ ] **Step 3: להריץ את הבדיקות**

הנתונים צריכים לכלול ציונים מחושבים:

```bash
cd ..
pnpm db:reset
cd web && pnpm score:recompute && pnpm e2e
```

Expected: `3 passed`. אם הבדיקה הראשונה נכשלת על `getByText('23 בוגרים מאומתים')` כי הטקסט מחולק בין כמה אלמנטים, מחליפים ב-`getByText(/23 בוגרים מאומתים/)`.

- [ ] **Step 4: Commit**

```bash
cd ..
git add web/playwright.config.ts web/e2e
git commit -m "test: בדיקות מקצה לקצה לעמוד הקורס"
```

---

### Task 12: CI ב-GitHub Actions

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: ה-workflow**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
          cache-dependency-path: |
            pnpm-lock.yaml
            web/pnpm-lock.yaml

      - name: Install root tools
        run: pnpm install --frozen-lockfile

      - name: Start Supabase
        run: pnpm exec supabase start

      - name: Database tests
        run: pnpm db:test

      - name: Install web
        working-directory: web
        run: pnpm install --frozen-lockfile

      - name: Unit tests
        working-directory: web
        run: pnpm test

      - name: Write env
        working-directory: web
        run: |
          pnpm --dir .. exec supabase status -o env > /tmp/sb.env
          API_URL=$(grep '^API_URL=' /tmp/sb.env | cut -d= -f2- | tr -d '"')
          PUBLIC_KEY=$(grep -E '^(PUBLISHABLE_KEY|ANON_KEY)=' /tmp/sb.env | head -n1 | cut -d= -f2- | tr -d '"')
          SECRET_KEY=$(grep -E '^(SECRET_KEY|SERVICE_ROLE_KEY)=' /tmp/sb.env | head -n1 | cut -d= -f2- | tr -d '"')
          printf 'NEXT_PUBLIC_SUPABASE_URL=%s\nNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=%s\nSUPABASE_SECRET_KEY=%s\n' \
            "$API_URL" "$PUBLIC_KEY" "$SECRET_KEY" > .env.local

      - name: Recompute scores
        working-directory: web
        run: pnpm score:recompute

      - name: End-to-end tests
        working-directory: web
        run: |
          pnpm exec playwright install --with-deps chromium
          pnpm build
          pnpm e2e
```

`pnpm/action-setup@v4` קורא את גרסת pnpm מהשדה `packageManager` ב-`package.json`. אם השדה חסר, מוסיפים בשורש `"packageManager": "pnpm@10.17.1"` (הגרסה שמותקנת אצל גל).

- [ ] **Step 2: לדחוף ולבדוק**

```bash
git add .github package.json
git commit -m "ci: בדיקות מסד, יחידה ומקצה לקצה ב-GitHub Actions"
git push
gh run watch --exit-status
```

Expected: הריצה מסתיימת ב-`✓`. אם שלב `Write env` לא מוצא מפתח, מדפיסים את `/tmp/sb.env`, בודקים את שמות המשתנים שהגרסה מחזירה, ומתקנים את `grep`.

---

### Task 13: עדכון התיעוד

**Files:**
- Modify: `docs/STATUS.md`
- Modify: קובץ הסשן של היום ב-`docs/sessions/`

- [ ] **Step 1: לעדכן את `docs/STATUS.md`**

- תחת "איפה אנחנו": "תוכנית 1 הושלמה. עמוד קורס עובד מקומית עם נתוני דוגמה, וה-CI ירוק."
- תחת "הצעדים הבאים": "לכתוב את תוכנית 2 (ביקורות מאומתות וממשק ניהול)."

- [ ] **Step 2: Commit**

```bash
git add docs
git commit -m "docs: מצב הפרויקט אחרי תוכנית 1"
git push
```

---

## מה תוכנית 1 לא כוללת (בכוונה)

- **ההגדרות של Supabase בענן ושל Vercel:** בתוכנית 5. הן דורשות אישור של גל, כי פתיחת פרויקט ב-Supabase עשויה לעלות כסף.
- **עמוד הביקורת ועמוד ההשוואה:** בתוכניות 2 ו-4. הכפתורים בעמוד הקורס כבר מקשרים אליהם, ועד אז הקישורים מחזירים 404.
- **עמוד נפרד לכל מרצה** (`/lecturers/[slug]`, עם כל הקורסים שלו והממוצע של הבוגרים שלו): בתוכנית 4. בעמוד הקורס יש כבר חלק "על המרצים" מלא.
- **"מה קרה בפועל" בפירוט** (כמה עובדים בתחום, כמה קיבלו קידום): דורש שאלון המשך מובנה, ונבנה בתוכנית 2. בינתיים מוצג ציון התוצאה.
