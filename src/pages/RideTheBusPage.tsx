import { useState } from 'react';
import { useRtb } from '../store/rideTheBusStore';
import type { RtbChoice, RtbRound } from '../store/rideTheBusStore';
import { useSettings } from '../store/settingsStore';
import { useT } from '../i18n/useT';
import type { StringKey } from '../i18n/strings';
import PlayingCard, { MiniCard, CardBack } from '../components/PlayingCard';
import { SUIT_SYMBOL } from '../lib/deck';
import { Button } from '../components/ui';
import { useWakeLock } from '../lib/wakeLock';
import { haptic } from '../lib/util';
import { playDraw, playWin, playWrong } from '../lib/sound';
import type { Suit } from '../types';

// Each round's short step label (for the progress strip) and its prompt.
const STEPS: { label: StringKey; prompt: StringKey }[] = [
  { label: 'rtb_step_color', prompt: 'rtb_prompt_color' },
  { label: 'rtb_step_highlow', prompt: 'rtb_prompt_highlow' },
  { label: 'rtb_step_inout', prompt: 'rtb_prompt_inout' },
  { label: 'rtb_step_suit', prompt: 'rtb_prompt_suit' },
];

const SUIT_CHOICES: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];

export default function RideTheBusPage() {
  const t = useT();
  const settings = useSettings();

  const deck = useRtb((s) => s.deck);
  const revealed = useRtb((s) => s.revealed);
  const round = useRtb((s) => s.round);
  const status = useRtb((s) => s.status);
  const lastCorrect = useRtb((s) => s.lastCorrect);
  const wins = useRtb((s) => s.wins);
  const fails = useRtb((s) => s.fails);
  const guess = useRtb((s) => s.guess);
  const next = useRtb((s) => s.next);
  const start = useRtb((s) => s.start);

  const [showHelp, setShowHelp] = useState(false);

  // Keep the screen awake while a run is in progress.
  useWakeLock(status !== 'won');

  const onGuess = (choice: RtbChoice) => {
    const card = guess(choice);
    if (!card) return;
    playDraw(settings.soundEnabled);
    haptic(settings.hapticEnabled, 15);
  };

  const onContinue = () => {
    const willWin = lastCorrect && round === 3;
    if (lastCorrect) {
      if (willWin) {
        playWin(settings.soundEnabled);
        haptic(settings.hapticEnabled, [20, 40, 20, 40, 60]);
      } else {
        haptic(settings.hapticEnabled, 10);
      }
    } else {
      playWrong(settings.soundEnabled);
      haptic(settings.hapticEnabled, [40, 30, 60]);
    }
    next();
  };

  const onNewGame = () => {
    start();
    haptic(settings.hapticEnabled, 10);
  };

  if (status === 'won') {
    return (
      <Won
        cards={revealed}
        wins={wins}
        fails={fails}
        title={t('rtb_won_title')}
        sub={t(settings.alcoholFreeMode ? 'rtb_won_sub_af' : 'rtb_won_sub')}
        btn={t('rtb_new_game')}
        onNew={onNewGame}
      />
    );
  }

  // During "guessing" the revealed array holds only past-round context cards and
  // the active card is face-down; during "result" the just-drawn card is the
  // last of `revealed` and the earlier ones form the context strip.
  const context = status === 'guessing' ? revealed : revealed.slice(0, round);
  const activeCard = status === 'result' ? revealed[round] : null;

  const drinkText = t(settings.alcoholFreeMode ? 'rtb_drink_af' : 'rtb_drink').replace(
    '{n}',
    String(round + 1),
  );

  return (
    <div className="flex min-h-full flex-col gap-4">
      {/* Header: title (also the how-to toggle) + session tally */}
      <div className="flex items-center justify-between gap-2 text-sm">
        <button
          type="button"
          onClick={() => setShowHelp((v) => !v)}
          aria-expanded={showHelp}
          className="tap truncate rounded-full bg-surface px-3 py-1 font-medium text-muted"
        >
          🚌 {t('rtb_title')} <span aria-hidden>ⓘ</span>
        </button>
        <div className="flex items-center gap-2 tabular-nums">
          <span className="rounded-full bg-surface px-3 py-1 font-semibold">
            🏆 {t('rtb_wins')} {wins}
          </span>
          <span className="rounded-full bg-surface px-3 py-1 font-semibold text-muted">
            💧 {t('rtb_fails')} {fails}
          </span>
        </div>
      </div>

      {/* How to play — collapsible, toggled from the title */}
      {showHelp && <HowTo t={t} onClose={() => setShowHelp(false)} />}

      {/* Progress strip: one pill per round */}
      <ol className="flex gap-1.5">
        {STEPS.map((step, i) => {
          const done = i < round || (i === round && status === 'result' && !!lastCorrect);
          const isCurrent = i === round && !done;
          return (
            <li
              key={step.label}
              className={`flex-1 rounded-full px-1 py-1 text-center text-[0.7rem] font-semibold transition ${
                done
                  ? 'bg-brand/15 text-brand'
                  : isCurrent
                    ? 'bg-brand text-white'
                    : 'bg-surface text-muted'
              }`}
            >
              {done ? '✓ ' : `${i + 1}. `}
              {t(step.label)}
            </li>
          );
        })}
      </ol>

      {/* Prompt */}
      <p className="text-center text-lg font-bold">{t(STEPS[round].prompt)}</p>

      {/* Context strip: cards revealed in earlier rounds */}
      {context.length > 0 && (
        <div className="flex justify-center gap-2">
          {context.map((c, i) => (
            <MiniCard key={i} card={c} />
          ))}
        </div>
      )}

      {/* Active card: face-down until answered, then flips to the drawn card */}
      <div className="mx-auto w-full max-w-[12rem] flex-shrink-0">
        {activeCard ? (
          <PlayingCard card={activeCard} animate={settings.animationEnabled} animKey={revealed.length} />
        ) : (
          <CardBack label={t('rtb_facedown_hint')} />
        )}
      </div>

      {/* Result feedback */}
      <div className="min-h-[3.5rem] text-center">
        {status === 'result' &&
          (lastCorrect ? (
            <p className="animate-pop-in text-xl font-bold text-emerald-600 dark:text-emerald-400">
              ✅ {t('rtb_correct')}
            </p>
          ) : (
            <div className="animate-pop-in">
              <p className="text-xl font-bold text-danger">❌ {t('rtb_wrong')}</p>
              <p className="mt-1 font-semibold text-danger">{drinkText}</p>
            </div>
          ))}
      </div>

      {/* Controls */}
      <div className="sticky bottom-0 -mx-4 mt-auto flex flex-col gap-2 border-t border-border/60 bg-bg/95 px-4 pb-2 pt-3 backdrop-blur">
        {status === 'guessing' ? (
          <RoundChoices round={round} deckEmpty={deck.length === 0} onGuess={onGuess} t={t} />
        ) : lastCorrect ? (
          <Button variant="primary" full onClick={onContinue}>
            {t('rtb_continue')} →
          </Button>
        ) : (
          <Button variant="danger" full onClick={onContinue}>
            🔄 {t('rtb_ride_again')}
          </Button>
        )}
        <Button className="w-full" onClick={onNewGame}>
          {t('rtb_new_game')}
        </Button>
      </div>
    </div>
  );
}

// Collapsible "how to play" panel toggled from the header title.
function HowTo({ t, onClose }: { t: (key: StringKey) => string; onClose: () => void }) {
  const steps: StringKey[] = ['rtb_howto_1', 'rtb_howto_2', 'rtb_howto_3', 'rtb_howto_4'];
  return (
    <div className="animate-pop-in rounded-2xl border border-brand/40 bg-brand/10 p-4 text-sm">
      <div className="flex items-start justify-between gap-2">
        <h2 className="font-bold text-text">📖 {t('rtb_howto')}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common_close')}
          className="tap -m-2 flex items-center justify-center text-lg text-muted"
        >
          ✕
        </button>
      </div>
      <p className="mt-2 leading-relaxed text-muted">{t('rtb_howto_intro')}</p>
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
      <p className="mt-3 text-xs text-muted">💡 {t('rtb_howto_note')}</p>
    </div>
  );
}

// The two- or four-way guess buttons for the current round.
function RoundChoices({
  round,
  deckEmpty,
  onGuess,
  t,
}: {
  round: RtbRound;
  deckEmpty: boolean;
  onGuess: (choice: RtbChoice) => void;
  t: (key: StringKey) => string;
}) {
  if (round === 3) {
    return (
      <div className="grid grid-cols-4 gap-2">
        {SUIT_CHOICES.map((suit) => {
          const red = suit === 'hearts' || suit === 'diamonds';
          return (
            <Button
              key={suit}
              variant="secondary"
              disabled={deckEmpty}
              onClick={() => onGuess(suit)}
              className={`text-2xl ${red ? 'text-rose-600' : 'text-text'}`}
              aria-label={suit}
            >
              {SUIT_SYMBOL[suit]}
            </Button>
          );
        })}
      </div>
    );
  }

  const pairs: Record<0 | 1 | 2, [RtbChoice, StringKey, string][]> = {
    0: [
      ['red', 'rtb_red', '🔴'],
      ['black', 'rtb_black', '⚫'],
    ],
    1: [
      ['higher', 'rtb_higher', '⬆️'],
      ['lower', 'rtb_lower', '⬇️'],
    ],
    2: [
      ['inside', 'rtb_inside', '↔️'],
      ['outside', 'rtb_outside', '⨯'],
    ],
  };
  const options = pairs[round as 0 | 1 | 2];
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map(([choice, key, icon]) => (
        <Button key={choice} variant="primary" disabled={deckEmpty} onClick={() => onGuess(choice)}>
          {icon} {t(key)}
        </Button>
      ))}
    </div>
  );
}

function Won({
  cards,
  wins,
  fails,
  title,
  sub,
  btn,
  onNew,
}: {
  cards: import('../types').Card[];
  wins: number;
  fails: number;
  title: string;
  sub: string;
  btn: string;
  onNew: () => void;
}) {
  const t = useT();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-8 text-center animate-pop-in">
      <span className="text-7xl" aria-hidden>
        🎉
      </span>
      <h2 className="text-3xl font-bold">{title}</h2>
      <p className="text-muted">{sub}</p>
      <div className="flex justify-center gap-2">
        {cards.map((c, i) => (
          <MiniCard key={i} card={c} />
        ))}
      </div>
      <div className="mt-1 flex gap-2 text-sm tabular-nums text-muted">
        <span className="rounded-full bg-surface px-3 py-1 font-semibold">
          🏆 {t('rtb_wins')} {wins}
        </span>
        <span className="rounded-full bg-surface px-3 py-1 font-semibold">
          💧 {t('rtb_fails')} {fails}
        </span>
      </div>
      <Button variant="primary" onClick={onNew} className="mt-2">
        🔄 {btn}
      </Button>
    </div>
  );
}
