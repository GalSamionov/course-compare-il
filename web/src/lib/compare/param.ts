import { MAX_COMPARE } from '@/lib/account/lists';

/** הפרמטר בכתובת: /compare?c=full-stack-sample,baking-sample */
export const COMPARE_PARAM = 'c';

/** אותו כלל כמו האילוץ על courses.slug במסד. */
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * הקורסים מקישור: לפי הסדר, בלי רווחים, באותיות קטנות, בלי כפילויות, ועד 3.
 * כל מה שאינו slug נזרק, כך שקישור שגוי לא שובר את העמוד.
 */
export function parseCompareParam(value: string | null): string[] {
  if (!value) return [];
  const slugs = value
    .split(',')
    .map((part) => part.trim().toLowerCase())
    .filter((part) => SLUG.test(part));
  return [...new Set(slugs)].slice(0, MAX_COMPARE);
}

/** קישור להשוואה. גם בלי קורסים נשאר `?c=`, כדי שהעמוד יישאר במצב קישור ולא יעבור למגש. */
export function compareHref(slugs: readonly string[]): string {
  return `/compare?${COMPARE_PARAM}=${slugs.join(',')}`;
}

/**
 * הקורסים להשוואה, לפי הסדר של הקישור או של המגש. missing: מה שלא נמצא בקטלוג,
 * כי הוסר מהאתר או כי הקישור שגוי.
 */
export function pickCompared<T extends { id: string; slug: string }>(
  courses: readonly T[],
  ref: { slugs: readonly string[] } | { ids: readonly string[] },
): { chosen: T[]; missing: string[] } {
  const bySlug = 'slugs' in ref;
  const keys = bySlug ? ref.slugs : ref.ids;
  const chosen: T[] = [];
  const missing: string[] = [];
  for (const key of keys) {
    const course = courses.find((c) => (bySlug ? c.slug : c.id) === key);
    if (course) chosen.push(course);
    else missing.push(key);
  }
  return { chosen, missing };
}

/** "נשארו 2 מקומות": בעמוד ההשוואה ובמגש באזור האישי. */
export function slotsLeftText(taken: number): string {
  const left = Math.max(0, MAX_COMPARE - taken);
  if (left === 0) return 'ההשוואה מלאה';
  if (left === 1) return 'נשאר מקום אחד';
  return `נשארו ${left} מקומות`;
}
