import { useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import * as Orientation from 'expo-screen-orientation';

// Serialize native requests so a slow previous lock cannot override the new screen.
let pending: Promise<void> = Promise.resolve();
export function useOrientation(inGame: boolean, enabled = true) {
  const [error, setError] = useState('');
  useEffect(() => {
    if (Platform.OS === 'web' || !enabled) return;
    let current = true;
    const apply = () => {
      pending = pending.catch(() => {}).then(async () => {
        if (!current) return;
        try {
          await Orientation.lockAsync(inGame ? Orientation.OrientationLock.LANDSCAPE : Orientation.OrientationLock.PORTRAIT_UP);
          if (current) setError('');
        } catch {
          if (current) setError('Could not rotate the screen. Turn your device sideways or restart the app.');
        }
      });
    };
    apply();
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') apply(); });
    return () => { current = false; subscription.remove(); };
  }, [inGame, enabled]);
  return error;
}
