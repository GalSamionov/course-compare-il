import { createClient } from '@supabase/supabase-js';
import { computeGraduateScore, eligibleReviews, metricMeans } from '../src/lib/score/compute';
import type { CourseType, MetricKey, ReviewForScore } from '../src/lib/score/types';
import type { Database, Json } from '../src/lib/database.types';

type ScoreInsert = Database['public']['Tables']['scores']['Insert'];

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY');
const db = createClient<Database>(url, secret, { auth: { persistSession: false } });

const PAGE = 1000;

/** PostgREST חותך select ב-1000 שורות בלי להתריע, לכן קוראים בעמודים עד שעמוד חוזר חלקי. */
async function fetchAll<T>(
  build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const all: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build(from, from + PAGE - 1);
    if (error) throw error;
    const page = data ?? [];
    all.push(...page);
    if (page.length < PAGE) return all;
  }
}

async function main() {
  // תמונת מצב אחת לכל הריצה: גם חלון הזמן וגם computed_at, כדי שריצה איטית וישנה לא תנצח ריצה חדשה.
  const now = new Date();
  const computedAt = now.toISOString();
  console.log(`target: ${new URL(url!).host}`);

  const courses = await fetchAll((from, to) =>
    db
      .from('courses')
      .select('id, slug, category_id, categories(course_type)')
      .neq('status', 'draft')
      .order('id')
      .range(from, to),
  );

  const rows = await fetchAll((from, to) =>
    db
      .from('reviews')
      .select('id, course_id, published_at, excluded_reason, review_answers(metric_key, value)')
      .eq('status', 'published')
      .order('id')
      .range(from, to),
  );

  const byCourse = new Map<string, ReviewForScore[]>();
  for (const row of rows) {
    // reviews check constraint: published_at לא null כשהסטטוס published.
    if (row.published_at === null) throw new Error(`review ${row.id} is published without published_at`);
    const review: ReviewForScore = {
      publishedAt: new Date(row.published_at),
      excluded: row.excluded_reason !== null,
      answers: Object.fromEntries(row.review_answers.map((a) => [a.metric_key as MetricKey, a.value])),
    };
    const list = byCourse.get(row.course_id);
    if (list) list.push(review);
    else byCourse.set(row.course_id, [review]);
  }

  // סוג הקורס מחושב פעם אחת. קורס בלי קטגוריה לא עוצר את הריצה, רק נרשם ככשל.
  let failed = 0;
  const typeOf = new Map<string, CourseType>();
  const byCategory = new Map<string, ReviewForScore[]>();
  const byType = new Map<CourseType, ReviewForScore[]>();
  for (const course of courses) {
    const ref = course.categories as { course_type: CourseType } | { course_type: CourseType }[] | null;
    const category = Array.isArray(ref) ? ref[0] : ref;
    if (!category) {
      failed += 1;
      console.error(`${course.slug}: failed`, new Error(`course ${course.slug} has no category`));
      continue;
    }
    typeOf.set(course.id, category.course_type);
    const reviews = eligibleReviews(byCourse.get(course.id) ?? [], now);
    byCategory.set(course.category_id, [...(byCategory.get(course.category_id) ?? []), ...reviews]);
    byType.set(category.course_type, [...(byType.get(category.course_type) ?? []), ...reviews]);
  }
  const categoryMeans = new Map([...byCategory].map(([id, r]) => [id, metricMeans(r)]));
  const typeMeans = new Map([...byType].map(([t, r]) => [t, metricMeans(r)]));

  for (const course of courses) {
    // קורס אחד עם נתונים שבורים לא עוצר את הריצה: רושמים שגיאה וממשיכים לשאר הקורסים.
    try {
      const type = typeOf.get(course.id);
      if (!type) continue; // כבר נרשם ככשל למעלה
      const categoryReviews = byCategory.get(course.category_id) ?? [];
      const result = computeGraduateScore({
        courseType: type,
        reviews: byCourse.get(course.id) ?? [],
        categoryPrior: categoryMeans.get(course.category_id)!,
        categoryReviewCount: categoryReviews.length,
        typePrior: typeMeans.get(type)!,
        now,
      });

      const row: ScoreInsert =
        result.status === 'scored'
          ? {
              course_id: course.id,
              computed_at: computedAt,
              kind: 'graduate',
              status: 'scored',
              value: result.value,
              review_count: result.reviewCount,
              recommend_pct: result.recommendPct,
              per_metric: result.perMetric as unknown as NonNullable<Json>,
              explanation: { priorSource: result.priorSource, breakdown: result.breakdown } as unknown as NonNullable<Json>,
              stale: result.stale,
              method_version: result.methodVersion,
            }
          : {
              course_id: course.id,
              computed_at: computedAt,
              kind: 'graduate',
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
    } catch (error) {
      failed += 1;
      console.error(`${course.slug}: failed`, error);
    }
  }

  if (failed > 0) {
    console.error(`${failed} course(s) failed`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
