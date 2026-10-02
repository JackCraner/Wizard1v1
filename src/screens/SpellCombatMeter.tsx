import { Text, View } from 'react-native';
import type { SpellTotal } from '../game/combatTotals';
import { palette } from '../theme';

export function SpellCombatMeter({ total, max, name, compact }: { total: SpellTotal; max: number; name: string; compact: boolean }) {
  return <View pointerEvents="none" accessibilityLabel={`${name}: ${total.damage} total damage, ${total.healing} total healing`} style={{ position: 'absolute', left: 3, right: 3, bottom: 4, top: compact ? 24 : 42, backgroundColor: '#08111dcc', borderRadius: 4, padding: 3, justifyContent: 'center', gap: 3 }}>
    {(['damage', 'healing'] as const).map(kind => <View key={kind} style={{ height: compact ? 16 : 25, backgroundColor: '#ffffff0c', borderRadius: 2, overflow: 'hidden', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${100 * total[kind] / Math.max(1, max)}%`, backgroundColor: kind === 'damage' ? '#ee746455' : '#73db9855' }}/>
      <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: kind === 'damage' ? palette.dangerText : '#a9eac2', fontWeight: '900', fontSize: compact ? 10 : 14, paddingHorizontal: 3 }}>{kind === 'damage' ? 'DMG' : 'HEAL'} {total[kind]}</Text>
    </View>)}
  </View>;
}
