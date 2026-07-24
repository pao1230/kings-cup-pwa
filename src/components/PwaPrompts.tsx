import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useT } from '../i18n/useT';
import { Button } from './ui';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PwaPrompts() {
  const t = useT();

  // Update-available + offline-ready (FR-5.4 / FR-5.2).
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  // Custom "Add to Home Screen" banner (FR-5.3).
  const [installEvt, setInstallEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installDismissed, setInstallDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    if (offlineReady) {
      const timer = setTimeout(() => setOfflineReady(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [offlineReady, setOfflineReady]);

  const doInstall = async () => {
    if (!installEvt) return;
    await installEvt.prompt();
    await installEvt.userChoice;
    setInstallEvt(null);
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-30 mx-auto flex max-w-md flex-col gap-2 px-4">
      {needRefresh && (
        <div className="pointer-events-auto flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-3 shadow-xl animate-pop-in">
          <span className="text-sm font-medium">{t('pwa_update')}</span>
          <Button variant="primary" className="px-4 py-2 text-sm" onClick={() => updateServiceWorker(true)}>
            {t('pwa_update_btn')}
          </Button>
        </div>
      )}

      {offlineReady && (
        <div className="pointer-events-auto rounded-2xl border border-border bg-surface p-3 text-center text-sm font-medium text-muted shadow-lg animate-pop-in">
          ✅ {t('pwa_offline_ready')}
        </div>
      )}

      {installEvt && !installDismissed && !needRefresh && (
        <div className="pointer-events-auto flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-3 shadow-xl animate-pop-in">
          <span className="text-sm font-medium">📲 {t('pwa_install')}</span>
          <div className="flex gap-2">
            <Button className="px-3 py-2 text-sm" onClick={() => setInstallDismissed(true)}>
              {t('pwa_install_dismiss')}
            </Button>
            <Button variant="primary" className="px-4 py-2 text-sm" onClick={doInstall}>
              {t('pwa_install')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
