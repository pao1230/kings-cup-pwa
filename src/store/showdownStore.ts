import { create } from 'zustand';
import type { Card, Rank } from '../types';
import { shuffledDeck } from '../lib/deck';

// "High-Low Showdown" — a quick group game for a passed-around phone:
//   1) Pick how many players are in.
//   2) One face-down card is dealt per player.
//   3) Each player, in turn, claims one of the face-down cards as their own —
//      each claim is tagged with that player's colour so nobody mixes them up.
//   4) Reveal everything at once and see who drew the highest card and who drew
//      the lowest. Ties share the crown (or the dunce cap).

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 8;

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

export type ShowdownPhase = 'setup' | 'claiming' | 'revealed';

export interface ShowdownSlot {
  card: Card; // the face-down card sitting in this position
  owner: number | null; // player index who has claimed it, or null
}

interface ShowdownState {
  playerCount: number;
  phase: ShowdownPhase;
  slots: ShowdownSlot[]; // exactly `playerCount` cards while playing
  currentPlayer: number; // whose turn it is to claim (during 'claiming')
  highest: number[]; // player indices holding the highest card (after reveal)
  lowest: number[]; // player indices holding the lowest card (after reveal)

  setPlayerCount: (n: number) => void;
  deal: () => void; // leave setup, deal one face-down card per player
  claim: (slotIndex: number) => void; // current player takes an unclaimed card
  reveal: () => void; // flip everything and score highest / lowest
  again: () => void; // re-deal with the same players
  reset: () => void; // back to the player-count picker
}

const clampPlayers = (n: number) =>
  Math.max(MIN_PLAYERS, Math.min(MAX_PLAYERS, Math.round(n)));

export const useShowdown = create<ShowdownState>((set, get) => ({
  playerCount: 4,
  phase: 'setup',
  slots: [],
  currentPlayer: 0,
  highest: [],
  lowest: [],

  setPlayerCount: (n) => {
    if (get().phase !== 'setup') return;
    set({ playerCount: clampPlayers(n) });
  },

  deal: () => {
    const { playerCount } = get();
    const deck = shuffledDeck();
    const slots: ShowdownSlot[] = deck
      .slice(0, playerCount)
      .map((card) => ({ card, owner: null }));
    set({
      phase: 'claiming',
      slots,
      currentPlayer: 0,
      highest: [],
      lowest: [],
    });
  },

  claim: (slotIndex) => {
    const { phase, slots, currentPlayer, playerCount } = get();
    if (phase !== 'claiming') return;
    const slot = slots[slotIndex];
    if (!slot || slot.owner !== null) return; // already taken
    const nextSlots = slots.map((s, i) =>
      i === slotIndex ? { ...s, owner: currentPlayer } : s,
    );
    const nextPlayer = currentPlayer + 1;
    set({
      slots: nextSlots,
      currentPlayer: Math.min(nextPlayer, playerCount - 1),
    });
  },

  reveal: () => {
    const { phase, slots } = get();
    if (phase !== 'claiming') return;
    if (slots.some((s) => s.owner === null)) return; // everyone must have a card

    // Map each player to the value of the card they claimed.
    const byPlayer: { player: number; value: number }[] = slots.map((s) => ({
      player: s.owner as number,
      value: cardValue(s.card),
    }));
    const values = byPlayer.map((b) => b.value);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const highest = byPlayer.filter((b) => b.value === max).map((b) => b.player);
    const lowest = byPlayer.filter((b) => b.value === min).map((b) => b.player);

    set({ phase: 'revealed', highest, lowest });
  },

  again: () => {
    // Same player count, fresh shuffle and deal.
    get().deal();
  },

  reset: () =>
    set({
      phase: 'setup',
      slots: [],
      currentPlayer: 0,
      highest: [],
      lowest: [],
    }),
}));
