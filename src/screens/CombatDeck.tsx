import { cardAt } from '../game/upgrades';
import { activeSpellIndices } from '../game/rotation';
import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { CardPreview, SpellCard } from '../components/cards/SpellCard';
import { COMBAT_TICK_MS } from '../game/playback';
import { SPELLS } from '../game/engine';
import type { CastEvent, CombatFrame, Fighter } from '../game/model';

function PeelingCard({event,speed,index,onDone}:{event:CastEvent;speed:number;index:number;onDone:()=>void}) {
 const p=useRef(new Animated.Value(0)).current;
 useEffect(()=>{const animation=Animated.timing(p,{toValue:1,duration:Math.max(160,550/speed),delay:index*25/speed,useNativeDriver:true});animation.start(({finished})=>{if(finished)onDone();});return()=>animation.stop();},[]);
 return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill,{zIndex:20+index,opacity:p.interpolate({inputRange:[0,.6,1],outputRange:[1,1,0]}),transform:[{translateY:p.interpolate({inputRange:[0,1],outputRange:[0,-30]})},{translateX:p.interpolate({inputRange:[0,1],outputRange:[0,event.side==='player'?-38:38]})},{rotate:p.interpolate({inputRange:[0,1],outputRange:['0deg',event.side==='player'?'-24deg':'24deg']})}]}]}><SpellCard {...cardAt(event.spell,event.xp)} compact /><Text style={s.peelLabel}>{event.status==='skipped'?(event.details?.some(d=>d.includes('Interrupted'))?'Interrupted':'Skipped'):event.details?.some(d=>d.startsWith('Fragile:'))?'Broken':'Cast'}</Text></Animated.View>;
}

export function CombatDeck({fighter,side,frame,compact,speed,finished,playing,onInspect}:{fighter:Fighter;side:'player'|'bot';frame:CombatFrame;compact:boolean;speed:number;finished:boolean;playing:boolean;onInspect:()=>()=>void}) {
 const previous=useRef(frame.tick);const [peels,setPeels]=useState<(CastEvent&{key:string})[]>([]);const [inspected,setInspected]=useState<number|null>(null);const shuffle=useRef(new Animated.Value(0)).current;
 const restorePlayback=useRef<(()=>void)|null>(null);
 function inspect(index:number){if(!restorePlayback.current)restorePlayback.current=onInspect();setInspected(index);}
 function closePreview(){setInspected(null);const restore=restorePlayback.current;restorePlayback.current=null;restore?.();}
 const remaining=fighter.reshuffleRemaining??0,shuffling=remaining>0,stunned=(fighter.statuses.stun??0)>0;
 const id=fighter.casting?.spell??fighter.spells[fighter.cursor];
 const active=activeSpellIndices(fighter),count=shuffling?0:active.filter(index=>index>=fighter.cursor).length;
 const direction=side==='player'?1:-1;
 const upcoming=(shuffling?active:active.filter(index=>index>fighter.cursor)).slice(0,3).map((index,depth)=>({spell:fighter.spells[index],depth:depth+1,index})).reverse();
 useEffect(()=>{
  const sequential=frame.tick===previous.current+1||frame.tick===previous.current;previous.current=frame.tick;
  setPeels(sequential?frame.events.filter(e=>e.side===side).map((e,i)=>({...e,key:`${frame.tick}-${i}`})):[]);
 },[frame,side]);
 useEffect(()=>{shuffle.setValue(0);if(!shuffling||finished||!playing||stunned)return;const a=Animated.sequence([Animated.timing(shuffle,{toValue:1,duration:COMBAT_TICK_MS/2/speed,useNativeDriver:true}),Animated.timing(shuffle,{toValue:0,duration:COMBAT_TICK_MS/2/speed,useNativeDriver:true})]);a.start();return()=>a.stop();},[frame.tick,shuffling,speed,finished,playing,stunned]);
 return <View style={s.root}>
  <Text style={s.title}>{side==='player'?'YOUR DECK':'OPPONENT DECK'}</Text>
  <View style={{flex:1,minHeight:0,maxHeight:compact?136:210,width:'100%',alignItems:'center'}}>
   <View style={{height:'100%',aspectRatio:2/3,transform:[{translateX:-direction*Math.min(upcoming.length,3)*5}]}}>
    {upcoming.map(({spell,depth,index})=><Animated.View key={depth} style={[StyleSheet.absoluteFill,{zIndex:10-depth,transform:[{translateX:shuffle.interpolate({inputRange:[0,1],outputRange:[direction*depth*10,direction*(depth%2?18:-12)]})},{translateY:-depth*2},{rotate:`${direction*(depth*5-4)}deg`}]}]}><Pressable accessibilityRole="button" accessibilityLabel={`${side==='player'?'Your':'Opponent'} upcoming spell ${depth}: ${SPELLS[spell].name}. Inspect card.`} onPress={()=>inspect(index)} style={StyleSheet.absoluteFill}><SpellCard {...cardAt(spell,fighter.spellXp?.[index])} compact /></Pressable></Animated.View>)}

    {!active.length?<View accessible accessibilityLabel="All spells broken for this duel" style={[StyleSheet.absoluteFill,s.reshuffle,{zIndex:11}]}><Text style={s.timer}>✧</Text><Text style={s.caption}>All spells broken</Text></View>:shuffling?<View accessible accessibilityLabel={`${side==='player'?'Your':'Opponent'} deck reshuffling for ${remaining} tick`} style={[StyleSheet.absoluteFill,s.reshuffle,{zIndex:11}]}><Animated.Text style={[s.shuffleIcon,{transform:[{rotate:shuffle.interpolate({inputRange:[0,1],outputRange:['0deg','180deg']})}]}]}>⟳</Animated.Text><Text style={s.timer}>{remaining}T</Text></View>:<Pressable accessibilityRole="button" accessibilityLabel={`${side==='player'?'Your':'Opponent'} deck: ${count} cards left. ${SPELLS[id].name}. Inspect card.`} onPress={()=>inspect(fighter.cursor)} style={[StyleSheet.absoluteFill,{zIndex:11,transform:[{rotate:`${-4*direction}deg`}]}]}><SpellCard {...cardAt(id,fighter.spellXp?.[fighter.cursor])} compact /></Pressable>}
    {peels.map((event,i)=><PeelingCard key={event.key} event={event} speed={speed} index={i} onDone={()=>setPeels(old=>old.filter(e=>e.key!==event.key))} />)}
   </View>
  </View>
  <Text numberOfLines={1} style={s.caption}>{finished?'Duel complete':!active.length?'No spells remaining':stunned?`Stunned · ${fighter.statuses.stun}T`:shuffling?`Reshuffling · ${remaining}T`:`${count}/${active.length} left · ${fighter.casting?'Casting':'Ready'}`}</Text>
  <Modal transparent visible={inspected!==null} animationType="fade" onRequestClose={closePreview}><View style={s.shade}><View style={s.preview}>{inspected!==null&&<CardPreview card={cardAt(fighter.spells[inspected],fighter.spellXp?.[inspected])} height={compact?245:340} />}<Pressable accessibilityRole="button" onPress={closePreview} style={s.close}><Text style={s.title}>Close</Text></Pressable></View></View></Modal>
 </View>;
}
const s=StyleSheet.create({root:{flex:1,minHeight:0,alignItems:'center',justifyContent:'center',paddingTop:8,paddingBottom:4,gap:16},title:{color:'#f1dbad',fontSize:9,lineHeight:12,flexShrink:0,fontWeight:'700',textAlign:'center'},caption:{color:'#f3e0ba',fontSize:8,backgroundColor:'#1a140ed9',padding:3,borderRadius:3},back:{backgroundColor:'#262017',borderWidth:1,borderColor:'#9a7e4a',borderRadius:5,alignItems:'center',justifyContent:'center'},rune:{color:'#bda468',fontSize:32},reshuffle:{alignItems:'center',justifyContent:'center',backgroundColor:'#19140edb',borderWidth:1,borderColor:'#bd9854',borderRadius:4},shuffleIcon:{color:'#e4c882',fontSize:30},timer:{color:'#fff0c7',fontSize:16,fontWeight:'800'},peelLabel:{position:'absolute',bottom:3,alignSelf:'center',color:'#fff2c9',backgroundColor:'#291b10e8',fontSize:9,padding:2},shade:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#000b'},preview:{alignItems:'center',gap:8},close:{paddingVertical:10,paddingHorizontal:24,borderWidth:1,borderColor:'#b99b62',backgroundColor:'#292015',borderRadius:4}});
