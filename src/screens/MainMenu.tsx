import { palette, typography } from '../theme';
import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo, Animated, AppState, Easing, Image, 
  Pressable, StyleSheet, Text, useWindowDimensions, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const background = require('../../assets/MainBackground.png');
const serif = typography.serif;
// Positions are normalized against the original 941 × 1672 painting.
const lights = [
  { x: .247, y: .544, radius: .125, group: 0 }, // hearth
  { x: .135, y: .657, radius: .048, group: 1 }, // foreground candle
  { x: .470, y: .119, radius: .040, group: 2 }, // chandelier
  { x: .356, y: .141, radius: .025, group: 1 },
  { x: .420, y: .131, radius: .028, group: 0 },
  { x: .562, y: .136, radius: .029, group: 1 },
  { x: .907, y: .283, radius: .035, group: 2 },
];

function useAtmosphere() {
  const [reduced, setReduced] = useState(true);
  const [active, setActive] = useState(AppState.currentState === 'active');
  const flickers = useRef([new Animated.Value(.35), new Animated.Value(.45), new Animated.Value(.4)]).current;
  const embers = useRef(Array.from({ length: 9 }, () => new Animated.Value(0))).current;

  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let mounted = true;
    let changed = false;
    AccessibilityInfo.isReduceMotionEnabled().then(value => { if (mounted && !changed) setReduced(value); }).catch(() => {});
    const motion = AccessibilityInfo.addEventListener('reduceMotionChanged', value => { changed = true; setReduced(value); });
    const state = AppState.addEventListener('change', value => setActive(value === 'active'));
    return () => { mounted = false; motion.remove(); state.remove(); };
  }, []);

  useEffect(() => {
    if (reduced || !active) return;
    const loops = flickers.map((value, index) => Animated.loop(Animated.sequence(
      [.22, .85, .38, .96, .32, .72].map((toValue, step) => Animated.timing(value, {
        toValue, duration: [470, 230, 620, 180, 540, 350][step] + index * 110,
        easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false,
      }))), { resetBeforeIteration: false }));
    const particles = embers.map((value, index) => Animated.loop(Animated.sequence([
      Animated.delay(index * 550),
      Animated.timing(value, { toValue: 1, duration: 3500 + index * 320, easing: Easing.linear, useNativeDriver: true, isInteraction: false }),
      Animated.timing(value, { toValue: 0, duration: 0, useNativeDriver: true, isInteraction: false }),
    ])));
    const camera = Animated.loop(Animated.sequence([
      Animated.timing(drift, { toValue: 1, duration: 18000, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
      Animated.timing(drift, { toValue: 0, duration: 18000, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
    ]));
    [...loops, ...particles, camera].forEach(animation => animation.start());
    return () => {
      [...loops, ...particles, camera].forEach(animation => animation.stop());
      drift.setValue(0);
      flickers.forEach(value => value.setValue(.4));
      embers.forEach(value => value.setValue(0));
    };
  }, [active, reduced, flickers, embers, drift]);
  return { flickers, embers, drift, animate: active && !reduced };
}

export function MainMenu({ hasRun, busy, round, error, onNewGame, onContinue, onLibrary }: {
  hasRun: boolean; busy: boolean; round?: number; error?: string;
  onLibrary: () => void; onNewGame: () => void; onContinue: () => void;
}) {
  const { width, height, fontScale } = useWindowDimensions();
  const [bounds, setBounds] = useState({ width, height });
  const { flickers, embers, drift, animate } = useAtmosphere();
  const scale = Math.max(bounds.width / 941, bounds.height / 1672);
  const imageWidth = 941 * scale, imageHeight = 1672 * scale;
  const left = (bounds.width - imageWidth) / 2, top = (bounds.height - imageHeight) / 2;
  const compact = bounds.height < 620 || fontScale > 1.35;

  return <View style={styles.root} onLayout={({ nativeEvent }) => setBounds(nativeEvent.layout)}>
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { transform: [
      { scale: drift.interpolate({ inputRange: [0, 1], outputRange: [1.035, 1.065] }) },
      { translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [-bounds.width * .006, bounds.width * .006] }) },
      { translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [bounds.height * .004, -bounds.height * .004] }) },
    ] }]}>
    <Image source={background} resizeMode="cover" style={[StyleSheet.absoluteFill, { width: bounds.width, height: bounds.height }]} accessible={false} />
    <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
      {lights.map((light, index) => {
        const radius = light.radius * imageWidth;
        return <Animated.View key={index} style={{ position: 'absolute', left: left + light.x * imageWidth - radius, top: top + light.y * imageHeight - radius, width: radius * 2, height: radius * 2, opacity: flickers[light.group] }}>
          {Array.from({ length: 9 }, (_, ring) => {
            const inset = ring * radius / 11;
            return <View key={ring} style={{ position: 'absolute', top: inset, bottom: inset, left: inset, right: inset, borderRadius: radius, backgroundColor: 'rgba(255, 154, 48, 0.055)' }} />;
          })}
        </Animated.View>;
      })}
      {animate && embers.map((value, index) => <Animated.View key={index} style={{
        position: 'absolute', left: index < 5 ? left + (.217 + index * .015) * imageWidth : bounds.width * (.18 + (index - 5) * .22),
        top: index < 5 ? top + .552 * imageHeight : bounds.height * (.66 + (index % 3) * .1),
        width: Math.max(2, scale * 3), height: Math.max(2, scale * 4), borderRadius: 3, backgroundColor: '#ffd693',
        opacity: value.interpolate({ inputRange: [0, .15, .65, 1], outputRange: [0, index < 5 ? .95 : .5, .35, 0] }),
        transform: [
          { translateY: value.interpolate({ inputRange: [0, 1], outputRange: [0, index < 5 ? -imageHeight * .12 : -bounds.height * .28] }) },
          { translateX: value.interpolate({ inputRange: [0, .5, 1], outputRange: [0, index % 2 ? 9 : -8, index % 2 ? -5 : 14] }) },
        ],
      }} />)}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(8, 6, 5, 0.17)' }]} />
    </View>

    </Animated.View>

    <SafeAreaView style={styles.safe}>
      <View style={[styles.content, { paddingTop: compact ? 20 : bounds.height * .1, paddingBottom: 12, paddingLeft: Math.min(88, Math.max(20, bounds.width * .055)), paddingRight: 20 }]}>
        <View style={[styles.panel, compact && styles.compactPanel]}>
          <View pointerEvents="none" style={styles.innerFrame} />
          <View pointerEvents="none" style={styles.cornerTop} />
          <View pointerEvents="none" style={styles.cornerBottom} />
          {!compact && <View style={styles.ornament} accessible={false}><Text style={styles.star}>✧</Text><View style={styles.rule} /></View>}
          <Text accessibilityRole="header" style={[styles.title, compact && { fontSize: 28, lineHeight: 34 }]}>WIZARD{'\n'}<Text style={styles.titleAccent}>1V1</Text></Text>
          {!compact && <Text style={styles.subtitle}>YOUR NEXT DUEL AWAITS</Text>}
          <View style={[styles.options, compact && { marginTop: 10 }]}>
            <Pressable accessibilityRole="button" accessibilityLabel="New game" accessibilityState={{ disabled: busy }}
              disabled={busy} onPress={onNewGame}
              style={({ pressed }) => [styles.button, compact && { minHeight: 44, paddingVertical: 8 }, styles.newGame, pressed && styles.pressed, busy && styles.disabled]}>
              <Text style={styles.newGameText}>{busy ? 'Preparing…' : 'New game'}</Text>
              <Text style={styles.buttonOrnament} accessible={false}>✦</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Continue" accessibilityHint={hasRun ? `Resume round ${round}` : 'Start a new game to unlock Continue'}
              accessibilityState={{ disabled: !hasRun || busy }} disabled={!hasRun || busy} onPress={onContinue}
              style={({ pressed }) => [styles.button, compact && { minHeight: 44, paddingVertical: 8 }, styles.continue, pressed && styles.pressed, (!hasRun || busy) && styles.disabled]}>
              <Text style={styles.continueText}>Continue</Text>
              <Text style={styles.continueArrow} accessible={false}>›</Text>
            </Pressable>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Spell library" onPress={onLibrary} style={{ paddingTop: compact ? 8 : 14 }}><Text style={{ color: '#d6be91', fontSize: 13 }}>Spell library →</Text></Pressable>
          <Text style={[styles.note, compact && { marginTop: 8 }]}>{hasRun ? `Resume your journey · Round ${round}` : 'Your journey begins with a single spell.'}</Text>
          {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
        </View>
      </View>
      {!compact && <Text style={[styles.footer, { paddingLeft: Math.min(88, Math.max(20, bounds.width * .055)) }]}>A DUEL OF SPELLS. A TEST OF STRATEGY.</Text>}
    </SafeAreaView>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1d130c', overflow: 'hidden' },
  safe: { flex: 1 },
  content: { flex: 1, justifyContent: 'flex-start', alignItems: 'flex-start' },
  panel: { width: '100%', maxWidth: 330, padding: 27, paddingTop: 24, backgroundColor: 'rgba(13, 12, 11, 0.80)', borderWidth: 1, borderColor: 'rgba(211, 175, 112, 0.25)', borderRadius: 2, shadowColor: palette.black, shadowOpacity: .4, shadowRadius: 22, shadowOffset: { width: 0, height: 12 }, elevation: 12 },
  compactPanel: { padding: 16 },
  innerFrame: { position: 'absolute', top: 7, left: 7, right: 7, bottom: 7, borderWidth: 1, borderColor: 'rgba(211,175,112,.11)' },
  cornerTop: { position: 'absolute', top: -1, left: -1, width: 32, height: 32, borderTopWidth: 2, borderLeftWidth: 2, borderColor: palette.goldBorder },
  cornerBottom: { position: 'absolute', bottom: -1, right: -1, width: 32, height: 32, borderBottomWidth: 2, borderRightWidth: 2, borderColor: palette.goldBorder },
  ornament: { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', gap: 13, marginBottom: 12 },
  rule: { height: 1, width: 62, backgroundColor: 'rgba(207, 170, 103, .45)' },
  star: { color: '#d3ac6e', fontSize: 25 },
  title: { color: '#f1e3c8', fontFamily: serif, fontSize: 40, lineHeight: 44, letterSpacing: 3, textAlign: 'left' },
  titleAccent: { color: '#d2a967', fontSize: 26, letterSpacing: 7 },
  subtitle: { color: '#bba88b', fontSize: 9, letterSpacing: 1.9, textAlign: 'left', marginTop: 13 },
  options: { marginTop: 28, gap: 9 },
  button: { minHeight: 54, paddingVertical: 12, paddingHorizontal: 21, borderWidth: 0, borderLeftWidth: 2, borderRadius: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  newGame: { backgroundColor: 'rgba(194, 154, 91, .16)', borderColor: '#dfbd82' },
  newGameText: { color: '#f3dfbb', fontFamily: serif, fontSize: 23, letterSpacing: .5 },
  buttonOrnament: { color: '#cfad74', fontSize: 13 },
  continue: { backgroundColor: 'rgba(209, 175, 113, .025)', borderColor: 'rgba(210, 177, 120, .28)' },
  continueText: { color: '#e5d4b6', fontFamily: serif, fontSize: 21, letterSpacing: .5 },
  continueArrow: { color: '#cfb37f', fontSize: 27, lineHeight: 28 },
  pressed: { opacity: .78, transform: [{ scale: .985 }] },
  disabled: { opacity: .42 },
  note: { color: '#a79984', fontSize: 11, lineHeight: 17, textAlign: 'left', marginTop: 24 },
  error: { color: '#ffc6aa', textAlign: 'center', fontSize: 12, marginTop: 12 },
  footer: { color: '#e3cdae', fontSize: 8, letterSpacing: 1.4, textAlign: 'left', paddingHorizontal: 18, paddingBottom: 18, textShadowColor: palette.black, textShadowRadius: 8, textShadowOffset: { width: 0, height: 1 } },
});



