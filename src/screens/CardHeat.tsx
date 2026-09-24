import settings from '../config/rules.json';
import {memo, useEffect, useRef} from 'react';
import {Animated, Easing, Platform, StyleSheet, View} from 'react-native';
import {heatColors} from '../theme';
import {useCombatMotion} from './CombatConnections';
import {useFeedbackProgress} from './useFeedbackProgress';

function Ignition({playing, speed, reduced}: {playing: boolean; speed: number; reduced: boolean}) {
  const burst = useFeedbackProgress(playing && !reduced, 600 / speed);
  if (reduced) return null;
  return <Animated.View style={[StyleSheet.absoluteFill, {
    borderRadius: 5, borderWidth: 2, borderColor: heatColors[5],
    boxShadow: `inset 0 0 16px ${heatColors[4]}`,
    opacity: burst.interpolate({inputRange: [0, .12, 1], outputRange: [.25, 1, 0]}),
  }]}/>;
}

/** Edge-only heat leaves the spell text and other combat cues unobscured. */
export const CardHeat = memo(function CardHeat({heat, empowered, next, playing, speed}: {
  heat: number; empowered: boolean; next: boolean; playing: boolean; speed: number;
}) {
  const reducedMotion = useCombatMotion();
  const phase = useRef(new Animated.Value(0)).current;
  const position = useRef(0);
  const stage = empowered ? settings.heatThreshold + 1 : Math.min(settings.heatThreshold, Math.max(0, heat));
  useEffect(() => {
    if (!playing || reducedMotion || !stage) return;
    let stopped = false;
    let started = performance.now(), start = position.current;
    const cycle = () => {
      if (stopped) return;
      start = position.current; started = performance.now();
      phase.setValue(start);
      const animation = Animated.timing(phase, {
        toValue: 1, duration: (1 - position.current) * (2100 - stage * 200) / speed,
        easing: Easing.linear, useNativeDriver: Platform.OS !== 'web', isInteraction: false,
      });
      animation.start(({finished}) => {
        if (!finished || stopped) return;
        position.current = 0;
        phase.setValue(0);
        cycle();
      });
    };
    cycle();
    return () => { stopped = true; position.current = Math.min(1, start + (performance.now() - started) * speed / (2100 - stage * 200)); phase.stopAnimation(); };
  }, [phase, playing, reducedMotion, speed, stage]);

  if (!stage) return null;
  const color = heatColors[stage - 1];
  const ready = next && stage === settings.heatThreshold;
  const pulse = reducedMotion ? .75 : phase.interpolate({inputRange: [0, .5, 1], outputRange: [ready ? .65 : .4, 1, ready ? .65 : .4]});
  return <View pointerEvents="none" accessibilityLabel={empowered ? 'Empowered heat flare' : `Card heat ${Math.min(settings.heatThreshold, heat)} of ${settings.heatThreshold}${ready ? ', next to ignite' : ''}`} style={StyleSheet.absoluteFill}>
    <Animated.View style={[StyleSheet.absoluteFill, {
      borderRadius: 5, borderWidth: empowered || ready ? 2 : stage >= 4 ? 1 : 0, borderColor: color,
      boxShadow: `inset 0 -${4 + stage * 2}px ${8 + stage * 4}px ${color}${stage === 3 || stage === 4 ? '99' : '66'}`, opacity: pulse,
    }]}/>
    {empowered && <>
      {[false, true].flatMap(right => [false, true].map(top => <View key={`${right}-${top}`} style={{position: 'absolute', ...(right ? {right: 0} : {left: 0}), ...(top ? {top: 0} : {bottom: 0}), width: 8, height: 8, borderColor: color, borderLeftWidth: right ? 0 : 2, borderRightWidth: right ? 2 : 0, borderTopWidth: top ? 2 : 0, borderBottomWidth: top ? 0 : 2, boxShadow: `0 0 9px ${color}`}}/>))}
      <Ignition playing={playing} speed={speed} reduced={reducedMotion}/>
    </>}
    {!reducedMotion && Array.from({length: empowered ? 14 : stage * 2 + 1}, (_, i) => {
      // Staggered sparks repeat on a single clock; no random values or layout changes.
      const spark = Animated.modulo(Animated.add(phase, i / (empowered ? 14 : stage * 2 + 1)), 1);
      return <Animated.View key={i} style={{
        position: 'absolute', bottom: 3, left: `${5 + (i * 37) % 90}%`,
        width: empowered ? 2.5 : 2, height: i % 3 === 0 ? 2 : 2 + stage * .6, borderRadius: 2,
        backgroundColor: color, boxShadow: `0 0 5px ${color}`,
        opacity: spark.interpolate({inputRange: [0, .15, .65, 1], outputRange: [0, .85, .4, 0]}),
        transform: [
          {translateY: spark.interpolate({inputRange: [0, 1], outputRange: [0, -(8 + stage * 5 + (i % 3) * 4)]})},
          {translateX: spark.interpolate({inputRange: [0, .5, 1], outputRange: [0, i % 2 ? 3 : -3, 0]})},
          {scale: spark.interpolate({inputRange: [0, 1], outputRange: [1, .3]})},
        ],
      }}/>;
    })}
  </View>;
});
