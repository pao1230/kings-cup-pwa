import { create } from 'zustand';
import type { Card, Rank } from '../types';
import { shuffledDeck } from '../lib/deck';

// "High-Low Showdown" — a fast free-for-all for a phone in the middle of the
// table:
//   1) Pick how many players are in and the win condition.
//   2) One face-down card is dealt per player and laid out on the table, each
//      already tagged with that player's colour.
//   3) No turns — everyone races to tap and flip their own card.
//   4) Once every card is up, the win condition decides the outcome:
//        · highest card wins   · lowest card wins   · both ends lose
//      Ties share the crown (or the dunce cap).

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 8;

// What flipping over all the cards decides.
export type WinnerMode = 'highest' | 'lowest' | 'both_lose';
export const WINNER_MODES: WinnerMode[] = ['highest', 'lowest', 'both_lose'];

// One distinct colour per player slot — the only thing that tells players apart
// (per the brief: "separate each player by colour"). Kept as hex so we can apply
// them via inline styles without fighting Tailwind's purge over dynamic classes.
export const PLAYER_COLORS: { name: string; hex: string }[] = [
  { name: 'red', hex: '#ef4444' },
  { name: 'blue', hex: '#3b82f6' },
  { name: 'green', hex: '#22c55e' },
  { name: 'amber', hex: '#f59e0b' },
  { name: 'purple', hex: '#a855f7' },
  { name: 'pink', hex: '#ec4899' },
  { name: 'teal', hex: '#14b8a6' },
  { name: 'orange', hex: '#f97316' },
];

// Ace high — 2 is the lowest card, A the highest (matches Ride the Bus).
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

export const cardValue = (c: Card) => RANK_VALUE[c.rank];

export type ShowdownPhase = 'setup' | 'playing' | 'result';

export interface ShowdownSlot {
  card: Card; // the card dealt to this position
  owner: number; // player index (= deal position) this card belongs to
  flipped: boolean; // has it been turned face up yet?
}

interface ShowdownState {
  playerCount: number;
  winnerMode: WinnerMode;
  phase: ShowdownPhase;
  slots: ShowdownSlot[]; // exactly `playerCount` cards while playing
  highest: number[]; // player indices holding the highest card (after reveal)
  lowest: number[]; // player indices holding the lowest card (after reveal)

  setPlayerCount: (n: number) => void;
  setWinnerMode: (mode: WinnerMode) => void;
  deal: () => void; // leave setup, deal one face-down card per player
  flip: (slotIndex: number) => void; // turn one card face up (any order)
  flipAll: () => void; // turn over every remaining card at once
  again: () => void; // re-deal with the same players / mode
  reset: () => void; // back to the setup screen
}

const clampPlayers = (n: number) =>
  Math.max(MIN_PLAYERS, Math.min(MAX_PLAYERS, Math.round(n)));

// Score the fully-revealed table: who holds the highest and lowest card.
function scoreSlots(slots: ShowdownSlot[]): { highest: number[]; lowest: number[] } {
  const byPlayer = slots.map((s) => ({ player: s.owner, value: cardValue(s.card) }));
  const values = byPlayer.map((b) => b.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  return {
    highest: byPlayer.filter((b) => b.value === max).map((b) => b.player),
    lowest: byPlayer.filter((b) => b.value === min).map((b) => b.player),
  };
}

export const useShowdown = create<ShowdownState>((set, get) => ({
  playerCount: 4,
  winnerMode: 'highest',
  phase: 'setup',
  slots: [],
  highest: [],
  lowest: [],

  setPlayerCount: (n) => {
    if (get().phase !== 'setup') return;
    set({ playerCount: clampPlayers(n) });
  },

  setWinnerMode: (mode) => {
    if (get().phase !== 'setup') return;
    set({ winnerMode: mode });
  },

  deal: () => {
    const { playerCount } = get();
    const slots: ShowdownSlot[] = shuffledDeck()
      .slice(0, playerCount)
      .map((card, i) => ({ card, owner: i, flipped: false }));
    set({ phase: 'playing', slots, highest: [], lowest: [] });
  },

  flip: (slotIndex) => {
    const { phase, slots } = get();
    if (phase !== 'playing') return;
    const slot = slots[slotIndex];
    if (!slot || slot.flipped) return;
    const nextSlots = slots.map((s, i) => (i === slotIndex ? { ...s, flipped: true } : s));
    if (nextSlots.every((s) => s.flipped)) {
      set({ slots: nextSlots, phase: 'result', ...scoreSlots(nextSlots) });
    } else {
      set({ slots: nextSlots });
    }
  },

  flipAll: () => {
    const { phase, slots } = get();
    if (phase !== 'playing') return;
    const nextSlots = slots.map((s) => ({ ...s, flipped: true }));
    set({ slots: nextSlots, phase: 'result', ...scoreSlots(nextSlots) });
  },

  again: () => {
    // Same players and win condition, fresh shuffle and deal.
    get().deal();
  },

  reset: () => set({ phase: 'setup', slots: [], highest: [], lowest: [] }),
}));
