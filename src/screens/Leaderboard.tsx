import { cardAt } from '../game/upgrades';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SpellIcon } from '../components/cards/SpellIcon';
import { CardPreview } from '../components/cards/SpellCard';
import { SPELLS } from '../game/engine';
import type { Lobby } from '../game/model';

export function Leaderboard({lobby,visible,onClose}:{lobby:Lobby;visible:boolean;onClose:()=>void}) {
 const [card,setCard]=useState<{id:string;xp:number}|null>(null);const {height}=useWindowDimensions();
 const close=()=>{setCard(null);onClose();};
 const players=[...lobby.players].sort((a,b)=>b.wins-a.wins||a.losses-b.losses||a.id.localeCompare(b.id));
 return <Modal visible={visible} transparent animationType="fade" onRequestClose={()=>card?setCard(null):close()}><View style={s.shade}><View accessibilityViewIsModal style={s.panel}>
  <View style={s.header}><View style={{flex:1}}><Text style={s.title}>{card?SPELLS[card.id].name:'Race to the crown'}</Text><Text style={s.muted}>{lobby.players.length} players · First to {lobby.winsToWin} wins · Draws earn no trophies</Text></View><Pressable accessibilityRole="button" onPress={card?()=>setCard(null):close} style={s.button}><Text style={s.text}>{card?'Back to leaderboard':'Close leaderboard'}</Text></Pressable></View>
  {card?<View style={{alignItems:'center'}}><CardPreview card={cardAt(card.id,card.xp)} height={Math.min(300,height-115)} /></View>:<ScrollView contentContainerStyle={{gap:8}}>
   {players.map((p,index)=><View key={p.id} style={[s.row,p.human&&s.you]}>
    <View style={s.header}><Text style={s.rank}>{index+1}</Text><Text style={[s.text,{flex:1,fontWeight:'700'}]}>{p.name}{p.human?' · You':''}{lobby.winnerIds.includes(p.id)?' · Winner':''}</Text><Text style={s.trophies}>🏆 {p.wins}/{lobby.winsToWin}</Text><Text style={s.muted}>{p.losses}L · {p.draws}D</Text></View>
    <Text style={s.muted}>{p.lastCombatRound===null?'No combat yet':`Last combat · Round ${p.lastCombatRound} · Cast order →`}</Text>
    <View style={s.deck}>{p.lastCombatDeck.map((id,i)=><Pressable key={i} accessibilityRole="button" accessibilityLabel={`${p.name}, spell ${i+1}: ${SPELLS[id].name}`} onPress={()=>setCard({id,xp:p.lastCombatXp?.[i]??0})} style={s.spell}><SpellIcon id={id} size={24}/><Text numberOfLines={2} style={s.spellName}>{i+1}. {SPELLS[id].name}{(p.lastCombatXp?.[i]??0)>=3?' ↑':''}</Text></Pressable>)}</View>
   </View>)}
  </ScrollView>}
 </View></View></Modal>;
}
const s=StyleSheet.create({shade:{flex:1,backgroundColor:'#000c',alignItems:'center',justifyContent:'center',padding:12},panel:{width:'100%',maxWidth:820,maxHeight:'100%',backgroundColor:'#21180f',borderColor:'#b59a61',borderWidth:1,borderRadius:8,padding:12,gap:10},header:{flexDirection:'row',alignItems:'center',gap:10},title:{color:'#f4d99d',fontSize:19,fontWeight:'700'},text:{color:'#efe0c5',fontSize:12},muted:{color:'#bdae94',fontSize:10},button:{borderColor:'#9c8055',borderWidth:1,borderRadius:4,padding:10,backgroundColor:'#34271a'},row:{padding:9,gap:6,borderWidth:1,borderColor:'#655134',borderRadius:5,backgroundColor:'#19140f'},you:{borderColor:'#d4b461',backgroundColor:'#30261a'},rank:{color:'#bba37a',width:16,fontSize:14},trophies:{color:'#f0d180',fontSize:15,fontWeight:'700'},deck:{flexDirection:'row',flexWrap:'wrap',gap:5},spell:{width:62,alignItems:'center',gap:3,padding:4,borderRadius:3,backgroundColor:'#30261b'},spellName:{color:'#e5d6ba',fontSize:8,textAlign:'center'}});
