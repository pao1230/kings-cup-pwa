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

// How the cards get turned face up:
//   'each'     — no turns, everyone races to flip their own card one by one
//   'together' — cards stay down until one button flips them all at once
export type RevealMode = 'each' | 'together';
export const REVEAL_MODES: RevealMode[] = ['each', 'together'];

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
  id: number; // stable deal position, used only as a render key
  flipped: boolean; // has it been turned face up yet?
  // Player identity is claimed by the ORDER a card is pressed, not by position:
  // the first card flipped becomes player 0 (colour 0), the next player 1, …
  // `order` is null until the card is selected, so unpicked cards stay colourless.
  order: number | null;
  x: number; // where it landed on the table, as a 0–100 % of the surface
  y: number;
  rot: number; // the angle it landed at, in degrees
}

interface ShowdownState {
  playerCount: number;
  winnerMode: WinnerMode;
  revealMode: RevealMode;
  phase: ShowdownPhase;
  slots: ShowdownSlot[]; // exactly `playerCount` cards while playing
  highest: number[]; // player indices holding the highest card (after reveal)
  lowest: number[]; // player indices holding the lowest card (after reveal)

  setPlayerCount: (n: number) => void;
  setWinnerMode: (mode: WinnerMode) => void;
  setRevealMode: (mode: RevealMode) => void;
  deal: () => void; // leave setup, deal one face-down card per player
  flip: (slotIndex: number) => void; // turn one card face up (any order)
  flipAll: () => void; // turn over every remaining card at once
  again: () => void; // re-deal with the same players / mode
  reset: () => void; // back to the setup screen
}

const clampPlayers = (n: number) =>
  Math.max(MIN_PLAYERS, Math.min(MAX_PLAYERS, Math.round(n)));

// Scatter `n` cards across the table like they were tossed there: a loose,
// row-based spread (rows centred so an incomplete last row doesn't clump to one
// side) with a random jitter and tilt on each card. Returned as 0–100 % coords.
function tossPositions(n: number): { x: number; y: number; rot: number }[] {
  const rnd = (a: number, b: number) => a + Math.random() * (b - a);
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  const cols = Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols);
  const cellH = 100 / rows;
  const out: { x: number; y: number; rot: number }[] = [];
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / cols);
    const inRow = Math.min(cols, n - row * cols); // items on this row
    const idx = i - row * cols;
    const cellW = 100 / inRow;
    const x = clamp(cellW * (idx + 0.5) + rnd(-cellW * 0.2, cellW * 0.2), 15, 85);
    const y = clamp(cellH * (row + 0.5) + rnd(-cellH * 0.18, cellH * 0.18), 16, 84);
    out.push({ x, y, rot: rnd(-15, 15) });
  }
  return out;
}

// Score the fully-revealed table: who holds the highest and lowest card.
// Players are identified by their claim `order` (assigned as cards are pressed).
function scoreSlots(slots: ShowdownSlot[]): { highest: number[]; lowest: number[] } {
  const byPlayer = slots.map((s) => ({ player: s.order as number, value: cardValue(s.card) }));
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
  revealMode: 'each',
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

  setRevealMode: (mode) => {
    if (get().phase !== 'setup') return;
    set({ revealMode: mode });
  },

  deal: () => {
    const { playerCount } = get();
    const pos = tossPositions(playerCount);
    const slots: ShowdownSlot[] = shuffledDeck()
      .slice(0, playerCount)
      .map((card, i) => ({ card, id: i, flipped: false, order: null, ...pos[i] }));
    set({ phase: 'playing', slots, highest: [], lowest: [] });
  },

  flip: (slotIndex) => {
    const { phase, slots } = get();
    if (phase !== 'playing') return;
    const slot = slots[slotIndex];
    if (!slot || slot.flipped) return;
    // Claim the next colour in press order.
    const claimed = slots.filter((s) => s.order !== null).length;
    const nextSlots = slots.map((s, i) =>
      i === slotIndex ? { ...s, flipped: true, order: claimed } : s,
    );
    if (nextSlots.every((s) => s.flipped)) {
      set({ slots: nextSlots, phase: 'result', ...scoreSlots(nextSlots) });
    } else {
      set({ slots: nextSlots });
    }
  },

  flipAll: () => {
    const { phase, slots } = get();
    if (phase !== 'playing') return;
    // Give any not-yet-claimed cards the remaining colours, in table order.
    let claimed = slots.filter((s) => s.order !== null).length;
    const nextSlots = slots.map((s) =>
      s.flipped ? s : { ...s, flipped: true, order: claimed++ },
    );
    set({ slots: nextSlots, phase: 'result', ...scoreSlots(nextSlots) });
  },

  again: () => {
    // Same players and win condition, fresh shuffle and deal.
    get().deal();
  },

  reset: () => set({ phase: 'setup', slots: [], highest: [], lowest: [] }),
}));
