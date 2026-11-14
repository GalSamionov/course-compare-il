import React from 'react';
import { AbsoluteFill, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { PageWindow, Shot, center, useCrossfade, type Key } from './camera';
import { DIR, META, sheetBounds } from './shots';
import { C, SHADOW, STAGE, sans, serif, type Layout, type SceneProps } from './theme';
import {
  BinderClip,
  Card,
  PenLoopAround,
  PenNumber,
  PenUnderline,
  PenWrite,
  SmallArrow,
  Tape,
  Wordmark,
  useProgress,
} from './world';

/* ===== כרטיס ההסבר: מספר מוקף, כותרת בעט ושורה מודפסת ===== */

function Caption({ layout, n, title, sub, from = 6 }: { layout: Layout; n?: number; title: string; sub: string; from?: number }) {
  const st = STAGE[layout].card;
  const wide = layout === 'wide';
  const subIn = useProgress(from + 20, 10);
  return (
    <div
      style={{ position: 'absolute', left: st.x, top: st.y, width: st.w, height: st.h, display: 'flex', alignItems: 'center' }}
    >
      <Card tilt={wide ? -1.4 : -0.8} style={{ width: '100%', padding: wide ? '46px 42px 40px' : '40px 46px 36px' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: wide ? 'column' : 'row',
            alignItems: wide ? 'flex-start' : 'center',
            gap: wide ? 14 : 22,
          }}
        >
          {n ? <PenNumber n={n} size={wide ? 76 : 80} from={from} /> : null}
          <PenWrite from={from + 6} size={wide ? 54 : 60} weight={600}>
            {title}
          </PenWrite>
        </div>
        <p
          style={{
            fontFamily: sans,
            fontSize: wide ? 31 : 35,
            lineHeight: 1.45,
            color: C.ink,
            marginTop: wide ? 20 : 18,
            opacity: subIn,
          }}
        >
          {sub}
        </p>
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
  const enter = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 22 });
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: w, height: h, transform: `translateY(${(1 - enter) * 60}px)`, opacity: enter }}>
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

/* ===== 0. פתיחה ===== */

export function Intro({ layout }: SceneProps) {
  const wide = layout === 'wide';
  const h1 = useProgress(18, 14);
  const foot = useProgress(58, 12);
  return (
    <CenterSheet layout={layout}>
      <div style={{ marginBlock: 'auto' }}>
        <div>
          <Wordmark size={wide ? 62 : 72} from={4} />
        </div>
        <h1
          style={{
            fontFamily: serif,
            fontWeight: 800,
            fontSize: wide ? 64 : 76,
            lineHeight: 1.14,
            letterSpacing: '-0.01em',
            marginTop: wide ? 44 : 64,
            opacity: h1,
            transform: `translateY(${(1 - h1) * 14}px)`,
          }}
        >
          לפני שמשלמים על קורס:
          <br />
          מה אומרים בוגרים שהוכיחו שלמדו בו
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: wide ? 36 : 56 }}>
          <PenWrite from={36} dur={20} size={wide ? 44 : 50}>
            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
              <SmallArrow size={wide ? 44 : 50} />
              ככה משתמשים בזה, בחמישה צעדים
            </span>
          </PenWrite>
        </div>
      </div>
      <p style={{ fontFamily: sans, fontSize: wide ? 28 : 32, lineHeight: 1.45, color: C.inkSoft, opacity: foot }}>
        עד ההשקה, כל הקורסים, המוסדות, הציונים והביקורות באתר הם לדוגמה.
      </p>
    </CenterSheet>
  );
}

/* ===== 1. שואלים ===== */

export function Ask({ layout }: SceneProps) {
  const frame = useCurrentFrame();
  const m = META[layout];
  const dir = DIR[layout];
  const wide = layout === 'wide';
  const { width: vw, height: vh } = m.viewport;
  const b = sheetBounds(layout);
  const tf = m.typing.frames;

  // אות אחרי אות: 4 פריימים לכל לחיצה, כמו מישהו שמקליד בטלפון.
  const T0 = 28;
  const typingIdx = frame < 18 ? 0 : frame < T0 ? 1 : Math.min(tf.length - 1, 2 + Math.floor((frame - T0) / 4));
  const OPEN = 100;
  const PICK = 150;
  const src = frame < OPEN ? `${dir}/${tf[typingIdx]}` : frame < PICK ? `${dir}/why-open.png` : `${dir}/why-picked.png`;

  const why = m.why.boxes;
  const line1 = m.typing.boxes.line1;
  // במחשב: זום שבו הקצה השמאלי של החלון נופל ברווח שבין הטופס לעמודת "או", כדי שלא ייחתך טקסט.
  const s = wide ? 1.6 : 952 / 390;
  const typingY = wide ? line1.y + 240 : line1.y + 210;
  const openY = wide ? (why.options.y + why.submit.y + why.submit.h) / 2 : why.options.y + why.options.h / 2 + 30;
  const pickY = wide ? (why.line2.y + why.submit.y + why.submit.h) / 2 : why.submit.y - 150;
  const keys: Key[] = [
    { f: 0, x: 900, y: typingY, s },
    { f: OPEN, x: 900, y: typingY, s },
    { f: OPEN + 18, x: 900, y: openY, s },
    { f: PICK + 10, x: 900, y: openY, s },
    { f: PICK + 34, x: 900, y: pickY, s },
  ];

  return (
    <AbsoluteFill>
      <PageWindow layout={layout}>
        <Shot src={src} w={vw} h={vh} keys={keys} bounds={b}>
          {frame >= OPEN && frame < PICK ? <PenLoopAround box={why.choice} from={OPEN + 20} pad={8} /> : null}
          {frame >= PICK ? <PenLoopAround box={why.submit} from={PICK + 40} pad={8} /> : null}
        </Shot>
      </PageWindow>
      <Caption layout={layout} n={1} title="שואלים במילים שלכם" sub="מה רוצים ללמוד, ולמה. ארבע שורות, בלי הרשמה." />
    </AbsoluteFill>
  );
}

/* ===== 2. התוצאות ===== */

export function Results({ layout }: SceneProps) {
  const m = META[layout];
  const dir = DIR[layout];
  const wide = layout === 'wide';
  const { width: vw, height: vh } = m.viewport;
  const r = m.results.boxes;
  const base = wide ? 1.06 : 952 / 390;
  const keys: Key[] = wide
    ? [{ f: 0, x: 720, y: vh / 2, s: base }, { f: 50, x: 720, y: vh / 2, s: base }, center(r.firstRow, 1.62, 82, 60, 0)]
    : [
        { f: 0, x: 195, y: r.first.y + 130, s: base },
        { f: 50, x: 195, y: r.first.y + 130, s: base },
        { f: 82, x: 195, y: r.first.y + 110, s: base * 1.12 },
      ];
  return (
    <AbsoluteFill>
      <PageWindow layout={layout}>
        <Shot src={`${dir}/results.png`} w={vw} h={vh} keys={keys} bounds={sheetBounds(layout)}>
          <PenLoopAround box={r.firstScore} from={92} pad={wide ? 10 : 8} />
          <PenUnderline box={r.firstGrads} from={116} />
        </Shot>
      </PageWindow>
      <Caption layout={layout} n={2} title="רואים רק מה שמתאים" sub="ממוין לפי ציון בוגרים. נספרים רק בוגרים שהעלו הוכחה." />
    </AbsoluteFill>
  );
}

/* ===== 3. עמוד הקורס ===== */

export function Course({ layout }: SceneProps) {
  const m = META[layout];
  const dir = DIR[layout];
  const wide = layout === 'wide';
  const c = m.course.boxes;
  const H = m.course.height;
  const vw = m.viewport.width;
  const base = wide ? 1.08 : 952 / 390;
  const sc = c.scoreFrame;
  const nc = c.notChecked;
  const scoreMid = { x: (sc.x + sc.x + sc.w) / 2, y: (sc.y + nc.y + nc.h) / 2 };
  // במחשב הכותרת והציון באותו גובה, ולכן אין זום על הציון: כל הדף העליון, ואז דחיפה קלה אל "בקצרה" וכרטיס המקרא.
  const keys: Key[] = wide
    ? [
        { f: 0, x: 720, y: 433, s: base },
        { f: 120, x: 720, y: 433, s: base },
        // החלון מתחיל מתחת לשורת הכותרת של האתר, כדי שלא ייחתך באמצע.
        { f: 160, x: 720, y: 170 + 952 / 1.2 / 2, s: 1.2 },
      ]
    : [
        { f: 0, x: 195, y: c.h1.y + 230, s: base },
        { f: 36, x: 195, y: c.h1.y + 230, s: base },
        { f: 58, x: 195, y: scoreMid.y, s: base * 1.08 },
        { f: 130, x: 195, y: scoreMid.y, s: base * 1.08 },
        { f: 165, x: 195, y: (c.glance.y + c.legend.y + c.legend.h) / 2, s: base },
      ];
  return (
    <AbsoluteFill>
      <PageWindow layout={layout}>
        <Shot
          src={`${dir}/course-full.png`}
          w={vw}
          h={H}
          keys={keys}
          bounds={sheetBounds(layout)}
          vbounds={wide ? [80, H] : undefined}
        >
          <PenLoopAround box={sc} from={wide ? 44 : 62} pad={wide ? 12 : 10} />
          <PenUnderline box={nc} from={wide ? 70 : 90} />
        </Shot>
      </PageWindow>
      <Caption
        layout={layout}
        n={3}
        title="נכנסים לעמוד הקורס"
        sub="ציון מתוך 10, רק מבוגרים מאומתים. ובכל עמוד כתוב גם מה עוד לא בדקנו."
      />
    </AbsoluteFill>
  );
}

/* ===== 4. מקרא הצבעים: הסצנה שרונדרה ב-HyperFrames ===== */

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
        <Sequence from={4} layout="none">
          <OffthreadVideo src={staticFile('legend/legend.mp4')} muted style={{ width: side, height: side, display: 'block' }} />
        </Sequence>
      </PageWindow>
      <Caption
        layout={layout}
        n={4}
        title="כל צבע אומר מאיפה המידע"
        sub="כך רואים מה נבדק מול מסמך, מה אמרו בוגרים, ומה רק המוסד טוען."
      />
    </AbsoluteFill>
  );
}

/* ===== 5. שומרים ומשווים ===== */

export function Compare({ layout }: SceneProps) {
  const frame = useCurrentFrame();
  const m = META[layout];
  const dir = DIR[layout];
  const wide = layout === 'wide';
  const { width: vw, height: vh } = m.viewport;
  const cb = m.compare.boxes;
  const tray = m.tray.boxes.section;
  const CLICK = 56;
  const TRAY = 140;
  const fade = useCrossfade(TRAY, 10);
  const before = (
    <>
      {frame < CLICK + 30 ? <PenLoopAround box={cb.button} from={30} pad={wide ? 10 : 8} /> : null}
      {frame >= CLICK ? <PenUnderline box={cb.note} from={CLICK + 26} /> : null}
    </>
  );
  const buttonShot = `${dir}/${frame < CLICK ? 'compare-before' : 'compare-after'}.png`;

  if (wide) {
    // במחשב: חלון צר על העמודה הצדדית בלבד (הכפתורים), ואז "ההשוואה שלי" בחלון רחב.
    const narrow = { x: 600 + (1256 - 760) / 2, y: 64, w: 760, h: 952 };
    const sideBounds: [number, number] = [128, 600];
    const s = 760 / (sideBounds[1] - sideBounds[0]);
    // "ההשוואה שלי" רחבה במחשב: חלון נמוך, זום שבו הטקסט קריא, ותנועה מהקורס הראשון (מימין) לשלישי.
    const trayS = 1.6;
    const trayBox = {
      x: 600,
      y: Math.round((1080 - Math.min(952, tray.h * trayS + 120)) / 2),
      w: 1256,
      h: Math.min(952, Math.round(tray.h * trayS + 120)),
    };
    const half = 1256 / trayS / 2;
    const trayKeys: Key[] = [
      { f: TRAY, x: tray.w - half, y: tray.h / 2, s: trayS },
      { f: TRAY + 22, x: tray.w - half, y: tray.h / 2, s: trayS },
      { f: TRAY + 80, x: half, y: tray.h / 2, s: trayS },
    ];
    return (
      <AbsoluteFill>
        <AbsoluteFill style={{ opacity: 1 - fade }}>
          <PageWindow layout={layout} box={narrow}>
            <Shot src={buttonShot} w={vw} h={vh} keys={[center(cb.button, s, 0, 0, 70)]} bounds={sideBounds}>
              {before}
            </Shot>
          </PageWindow>
        </AbsoluteFill>
        <AbsoluteFill style={{ opacity: fade }}>
          <PageWindow layout={layout} box={trayBox}>
            <Shot src={`${dir}/tray-only.png`} w={tray.w} h={tray.h} keys={trayKeys} />
          </PageWindow>
        </AbsoluteFill>
        <Caption layout={layout} n={5} title="שומרים ומשווים" sub="עד 3 קורסים, זה לצד זה. בלי התחברות, ההשוואה נשמרת בדפדפן." />
      </AbsoluteFill>
    );
  }

  const base = 952 / 390;
  return (
    <AbsoluteFill>
      <PageWindow layout={layout}>
        <Shot
          src={buttonShot}
          w={vw}
          h={vh}
          keys={[{ f: 0, x: 195, y: cb.button.y + cb.button.h / 2 + 70, s: base }]}
          bounds={sheetBounds(layout)}
          opacity={1 - fade}
        >
          {before}
        </Shot>
        <Shot
          src={`${dir}/tray.png`}
          w={vw}
          h={vh}
          keys={[center(tray, base, 0, 0, -20)]}
          bounds={sheetBounds(layout)}
          opacity={fade}
        />
      </PageWindow>
      <Caption layout={layout} n={5} title="שומרים ומשווים" sub="עד 3 קורסים, זה לצד זה. בלי התחברות, ההשוואה נשמרת בדפדפן." />
    </AbsoluteFill>
  );
}

/* ===== בקרוב: כתיבת ביקורת (סבב 3, עוד לא באוויר) ===== */

export function Soon({ layout }: SceneProps) {
  const m = META[layout];
  const dir = DIR[layout];
  const wide = layout === 'wide';
  const { width: vw, height: vh } = m.viewport;
  // במחשב העמוד קצר: חלון נמוך שמראה רק את הנייר, בלי השולחן שמתחתיו ובלי התפס של האתר.
  const s = 1256 / 960;
  const box = wide ? { x: 600, y: Math.round((1080 - 355 * s) / 2), w: 1256, h: Math.round(355 * s) } : undefined;
  const keys: Key[] = wide ? [{ f: 0, x: 720, y: 342, s }] : [{ f: 0, x: 195, y: 330, s: 952 / 390 }];
  return (
    <AbsoluteFill>
      <PageWindow layout={layout} box={box}>
        <Shot
          src={`${dir}/review-soon.png`}
          w={vw}
          h={vh}
          keys={keys}
          bounds={sheetBounds(layout, true)}
          vbounds={wide ? [165, 520] : undefined}
        />
      </PageWindow>
      <Caption
        layout={layout}
        title="בקרוב: ביקורת עם הוכחה"
        sub="סיימתם קורס? מעלים חשבונית, קבלה או תעודת סיום. רק אנחנו רואים אותה, והיא נמחקת אחרי הבדיקה."
      />
    </AbsoluteFill>
  );
}

/* ===== סיום ===== */

export function Outro({ layout, url }: SceneProps) {
  const wide = layout === 'wide';
  const h = useProgress(16, 14);
  const line = useProgress(30, 12);
  const u = useProgress(44, 10);
  const foot = useProgress(70, 12);
  const rule = useProgress(52, 14);
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
            fontSize: wide ? 72 : 74,
            lineHeight: 1.14,
            marginTop: wide ? 40 : 60,
            maxWidth: wide ? 1000 : 800,
            textWrap: 'balance',
            opacity: h,
            transform: `translateY(${(1 - h) * 14}px)`,
          }}
        >
          לפני שמשלמים על קורס,
          <br />
          בודקים בלמדתי.
        </h1>
        <p
          style={{
            fontFamily: sans,
            fontWeight: 700,
            fontSize: wide ? 34 : 38,
            lineHeight: 1.4,
            marginTop: wide ? 26 : 40,
            opacity: line,
          }}
        >
          אף מוכר לא משלם לנו. לא על מקום, לא על ציון ולא על הסרת ביקורת.
        </p>
        <div style={{ marginTop: wide ? 40 : 64, opacity: u, position: 'relative', display: 'inline-block' }}>
          <bdi
            dir="ltr"
            style={{ fontFamily: sans, fontWeight: 700, fontSize: wide ? 46 : 46, color: C.ink, letterSpacing: '0.01em' }}
          >
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
      <p style={{ fontFamily: sans, fontSize: wide ? 28 : 32, lineHeight: 1.45, color: C.inkSoft, opacity: foot }}>
        כל הנתונים בסרטון לדוגמה, עד ההשקה.
      </p>
      <Tape
        width={wide ? 150 : 170}
        height={wide ? 40 : 46}
        tilt={-8}
        style={{ top: 22, left: -26, fontSize: wide ? 22 : 26, opacity: foot }}
      >
        לדוגמה
      </Tape>
    </CenterSheet>
  );
}
