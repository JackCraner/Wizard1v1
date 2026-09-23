import {CardEcho} from './CardEcho';
import {CardHeat} from './CardHeat';
import { combatColors, palette, DOMAIN_COLORS } from '../theme';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import {Animated,Modal,Pressable,Text,View,useWindowDimensions} from 'react-native';
import type {StyleProp,ViewStyle} from 'react-native';
import {CombatAnchor,useCombatMotion} from './CombatConnections';
import {CardPreview} from '../components/cards/SpellCard';

import {activeSpellIndices} from '../game/rotation';
import {combatCard,resourcePredictions} from '../game/combatCards';
import {COMBAT_TICK_MS} from '../game/playback';
import {useFeedbackProgress} from './useFeedbackProgress';
import {triggerSchedule,triggerJumpDuration} from '../game/triggerAnimation';
import type {CombatFrame,Fighter} from '../game/model';

function MovingTile({id,center,ready,jumpKey,echoShadow,style,children}:{id:string;center:number;ready:boolean;jumpKey?:string;echoShadow?:ReactNode;style:StyleProp<ViewStyle>;children:ReactNode}){
 const excited=useRef(new Animated.Value(0)).current,reducedMotion=useCombatMotion();
 useEffect(()=>{excited.setValue(0);if(!ready||reducedMotion)return;const animation=Animated.loop(Animated.sequence([Animated.timing(excited,{toValue:1,duration:900,useNativeDriver:false}),Animated.timing(excited,{toValue:-1,duration:160,useNativeDriver:false}),Animated.timing(excited,{toValue:1,duration:160,useNativeDriver:false}),Animated.timing(excited,{toValue:0,duration:700,useNativeDriver:false})]));animation.start();return()=>animation.stop();},[ready,reducedMotion]);
 const hop=useRef(new Animated.Value(0)).current;
 useEffect(()=>{hop.setValue(0);if(!jumpKey||reducedMotion)return;const animation=Animated.sequence([Animated.timing(hop,{toValue:-7,duration:160,useNativeDriver:false}),Animated.spring(hop,{toValue:0,friction:4,tension:140,useNativeDriver:false})]);animation.start();return()=>animation.stop();},[jumpKey,reducedMotion]);
 const previous=useRef(center),offset=useRef(new Animated.Value(0)).current;
 useEffect(()=>{offset.setValue(previous.current-center);previous.current=center;const animation=Animated.timing(offset,{toValue:0,duration:300,useNativeDriver:false});animation.start();return()=>animation.stop();},[center]);
 return <CombatAnchor id={id}><Animated.View style={{transform:[{translateY:hop},{translateX:offset},{rotate:excited.interpolate({inputRange:[-1,0,1],outputRange:['-0.7deg','0deg','0.7deg']})}],borderRadius:7,boxShadow:ready?'0 0 12px rgba(105,255,224,0.55)':'none'}}>{echoShadow}<Animated.View style={[style,{zIndex:1}]}>{children}</Animated.View>{jumpKey&&<View pointerEvents="none" style={{position:'absolute',top:-25,left:0,right:0,alignItems:'center'}}><Text accessibilityLabel="Trigger activated!" style={{color:'#fff2a0',fontSize:30,lineHeight:34,fontWeight:'900',textShadowColor:'#362308',textShadowRadius:5}}>!</Text></View>}</Animated.View></CombatAnchor>;
}
function Progress({fighter,index,tick,speed,playing}:{fighter:Fighter;index:number;tick:number;speed:number;playing:boolean}){
 const fill=useRef(new Animated.Value(0)).current,cast=fighter.casting?.index===index?fighter.casting:null;
 useEffect(()=>{const start=cast?1-cast.remaining/Math.max(1,cast.totalTicks):0;fill.setValue(start);if(!cast||!playing)return;const a=Animated.timing(fill,{toValue:Math.min(1,start+1/Math.max(1,cast.totalTicks)),duration:COMBAT_TICK_MS/speed,useNativeDriver:false});a.start();return()=>a.stop();},[tick,playing,speed,cast?.index]);
 return <View style={{height:4,backgroundColor:'#090e14'}}><Animated.View style={{height:4,width:fill.interpolate({inputRange:[0,1],outputRange:['0%','100%']}),backgroundColor:'#ffe3a0'}}/></View>;
}
function TriggerFlash({order,jumps,speed,playing,armed}:{order:number;jumps:number;speed:number;playing:boolean;armed:boolean}){
 const reduced=useCombatMotion();
 const jump=triggerJumpDuration(jumps,speed);
 const progress=useFeedbackProgress(playing&&!reduced,order>=0?jump*.15:750/speed,undefined,order>=0?jump*(order+.85):0);
 return <Animated.View pointerEvents="none" style={{position:'absolute',inset:0,borderRadius:6,borderWidth:2,borderColor:armed?combatColors.armed:combatColors.activated,backgroundColor:armed?'#bdff5522':'#69ffe044',opacity:reduced?.25:progress.interpolate({inputRange:[-1,-.001,0,.2,1],outputRange:[0,0,.65,.8,0],extrapolate:'clamp'})}}/>;
}
export function CombatSequence({fighter,side,frame,compact,speed,playing,onInspect}:{fighter:Fighter;side:'player'|'bot';frame:CombatFrame;compact:boolean;speed:number;playing:boolean;onInspect:()=>()=>void}){
 const [inspect,setInspect]=useState<number|null>(null),[ghosts,setGhosts]=useState<number[]>([]),[rowWidth,setRowWidth]=useState(0);const restore=useRef<(()=>void)|null>(null);const {width,height}=useWindowDimensions();
 const pulse=useRef(new Animated.Value(0)).current;
 const schedule=triggerSchedule(frame);
 const cues=(frame.notices??[]).filter(n=>n.side===side&&n.index!==undefined);
 useEffect(()=>{const breaks=cues.filter(n=>n.status==='fragile').map(n=>n.index!);setGhosts(breaks);pulse.setValue(1);const a=Animated.timing(pulse,{toValue:0,duration:900/speed,useNativeDriver:false});a.start();const timer=setTimeout(()=>setGhosts([]),650/speed);return()=>{a.stop();clearTimeout(timer);};},[frame.tick]);
 const indices=[...new Set([...activeSpellIndices(fighter),...ghosts])].sort((a,b)=>a-b),predicted=resourcePredictions(fighter);
 const cardWidth=Math.min(compact?124:165,(rowWidth-Math.max(0,indices.length-1)*6)/Math.max(1,indices.length));
 const start=(rowWidth-(cardWidth*indices.length+Math.max(0,indices.length-1)*6))/2;
 const x=(index:number)=>start+indices.indexOf(index)*(cardWidth+6)+cardWidth/2;
 const close=()=>{setInspect(null);restore.current?.();restore.current=null;};
 const previewHeight=Math.min(280,height-112);
 return <View style={{gap:4}}>
  <CombatAnchor id={`${side}:cycle`} style={{flexDirection:'row',justifyContent:'space-between',paddingHorizontal:5}}><Text style={{color:'#e9dbc1',fontSize:10,fontWeight:'800'}}>{side==='player'?'YOUR SEQUENCE':'OPPONENT SEQUENCE'} · Cycle {fighter.cycle}</Text><Text style={{color:'#d8c590',fontSize:10}}>{fighter.reshuffleRemaining?`Reshuffling · ${fighter.reshuffleRemaining}T`: `${activeSpellIndices(fighter).length}/6 spells`}</Text></CombatAnchor>
  <View onLayout={e=>setRowWidth(e.nativeEvent.layout.width)} style={{height:compact?84:132,flexDirection:'row',justifyContent:'center',gap:6,position:'relative'}}>
   {indices.map(index=>{const c=combatCard(fighter,index),st=fighter.memory.cards?.[index],casting=fighter.casting?.index===index,broken=ghosts.includes(index),cue=cues.find(n=>n.index===index&&['trigger','retrigger'].includes(n.status))??cues.find(n=>n.index===index&&['armed','awaken','fragile','oath'].includes(n.status)),target=cues.some(n=>n.status==='retrigger'&&n.targetIndex===index);const trigger=c.combat?.effects?.find(e=>e.kind==='trigger'),ready=!!st?.armed&&!broken&&st.firedTick!==(frame.stateTick??frame.tick)&&!(trigger?.onceCombat&&st.firedCombat);const selfCue=cues.find(n=>(n.status==='trigger'||n.status==='retrigger')&&(n.status==='retrigger'?n.targetIndex:n.index)===index&&(n.origin?.kind==='cycle'||n.origin?.kind==='spell'&&n.origin.side===side&&n.origin.index===index));const heat=casting&&fighter.casting?.empowered||frame.events.some(e=>e.side===side&&e.index===index&&e.details?.includes('Empowered'));const echo=casting&&fighter.casting?.echoPower!==undefined||frame.events.some(e=>e.side===side&&e.index===index&&e.repeats===2);const accent=DOMAIN_COLORS[c.domain];return <MovingTile key={index} id={`${side}:spell:${index}`} center={x(index)} ready={ready} echoShadow={frame.events.some(e=>e.side===side&&e.index===index&&e.status==='cast'&&(e.repeats??1)>1)?<CardEcho key={`${frame.tick}:${index}`} card={c} index={index} compact={compact} playing={playing} speed={speed}/>:undefined} jumpKey={selfCue?`${frame.tick}:${selfCue.status}`:undefined} style={{height:compact?84:132,width:Math.max(1,cardWidth),borderWidth:casting||st?.awakened?2:1,borderColor:target||cue?.status==='retrigger'?combatColors.retrigger:heat?combatColors.empowered:echo?combatColors.echo:ready?combatColors.trigger:st?.awakened?combatColors.awakened:casting?combatColors.casting:accent+'88',borderRadius:7,overflow:'hidden',backgroundColor:broken?combatColors.brokenSurface:ready?combatColors.readySurface:casting?combatColors.castingSurface:combatColors.cardSurface,opacity:broken?pulse:st?.firedTick===(frame.stateTick??frame.tick)?.82:1,transform:[{scale:cue?.status==='awaken'||target?pulse.interpolate({inputRange:[0,.35,.6,1],outputRange:[1,1.025,1.035,1]}):1}]}}>
    {!broken&&<CardHeat heat={fighter.statuses.heat??0} empowered={!!heat} next={predicted.heat===index} playing={playing} speed={speed}/>}
    <Pressable accessibilityRole="button" accessibilityLabel={`${side==='player'?'Your':'Opponent'} slot ${index+1}: ${c.name}${casting?', casting':''}${heat?', Empowered':''}${echo?', Tide Echo':''}${st?.awakened?', Awakened':''}${ready?', Trigger ready':st?.armed?', Trigger spent until next tick':trigger?', Trigger arms after first cast':''}${cue?`, ${cue.text}`:''}. ${c.rules}`} onPress={()=>{restore.current=onInspect();setInspect(index);}} style={{flex:1,padding:5,gap:3}}>
     <View style={{flexDirection:'row',justifyContent:'space-between'}}><Text style={{color:accent,fontSize:8}}>{index+1} · {'★'.repeat(c.stars)}</Text><Text style={{color:'#fff1ca',fontSize:9,fontWeight:'800'}}>{casting?fighter.casting?.remaining+'T':c.castTicks===0?'ϟ':c.castTicks+'T'}</Text></View>
     <Text numberOfLines={2} style={{color:palette.cream,fontWeight:'800',fontSize:compact?10:13,lineHeight:compact?12:16}}>{c.name}</Text>
     <Text numberOfLines={compact?1:3} style={{color:'#c5d3d7',fontSize:compact?8:11}}>{c.rules.replace(/\[|\]/g,'')}</Text>
     <Text numberOfLines={1} style={{color:target||cue?.status==='retrigger'?combatColors.retrigger:cue?.status==='trigger'||ready?'#9ffff0':trigger&&!st?.armed?'#70858b':accent,fontSize:8,fontWeight:'800'}}>{broken?'╱╲ BROKEN':(cue?.status==='trigger'?(target?'ϟ FIRED + RETRIGGER':'ϟ TRIGGERED'):cue?.text)??(target?'↻ RETRIGGERED':ready?`◆ ARMED · ${({damage:'DAMAGE',heal:'HEAL',selfDamage:'SELF DAMAGE',tide:'TIDE',ward:'WARD',curse:'CURSE',impAttack:'IMP ATTACK',impHurt:'IMP HURT',fatal:'SAVE',echo:'ECHO',heat:'HEAT',poison:'POISON',oath:'OATH',cycle:'CYCLE'}[trigger?.event??'cycle'])}`:st?.armed?'◇ NEXT TICK':st?.awakened?'✦ AWAKENED':st?.rules?.length?'✧ ACTIVE RULE':trigger?'◇ DORMANT':casting?'▶ CASTING':'')}</Text>
     {(heat||echo||predicted.heat===index||predicted.tide===index)&&<Text style={{position:'absolute',left:4,right:4,bottom:1,color:heat?'#ffcf85':echo?'#9ee8ff':'#ffe39a',backgroundColor:heat?'#472f15':echo?'#14394b':'#152027',fontSize:8,fontWeight:'900'}}>{[heat?'♨ EMPOWERED':predicted.heat===index?'♨ EMPOWERED NEXT':'',echo?'≈ ECHO':predicted.tide===index?'≈ ECHO NEXT':''].filter(Boolean).join(' · ')}</Text>}
     {(frame.healingEvents??[]).some(e=>e.side===side&&e.sourceIndex===index)&&<Text style={{position:'absolute',right:4,top:32,color:'#a9eac2',fontWeight:'900',fontSize:11}}>+{(frame.healingEvents??[]).filter(e=>e.side===side&&e.sourceIndex===index).reduce((n,e)=>n+e.amount,0)}</Text>}
     {(frame.damageEvents??[]).filter(e=>e.sourceSide===side&&e.sourceIndex===index).length>0&&<Text style={{position:'absolute',right:4,top:18,color:(frame.damageEvents??[]).filter(e=>e.sourceSide===side&&e.sourceIndex===index).every(e=>e.target==='ward')?palette.ward:'#ffae89',fontWeight:'900',fontSize:12}}>−{(frame.damageEvents??[]).filter(e=>e.sourceSide===side&&e.sourceIndex===index).reduce((n,e)=>n+e.amount,0)}</Text>}
    </Pressable>{cue&&['trigger','retrigger','armed'].includes(cue.status)&&<TriggerFlash key={frame.tick+':'+cue.status+':'+index} order={schedule.find(s=>s.notice===cue)?.order??-1} jumps={schedule.find(s=>s.notice===cue)?.jumps??1} speed={speed} playing={playing} armed={cue.status==='armed'}/>}<Progress fighter={fighter} index={index} tick={frame.tick} speed={speed} playing={playing}/>
   </MovingTile>;})}
   {!indices.length&&<Text style={{color:'#c5b995',alignSelf:'center'}}>All spells broken · ongoing effects continue</Text>}
  </View>
  <Modal transparent visible={inspect!==null} animationType="fade" onRequestClose={close}><View style={{flex:1,alignItems:'center',justifyContent:'center',padding:24,backgroundColor:'#070a10dd'}}>{inspect!==null&&<CardPreview card={combatCard(fighter,inspect)} height={previewHeight} width={Math.min(width-64,520)}/>}<Pressable accessibilityRole="button" accessibilityLabel="Close spell preview" onPress={close} style={{marginTop:10,minHeight:40,padding:10,paddingHorizontal:28,backgroundColor:'#413426',borderRadius:6}}><Text style={{color:palette.cream}}>Close</Text></Pressable></View></Modal>
 </View>;
}
