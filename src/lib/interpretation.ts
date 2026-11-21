import { situationsById } from './catalog';

const CUSTOM_KEY_PREFIX = 'custom:';

export const BELIEF_RATINGS = [1, 2, 3, 4, 5] as const;
export type BeliefRating = (typeof BELIEF_RATINGS)[number];

export interface InitialInterpretation {
  text: string;
  belief: BeliefRating | null;
}

export function customInterpretationKey(text: string): string {
  return `${CUSTOM_KEY_PREFIX}${text.trim()}`;
}

export function isInterpretationKey(key: string): boolean {
  return situationsById.has(key)
    || (key.startsWith(CUSTOM_KEY_PREFIX) && Boolean(key.slice(CUSTOM_KEY_PREFIX.length).trim()));
}

export function isBeliefRating(value: unknown): value is BeliefRating {
  return BELIEF_RATINGS.some((rating) => rating === value);
}

export function interpretationErrors({ text, belief }: InitialInterpretation) {
  return {
    text: text.trim() ? '' : 'Write your initial interpretation to continue.',
    belief: isBeliefRating(belief) ? '' : 'Choose a rating from 1 to 5.',
  };
}
