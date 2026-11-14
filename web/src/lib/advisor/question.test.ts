import { describe, expect, it } from 'vitest';
import { QUESTION_WORDS, isQuestion } from './question';

describe('isQuestion', () => {
  it('is a question when the text has a question mark anywhere', () => {
    expect(isQuestion('קורס בישול בערבים?')).toBe(true);
    expect(isQuestion('אקסל? לעבודה')).toBe(true);
    expect(isQuestion('?')).toBe(true);
  });

  it('is a question when the first word is a common question word', () => {
    for (const word of QUESTION_WORDS) {
      expect(isQuestion(`${word} קורס בישול מתאים לי`), word).toBe(true);
    }
    expect(QUESTION_WORDS).toEqual([
      'איזה',
      'איזו',
      'אילו',
      'מה',
      'האם',
      'איך',
      'כמה',
      'למה',
      'מתי',
      'כדאי',
      'שווה',
      'מי',
      'היכן',
      'איפה',
    ]);
  });

  it('reads the first word after spaces and opening quotes, and with niqqud', () => {
    expect(isQuestion('   איזה קורס צילום הכי מעשי')).toBe(true);
    expect(isQuestion('״כמה עולה קורס אפייה״')).toBe(true);
    expect(isQuestion('מָה ההבדל בין שני קורסי הבישול')).toBe(true);
    expect(isQuestion('כדאי, לדעתכם, ללמוד פייתון')).toBe(true);
  });

  it('is not a question for a topic', () => {
    expect(isQuestion('בישול איטלקי')).toBe(false);
    expect(isQuestion('אקסל לעבודה')).toBe(false);
    expect(isQuestion('לבנות אתרים')).toBe(false);
  });

  it('matches a whole word only, not a word that starts with the same letters', () => {
    expect(isQuestion('מהנדס תוכנה')).toBe(false);
    expect(isQuestion('מיקרוסופט אקסל')).toBe(false);
    expect(isQuestion('כמהין ופטריות')).toBe(false);
    expect(isQuestion('איפור כלות')).toBe(false);
  });

  it('a question word later in the text does not make it a question', () => {
    expect(isQuestion('קורס שמלמד מה זה AI')).toBe(false);
  });

  it('is not a question when empty', () => {
    expect(isQuestion('')).toBe(false);
    expect(isQuestion('   ')).toBe(false);
  });
});
