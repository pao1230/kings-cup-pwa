import { useState } from 'react';
import {
  useShowdown,
  PLAYER_COLORS,
  WINNER_MODES,
  REVEAL_MODES,
  MIN_PLAYERS,
  MAX_PLAYERS,
  type WinnerMode,
  type RevealMode,
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

// Labels for the reveal-mode segmented control.
const REVEAL_LABEL: Record<RevealMode, { label: StringKey; icon: string }> = {
  each: { label: 'sd_reveal_each', icon: '🙌' },
  together: { label: 'sd_reveal_together', icon: '🎬' },
};

export default function ShowdownPage() {
  const t = useT();
  const settings = useSettings();

  const playerCount = useShowdown((s) => s.playerCount);
  const winnerMode = useShowdown((s) => s.winnerMode);
  const revealMode = useShowdown((s) => s.revealMode);
  const phase = useShowdown((s) => s.phase);
  const slots = useShowdown((s) => s.slots);
  const highest = useShowdown((s) => s.highest);
  const lowest = useShowdown((s) => s.lowest);
  const setPlayerCount = useShowdown((s) => s.setPlayerCount);
  const setWinnerMode = useShowdown((s) => s.setWinnerMode);
  const setRevealMode = useShowdown((s) => s.setRevealMode);
  const deal = useShowdown((s) => s.deal);
  const claim = useShowdown((s) => s.claim);
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

  const onClaim = (index: number) => {
    claim(index);
    playDraw(settings.soundEnabled);
    haptic(settings.hapticEnabled, 15);
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
          revealMode={revealMode}
          onCount={setPlayerCount}
          onMode={setWinnerMode}
          onRevealMode={setRevealMode}
          onDeal={onDeal}
          t={t}
        />
      )}

      {phase !== 'setup' && (
        <Table
          slots={slots}
          phase={phase}
          winnerMode={winnerMode}
          revealMode={revealMode}
          highest={highest}
          lowest={lowest}
          onClaim={onClaim}
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
  revealMode,
  onCount,
  onMode,
  onRevealMode,
  onDeal,
  t,
}: {
  playerCount: number;
  winnerMode: WinnerMode;
  revealMode: RevealMode;
  onCount: (n: number) => void;
  onMode: (m: WinnerMode) => void;
  onRevealMode: (m: RevealMode) => void;
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

      {/* Reveal mode — race to flip each card, or reveal them all at once */}
      <div className="w-full">
        <p className="mb-2 text-sm font-semibold text-muted">{t('sd_reveal_mode')}</p>
        <div className="grid grid-cols-2 gap-2">
          {REVEAL_MODES.map((mode) => {
            const active = revealMode === mode;
            const { label, icon } = REVEAL_LABEL[mode];
            return (
              <button
                key={mode}
                type="button"
                onClick={() => onRevealMode(mode)}
                aria-pressed={active}
                className={`tap flex flex-col items-center gap-1 rounded-2xl border px-3 py-3 text-center text-sm font-semibold transition ${
                  active
                    ? 'border-brand bg-brand/10 text-brand'
                    : 'border-border bg-surface text-text'
                }`}
              >
                <span className="text-xl" aria-hidden>
                  {icon}
                </span>
                {t(label)}
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
  revealMode,
  highest,
  lowest,
  onClaim,
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
  revealMode: RevealMode;
  highest: number[];
  lowest: number[];
  onClaim: (index: number) => void;
  onFlip: (index: number) => void;
  onFlipAll: () => void;
  onAgain: () => void;
  onReset: () => void;
  animate: boolean;
  alcoholFree: boolean;
  t: (key: StringKey) => string;
}) {
  const done = phase === 'result';
  const together = revealMode === 'together';

  // Who is highlighted, and how, once everything is revealed.
  const winners = winnerMode === 'highest' ? highest : winnerMode === 'lowest' ? lowest : [];
  const losers = winnerMode === 'both_lose' ? [...highest, ...lowest] : [];
  const flippedCount = slots.filter((s) => s.flipped).length;
  const claimedCount = slots.filter((s) => s.order !== null).length;
  const allClaimed = slots.length > 0 && claimedCount === slots.length;

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
          <p className="text-lg font-bold">
            {together
              ? `🖐️ ${t(allClaimed ? 'sd_all_claimed' : 'sd_flip_hint_together')}`
              : `🏁 ${t('sd_flip_hint')}`}
          </p>
          <p className="mt-1 text-sm text-muted tabular-nums">
            {together
              ? t('sd_claimed_progress')
                  .replace('{a}', String(claimedCount))
                  .replace('{b}', String(slots.length))
              : t('sd_flipped_progress')
                  .replace('{a}', String(flippedCount))
                  .replace('{b}', String(slots.length))}
          </p>
        </div>
      )}

      {/* The table — a felt surface with cards tossed onto it, left wherever
          they landed (each card carries its own %-position and tilt). */}
      <div
        className="relative flex-1 overflow-hidden rounded-3xl border-4 border-[#5c3a21] shadow-inner"
        style={{
          minHeight: '20rem',
          background:
            'radial-gradient(ellipse at 50% 42%, #2e8f5b 0%, #1b7346 45%, #0f4f30 100%)',
          boxShadow: 'inset 0 0 60px rgba(0,0,0,0.45)',
        }}
      >
        {slots.map((slot, i) => {
          // A card only has a player identity once it has been claimed (pressed);
          // `order` is null until then, so unpicked cards render colourless.
          const claimed = slot.order !== null;
          const color = claimed ? PLAYER_COLORS[slot.order as number].hex : undefined;
          const isWinner = claimed && winners.includes(slot.order as number);
          const isLoser = claimed && losers.includes(slot.order as number);
          const badge = done ? (isWinner ? '👑' : isLoser ? '💀' : undefined) : undefined;
          const dim = done && (winners.length > 0 || losers.length > 0) && !isWinner && !isLoser;
          const highlighted = done && (isWinner || isLoser);
          return (
            <div
              key={slot.id}
              className="absolute w-[4rem] sm:w-[4.75rem]"
              style={{
                left: `${slot.x}%`,
                top: `${slot.y}%`,
                transform: `translate(-50%, -50%) rotate(${slot.rot}deg)`,
                zIndex: highlighted ? 20 : 10 - Math.floor(i / 2),
              }}
            >
              {slot.flipped ? (
                <FaceUpTile
                  card={slot.card}
                  owner={(slot.order as number) + 1}
                  color={color as string}
                  animate={animate}
                  animKey={i}
                  badge={badge}
                  dim={dim}
                />
              ) : together && claimed ? (
                // Reveal-together: claimed but still face-down — shows its colour,
                // waits for the single reveal.
                <div
                  className="w-full"
                  style={
                    animate ? { animation: `card-toss 0.4s ease-out ${i * 0.07}s both` } : undefined
                  }
                >
                  <CardBackTile color={color} owner={(slot.order as number) + 1} />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => (together ? onClaim(i) : onFlip(i))}
                  aria-label={t(together ? 'sd_claim_card' : 'sd_flip_card')}
                  className="block w-full rounded-xl transition active:scale-[0.94] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  style={
                    animate
                      ? { animation: `card-toss 0.4s ease-out ${i * 0.07}s both` }
                      : undefined
                  }
                >
                  <CardBackTile />
                </button>
              )}
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
        ) : together ? (
          <Button variant="primary" full disabled={!allClaimed} onClick={onFlipAll}>
            👀 {allClaimed ? t('sd_reveal_all_btn') : t('sd_reveal_waiting')}
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

// A small owner chip (coloured circle + player number) pinned to a card corner.
function OwnerChip({ color, owner }: { color: string; owner: number }) {
  return (
    <span
      className="absolute -left-1.5 -top-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white shadow"
      style={{ backgroundColor: color }}
    >
      {owner}
    </span>
  );
}

// Face-down card as it sits on the table. Neutral / colourless until a player
// claims it; once claimed (reveal-together mode) it shows the owner's colour ring
// and number while staying face-down, until the group reveal flips it.
function CardBackTile({ color, owner }: { color?: string; owner?: number } = {}) {
  const claimed = !!color;
  return (
    <div
      className={`relative flex aspect-[3/4.2] w-full items-center justify-center rounded-xl shadow-xl ${
        claimed ? 'bg-gradient-to-br from-brand to-brand-strong' : 'bg-gradient-to-br from-slate-500 to-slate-700'
      }`}
      style={{
        boxShadow: claimed
          ? `0 0 0 3px ${color}, 0 6px 14px rgba(0,0,0,0.4)`
          : '0 0 0 2px rgba(255,255,255,0.15), 0 6px 14px rgba(0,0,0,0.4)',
      }}
    >
      <div className="absolute inset-1 rounded-lg border-2 border-white/25" />
      <span className={`text-3xl ${claimed ? '' : 'opacity-80'}`} aria-hidden>
        👑
      </span>
      {claimed && owner !== undefined && <OwnerChip color={color as string} owner={owner} />}
    </div>
  );
}

// Face-up card with a coloured owner ring, number chip, and 👑 / 💀 badge.
function FaceUpTile({
  card,
  owner,
  color,
  animate,
  animKey,
  badge,
  dim,
}: {
  card: Card;
  owner: number;
  color: string;
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
      className={`relative flex aspect-[3/4.2] w-full flex-col justify-between rounded-xl border-2 bg-white p-1.5 transition ${
        red ? 'text-rose-600' : 'text-neutral-900'
      } ${animate ? 'animate-card-flip' : ''} ${dim ? 'opacity-45' : ''}`}
      style={{
        borderColor: color,
        boxShadow: `0 0 0 3px ${color}, 0 6px 14px rgba(0,0,0,0.4)`,
      }}
    >
      <span className="text-base font-bold leading-none">{card.rank}</span>
      <span className="self-center text-3xl leading-none" aria-hidden>
        {symbol}
      </span>
      <span className="rotate-180 self-end text-base font-bold leading-none">{card.rank}</span>
      <OwnerChip color={color} owner={owner} />
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
