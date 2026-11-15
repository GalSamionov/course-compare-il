import { describe, expect, it } from 'vitest';
import { getGuides, parseGuide, sectionLabel, textOf } from './guides';

/** ה-slug של כל קישור פנימי בגוף המדריך (/guides/<slug>). */
function internalGuideLinks(nodes: readonly unknown[]): string[] {
  return nodes.flatMap((node) => {
    const n = node as { type?: string; url?: string; children?: unknown[] };
    const own = n.type === 'link' && n.url?.startsWith('/guides/') ? [n.url.slice('/guides/'.length)] : [];
    return [...own, ...internalGuideLinks(n.children ?? [])];
  });
}

describe('content/guides', () => {
  const guides = getGuides();

  it('קורא את ארבעת המדריכים לפי הסדר, וכל עובדה ירוקה מגיעה עם מקור מהרשימה', () => {
    expect(guides.map((g) => g.order)).toEqual([1, 2, 3, 4]);
    // 109 עובדות ירוקות, כמו ביומן הכתיבה (docs/sessions/2026-11-14-guides-before-paying.md).
    expect(guides.reduce((sum, g) => sum + g.refs.length, 0)).toBe(109);
    for (const g of guides) {
      expect(g.sections.length, g.slug).toBeGreaterThan(3);
      for (const s of g.sources) {
        expect(s.url, `${g.slug}/${s.id}`).toMatch(/^https:\/\//);
        expect(s.checked, `${g.slug}/${s.id}`).toMatch(/^\d{1,2}\.\d{1,2}\.\d{4}$/);
      }
    }
  });

  it('כל קישור בין מדריכים מוביל למדריך שקיים', () => {
    const slugs = new Set(guides.map((g) => g.slug));
    for (const g of guides) {
      const links = [g.intro, ...g.sections.map((s) => s.nodes)].flatMap(internalGuideLinks);
      expect(links.length, g.slug).toBeGreaterThan(0);
      for (const slug of [...links, ...g.related]) expect(slugs.has(slug), `${g.slug} → ${slug}`).toBe(true);
    }
  });
});

describe('parseGuide', () => {
  const frontmatter = `---\nslug: x\norder: 1\ntitle: כותרת\nseo_title: כותרת\ndescription: תיאור\nchecked: 2026-11-14\nnext_review: 2027-02-14\nlegal_review: none\n---\n`;
  const sources = '\n## מקורות\n\n- `law` · חוק לדוגמה, סעיף 1. [קישור](https://example.org). נבדק ב-14.11.2026.\n';

  it('עוצר על מקור שלא ברשימה', () => {
    const md = `${frontmatter}\n## פרק\n\n:verified[עובדה.]{src=missing}\n${sources}`;
    expect(() => parseGuide('test.md', md)).toThrow(/missing/);
  });

  it('עוצר על סימון לא מוכר', () => {
    const md = `${frontmatter}\n## פרק\n\n:marker[טקסט]\n${sources}`;
    expect(() => parseGuide('test.md', md)).toThrow(/marker/);
  });

  it('שם המקור, הקישור, התאריך והסעיפים שמצוטטים', () => {
    const md = `${frontmatter}\nפתיחה.\n\n## פרק\n\n:verified[עובדה.]{src=law sec="17ד"} :site[הערה.]\n${sources}`;
    const guide = parseGuide('test.md', md);
    expect(textOf(guide.intro)).toBe('פתיחה.');
    expect(guide.sources[0]).toMatchObject({
      id: 'law',
      n: 1,
      title: 'חוק לדוגמה, סעיף 1',
      url: 'https://example.org',
      checked: '14.11.2026',
      cited: ['17ד'],
    });
    expect(guide.refs).toHaveLength(1);
  });

  it('קורא סעיף כמו שהוא נכתב', () => {
    expect(sectionLabel('17ד')).toBe('סעיף 17ד');
    expect(sectionLabel('8, 15(א)')).toBe('סעיפים 8, 15(א)');
    expect(sectionLabel("עמ' 26")).toBe("עמ' 26");
  });
});

describe('cards.json', () => {
  it('תואם למדריכים. אם לא: pnpm guides:cards', async () => {
    const { guideCards } = await import('./cards');
    const saved = (await import('./cards.json')).default;
    expect(saved).toEqual(guideCards());
  });
});
