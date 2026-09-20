import { Image, StyleSheet, Text, View } from 'react-native';
import type { Fighter, Session } from '../game/model';
import { EQUIPMENT, EQUIPMENT_SLOTS } from '../game/shop';

export const combatArt = {
  background: require('../../assets/CombatBackground.png'),
  pose: require('../../assets/Pose1.png'),
  hotbar: require('../../assets/Hotbar.png'),
  health: require('../../assets/healthBar.png'),
  mana: require('../../assets/ManaBar.png'),
};
export function PortraitArt() {
  return <View style={{ flex: 1, width: '100%', overflow: 'hidden', borderRadius: 100 }}><Image accessible={false} source={combatArt.pose} resizeMode="stretch" style={{ position: 'absolute', width: '350%', height: '390%', left: '-123%', top: '-30%' }} /></View>;
}
export function OrnateMeter({ value, max, mana = false }: { value: number; max: number; mana?: boolean }) {
  const ratio = max ? Math.max(0, Math.min(1, value / max)) : 0;
  return <View accessibilityLabel={`${mana ? 'Mana' : 'Health'} ${value} of ${max}`} style={{ height: 17, width: '100%', overflow: 'hidden' }}>
    {/* Clip the transparent padding in the supplied frame without altering its source. */}
    <Image accessible={false} source={mana ? combatArt.mana : combatArt.health} resizeMode="stretch" style={{ position: 'absolute', left: 0, top: '-48%', width: '100%', height: '200%' }} />
    <View style={{ position: 'absolute', left: mana ? '14%' : '11%', right: mana ? '14%' : '11%', top: '32%', bottom: '30%', overflow: 'hidden', borderRadius: 3, backgroundColor: '#08080888' }}><View style={{ width: `${ratio * 100}%`, height: '100%', backgroundColor: mana ? '#288bc8' : '#c73136', opacity: .85 }} /></View>
    <Text style={{ color: '#fff2d9', fontSize: 9, textAlign: 'center', lineHeight: 17, textShadowColor: '#000', textShadowRadius: 3, textShadowOffset: { width: 1, height: 1 } }}>{value} / {max}</Text>
  </View>;
}
export function PlayerHotbar({ fighter, equipment, compact }: { fighter: Fighter; equipment: Session['equipment']; compact: boolean }) {
  return <View style={{ height: compact ? 64 : 100, width: '100%', maxWidth: compact ? 320 : 500, overflow: 'hidden' }}>
    <Image accessible={false} source={combatArt.hotbar} resizeMode="stretch" style={{ position: 'absolute', left: 0, top: '-24%', width: '100%', height: '167%' }} />
    <View style={{ position: 'absolute', left: '5%', top: '19%', width: '16%', height: '77%', overflow: 'hidden', borderRadius: 100 }}><PortraitArt /></View>
    <View style={{ position: 'absolute', left: '27%', right: '25%', top: '16%', height: '22%', justifyContent: 'center' }}><Text style={{ fontSize: compact ? 9 : 12, color: '#edd6a4', textAlign: 'center' }}>YOU   ·   ◇ {fighter.shield} SHIELD</Text></View>
    <View style={{ position: 'absolute', left: '26%', right: '24%', top: '41%', height: '23%' }}><HotbarFill value={fighter.health} max={fighter.maxHealth} /></View>
    <View style={{ position: 'absolute', left: '26%', right: '24%', top: '68%', height: '23%' }}><HotbarFill value={fighter.mana} max={fighter.maxMana} mana /></View>
    {EQUIPMENT_SLOTS.map((slot, i) => { const id = equipment[slot]; return <View key={slot} accessibilityLabel={`${slot}: ${id ? EQUIPMENT[id].name : 'empty'}`} style={{ position: 'absolute', left: i % 2 ? '86.5%' : '78.5%', top: i < 2 ? '21%' : '61%', width: '6%', height: '33%', justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: '#d9ba77', fontSize: compact ? 15 : 26 }}>{id ? EQUIPMENT[id].symbol : '·'}</Text></View>; })}
  </View>;
}
function HotbarFill({ value, max, mana }: { value: number; max: number; mana?: boolean }) {
  return <View accessibilityLabel={`${mana ? 'Mana' : 'Health'} ${value} of ${max}`} style={{ flex: 1, overflow: 'hidden', borderRadius: 6, backgroundColor: '#0006', justifyContent: 'center' }}>
    <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${max ? Math.max(0, Math.min(100, value / max * 100)) : 0}%`, backgroundColor: mana ? '#258ec0aa' : '#bf303aaa' }} />
    <Text style={{ color: '#fff2d9', fontSize: 9, textAlign: 'center', textShadowColor: '#000', textShadowRadius: 3, textShadowOffset: { width: 1, height: 1 } }}>{value} / {max}</Text>
  </View>;
}


