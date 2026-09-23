import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { palette } from '../theme';

/** Fullscreen the document so navigation between game screens keeps it active. */
export function FullscreenButton() {
  const supported = Platform.OS === 'web' && typeof document !== 'undefined' && !!document.fullscreenEnabled;
  const [active, setActive] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!supported) return;
    const update = () => { setActive(!!document.fullscreenElement); setError(''); };
    update();
    document.addEventListener('fullscreenchange', update);
    return () => document.removeEventListener('fullscreenchange', update);
  }, [supported]);
  if (!supported) return null;
  async function toggle() {
    setPending(true); setError('');
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch { setError('Fullscreen unavailable. Try opening in Chrome.'); }
    finally { setPending(false); }
  }
  const label = active ? 'Exit full screen' : 'Full screen';
  return <View style={styles.container}>
    <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={pending}
      accessibilityState={{ disabled: pending }} onPress={() => void toggle()}
      style={({ pressed }) => [styles.button, (pressed || pending) && styles.pressed]}>
      <Text style={styles.text}>{active ? '↙' : '⛶'} {label}</Text>
    </Pressable>
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
  </View>;
}
const styles = StyleSheet.create({
  container: { flexShrink: 1 },
  button: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 10, borderWidth: 1, borderColor: palette.goldBorder, borderRadius: 7 },
  text: { color: palette.parchment, fontSize: 13 },
  pressed: { opacity: .6 },
  error: { color: '#ffc6aa', fontSize: 11, maxWidth: 190, marginTop: 4 },
});
