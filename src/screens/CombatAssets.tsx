import { statusSummary } from '../components/cards/spellVisual';
import { Image, StyleSheet, Text, View } from 'react-native';
import type { Fighter, Session } from '../game/model';

export const combatArt = {
  background: require('../../assets/CombatBackground.png'),
  pose: require('../../assets/Pose1.png'),
  hotbar: require('../../assets/Hotbar.png'),
  health: require('../../assets/healthBar.png'),
};
export function PortraitArt() {
  return <View style={{ flex: 1, width: '100%', overflow: 'hidden', borderRadius: 100 }}><Image accessible={false} source={combatArt.pose} resizeMode="stretch" style={{ position: 'absolute', width: '350%', height: '390%', left: '-123%', top: '-30%' }} /></View>;
}
export function OrnateMeter({ value, max }: { value: number; max: number }) {
  const ratio = max ? Math.max(0, Math.min(1, value / max)) : 0;
  return <View accessibilityLabel={`Health ${value} of ${max}`} style={{ height: 17, width: '100%', overflow: 'hidden' }}>
    {/* Clip the transparent padding in the supplied frame without altering its source. */}
    <Image accessible={false} source={combatArt.health} resizeMode="stretch" style={{ position: 'absolute', left: 0, top: '-48%', width: '100%', height: '200%' }} />
    <View style={{ position: 'absolute', left: '11%', right: '11%', top: '32%', bottom: '30%', overflow: 'hidden', borderRadius: 3, backgroundColor: '#08080888' }}><View style={{ width: `${ratio * 100}%`, height: '100%', backgroundColor: '#c73136', opacity: .85 }} /></View>
    <Text style={{ color: '#fff2d9', fontSize: 9, textAlign: 'center', lineHeight: 17, textShadowColor: '#000', textShadowRadius: 3, textShadowOffset: { width: 1, height: 1 } }}>{value} / {max}</Text>
  </View>;
}

export function WardMeter({ value, capacity }: { value: number; capacity: number }) {
  if (value <= 0) return null;
  return <View accessible accessibilityLabel={`${value} of ${capacity} Ward`} style={{ height: 13, marginHorizontal: '8%', borderWidth: 1, borderColor: '#8bc8ed', borderRadius: 3, backgroundColor: '#102a40e6', overflow: 'hidden' }}>
    <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.min(100, value / Math.max(1, capacity) * 100)}%`, backgroundColor: '#428dbc' }}/>
    <Text style={{ color: '#e0f5ff', fontSize: 9, lineHeight: 11, textAlign: 'center', fontWeight: '800', textShadowColor: '#102030', textShadowRadius: 2, textShadowOffset: { width: 0, height: 1 } }}>⬡ {value}/{capacity} Ward</Text>
  </View>;
}
