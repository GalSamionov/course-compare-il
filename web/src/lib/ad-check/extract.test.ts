import { describe, expect, it } from 'vitest';
import { decodeEntities, extractPageText, MAX_PAGE_CHARS } from './extract';

/** דף נחיתה מומצא, לדוגמה בלבד. אין כזה קורס. */
const SAMPLE = `<!doctype html>
<html lang="he" dir="rtl">
<head>
  <meta charset="utf-8">
  <title>קורס לדוגמה &amp; עוד | אקדמיה לדוגמה</title>
  <meta name="description" content="קורס דוגמה של 8 שבועות, בזום.">
  <meta property="og:title" content="קורס לדוגמה &amp; עוד | אקדמיה לדוגמה">
  <meta property="og:description" content='תעודה בינלאומית בסיום'>
  <style>.hero { color: red }</style>
  <script>window.secret = "לא להציג";</script>
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"Course","name":"קורס לדוגמה","url":"https://example.com/x","offers":{"@type":"Offer","price":2990,"priceCurrency":"ILS"}}</script>
</head>
<body>
  <!-- <p>הערה שלא מוצגת</p> -->
  <header><nav><a href="/">בית</a></nav></header>
  <h1>להרוויח&nbsp;5 ספרות בחודש</h1>
  <p>בלי ניסיון קודם, <b>תוך 30 יום</b>.</p>
  <ul><li>מספר המקומות מוגבל</li><li>מספר המקומות מוגבל</li></ul>
  <noscript>צריך JavaScript</noscript>
  <svg><text>טקסט של ציור</text></svg>
  <p>&#1513;&#x5DC;&#1493;&#1501; &quot;חם&quot;</p>
</body>
</html>`;

describe('extractPageText', () => {
  const { title, text } = extractPageText(SAMPLE);
  const lines = text.split('\n');

  it('takes the title, meta description and og tags first, without repeating the title', () => {
    expect(title).toBe('קורס לדוגמה & עוד | אקדמיה לדוגמה');
    expect(lines[0]).toBe(title);
    expect(lines).toContain('קורס דוגמה של 8 שבועות, בזום.');
    expect(lines).toContain('תעודה בינלאומית בסיום');
    expect(lines.filter((l) => l === title)).toHaveLength(1);
  });

  it('keeps text values from JSON-LD, without @ keys and URLs', () => {
    expect(lines).toContain('קורס לדוגמה');
    expect(lines).toContain('2990');
    expect(lines).toContain('ILS');
    expect(text).not.toContain('schema.org');
    expect(text).not.toContain('https://example.com/x');
  });

  it('keeps visible text, one line per block, and drops script, style, noscript, svg and comments', () => {
    expect(lines).toContain('להרוויח 5 ספרות בחודש');
    expect(lines).toContain('בלי ניסיון קודם, תוך 30 יום .');
    expect(text).not.toContain('secret');
    expect(text).not.toContain('color: red');
    expect(text).not.toContain('צריך JavaScript');
    expect(text).not.toContain('טקסט של ציור');
    expect(text).not.toContain('הערה שלא מוצגת');
  });

  it('does not repeat the same line twice in a row', () => {
    expect(lines.filter((l) => l === 'מספר המקומות מוגבל')).toHaveLength(1);
  });

  it('decodes numeric and named entities', () => {
    expect(lines).toContain('שלום "חם"');
  });

  it(`cuts the text at ${MAX_PAGE_CHARS} characters`, () => {
    const long = `<p>${'א'.repeat(MAX_PAGE_CHARS + 5000)}</p>`;
    expect(extractPageText(long).text.length).toBe(MAX_PAGE_CHARS);
  });

  it('survives broken JSON-LD and an empty page', () => {
    expect(extractPageText('<script type="application/ld+json">{oops</script><p>טקסט</p>').text).toBe('טקסט');
    expect(extractPageText('').text).toBe('');
  });
});

describe('decodeEntities', () => {
  it('leaves unknown names and broken numbers alone or empty', () => {
    expect(decodeEntities('&unknown; &#0; &#xD800; &shy;')).toBe('&unknown;   ');
  });
});
