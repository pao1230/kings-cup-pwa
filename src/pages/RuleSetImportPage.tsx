import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRuleSets } from '../store/ruleSetStore';
import { useT } from '../i18n/useT';
import { Button, PageHeader } from '../components/ui';
import {
  ImportError,
  shareCodeToObject,
  validateAndNormalizeRuleSet,
} from '../lib/storage';
import { uuid } from '../lib/util';

export default function RuleSetImportPage() {
  const t = useT();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const addImported = useRuleSets((s) => s.addImported);
  const setActive = useRuleSets((s) => s.setActive);

  const [raw, setRaw] = useState('');
  const [error, setError] = useState('');
  const [okName, setOkName] = useState('');

  // Support share links: #/rulesets/import?code=<base64url>
  useEffect(() => {
    const code = params.get('code');
    if (code) setRaw(code);
  }, [params]);

  // Parse either a JSON payload or a base64url share code (FR-3.5).
  const parse = (text: string): unknown => {
    const trimmed = text.trim();
    if (!trimmed) throw new ImportError(t('import_hint'));
    if (trimmed.startsWith('{')) return JSON.parse(trimmed);
    try {
      return shareCodeToObject(trimmed);
    } catch {
      // Might still be JSON without leading brace whitespace handled above.
      return JSON.parse(trimmed);
    }
  };

  const onImport = async () => {
    setError('');
    setOkName('');
    try {
      const obj = parse(raw);
      const rs = validateAndNormalizeRuleSet(obj, uuid());
      await addImported(rs);
      setActive(rs.id);
      setOkName(rs.name);
      setTimeout(() => navigate('/rulesets'), 900);
    } catch (e) {
      if (e instanceof ImportError) setError(e.message);
      else setError(t('import_error'));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t('import_title')} />
      <p className="text-sm text-muted">{t('import_hint')}</p>

      <textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        rows={7}
        placeholder={t('import_placeholder')}
        className="resize-none rounded-2xl border border-border bg-surface px-4 py-3 font-mono text-xs outline-none focus:border-brand"
      />

      {error && <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">⚠️ {error}</p>}
      {okName && (
        <p className="rounded-xl bg-brand/10 px-3 py-2 text-sm font-medium text-brand">
          ✅ {t('import_success')}: {okName}
        </p>
      )}

      <div className="flex gap-2">
        <Button className="flex-1" onClick={() => navigate(-1)}>
          {t('rule_cancel')}
        </Button>
        <Button variant="primary" className="flex-1" onClick={onImport} disabled={!raw.trim()}>
          {t('import_btn')}
        </Button>
      </div>
    </div>
  );
}
