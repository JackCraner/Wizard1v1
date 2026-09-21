import { statusSummary } from '../components/cards/spellVisual';
import { Image, StyleSheet, Text, View } from 'react-native';
import type { Fighter, Session } from '../game/model';
import {ItemInventoryView} from '../components/ItemInventory';

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
export function PlayerHotbar({fighter,equipment,compact,onInspect}:{fighter:Fighter;equipment:Session['equipment'];compact:boolean;onInspect?:()=>()=>void}) {
 return <View style={{height:compact?64:100,flexDirection:'row',gap:10,alignItems:'center',backgroundColor:'#15130be8',borderWidth:1,borderColor:'#7b663e',borderRadius:6,padding:6}}>
  <View style={{width:compact?40:65,height:'100%'}}><PortraitArt/></View>
  <View style={{width:compact?140:210,gap:3}}><Text numberOfLines={1} style={{color:'#edd6a4',fontSize:9}}>YOU · Cycle {fighter.cycle??1}</Text><OrnateMeter value={fighter.health} max={fighter.maxHealth}/><OrnateMeter value={fighter.mana} max={fighter.maxMana} mana/></View>
  <View style={{flex:1,gap:3}}><Text style={{color:'#ccb68d',fontSize:8}}>YOUR ITEMS</Text><ItemInventoryView inventory={equipment} maxVisible={compact?7:12} size={compact?27:36} onInspect={onInspect}/></View>
 </View>;
}
function HotbarFill({ value, max, mana }: { value: number; max: number; mana?: boolean }) {
  return <View accessibilityLabel={`${mana ? 'Mana' : 'Health'} ${value} of ${max}`} style={{ flex: 1, overflow: 'hidden', borderRadius: 6, backgroundColor: '#0006', justifyContent: 'center' }}>
    <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${max ? Math.max(0, Math.min(100, value / max * 100)) : 0}%`, backgroundColor: mana ? '#258ec0aa' : '#bf303aaa' }} />
    <Text style={{ color: '#fff2d9', fontSize: 9, textAlign: 'center', textShadowColor: '#000', textShadowRadius: 3, textShadowOffset: { width: 1, height: 1 } }}>{value} / {max}</Text>
  </View>;
}


