import { Link } from 'react-router-dom';
import { useT } from '../i18n/useT';
import type { StringKey } from '../i18n/strings';

// The two playable games, shown as big tappable cards on the home screen.
const GAMES: {
  to: string;
  emoji: string;
  nameKey: StringKey;
  descKey: StringKey;
  gradient: string;
}[] = [
  {
    to: '/kings-cup',
    emoji: '👑',
    nameKey: 'appName',
    descKey: 'home_kingscup_desc',
    gradient: 'from-brand to-brand-strong',
  },
  {
    to: '/ride-the-bus',
    emoji: '🚌',
    nameKey: 'rtb_title',
    descKey: 'home_ridethebus_desc',
    gradient: 'from-amber-500 to-orange-600',
  },
];

export default function HomePage() {
  const t = useT();
  return (
    <div className="flex min-h-full flex-col gap-5">
      {/* App title */}
      <header className="pt-2 text-center">
        <h1 className="text-3xl font-bold text-text">👑 {t('appName')}</h1>
        <p className="mt-1 text-muted">{t('home_choose')}</p>
      </header>

      {/* Game cards */}
      <div className="flex flex-col gap-4">
        {GAMES.map((game) => (
          <Link
            key={game.to}
            to={game.to}
            className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${game.gradient} p-5 text-white shadow-xl transition active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand`}
          >
            <div className="absolute -right-4 -top-4 text-8xl opacity-20 transition group-hover:scale-110" aria-hidden>
              {game.emoji}
            </div>
            <div className="relative flex flex-col gap-2">
              <span className="text-4xl" aria-hidden>
                {game.emoji}
              </span>
              <h2 className="text-2xl font-bold">{t(game.nameKey)}</h2>
              <p className="text-sm leading-relaxed text-white/90">{t(game.descKey)}</p>
              <span className="mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-white/20 px-4 py-1.5 text-sm font-semibold backdrop-blur">
                ▶ {t('home_play')}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Responsible-drinking note */}
      <div className="mt-auto rounded-2xl border border-border bg-surface p-4 text-center">
        <p className="font-semibold text-text">⚠️ {t('warn_title')}</p>
        <p className="mt-1 text-sm text-muted">{t('warn_body')}</p>
      </div>
    </div>
  );
}
