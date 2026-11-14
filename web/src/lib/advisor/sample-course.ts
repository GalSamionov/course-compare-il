import type { CoursePageData } from '@/lib/data/course-page';

/**
 * קורס לדוגמה לבדיקות היועץ, בצורה ש-getCoursePage מחזיר. כל המספרים לדוגמה.
 * overrides: מה שהבדיקה רוצה לשנות.
 */
export function sampleCourse(overrides: Partial<CoursePageData> = {}): CoursePageData {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    slug: 'baking-sample',
    title: 'אפייה ביתית: לחמים ועוגות',
    status: 'active',
    institutionName: 'סדנה לדוגמה',
    categoryName: 'בישול ואפייה',
    categorySlug: 'cooking',
    region: 'תל אביב',
    formats: ['in_person'],
    sitePrice: 1200,
    totalHours: 24,
    handsOnHours: 18,
    durationMonths: 2,
    schedule: 'שישי 9:00–13:00',
    nextCohortDate: '2026-12-04',
    syllabus: [
      { title: 'בצק שמרים', weak: false },
      { title: 'מחמצת', weak: true },
    ],
    lecturersNote: null,
    admission: null,
    classSizeNote: 'עד 12 משתתפים',
    certificate: null,
    institutionPromises: 'כל משתתף יוצא עם מחמצת משלו',
    videoUrl: null,
    summaryGood: 'הרבה עבודה בידיים',
    summaryWeak: 'המחמצת קצרה מדי',
    lecturers: [],
    lecturersSummary: null,
    lastCheckedAt: null,
    score: { status: 'scored', value: 8.4, reviewCount: 6, recommendPct: 83, stale: false },
    metrics: [{ key: 'hands_on', label: 'עבודה מעשית', mean: 4.5, n: 6 }],
    outcome: null,
    paid: { min: 2000, max: 4000, count: 5 },
    costPerHandsOnHour: 67,
    reviews: [
      {
        id: 'r1',
        displayName: 'נועה ר.',
        cohortMonth: '2026-03-01',
        body: 'למדתי לאפות לחם כל שבוע.',
        followUp: null,
        vendorResponse: null,
      },
    ],
    reviewTotal: 6,
    ...overrides,
  };
}
