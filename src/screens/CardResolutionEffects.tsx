import {Animated,StyleSheet,View,type StyleProp,type ViewStyle} from 'react-native';
import type {ReactNode} from 'react';
import {palette} from '../theme';
import {useCombatMotion} from './CombatConnections';
import {useFeedbackProgress} from './useFeedbackProgress';

/** Three light layers, one native opacity/transform clock; no particles or blur. */
export function OathLight({playing,speed}:{playing:boolean;speed:number}) {
 const reduced=useCombatMotion();
 const progress=useFeedbackProgress(playing,850/speed);
 return <Animated.View pointerEvents="none" accessibilityLabel="Oath fulfilled: holy light" style={[StyleSheet.absoluteFill,{zIndex:4,opacity:progress.interpolate({inputRange:[0,.15,.6,1],outputRange:[.35,.9,.55,0]})}]}>
  <View style={[StyleSheet.absoluteFill,{borderRadius:7,borderWidth:2,borderColor:palette.cream,backgroundColor:'#ffeeb533'}]}/>
  <Animated.View style={{position:'absolute',left:'35%',width:'30%',top:-16,bottom:-8,backgroundColor:'#fff7d966',borderRadius:20,transform:reduced?[]:[{scaleX:progress.interpolate({inputRange:[0,.3,1],outputRange:[.3,1.3,.7]})}]}}/>
  <Animated.View style={{position:'absolute',left:'15%',right:'15%',top:'45%',height:3,backgroundColor:palette.cream,transform:reduced?[]:[{scaleX:progress.interpolate({inputRange:[0,.3,1],outputRange:[.2,1,.5]})}]}}/>
 </Animated.View>;
}

/** Clip the original card into two halves rather than rendering particle debris. */
export function CardShatter({children,width,height,cardStyle,playing,speed,onDone}:{
 children:ReactNode;width:number;height:number;cardStyle:StyleProp<ViewStyle>;playing:boolean;speed:number;onDone:()=>void;
}) {
 const reduced=useCombatMotion();
 const progress=useFeedbackProgress(playing,650/speed,onDone);
 return <View pointerEvents="none" accessible accessibilityLabel="Fragile spell shattering" style={{width,height}}>
  {[-1,1].map(direction=><Animated.View key={direction} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{position:'absolute',left:direction<0?0:width/2,width:width/2,height,overflow:'hidden',opacity:progress.interpolate({inputRange:[0,.35,1],outputRange:[1,1,0]}),transform:reduced?[]:[
   {translateX:progress.interpolate({inputRange:[0,.12,1],outputRange:[0,direction*2,direction*22]})},
   {translateY:progress.interpolate({inputRange:[0,.25,1],outputRange:[0,-3,22]})},
   {rotate:progress.interpolate({inputRange:[0,1],outputRange:['0deg',direction*18+'deg']})},
  ]}}>
   <View style={[cardStyle,{position:'absolute',left:direction<0?0:-width/2,width,height}]}>{children}</View>
   <View style={{position:'absolute',top:0,bottom:0,...(direction<0?{right:0}:{left:0}),width:1,backgroundColor:palette.gold}}/>
  </Animated.View>)}
 </View>;
}

