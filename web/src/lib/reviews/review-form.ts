import { cacheLife, cacheTag } from 'next/cache';
import { one, queryError } from '@/lib/data/shared';
import { createPublicClient } from '@/lib/supabase/public-client';
import { questionsFor, type MetricDef, type Question } from './steps';
import type { CourseType } from './types';

export interface ReviewFormData {
  courseId: string;
  slug: string;
  title: string;
  institutionName: string;
  courseType: CourseType;
  /** השאלות לפי סוג הקורס, בלי "אחרי 3 חודשים". */
  questions: Question[];
  /** איפה הכתיבה, כדי לחזור אליה אחרי ההתחברות. בלי: /courses/<slug>/review. קורס מקישור: /review/new?course=<id>. */
  writePath?: string;
}

/**
 * הקורס והשאלון לעמוד הכתיבה. באותו מטמון ובאותה תגית של עמוד הקורס, כך ש-revalidateTag('course:<slug>')
 * מרענן גם אותו. קורס טיוטה לא קיים בשביל הציבור, ומחזיר null.
 */
export async function getReviewForm(slug: string): Promise<ReviewFormData | null> {
  'use cache';
  cacheLife('hours');
  cacheTag(`course:${slug}`);
  return loadReviewForm(slug);
}

/**
 * השאלות של כל הסוגים, לעמוד הכתיבה של קורס מקישור (/review/new): הקורס עצמו טיוטה, ונטען בדפדפן,
 * אבל השאלות ציבוריות וקבועות. מהמטמון, לשעות.
 */
export async function getReviewMetrics(): Promise<MetricDef[]> {
  'use cache';
  cacheLife('hours');
  const { data, error } = await createPublicClient()
    .from('metrics')
    .select('key, label, scale, course_types, sort_order')
    .order('sort_order');
  if (error) throw queryError('review metrics', error);
  return data as MetricDef[];
}

async function loadReviewForm(slug: string): Promise<ReviewFormData | null> {
  const db = createPublicClient();
  const [courseRes, metricsRes] = await Promise.all([
    db.from('courses').select('id, slug, title, institutions(name), categories(course_type)').eq('slug', slug).maybeSingle(),
    db.from('metrics').select('key, label, scale, course_types, sort_order').order('sort_order'),
  ]);
  if (courseRes.error) throw queryError('review form course', courseRes.error);
  if (metricsRes.error) throw queryError('review form metrics', metricsRes.error);
  const course = courseRes.data;
  if (!course) return null;
  const institution = one(course.institutions as { name: string } | { name: string }[] | null);
  const category = one(course.categories as { course_type: CourseType } | { course_type: CourseType }[] | null);
  if (!category) return null;
  return {
    courseId: course.id,
    slug: course.slug,
    title: course.title,
    institutionName: institution?.name ?? '',
    courseType: category.course_type,
    questions: questionsFor(category.course_type, metricsRes.data as MetricDef[]),
  };
}
