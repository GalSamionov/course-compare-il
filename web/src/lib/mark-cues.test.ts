import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { cueSvg, type CueSource } from './mark-cues';

/** אותו קידוד כמו ב-globals.css: מירכאות בודדות, ו-<, > ו-# מקודדים. */
function cssUrl(svg: string): string {
  return `url("data:image/svg+xml,${svg.replace(/"/g, "'").replace(/</g, '%3C').replace(/>/g, '%3E').replace(/#/g, '%23')}")`;
}

const css = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8');
const SOURCES: CueSource[] = ['verified', 'grads', 'weak'];

describe('הסימנים בעט בתחילת מרקר המקור', () => {
  it.each(SOURCES)('העותק ב-globals.css של %s זהה לציור ב-mark-cues.ts', (source) => {
    expect(css).toContain(`--cue-${source}: ${cssUrl(cueSvg(source, '#000'))};`);
  });

  it('לכל מקור יש סימן אחר', () => {
    const svgs = SOURCES.map((source) => cueSvg(source, '#000'));
    expect(new Set(svgs).size).toBe(SOURCES.length);
  });

  it('הצבע שמבקשים נכנס לציור, כדי שתמונות השיתוף יצוירו בעט', () => {
    for (const source of SOURCES) expect(cueSvg(source, '#1F3FBF')).toContain('#1F3FBF');
  });
});
