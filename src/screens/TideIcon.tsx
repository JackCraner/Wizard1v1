import {useEffect, useRef, type ReactNode} from 'react';
import {Animated, Easing} from 'react-native';
import Svg, {Circle, Path} from 'react-native-svg';
import {combatColors} from '../theme';
import {useCombatMotion} from './CombatConnections';

/** Shared, pausable glow for reserved combat resources. */
export function StatusIconPulse({active, playing, speed, color, backgroundColor, children}: {active: boolean; playing: boolean; speed: number; color: string; backgroundColor: string; children: ReactNode}) {
  const reduced = useCombatMotion();
  const phase = useRef(new Animated.Value(0)).current;
  const position = useRef(0);
  useEffect(() => {
    const listener = phase.addListener(({value}) => { position.current = value; });
    return () => phase.removeListener(listener);
  }, [phase]);
  useEffect(() => {
    if (!active || !playing || reduced) return;
    let stopped = false;
    const pulse = () => {
      if (stopped) return;
      Animated.timing(phase, {toValue: 1, duration: (1 - position.current) * 1100 / speed, easing: Easing.linear, useNativeDriver: false}).start(({finished}) => {
        if (!finished || stopped) return;
        position.current = 0;
        phase.setValue(0);
        pulse();
      });
    };
    pulse();
    return () => { stopped = true; phase.stopAnimation(); };
  }, [active, playing, reduced, speed, phase]);
  return <Animated.View style={{width: 18, height: 18, borderRadius: 9,
    backgroundColor,
    boxShadow: active ? `0 0 7px ${color}` : 'none',
    opacity: active && !reduced ? phase.interpolate({inputRange: [0, .5, 1], outputRange: [.5, 1, .5]}) : 1,
  }}>
    {children}
  </Animated.View>;
}

export function TideIcon({active, playing, speed}: {active: boolean; playing: boolean; speed: number}) {
  return <StatusIconPulse active={active} playing={playing} speed={speed} color={combatColors.echo} backgroundColor={combatColors.echoSurface}>
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={10.5} fill="none" stroke={combatColors.echo} strokeWidth={active ? 2 : 1}/>
      <Path d="M5 9 Q8 6 12 9 T19 9 M5 14 Q8 11 12 14 T19 14" fill="none" stroke={combatColors.echo} strokeWidth={2} strokeLinecap="round"/>
    </Svg>
  </StatusIconPulse>;
}
