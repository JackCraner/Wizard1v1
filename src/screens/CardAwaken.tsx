import {Animated} from 'react-native';
import Svg, {G, Path} from 'react-native-svg';
import {combatColors, palette} from '../theme';
import {COMBAT_TICK_MS} from '../game/playback';
import {useCombatMotion} from './CombatConnections';
import {useFeedbackProgress} from './useFeedbackProgress';

/** Feathered wings unfurl outside the card without taking space or holding combat. */
export function CardAwaken({playing,speed}:{playing:boolean;speed:number}) {
 const reduced=useCombatMotion();
 const progress=useFeedbackProgress(playing,COMBAT_TICK_MS/speed);
 return <Animated.View pointerEvents="none" accessibilityLabel="Awakening wings" style={{
  position:'absolute',left:'-38%',right:'-38%',top:0,bottom:0,zIndex:3,
  opacity:progress.interpolate({inputRange:[0,.18,.65,1],outputRange:[.55,.95,.8,0]}),
  transform:reduced?[]:[
   {scaleX:progress.interpolate({inputRange:[0,.3,.7,1],outputRange:[.64,1,1.04,1.08]})},
   {translateY:progress.interpolate({inputRange:[0,.35,1],outputRange:[5,-3,-8]})},
  ],
 }}>
  <Svg width="100%" height="100%" viewBox="0 0 176 100" preserveAspectRatio="none">
   {[false,true].map(mirror=><G key={String(mirror)} transform={mirror?'translate(176 0) scale(-1 1)':undefined}>
    <Path d="M39 70 C23 63 7 37 3 9 C14 22 26 23 39 37 L43 58 Z" fill={combatColors.awakened} opacity={.35}/>
    <Path d="M40 65 C22 58 7 29 3 9 C11 23 22 29 36 37 L42 48 C27 41 17 30 12 24 C19 42 29 48 42 52 L43 58 C30 55 21 48 16 42 C23 57 31 60 42 61 L43 68 C35 68 29 65 25 61 L39 76 Z" fill={palette.parchment} stroke={palette.gold} strokeWidth={.8}/>
    <Path d="M39 43 Q24 34 17 24 M40 54 Q28 50 23 43 M39 65 L32 62" fill="none" stroke={combatColors.awakened} strokeWidth={1.2}/>
   </G>)}
  </Svg>
 </Animated.View>;
}
