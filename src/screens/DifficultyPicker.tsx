import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import config from '../config/bots.json';
import type { Difficulty } from '../game/model';

export function DifficultyPicker({onStart,onCancel,busy}:{onStart:(difficulty:Difficulty)=>void;onCancel:()=>void;busy:boolean}) {
 const [selected,setSelected]=useState<Difficulty>(config.defaultDifficulty as Difficulty);
 return <View style={{flex:1,backgroundColor:'#21180e'}}><Image source={require('../../assets/MainBackground.png')} resizeMode="cover" style={[StyleSheet.absoluteFill,{width:'100%',height:'100%'}]}/><SafeAreaView style={s.shade}><View style={s.panel}>
  <Text style={s.title}>Choose your challenge</Text><Text style={s.subtitle}>You + 7 rivals · First to 8 wins</Text>
  <View style={s.options}>{(Object.keys(config.difficulties) as Difficulty[]).map(id=><Pressable key={id} accessibilityRole="button" accessibilityLabel={`${config.difficulties[id].label} difficulty`} accessibilityState={{selected:selected===id}} disabled={busy} onPress={()=>setSelected(id)} style={[s.option,selected===id&&s.selected]}><Text style={s.name}>{config.difficulties[id].label}</Text><Text style={s.description}>{config.difficulties[id].description}</Text></Pressable>)}</View>
  <View style={s.actions}><Pressable accessibilityRole="button" disabled={busy} onPress={onCancel} style={s.button}><Text style={s.name}>Back</Text></Pressable><Pressable accessibilityRole="button" disabled={busy} onPress={()=>onStart(selected)} style={[s.button,s.selected]}><Text style={s.name}>Start {config.difficulties[selected].label} game</Text></Pressable></View>
 </View></SafeAreaView></View>;
}
const s=StyleSheet.create({shade:{flex:1,alignItems:'center',justifyContent:'center',padding:16,backgroundColor:'#100b08a8'},panel:{width:'100%',maxWidth:720,padding:16,gap:12,backgroundColor:'#241b12ed',borderColor:'#b99a60',borderWidth:1,borderRadius:8},title:{fontSize:24,color:'#f4dca8',fontWeight:'700',textAlign:'center'},subtitle:{fontSize:12,color:'#c2ad88',textAlign:'center'},options:{flexDirection:'row',flexWrap:'wrap',gap:8},option:{width:'48%',flexGrow:1,padding:12,borderWidth:1,borderColor:'#705a3e',borderRadius:5,backgroundColor:'#21190f',gap:5},selected:{backgroundColor:'#34462e',borderColor:'#e2bf76'},name:{color:'#f0dfbc',fontSize:14,fontWeight:'700'},description:{color:'#c5b89f',fontSize:11},actions:{flexDirection:'row',justifyContent:'center',gap:10},button:{paddingVertical:12,paddingHorizontal:18,borderWidth:1,borderColor:'#a88c56',borderRadius:5}});
