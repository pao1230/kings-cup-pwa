import type { Card } from '../types';
import { RANKS, SUITS } from '../types';

// Build a fresh, ordered 52-card deck.
export function buildDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit });
    }
  }
  return deck;
}

// Fisher–Yates shuffle using crypto for good randomness (falls back to Math.random).
export function shuffle<T>(input: T[]): T[] {
  const arr = input.slice();
  const rand = (max: number) => {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const buf = new Uint32Array(1);
      crypto.getRandomValues(buf);
      return buf[0] % max;
    }
    return Math.floor(Math.random() * max);
  };
  for (let i = arr.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function shuffledDeck(): Card[] {
  return shuffle(buildDeck());
}

export const SUIT_SYMBOL: Record<Card['suit'], string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

export function isRedSuit(suit: Card['suit']): boolean {
  return suit === 'hearts' || suit === 'diamonds';
}
