import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRuleSets } from '../store/ruleSetStore';
import { useT } from '../i18n/useT';
import { Button, PageHeader } from '../components/ui';

export default function RuleSetNewPage() {
  const t = useT();
  const navigate = useNavigate();
  const createNew = useRuleSets((s) => s.createNew);
  const setActive = useRuleSets((s) => s.setActive);
  const ruleSets = useRuleSets((s) => s.ruleSets);

  const defaultId = ruleSets.find((r) => r.isDefault)?.id;
  const [name, setName] = useState('');
  const [sourceId, setSourceId] = useState(defaultId ?? '');
  const [busy, setBusy] = useState(false);

  const onCreate = async () => {
    if (busy) return;
    setBusy(true);
    const rs = await createNew(name, sourceId || defaultId);
    setActive(rs.id);
    navigate('/rules');
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t('rulesets_new')} />
      <p className="text-sm text-muted">{t('rulesets_new_hint')}</p>

      <label className="flex flex-col gap-1">
        <span className="font-medium">{t('rulesets_name')}</span>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          placeholder="เช่น กติกาสายฮา"
          className="rounded-2xl border border-border bg-surface px-4 py-3 outline-none focus:border-brand"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="font-medium">{t('rulesets_copy_of')}</span>
        <select
          value={sourceId}
          onChange={(e) => setSourceId(e.target.value)}
          className="rounded-2xl border border-border bg-surface px-4 py-3 outline-none focus:border-brand"
        >
          {ruleSets.map((rs) => (
            <option key={rs.id} value={rs.id}>
              {rs.name}
            </option>
          ))}
        </select>
      </label>

      <div className="flex gap-2 pt-2">
        <Button className="flex-1" onClick={() => navigate(-1)}>
          {t('rule_cancel')}
        </Button>
        <Button variant="primary" className="flex-1" onClick={onCreate} disabled={busy}>
          {t('rulesets_create')}
        </Button>
      </div>
    </div>
  );
}
