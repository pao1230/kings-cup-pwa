import { useState } from 'react';
import { useGame } from '../store/gameStore';
import { useRuleSets } from '../store/ruleSetStore';
import { useSettings } from '../store/settingsStore';
import { useT } from '../i18n/useT';
import PlayingCard, { CardBack } from '../components/PlayingCard';
import { Button } from '../components/ui';
import { useWakeLock } from '../lib/wakeLock';
import { haptic, applyAlcoholFree } from '../lib/util';
import { playDraw, playKing } from '../lib/sound';

export default function GamePage() {
  const t = useT();
  const settings = useSettings();
  const activeRuleSet = useRuleSets((s) => s.getActive());
  const activeRuleSetId = useRuleSets((s) => s.activeRuleSetId);

  const session = useGame((s) => s.session);
  const draw = useGame((s) => s.draw);
  const undo = useGame((s) => s.undo);
  const start = useGame((s) => s.start);

  const [confirmRestart, setConfirmRestart] = useState(false);

  useWakeLock(!!session && session.deck.length > 0);

  if (!session || !activeRuleSet) return null;

  const remaining = session.deck.length;
  const total = session.deck.length + session.drawn.length;
  const current = session.drawn[session.drawn.length - 1] ?? null;
  const isOver = remaining === 0 && session.drawn.length > 0;
  const currentRule = current
    ? activeRuleSet.rules.find((r) => r.rank === current.rank)
    : null;
  const isLastKing = current?.rank === 'K' && session.kingsDrawn === 4;

  const onDraw = () => {
    const card = draw();
    if (!card) return;
    haptic(settings.hapticEnabled, card.rank === 'K' ? [20, 40, 20] : 15);
    if (card.rank === 'K') playKing(settings.soundEnabled);
    else playDraw(settings.soundEnabled);
  };

  const onRestart = () => {
    if (!confirmRestart) {
      setConfirmRestart(true);
      return;
    }
    setConfirmRestart(false);
    if (activeRuleSetId) start(activeRuleSetId);
  };

  return (
    <div className="flex min-h-full flex-col gap-4">
      {/* Status bar: rule set · remaining · kings (FR-1.3 / FR-1.6) */}
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="truncate rounded-full bg-surface px-3 py-1 font-medium text-muted">
          {activeRuleSet.name}
        </span>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-surface px-3 py-1 font-semibold tabular-nums">
            {t('game_remaining')} {remaining}/{total}
          </span>
          <span
            className={`rounded-full px-3 py-1 font-semibold ${
              session.kingsDrawn === 4 ? 'bg-danger text-white' : 'bg-surface'
            }`}
            title={t('game_kings')}
          >
            👑 {session.kingsDrawn}/4
          </span>
        </div>
      </div>

      {isOver ? (
        <GameOver
          onNew={() => activeRuleSetId && start(activeRuleSetId)}
          title={t('game_over_title')}
          sub={t('game_over_sub')}
          btn={t('game_over_new')}
        />
      ) : (
        <>
          {/* Card area (FR-1.1) */}
          <div className="mx-auto w-full max-w-[16rem] flex-shrink-0">
            {current ? (
              <PlayingCard card={current} animate={settings.animationEnabled} animKey={session.drawn.length} />
            ) : (
              <CardBack label={t('game_shuffle_hint')} />
            )}
          </div>

          {/* Rule for the current card (FR-1.2) */}
          <div className="flex-1">
            {currentRule && (
              <div
                className={`animate-pop-in rounded-2xl border p-4 ${
                  isLastKing
                    ? 'border-danger bg-danger/10'
                    : currentRule.isSpecial
                      ? 'border-brand bg-brand/10'
                      : 'border-border bg-surface'
                }`}
              >
                <div className="flex items-center gap-2">
                  {currentRule.icon && <span className="text-2xl">{currentRule.icon}</span>}
                  <h2 className="text-xl font-bold">{currentRule.title}</h2>
                </div>
                {currentRule.description && (
                  <p className="mt-2 leading-relaxed text-muted">
                    {applyAlcoholFree(currentRule.description, settings.alcoholFreeMode)}
                  </p>
                )}
                {isLastKing && (
                  <p className="mt-3 font-semibold text-danger">{t('game_last_king')}</p>
                )}
              </div>
            )}
          </div>

          {/* Controls (FR-1.5 / FR-1.7). Solid backdrop + full-bleed so that on
              short screens the rule text scrolls cleanly behind this bar instead
              of bleeding through it. */}
          <div className="sticky bottom-0 -mx-4 mt-auto flex flex-col gap-2 border-t border-border/60 bg-bg/95 px-4 pb-2 pt-3 backdrop-blur">
            <Button variant="primary" full onClick={onDraw} disabled={remaining === 0}>
              {t('game_draw')} · {remaining} {t('game_cards')}
            </Button>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={undo}
                disabled={session.drawn.length === 0}
              >
                ↩︎ {t('game_undo')}
              </Button>
              <Button
                variant={confirmRestart ? 'danger' : 'secondary'}
                className="flex-1"
                onClick={onRestart}
                onBlur={() => setConfirmRestart(false)}
              >
                {confirmRestart ? t('common_confirm') : t('game_restart')}
              </Button>
            </div>
            {confirmRestart && (
              <p className="text-center text-sm text-muted">{t('game_restart_confirm')}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function GameOver({
  onNew,
  title,
  sub,
  btn,
}: {
  onNew: () => void;
  title: string;
  sub: string;
  btn: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-10 text-center animate-pop-in">
      <span className="text-7xl" aria-hidden>
        🏁
      </span>
      <h2 className="text-3xl font-bold">{title}</h2>
      <p className="text-muted">{sub}</p>
      <Button variant="primary" onClick={onNew} className="mt-2">
        🔄 {btn}
      </Button>
    </div>
  );
}
