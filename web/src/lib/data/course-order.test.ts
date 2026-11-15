import { describe, expect, it } from 'vitest';
import { sampleCourse } from '@/lib/advisor/sample-course';
import { compareByScore } from './course-order';
import type { CoursePageData } from './course-page';

const scored = (title: string, value: number, status: CoursePageData['status'] = 'active') =>
  sampleCourse({ title, status, score: { status: 'scored', value, reviewCount: 6, recommendPct: null, stale: false } });
const unscored = (title: string, reviews: number) =>
  sampleCourse({
    title,
    reviewTotal: reviews,
    score: { status: 'not_enough_reviews', reviewCount: reviews, reviewsNeeded: 5 - reviews },
  });

describe('compareByScore', () => {
  it('puts scored courses first, highest first, then the ones closest to a score, and removed ones last', () => {
    const list = [unscored('ג', 0), scored('ב', 7.1), scored('א', 9.5, 'removed'), scored('ד', 9), unscored('ה', 3)];
    expect(list.sort(compareByScore).map((c) => c.title)).toEqual(['ד', 'ב', 'ה', 'ג', 'א']);
  });

  it('breaks a tie by the title', () => {
    expect([scored('ב', 8), scored('א', 8)].sort(compareByScore).map((c) => c.title)).toEqual(['א', 'ב']);
  });
});
