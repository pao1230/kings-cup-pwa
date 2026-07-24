import { create } from 'zustand';
import type { Card, GameSession } from '../types';
import { shuffledDeck } from '../lib/deck';
import { loadSession, saveSession } from '../lib/storage';

interface GameState {
  session: GameSession | null;

  init: (activeRuleSetId: string) => void;
  start: (ruleSetId: string) => void;
  draw: () => Card | null;
  undo: () => void;
  current: () => Card | null;
  remaining: () => number;
  total: () => number;
  isOver: () => boolean;
}

function newSession(ruleSetId: string): GameSession {
  return {
    ruleSetId,
    deck: shuffledDeck(),
    drawn: [],
    kingsDrawn: 0,
    startedAt: Date.now(),
  };
}

export const useGame = create<GameState>((set, get) => ({
  session: null,

  // Resume a saved game (AC-7 / NFR-8) or start a fresh one for the active set.
  init: (activeRuleSetId) => {
    const saved = loadSession();
    if (saved && Array.isArray(saved.deck) && Array.isArray(saved.drawn)) {
      set({ session: saved });
    } else {
      const s = newSession(activeRuleSetId);
      saveSession(s);
      set({ session: s });
    }
  },

  start: (ruleSetId) => {
    const s = newSession(ruleSetId);
    saveSession(s);
    set({ session: s });
  },

  draw: () => {
    const { session } = get();
    if (!session || session.deck.length === 0) return null;
    const deck = session.deck.slice();
    const card = deck.shift()!;
    const drawn = [...session.drawn, card];
    const kingsDrawn = session.kingsDrawn + (card.rank === 'K' ? 1 : 0);
    const next: GameSession = { ...session, deck, drawn, kingsDrawn };
    saveSession(next);
    set({ session: next });
    return card;
  },

  undo: () => {
    const { session } = get();
    if (!session || session.drawn.length === 0) return;
    const drawn = session.drawn.slice();
    const card = drawn.pop()!;
    const deck = [card, ...session.deck];
    const kingsDrawn = session.kingsDrawn - (card.rank === 'K' ? 1 : 0);
    const next: GameSession = { ...session, deck, drawn, kingsDrawn };
    saveSession(next);
    set({ session: next });
  },

  current: () => {
    const { session } = get();
    if (!session || session.drawn.length === 0) return null;
    return session.drawn[session.drawn.length - 1];
  },

  remaining: () => get().session?.deck.length ?? 52,
  total: () => {
    const s = get().session;
    return s ? s.deck.length + s.drawn.length : 52;
  },
  isOver: () => {
    const s = get().session;
    return !!s && s.deck.length === 0 && s.drawn.length > 0;
  },
}));
