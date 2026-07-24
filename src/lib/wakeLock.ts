import { useEffect } from 'react';

// Keep the screen awake while playing (FR-1.10). No-op where unsupported.
export function useWakeLock(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;

    let lock: WakeLockSentinel | null = null;
    let released = false;

    const request = async () => {
      try {
        lock = await (navigator as Navigator & {
          wakeLock: { request: (t: 'screen') => Promise<WakeLockSentinel> };
        }).wakeLock.request('screen');
      } catch {
        /* denied / not allowed — ignore */
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && !released) request();
    };

    request();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      released = true;
      document.removeEventListener('visibilitychange', onVisibility);
      lock?.release().catch(() => {});
    };
  }, [enabled]);
}
