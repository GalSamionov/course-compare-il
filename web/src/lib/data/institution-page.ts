import { cacheLife, cacheTag } from 'next/cache';
import { safeHttpUrl } from '@/lib/safe-url';
import { createPublicClient } from '@/lib/supabase/public-client';
import { one, queryError } from './shared';

/** הסוגים שבמסד (institutions.kind). */
export type InstitutionKind = 'college' | 'school' | 'independent' | 'university' | 'other';

const KINDS: readonly InstitutionKind[] = ['college', 'school', 'independent', 'university', 'other'];
const isKind = (value: string): value is InstitutionKind => (KINDS as readonly string[]).includes(value);

/** מה כתוב ליד השם. "עסק עצמאי" ולא "מרצה עצמאי": אין לנו מין דקדוקי של המוסד. */
export const INSTITUTION_KIND_LABEL: Record<InstitutionKind, string> = {
  college: 'מכללה',
  school: 'בית ספר',
  university: 'אוניברסיטה',
  independent: 'עסק עצמאי',
  other: 'מוסד לימודים',
};

export interface InstitutionPageData {
  slug: string;
  name: string;
  kind: InstitutionKind;
  /** רק כתובת http או https תקינה (safeHttpUrl). */
  website: string | null;
  /** הקורסים שאינם טיוטה, גם מה שכבר לא מוצע. הפרטים של כל אחד מ-getCoursePage, מהמטמון של עמוד הקורס. */
  courseSlugs: string[];
}

/**
 * עמוד המוסד, מהמטמון של Next. נשמר לשעות. catalog: אישור של ביקורת או של קורס כבר מרענן את התגית הזו.
 * אין כאן ציון למוסד (החלטה של גל, 15.11.2026): רק הרשימה, והציון של כל קורס מגיע מעמוד הקורס.
 */
export async function getInstitutionPage(slug: string): Promise<InstitutionPageData | null> {
  'use cache';
  cacheLife('hours');
  cacheTag(`institution:${slug}`, 'catalog');
  return loadInstitutionPage(slug);
}

/** המוסדות שיש להם קורס שאינו טיוטה, לבנייה מראש. שאילתה שנכשלה זורקת שגיאה, כדי שהבנייה תיכשל ולא תדלג בשקט. */
export async function getInstitutionSlugs(): Promise<string[]> {
  const { data, error } = await createPublicClient().from('courses').select('institutions(slug)').neq('status', 'draft');
  if (error) throw queryError('institution slugs', error);
  const slugs = data.flatMap((row) => {
    const institution = one(row.institutions as { slug: string } | { slug: string }[] | null);
    return institution ? [institution.slug] : [];
  });
  return [...new Set(slugs)].sort();
}

/** הטעינה עצמה, בלי מטמון. מוסד בלי אף קורס שאינו טיוטה מחזיר null, ולכן 404: לא מפרסמים עמוד ריק. */
export async function loadInstitutionPage(slug: string): Promise<InstitutionPageData | null> {
  const db = createPublicClient();
  const { data: institution, error } = await db
    .from('institutions')
    .select('id, slug, name, website, kind')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw queryError('institution', error);
  if (!institution) return null;

  const { data: courses, error: coursesError } = await db
    .from('courses')
    .select('slug')
    .eq('institution_id', institution.id)
    .neq('status', 'draft')
    .order('slug');
  if (coursesError) throw queryError('institution courses', coursesError);
  if (courses.length === 0) return null;

  return {
    slug: institution.slug,
    name: institution.name,
    kind: isKind(institution.kind) ? institution.kind : 'other',
    website: safeHttpUrl(institution.website),
    courseSlugs: courses.map((course) => course.slug),
  };
}
