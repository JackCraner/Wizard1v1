import { useEffect, useId } from 'react';
import { AppState, Platform } from 'react-native';
import { activateKeepAwakeAsync, deactivateKeepAwake, isAvailableAsync } from 'expo-keep-awake';

// Each effect owns a separate tag so a late request cannot release a newer combat's lock.
let nextLock = 0;
export function useCombatAwake(enabled: boolean) {
  const id = useId();
  useEffect(() => {
    if (!enabled) return;
    const tag = `combat-${id}-${++nextLock}`;
    let disposed = false;
    let pending = false;
    let held = false;
    const foreground = () => Platform.OS === 'web'
      ? typeof document !== 'undefined' && document.visibilityState === 'visible'
      : AppState.currentState === 'active';
    const release = async () => {
      if (!held) return;
      held = false;
      await deactivateKeepAwake(tag).catch(() => {});
    };
    const acquire = async () => {
      if (disposed || pending || held || !foreground()) return;
      pending = true;
      try {
        if (!await isAvailableAsync() || disposed || !foreground()) return;
        await activateKeepAwakeAsync(tag);
        held = true;
        if (disposed || !foreground()) await release();
      } catch {
        // Unsupported browsers or power-saving policies must not interrupt combat.
      } finally {
        pending = false;
      }
    };
    const update = async () => {
      // Browsers automatically release locks when hidden; clear our tag before reacquiring.
      await release();
      await acquire();
    };
    void acquire();
    const subscription = AppState.addEventListener('change', () => { void update(); });
    const onVisibility = () => { void update(); };
    if (Platform.OS === 'web') document.addEventListener('visibilitychange', onVisibility);
    return () => {
      disposed = true;
      subscription.remove();
      if (Platform.OS === 'web') document.removeEventListener('visibilitychange', onVisibility);
      void release();
    };
  }, [enabled, id]);
}
