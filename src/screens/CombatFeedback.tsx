import { palette, DOMAIN_COLORS } from '../theme';
import {KEYWORD_DOMAINS} from '../game/attunement';
import { STATUS_ART } from '../components/cards/spellArt';
import { useEffect, useRef, useState } from 'react';
import { Animated, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {useFeedbackProgress} from './useFeedbackProgress';
import { KEYWORDS } from '../config/catalogue';
import statuses from '../config/statuses.json';
import type { CombatFrame, Fighter } from '../game/model';

const icons:Record<string,string>={unholy:'☀',curse:'☽',stun:'⏸',poison:'☠',regeneration:'✚',tide:'≈',guard:'◇',resilience:'⬡',trap:'⚠',weaken:'↓',potency:'✹',fury:'↑',heat:'♨',slow:'⌛',frailty:'◇',repetition:'↻'};
const keyword=(id:string)=>KEYWORDS[id==='repetition'?'curse':id];
const unit=(id:string)=>(statuses as Record<string,{unit:string}>)[id]?.unit??'ticks';
export function EffectBar({fighter,compact,group,highlight=[],activations=[],onInspect}:{fighter:Fighter;compact:boolean;group:'buff'|'debuff';highlight?:string[];activations?:NonNullable<CombatFrame['notices']>;onInspect?:()=>void}) {
 const [selected,setSelected]=useState<string|null>(null);
 const bad=group==='debuff';const color=bad?'#ff9388':'#a6e4a1';
 const displayed:Record<string,number>=Object.fromEntries(Object.entries(fighter.statuses).filter(([id])=>id in statuses));
 const items=Object.entries(displayed).filter(([id,n])=>{const kind=(statuses as Record<string,{kind:string}>)[id]?.kind;return n>0&&(kind==='dot'||kind==='debuff')===bad;});
 const receipts=bad?[]:activations.filter(n=>n.resource&&(n.status==='heat'||n.status==='tide'));
 const oath=fighter.oath;
 const statusInfo=(id:string)=>id==='tide'?{...keyword(id),description:`At ${fighter.memory.rules?.tideThreshold??3} Tide, your next non-Instant spell consumes that many and Echoes at ${(fighter.memory.rules?.echoPower??.5)*100}% effectiveness.`}:keyword(id);
 const oathLabel=oath?'Oath of '+oath.id.split('-').map(word=>word[0].toUpperCase()+word.slice(1)).join(' '):'';
 const oathProgress=oath?.remaining===undefined?'Until reshuffle':oath.remaining+' ticks left'+(oath.requirement==='deal100'?' · '+(oath.progress??0)+'/100 damage':'');
 const info=selected==='oath'&&oath?{name:oathLabel,description:KEYWORDS.oath.description+' '+({dealNone:'Deal no damage.',deal100:'Deal at least 100 damage across the window.',takeNone:'Take no damage.',meditate:'Complete five stunned ticks.'}[oath.requirement])+' Reward: '+oath.amount+' '+oath.reward+(oath.reward==='damage'?'':' ticks')+'.'}:selected&&displayed[selected]?statusInfo(selected):null;
 return <View style={{flex:bad?1:undefined,flexShrink:1,maxHeight:'100%',borderWidth:1,borderColor:bad?'#8a4540':'#436e4e',borderRadius:4,backgroundColor:bad?'#301514dc':'#12271de8',padding:2}}>
   {!bad&&oath&&<Pressable accessibilityRole="button" accessibilityLabel={oathLabel+'. '+oathProgress+'. Inspect Oath.'} onPress={()=>{onInspect?.();setSelected('oath');}} style={{padding:3,borderWidth:1,borderColor:'#d6b766',backgroundColor:'#362e17',borderRadius:3}}><Text numberOfLines={1} adjustsFontSizeToFit style={{color:'#ffe3a1',fontSize:8,textAlign:'center'}}>{oathLabel}</Text><Text style={{color:'#f0ddb6',fontSize:7,textAlign:'center'}}>{oathProgress}</Text></Pressable>}
   <Text style={{color,fontSize:7,fontWeight:'800',textAlign:'center'}}>{bad?'− DEBUFFS':'+ BUFFS'}</Text>
   <ScrollView style={{flexGrow:0,flexShrink:1}} nestedScrollEnabled showsVerticalScrollIndicator={false} contentContainerStyle={{flexDirection:bad?'row':'column',flexWrap:bad?'wrap':'nowrap',gap:2,alignItems:bad?'center':'stretch',justifyContent:bad?'center':'flex-start'}}>
     {receipts.map(n=><View key={n.status} accessible accessibilityLabel={`${n.resource!.before} ${n.status} activated ${n.status==='tide'?'Echo':'Empowered'}. ${n.resource!.spent} spent; ${displayed[n.status]??0} held.`} style={{flexDirection:'row',alignItems:'center',gap:3,paddingHorizontal:3,minHeight:20,borderRadius:3,borderWidth:1,borderColor:n.status==='tide'?'#83dbff':'#ffc071',backgroundColor:n.status==='tide'?'#143b50':'#493017'}}><Image source={STATUS_ART[n.status]} accessible={false} style={{width:18,height:18}}/><View style={{flex:1,flexDirection:'row',alignItems:'center',gap:3}}><Text numberOfLines={1} style={{flex:1,color:'#fff0ce',fontSize:9,fontWeight:'900'}}>{n.resource!.before} {n.status==='tide'?'Tide → ECHO':'Heat → EMPOWERED'}</Text><Text style={{color:'#e0dccc',fontSize:8}}>{displayed[n.status]??0} held</Text></View></View>)}
     {!items.length&&!receipts.length&&<Text style={{color:'#aaa08c',fontSize:8,textAlign:'center'}}>None</Text>}
     {items.filter(([id])=>!receipts.some(n=>n.status===id)).map(([id,count])=><Pressable key={id} accessibilityRole="button" accessibilityLabel={`${bad?'Debuff':'Buff'}: ${keyword(id)?.name??id}, ${id==='resilience'&&fighter.memory.permanentResilience?'rest of combat':count+' '+unit(id)}. Tap for details.`} onPress={()=>{onInspect?.();setSelected(id);}} style={{flexDirection:'row',alignItems:'center',gap:2,borderWidth:1,borderColor:highlight.includes(id)?'#fff0a2':bad?'#9d5750':'#619069',borderRadius:3,backgroundColor:highlight.includes(id)?'#625025':'#10150fee',minHeight:bad?22:24,paddingHorizontal:2}}>
       {STATUS_ART[id]?<Image accessible={false} source={STATUS_ART[id]} resizeMode="contain" style={{width:20,height:20,borderRadius:2}}/>:<Text style={{color,fontSize:13}}>{icons[id]??'✧'}</Text>}
       {!bad&&!compact&&<Text numberOfLines={1} adjustsFontSizeToFit style={{flex:1,color:KEYWORD_DOMAINS[id]?DOMAIN_COLORS[KEYWORD_DOMAINS[id]]:'#ddedda',fontSize:8}}>{keyword(id)?.name??id}</Text>}
       <Text style={{color:palette.white,fontSize:10,fontWeight:'900'}}>{id==='resilience'&&fighter.memory.permanentResilience?'∞':count+(unit(id)==='ticks'?'T':unit(id)==='multiplier'?'×':'')}</Text>
     </Pressable>)}
   </ScrollView>
   <Modal visible={!!info} transparent animationType="fade" onRequestClose={()=>setSelected(null)}><View style={{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#0009',padding:24}}><View accessibilityViewIsModal style={{width:'100%',maxWidth:330,padding:16,gap:10,backgroundColor:'#191710',borderColor:color,borderWidth:1,borderRadius:6}}><Text style={{color,fontWeight:'800'}}>{bad?'− Debuff':'+ Buff'} · {info?.name} · {selected==='oath'?oathProgress:`${selected?displayed[selected]:0} ${selected?unit(selected):""}`}</Text><Text style={{color:palette.parchmentMuted}}>{info?.description}</Text><Pressable accessibilityRole="button" onPress={()=>setSelected(null)} style={{padding:10,borderWidth:1,borderColor:color}}><Text style={{color,textAlign:'center'}}>Close</Text></Pressable></View></View></Modal>
 </View>;
}
type Hit={target?:'wizard'|'imp'|'ward';side:'player'|'bot';amount:number;critical:boolean;healing:boolean;key:string;lane:number};
const impArt = require('../../assets/Imp.png');
export function ImpCompanion({fighter,onInspect,frame,side}:{fighter:Fighter;onInspect:()=>void;frame:CombatFrame;side:'player'|'bot'}) {
 const [open,setOpen]=useState(false);const imp=fighter.imp;
 if(!imp)return null;
 const alive=imp.health>0;
 return <>
  <Pressable accessibilityRole="button" accessibilityLabel={`${fighter.name==='You'?'Your':fighter.name+"'s"} Imp: ${imp.health} of ${imp.maxHealth} Health${imp.guard>0?`, Guard ${imp.guard} charges`:''}. ${fighter.memory.rules?.impDamage??0} damage per completed spell. Inspect Imp.`} onPress={()=>{onInspect();setOpen(true);}} style={{position:'absolute',bottom:34,alignSelf:'center',width:112,padding:4,borderRadius:8,borderWidth:1,borderColor:imp.guard?'#9be3ff':palette.purple,backgroundColor:'#20132feb',alignItems:'center',zIndex:23,opacity:alive?1:.65}}>
   <View style={{flexDirection:'row',alignItems:'center',gap:4}}><Image accessible={false} source={impArt} resizeMode="contain" style={{width:42,height:56}}/><View><Text style={{color:palette.purpleLight,fontSize:10,fontWeight:'800'}}>IMP{imp.guard>0?' ◇':''}</Text><Text style={{color:palette.white,fontSize:10}}>{alive?'ACTIVE':'Defeated'}</Text></View></View>
   <View accessibilityRole="progressbar" accessibilityLabel="Imp Health" accessibilityValue={{min:0,max:imp.maxHealth,now:imp.health}} style={{height:16,width:'100%',backgroundColor:'#24132f',borderWidth:1,borderColor:palette.purple,borderRadius:3,overflow:'hidden'}}><View style={{position:'absolute',height:'100%',width:`${Math.max(0,Math.min(100,100*imp.health/imp.maxHealth))}%`,backgroundColor:imp.guard?'#326581':'#754099'}}/><Text style={{color:palette.white,fontSize:10,fontWeight:'800',textAlign:'center'}}>{imp.health} / {imp.maxHealth} HP</Text></View>
   {alive&&<Text style={{fontSize:8,color:'#ead3fa',marginTop:2}}>{imp.guard>0?`Guard · ${imp.guard}T`:(fighter.memory.impDamage?`${fighter.memory.impDamage} / spell`:'Protecting you')}</Text>}
   <DamageNumbers frame={frame} impSide={side}/>
  </Pressable>
  <Modal visible={open} transparent onRequestClose={()=>setOpen(false)} animationType="fade"><View style={{flex:1,backgroundColor:'#000a',alignItems:'center',justifyContent:'center',padding:20}}><View accessibilityViewIsModal style={{width:"100%",maxWidth:360,maxHeight:"100%",padding:14,gap:8,backgroundColor:'#20132f',borderWidth:1,borderColor:palette.purple,borderRadius:10}}><View style={{flexDirection:"row",alignItems:"center",gap:12}}><Image accessible={false} source={impArt} resizeMode="contain" style={{width:48,height:64}}/><Text style={{flex:1,fontSize:18,color:palette.purpleLight,fontWeight:"800"}}>Imp · {imp.health}/{imp.maxHealth} Health</Text></View><Text style={{color:palette.white}}>{KEYWORDS.summon.description}</Text><Text style={{color:'#d5c5e7'}}>Guard: {imp.guard} charges. Attack: {fighter.memory.rules?.impDamage??0} damage per completed spell. Summoning after defeat creates a fresh Imp.</Text><Pressable accessibilityRole="button" onPress={()=>setOpen(false)} style={{padding:10,borderWidth:1,borderColor:palette.purple}}><Text style={{color:palette.white,textAlign:'center'}}>Close Imp details</Text></Pressable></View></View></Modal>
 </>;
}
function FloatingHit({hit,rows,height,playing,speed,onDone}:{hit:Hit;rows:number;height:number;playing:boolean;speed:number;onDone:(key:string)=>void}) {
 const progress=useFeedbackProgress(playing,1450/speed,()=>onDone(hit.key));
 const size=Math.max(8,Math.min(hit.critical?25:21,height/rows*.75,48/((String(Math.abs(hit.amount)).length+1+(hit.critical?1:0))*.63)));
 return <View style={{position:'absolute',left:`${(hit.lane%3)*100/3}%`,top:`${Math.floor((hit.lane%6)/3)*100/rows}%`,width:'33.33%',height:`${100/rows}%`,alignItems:'center',justifyContent:'center'}}><Animated.Text numberOfLines={1} adjustsFontSizeToFit style={{maxWidth:'96%',fontWeight:'900',color:hit.healing?'#87f5a0':hit.target==='ward'?palette.ward:'#ff7770',textShadowColor:palette.shadow,textShadowRadius:5,textShadowOffset:{width:1,height:2},fontSize:size,opacity:progress.interpolate({inputRange:[0,.65,1],outputRange:[1,1,0],extrapolate:'clamp'})}}>{hit.healing?'+':'−'}{Math.abs(hit.amount)}{hit.critical?'!':''}</Animated.Text></View>;
}
export function DamageNumbers({frame,impSide,playing=true,speed=1}:{frame:CombatFrame;impSide?:'player'|'bot';playing?:boolean;speed?:number}) {
 const [hits,setHits]=useState<Hit[]>([]);const previous=useRef(frame.tick),seen=useRef(new Set<string>());
 useEffect(()=>{
   const sequential=frame.tick===previous.current||(playing&&frame.tick===previous.current+1);previous.current=frame.tick;
   if(!sequential)seen.current.clear();
   const incoming=[...(frame.damageEvents??[]).filter(hit=>impSide?hit.target==='imp'&&hit.side===impSide:hit.target!=='imp').map((hit,i)=>({...hit,healing:false,key:frame.tick+'-'+frame.presentationPhase+'-damage-'+i})),...(frame.healingEvents??[]).filter(hit=>impSide?hit.target==='imp'&&hit.side===impSide:hit.target!=='imp').map((hit,i)=>({...hit,healing:true,critical:false,key:frame.tick+'-'+frame.presentationPhase+'-heal-'+i}))].filter(hit=>!seen.current.has(hit.key));
   incoming.forEach(hit=>seen.current.add(hit.key));
   setHits(old=>{const next=sequential?[...old]:[];for(const hit of incoming){const occupied=new Set(next.filter(h=>h.side===hit.side).map(h=>h.lane));let lane=0;while(occupied.has(lane))lane++;next.push({...hit,lane});}return next.slice(-36);});
 },[frame,impSide]);
 return <View pointerEvents="none" style={[StyleSheet.absoluteFill,{zIndex:50,top:44,bottom:12}]}>{(['player','bot'] as const).filter(side=>!impSide||side===impSide).map(side=>{const group=hits.filter(h=>h.side===side),rows=2;return <View key={side} style={{position:'absolute',left:impSide?'50%':side==='player'?'19%':'69%',width:156,maxWidth:impSide?'100%':'38%',height:40,transform:[{translateX:-78}]}}>{group.map(hit=><FloatingHit key={hit.key} hit={hit} rows={rows} height={40} playing={playing} speed={speed} onDone={key=>setHits(old=>old.filter(h=>h.key!==key))}/>)}</View>;})}</View>;
}