import {useEffect,useRef,useState} from 'react';
import {Animated,Easing,Text,View} from 'react-native';
import type {CombatFrame} from '../game/model';
import {combatProcCues,type ProcCue} from '../game/combatProcs';

function ProcAnimation({cue,speed,playing,lane}:{cue:ProcCue;speed:number;playing:boolean;lane:number}){
 const progress=useRef(new Animated.Value(0)).current;
 const elapsed=useRef(0);
 const fire=cue.kind==='combust',color=fire?'#ffb35a':'#7edfff';
 useEffect(()=>{
  if(!playing)return;
  const animation=Animated.timing(progress,{toValue:1,duration:Math.max(1,1500/speed*(1-elapsed.current)),easing:Easing.out(Easing.quad),useNativeDriver:true});
  animation.start();return()=>{progress.stopAnimation(value=>{elapsed.current=value;});};
 },[playing,speed,progress]);
 return <Animated.View pointerEvents="none" accessibilityLabel={cue.text} style={{position:'absolute',bottom:32+lane*48,left:-12,right:-12,alignItems:'center',opacity:progress.interpolate({inputRange:[0,.12,.7,1],outputRange:[0,1,1,0]}),transform:[{translateY:progress.interpolate({inputRange:[0,1],outputRange:[8,-30]})}]}}>
  {fire?[0,1,2].map(i=><Animated.View key={i} style={{position:'absolute',bottom:14+i*9,width:90-i*14,height:3,borderRadius:3,backgroundColor:color,transform:[{translateX:progress.interpolate({inputRange:[0,1],outputRange:[-38,38]})},{rotate:'-15deg'}]}}/>):[0,1].map(i=><Animated.View key={i} style={{position:'absolute',bottom:8,width:62,height:62,borderRadius:31,borderWidth:2,borderColor:color,transform:[{translateX:i===0?-14:14},{scale:progress.interpolate({inputRange:[0,1],outputRange:[.45,1.5+i*.2]})}]}}/>)}
  <View style={{paddingHorizontal:6,paddingVertical:4,borderRadius:5,borderWidth:1,borderColor:color,backgroundColor:fire?'#3e1b0bf0':'#082d40f0'}}>
   <Text style={{color,fontWeight:'900',fontSize:10,textAlign:'center'}}>{fire?'ϟ COMBUST':'≈ TIDECALLER ×2'}</Text>
   <Text numberOfLines={2} style={{color:'#fff3db',fontSize:9,textAlign:'center',maxWidth:140}}>{cue.text}</Text>
  </View>
 </Animated.View>;
}

export function CombatProcs({frame,speed,playing,compact}:{frame:CombatFrame;speed:number;playing:boolean;compact:boolean}){
 const previous=useRef(frame.tick);
 const [cues,setCues]=useState(()=>combatProcCues(frame));
 useEffect(()=>{
  const sequential=frame.tick===previous.current||frame.tick===previous.current+1;
  previous.current=frame.tick;setCues(sequential?combatProcCues(frame):[]);
 },[frame]);
 return <View pointerEvents="none" style={{position:'absolute',top:0,left:0,right:0,bottom:0,zIndex:40}}>
  {cues.map((cue,i)=><View key={`${frame.tick}-${cue.side}-${cue.kind}-${i}`} style={{position:'absolute',top:0,bottom:0,width:compact?112:190,...(cue.side==='player'?{left:'13%'}:{right:'18%'})}}><ProcAnimation cue={cue} lane={cues.slice(0,i).filter(c=>c.side===cue.side).length} speed={speed} playing={playing}/></View>)}
 </View>;
}
