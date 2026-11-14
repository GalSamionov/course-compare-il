import React from 'react';
import { AbsoluteFill } from 'remotion';
import { TransitionSeries, springTiming } from '@remotion/transitions';
import { slide } from '@remotion/transitions/slide';
import { Advisor, Ask, Intro, Legend, Outro, Results } from './scenes';
import type { Layout } from './theme';
import { Desk } from './world';

export type WalkthroughProps = { layout: Layout; url: string };

/**
 * הסצנות ואורך כל אחת בפריימים (30 בשנייה). המעבר בין סצנות חופף 15 פריימים.
 * בסך הכול כ-35 שניות: הליבה (שואלים, רשימה, ציון) נגמרת בערך בשנייה 18, ואחריה היועץ והצבעים.
 * את התשובה של היועץ הצבעים מסמנים, ולכן המקרא בא מיד אחריה.
 */
export const SCENES = [
  { id: 'intro', frames: 120, C: Intro },
  { id: 'ask', frames: 270, C: Ask },
  { id: 'results', frames: 180, C: Results },
  { id: 'advisor', frames: 210, C: Advisor },
  { id: 'legend', frames: 180, C: Legend },
  // הסוף נשאר יותר זמן: בו הכתובת.
  { id: 'outro', frames: 150, C: Outro },
] as const;
export const TRANSITION = 15;
export const TOTAL = SCENES.reduce((sum, s) => sum + s.frames, 0) - TRANSITION * (SCENES.length - 1);

/**
 * הסרטון: השולחן קבוע, והחפצים (הדף וכרטיס ההסבר) מתחלפים עליו.
 * בעברית קוראים מימין לשמאל, ולכן הסצנה הבאה נכנסת משמאל, כמו דף שמתהפך בספר עברי.
 */
export function Walkthrough({ layout, url }: WalkthroughProps) {
  return (
    <AbsoluteFill style={{ direction: 'rtl' }}>
      <Desk />
      <TransitionSeries>
        {SCENES.flatMap(({ id, frames, C }, i) => {
          const scene = (
            <TransitionSeries.Sequence key={id} durationInFrames={frames}>
              <C layout={layout} url={url} />
            </TransitionSeries.Sequence>
          );
          if (i === 0) return [scene];
          return [
            <TransitionSeries.Transition
              key={`${id}-in`}
              presentation={slide({ direction: 'from-left' })}
              timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANSITION })}
            />,
            scene,
          ];
        })}
      </TransitionSeries>
    </AbsoluteFill>
  );
}
