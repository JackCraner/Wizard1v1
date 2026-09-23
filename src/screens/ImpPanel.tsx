import {Text, View} from 'react-native';
import type {CombatFrame} from '../game/model';
import {palette} from '../theme';
import {CombatAnchor} from './CombatConnections';

/** Reserve this slot even when no Imp exists, so both status boxes stay put. */
export function ImpPanel({frame, side, compact}: {frame: CombatFrame; side: 'player'|'bot'; compact: boolean}) {
  const imp = frame[side].imp;
  const damage = (frame.damageEvents ?? []).filter(e => e.side === side && e.target === 'imp').reduce((sum, e) => sum + e.amount, 0);
  return <View style={{width: 82, height: compact ? 32 : 54}}>
    {imp && <CombatAnchor id={`${side}:imp`} accessibilityLabel={`${side === 'player' ? 'Your' : 'Opponent'} Imp: ${imp.health > 0 ? `${imp.health} of ${imp.maxHealth} Health` : 'Defeated'}${imp.guard ? `, ${imp.guard} Guard` : ''}`} style={{flex: 1, borderRadius: 4, borderWidth: 1, borderColor: palette.purple, backgroundColor: '#20132f', padding: 2, gap: 2, justifyContent: 'center'}}>
      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
        <Text style={{color: palette.purpleLight, fontSize: 8, lineHeight: 9, fontWeight: '800'}}>IMP{imp.guard ? ` ◇${imp.guard}` : ''}</Text>
        {damage > 0 && <Text style={{color: palette.dangerText, fontSize: 9, lineHeight: 10, fontWeight: '800'}}>−{damage}</Text>}
      </View>
      <View accessibilityRole="progressbar" accessibilityLabel="Imp Health" accessibilityValue={{min: 0, max: imp.maxHealth, now: imp.health}} style={{height: compact ? 15 : 22, backgroundColor: '#100c18', borderRadius: 3, overflow: 'hidden'}}>
        <View style={{position: 'absolute', top: 0, bottom: 0, left: 0, width: `${Math.max(0, Math.min(100, imp.health / Math.max(1, imp.maxHealth) * 100))}%`, backgroundColor: imp.guard ? '#326581' : '#754099'}}/>
        <Text style={{color: palette.white, textAlign: 'center', fontSize: 9, lineHeight: compact ? 15 : 22, fontWeight: '800'}}>{imp.health > 0 ? `${imp.health}/${imp.maxHealth}` : 'DEFEATED'}</Text>
      </View>
    </CombatAnchor>}
  </View>;
}
