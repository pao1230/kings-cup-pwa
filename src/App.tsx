import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import GamePage from './pages/GamePage';
import RideTheBusPage from './pages/RideTheBusPage';
import RulesPage from './pages/RulesPage';
import RuleEditPage from './pages/RuleEditPage';
import RuleSetsPage from './pages/RuleSetsPage';
import RuleSetNewPage from './pages/RuleSetNewPage';
import RuleSetImportPage from './pages/RuleSetImportPage';
import SettingsPage from './pages/SettingsPage';
import { useRuleSets } from './store/ruleSetStore';
import { useGame } from './store/gameStore';

export default function App() {
  const initRuleSets = useRuleSets((s) => s.init);
  const loaded = useRuleSets((s) => s.loaded);
  const activeRuleSetId = useRuleSets((s) => s.activeRuleSetId);
  const initGame = useGame((s) => s.init);
  const session = useGame((s) => s.session);

  // Load rule sets from IndexedDB on startup.
  useEffect(() => {
    initRuleSets();
  }, [initRuleSets]);

  // Once we know the active set, resume or start a game session.
  useEffect(() => {
    if (loaded && activeRuleSetId && !session) {
      initGame(activeRuleSetId);
    }
  }, [loaded, activeRuleSetId, session, initGame]);

  if (!loaded) {
    return (
      <div className="flex h-full items-center justify-center text-muted">
        <span className="animate-pulse">Kings Cup…</span>
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<GamePage />} />
        <Route path="/ride-the-bus" element={<RideTheBusPage />} />
        <Route path="/rules" element={<RulesPage />} />
        <Route path="/rules/:rank" element={<RuleEditPage />} />
        <Route path="/rulesets" element={<RuleSetsPage />} />
        <Route path="/rulesets/new" element={<RuleSetNewPage />} />
        <Route path="/rulesets/import" element={<RuleSetImportPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
