import {combatTotals} from '../game/combatTotals';
import {ImpPanel} from './ImpPanel';
import {useEffect,useMemo,useState} from 'react';
import {Modal,Pressable,Text,useWindowDimensions,View,Image,StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {AugmentInventory} from '../components/AugmentInventory';
import {CombatConnections,CombatAnchor} from './CombatConnections';
import {CombatSequence} from './CombatSequence';
import {EffectBar,DamageNumbers} from './CombatFeedback';
import {CombatTimeline} from './CombatTimeline';
import {CombatResult} from './CombatResult';
import {combatArt} from './CombatAssets';
import {continuousCombatFrame,nextPlaybackSpeed} from '../game/playback';
import {useFeedbackProgress} from './useFeedbackProgress';
import type {Battle} from '../game/model';
import {HealthCircle} from './HealthCircle';
import {unclaimedFeedback} from '../game/spellFlights';
import {RULES} from '../game/engine';
import type {useGame} from '../useGame';

function FinishAnimation({playing,speed,onDone}:{playing:boolean;speed:number;onDone:()=>void}){
 useFeedbackProgress(playing,1800/speed,onDone);return null;
}
export function CombatScreen({game}:{game:ReturnType<typeof useGame>}){
 const {height}=useWindowDimensions(),compact=height<500;const [history,setHistory]=useState(false);
 const {battle,session,frame,finished,speed}=game;
 const [settledBattle,setSettledBattle]=useState<Battle|null>(null);
 useEffect(()=>{if(!finished)setSettledBattle(null);},[finished,battle]);
 const showResult=finished&&(game.paused||settledBattle===battle);
 const current=useMemo(()=>battle?(game.beat==='cast'?continuousCombatFrame(battle,frame):{...battle.frames[frame],presentationPhase:'resolve' as const}):null,[battle,frame,game.beat]);
 const feedbackFrame=useMemo(()=>current&&showResult?{...current,notices:[],events:[],damageEvents:[],healingEvents:[]}:current,[current,showResult]);
 const residual=useMemo(()=>current?unclaimedFeedback(current):null,[current]);
 const totals=useMemo(()=>battle?combatTotals(battle):null,[battle]);
 const meterMax=totals?Math.max(1,...[...totals.player,...totals.bot].flatMap(t=>[t.damage,t.healing])):1;
 if(!current||!feedbackFrame||!battle||!session)return null;
 const button=(label:string,action:()=>void,disabled=false)=><Pressable key={label} accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={action} style={{minHeight:30,paddingHorizontal:9,justifyContent:'center',borderRadius:5,borderWidth:1,borderColor:'#887452',backgroundColor:'#28271feb',opacity:disabled?.4:1}}><Text style={{color:'#f4e5c9',fontSize:11}}>{label}</Text></Pressable>;
 const playing=game.active&&!game.paused&&!finished;
 const inspect=()=>{const paused=game.paused;game.setPaused(true);return()=>game.setPaused(paused);};
 return <CombatConnections frame={feedbackFrame} speed={speed} playing={game.active&&!game.paused}><View style={{flex:1,backgroundColor:'#11151a'}}><Image source={combatArt.background} resizeMode="cover" style={[StyleSheet.absoluteFill,{width:'100%',height:'100%',opacity:.3}]} accessible={false}/><SafeAreaView style={{flex:1}}><View style={{flex:1,padding:compact?8:16,gap:compact?6:12}}>
  <View style={{flexDirection:'row',alignItems:'center',gap:5,paddingHorizontal:6,borderRadius:7,backgroundColor:'#090e16b3'}}><Text style={{color:'#ead6ad',fontSize:11,fontWeight:'800',flex:1}}>ROUND {session.round} · {current.tick}/{RULES.maxTicks} · {showResult?'Complete':game.paused?'Paused':'Combat'}</Text>{button('‹ Menu',()=>game.setScreen('menu'))}{button('‹ Tick',()=>game.step(-1),frame===0)}{button(finished?'Replay':game.paused?'Play':'Pause',()=>{if(finished)game.setFrame(0);game.setPaused(finished?false:!game.paused);})}{button('Tick ›',()=>game.step(1),finished)}{button(`${speed}×`,()=>game.setSpeed(nextPlaybackSpeed(speed)))}{button('Timeline',()=>{game.setPaused(true);setHistory(true);})}{button('Skip',()=>game.setFrame(battle.frames.length-1),finished)}</View>
  <View style={{flex:1,minHeight:0,flexDirection:'row',gap:compact?20:48}}>
   {(['player','bot'] as const).map(side=>{const u=current[side],oath=u.memory.sequenceOath;return <View key={side} style={{flex:1,minWidth:0,flexDirection:side==='player'?'row':'row-reverse',gap:compact?10:20}}>
    <View style={{flex:1,minWidth:0}}><CombatSequence fighter={u} totals={showResult?totals?.[side]:undefined} meterMax={meterMax} side={side} frame={current} compact={compact} speed={speed} playing={playing} feedbackPlaying={game.active&&!game.paused} onInspect={inspect}/></View>
    <View style={{width:compact?126:180,gap:compact?5:9,alignItems:'stretch'}}>
     <Text numberOfLines={1} style={{color:'#e8dbc5',fontSize:11,fontWeight:'700',textAlign:'center'}}>{side==='player'?'You':u.name} · Lv {u.level}</Text>
     <CombatAnchor id={side+':wizard'} style={{alignItems:'center'}}><HealthCircle fighter={u} compact={compact}/></CombatAnchor>
     <View style={{height:compact?72:88}}>{!showResult&&<DamageNumbers side={side} compact={compact} frame={current} playing={game.active&&!game.paused} speed={speed}/>}</View>
     <EffectBar fighter={u} compact={compact} playing={playing} speed={speed} group="buff" onInspect={()=>game.setPaused(true)}/>
     <EffectBar fighter={u} compact={compact} playing={playing} speed={speed} group="debuff" onInspect={()=>game.setPaused(true)}/>
     <View style={{flexDirection:'row',justifyContent:'center'}}><ImpPanel frame={residual??current} side={side} compact={compact}/></View>
     <AugmentInventory augments={u.augments} compact inline onInspect={()=>game.setPaused(true)}/>
     {oath&&<Text numberOfLines={2} style={{color:'#ffe0a0',fontSize:9}}>Oath · {oath.condition==='safe'?'No Health loss':oath.condition==='damage100'?'Deal 100+ direct damage':'No direct damage'} · {oath.remaining} spells</Text>}
    </View>
   </View>;})}
   {showResult&&<View pointerEvents="box-none" style={{position:'absolute',top:0,bottom:0,left:'50%',width:compact?280:400,transform:[{translateX:compact?-140:-200}]}}><CombatResult narrow outcome={battle.outcome} level={session.level} compact={compact} actionLabel={session.round%2===0?'Level up →':'Return to shop →'} onContinue={()=>game.act({type:'next'})} busy={game.busy}/></View>}
  </View>
  {finished&&!showResult&&<FinishAnimation playing={game.active&&!game.paused} speed={speed} onDone={()=>setSettledBattle(battle)}/>}
  {!!game.error&&<Text style={{color:'#ffb9a4'}}>{game.error}</Text>}
 </View></SafeAreaView>
 <Modal transparent visible={history} animationType="fade" onRequestClose={()=>setHistory(false)}><View style={{flex:1,padding:24,justifyContent:'center',backgroundColor:'#080b12ee'}}><View style={{maxHeight:'100%',gap:12}}><CombatTimeline battle={battle} frame={frame} activeTick={current.tick} round={session.round} pacing="Paused" compact={compact} onInspect={()=>game.setPaused(true)} controls={button('Close timeline',()=>setHistory(false))}/></View></View></Modal>
 </View></CombatConnections>;
}
