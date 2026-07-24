// Data model — mirrors §4 of the SRS (Kings Cup PWA v1.0).

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';

export type Rank =
  | 'A'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | 'J'
  | 'Q'
  | 'K';

export interface CardRule {
  rank: Rank;
  title: string; // 1–30 chars
  description: string; // 0–300 chars
  icon?: string; // emoji
  isSpecial?: boolean; // e.g. K accumulates the center cup
}

export interface RuleSet {
  id: string; // uuid
  name: string;
  isDefault: boolean; // cannot be deleted
  rules: CardRule[]; // exactly 13 entries
  createdAt: number;
  updatedAt: number;
  schemaVersion: number;
}

export interface Card {
  rank: Rank;
  suit: Suit;
}

export interface GameSession {
  ruleSetId: string;
  deck: Card[]; // remaining cards
  drawn: Card[]; // drawn cards
  kingsDrawn: number; // 0–4
  startedAt: number;
}

export type Language = 'th' | 'en';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface AppSettings {
  language: Language;
  theme: ThemeMode;
  soundEnabled: boolean;
  animationEnabled: boolean;
  hapticEnabled: boolean;
  alcoholFreeMode: boolean;
}

export const RANKS: Rank[] = [
  'A',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
];

export const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];

export const SCHEMA_VERSION = 1;
