import {Animated, StyleSheet, Text, View} from 'react-native';
import type {CardDefinition} from '../config/catalogue';
import {combatColors, palette} from '../theme';
import {useCombatMotion} from './CombatConnections';
import {useFeedbackProgress} from './useFeedbackProgress';

/** A completed Echo leaves a translucent copy behind its original sequence card. */
export function CardEcho({card, index, compact, playing, speed}: {
  card: CardDefinition; index: number; compact: boolean; playing: boolean; speed: number;
}) {
  const reduced = useCombatMotion();
  const progress = useFeedbackProgress(playing, 2000 / speed);
  return <Animated.View pointerEvents="none" accessibilityLabel={`${card.name} Echo copy`} style={[
    StyleSheet.absoluteFill,
    {
      zIndex: 0, padding: 5, gap: 3, borderRadius: 7, borderWidth: 1,
      borderColor: combatColors.echo, backgroundColor: combatColors.echoSurface,
      boxShadow: `0 0 10px ${combatColors.echo}66`,
      opacity: progress.interpolate({inputRange: [0, .15, .65, 1], outputRange: [.45, .55, .4, 0]}),
      transform: [{translateY: reduced ? -16 : progress.interpolate({inputRange: [0, 1], outputRange: [-16, -38]})}],
    },
  ]}>
    <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
      <Text style={{color: combatColors.echo, fontSize: 8}}>{index + 1} · {'★'.repeat(card.stars)}</Text>
      <Text style={{color: combatColors.echo, fontSize: 9, fontWeight: '800'}}>{card.castTicks === 0 ? 'ϟ' : `${card.castTicks}T`}</Text>
    </View>
    <Text numberOfLines={2} style={{color: palette.cream, fontWeight: '800', fontSize: compact ? 10 : 13, lineHeight: compact ? 12 : 16}}>{card.name}</Text>
    <Text numberOfLines={compact ? 1 : 3} style={{color: combatColors.echo, fontSize: compact ? 8 : 11}}>{card.rules.replace(/\[|\]/g, '')}</Text>
    <Text style={{position: 'absolute', bottom: 2, left: 5, color: combatColors.echo, fontSize: 8, fontWeight: '800'}}>≈ ECHO</Text>
  </Animated.View>;
}
