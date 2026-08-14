import type { Card } from '../types';
import { SUIT_SYMBOL, isRedSuit } from '../lib/deck';

// Face-up card. `animate` keys the flip animation on each new draw.
export default function PlayingCard({
  card,
  animate,
  animKey,
}: {
  card: Card;
  animate: boolean;
  animKey: string | number;
}) {
  const red = isRedSuit(card.suit);
  const symbol = SUIT_SYMBOL[card.suit];
  return (
    <div
      key={animKey}
      style={{ perspective: 1000 }}
      className={`relative aspect-[3/4.2] w-full rounded-3xl border border-border bg-white shadow-2xl ${
        animate ? 'animate-card-flip' : ''
      }`}
    >
      <div
        className={`flex h-full w-full flex-col justify-between p-4 ${
          red ? 'text-rose-600' : 'text-neutral-900'
        }`}
      >
        <div className="flex flex-col items-start leading-none">
          <span className="text-3xl font-bold">{card.rank}</span>
          <span className="text-2xl">{symbol}</span>
        </div>

        <span className="self-center text-[5.5rem] leading-none sm:text-[7rem]" aria-hidden>
          {symbol}
        </span>

        <div className="flex flex-col items-end leading-none">
          <span className="rotate-180 text-3xl font-bold">{card.rank}</span>
          <span className="rotate-180 text-2xl">{symbol}</span>
        </div>
      </div>
    </div>
  );
}

// Compact face-up card for showing a row of previously revealed cards
// (used by the Ride the Bus context strip). Relative units keep it legible
// at any width.
export function MiniCard({ card }: { card: Card }) {
  const red = isRedSuit(card.suit);
  const symbol = SUIT_SYMBOL[card.suit];
  return (
    <div
      className={`flex aspect-[3/4.2] w-12 flex-col justify-between rounded-lg border border-border bg-white p-1 shadow-md ${
        red ? 'text-rose-600' : 'text-neutral-900'
      }`}
    >
      <span className="text-sm font-bold leading-none">{card.rank}</span>
      <span className="self-center text-lg leading-none" aria-hidden>
        {symbol}
      </span>
      <span className="rotate-180 self-end text-sm font-bold leading-none">{card.rank}</span>
    </div>
  );
}

// The face-down deck placeholder shown before the first draw.
export function CardBack({ label }: { label: string }) {
  return (
    <div className="relative flex aspect-[3/4.2] w-full items-center justify-center rounded-3xl bg-gradient-to-br from-brand to-brand-strong shadow-2xl">
      <div className="absolute inset-2 rounded-2xl border-2 border-white/30" />
      <div className="flex flex-col items-center gap-3 text-white">
        <span className="text-6xl" aria-hidden>
          👑
        </span>
        <span className="px-6 text-center text-sm font-medium text-white/90">{label}</span>
      </div>
    </div>
  );
}

// Riffle animation shown briefly while a new game is being shuffled.
export function ShuffleDeck({ label }: { label: string }) {
  return (
    <div className="relative aspect-[3/4.2] w-full" role="img" aria-label={label}>
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="absolute inset-0 rounded-3xl bg-gradient-to-br from-brand to-brand-strong shadow-2xl"
          style={{ animation: `card-shuffle 0.55s ease-in-out ${i * 0.09}s infinite` }}
        >
          <div className="absolute inset-2 rounded-2xl border-2 border-white/30" />
        </div>
      ))}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="animate-pop-in text-6xl drop-shadow-lg" aria-hidden>
          🔀
        </span>
      </div>
    </div>
  );
}
