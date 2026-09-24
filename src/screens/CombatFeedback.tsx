import {TideIcon,StatusIconPulse} from './TideIcon';
import {RULES} from '../game/engine';
import { palette, DOMAIN_COLORS, combatColors } from '../theme';
import {KEYWORD_DOMAINS} from '../game/attunement';
import { STATUS_ART } from '../components/cards/spellArt';
import { useEffect, useRef, useState } from 'react';
import { Animated, Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import {useFeedbackProgress} from './useFeedbackProgress';
import { KEYWORDS } from '../config/catalogue';
import statuses from '../config/statuses.json';
import type { CombatFrame, Fighter } from '../game/model';

const icons:Record<string,string>={unholy:'☀',curse:'☽',stun:'⏸',poison:'☠',regeneration:'✚',tide:'≈',guard:'◇',resilience:'⬡',trap:'⚠',weaken:'↓',potency:'✹',fury:'↑',heat:'♨',slow:'⌛',frailty:'◇',repetition:'↻'};
const keyword=(id:string)=>KEYWORDS[id==='repetition'?'curse':id];
const unit=(id:string)=>(statuses as Record<string,{unit:string}>)[id]?.unit??'ticks';
export function EffectBar({fighter,compact,group,highlight=[],playing=true,speed=1,onInspect}:{fighter:Fighter;compact:boolean;group:'buff'|'debuff';highlight?:string[];playing?:boolean;speed?:number;onInspect?:()=>void}) {
 const [selected,setSelected]=useState<string|null>(null);
 const bad=group==='debuff';const color=bad?'#ff9388':'#a6e4a1';
 const displayed:Record<string,number>=Object.fromEntries(Object.entries(fighter.statuses).filter(([id])=>id in statuses));
 const tideActive=!bad&&fighter.casting?.echoPower!==undefined;
 const heatActive=!bad&&((fighter.statuses.heat??0)>=RULES.heatThreshold||!!fighter.casting?.empowered);
 const activeIcon=(id:string)=>id==='tide'&&tideActive||id==='heat'&&heatActive;
 if(tideActive)displayed.tide??=0;
 if(heatActive)displayed.heat??=0;
 const items=Object.entries(displayed).filter(([id,n])=>{const kind=(statuses as Record<string,{kind:string}>)[id]?.kind;return (n>0||activeIcon(id))&&(kind==='dot'||kind==='debuff')===bad;});
 const oath=fighter.oath;
 const statusInfo=(id:string)=>id==='tide'?{...keyword(id),description:`At ${fighter.memory.rules?.tideThreshold??3} Tide, your next non-Instant spell consumes that many and Echoes at ${(fighter.memory.rules?.echoPower??.5)*100}% effectiveness.`}:keyword(id);
 const oathLabel=oath?'Oath of '+oath.id.split('-').map(word=>word[0].toUpperCase()+word.slice(1)).join(' '):'';
 const oathProgress=oath?.remaining===undefined?'Until reshuffle':oath.remaining+' ticks left'+(oath.requirement==='deal100'?' · '+(oath.progress??0)+'/100 damage':'');
 const info=selected==='oath'&&oath?{name:oathLabel,description:KEYWORDS.oath.description+' '+({dealNone:'Deal no damage.',deal100:'Deal at least 100 damage across the window.',takeNone:'Take no damage.',meditate:'Complete five stunned ticks.'}[oath.requirement])+' Reward: '+oath.amount+' '+oath.reward+(oath.reward==='damage'?'':' ticks')+'.'}:selected&&(displayed[selected]||activeIcon(selected))?statusInfo(selected):null;
 return <View style={{height:compact?32:54,flexShrink:0,borderWidth:1,borderColor:bad?'#8a4540':'#436e4e',borderRadius:4,backgroundColor:bad?'#301514dc':'#12271de8',padding:1}}>
   {!bad&&oath&&<Pressable accessibilityRole="button" accessibilityLabel={oathLabel+'. '+oathProgress+'. Inspect Oath.'} onPress={()=>{onInspect?.();setSelected('oath');}} style={{padding:3,borderWidth:1,borderColor:'#d6b766',backgroundColor:'#362e17',borderRadius:3}}><Text numberOfLines={1} adjustsFontSizeToFit style={{color:'#ffe3a1',fontSize:8,textAlign:'center'}}>{oathLabel}</Text><Text style={{color:'#f0ddb6',fontSize:7,textAlign:'center'}}>{oathProgress}</Text></Pressable>}
   <Text style={{color,fontSize:7,lineHeight:8,fontWeight:'800',textAlign:'center'}}>{bad?'− DEBUFFS':'+ BUFFS'}</Text>
   <ScrollView style={{flexGrow:0,flexShrink:1}} nestedScrollEnabled showsVerticalScrollIndicator={false} contentContainerStyle={{flexDirection:'row',flexWrap:'wrap',gap:2,alignItems:'center',justifyContent:'flex-start'}}>
     {!items.length&&<Text style={{color:'#aaa08c',fontSize:8,textAlign:'center'}}>None</Text>}
     {items.map(([id,count])=><Pressable key={id} accessibilityRole="button" accessibilityLabel={`${bad?'Debuff':'Buff'}: ${keyword(id)?.name??id}, ${id==='resilience'&&fighter.memory.permanentResilience?'rest of combat':count+' '+unit(id)}${id==='tide'&&tideActive?', Echo active during this cast':id==='heat'&&heatActive?', Empowered ready or casting':''}. Tap for details.`} onPress={()=>{onInspect?.();setSelected(id);}} style={{flexDirection:'row',alignItems:'center',gap:2,borderWidth:1,borderColor:id==='heat'&&heatActive?combatColors.empowered:id==='tide'&&tideActive?combatColors.echo:highlight.includes(id)?'#fff0a2':bad?'#9d5750':'#619069',borderRadius:3,backgroundColor:id==='heat'&&heatActive?combatColors.castingSurface:id==='tide'&&tideActive?combatColors.echoSurface:highlight.includes(id)?'#625025':'#10150fee',minHeight:20,maxWidth:'100%',paddingHorizontal:2}}>
       {id==='tide'?<TideIcon active={tideActive} playing={playing} speed={speed}/>:id==='heat'?<StatusIconPulse active={heatActive} playing={playing} speed={speed} color={combatColors.empowered} backgroundColor={combatColors.castingSurface}><Image accessible={false} source={STATUS_ART.heat} resizeMode="contain" style={{width:18,height:18}}/></StatusIconPulse>:STATUS_ART[id]?<Image accessible={false} source={STATUS_ART[id]} resizeMode="contain" style={{width:18,height:18,borderRadius:2}}/>:<Text style={{color,fontSize:13}}>{icons[id]??'✧'}</Text>}
       {!compact&&<Text numberOfLines={1} adjustsFontSizeToFit style={{flex:1,color:KEYWORD_DOMAINS[id]?DOMAIN_COLORS[KEYWORD_DOMAINS[id]]:'#ddedda',fontSize:8}}>{keyword(id)?.name??id}</Text>}
       <Text accessibilityElementsHidden={activeIcon(id)&&count===0} importantForAccessibility={activeIcon(id)&&count===0?'no-hide-descendants':'auto'} style={{color:palette.white,fontSize:10,fontWeight:'900',opacity:activeIcon(id)&&count===0?0:1}}>{id==='resilience'&&fighter.memory.permanentResilience?'∞':count+(unit(id)==='ticks'?'T':unit(id)==='multiplier'?'×':'')}</Text>
     </Pressable>)}
   </ScrollView>
   <Modal visible={!!info} transparent animationType="fade" onRequestClose={()=>setSelected(null)}><View style={{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#0009',padding:24}}><View accessibilityViewIsModal style={{width:'100%',maxWidth:330,padding:16,gap:10,backgroundColor:'#191710',borderColor:color,borderWidth:1,borderRadius:6}}><Text style={{color,fontWeight:'800'}}>{bad?'− Debuff':'+ Buff'} · {info?.name} · {selected==='oath'?oathProgress:`${selected?displayed[selected]:0} ${selected?unit(selected):""}`}</Text><Text style={{color:palette.parchmentMuted}}>{info?.description}</Text><Pressable accessibilityRole="button" onPress={()=>setSelected(null)} style={{padding:10,borderWidth:1,borderColor:color}}><Text style={{color,textAlign:'center'}}>Close</Text></Pressable></View></View></Modal>
 </View>;
}
type Hit={target?:'wizard'|'imp'|'ward';side:'player'|'bot';amount:number;critical:boolean;healing:boolean;key:string;lane:number};
function FloatingHit({hit,height,playing,speed,onDone}:{hit:Hit;height:number;playing:boolean;speed:number;onDone:(key:string)=>void}) {
 const progress=useFeedbackProgress(playing,1450/speed,()=>onDone(hit.key));
 const size=Math.max(8,Math.min(hit.critical?25:21,height*.9,28/((String(Math.abs(hit.amount)).length+1+(hit.critical?1:0))*.63)));
 return <View style={{position:'absolute',left:`${hit.lane*20}%`,top:0,width:'20%',height:'100%',alignItems:'center',justifyContent:'center'}}><Animated.Text numberOfLines={1} adjustsFontSizeToFit style={{maxWidth:'96%',fontWeight:'900',color:hit.healing?'#87f5a0':hit.target==='ward'?palette.ward:'#ff7770',textShadowColor:palette.shadow,textShadowRadius:5,textShadowOffset:{width:1,height:2},fontSize:size,opacity:progress.interpolate({inputRange:[0,.65,1],outputRange:[1,1,0],extrapolate:'clamp'})}}>{hit.healing?'+':'−'}{Math.abs(hit.amount)}{hit.critical?'!':''}</Animated.Text></View>;
}
export function DamageNumbers({frame,side,compact=false,playing=true,speed=1}:{frame:CombatFrame;side:'player'|'bot';compact?:boolean;playing?:boolean;speed?:number}) {
 const [hits,setHits]=useState<Hit[]>([]);const previous=useRef(frame.tick),seen=useRef(new Set<string>());
 useEffect(()=>{
   const sequential=frame.tick===previous.current||(playing&&frame.tick===previous.current+1);previous.current=frame.tick;
   if(!sequential)seen.current.clear();
   const incoming=[...(frame.damageEvents??[]).filter(hit=>hit.side===side).map((hit,i)=>({...hit,healing:false,key:frame.tick+'-'+frame.presentationPhase+'-damage-'+i})),...(frame.healingEvents??[]).filter(hit=>hit.side===side).map((hit,i)=>({...hit,healing:true,critical:false,key:frame.tick+'-'+frame.presentationPhase+'-heal-'+i}))].filter(hit=>!seen.current.has(hit.key));
   incoming.forEach(hit=>seen.current.add(hit.key));
   setHits(old=>{const next=sequential?[...old]:[];for(const hit of incoming){if(next.length===5)next.shift();const occupied=new Set(next.map(h=>h.lane));let lane=0;while(occupied.has(lane))lane++;next.push({...hit,lane});}return next;});
 },[frame,side]);
 // Reserve space in the health-bar header; feedback never rises into the card row.
 return <View pointerEvents="none" style={{width:156,maxWidth:'60%',height:compact?16:24,flexShrink:0,overflow:'hidden'}}>{hits.map(hit=><FloatingHit key={hit.key} hit={hit} height={compact?16:24} playing={playing} speed={speed} onDone={key=>setHits(old=>old.filter(h=>h.key!==key))}/>)}</View>;
}
