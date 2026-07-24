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
