import { palette } from '../theme';
import { useEffect, useRef, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform } from 'react-native';

export function LiftedPreview({ left, top, width, height, children }: {
  left: number; top: number; width: number; height: number; children: ReactNode;
}) {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(reduced => {
      if (!mounted) return;
      if (reduced) { progress.setValue(1); return; }
      Animated.timing(progress, { toValue: 1, duration: 180, easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== 'web' }).start();
    }).catch(() => { if (mounted) progress.setValue(1); });
    return () => { mounted = false; progress.stopAnimation(); };
  }, [progress]);
  return <Animated.View pointerEvents="none" style={{ position: 'absolute', left, top, width, height,
    zIndex: 1000, elevation: 30, opacity: progress, transform: [
      { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
      { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [.94, 1] }) },
    ], shadowColor: palette.black, shadowOpacity: .8, shadowRadius: 18, shadowOffset: { width: 0, height: 8 },
  }}>{children}</Animated.View>;
}
