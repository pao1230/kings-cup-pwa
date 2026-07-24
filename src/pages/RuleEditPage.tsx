import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Rank } from '../types';
import { RANKS } from '../types';
import { useRuleSets } from '../store/ruleSetStore';
import { useSettings } from '../store/settingsStore';
import { useT } from '../i18n/useT';
import { Button, Card } from '../components/ui';
import { applyAlcoholFree } from '../lib/util';

const TITLE_MAX = 30;
const DESC_MAX = 300;

export default function RuleEditPage() {
  const t = useT();
  const navigate = useNavigate();
  const { rank } = useParams<{ rank: string }>();
  const alcoholFree = useSettings((s) => s.alcoholFreeMode);

  const active = useRuleSets((s) => s.getActive());
  const updateRule = useRuleSets((s) => s.updateRule);

  const rule = useMemo(
    () => active?.rules.find((r) => r.rank === (rank as Rank)),
    [active, rank],
  );

  const [title, setTitle] = useState(rule?.title ?? '');
  const [description, setDescription] = useState(rule?.description ?? '');
  const [icon, setIcon] = useState(rule?.icon ?? '');
  const [isSpecial, setIsSpecial] = useState(rule?.isSpecial ?? false);

  if (!active || !rule || !RANKS.includes(rank as Rank)) {
    return <p className="text-muted">…</p>;
  }

  const titleError = title.trim().length < 1 || title.trim().length > TITLE_MAX;
  const descError = description.length > DESC_MAX;
  const canSave = !titleError && !descError;

  const onSave = async () => {
    if (!canSave) return;
    await updateRule(active.id, rule.rank, {
      title: title.trim(),
      description: description.trim(),
      icon: icon.trim() || undefined,
      isSpecial,
    });
    navigate('/rules');
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button className="tap text-2xl text-muted" onClick={() => navigate(-1)} aria-label={t('common_back')}>
          ‹
        </button>
        <h1 className="text-xl font-bold">
          {t('rule_edit_title')} · <span className="text-brand">{rule.rank}</span>
        </h1>
      </div>

      {/* Live preview (FR-2.6) */}
      <Card className={isSpecial ? 'border-brand bg-brand/5' : ''}>
        <p className="mb-1 text-xs uppercase tracking-wide text-muted">{t('rule_preview')}</p>
        <div className="flex items-center gap-2">
          {icon && <span className="text-2xl">{icon}</span>}
          <span className="text-lg font-bold">{title || '—'}</span>
        </div>
        {description && (
          <p className="mt-1 text-sm text-muted">
            {applyAlcoholFree(description, alcoholFree)}
          </p>
        )}
      </Card>

      {/* Fields */}
      <label className="flex flex-col gap-1">
        <span className="font-medium">{t('rule_field_title')}</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={TITLE_MAX + 5}
          className="rounded-2xl border border-border bg-surface px-4 py-3 outline-none focus:border-brand"
        />
        <span className={`text-right text-xs ${titleError ? 'text-danger' : 'text-muted'}`}>
          {title.trim().length}/{TITLE_MAX}
        </span>
        {titleError && <span className="text-xs text-danger">{t('rule_err_title_len')}</span>}
      </label>

      <label className="flex flex-col gap-1">
        <span className="font-medium">{t('rule_field_desc')}</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          maxLength={DESC_MAX + 20}
          className="resize-none rounded-2xl border border-border bg-surface px-4 py-3 outline-none focus:border-brand"
        />
        <span className={`text-right text-xs ${descError ? 'text-danger' : 'text-muted'}`}>
          {description.length}/{DESC_MAX}
        </span>
        {descError && <span className="text-xs text-danger">{t('rule_err_desc_len')}</span>}
      </label>

      <label className="flex flex-col gap-1">
        <span className="font-medium">{t('rule_field_icon')}</span>
        <input
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          maxLength={8}
          placeholder="👑"
          className="w-24 rounded-2xl border border-border bg-surface px-4 py-3 text-center text-2xl outline-none focus:border-brand"
        />
      </label>

      {/* isSpecial (FR-2.5) */}
      <button
        type="button"
        role="switch"
        aria-checked={isSpecial}
        onClick={() => setIsSpecial((v) => !v)}
        className="tap flex items-center justify-between gap-3 rounded-2xl bg-surface px-4 py-3 text-left"
      >
        <span className="font-medium">{t('rule_field_special')}</span>
        <span className={`relative h-7 w-12 flex-shrink-0 rounded-full transition ${isSpecial ? 'bg-brand' : 'bg-border'}`}>
          <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${isSpecial ? 'left-6' : 'left-1'}`} />
        </span>
      </button>

      <div className="sticky bottom-0 flex gap-2 pt-2">
        <Button className="flex-1" onClick={() => navigate(-1)}>
          {t('rule_cancel')}
        </Button>
        <Button variant="primary" className="flex-1" onClick={onSave} disabled={!canSave}>
          {t('rule_save')}
        </Button>
      </div>
    </div>
  );
}
