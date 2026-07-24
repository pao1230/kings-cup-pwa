import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { RuleSet } from '../types';
import { useRuleSets } from '../store/ruleSetStore';
import { useT } from '../i18n/useT';
import { Button, PageHeader } from '../components/ui';
import { ruleSetToJSON, ruleSetToShareCode } from '../lib/storage';

export default function RuleSetsPage() {
  const t = useT();
  const ruleSets = useRuleSets((s) => s.ruleSets);
  const activeId = useRuleSets((s) => s.activeRuleSetId);
  const setActive = useRuleSets((s) => s.setActive);
  const duplicate = useRuleSets((s) => s.duplicate);
  const remove = useRuleSets((s) => s.remove);

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [exportOf, setExportOf] = useState<RuleSet | null>(null);

  return (
    <div>
      <PageHeader
        title={t('rulesets_title')}
        right={
          <Link to="/rulesets/import" className="tap text-sm font-semibold text-brand">
            ⬇︎ {t('rulesets_import')}
          </Link>
        }
      />

      <ul className="flex flex-col gap-3">
        {ruleSets.map((rs) => {
          const isActive = rs.id === activeId;
          return (
            <li
              key={rs.id}
              className={`rounded-2xl border p-4 ${isActive ? 'border-brand bg-brand/5' : 'border-border bg-surface'}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-lg font-bold">{rs.name}</h2>
                    {rs.isDefault && (
                      <span className="flex-shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">
                        {t('rulesets_default_badge')}
                      </span>
                    )}
                  </div>
                  {isActive && (
                    <span className="text-sm font-medium text-brand">● {t('rulesets_active')}</span>
                  )}
                </div>
                {!isActive && (
                  <Button className="flex-shrink-0 px-4 py-2 text-sm" onClick={() => setActive(rs.id)}>
                    {t('rulesets_use')}
                  </Button>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                <Link
                  to="/rules"
                  onClick={() => setActive(rs.id)}
                  className="tap rounded-xl bg-surface-2 px-3 py-2 font-medium"
                >
                  ✏️ {t('rulesets_edit')}
                </Link>
                <button
                  onClick={() => duplicate(rs.id)}
                  className="tap rounded-xl bg-surface-2 px-3 py-2 font-medium"
                >
                  ⧉ {t('rulesets_duplicate')}
                </button>
                <button
                  onClick={() => setExportOf(rs)}
                  className="tap rounded-xl bg-surface-2 px-3 py-2 font-medium"
                >
                  ⬆︎ {t('rulesets_export')}
                </button>
                {!rs.isDefault &&
                  (confirmDelete === rs.id ? (
                    <button
                      onClick={() => {
                        remove(rs.id);
                        setConfirmDelete(null);
                      }}
                      className="tap rounded-xl bg-danger px-3 py-2 font-semibold text-white"
                    >
                      {t('common_confirm')}
                    </button>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(rs.id)}
                      onBlur={() => setConfirmDelete(null)}
                      className="tap rounded-xl bg-surface-2 px-3 py-2 font-medium text-danger"
                    >
                      🗑 {t('rulesets_delete')}
                    </button>
                  ))}
              </div>
            </li>
          );
        })}
      </ul>

      <Link
        to="/rulesets/new"
        className="tap mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border py-4 font-semibold text-brand"
      >
        ＋ {t('rulesets_new')}
      </Link>

      {exportOf && <ExportSheet ruleSet={exportOf} onClose={() => setExportOf(null)} />}
    </div>
  );
}

function ExportSheet({ ruleSet, onClose }: { ruleSet: RuleSet; onClose: () => void }) {
  const t = useT();
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (text: string, which: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard blocked */
    }
  };

  const json = ruleSetToJSON(ruleSet);
  const link = `${location.origin}${location.pathname}#/rulesets/import?code=${ruleSetToShareCode(ruleSet)}`;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-0" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-3xl border-t border-border bg-bg p-5 pb-8 animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{t('export_title')}</h2>
          <button className="tap text-muted" onClick={onClose}>
            ✕
          </button>
        </div>
        <p className="mb-3 truncate text-sm text-muted">{ruleSet.name}</p>
        <div className="flex flex-col gap-2">
          <Button variant="primary" full onClick={() => copy(json, 'json')}>
            {copied === 'json' ? `✅ ${t('export_copied')}` : t('export_copy_json')}
          </Button>
          <Button full onClick={() => copy(link, 'link')}>
            {copied === 'link' ? `✅ ${t('export_copied')}` : t('export_copy_link')}
          </Button>
        </div>
        <pre className="mt-3 max-h-40 overflow-auto rounded-xl bg-surface-2 p-3 text-xs text-muted">
          {json}
        </pre>
      </div>
    </div>
  );
}
