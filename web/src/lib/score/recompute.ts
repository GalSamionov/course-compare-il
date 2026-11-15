import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '../database.types';
import { computeGraduateScore, eligibleReviews, metricMeans } from './compute';
import type { CourseType, MetricKey, ReviewForScore } from './types';

type ScoreInsert = Database['public']['Tables']['scores']['Insert'];

/** חיבור עם המפתח הסודי: כתיבה ל-scores מותרת רק לו. */
export type ScoreDb = SupabaseClient<Database>;

export interface RecomputeResult {
  /** שורה לכל קורס שחושב, כמו "full-stack-sample: scored 7.9 (23 reviews)". */
  lines: string[];
  /** הכתובות של הקורסים שהציון שלהם נשמר. מי שמחשב מרענן את כולם (סבב 5, פריט 36). */
  slugs: string[];
  failures: { slug: string; error: unknown }[];
}

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

/**
 * מחשב מחדש את ציון הבוגרים של כל הקורסים שאינם טיוטה, וכל ציון נשמר כשורה חדשה ב-scores.
 * הכול, ולא רק קורס אחד: ממוצע התחום והסוג משותף, ולכן ביקורת אחת שאושרה או נמחקה מזיזה גם קורסים אחרים.
 * משותף לסקריפט `pnpm score:recompute` ולשרת (אישור בתור, מחיקה בידי הכותב).
 * now: תמונת מצב אחת לכל הריצה, גם לחלון הזמן וגם ל-computed_at, כדי שריצה איטית וישנה לא תנצח ריצה חדשה.
 * קורס אחד עם נתונים שבורים לא עוצר את הריצה: הוא נרשם ב-failures, והשאר ממשיכים.
 */
export async function recomputeAllScores(db: ScoreDb, now: Date = new Date()): Promise<RecomputeResult> {
  const computedAt = now.toISOString();
  const lines: string[] = [];
  const slugs: string[] = [];
  const failures: RecomputeResult['failures'] = [];

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
  const typeOf = new Map<string, CourseType>();
  const byCategory = new Map<string, ReviewForScore[]>();
  const byType = new Map<CourseType, ReviewForScore[]>();
  for (const course of courses) {
    const ref = course.categories as { course_type: CourseType } | { course_type: CourseType }[] | null;
    const category = Array.isArray(ref) ? ref[0] : ref;
    if (!category) {
      failures.push({ slug: course.slug, error: new Error(`course ${course.slug} has no category`) });
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
      lines.push(`${course.slug}: ${result.status} ${shown} (${result.reviewCount} reviews)`);
      slugs.push(course.slug);
    } catch (error) {
      failures.push({ slug: course.slug, error });
    }
  }

  return { lines, slugs, failures };
}
