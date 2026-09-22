import { cardAt } from '../game/upgrades';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { SPELLS } from '../game/engine';
import type { Fighter } from '../game/model';
import { COMBAT_TICK_MS } from '../game/playback';

export function CastBar({fighter,tick,speed,playing,finished,compact}:{fighter:Fighter;tick:number;speed:number;playing:boolean;finished:boolean;compact:boolean}) {
  const fill=useRef(new Animated.Value(0)).current;
  const segment=useRef({tick:-1,value:0});
  const cast=fighter.casting;
  const spell=cardAt(cast?.spell??fighter.spells[fighter.cursor],fighter.spellXp?.[cast?.index??fighter.cursor]);
  let duration=cast?.totalTicks??spell?.castTicks??0;

  const remaining=cast?.remaining??duration;
  const reshuffling=(fighter.reshuffleRemaining??0)>0;
  const skipped=reshuffling;
  const instant=duration===0;
  const start=finished||skipped?0:instant?1:Math.max(0,(duration-remaining)/duration);
  const end=finished||skipped?0:instant?1:Math.min(1,start+1/Math.max(1,duration));
  useEffect(()=>{
    fill.stopAnimation();
    if(segment.current.tick!==tick){segment.current={tick,value:start};fill.setValue(start);}
    if(finished||skipped||instant){segment.current.value=start;fill.setValue(start);}
    if(!playing||finished||skipped||instant)return;
    const animation=Animated.timing(fill,{toValue:end,duration:COMBAT_TICK_MS/speed*Math.max(0,(end-segment.current.value)/Math.max(.0001,end-start)),easing:Easing.linear,useNativeDriver:false});
    animation.start();return()=>fill.stopAnimation(value=>{segment.current.value=value;});
  },[tick,speed,playing,finished,start,end,skipped,instant,fill]);
  const label=finished?'Duel complete':reshuffling?'Reshuffling':spell?.name??'Ready';
  const detail=finished?'':reshuffling?`${fighter.reshuffleRemaining}T`:`${remaining}T`;
  return <View accessibilityRole="progressbar" accessibilityLabel={`${label}, ${detail}`} accessibilityValue={{min:0,max:100,now:Math.round(start*100)}} style={{position:'absolute',bottom:0,height:21,width:'115%',borderRadius:4,overflow:'hidden',borderWidth:1,borderColor:finished?'#7d7054':'#e5c16a',backgroundColor:'#18171de8'}}>
    <Animated.View style={{position:'absolute',top:0,bottom:0,left:0,width:fill.interpolate({inputRange:[0,1],outputRange:['0%','100%']}),backgroundColor:instant?'#355b4a':'#77602e'}} />
    <View style={{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:4,gap:3}}><Text numberOfLines={1} style={{flex:1,color:'#fff2d2',fontSize:compact?9:12,fontWeight:'700'}}>{label}</Text><Text style={{color:'#ffe39b',fontSize:compact?8:10}}>{detail}</Text></View>
  </View>;
}
