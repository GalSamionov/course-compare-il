import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import type { CSSProperties, ReactNode } from 'react';
import type { CoursePageData } from '@/lib/data/course-page';
import { formatIls, invoiceCountText, paidRangeSentence } from '@/lib/format';
import { rtlTokens } from '@/lib/og/bidi';
import { neededText, reviewsText, verifiedText } from '@/lib/og/share-text';
import { SAMPLE_DATA, SITE_NAME } from '@/lib/site';

/**
 * תמונת השיתוף (og:image), 1200×630: אותו עולם כמו האתר. דף מודפס לבן על משטח לבד אפור,
 * תפס משרדי, סלוטייפ, חותמת של המוסד, מרקר ירוק למה שנבדק מול חשבוניות, ועט כחול לקול של האתר.
 *
 * Satori (next/og) מצייר משמאל לימין ובלי אלגוריתם הכיווניות. לכן כל טקסט עובר דרך <Rtl>:
 * היחידות מ-rtlTokens מונחות בשורה מימין לשמאל (row-reverse), וכל שורה בעיצוב בנויה ככה.
 *
 * הגופנים: IBM Plex Sans Hebrew ו-Playpen Sans Hebrew, אותם גופנים של האתר מ-Google Fonts
 * (רישיון OFL). Satori לא קורא woff2 ולא גופנים משתנים, ולכן בתיקייה fonts יש עותקים סטטיים ב-TTF,
 * במשקלים שהתמונה צריכה, רק עם עברית ולטינית.
 */

export const OG_SIZE = { width: 1200, height: 630 };

const INK = '#1c1c1c';
const INK_SOFT = '#555555';
const RULE = '#dadada';
const PEN = '#1f3fbf';
const DESK = '#e9ebee';
const MARK_VERIFIED = '#9bea8a';
const MARK_GRADS = '#ffea3d';
const MARK_WEAK = '#ffb0d3';
const CLAIM = '#2f5fe0';

/** הקבצים נקראים פעם אחת לכל תהליך. נתיב מילולי לכל קובץ, כדי שהבנייה תארוז אותם עם הפונקציה. */
type OgFonts = NonNullable<NonNullable<ConstructorParameters<typeof ImageResponse>[1]>['fonts']>;
let fontsPromise: Promise<OgFonts> | null = null;
function loadFonts() {
  fontsPromise ??= Promise.all([
    readFile(join(process.cwd(), 'src/app/_og/fonts/ibm-plex-sans-hebrew-400.ttf')),
    readFile(join(process.cwd(), 'src/app/_og/fonts/ibm-plex-sans-hebrew-700.ttf')),
    readFile(join(process.cwd(), 'src/app/_og/fonts/playpen-sans-hebrew-500.ttf')),
  ]).then(([print400, print700, pen500]): OgFonts => [
    { name: 'IBM Plex Sans Hebrew', data: print400, weight: 400, style: 'normal' },
    { name: 'IBM Plex Sans Hebrew', data: print700, weight: 700, style: 'normal' },
    { name: 'Playpen Sans Hebrew', data: pen500, weight: 500, style: 'normal' },
  ]);
  return fontsPromise;
}

const svgUri = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

/** סלוטייפ עם קצוות קרועים (globals.css, --tape). */
const TAPE = svgUri(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 24" preserveAspectRatio="none"><path fill="#E6E9ED" fill-opacity=".86" d="M2.2 1.2L78 0.6 76.6 3.4 78.6 6 76.9 8.9 78.8 12.2 76.7 15 78.5 18.4 76.8 21 78.2 23.6 1.6 23.2 3.3 20.6 1.2 17.5 3.1 14.6 1.1 11.4 3.2 8.6 1.4 5.4 3.4 3.2Z"/><path fill="#fff" fill-opacity=".35" d="M4 3.4L76 2.9 76 7.2 4 7.6Z"/></svg>`,
);

/** משיכת מרקר עם קצוות משופעים, כמו .hl באתר. */
const marker = (color: string) =>
  svgUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 20" preserveAspectRatio="none"><path fill="${color}" d="M5.6 3.4C40 2.7 74 3.3 110 2.6S172 2.1 196.4 2.5C198.2 6 197.6 11.2 195.2 17.4 160 17.9 122 17.1 86 17.7S26 17.4 2.2 17.9C1.4 13.4 2.6 8.2 5.6 3.4Z"/></svg>`,
  );

/** קו העט מתחת לכותרות (globals.css, --pen-rule). */
const PEN_RULE = svgUri(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 12" preserveAspectRatio="none"><path fill="${PEN}" d="M198.4 3.6C160 5.6 112 6.8 60 6.6 38 6.5 18 6.1 3.4 5.2 1.6 5.1 1.1 7.3 2.8 7.6 18 9.2 40 9.7 62 9.6 114 9.4 162 8.4 198.8 6.4 200.8 6.3 200.5 3.5 198.4 3.6Z"/></svg>`,
);

/** מסגרת בקו אחד עם פינות קעורות, כמו תווית שם האתר (globals.css, --label-frame). */
function labelFrame(w: number, h: number): string {
  const frame = (inset: number, r: number, stroke: number) => {
    const a = inset;
    const b = w - inset;
    const c = h - inset;
    return `<path fill="none" stroke="${INK}" stroke-width="${stroke}" d="M${a + r} ${a}H${b - r}A${r} ${r} 0 0 0 ${b} ${a + r}V${c - r}A${r} ${r} 0 0 0 ${b - r} ${c}H${a + r}A${r} ${r} 0 0 0 ${a} ${c - r}V${a + r}A${r} ${r} 0 0 0 ${a + r} ${a}Z"/>`;
  };
  return svgUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${frame(2, 11, 2.8)}</svg>`,
  );
}

/**
 * שורה עברית: היחידות מ-rtlTokens, מימין לשמאל, עם שבירת שורה שמתחילה מימין.
 * align: איפה השורות נצמדות. ברירת המחדל: לימין, כמו טקסט עברי.
 */
function Rtl({
  text,
  size,
  style,
  align = 'right',
}: {
  text: string;
  size: number;
  style?: CSSProperties;
  align?: 'right' | 'center';
}) {
  const tokens = rtlTokens(text);
  const gap = Math.round(size * 0.27);
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row-reverse',
        flexWrap: 'wrap',
        justifyContent: align === 'center' ? 'center' : 'flex-start',
        fontSize: size,
        ...style,
      }}
    >
      {tokens.map((token, i) => (
        <span key={i} style={{ whiteSpace: 'pre', marginLeft: i === tokens.length - 1 ? 0 : gap }}>
          {token}
        </span>
      ))}
    </div>
  );
}

/** מרקר בצבע המקור מאחורי שורה אחת. */
function Marked({ text, size, color, style }: { text: string; size: number; color: string; style?: CSSProperties }) {
  return (
    <div
      style={{
        display: 'flex',
        padding: `${Math.round(size * 0.08)}px ${Math.round(size * 0.36)}px`,
        backgroundImage: `url(${marker(color)})`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        ...style,
      }}
    >
      <Rtl text={text} size={size} style={{ flexWrap: 'nowrap' }} />
    </div>
  );
}

/**
 * שם האתר בתווית, כמו בראש כל עמוד (components/site/wordmark.tsx): התווית מודפסת בדיו, והשם כתוב בה בעט כחול.
 * באתר העט של השם במשקל 600. כאן יש רק עותק של 500, ולכן קו מתאר דק באותו צבע מעבה אותו לאותו משקל.
 */
function Wordmark() {
  const size = 46;
  const w = Math.round(Array.from(SITE_NAME).length * size * 0.62) + 64;
  const h = 76;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: w,
        height: h,
        backgroundImage: `url(${labelFrame(w, h)})`,
        backgroundSize: '100% 100%',
        fontFamily: 'Playpen Sans Hebrew',
        fontWeight: 500,
        color: PEN,
      }}
    >
      <Rtl
        text={SITE_NAME}
        size={size}
        style={{ marginTop: -2, transform: 'rotate(-1deg)', WebkitTextStroke: `0.9px ${PEN}` }}
      />
    </div>
  );
}

/** הכותרת של הדף: שם האתר מימין, ומשמאל ההבטחה שאף מוכר לא משלם לנו. */
function SheetHeader() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 18,
        borderBottom: `2px solid ${RULE}`,
      }}
    >
      <Wordmark />
      <Rtl text="אף מוכר לא משלם לנו" size={30} style={{ fontWeight: 700, color: INK }} />
    </div>
  );
}

/** פס סלוטייפ, אפשר עם כיתוב עליו. */
function Tape({ width, height = 34, rotate, style, children }: { width: number; height?: number; rotate: number; style?: CSSProperties; children?: ReactNode }) {
  return (
    <div
      style={{
        position: 'absolute',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width,
        height,
        backgroundImage: `url(${TAPE})`,
        backgroundSize: '100% 100%',
        transform: `rotate(${rotate}deg)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** הדף על השולחן: הלבד, הדף שמתחת, הדף עצמו והתפס. */
function Desk({ children, sample }: { children: ReactNode; sample: boolean }) {
  return (
    <div
      dir="ltr"
      style={{
        position: 'relative',
        display: 'flex',
        width: OG_SIZE.width,
        height: OG_SIZE.height,
        backgroundColor: DESK,
        fontFamily: 'IBM Plex Sans Hebrew',
        color: INK,
      }}
    >
      {/* הדף שמתחת, מהערימה */}
      <div
        style={{
          position: 'absolute',
          left: 58,
          top: 50,
          width: 1100,
          height: 552,
          backgroundColor: '#f6f7f9',
          transform: 'rotate(0.9deg)',
          boxShadow: '0 1px 1px rgba(30,36,44,0.08), 0 16px 30px -18px rgba(30,36,44,0.25)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 46,
          top: 40,
          width: 1108,
          height: 552,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          padding: '40px 60px 34px',
          boxShadow: '0 1px 1px rgba(30,36,44,0.1), 0 3px 8px -3px rgba(30,36,44,0.12), 0 24px 44px -20px rgba(30,36,44,0.28)',
        }}
      >
        {children}
      </div>
      {sample && (
        <Tape width={230} height={46} rotate={-14} style={{ left: 18, top: 548 }}>
          <Rtl text="נתוני דוגמה" size={26} style={{ fontWeight: 700, color: INK, letterSpacing: 0.5 }} />
        </Tape>
      )}
    </div>
  );
}

/** חותמת המוסד: מסגרת כפולה בדיו, מוטה מעט. */
function Stamp({ text }: { text: string }) {
  return (
    <div style={{ display: 'flex', transform: 'rotate(-2deg)', border: `3px solid rgba(28,28,28,0.86)`, padding: 3, borderRadius: 4 }}>
      <div style={{ display: 'flex', border: `1.5px solid rgba(28,28,28,0.86)`, padding: '4px 14px 6px', borderRadius: 2 }}>
        <Rtl text={text} size={28} style={{ fontWeight: 700, color: 'rgba(28,28,28,0.86)' }} />
      </div>
    </div>
  );
}

/** קצר כותרת ארוכה בגבול של מילה, כדי שלא תדחוק את הציון. */
function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(' ') > 0 ? cut.lastIndexOf(' ') : max)}…`;
}

/** כותרת קצרה גדולה יותר. עד שתי שורות בעמודה, ושלוש לכותרת ארוכה במיוחד. */
function titleSize(title: string): number {
  const n = title.length;
  if (n <= 16) return 72;
  if (n <= 28) return 62;
  if (n <= 44) return 52;
  return 44;
}

/** הציון בתיבה, כמו בעמוד הקורס. בלי ציון: כמה ביקורות יש וכמה חסרות. */
function ScoreBox({ score }: { score: CoursePageData['score'] }) {
  const box: CSSProperties = {
    display: 'flex',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    border: `3px solid ${INK}`,
    backgroundColor: '#ffffff',
    padding: '16px 24px 16px 26px',
    minWidth: 380,
  };
  if (score.status === 'scored') {
    return (
      <div style={box}>
        <div style={{ display: 'flex', fontFamily: 'IBM Plex Sans Hebrew', fontWeight: 700, fontSize: 92, lineHeight: 1, marginTop: -4, letterSpacing: -2 }}>
          {score.value.toFixed(1)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginRight: 22, lineHeight: 1.3 }}>
          <Rtl text="ציון בוגרים מתוך 10" size={24} style={{ fontWeight: 700 }} />
          <Rtl text={verifiedText(score.reviewCount)} size={24} />
          {score.recommendPct !== null && <Rtl text={`${Math.round(score.recommendPct)}% ממליצים`} size={24} />}
        </div>
      </div>
    );
  }
  const count = score.status === 'not_enough_reviews' ? score.reviewCount : 0;
  const needed = score.status === 'not_enough_reviews' ? score.reviewsNeeded : 0;
  return (
    <div style={{ ...box, flexDirection: 'column', alignItems: 'flex-end', padding: '22px 26px', lineHeight: 1.3 }}>
      <Rtl text="עוד אין ציון בוגרים" size={36} style={{ fontWeight: 700 }} />
      <Rtl text={count > 0 ? reviewsText(count) : 'עוד אין ביקורות מאומתות'} size={26} style={{ marginTop: 6 }} />
      {needed > 0 && <Rtl text={neededText(needed)} size={26} />}
    </div>
  );
}

/** השורה התחתונה: מה ששולם בפועל במרקר ירוק, ומתחתיו המחיר באתר המוסד. */
function PriceLine({ course }: { course: CoursePageData }) {
  if (course.paid) {
    const site = course.sitePrice !== null ? ` · באתר המוסד ${formatIls(course.sitePrice)}` : '';
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        <Marked
          text={paidRangeSentence(course.paid)}
          size={36}
          color={MARK_VERIFIED}
          style={{ fontFamily: 'IBM Plex Sans Hebrew', fontWeight: 700 }}
        />
        <Rtl text={`${invoiceCountText(course.paid)}${site}`} size={24} style={{ color: INK_SOFT, marginTop: 4, marginRight: 12 }} />
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
      <Rtl
        text={course.sitePrice !== null ? `באתר המוסד: ${formatIls(course.sitePrice)}` : 'המוסד לא מפרסם מחיר'}
        size={30}
        style={{ fontWeight: 700 }}
      />
      <Rtl text="עוד אין מספיק חשבוניות כדי לדעת כמה שילמו בפועל" size={24} style={{ color: INK_SOFT, marginTop: 2 }} />
    </div>
  );
}

export async function renderCourseCard(course: CoursePageData): Promise<ImageResponse> {
  const title = clip(course.title, 64);
  const meta = [course.categoryName, course.region].filter(Boolean).join(' · ');
  return new ImageResponse(
    (
      <Desk sample={SAMPLE_DATA}>
        <SheetHeader />
        <div style={{ display: 'flex', flexDirection: 'row-reverse', flexGrow: 1, marginTop: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexGrow: 1, flexBasis: 0 }}>
            <Rtl
              text={title}
              size={titleSize(title)}
              style={{ fontFamily: 'IBM Plex Sans Hebrew', fontWeight: 700, lineHeight: 1.06, maxWidth: 560 }}
            />
            {/* מתחת לכותרת: חותמת המוסד, ולידה התחום והעיר. כמו בראש עמוד הקורס, ובלי שורה מעל הכותרת. */}
            {(course.institutionName || meta) && (
              <div style={{ display: 'flex', flexDirection: 'row-reverse', flexWrap: 'wrap', alignItems: 'center', marginTop: 18 }}>
                {course.institutionName && <Stamp text={course.institutionName} />}
                {meta && <Rtl text={meta} size={25} style={{ color: INK_SOFT, marginRight: course.institutionName ? 20 : 0 }} />}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', width: 420, marginRight: 36, marginTop: 6 }}>
            <ScoreBox score={course.score} />
            <Rtl
              text="את הקורס עצמו עוד לא בדקנו."
              size={26}
              style={{ fontFamily: 'Playpen Sans Hebrew', fontWeight: 500, color: PEN, marginTop: 14, marginRight: 6, transform: 'rotate(-1.5deg)' }}
            />
          </div>
        </div>
        <PriceLine course={course} />
      </Desk>
    ),
    { ...OG_SIZE, fonts: await loadFonts() },
  );
}

/** שורה במקרא: הסימון עצמו, ואחריו מה הוא אומר. */
function LegendRow({ swatch, text }: { swatch: ReactNode; text: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', marginTop: 12 }}>
      {swatch}
      <Rtl text={text} size={24} style={{ marginRight: 12 }} />
    </div>
  );
}

/** הכרטיס של האתר כולו: דף הבית, עמודי התחומים וכל עמוד בלי תמונה משלו. */
export async function renderSiteCard(): Promise<ImageResponse> {
  const swatch = (label: string, color: string) => (
    <Marked text={label} size={26} color={color} style={{ fontWeight: 700 }} />
  );
  return new ImageResponse(
    (
      <Desk sample={false}>
        <SheetHeader />
        <div style={{ display: 'flex', flexDirection: 'row-reverse', flexGrow: 1, marginTop: 34 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexGrow: 1, flexBasis: 0 }}>
            {/* השורות שבורות ביד, כדי שאף שורה לא תישאר עם מילה אחת. */}
            {['לפני שמשלמים על קורס:', 'מה אומרים בוגרים', 'שהוכיחו שלמדו בו'].map((line) => (
              <Rtl key={line} text={line} size={56} style={{ fontFamily: 'IBM Plex Sans Hebrew', fontWeight: 700, lineHeight: 1.16, flexWrap: 'nowrap' }} />
            ))}
            {['השוואת קורסים בכל התחומים. ביקורת מתפרסמת', 'רק מבוגר שהעלה הוכחה: חשבונית, קבלה או תעודת סיום.'].map(
              (line, i) => (
                <Rtl key={line} text={line} size={26} style={{ color: INK_SOFT, lineHeight: 1.4, marginTop: i === 0 ? 24 : 0 }} />
              ),
            )}
          </div>
          <div
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              width: 360,
              marginRight: 44,
              marginTop: 10,
              alignSelf: 'flex-start',
              padding: '30px 24px 26px',
              backgroundColor: '#ffffff',
              transform: 'rotate(1.2deg)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.16), 0 14px 22px -12px rgba(0,0,0,0.42)',
              border: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            <Tape width={108} rotate={-3} style={{ left: 126, top: -16 }} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <Rtl text="מה אומר כל צבע" size={30} style={{ fontWeight: 700 }} />
              {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
              <img src={PEN_RULE} width={196} height={12} style={{ marginTop: 2 }} />
            </div>
            <LegendRow swatch={swatch('ירוק', MARK_VERIFIED)} text="נבדק מול מסמך" />
            <LegendRow swatch={swatch('צהוב', MARK_GRADS)} text="מה שבוגרים אמרו" />
            <LegendRow swatch={swatch('ורוד', MARK_WEAK)} text="נקודת חולשה" />
            <LegendRow
              swatch={
                <div style={{ display: 'flex', borderBottom: `3px solid ${CLAIM}`, paddingBottom: 2, fontWeight: 700 }}>
                  <Rtl text="קו כחול" size={26} />
                </div>
              }
              text="המוסד אומר, לא נבדק"
            />
          </div>
        </div>
      </Desk>
    ),
    { ...OG_SIZE, fonts: await loadFonts() },
  );
}
