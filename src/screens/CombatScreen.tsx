import {ImpPanel} from './ImpPanel';
import {useMemo,useState} from 'react';
import {Modal,Pressable,Text,useWindowDimensions,View,Image,StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {AugmentInventory} from '../components/AugmentInventory';
import {CombatConnections,CombatAnchor} from './CombatConnections';
import {CombatSequence} from './CombatSequence';
import {CastBar} from './CastBar';
import {EffectBar,DamageNumbers} from './CombatFeedback';
import {CombatTimeline} from './CombatTimeline';
import {CombatResult} from './CombatResult';
import {OrnateMeter,WardMeter,combatArt} from './CombatAssets';
import {continuousCombatFrame,nextPlaybackSpeed,reshuffleDuration} from '../game/playback';
import {RULES} from '../game/engine';
import type {useGame} from '../useGame';

export function CombatScreen({game}:{game:ReturnType<typeof useGame>}){
 const {height}=useWindowDimensions(),compact=height<500;const [history,setHistory]=useState(false);
 const {battle,session,frame,finished,speed}=game;
 const current=useMemo(()=>battle?(game.beat==='cast'?continuousCombatFrame(battle,frame):{...battle.frames[frame],presentationPhase:'resolve' as const}):null,[battle,frame,game.beat]);
 if(!current||!battle||!session)return null;
 const button=(label:string,action:()=>void,disabled=false)=><Pressable key={label} accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={action} style={{minHeight:30,paddingHorizontal:9,justifyContent:'center',borderRadius:5,borderWidth:1,borderColor:'#887452',backgroundColor:'#28271feb',opacity:disabled?.4:1}}><Text style={{color:'#f4e5c9',fontSize:11}}>{label}</Text></Pressable>;
 const playing=game.active&&!game.paused&&!finished;
 const inspect=()=>{const paused=game.paused;game.setPaused(true);return()=>game.setPaused(paused);};
 return <CombatConnections frame={current} speed={speed} playing={game.active&&!game.paused}><View style={{flex:1,backgroundColor:'#11151a'}}><Image source={combatArt.background} resizeMode="cover" style={[StyleSheet.absoluteFill,{width:'100%',height:'100%',opacity:.3}]} accessible={false}/><SafeAreaView style={{flex:1}}><View style={{flex:1,padding:compact?8:16,gap:compact?6:12}}>
  <View style={{flexDirection:'row',alignItems:'center',gap:5}}><Text style={{color:'#ead6ad',fontSize:11,fontWeight:'800',flex:1}}>ROUND {session.round} · {current.tick}/{RULES.maxTicks} · {finished?'Complete':game.paused?'Paused':'Combat'}</Text>{button('‹ Menu',()=>game.setScreen('menu'))}{button('‹ Tick',()=>game.step(-1),frame===0)}{button(finished?'Replay':game.paused?'Play':'Pause',()=>{if(finished)game.setFrame(0);game.setPaused(finished?false:!game.paused);})}{button('Tick ›',()=>game.step(1),finished)}{button(`${speed}×`,()=>game.setSpeed(nextPlaybackSpeed(speed)))}{button('Timeline',()=>{game.setPaused(true);setHistory(true);})}{button('Skip',()=>game.setFrame(battle.frames.length-1),finished)}</View>
  <CombatSequence fighter={current.bot} side="bot" frame={current} compact={compact} speed={speed} playing={playing} feedbackPlaying={game.active&&!game.paused} onInspect={inspect}/>
  <View style={{flex:1,minHeight:0,flexDirection:'row',gap:compact?22:60,paddingHorizontal:compact?12:70,alignItems:'stretch'}}>
   {(['player','bot'] as const).map(side=>{const u=current[side],oath=u.memory.sequenceOath;return <View key={side} style={{flex:1,minWidth:0,paddingBottom:compact?35:42,gap:3}}>
    <View style={{flexDirection:'row',alignItems:'center',gap:8}}><CombatAnchor id={side+':wizard'} style={{flex:1}}><Text numberOfLines={1} style={{color:'#e8dbc5',fontSize:11,fontWeight:'700'}}>{side==='player'?'You':u.name} · Lv {u.level}</Text><OrnateMeter value={u.health} max={u.maxHealth}/><WardMeter value={u.shield} capacity={u.wardCapacity??u.shield}/></CombatAnchor><AugmentInventory augments={u.augments} compact inline onInspect={()=>game.setPaused(true)}/></View>
    <View style={{flex:1,minHeight:0,flexDirection:'row',gap:6}}>{side==='bot'&&<ImpPanel frame={current} side={side} compact={compact}/>}<View style={{flex:1}}><EffectBar fighter={u} compact={compact} playing={playing} speed={speed} group="buff" onInspect={()=>game.setPaused(true)}/></View><View style={{flex:1}}><EffectBar fighter={u} compact={compact} group="debuff" onInspect={()=>game.setPaused(true)}/></View>{side==='player'&&<ImpPanel frame={current} side={side} compact={compact}/>}</View>
    {oath&&<Text numberOfLines={1} style={{color:'#ffe0a0',fontSize:9}}>Oath · {oath.condition==='safe'?'No Health loss':oath.condition==='damage100'?'Deal 100+ direct damage':'No direct damage'} · {oath.remaining} spell{oath.remaining===1?'':'s'}</Text>}
    <View style={{position:'absolute',bottom:0,left:'12%',right:'12%',height:36,alignItems:'center'}}><CastBar fighter={u} reshuffleTicks={reshuffleDuration(battle,frame,side,u)} compact={compact} finished={finished} tick={frame} speed={speed} playing={playing}/></View>
   </View>;})}
   <DamageNumbers compact={compact} frame={current} playing={game.active&&!game.paused} speed={speed}/>
   {finished&&<CombatResult outcome={battle.outcome} level={session.level} compact={compact}/>}
  </View>
  <CombatSequence fighter={current.player} side="player" frame={current} compact={compact} speed={speed} playing={playing} feedbackPlaying={game.active&&!game.paused} onInspect={inspect}/>
  {finished&&<View style={{alignItems:'center'}}>{button(session.round%2===0?'Level up →':'Return to shop →',()=>game.act({type:'next'}),game.busy)}</View>}
  {!!game.error&&<Text style={{color:'#ffb9a4'}}>{game.error}</Text>}
 </View></SafeAreaView>
 <Modal transparent visible={history} animationType="fade" onRequestClose={()=>setHistory(false)}><View style={{flex:1,padding:24,justifyContent:'center',backgroundColor:'#080b12ee'}}><View style={{maxHeight:'100%',gap:12}}><CombatTimeline battle={battle} frame={frame} activeTick={current.tick} round={session.round} pacing="Paused" compact={compact} onInspect={()=>game.setPaused(true)} controls={button('Close timeline',()=>setHistory(false))}/></View></View></Modal>
 </View></CombatConnections>;
}
