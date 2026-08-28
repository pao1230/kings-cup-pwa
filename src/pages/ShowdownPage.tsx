import { useState } from 'react';
import {
  useShowdown,
  PLAYER_COLORS,
  MIN_PLAYERS,
  MAX_PLAYERS,
  cardValue,
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

export default function ShowdownPage() {
  const t = useT();
  const settings = useSettings();

  const playerCount = useShowdown((s) => s.playerCount);
  const phase = useShowdown((s) => s.phase);
  const slots = useShowdown((s) => s.slots);
  const currentPlayer = useShowdown((s) => s.currentPlayer);
  const highest = useShowdown((s) => s.highest);
  const lowest = useShowdown((s) => s.lowest);
  const setPlayerCount = useShowdown((s) => s.setPlayerCount);
  const deal = useShowdown((s) => s.deal);
  const claim = useShowdown((s) => s.claim);
  const reveal = useShowdown((s) => s.reveal);
  const again = useShowdown((s) => s.again);
  const reset = useShowdown((s) => s.reset);

  const [showHelp, setShowHelp] = useState(false);

  // Keep the screen awake while a round is being set up or played.
  useWakeLock(phase !== 'setup');

  const claimedCount = slots.filter((s) => s.owner !== null).length;
  const allClaimed = slots.length > 0 && claimedCount === slots.length;

  const onDeal = () => {
    deal();
    playDraw(settings.soundEnabled);
    haptic(settings.hapticEnabled, 12);
  };

  const onClaim = (index: number) => {
    claim(index);
    playDraw(settings.soundEnabled);
    haptic(settings.hapticEnabled, 15);
  };

  const onReveal = () => {
    reveal();
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
      {/* Header: title (how-to toggle) + progress */}
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
          onChange={setPlayerCount}
          onDeal={onDeal}
          t={t}
        />
      )}

      {phase === 'claiming' && (
        <Claiming
          slots={slots}
          currentPlayer={currentPlayer}
          allClaimed={allClaimed}
          onClaim={onClaim}
          onReveal={onReveal}
          onReset={reset}
          animate={settings.animationEnabled}
          t={t}
        />
      )}

      {phase === 'revealed' && (
        <Revealed
          slots={slots}
          highest={highest}
          lowest={lowest}
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

// ── Setup: pick how many players are in ────────────────────────────────────
function Setup({
  playerCount,
  onChange,
  onDeal,
  t,
}: {
  playerCount: number;
  onChange: (n: number) => void;
  onDeal: () => void;
  t: (key: StringKey) => string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 py-6 text-center">
      <div>
        <h2 className="text-2xl font-bold">{t('sd_setup_title')}</h2>
        <p className="mt-1 text-muted">{t('sd_setup_sub')}</p>
      </div>

      {/* Player-count stepper */}
      <div className="flex items-center gap-5">
        <button
          type="button"
          onClick={() => onChange(playerCount - 1)}
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
          onClick={() => onChange(playerCount + 1)}
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

      <Button variant="primary" onClick={onDeal} className="mt-2 px-8 text-lg">
        🃏 {t('sd_deal')}
      </Button>
    </div>
  );
}

// ── Claiming: each player takes a face-down card in turn ────────────────────
function Claiming({
  slots,
  currentPlayer,
  allClaimed,
  onClaim,
  onReveal,
  onReset,
  animate,
  t,
}: {
  slots: ShowdownSlot[];
  currentPlayer: number;
  allClaimed: boolean;
  onClaim: (index: number) => void;
  onReveal: () => void;
  onReset: () => void;
  animate: boolean;
  t: (key: StringKey) => string;
}) {
  const color = PLAYER_COLORS[currentPlayer];
  return (
    <div className="flex min-h-full flex-col gap-4">
      {/* Turn prompt */}
      {allClaimed ? (
        <p className="text-center text-lg font-bold">{t('sd_all_ready')}</p>
      ) : (
        <p
          className="flex items-center justify-center gap-2 text-center text-lg font-bold"
          style={{ color: color.hex }}
        >
          <span
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-sm text-white"
            style={{ backgroundColor: color.hex }}
          >
            {currentPlayer + 1}
          </span>
          {t('sd_your_turn').replace('{n}', String(currentPlayer + 1))}
        </p>
      )}

      {/* Face-down cards to claim */}
      <div className="grid grid-cols-2 gap-3">
        {slots.map((slot, i) => {
          const claimed = slot.owner !== null;
          const owner = claimed ? PLAYER_COLORS[slot.owner as number] : null;
          return (
            <button
              key={i}
              type="button"
              disabled={claimed || allClaimed}
              onClick={() => onClaim(i)}
              aria-label={
                claimed
                  ? t('sd_claimed_by').replace('{n}', String((slot.owner as number) + 1))
                  : t('sd_pick_this')
              }
              className={`tap relative aspect-[3/4.2] rounded-2xl transition active:scale-[0.97] ${
                claimed ? 'cursor-default' : 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand'
              }`}
            >
              <CardBackTile
                animate={animate && !claimed}
                ring={owner?.hex}
                badge={claimed ? String((slot.owner as number) + 1) : undefined}
              />
            </button>
          );
        })}
      </div>

      {/* Controls */}
      <div className="sticky bottom-0 -mx-4 mt-auto flex flex-col gap-2 border-t border-border/60 bg-bg/95 px-4 pb-2 pt-3 backdrop-blur">
        <Button variant="primary" full disabled={!allClaimed} onClick={onReveal}>
          👀 {t('sd_reveal')}
        </Button>
        <Button className="w-full" onClick={onReset}>
          {t('sd_change_players')}
        </Button>
      </div>
    </div>
  );
}

// ── Revealed: flip everything and crown the winner ─────────────────────────
function Revealed({
  slots,
  highest,
  lowest,
  onAgain,
  onReset,
  animate,
  alcoholFree,
  t,
}: {
  slots: ShowdownSlot[];
  highest: number[];
  lowest: number[];
  onAgain: () => void;
  onReset: () => void;
  animate: boolean;
  alcoholFree: boolean;
  t: (key: StringKey) => string;
}) {
  // Order the reveal grid by player number so colours read left-to-right.
  const byPlayer = [...slots].sort(
    (a, b) => (a.owner as number) - (b.owner as number),
  );

  const nameList = (players: number[]) =>
    players.map((p) => `#${p + 1}`).join(', ');

  return (
    <div className="flex min-h-full flex-col gap-4">
      {/* Result banner */}
      <div className="animate-pop-in rounded-2xl border border-border bg-surface p-4 text-center">
        <p className="text-lg font-bold">
          👑 {t(highest.length > 1 ? 'sd_highest_tie' : 'sd_highest')}{' '}
          <span style={{ color: PLAYER_COLORS[highest[0]].hex }}>{nameList(highest)}</span>
        </p>
        <p className="mt-1 text-lg font-bold">
          💧 {t(lowest.length > 1 ? 'sd_lowest_tie' : 'sd_lowest')}{' '}
          <span style={{ color: PLAYER_COLORS[lowest[0]].hex }}>{nameList(lowest)}</span>
        </p>
        <p className="mt-2 text-sm text-muted">
          {t(alcoholFree ? 'sd_result_hint_af' : 'sd_result_hint')}
        </p>
      </div>

      {/* Cards, face up */}
      <div className="grid grid-cols-2 gap-3">
        {byPlayer.map((slot, i) => {
          const player = slot.owner as number;
          const color = PLAYER_COLORS[player];
          const isHigh = highest.includes(player);
          const isLow = lowest.includes(player);
          return (
            <div key={player} className="flex flex-col items-center gap-1">
              <FaceUpTile
                card={slot.card}
                ring={color.hex}
                animate={animate}
                animKey={i}
                badge={isHigh ? '👑' : isLow ? '💧' : undefined}
              />
              <span
                className="flex items-center gap-1 text-sm font-semibold"
                style={{ color: color.hex }}
              >
                <span
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[0.65rem] text-white"
                  style={{ backgroundColor: color.hex }}
                >
                  {player + 1}
                </span>
                {t('sd_card_value').replace('{v}', String(cardValue(slot.card)))}
              </span>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="sticky bottom-0 -mx-4 mt-auto flex flex-col gap-2 border-t border-border/60 bg-bg/95 px-4 pb-2 pt-3 backdrop-blur">
        <Button variant="primary" full onClick={onAgain}>
          🔄 {t('sd_deal_again')}
        </Button>
        <Button className="w-full" onClick={onReset}>
          {t('sd_change_players')}
        </Button>
      </div>
    </div>
  );
}

// ── Card tiles ─────────────────────────────────────────────────────────────

// Face-down card with an optional coloured owner ring + player-number badge.
function CardBackTile({
  animate,
  ring,
  badge,
}: {
  animate: boolean;
  ring?: string;
  badge?: string;
}) {
  return (
    <div
      className={`relative flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-strong shadow-lg ${
        animate ? 'animate-pop-in' : ''
      }`}
      style={ring ? { boxShadow: `0 0 0 4px ${ring}`, opacity: 0.95 } : undefined}
    >
      <div className="absolute inset-1.5 rounded-xl border-2 border-white/30" />
      <span className="text-4xl" aria-hidden>
        👑
      </span>
      {badge && (
        <span
          className="absolute -right-1.5 -top-1.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold text-white shadow"
          style={{ backgroundColor: ring }}
        >
          {badge}
        </span>
      )}
    </div>
  );
}

// Face-up card with a coloured owner ring and an optional 👑 / 💧 badge.
function FaceUpTile({
  card,
  ring,
  animate,
  animKey,
  badge,
}: {
  card: Card;
  ring: string;
  animate: boolean;
  animKey: string | number;
  badge?: string;
}) {
  const red = isRedSuit(card.suit);
  const symbol = SUIT_SYMBOL[card.suit];
  return (
    <div
      key={animKey}
      className={`relative flex aspect-[3/4.2] w-full flex-col justify-between rounded-2xl border-2 bg-white p-2 shadow-lg ${
        red ? 'text-rose-600' : 'text-neutral-900'
      } ${animate ? 'animate-card-flip' : ''}`}
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
