import {Animated, StyleSheet, Text, View} from 'react-native';
import type {CardDefinition} from '../config/catalogue';
import {combatColors, palette} from '../theme';
import {useCombatMotion} from './CombatConnections';
import {useFeedbackProgress} from './useFeedbackProgress';

/** A completed Echo leaves a translucent copy behind its original sequence card. */
export function CardEcho({card, compact, playing, speed}: {
  card: CardDefinition; compact: boolean; playing: boolean; speed: number;
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
    <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
      <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={.8} style={{flex: 1, minWidth: 0, color: palette.cream, fontWeight: '800', fontSize: compact ? 10 : 13, lineHeight: compact ? 12 : 16}}>{card.name}</Text>
      <Text style={{color: combatColors.echo, fontSize: 9, fontWeight: '800'}}>{card.castTicks === 0 ? 'ϟ' : card.castTicks+'T'}</Text>
    </View>
    <Text numberOfLines={compact ? 3 : 5} style={{flexShrink: 1, color: combatColors.echo, fontSize: compact ? 8 : 11, lineHeight: compact ? 10 : 14}}>{card.rules.replace(/\[|\]/g, '')}</Text>
    <View style={{position: 'absolute', top: -5, left: 0, right: 0, alignItems: 'center'}}>
      <Text style={{color: combatColors.echo, backgroundColor: combatColors.echoSurface, paddingHorizontal: 4, fontSize: 8, lineHeight: 10, letterSpacing: 1}}>{'★'.repeat(card.stars)}</Text>
    </View>
  </Animated.View>;
}
