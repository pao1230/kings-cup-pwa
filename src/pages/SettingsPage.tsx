import { useState } from 'react';
import type { Language, ThemeMode } from '../types';
import { useSettings } from '../store/settingsStore';
import { useRuleSets } from '../store/ruleSetStore';
import { useGame } from '../store/gameStore';
import { useT } from '../i18n/useT';
import { Button, PageHeader, Toggle } from '../components/ui';
import { resetAllData } from '../lib/storage';

const APP_VERSION = '1.0.0';

export default function SettingsPage() {
  const t = useT();
  const s = useSettings();
  const set = useSettings((st) => st.set);
  const initRuleSets = useRuleSets((st) => st.init);
  const startGame = useGame((st) => st.start);

  const [confirmReset, setConfirmReset] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const onReset = async () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    await resetAllData();
    await initRuleSets();
    const activeId = useRuleSets.getState().activeRuleSetId;
    if (activeId) startGame(activeId);
    useSettings.getState().replaceAll({
      language: s.language,
      theme: s.theme,
      soundEnabled: true,
      animationEnabled: true,
      hapticEnabled: true,
      alcoholFreeMode: false,
    });
    setConfirmReset(false);
    setResetDone(true);
    setTimeout(() => setResetDone(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('settings_title')} />

      {/* Language (FR-4.1) */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          {t('settings_language')}
        </h2>
        <Segmented<Language>
          value={s.language}
          onChange={(v) => set('language', v)}
          options={[
            { value: 'th', label: 'ไทย' },
            { value: 'en', label: 'English' },
          ]}
        />
      </section>

      {/* Theme (FR-4.2) */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          {t('settings_theme')}
        </h2>
        <Segmented<ThemeMode>
          value={s.theme}
          onChange={(v) => set('theme', v)}
          options={[
            { value: 'light', label: `☀️ ${t('settings_theme_light')}` },
            { value: 'dark', label: `🌙 ${t('settings_theme_dark')}` },
            { value: 'system', label: `⚙️ ${t('settings_theme_system')}` },
          ]}
        />
      </section>

      {/* Sound / animation / haptic (FR-4.3) */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          {t('settings_sound')}
        </h2>
        <Toggle
          label={t('settings_sound_toggle')}
          checked={s.soundEnabled}
          onChange={(v) => set('soundEnabled', v)}
        />
        <Toggle
          label={t('settings_animation')}
          checked={s.animationEnabled}
          onChange={(v) => set('animationEnabled', v)}
        />
        <Toggle
          label={t('settings_haptic')}
          checked={s.hapticEnabled}
          onChange={(v) => set('hapticEnabled', v)}
        />
      </section>

      {/* Alcohol-free mode (FR-4.4) */}
      <section className="flex flex-col gap-2">
        <Toggle
          label={t('settings_alcoholfree')}
          hint={t('settings_alcoholfree_hint')}
          checked={s.alcoholFreeMode}
          onChange={(v) => set('alcoholFreeMode', v)}
        />
      </section>

      {/* About + responsible drinking (Considerations) */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          {t('settings_about')}
        </h2>
        <div className="rounded-2xl border border-border bg-surface p-4">
          <p className="font-semibold">🍺 {t('warn_title')}</p>
          <p className="mt-1 text-sm text-muted">{t('warn_body')}</p>
          <p className="mt-3 text-xs text-muted">
            {t('settings_version')} {APP_VERSION}
          </p>
        </div>
      </section>

      {/* Reset (FR-4.5) */}
      <section className="flex flex-col gap-2 pb-4">
        <Button variant={confirmReset ? 'danger' : 'secondary'} full onClick={onReset} onBlur={() => setConfirmReset(false)}>
          {confirmReset ? t('common_confirm') : `🗑 ${t('settings_reset')}`}
        </Button>
        {confirmReset && <p className="text-center text-sm text-muted">{t('settings_reset_confirm')}</p>}
        {resetDone && <p className="text-center text-sm text-brand">✅ {t('settings_reset_done')}</p>}
      </section>
    </div>
  );
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex gap-1 rounded-2xl bg-surface-2 p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`tap flex-1 rounded-xl px-2 py-2 text-sm font-medium transition ${
            value === opt.value ? 'bg-brand text-white shadow' : 'text-muted'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
