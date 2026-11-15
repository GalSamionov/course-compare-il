import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { List, PhrasingContent, Root, RootContent } from 'mdast';
import type { TextDirective } from 'mdast-util-directive';
import remarkDirective from 'remark-directive';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { parse as parseYaml } from 'yaml';

/**
 * מדריכי "לפני שמשלמים": נכתבים ונבדקים כקובצי Markdown ב-content/guides (הפורמט ב-README.md שם),
 * והעמודים נבנים מהם בזמן הבנייה. קריאה סינכרונית מהדיסק, כי היא מסתיימת בתוך ה-prerender
 * ונכנסת לעמוד הסטטי (docs של Next 16, Caching: "Predictable values").
 *
 * כל תקלה בתוכן (סימון לא מוכר, מקור שלא ברשימה, מדריך קשור שלא קיים) עוצרת את הבנייה,
 * כדי שעובדה ירוקה לא תעלה לאוויר בלי המקור שלה.
 */

declare module 'mdast' {
  interface Data {
    /** המספר של עובדה ירוקה בתוך המדריך, לפי סדר ההופעה. המקור שלה ב-Guide.refs באותו מספר. */
    guideRef?: number;
  }
}

/** התיקייה של המדריכים, מחוץ ל-web. process.cwd() הוא web גם ב-next build וגם ב-vitest. */
export const GUIDES_DIR = join(process.cwd(), 'content', 'guides');

/** קובץ מדריך: מספר סידורי ושם, כמו 02-questions-before-signing-up.md. README ו-LEGAL-AND-UPDATES הם לא עמודים. */
const GUIDE_FILE = /^\d{2}-[a-z0-9-]+\.md$/;

/** שלושת הסימונים שמותרים בגוף המדריך. */
export type GuideMarkName = 'verified' | 'institution' | 'site';
const MARK_NAMES: ReadonlySet<string> = new Set<GuideMarkName>(['verified', 'institution', 'site']);

export interface GuideSource {
  id: string;
  /** המספר של המקור בעמוד, לפי הסדר ברשימת המקורות. */
  n: number;
  title: string;
  url: string;
  /** מתי המקור נבדק, כמו שכתוב בשורה ("14.11.2026"). */
  checked: string | null;
  /** הסעיפים או העמודים שהמדריך מצטט מהמקור, לפי סדר ההופעה. */
  cited: string[];
}

/** עובדה ירוקה אחת: מאיזה מקור היא באה, ומאיזה סעיף. */
export interface GuideRef {
  index: number;
  sources: GuideSource[];
  sec: string | null;
}

export interface GuideSection {
  id: string;
  title: string;
  nodes: RootContent[];
}

export interface Guide {
  slug: string;
  order: number;
  title: string;
  seoTitle: string;
  description: string;
  /** מתי כל המקורות נבדקו, ISO (YYYY-MM-DD). */
  checked: string;
  /** מתי בודקים שוב, ISO. */
  nextReview: string;
  /** עורך דין צריך לעבור על המדריך לפני ההשקה. */
  legalReview: boolean;
  related: string[];
  /** פסקאות הפתיחה, לפני הפרק הראשון. */
  intro: RootContent[];
  sections: GuideSection[];
  sources: GuideSource[];
  refs: GuideRef[];
}

/** המקורות הם הפרק האחרון בכל קובץ, ולא פרק בעמוד. */
const SOURCES_HEADING = 'מקורות';

export function textOf(nodes: readonly (RootContent | PhrasingContent)[]): string {
  return nodes
    .map((node) => {
      if ('value' in node && typeof node.value === 'string' && node.type !== 'yaml') return node.value;
      if ('children' in node) return textOf(node.children as RootContent[]);
      return '';
    })
    .join('');
}

function fail(file: string, message: string): never {
  throw new Error(`content/guides/${file}: ${message}`);
}

function requireString(file: string, data: Record<string, unknown>, key: string): string {
  const value = data[key];
  if (typeof value !== 'string' || value.trim() === '') fail(file, `חסר השדה "${key}" ב-frontmatter`);
  return value.trim();
}

function requireIsoDate(file: string, data: Record<string, unknown>, key: string): string {
  const value = requireString(file, data, key);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) fail(file, `"${key}" צריך להיות תאריך YYYY-MM-DD`);
  return value;
}

/** שורה ברשימת המקורות: `id` · שם המקור. [קישור](url). נבדק ב-14.11.2026. */
function parseSourceList(file: string, list: List, startAt: number): GuideSource[] {
  return list.children.map((item, i) => {
    const paragraph = item.children[0];
    if (paragraph?.type !== 'paragraph') fail(file, `שורה ${i + 1} ברשימת המקורות ריקה`);
    const [code, ...rest] = paragraph.children;
    if (code?.type !== 'inlineCode') fail(file, `שורה ${i + 1} ברשימת המקורות לא מתחילה במזהה ב-backticks`);
    const linkAt = rest.findIndex((n) => n.type === 'link');
    const link = rest[linkAt];
    if (!link || link.type !== 'link') fail(file, `למקור "${code.value}" אין קישור`);
    const title = textOf(rest.slice(0, linkAt))
      .replace(/^\s*·\s*/, '')
      .replace(/[\s.]+$/, '')
      .trim();
    if (!title) fail(file, `למקור "${code.value}" אין שם`);
    const checked = textOf(rest.slice(linkAt + 1)).match(/נבדק ב-(\d{1,2}\.\d{1,2}\.\d{4})/)?.[1] ?? null;
    return { id: code.value, n: startAt + i, title, url: link.url, checked, cited: [] };
  });
}

/** עובר על כל הסימונים בגוף המדריך: בודק שהם מוכרים, וממספר את העובדות הירוקות לפי סדר ההופעה. */
function collectRefs(file: string, nodes: RootContent[], sources: Map<string, GuideSource>, refs: GuideRef[]) {
  const visit = (node: RootContent | PhrasingContent) => {
    if (node.type === 'leafDirective' || node.type === 'containerDirective') {
      fail(file, `הסימון "${node.name}" צריך להיות בתוך שורה (:${node.name}[...])`);
    }
    if (node.type === 'textDirective') {
      if (!MARK_NAMES.has(node.name)) fail(file, `סימון לא מוכר: :${node.name}`);
      if (node.name === 'verified') addRef(file, node, sources, refs);
    }
    if ('children' in node) (node.children as RootContent[]).forEach(visit);
  };
  nodes.forEach(visit);
}

function addRef(file: string, node: TextDirective, sources: Map<string, GuideSource>, refs: GuideRef[]) {
  const ids = (node.attributes?.src ?? '').split(/\s+/).filter(Boolean);
  if (ids.length === 0) fail(file, `עובדה ירוקה בלי src: "${textOf(node.children).slice(0, 40)}"`);
  const found = ids.map((id) => sources.get(id) ?? fail(file, `המקור "${id}" לא ברשימת המקורות`));
  const sec = node.attributes?.sec?.trim() || null;
  // הסעיף שייך למקור הראשון: הוא הנוסח הרשמי, ושאר המקורות מסבירים אותו.
  if (sec && !found[0].cited.includes(sec)) found[0].cited.push(sec);
  const index = refs.length;
  node.data = { ...node.data, guideRef: index };
  refs.push({ index, sources: found, sec });
}

const processor = unified().use(remarkParse).use(remarkFrontmatter, ['yaml']).use(remarkGfm).use(remarkDirective);

export function parseGuide(file: string, markdown: string): Guide {
  const root = processor.runSync(processor.parse(markdown)) as Root;
  const [yaml, ...body] = root.children;
  if (yaml?.type !== 'yaml') fail(file, 'חסר frontmatter בראש הקובץ');
  const data = (parseYaml(yaml.value) ?? {}) as Record<string, unknown>;

  const intro: RootContent[] = [];
  const sections: GuideSection[] = [];
  let sourceLists: List[] | null = null;
  for (const node of body) {
    if (node.type === 'heading' && node.depth === 2) {
      const title = textOf(node.children).trim();
      if (title === SOURCES_HEADING) {
        sourceLists = [];
        continue;
      }
      if (sourceLists) fail(file, `"${title}" אחרי המקורות: המקורות הם הפרק האחרון`);
      sections.push({ id: `part-${sections.length + 1}`, title, nodes: [] });
      continue;
    }
    if (sourceLists) {
      if (node.type === 'list') sourceLists.push(node);
      continue;
    }
    (sections.at(-1)?.nodes ?? intro).push(node);
  }
  if (!sourceLists || sourceLists.length === 0) fail(file, `חסר "## ${SOURCES_HEADING}" עם רשימה בסוף הקובץ`);

  const sources: GuideSource[] = [];
  for (const list of sourceLists) sources.push(...parseSourceList(file, list, sources.length + 1));
  const byId = new Map(sources.map((s) => [s.id, s]));
  if (byId.size !== sources.length) fail(file, 'אותו מזהה מופיע פעמיים ברשימת המקורות');

  const refs: GuideRef[] = [];
  collectRefs(file, intro, byId, refs);
  sections.forEach((s) => collectRefs(file, s.nodes, byId, refs));

  const related = data.related;
  return {
    slug: requireString(file, data, 'slug'),
    order: Number(data.order) || fail(file, 'חסר השדה "order"'),
    title: requireString(file, data, 'title'),
    seoTitle: requireString(file, data, 'seo_title'),
    description: requireString(file, data, 'description'),
    checked: requireIsoDate(file, data, 'checked'),
    nextReview: requireIsoDate(file, data, 'next_review'),
    legalReview: data.legal_review === 'required',
    related: Array.isArray(related) ? related.map(String) : [],
    intro,
    sections,
    sources,
    refs,
  };
}

function loadAll(): Guide[] {
  const files = readdirSync(GUIDES_DIR).filter((f) => GUIDE_FILE.test(f));
  const guides = files
    .map((file) => parseGuide(file, readFileSync(join(GUIDES_DIR, file), 'utf8')))
    .sort((a, b) => a.order - b.order);
  const slugs = new Set(guides.map((g) => g.slug));
  for (const g of guides) {
    for (const r of g.related) if (!slugs.has(r)) throw new Error(`המדריך "${g.slug}" מקשר למדריך שלא קיים: "${r}"`);
  }
  return guides;
}

let cache: Guide[] | null = null;

/** כל המדריכים, לפי הסדר בסדרה. בפיתוח נקרא מחדש בכל פעם, כדי ששינוי בתוכן יופיע מיד. */
export function getGuides(): Guide[] {
  if (process.env.NODE_ENV === 'development') return loadAll();
  cache ??= loadAll();
  return cache;
}

export function getGuide(slug: string): Guide | null {
  return getGuides().find((g) => g.slug === slug) ?? null;
}

/** "2026-11-14" ל-"14.11.2026", כמו התאריכים בשאר האתר. בלי Date, כדי שאזור הזמן לא יזיז את היום. */
export function formatGuideDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d}.${m}.${y}`;
}

/** הסעיף כמו שהוא נקרא: "סעיף 17ד", "סעיפים 8, 15(א)", ובלי תוספת כשכתוב כבר "עמ'" או "תוספת". */
export function sectionLabel(sec: string): string {
  if (!/^\d/.test(sec)) return sec;
  return sec.includes(',') ? `סעיפים ${sec}` : `סעיף ${sec}`;
}

/** שם קצר למקור, לקורא מסך: עד הפסיק או הסוגריים הראשונים. */
export function shortSourceName(title: string): string {
  return title.split(/[,(]/)[0].trim();
}
