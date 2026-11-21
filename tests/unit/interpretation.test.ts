import { describe, expect, it } from 'vitest';
import {
  BELIEF_RATINGS,
  customInterpretationKey,
  interpretationErrors,
  isBeliefRating,
  isInterpretationKey,
} from '../../src/lib/interpretation';

describe('initial interpretation validation', () => {
  it.each(BELIEF_RATINGS)('accepts belief rating %i', (belief) => {
    expect(isBeliefRating(belief)).toBe(true);
    expect(interpretationErrors({ text: 'Maybe they need time. 🌱', belief })).toEqual({ text: '', belief: '' });
  });

  it.each([undefined, null, '', '3', 0, 6, 2.5, NaN, Infinity, true, { value: 3 }])('rejects an invalid belief rating %j', (belief) => {
    expect(isBeliefRating(belief)).toBe(false);
  });

  it.each(['', ' \t\n', '\u00a0\u3000'])('asks for a response when text is empty or whitespace', (text) => {
    expect(interpretationErrors({ text, belief: 5 })).toEqual({
      text: 'Write your initial interpretation to continue.', belief: '',
    });
  });

  it('asks for a rating when the interpretation is already filled in', () => {
    expect(interpretationErrors({ text: 'I think they were busy.', belief: null })).toEqual({
      text: '', belief: 'Choose a rating from 1 to 5.',
    });
    expect(interpretationErrors({ text: '', belief: null })).toEqual({
      text: 'Write your initial interpretation to continue.', belief: 'Choose a rating from 1 to 5.',
    });
  });
});

it('keeps custom keys separate from catalog IDs and ignores surrounding whitespace', () => {
  expect(customInterpretationKey('  situation-011\n')).toBe('custom:situation-011');
  expect(isInterpretationKey('situation-011')).toBe(true);
  expect(isInterpretationKey('custom:situation-011')).toBe(true);
  expect(isInterpretationKey(customInterpretationKey(' '))).toBe(false);
  expect(isInterpretationKey('unrecognized')).toBe(false);
});
