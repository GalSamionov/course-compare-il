import 'server-only';
import type { CourseType } from '@/lib/reviews/types';
import type { AdminDb } from './gate';

/** קורס באתר שאולי זה הוא: אותו קישור, אותו שם, או עוד קורס של אותו מוסד. */
export interface LinkCandidate {
  courseId: string;
  slug: string;
  title: string;
  institution: string;
  why: 'url' | 'title' | 'institution';
}

/**
 * פריט בתור "קורסים מקישורים" (course_link_queue): קורס טיוטה שבוגרים הוסיפו ב-/review, או בקשה מ-/request-course.
 * הקישור והשמות הם מה שאנשים כתבו. רק לגל.
 */
export interface CourseLinkItem {
  id: number;
  source: 'review' | 'request';
  createdAt: string;
  url: string;
  isSocial: boolean;
  /** הקישור כבר בדפים של האוסף. */
  knownPage: boolean;
  courseId: string | null;
  courseTitle: string;
  institutionId: string | null;
  institutionName: string | null;
  institutionKind: string | null;
  /** מרצה שנוצר מהקישור, עוד בטיוטה. */
  institutionIsNew: boolean;
  categoryId: string | null;
  categoryName: string | null;
  courseType: CourseType | null;
  note: string | null;
  /** כמה בוגרים הוסיפו את אותו קורס. */
  submitters: number;
  /** הביקורות על הטיוטה, לפי מצב. */
  reviews: Partial<Record<'draft' | 'pending' | 'published' | 'disputed' | 'removed', number>>;
  candidates: LinkCandidate[];
  /** בבקשה: מוסד שהאתר שלו באותו מארח. */
  suggestedInstitutionId: string | null;
}

export interface LinkChoices {
  institutions: { id: string; name: string }[];
  categories: { id: string; name: string; courseType: CourseType }[];
}

export const COURSE_LINKS_PAGE = 30;

const COURSE_TYPES: readonly CourseType[] = ['career', 'hobby', 'exam'];
const asType = (value: unknown): CourseType | null =>
  typeof value === 'string' && (COURSE_TYPES as readonly string[]).includes(value) ? (value as CourseType) : null;

function candidatesOf(value: unknown): LinkCandidate[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((raw) => {
    const c = raw as Record<string, unknown>;
    if (typeof c.course_id !== 'string' || typeof c.slug !== 'string' || typeof c.title !== 'string') return [];
    const why = c.why === 'url' || c.why === 'title' ? c.why : 'institution';
    return [{ courseId: c.course_id, slug: c.slug, title: c.title, institution: String(c.institution ?? ''), why }];
  });
}

/** הפריטים הממתינים, הישן ראשון, ומה שצריך לטפסים: המוסדות הפעילים והתחומים. */
export async function loadCourseLinks(db: AdminDb): Promise<{ items: CourseLinkItem[]; total: number } & LinkChoices> {
  const [queueRes, institutionsRes, categoriesRes] = await Promise.all([
    db.rpc('course_link_queue', { p_limit: COURSE_LINKS_PAGE }),
    db.from('institutions').select('id, name').eq('status', 'active').order('name'),
    // רק תחומים פעילים: תחום שיצא משימוש (replaced_by, למשל ai) לא מקבל קורסים חדשים.
    db.from('categories').select('id, name, course_type').filter('replaced_by', 'eq', '{}').order('name'),
  ]);
  if (queueRes.error) throw new Error(`course links: ${queueRes.error.message}`);
  if (institutionsRes.error) throw new Error(`institutions: ${institutionsRes.error.message}`);
  if (categoriesRes.error) throw new Error(`categories: ${categoriesRes.error.message}`);

  const rows = queueRes.data ?? [];
  return {
    total: rows[0]?.total ?? 0,
    institutions: institutionsRes.data,
    categories: categoriesRes.data.map((c) => ({ id: c.id, name: c.name, courseType: c.course_type })),
    items: rows.map((r) => ({
      id: r.id,
      source: r.source === 'review' ? 'review' : 'request',
      createdAt: r.created_at,
      url: r.url,
      isSocial: r.is_social,
      knownPage: r.known_page,
      courseId: r.course_id ?? null,
      courseTitle: r.course_title ?? '',
      institutionId: r.institution_id ?? null,
      institutionName: r.institution_name ?? null,
      institutionKind: r.institution_kind ?? null,
      institutionIsNew: r.institution_is_new === true,
      categoryId: r.category_id ?? null,
      categoryName: r.category_name ?? null,
      courseType: asType(r.course_type),
      note: r.note ?? null,
      submitters: r.submitters,
      reviews: (r.reviews ?? {}) as CourseLinkItem['reviews'],
      candidates: candidatesOf(r.candidates),
      suggestedInstitutionId: r.suggested_institution_id ?? null,
    })),
  };
}
