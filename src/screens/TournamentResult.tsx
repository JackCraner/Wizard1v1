import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Session } from '../game/model';
import { Leaderboard } from './Leaderboard';
import { combatArt } from './CombatAssets';

export function TournamentResult({session,onNewGame,onMenu,busy,error}:{session:Session;onNewGame:()=>void;onMenu:()=>void;busy:boolean;error:string}) {
 const [leaderboard,setLeaderboard]=useState(false);
 const winners=session.lobby.players.filter(p=>session.lobby.winnerIds.includes(p.id)),won=winners.some(p=>p.human);
 return <View style={{flex:1,backgroundColor:'#17110c'}}><Image source={combatArt.background} resizeMode="cover" style={[StyleSheet.absoluteFill,{width:'100%',height:'100%'}]}/><SafeAreaView style={s.shade}><View style={s.panel}>
  <Text style={s.trophy}>🏆</Text><Text style={s.title}>{won?'You won the game!':'Game complete'}</Text>
  <Text style={s.text}>{winners.map(p=>p.name).join(' & ')} {winners.length>1?'share the crown':'takes the crown'} · {session.lobby.trophiesToWin} trophies</Text>
  <Text style={s.text}>Your trophies: {session.trophies}/{session.lobby.trophiesToWin} · {session.round} rounds played</Text>
  <View style={{flexDirection:'row',gap:8}}>{[{label:'Final leaderboard',action:()=>setLeaderboard(true)},{label:'New game',action:onNewGame},{label:'Main menu',action:onMenu}].map(b=><Pressable key={b.label} accessibilityRole="button" disabled={busy} onPress={b.action} style={s.button}><Text style={s.text}>{b.label}</Text></Pressable>)}</View>
  {!!error&&<Text accessibilityRole="alert" style={{color:'#ffafa2'}}>{error}</Text>}
 </View></SafeAreaView><Leaderboard lobby={session.lobby} visible={leaderboard} onClose={()=>setLeaderboard(false)}/></View>;
}
const s=StyleSheet.create({shade:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#100b08b9',padding:16},panel:{alignItems:'center',gap:14,padding:22,backgroundColor:'#241a10ee',borderWidth:1,borderColor:'#c5a262',borderRadius:8,maxWidth:'100%'},trophy:{fontSize:38},title:{fontSize:27,fontWeight:'700',color:'#ffe1a0'},text:{fontSize:12,color:'#eddfc3',textAlign:'center'},button:{padding:12,borderWidth:1,borderColor:'#b4995e',borderRadius:4,backgroundColor:'#34482d'}});
