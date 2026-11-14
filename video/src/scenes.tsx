import React from 'react';
import { AbsoluteFill, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { PageWindow, Shot, center, useCrossfade, type Key } from './camera';
import { DIR, META, sheetBounds } from './shots';
import { C, SHADOW, STAGE, sans, serif, type Layout, type SceneProps } from './theme';
import { BinderClip, Card, PenLoopAround, PenNumber, PenUnderline, PenWrite, Tape, Wordmark, useProgress } from './world';

/*
 * הסרטון קצר בכוונה (כ-30 שניות): אנשים מוותרים אחרי 20 שניות, ולכן הליבה (שואלים, רשימה, ציון) נגמרת לפני כן.
 * כל סצנה מקבלת כיתוב אחד קצר, שנשאר על המסך כל הסצנה, כדי שיהיה זמן לקרוא אותו.
 */

/* ===== כרטיס ההסבר: מספר מוקף וכותרת בעט ===== */

function Caption({ layout, n, title, from = 4 }: { layout: Layout; n: number; title: string; from?: number }) {
  const st = STAGE[layout].card;
  const wide = layout === 'wide';
  return (
    <div style={{ position: 'absolute', left: st.x, top: st.y, width: st.w, height: st.h, display: 'flex', alignItems: 'center' }}>
      <Card tilt={wide ? -1.4 : -0.8} style={{ width: '100%', padding: wide ? '48px 42px 44px' : '44px 46px 40px' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: wide ? 'column' : 'row',
            alignItems: wide ? 'flex-start' : 'center',
            gap: wide ? 16 : 24,
          }}
        >
          <PenNumber n={n} size={wide ? 80 : 88} from={from} />
          <PenWrite from={from + 6} size={60} weight={600}>
            {title}
          </PenWrite>
        </div>
      </Card>
    </div>
  );
}

/** דף לבן גדול באמצע השולחן, לפתיחה ולסיום. */
function CenterSheet({ layout, children }: { layout: Layout; children: React.ReactNode }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const wide = layout === 'wide';
  const w = wide ? 1240 : 952;
  const h = wide ? 760 : 1340;
  const enter = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 18 });
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: w, height: h, transform: `translateY(${(1 - enter) * 50}px)`, opacity: enter }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: C.paperUnder,
            transform: 'rotate(0.7deg) translate(6px, 8px)',
            boxShadow: SHADOW.under,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: C.paper,
            boxShadow: SHADOW.sheet,
            padding: wide ? '76px 92px' : '96px 72px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {children}
        </div>
        <BinderClip width={140} style={{ top: -58, left: '50%', marginLeft: -70 }} />
      </div>
    </AbsoluteFill>
  );
}

const footnote = (wide: boolean, opacity: number): React.CSSProperties => ({
  fontFamily: sans,
  fontSize: wide ? 28 : 32,
  lineHeight: 1.45,
  color: C.inkSoft,
  opacity,
  textWrap: 'pretty',
});

/* ===== פתיחה: ההבטחה של האתר ===== */

export function Intro({ layout }: SceneProps) {
  const wide = layout === 'wide';
  const h1 = useProgress(12, 12);
  const foot = useProgress(30, 10);
  return (
    <CenterSheet layout={layout}>
      <div style={{ marginBlock: 'auto' }}>
        <div>
          <Wordmark size={wide ? 66 : 76} from={2} />
        </div>
        <h1
          style={{
            fontFamily: serif,
            fontWeight: 800,
            fontSize: wide ? 68 : 80,
            lineHeight: 1.14,
            letterSpacing: '-0.01em',
            marginTop: wide ? 48 : 72,
            opacity: h1,
            transform: `translateY(${(1 - h1) * 14}px)`,
          }}
        >
          לפני שמשלמים על קורס:
          <br />
          מה אומרים בוגרים שהוכיחו שלמדו בו
        </h1>
      </div>
      <p style={footnote(wide, foot)}>עד ההשקה, כל הקורסים, הציונים והביקורות באתר הם לדוגמה.</p>
    </CenterSheet>
  );
}

/* ===== 1. שואלים: ארבע השורות במחברת ===== */

/** מתי מתחלף כל פריים בסצנת השאלה. אות או ספרה: 4 פריימים, כמו מישהו שמקליד בטלפון. */
function askTimeline(frames: { file: string; phase: string }[]) {
  const holds: Record<string, number> = {
    'ask-00.png': 8,
    'ask-01.png': 6,
    'ask-why-open.png': 24,
    'ask-why-picked.png': 16,
    'ask-when-open.png': 18,
    'ask-when-1.png': 14,
    'ask-when-2.png': 14,
    'ask-budget-0.png': 8,
  };
  let at = 0;
  return frames.map((f) => {
    const start = at;
    at += holds[f.file] ?? (f.file === 'ask-what-11.png' ? 10 : f.phase === 'ready' ? 999 : 4);
    return { ...f, start };
  });
}

export function Ask({ layout }: SceneProps) {
  const frame = useCurrentFrame();
  const m = META[layout];
  const dir = DIR[layout];
  const wide = layout === 'wide';
  const a = m.ask;
  const b = a.boxes;
  const timeline = askTimeline(a.frames);
  const current = [...timeline].reverse().find((f) => frame >= f.start) ?? timeline[0];
  const at = (file: string) => timeline.find((f) => f.file === file)?.start ?? 0;
  const tWhy = at('ask-why-open.png');
  const tWhen = at('ask-when-open.png');
  const tBudget = at('ask-budget-0.png');
  const tReady = at('ask-ready.png');

  // המצלמה כמעט קבועה, ויורדת קצת עם כל שורה, כדי שהשורה הפעילה והכפתור יישארו בתמונה.
  const s = wide ? 1.6 : 952 / 390;
  const y0 = wide ? 472 : 360;
  const keys: Key[] = [
    { f: 0, x: 900, y: y0, s },
    { f: tWhy, x: 900, y: y0, s },
    { f: tWhy + 12, x: 900, y: y0 + (wide ? 0 : 40), s },
    { f: tWhen, x: 900, y: y0 + (wide ? 0 : 40), s },
    { f: tWhen + 12, x: 900, y: y0 + (wide ? 28 : 70), s },
    { f: tBudget, x: 900, y: y0 + (wide ? 28 : 70), s },
    { f: tBudget + 12, x: 900, y: y0 + (wide ? 48 : 110), s },
  ];
  const file = current.file;
  return (
    <AbsoluteFill>
      <PageWindow layout={layout}>
        <Shot src={`${dir}/${file}`} w={a.clip.w} h={a.clip.h} keys={keys} bounds={sheetBounds(layout)}>
          {file === 'ask-why-open.png' ? <PenLoopAround box={b.whyChoice} from={tWhy + 6} dur={12} pad={8} /> : null}
          {file === 'ask-when-open.png' ? <PenLoopAround box={b.whenChoice} from={tWhen + 4} dur={10} pad={8} /> : null}
          {file === 'ask-when-1.png' ? <PenLoopAround box={b.howChoice} from={tWhen + 18} dur={10} pad={8} /> : null}
          {current.phase === 'ready' ? <PenLoopAround box={b.submit} from={tReady + 6} pad={8} /> : null}
        </Shot>
      </PageWindow>
      <Caption layout={layout} n={1} title="שואלים במילים שלכם" />
    </AbsoluteFill>
  );
}

/* ===== 2. הרשימה, ואז עמוד הקורס: ציון מבוגרים ===== */

export function Results({ layout }: SceneProps) {
  const m = META[layout];
  const dir = DIR[layout];
  const wide = layout === 'wide';
  const { width: vw, height: vh } = m.viewport;
  const r = m.results.boxes;
  const c = m.course.boxes;
  const H = m.course.height;
  const COURSE = 92;
  const fade = useCrossfade(COURSE, 10);
  const base = wide ? 1.06 : 952 / 390;
  const listKeys: Key[] = wide
    ? [{ f: 0, x: 720, y: vh / 2, s: base }, { f: 22, x: 720, y: vh / 2, s: base }, center(r.firstRow, 1.5, 46, 60, 0)]
    : [{ f: 0, x: 195, y: r.first.y + 130, s: base }];
  const courseKeys: Key[] = wide ? [{ f: 0, x: 720, y: 433, s: 1.08 }] : [{ f: 0, x: 195, y: c.h1.y + 230, s: base }];
  return (
    <AbsoluteFill>
      <PageWindow layout={layout}>
        <Shot src={`${dir}/results.png`} w={vw} h={vh} keys={listKeys} bounds={sheetBounds(layout)} opacity={1 - fade}>
          <PenLoopAround box={r.firstScore} from={wide ? 50 : 30} pad={wide ? 10 : 8} />
        </Shot>
        <Shot
          src={`${dir}/course-full.png`}
          w={vw}
          h={H}
          keys={courseKeys}
          bounds={sheetBounds(layout)}
          vbounds={wide ? [80, H] : undefined}
          opacity={fade}
        >
          <PenLoopAround box={c.scoreFrame} from={COURSE + 16} pad={wide ? 12 : 10} />
          <PenUnderline box={c.notChecked} from={COURSE + 38} />
        </Shot>
      </PageWindow>
      <Caption layout={layout} n={2} title="ציון רק מבוגרים מאומתים" />
    </AbsoluteFill>
  );
}

/* ===== 3. מקרא הצבעים: הסצנה שרונדרה ב-HyperFrames ===== */

export function Legend({ layout }: SceneProps) {
  const wide = layout === 'wide';
  const win = STAGE[layout].win;
  const side = 952;
  const box = wide
    ? { x: win.x + (win.w - side) / 2, y: win.y, w: side, h: side }
    : { x: win.x, y: win.y + (win.h - side) / 2 - 40, w: side, h: side };
  return (
    <AbsoluteFill>
      <PageWindow layout={layout} box={box}>
        <Sequence from={2} layout="none">
          <OffthreadVideo src={staticFile('legend/legend.mp4')} muted style={{ width: side, height: side, display: 'block' }} />
        </Sequence>
      </PageWindow>
      <Caption layout={layout} n={3} title="הצבע אומר מה המקור" />
    </AbsoluteFill>
  );
}

/* ===== 4. משווים: "ההשוואה שלי" ===== */

export function Compare({ layout }: SceneProps) {
  const m = META[layout];
  const dir = DIR[layout];
  const wide = layout === 'wide';
  const tray = m.tray.boxes.section;
  if (wide) {
    // במחשב "ההשוואה שלי" רחבה: חלון נמוך, זום שבו הטקסט קריא, ותנועה מהקורס הראשון (מימין) לשלישי.
    const s = 1.6;
    const h = Math.min(952, Math.round(tray.h * s + 120));
    const box = { x: 600, y: Math.round((1080 - h) / 2), w: 1256, h };
    const half = 1256 / s / 2;
    const keys: Key[] = [
      { f: 0, x: tray.w - half, y: tray.h / 2, s },
      { f: 14, x: tray.w - half, y: tray.h / 2, s },
      { f: 96, x: half, y: tray.h / 2, s },
    ];
    return (
      <AbsoluteFill>
        <PageWindow layout={layout} box={box}>
          <Shot src={`${dir}/tray-only.png`} w={tray.w} h={tray.h} keys={keys} />
        </PageWindow>
        <Caption layout={layout} n={4} title="משווים עד 3 קורסים" />
      </AbsoluteFill>
    );
  }
  const { width: vw, height: vh } = m.viewport;
  return (
    <AbsoluteFill>
      <PageWindow layout={layout}>
        <Shot src={`${dir}/tray.png`} w={vw} h={vh} keys={[center(tray, 952 / 390, 0, 0, -20)]} bounds={sheetBounds(layout)} />
      </PageWindow>
      <Caption layout={layout} n={4} title="משווים עד 3 קורסים" />
    </AbsoluteFill>
  );
}

/* ===== סיום ===== */

export function Outro({ layout, url }: SceneProps) {
  const wide = layout === 'wide';
  const h = useProgress(10, 12);
  const line = useProgress(22, 10);
  const u = useProgress(32, 10);
  const rule = useProgress(38, 14);
  const foot = useProgress(48, 10);
  return (
    <CenterSheet layout={layout}>
      <div style={{ marginBlock: 'auto' }}>
        <div>
          <Wordmark size={wide ? 70 : 80} from={2} />
        </div>
        <h1
          style={{
            fontFamily: serif,
            fontWeight: 800,
            fontSize: wide ? 72 : 70,
            lineHeight: 1.14,
            marginTop: wide ? 40 : 60,
            opacity: h,
            transform: `translateY(${(1 - h) * 14}px)`,
          }}
        >
          לפני שמשלמים על קורס,
          <br />
          בודקים בלמדתי.
        </h1>
        <p style={{ fontFamily: sans, fontWeight: 700, fontSize: wide ? 36 : 42, lineHeight: 1.4, marginTop: wide ? 26 : 40, opacity: line }}>
          אף מוכר קורסים לא משלם לנו.
        </p>
        <div style={{ marginTop: wide ? 40 : 64, opacity: u, position: 'relative', display: 'inline-block' }}>
          <bdi dir="ltr" style={{ fontFamily: sans, fontWeight: 700, fontSize: 46, color: C.ink, letterSpacing: '0.01em' }}>
            {url}
          </bdi>
          <svg
            style={{ position: 'absolute', left: 0, right: 0, bottom: -16, width: '100%', height: 16, overflow: 'visible' }}
            viewBox="0 0 200 12"
            preserveAspectRatio="none"
          >
            <path
              d="M198.4 3.6C160 5.6 112 6.8 60 6.6 38 6.5 18 6.1 3.4 5.2 1.6 5.1 1.1 7.3 2.8 7.6 18 9.2 40 9.7 62 9.6 114 9.4 162 8.4 198.8 6.4 200.8 6.3 200.5 3.5 198.4 3.6Z"
              fill={C.pen}
              style={{ clipPath: `inset(0 0 0 ${(1 - rule) * 100}%)` }}
            />
          </svg>
        </div>
      </div>
      <p style={footnote(wide, foot)}>כל הנתונים בסרטון לדוגמה, עד ההשקה.</p>
      <Tape width={wide ? 150 : 170} height={wide ? 40 : 46} tilt={-8} style={{ top: 22, left: -26, fontSize: wide ? 22 : 26, opacity: foot }}>
        לדוגמה
      </Tape>
    </CenterSheet>
  );
}
