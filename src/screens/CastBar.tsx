import { combatColors, DOMAIN_COLORS } from '../theme';
import { cardAt } from '../game/upgrades';
import { activeSpellIndices } from '../game/rotation';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import type { Fighter } from '../game/model';
import { COMBAT_TICK_MS } from '../game/playback';


export function CastBar({fighter,reshuffleTicks,tick,speed,playing,finished,compact}:{fighter:Fighter;reshuffleTicks:number;tick:number;speed:number;playing:boolean;finished:boolean;compact:boolean}) {
  const fill=useRef(new Animated.Value(0)).current;
  const segment=useRef({tick:-1,value:0});
  const cast=fighter.casting;
  const empty=activeSpellIndices(fighter).length===0;
  const spell=empty?undefined:cardAt(cast?.spell??fighter.spells[fighter.cursor],fighter.spellXp?.[cast?.index??fighter.cursor]);
  const reshuffling=(fighter.reshuffleRemaining??0)>0;
  const duration=Math.max(1,reshuffling?reshuffleTicks:cast?.totalTicks??spell?.castTicks??1);
  const remaining=reshuffling?fighter.reshuffleRemaining:cast?.remaining??duration;
  const stunned=!reshuffling&&(fighter.statuses.stun??0)>0;
  const skipped=empty;
  const instant=!reshuffling&&(cast?.instant??spell?.castTicks===0);
  const start=finished||skipped?0:Math.max(0,(duration-remaining)/duration);
  const end=stunned?start:finished||skipped?0:Math.min(1,start+1/Math.max(1,duration));
  useEffect(()=>{
    fill.stopAnimation();
    if(segment.current.tick!==tick){segment.current={tick,value:start};fill.setValue(start);}
    if(finished||skipped){segment.current.value=start;fill.setValue(start);}
    if(!playing||finished||skipped||stunned)return;
    const animation=Animated.timing(fill,{toValue:end,duration:COMBAT_TICK_MS/speed*Math.max(0,(end-segment.current.value)/Math.max(.0001,end-start)),easing:Easing.linear,useNativeDriver:false});
    animation.start();return()=>fill.stopAnimation(value=>{segment.current.value=value;});
  },[tick,speed,playing,finished,start,end,skipped,instant,stunned,fill]);
  const label=finished?'Duel complete':empty?'No spells remaining':stunned?'Stunned · rotation paused':reshuffling?'Reshuffling':spell?.name??'Ready';
  const detail=finished||empty?'':stunned?`${fighter.statuses.stun}T`:reshuffling?`${fighter.reshuffleRemaining}T`:`${remaining}T`;
  const powerLabel=cast&&!finished&&!skipped&&!reshuffling?[cast.empowered?'♨ Empowered':'',cast.echoPower!==undefined?'≈ Echo '+Math.floor(cast.echoPower*100)+'%':''].filter(Boolean).join(' · '):'';
  const accent=reshuffling?combatColors.reshuffle:cast?.empowered?combatColors.empowered:cast?.echoPower!==undefined?combatColors.echo:stunned?'#d6a1e8':spell?DOMAIN_COLORS[spell.domain]:'#e5c16a';
  return <View accessibilityRole="progressbar" accessibilityLabel={`${label}, ${detail}${powerLabel?`, ${powerLabel}`:''}`} accessibilityValue={{min:0,max:100,now:Math.round(start*100)}} style={{position:'absolute',bottom:2,height:compact?32:38,width:'128%',borderRadius:7,overflow:'hidden',borderWidth:1,borderColor:finished?'#7d7054':accent,backgroundColor:'#111720f2',boxShadow:finished?'none':`0 0 8px ${accent}44`}}>
    <Animated.View style={{position:'absolute',top:0,bottom:0,left:0,width:fill.interpolate({inputRange:[0,1],outputRange:['0%','100%']}),backgroundColor:accent,opacity:.36,borderRightWidth:2,borderRightColor:'#fff2cf'}} />
    <View pointerEvents="none" style={{position:'absolute',left:0,right:0,top:0,height:1,backgroundColor:'#ffffff66'}} />
    <View style={{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:7,gap:5}}><Text numberOfLines={1} style={{flex:1,color:'#fff2d2',fontSize:compact?11:13,fontWeight:'700'}}>{label}</Text>{!!powerLabel&&<Text style={{color:accent,fontSize:compact?9:11,fontWeight:'900'}}>{powerLabel}</Text>}<Text style={{color:'#fff1c9',fontSize:compact?11:12,fontWeight:'800'}}>{instant&&!finished&&!skipped?'ϟ '+detail:detail}</Text></View>
  </View>;
}
