import { createClient } from '@supabase/supabase-js';
import { computeGraduateScore, eligibleReviews, metricMeans } from '../src/lib/score/compute';
import type { CourseType, MetricKey, ReviewForScore } from '../src/lib/score/types';
import type { Database, Json } from '../src/lib/database.types';

type ScoreInsert = Database['public']['Tables']['scores']['Insert'];

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

  let failed = 0;
  for (const course of courses) {
    // קורס אחד עם נתונים שבורים לא עוצר את הריצה: רושמים שגיאה וממשיכים לשאר הקורסים.
    try {
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

      const row: ScoreInsert =
        result.status === 'scored'
          ? {
              course_id: course.id,
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
