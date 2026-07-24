import { useSettings } from '../store/settingsStore';
import { t as translate, type StringKey } from './strings';

// Convenience hook: returns a translator bound to the current language.
export function useT(): (key: StringKey) => string {
  const lang = useSettings((s) => s.language);
  return (key: StringKey) => translate(lang, key);
}
