import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { KEYWORDS, type Domain } from '../config/catalogue';
import statuses from '../config/statuses.json';
import type { CombatFrame, Fighter } from '../game/model';

const icons:Record<string,string>={moonfire:'☾',sunfire:'☀',growth:'✚',starfall:'✦',rain:'☂',tide:'≈',slowness:'❄','next-instant':'ϟ','tidal-echo':'◎',fury:'⚔','star-empowerment':'✧',guard:'⬡',phoenix:'♨',overheat:'♨',hotstreak:'♨',combust:'ϟ'};
export function EffectBar({fighter,compact,group}:{fighter:Fighter;compact:boolean;group:'buff'|'debuff'}) {
 const [selected,setSelected]=useState<string|null>(null);
 const bad=group==='debuff';const color=bad?'#ff9388':'#a6e4a1';
 const items=Object.entries(fighter.statuses).filter(([id,n])=>{const kind=(statuses as Record<string,{kind:string}>)[id]?.kind;return n>0&&(kind==='dot'||kind==='debuff')===bad;});
 const info=selected&&fighter.statuses[selected]?KEYWORDS[selected]:null;
 return <View style={{flex:1,borderWidth:1,borderColor:bad?'#8a4540':'#436e4e',borderRadius:4,backgroundColor:bad?'#301514dc':'#12271de8',padding:2}}>
   <Text style={{color,fontSize:7,fontWeight:'800',textAlign:'center'}}>{bad?'− DEBUFFS':'+ BUFFS'}</Text>
   <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} contentContainerStyle={{flexDirection:bad?'row':'column',flexWrap:bad?'wrap':'nowrap',gap:2,alignItems:bad?'center':'stretch',justifyContent:bad?'center':'flex-start'}}>
     {!items.length&&<Text style={{color:'#aaa08c',fontSize:8,textAlign:'center'}}>None</Text>}
     {items.map(([id,count])=><Pressable key={id} accessibilityRole="button" accessibilityLabel={`${bad?'Debuff':'Buff'}: ${KEYWORDS[id]?.name??id}, ${count} ticks. Tap for details.`} onPress={()=>setSelected(id)} style={{flexDirection:'row',alignItems:'center',gap:2,borderWidth:1,borderColor:bad?'#9d5750':'#619069',borderRadius:3,backgroundColor:'#10150fee',minHeight:bad?18:24,paddingHorizontal:2}}>
       <Text style={{color,fontSize:13}}>{icons[id]??'✧'}</Text>
       {!bad&&<Text numberOfLines={1} adjustsFontSizeToFit style={{flex:1,color:'#ddedda',fontSize:8}}>{KEYWORDS[id]?.name??id}</Text>}
       <Text style={{color:'#fff',fontSize:10,fontWeight:'900'}}>{count}</Text>
     </Pressable>)}
   </ScrollView>
   <Modal visible={!!info} transparent animationType="fade" onRequestClose={()=>setSelected(null)}><View style={{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#0009',padding:24}}><View accessibilityViewIsModal style={{width:'100%',maxWidth:330,padding:16,gap:10,backgroundColor:'#191710',borderColor:color,borderWidth:1,borderRadius:6}}><Text style={{color,fontWeight:'800'}}>{bad?'− Debuff':'+ Buff'} · {info?.name} · {selected?fighter.statuses[selected]:0}T</Text><Text style={{color:'#eee0ca'}}>{info?.description}</Text><Pressable accessibilityRole="button" onPress={()=>setSelected(null)} style={{padding:10,borderWidth:1,borderColor:color}}><Text style={{color,textAlign:'center'}}>Close</Text></Pressable></View></View></Modal>
 </View>;
}
const domainColors:Record<Domain,string>={nature:'#a6e877',water:'#79d9ff',fire:'#ff955c',holy:'#ffe58b',affliction:'#dba0ff'};
type Hit=NonNullable<CombatFrame['damageEvents']>[number]&{key:string};
function FloatingHit({hit,index,onDone}:{hit:Hit;index:number;onDone:(key:string)=>void}) {
 const progress=useRef(new Animated.Value(0)).current;
 useEffect(()=>{const anim=Animated.timing(progress,{toValue:1,duration:1450,useNativeDriver:true});anim.start(({finished})=>{if(finished)onDone(hit.key);});return()=>anim.stop();},[]);
 return <Animated.Text style={[s.damage,{left:`${(hit.side==='player'?17:78)+(index%3-1)*5}%`,top:hit.side==='player'?'64%':'42%',color:hit.domain?domainColors[hit.domain]:'#fff3cf',fontSize:hit.critical?30:23,opacity:progress.interpolate({inputRange:[0,.65,1],outputRange:[1,1,0]}),transform:[{translateY:progress.interpolate({inputRange:[0,1],outputRange:[0,-65]})}]}]}>{hit.amount}{hit.critical?'!':''}</Animated.Text>;
}
export function DamageNumbers({frame}:{frame:CombatFrame}) {
 const [hits,setHits]=useState<Hit[]>([]);const previous=useRef(frame.tick);
 useEffect(()=>{
   const sequential=frame.tick===previous.current+1;previous.current=frame.tick;
   if(!sequential){setHits([]);return;}
   setHits(old=>[...old,...(frame.damageEvents??[]).map((hit,i)=>({...hit,key:`${frame.tick}-${i}`}))].slice(-24));
 },[frame]);
 return <View pointerEvents="none" style={[StyleSheet.absoluteFill,{zIndex:50}]}>{hits.map((hit,i)=><FloatingHit key={hit.key} hit={hit} index={i} onDone={key=>setHits(old=>old.filter(h=>h.key!==key))}/>)}</View>;
}
const s=StyleSheet.create({row:{flexDirection:'row',flexWrap:'wrap',gap:3,justifyContent:'center'},icon:{backgroundColor:'#17130feb',borderWidth:1,borderRadius:4,alignItems:'center',justifyContent:'center'},count:{position:'absolute',bottom:-1,right:1,color:'#fff',fontSize:10,fontWeight:'900',backgroundColor:'#120e0dcc',paddingHorizontal:1},tip:{position:'absolute',top:32,left:0,right:0,padding:6,backgroundColor:'#19130ff5',borderWidth:1,borderColor:'#bda169',borderRadius:4,zIndex:30},tipTitle:{color:'#f4d998',fontSize:11,fontWeight:'700'},tipText:{color:'#eee0ca',fontSize:10},damage:{position:'absolute',fontWeight:'900',textShadowColor:'#120700',textShadowOffset:{width:1,height:2},textShadowRadius:3}});
