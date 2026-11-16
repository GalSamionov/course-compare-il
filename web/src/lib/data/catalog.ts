import { cacheLife, cacheTag } from 'next/cache';
import type { MetricKey } from '@/lib/score/types';
import {
  COURSE_FORMATS,
  TIME_SLOTS,
  isProductType,
  type Catalog,
  type CategoryEntry,
  type CourseFormat,
  type CourseSummary,
  type RowScore,
  type TimeSlot,
} from '@/lib/search/types';
import { highlightFor } from '@/lib/search/why';
import { createPublicClient } from '@/lib/supabase/public-client';
import { one, queryError } from './shared';

/**
 * הקטלוג מהמטמון של Next. נשמר לשעה, ו-revalidateTag('catalog') מרענן אותו לפני הזמן.
 * עם cacheComponents אין `export const revalidate`, ולכן המטמון מוגדר כאן.
 * מספיק לכמה מאות קורסים. מעבר לזה צריך עימוד (ראו notes-for-plan-2.md).
 */
export async function getCatalog(): Promise<Catalog> {
  'use cache';
  cacheLife('hours');
  cacheTag('catalog');
  return loadCatalog();
}

const isTimeSlot = (value: string): value is TimeSlot => (TIME_SLOTS as readonly string[]).includes(value);
const isFormat = (value: string): value is CourseFormat => (COURSE_FORMATS as readonly string[]).includes(value);

type PerMetric = Partial<Record<MetricKey, { mean: number; n: number }>>;

/** הטעינה עצמה, בלי מטמון. סקריפטים מחוץ ל-Next קוראים לה ישירות. */
export async function loadCatalog(): Promise<Catalog> {
  const db = createPublicClient();
  const [categoriesRes, coursesRes, reviewsRes] = await Promise.all([
    db.from('categories').select('id, slug, name, parent_id, course_type').order('name'),
    // הציון האחרון של כל קורס מגיע באותה שאילתה: סינון, מיון והגבלה על הטבלה המקושרת.
    // קורס שהוסר (removed) לא מופיע ברשימות. העמוד שלו נשאר.
    db
      .from('courses')
      .select(
        'id, slug, title, category_id, site_price_ils, formats, time_slots, product_type, updated_at, institutions(name), scores(status, value, reviews_needed, per_metric)',
      )
      .in('status', ['active', 'maybe_inactive'])
      .eq('scores.kind', 'graduate')
      .order('computed_at', { referencedTable: 'scores', ascending: false })
      .order('id', { referencedTable: 'scores', ascending: false })
      .limit(1, { referencedTable: 'scores' })
      .order('slug'),
    // הספירה המוטמעת reviews(count) נדחית בהרשאות (42501), ולכן ספירה נפרדת: רק course_id של ביקורות שפורסמו.
    db.from('reviews').select('course_id').eq('status', 'published').limit(10_000),
  ]);
  if (categoriesRes.error) throw queryError('categories', categoriesRes.error);
  if (coursesRes.error) throw queryError('catalog courses', coursesRes.error);
  if (reviewsRes.error) throw queryError('review counts', reviewsRes.error);

  const reviewCounts = new Map<string, number>();
  for (const { course_id } of reviewsRes.data) reviewCounts.set(course_id, (reviewCounts.get(course_id) ?? 0) + 1);

  const categoryRows = categoriesRes.data;
  const byId = new Map(categoryRows.map((c) => [c.id, c]));

  const courses: CourseSummary[] = coursesRes.data.flatMap((row) => {
    // רק טיוטה יכולה להיות בלי תחום (courses_category_unless_draft), וכאן אין טיוטות.
    const category = row.category_id ? byId.get(row.category_id) : undefined;
    if (!category) return [];
    const parent = category.parent_id ? byId.get(category.parent_id) : undefined;
    const latest = row.scores[0];

    let score: RowScore = { status: 'none' };
    if (latest?.status === 'scored' && latest.value !== null) {
      score = { status: 'scored', value: Number(latest.value) };
    } else if (latest?.status === 'not_enough_reviews') {
      score = { status: 'not_enough_reviews', reviewsNeeded: latest.reviews_needed ?? 0 };
    }
    // הממוצעים לפי שאלה נשמרים רק עם ציון. highlightFor בודק שכל ערך הוא מספר.
    const perMetric = (score.status === 'scored' ? latest?.per_metric : null) as unknown as PerMetric | null;

    return [
      {
        id: row.id,
        slug: row.slug,
        title: row.title,
        institutionName: one(row.institutions as { name: string } | { name: string }[] | null)?.name ?? '',
        categorySlug: category.slug,
        categoryName: category.name,
        categoryParentSlug: parent?.slug ?? null,
        courseType: category.course_type,
        productType: isProductType(row.product_type) ? row.product_type : 'course',
        score,
        verifiedCount: reviewCounts.get(row.id) ?? 0,
        sitePrice: row.site_price_ils,
        formats: row.formats.filter(isFormat),
        timeSlots: row.time_slots.filter(isTimeSlot),
        updatedAt: row.updated_at,
        highlight: highlightFor(category.course_type, perMetric ?? {}),
      },
    ];
  });

  const parentIds = new Set(categoryRows.flatMap((c) => (c.parent_id ? [c.parent_id] : [])));
  const categories: CategoryEntry[] = categoryRows.map((c) => {
    const inside = courses.filter((course) => course.categorySlug === c.slug || course.categoryParentSlug === c.slug);
    return {
      slug: c.slug,
      name: c.name,
      parentSlug: c.parent_id ? (byId.get(c.parent_id)?.slug ?? null) : null,
      isLeaf: !parentIds.has(c.id),
      courseCount: inside.length,
      gradCount: inside.reduce((sum, course) => sum + course.verifiedCount, 0),
    };
  });

  return { categories, courses };
}
