import { useState } from 'react';
import {
  useShowdown,
  PLAYER_COLORS,
  WINNER_MODES,
  MIN_PLAYERS,
  MAX_PLAYERS,
  cardValue,
  type WinnerMode,
  type ShowdownSlot,
} from '../store/showdownStore';
import { useSettings } from '../store/settingsStore';
import { useT } from '../i18n/useT';
import type { StringKey } from '../i18n/strings';
import { SUIT_SYMBOL, isRedSuit } from '../lib/deck';
import type { Card } from '../types';
import { Button } from '../components/ui';
import { useWakeLock } from '../lib/wakeLock';
import { haptic } from '../lib/util';
import { playDraw, playWin } from '../lib/sound';

// Short label shown on the win-condition selector buttons.
const MODE_LABEL: Record<WinnerMode, StringKey> = {
  highest: 'sd_mode_highest',
  lowest: 'sd_mode_lowest',
  both_lose: 'sd_mode_both_lose',
};

export default function ShowdownPage() {
  const t = useT();
  const settings = useSettings();

  const playerCount = useShowdown((s) => s.playerCount);
  const winnerMode = useShowdown((s) => s.winnerMode);
  const phase = useShowdown((s) => s.phase);
  const slots = useShowdown((s) => s.slots);
  const highest = useShowdown((s) => s.highest);
  const lowest = useShowdown((s) => s.lowest);
  const setPlayerCount = useShowdown((s) => s.setPlayerCount);
  const setWinnerMode = useShowdown((s) => s.setWinnerMode);
  const deal = useShowdown((s) => s.deal);
  const flip = useShowdown((s) => s.flip);
  const flipAll = useShowdown((s) => s.flipAll);
  const again = useShowdown((s) => s.again);
  const reset = useShowdown((s) => s.reset);

  const [showHelp, setShowHelp] = useState(false);

  // Keep the screen awake while a round is being set up or played.
  useWakeLock(phase !== 'setup');

  const onDeal = () => {
    deal();
    playDraw(settings.soundEnabled);
    haptic(settings.hapticEnabled, 12);
  };

  const onFlip = (index: number) => {
    const wasLast = slots.filter((s) => !s.flipped).length === 1;
    flip(index);
    if (wasLast) {
      playWin(settings.soundEnabled);
      haptic(settings.hapticEnabled, [20, 40, 20, 40, 60]);
    } else {
      playDraw(settings.soundEnabled);
      haptic(settings.hapticEnabled, 15);
    }
  };

  const onFlipAll = () => {
    flipAll();
    playWin(settings.soundEnabled);
    haptic(settings.hapticEnabled, [20, 40, 20, 40, 60]);
  };

  const onAgain = () => {
    again();
    playDraw(settings.soundEnabled);
    haptic(settings.hapticEnabled, 12);
  };

  return (
    <div className="flex min-h-full flex-col gap-4">
      {/* Header: title (how-to toggle) + player count */}
      <div className="flex items-center justify-between gap-2 text-sm">
        <button
          type="button"
          onClick={() => setShowHelp((v) => !v)}
          aria-expanded={showHelp}
          className="tap truncate rounded-full bg-surface px-3 py-1 font-medium text-muted"
        >
          🃏 {t('sd_title')} <span aria-hidden>ⓘ</span>
        </button>
        {phase !== 'setup' && (
          <span className="rounded-full bg-surface px-3 py-1 font-semibold tabular-nums">
            👥 {playerCount} {t('sd_players_short')}
          </span>
        )}
      </div>

      {showHelp && <HowTo t={t} onClose={() => setShowHelp(false)} />}

      {phase === 'setup' && (
        <Setup
          playerCount={playerCount}
          winnerMode={winnerMode}
          onCount={setPlayerCount}
          onMode={setWinnerMode}
          onDeal={onDeal}
          t={t}
        />
      )}

      {phase !== 'setup' && (
        <Table
          slots={slots}
          phase={phase}
          winnerMode={winnerMode}
          highest={highest}
          lowest={lowest}
          onFlip={onFlip}
          onFlipAll={onFlipAll}
          onAgain={onAgain}
          onReset={reset}
          animate={settings.animationEnabled}
          alcoholFree={settings.alcoholFreeMode}
          t={t}
        />
      )}
    </div>
  );
}

// ── Setup: player count + win condition ────────────────────────────────────
function Setup({
  playerCount,
  winnerMode,
  onCount,
  onMode,
  onDeal,
  t,
}: {
  playerCount: number;
  winnerMode: WinnerMode;
  onCount: (n: number) => void;
  onMode: (m: WinnerMode) => void;
  onDeal: () => void;
  t: (key: StringKey) => string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-6 py-4 text-center">
      <div>
        <h2 className="text-2xl font-bold">{t('sd_setup_title')}</h2>
        <p className="mt-1 text-muted">{t('sd_setup_sub')}</p>
      </div>

      {/* Player-count stepper */}
      <div className="flex items-center gap-5">
        <button
          type="button"
          onClick={() => onCount(playerCount - 1)}
          disabled={playerCount <= MIN_PLAYERS}
          aria-label={t('sd_fewer')}
          className="tap flex h-14 w-14 items-center justify-center rounded-full bg-surface text-3xl font-bold text-text shadow disabled:opacity-30"
        >
          −
        </button>
        <div className="flex flex-col items-center">
          <span className="text-6xl font-bold tabular-nums">{playerCount}</span>
          <span className="text-sm text-muted">{t('sd_players')}</span>
        </div>
        <button
          type="button"
          onClick={() => onCount(playerCount + 1)}
          disabled={playerCount >= MAX_PLAYERS}
          aria-label={t('sd_more')}
          className="tap flex h-14 w-14 items-center justify-center rounded-full bg-surface text-3xl font-bold text-text shadow disabled:opacity-30"
        >
          +
        </button>
      </div>

      {/* Colour preview — one dot per player */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {Array.from({ length: playerCount }).map((_, i) => (
          <span
            key={i}
            className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white shadow"
            style={{ backgroundColor: PLAYER_COLORS[i].hex }}
          >
            {i + 1}
          </span>
        ))}
      </div>

      {/* Win condition */}
      <div className="w-full">
        <p className="mb-2 text-sm font-semibold text-muted">{t('sd_winner_mode')}</p>
        <div className="flex flex-col gap-2">
          {WINNER_MODES.map((mode) => {
            const active = winnerMode === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => onMode(mode)}
                aria-pressed={active}
                className={`tap flex items-center justify-between rounded-2xl border px-4 py-3 text-left font-semibold transition ${
                  active
                    ? 'border-brand bg-brand/10 text-brand'
                    : 'border-border bg-surface text-text'
                }`}
              >
                <span>
                  {mode === 'both_lose' ? '💀' : '👑'} {t(MODE_LABEL[mode])}
                </span>
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full border-2 text-xs ${
                    active ? 'border-brand bg-brand text-white' : 'border-border'
                  }`}
                  aria-hidden
                >
                  {active ? '✓' : ''}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <Button variant="primary" onClick={onDeal} className="mt-1 px-8 text-lg">
        🃏 {t('sd_deal')}
      </Button>
    </div>
  );
}

// ── Table: cards laid out; tap to flip (any order), then the result ─────────
function Table({
  slots,
  phase,
  winnerMode,
  highest,
  lowest,
  onFlip,
  onFlipAll,
  onAgain,
  onReset,
  animate,
  alcoholFree,
  t,
}: {
  slots: ShowdownSlot[];
  phase: 'playing' | 'result';
  winnerMode: WinnerMode;
  highest: number[];
  lowest: number[];
  onFlip: (index: number) => void;
  onFlipAll: () => void;
  onAgain: () => void;
  onReset: () => void;
  animate: boolean;
  alcoholFree: boolean;
  t: (key: StringKey) => string;
}) {
  const done = phase === 'result';

  // Who is highlighted, and how, once everything is revealed.
  const winners = winnerMode === 'highest' ? highest : winnerMode === 'lowest' ? lowest : [];
  const losers = winnerMode === 'both_lose' ? [...highest, ...lowest] : [];
  const flippedCount = slots.filter((s) => s.flipped).length;

  return (
    <div className="flex min-h-full flex-col gap-4">
      {/* Prompt / result banner */}
      {done ? (
        <ResultBanner
          winnerMode={winnerMode}
          winners={winners}
          highest={highest}
          lowest={lowest}
          alcoholFree={alcoholFree}
          t={t}
        />
      ) : (
        <div className="text-center">
          <p className="text-lg font-bold">🏁 {t('sd_flip_hint')}</p>
          <p className="mt-1 text-sm text-muted tabular-nums">
            {t('sd_flipped_progress')
              .replace('{a}', String(flippedCount))
              .replace('{b}', String(slots.length))}
          </p>
        </div>
      )}

      {/* The table of cards */}
      <div className="grid grid-cols-2 gap-3">
        {slots.map((slot, i) => {
          const color = PLAYER_COLORS[slot.owner];
          const isWinner = winners.includes(slot.owner);
          const isLoser = losers.includes(slot.owner);
          const badge = done ? (isWinner ? '👑' : isLoser ? '💀' : undefined) : undefined;
          return (
            <div key={slot.owner} className="flex flex-col items-center gap-1">
              {slot.flipped ? (
                <FaceUpTile
                  card={slot.card}
                  ring={color.hex}
                  animate={animate}
                  animKey={i}
                  badge={badge}
                  dim={done && (winners.length > 0 || losers.length > 0) && !isWinner && !isLoser}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => onFlip(i)}
                  aria-label={t('sd_flip_this').replace('{n}', String(slot.owner + 1))}
                  className="tap w-full rounded-2xl transition active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  <CardBackTile ring={color.hex} badge={String(slot.owner + 1)} />
                </button>
              )}
              <span
                className="flex items-center gap-1 text-sm font-semibold"
                style={{ color: color.hex }}
              >
                <span
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[0.65rem] text-white"
                  style={{ backgroundColor: color.hex }}
                >
                  {slot.owner + 1}
                </span>
                {slot.flipped
                  ? t('sd_card_value').replace('{v}', String(cardValue(slot.card)))
                  : ''}
              </span>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="sticky bottom-0 -mx-4 mt-auto flex flex-col gap-2 border-t border-border/60 bg-bg/95 px-4 pb-2 pt-3 backdrop-blur">
        {done ? (
          <Button variant="primary" full onClick={onAgain}>
            🔄 {t('sd_deal_again')}
          </Button>
        ) : (
          <Button variant="primary" full onClick={onFlipAll}>
            👀 {t('sd_flip_all')}
          </Button>
        )}
        <Button className="w-full" onClick={onReset}>
          {t('sd_change_players')}
        </Button>
      </div>
    </div>
  );
}

// The result summary, worded to match the chosen win condition.
function ResultBanner({
  winnerMode,
  winners,
  highest,
  lowest,
  alcoholFree,
  t,
}: {
  winnerMode: WinnerMode;
  winners: number[];
  highest: number[];
  lowest: number[];
  alcoholFree: boolean;
  t: (key: StringKey) => string;
}) {
  const names = (players: number[]) => players.map((p) => `#${p + 1}`).join(', ');
  const colorOf = (players: number[]) =>
    players.length === 1 ? PLAYER_COLORS[players[0]].hex : undefined;

  if (winnerMode === 'both_lose') {
    return (
      <div className="animate-pop-in rounded-2xl border border-danger/40 bg-danger/10 p-4 text-center">
        <p className="text-lg font-bold text-danger">💀 {t('sd_both_lose_title')}</p>
        <p className="mt-2 font-semibold">
          👑 {t(highest.length > 1 ? 'sd_highest_tie' : 'sd_highest')}{' '}
          <span style={{ color: colorOf(highest) }}>{names(highest)}</span>
        </p>
        <p className="mt-1 font-semibold">
          💧 {t(lowest.length > 1 ? 'sd_lowest_tie' : 'sd_lowest')}{' '}
          <span style={{ color: colorOf(lowest) }}>{names(lowest)}</span>
        </p>
        <p className="mt-2 text-sm text-muted">
          {t(alcoholFree ? 'sd_both_lose_hint_af' : 'sd_both_lose_hint')}
        </p>
      </div>
    );
  }

  return (
    <div className="animate-pop-in rounded-2xl border border-brand/40 bg-brand/10 p-4 text-center">
      <p className="text-xl font-bold">
        👑 {t(winners.length > 1 ? 'sd_winner_tie' : 'sd_winner')}{' '}
        <span style={{ color: colorOf(winners) }}>{names(winners)}</span>
      </p>
      <p className="mt-1 text-sm font-semibold text-muted">
        {t(winnerMode === 'highest' ? 'sd_mode_highest' : 'sd_mode_lowest')}
      </p>
      <p className="mt-2 text-sm text-muted">
        {t(alcoholFree ? 'sd_win_hint_af' : 'sd_win_hint')}
      </p>
    </div>
  );
}

// ── Card tiles ─────────────────────────────────────────────────────────────

// Face-down card with a coloured owner ring + player-number badge.
function CardBackTile({ ring, badge }: { ring: string; badge: string }) {
  return (
    <div
      className="relative flex aspect-[3/4.2] w-full items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-strong shadow-lg"
      style={{ boxShadow: `0 0 0 4px ${ring}` }}
    >
      <div className="absolute inset-1.5 rounded-xl border-2 border-white/30" />
      <span className="text-4xl" aria-hidden>
        👑
      </span>
      <span
        className="absolute -right-1.5 -top-1.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold text-white shadow"
        style={{ backgroundColor: ring }}
      >
        {badge}
      </span>
    </div>
  );
}

// Face-up card with a coloured owner ring and an optional 👑 / 💀 badge.
function FaceUpTile({
  card,
  ring,
  animate,
  animKey,
  badge,
  dim,
}: {
  card: Card;
  ring: string;
  animate: boolean;
  animKey: string | number;
  badge?: string;
  dim?: boolean;
}) {
  const red = isRedSuit(card.suit);
  const symbol = SUIT_SYMBOL[card.suit];
  return (
    <div
      key={animKey}
      className={`relative flex aspect-[3/4.2] w-full flex-col justify-between rounded-2xl border-2 bg-white p-2 shadow-lg transition ${
        red ? 'text-rose-600' : 'text-neutral-900'
      } ${animate ? 'animate-card-flip' : ''} ${dim ? 'opacity-45' : ''}`}
      style={{ borderColor: ring, boxShadow: `0 0 0 3px ${ring}` }}
    >
      <span className="text-lg font-bold leading-none">{card.rank}</span>
      <span className="self-center text-4xl leading-none" aria-hidden>
        {symbol}
      </span>
      <span className="rotate-180 self-end text-lg font-bold leading-none">{card.rank}</span>
      {badge && (
        <span className="absolute -right-2 -top-2 text-2xl drop-shadow" aria-hidden>
          {badge}
        </span>
      )}
    </div>
  );
}

// ── How to play ────────────────────────────────────────────────────────────
function HowTo({ t, onClose }: { t: (key: StringKey) => string; onClose: () => void }) {
  const steps: StringKey[] = ['sd_howto_1', 'sd_howto_2', 'sd_howto_3', 'sd_howto_4'];
  return (
    <div className="animate-pop-in rounded-2xl border border-brand/40 bg-brand/10 p-4 text-sm">
      <div className="flex items-start justify-between gap-2">
        <h2 className="font-bold text-text">📖 {t('sd_howto')}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common_close')}
          className="tap -m-2 flex items-center justify-center text-lg text-muted"
        >
          ✕
        </button>
      </div>
      <p className="mt-2 leading-relaxed text-muted">{t('sd_howto_intro')}</p>
      <ol className="mt-3 flex flex-col gap-2">
        {steps.map((key, i) => (
          <li key={key} className="flex gap-2">
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
              {i + 1}
            </span>
            <span className="leading-relaxed text-text">{t(key)}</span>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-xs text-muted">💡 {t('sd_howto_note')}</p>
    </div>
  );
}
