import { palette } from '../theme';
import { Platform, StyleSheet, Text, View } from 'react-native';

const results = {
  victory: { title: 'VICTORY', color: palette.gold, wash: '#463815b8', emblem: '✦' },
  draw: { title: 'DRAW', color: '#c4e2f0', wash: '#213d4bb8', emblem: '◇' },
  defeat: { title: 'LOST', color: '#ffb3a6', wash: '#4d2427b8', emblem: '✧' },
};

export function CombatResult({ outcome, level, compact }: { outcome: keyof typeof results; level: number; compact: boolean }) {
  const result = results[outcome];
  return <View pointerEvents="none" style={[StyleSheet.absoluteFill, { justifyContent: 'center', zIndex: 80 }]}>
    <View accessible accessibilityRole="text" accessibilityLiveRegion="polite" accessibilityLabel={`${result.title}${outcome === 'victory' ? `, +${level} trophies` : ''}`}
      style={{ alignItems: 'center', paddingVertical: compact ? 9 : 16, gap: 3, backgroundColor: result.wash, borderTopWidth: 1, borderBottomWidth: 1, borderColor: result.color + '99' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <View style={{ width: compact ? 58 : 100, height: 1, backgroundColor: result.color + '88' }}/>
        <Text style={{ color: result.color, fontSize: compact ? 20 : 26 }}>{result.emblem}</Text>
        <View style={{ width: compact ? 58 : 100, height: 1, backgroundColor: result.color + '88' }}/>
      </View>
      <Text style={{ color: result.color, fontSize: compact ? 34 : 48, lineHeight: compact ? 40 : 56, letterSpacing: 7, fontWeight: '900', fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' }), textShadowColor: '#130b0c', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 }}>{result.title}</Text>
      {outcome === 'victory' && <Text style={{ color: '#fff0cb', fontSize: compact ? 12 : 15, fontWeight: '700', letterSpacing: 1 }}>+{level} {level === 1 ? 'TROPHY' : 'TROPHIES'}</Text>}
    </View>
  </View>;
}
