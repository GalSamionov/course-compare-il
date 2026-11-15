import { cacheLife, cacheTag } from 'next/cache';
import { createPublicClient } from '@/lib/supabase/public-client';
import { one, queryError, verifiedFactsOf, type VerifiedFact } from './shared';

export interface LecturerPageData {
  slug: string;
  name: string;
  /** טענה של המוסד, לא נבדקה. */
  institutionBio: string | null;
  /** רק מה שבדקנו בעצמנו, עם קישור למקור. */
  verifiedFacts: VerifiedFact[];
  /** הקורסים שהוא מלמד, והתפקיד בכל אחד. הפרטים של כל קורס מ-getCoursePage. */
  courses: { slug: string; role: string | null }[];
}

/** עמוד המרצה, מהמטמון. כמו עמוד המוסד: לשעות, ו-catalog מרענן אותו. אין ציון למרצה (החלטה של גל, 15.11.2026). */
export async function getLecturerPage(slug: string): Promise<LecturerPageData | null> {
  'use cache';
  cacheLife('hours');
  cacheTag(`lecturer:${slug}`, 'catalog');
  return loadLecturerPage(slug);
}

/** המרצים לבנייה מראש. ההרשאות במסד מחזירות רק מרצים שיש להם קורס שאינו טיוטה. */
export async function getLecturerSlugs(): Promise<string[]> {
  const { data, error } = await createPublicClient().from('lecturers').select('slug').order('slug');
  if (error) throw queryError('lecturer slugs', error);
  return data.map((row) => row.slug);
}

type CourseLink = { role: string | null; courses: { slug: string } | { slug: string }[] | null };

/** הטעינה עצמה, בלי מטמון. מרצה בלי קורס שאינו טיוטה מחזיר null, ולכן 404. */
export async function loadLecturerPage(slug: string): Promise<LecturerPageData | null> {
  const { data, error } = await createPublicClient()
    .from('lecturers')
    .select('slug, name, institution_bio, verified_facts, course_lecturers(role, courses(slug))')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw queryError('lecturer', error);
  if (!data) return null;
  // ההרשאות במסד מחזירות רק שורות של קורסים שאינם טיוטה.
  const courses = ((data.course_lecturers ?? []) as unknown as CourseLink[]).flatMap((row) => {
    const course = one(row.courses);
    return course ? [{ slug: course.slug, role: row.role }] : [];
  });
  if (courses.length === 0) return null;
  return {
    slug: data.slug,
    name: data.name,
    institutionBio: data.institution_bio,
    verifiedFacts: verifiedFactsOf(data.verified_facts),
    courses,
  };
}
