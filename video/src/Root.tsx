import React from 'react';
import { Composition } from 'remotion';
import { FPS, SIZE } from './theme';
import { TOTAL, Walkthrough } from './Walkthrough';

/** הכתובת שמופיעה בסוף. כשהדומיין של למדתי יעבוד, מחליפים כאן (או ב---props בזמן הרינדור). */
const URL = 'course-compare-il.vercel.app';

export function Root() {
  return (
    <>
      <Composition
        id="Walkthrough-16x9"
        component={Walkthrough}
        durationInFrames={TOTAL}
        fps={FPS}
        width={SIZE.wide.w}
        height={SIZE.wide.h}
        defaultProps={{ layout: 'wide', url: URL }}
      />
      <Composition
        id="Walkthrough-9x16"
        component={Walkthrough}
        durationInFrames={TOTAL}
        fps={FPS}
        width={SIZE.tall.w}
        height={SIZE.tall.h}
        defaultProps={{ layout: 'tall', url: URL }}
      />
    </>
  );
}
