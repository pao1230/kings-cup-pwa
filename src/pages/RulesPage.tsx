import { Link } from 'react-router-dom';
import { useRuleSets } from '../store/ruleSetStore';
import { useSettings } from '../store/settingsStore';
import { useT } from '../i18n/useT';
import { PageHeader } from '../components/ui';
import { applyAlcoholFree } from '../lib/util';
import { SUIT_SYMBOL } from '../lib/deck';

export default function RulesPage() {
  const t = useT();
  const active = useRuleSets((s) => s.getActive());
  const alcoholFree = useSettings((s) => s.alcoholFreeMode);

  if (!active) return null;

  return (
    <div>
      <PageHeader title={t('rules_title')} />
      <p className="mb-4 text-sm text-muted">
        {t('rules_editing')}: <span className="font-semibold text-text">{active.name}</span>
      </p>

      <ul className="flex flex-col gap-2">
        {active.rules.map((rule) => (
          <li key={rule.rank}>
            <Link
              to={`/rules/${rule.rank}`}
              className="tap flex items-center gap-3 rounded-2xl border border-border bg-surface p-3 transition hover:border-brand"
            >
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-surface-2 text-lg font-bold">
                {rule.rank}
                <span className="ml-0.5 text-sm text-muted">{SUIT_SYMBOL.spades}</span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 font-semibold">
                  {rule.icon && <span>{rule.icon}</span>}
                  <span className="truncate">{rule.title}</span>
                  {rule.isSpecial && <span className="text-xs text-brand">★</span>}
                </span>
                {rule.description && (
                  <span className="line-clamp-1 block text-sm text-muted">
                    {applyAlcoholFree(rule.description, alcoholFree)}
                  </span>
                )}
              </span>
              <span className="text-muted" aria-hidden>
                ›
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
