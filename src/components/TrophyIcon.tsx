import Svg, {Path} from 'react-native-svg';
import {palette} from '../theme';

/** A single-color cup that stays legible beside the shop's resource counters. */
export function TrophyIcon() {
 return <Svg width={18} height={18} viewBox="0 0 24 24" accessible={false}>
  <Path d="M7 3h10v6a5 5 0 0 1-10 0V3Z M10.5 14h3v5h-3z M7 19h10v3H7z" fill={palette.gold}/>
  <Path d="M7 5H3v3c0 3 2 5 5 5M17 5h4v3c0 3-2 5-5 5" fill="none" stroke={palette.gold} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
 </Svg>;
}
