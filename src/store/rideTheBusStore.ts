import { create } from 'zustand';
import type { Card, Rank, Suit } from '../types';
import { shuffledDeck, isRedSuit } from '../lib/deck';

// "Ride the Bus" — the classic 4-round solo guessing game:
//   0) Red or Black   1) Higher or Lower   2) Inside or Outside   3) Guess the Suit
// A correct guess advances to the next round (the revealed cards accumulate so
// later rounds compare against earlier ones). A wrong guess ends the run: drink
// the round number and start over with a fresh shuffle. Clearing all four wins.

export type RtbRound = 0 | 1 | 2 | 3;
export type RtbStatus = 'guessing' | 'result' | 'won';
export type RtbChoice =
  | 'red'
  | 'black'
  | 'higher'
  | 'lower'
  | 'inside'
  | 'outside'
  | Suit;

// Ace high — 2 is the lowest card, A the highest, for higher/lower comparisons.
const RANK_VALUE: Record<Rank, number> = {
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
};

const value = (c: Card) => RANK_VALUE[c.rank];

// Is `choice` the right call given the cards revealed so far this round?
// Ties always lose (landing on the number / on a boundary is a drink).
export function evaluate(round: RtbRound, revealed: Card[], choice: RtbChoice): boolean {
  if (round === 0) {
    return choice === (isRedSuit(revealed[0].suit) ? 'red' : 'black');
  }
  if (round === 1) {
    const prev = value(revealed[0]);
    const cur = value(revealed[1]);
    if (cur === prev) return false;
    return choice === (cur > prev ? 'higher' : 'lower');
  }
  if (round === 2) {
    const lo = Math.min(value(revealed[0]), value(revealed[1]));
    const hi = Math.max(value(revealed[0]), value(revealed[1]));
    const cur = value(revealed[2]);
    if (cur === lo || cur === hi) return false;
    return choice === (cur > lo && cur < hi ? 'inside' : 'outside');
  }
  return choice === revealed[3].suit;
}

interface RtbGame {
  deck: Card[]; // remaining shuffled cards
  revealed: Card[]; // cards turned face up so far (0–4)
  round: RtbRound; // current round index
  status: RtbStatus;
  lastChoice: RtbChoice | null;
  lastCorrect: boolean | null;
}

function freshGame(): RtbGame {
  return {
    deck: shuffledDeck(),
    revealed: [],
    round: 0,
    status: 'guessing',
    lastChoice: null,
    lastCorrect: null,
  };
}

interface RtbState extends RtbGame {
  wins: number; // runs cleared this session
  fails: number; // runs failed this session

  start: () => void; // fresh shuffle, keeps the session tally
  guess: (choice: RtbChoice) => Card | null; // reveal next card + judge it
  next: () => void; // advance on a win, or restart on a loss
}

export const useRtb = create<RtbState>((set, get) => ({
  ...freshGame(),
  wins: 0,
  fails: 0,

  // set() merges shallowly, so the wins/fails tally survives a restart.
  start: () => set(freshGame()),

  guess: (choice) => {
    const { deck, revealed, round, status } = get();
    if (status !== 'guessing' || deck.length === 0) return null;
    const d = deck.slice();
    const card = d.shift()!;
    const nextRevealed = [...revealed, card];
    set({
      deck: d,
      revealed: nextRevealed,
      status: 'result',
      lastChoice: choice,
      lastCorrect: evaluate(round, nextRevealed, choice),
    });
    return card;
  },

  next: () => {
    const { round, status, lastCorrect } = get();
    if (status !== 'result') return;
    if (lastCorrect) {
      if (round === 3) {
        set((s) => ({ status: 'won', wins: s.wins + 1 }));
      } else {
        set({
          round: (round + 1) as RtbRound,
          status: 'guessing',
          lastChoice: null,
          lastCorrect: null,
        });
      }
    } else {
      set((s) => ({ ...freshGame(), fails: s.fails + 1 }));
    }
  },
}));
