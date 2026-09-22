import {KEYWORD_DOMAINS,DOMAIN_COLORS} from '../game/attunement';
import { STATUS_ART } from '../components/cards/spellArt';
import { useEffect, useRef, useState } from 'react';
import { Animated, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { KEYWORDS } from '../config/catalogue';
import statuses from '../config/statuses.json';
import type { CombatFrame, Fighter } from '../game/model';

const icons:Record<string,string>={unholy:'☀',curse:'☽',stun:'⏸',poison:'☠',regeneration:'✚',tidecaller:'≈',guard:'◇',resilience:'⬡',trap:'⚠',weaken:'↓',potency:'✹',fury:'↑',heat:'♨',slow:'⌛',frailty:'◇',repetition:'↻'};
const keyword=(id:string)=>KEYWORDS[id==='repetition'?'curse':id];
const unit=(id:string)=>(statuses as Record<string,{unit:string}>)[id]?.unit??'ticks';
export function EffectBar({fighter,compact,group,highlight=[],onInspect}:{fighter:Fighter;compact:boolean;group:'buff'|'debuff';highlight?:string[];onInspect?:()=>void}) {
 const [selected,setSelected]=useState<string|null>(null);
 const bad=group==='debuff';const color=bad?'#ff9388':'#a6e4a1';
 const displayed:Record<string,number>={...fighter.statuses,...Object.fromEntries(['poisonPower','regenerationPower','nextDamage','nextEcho','critDamage'].filter(id=>((fighter.memory as unknown as Record<string,number>)[id]??0)>1||(id==='nextEcho'&&fighter.memory.nextEcho!==undefined)).map(id=>[id,(fighter.memory as unknown as Record<string,number>)[id]])),...(fighter.memory.permanentResilience?{resilience:1}:{})};
 const items=Object.entries(displayed).filter(([id,n])=>{const kind=(statuses as Record<string,{kind:string}>)[id]?.kind;return n>0&&(kind==='dot'||kind==='debuff')===bad;});
 const oath=fighter.oath;
 const oathLabel=oath?'Oath of '+oath.id.split('-').map(word=>word[0].toUpperCase()+word.slice(1)).join(' '):'';
 const oathProgress=oath?.remaining===undefined?'Until reshuffle':oath.remaining+' ticks left'+(oath.requirement==='deal100'?' · '+(oath.progress??0)+'/100 damage':'');
 const info=selected==='oath'&&oath?{name:oathLabel,description:KEYWORDS.oath.description+' '+({dealNone:'Deal no damage.',deal100:'Deal at least 100 damage across the window.',takeNone:'Take no damage.',meditate:'Complete five stunned ticks.'}[oath.requirement])+' Reward: '+oath.amount+' '+oath.reward+(oath.reward==='damage'?'':' ticks')+'.'}:selected&&displayed[selected]?keyword(selected):null;
 return <View style={{flex:bad?1:undefined,flexShrink:1,maxHeight:'100%',borderWidth:1,borderColor:bad?'#8a4540':'#436e4e',borderRadius:4,backgroundColor:bad?'#301514dc':'#12271de8',padding:2}}>
   {!bad&&oath&&<Pressable accessibilityRole="button" accessibilityLabel={oathLabel+'. '+oathProgress+'. Inspect Oath.'} onPress={()=>{onInspect?.();setSelected('oath');}} style={{padding:3,borderWidth:1,borderColor:'#d6b766',backgroundColor:'#362e17',borderRadius:3}}><Text numberOfLines={1} adjustsFontSizeToFit style={{color:'#ffe3a1',fontSize:8,textAlign:'center'}}>{oathLabel}</Text><Text style={{color:'#f0ddb6',fontSize:7,textAlign:'center'}}>{oathProgress}</Text></Pressable>}
   <Text style={{color,fontSize:7,fontWeight:'800',textAlign:'center'}}>{bad?'− DEBUFFS':'+ BUFFS'}</Text>
   <ScrollView style={{flexGrow:0,flexShrink:1}} nestedScrollEnabled showsVerticalScrollIndicator={false} contentContainerStyle={{flexDirection:bad?'row':'column',flexWrap:bad?'wrap':'nowrap',gap:2,alignItems:bad?'center':'stretch',justifyContent:bad?'center':'flex-start'}}>
     {!items.length&&<Text style={{color:'#aaa08c',fontSize:8,textAlign:'center'}}>None</Text>}
     {items.map(([id,count])=><Pressable key={id} accessibilityRole="button" accessibilityLabel={`${bad?'Debuff':'Buff'}: ${keyword(id)?.name??id}, ${id==='resilience'&&fighter.memory.permanentResilience?'rest of combat':count+' '+unit(id)}. Tap for details.`} onPress={()=>{onInspect?.();setSelected(id);}} style={{flexDirection:'row',alignItems:'center',gap:2,borderWidth:1,borderColor:highlight.includes(id)?'#fff0a2':bad?'#9d5750':'#619069',borderRadius:3,backgroundColor:highlight.includes(id)?'#625025':'#10150fee',minHeight:bad?22:24,paddingHorizontal:2}}>
       {STATUS_ART[id]?<Image accessible={false} source={STATUS_ART[id]} resizeMode="contain" style={{width:20,height:20,borderRadius:2}}/>:<Text style={{color,fontSize:13}}>{icons[id]??'✧'}</Text>}
       {!bad&&!compact&&<Text numberOfLines={1} adjustsFontSizeToFit style={{flex:1,color:KEYWORD_DOMAINS[id]?DOMAIN_COLORS[KEYWORD_DOMAINS[id]]:'#ddedda',fontSize:8}}>{keyword(id)?.name??id}</Text>}
       <Text style={{color:'#fff',fontSize:10,fontWeight:'900'}}>{id==='resilience'&&fighter.memory.permanentResilience?'∞':count+(unit(id)==='ticks'?'T':unit(id)==='multiplier'?'×':'')}</Text>
     </Pressable>)}
   </ScrollView>
   <Modal visible={!!info} transparent animationType="fade" onRequestClose={()=>setSelected(null)}><View style={{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#0009',padding:24}}><View accessibilityViewIsModal style={{width:'100%',maxWidth:330,padding:16,gap:10,backgroundColor:'#191710',borderColor:color,borderWidth:1,borderRadius:6}}><Text style={{color,fontWeight:'800'}}>{bad?'− Debuff':'+ Buff'} · {info?.name} · {selected==='oath'?oathProgress:`${selected?displayed[selected]:0} ${selected?unit(selected):""}`}</Text><Text style={{color:'#eee0ca'}}>{info?.description}</Text><Pressable accessibilityRole="button" onPress={()=>setSelected(null)} style={{padding:10,borderWidth:1,borderColor:color}}><Text style={{color,textAlign:'center'}}>Close</Text></Pressable></View></View></Modal>
 </View>;
}
type Hit={target?:'wizard'|'imp'|'ward';side:'player'|'bot';amount:number;critical:boolean;healing:boolean;key:string;delay:number};
const impArt = require('../../assets/Imp.png');
export function ImpCompanion({fighter,onInspect,frame,side}:{fighter:Fighter;onInspect:()=>void;frame:CombatFrame;side:'player'|'bot'}) {
 const [open,setOpen]=useState(false);const imp=fighter.imp;
 if(!imp)return null;
 const alive=imp.health>0;
 return <>
  <Pressable accessibilityRole="button" accessibilityLabel={`${fighter.name==='You'?'Your':fighter.name+"'s"} Imp: ${imp.health} of ${imp.maxHealth} Health${imp.guard>0?`, Guard ${imp.guard} ticks`:''}. ${fighter.memory.impDamage??0} damage per completed spell. Inspect Imp.`} onPress={()=>{onInspect();setOpen(true);}} style={{position:'absolute',bottom:34,alignSelf:'center',width:112,padding:4,borderRadius:8,borderWidth:1,borderColor:imp.guard?'#9be3ff':'#be85e9',backgroundColor:'#20132feb',alignItems:'center',zIndex:23,opacity:alive?1:.65}}>
   <View style={{flexDirection:'row',alignItems:'center',gap:4}}><Image accessible={false} source={impArt} resizeMode="contain" style={{width:42,height:56}}/><View><Text style={{color:'#e3baff',fontSize:10,fontWeight:'800'}}>IMP{imp.guard>0?' ◇':''}</Text><Text style={{color:'#fff',fontSize:10}}>{alive?'ACTIVE':'Defeated'}</Text></View></View>
   <View accessibilityRole="progressbar" accessibilityLabel="Imp Health" accessibilityValue={{min:0,max:imp.maxHealth,now:imp.health}} style={{height:16,width:'100%',backgroundColor:'#24132f',borderWidth:1,borderColor:'#be85e9',borderRadius:3,overflow:'hidden'}}><View style={{position:'absolute',height:'100%',width:`${Math.max(0,Math.min(100,100*imp.health/imp.maxHealth))}%`,backgroundColor:imp.guard?'#326581':'#754099'}}/><Text style={{color:'#fff',fontSize:10,fontWeight:'800',textAlign:'center'}}>{imp.health} / {imp.maxHealth} HP</Text></View>
   {alive&&<Text style={{fontSize:8,color:'#ead3fa',marginTop:2}}>{imp.guard>0?`Guard · ${imp.guard}T`:(fighter.memory.impDamage?`${fighter.memory.impDamage} / spell`:'Protecting you')}</Text>}
   <DamageNumbers frame={frame} impSide={side}/>
  </Pressable>
  <Modal visible={open} transparent onRequestClose={()=>setOpen(false)} animationType="fade"><View style={{flex:1,backgroundColor:'#000a',alignItems:'center',justifyContent:'center',padding:20}}><View accessibilityViewIsModal style={{width:"100%",maxWidth:360,maxHeight:"100%",padding:14,gap:8,backgroundColor:'#20132f',borderWidth:1,borderColor:'#be85e9',borderRadius:10}}><View style={{flexDirection:"row",alignItems:"center",gap:12}}><Image accessible={false} source={impArt} resizeMode="contain" style={{width:48,height:64}}/><Text style={{flex:1,fontSize:18,color:"#e3baff",fontWeight:"800"}}>Imp · {imp.health}/{imp.maxHealth} Health</Text></View><Text style={{color:'#fff'}}>{KEYWORDS.summon.description}</Text><Text style={{color:'#d5c5e7'}}>Guard: {imp.guard} ticks. Attack: {fighter.memory.impDamage??0} damage per completed spell. Summoning after defeat creates a fresh Imp.</Text><Pressable accessibilityRole="button" onPress={()=>setOpen(false)} style={{padding:10,borderWidth:1,borderColor:'#be85e9'}}><Text style={{color:'#fff',textAlign:'center'}}>Close Imp details</Text></Pressable></View></View></Modal>
 </>;
}
function FloatingHit({hit,index,onDone}:{hit:Hit;index:number;onDone:(key:string)=>void}) {
 const progress=useRef(new Animated.Value(0)).current;
 useEffect(()=>{const anim=Animated.timing(progress,{toValue:1,duration:1450,delay:hit.delay,useNativeDriver:true});anim.start(({finished})=>{if(finished)onDone(hit.key);});return()=>anim.stop();},[]);
 return <Animated.Text style={[s.damage,{left:hit.target==='imp'?`${20+(index%3)*15}%`:`${(hit.side==='player'?17:78)+(index%3-1)*5}%`,top:hit.target==='imp'?'15%':'38%',color:hit.healing?'#87f5a0':hit.target==='ward'?'#8bd7ff':'#ff7770',textShadowColor:hit.target==='ward'?'#163f60':hit.critical?'#ff3727':'#120700',textShadowRadius:hit.critical?12:3,textShadowOffset:hit.critical?{width:0,height:0}:{width:1,height:2},fontSize:hit.critical?30:23,opacity:progress.interpolate({inputRange:[0,.01,.65,1],outputRange:[0,1,1,0]}),transform:[{translateY:progress.interpolate({inputRange:[0,1],outputRange:[0,-65]})}]}]}>{hit.healing?'+':'−'}{Math.abs(hit.amount)}{hit.critical?'!':''}</Animated.Text>;
}
export function DamageNumbers({frame,impSide}:{frame:CombatFrame;impSide?:'player'|'bot'}) {
 const [hits,setHits]=useState<Hit[]>([]);const previous=useRef(frame.tick);
 useEffect(()=>{
   const sequential=frame.tick===previous.current+1||frame.tick===previous.current;previous.current=frame.tick;
   if(!sequential){setHits([]);return;}
   setHits(old=>[...old,...(frame.damageEvents??[]).filter(hit=>impSide?hit.target==='imp'&&hit.side===impSide:hit.target!=='imp').map((hit,i)=>({...hit,healing:false,delay:0,key:`${frame.tick}-${frame.presentationPhase}-damage-${i}`})),...(frame.healingEvents??[]).filter(hit=>impSide?hit.target==='imp'&&hit.side===impSide:hit.target!=='imp').map((hit,i)=>({...hit,healing:true,critical:false,delay:0,key:`${frame.tick}-${frame.presentationPhase}-heal-${i}`}))].slice(-36));
 },[frame,impSide]);
 return <View pointerEvents="none" style={[StyleSheet.absoluteFill,{zIndex:50}]}>{hits.map((hit,i)=><FloatingHit key={hit.key} hit={hit} index={i} onDone={key=>setHits(old=>old.filter(h=>h.key!==key))}/>)}</View>;
}
const s=StyleSheet.create({row:{flexDirection:'row',flexWrap:'wrap',gap:3,justifyContent:'center'},icon:{backgroundColor:'#17130feb',borderWidth:1,borderRadius:4,alignItems:'center',justifyContent:'center'},count:{position:'absolute',bottom:-1,right:1,color:'#fff',fontSize:10,fontWeight:'900',backgroundColor:'#120e0dcc',paddingHorizontal:1},tip:{position:'absolute',top:32,left:0,right:0,padding:6,backgroundColor:'#19130ff5',borderWidth:1,borderColor:'#bda169',borderRadius:4,zIndex:30},tipTitle:{color:'#f4d998',fontSize:11,fontWeight:'700'},tipText:{color:'#eee0ca',fontSize:10},damage:{position:'absolute',fontWeight:'900',textShadowColor:'#120700',textShadowOffset:{width:1,height:2},textShadowRadius:3}});
