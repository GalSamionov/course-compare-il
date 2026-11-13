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
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  parent_id uuid references categories(id),
  course_type course_type not null,
  created_at timestamptz not null default now(),
  check (parent_id is null or parent_id <> id)
);
create index categories_parent_idx on categories (parent_id);

create table institutions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  website text,
  kind text not null check (kind in ('college', 'school', 'independent', 'university', 'other')),
  business_number text,
  created_at timestamptz not null default now()
);

create table courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  institution_id uuid not null references institutions(id),
  category_id uuid not null references categories(id),
  title text not null,
  status course_status not null default 'draft',
  check_tier check_tier not null default 'listed',
  site_price_ils integer check (site_price_ils between 50 and 100000),
  total_hours integer check (total_hours between 1 and 3000),
  lecture_hours integer check (lecture_hours >= 0),
  hands_on_hours integer check (hands_on_hours >= 0),
  duration_months numeric(4, 1) check (duration_months > 0),
  schedule text,
  formats text[] not null default '{}',
  region text,
  next_cohort_date date,
  syllabus jsonb not null default '[]'::jsonb check (jsonb_typeof(syllabus) = 'array'),
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
language plpgsql
set search_path = ''
as $$
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
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  institution_bio text,
  verified_facts jsonb not null default '[]'::jsonb check (jsonb_typeof(verified_facts) = 'array'),
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
  author_id uuid references auth.users(id) on delete set null,
  cohort_month date not null check (cohort_month = date_trunc('month', cohort_month)::date),
  body text not null check (char_length(body) between 80 and 2000),
  display_name text not null,
  display_mode display_name_mode not null default 'first_initial',
  status review_status not null default 'draft',
  proof_kind proof_kind,
  paid_bucket_ils integer check (paid_bucket_ils >= 0 and paid_bucket_ils % 500 = 0),
  verified_at timestamptz,
  published_at timestamptz,
  follow_up_text text,
  excluded_reason text,
  created_at timestamptz not null default now(),
  -- ביקורת מתפרסמת רק אחרי אימות.
  check (status <> 'published' or (verified_at is not null and published_at is not null and proof_kind is not null))
);
create unique index reviews_one_per_cohort
  on reviews (author_id, course_id, cohort_month) where author_id is not null;
create index reviews_course_published_idx
  on reviews (course_id, published_at desc) where status = 'published';

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
create unique index vendor_responses_review_idx on vendor_responses (review_id);

create table method_changes (
  id bigint generated always as identity primary key,
  version text not null unique,
  summary text not null,
  reason text not null,
  changed_at timestamptz not null default now()
);

create table scores (
  id bigint generated always as identity primary key,
  course_id uuid not null references courses(id),
  kind score_kind not null,
  status text not null check (status in ('scored', 'not_enough_reviews')),
  value numeric(3, 1) check (value between 0 and 10),
  review_count integer not null check (review_count >= 0),
  reviews_needed integer check (reviews_needed >= 0),
  recommend_pct integer check (recommend_pct between 0 and 100),
  per_metric jsonb not null default '{}'::jsonb,
  stale boolean not null default false,
  method_version text not null references method_changes(version),
  computed_at timestamptz not null default now(),
  expires_at timestamptz,
  check ((status = 'scored') = (value is not null))
);
create index scores_course_latest_idx on scores (course_id, kind, computed_at desc, id desc);
