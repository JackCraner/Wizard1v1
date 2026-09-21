import { SpellIcon } from '../components/cards/SpellIcon';
import { useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Battle } from '../game/model';
import { SPELLS, RULES } from '../game/engine';
import { castsAt } from '../game/combatTimeline';
import { spellVisual } from '../components/cards/spellVisual';

export function CombatTimeline({battle,frame,activeTick,round,pacing,compact,controls,onInspect}:{battle:Battle;frame:number;activeTick:number;round:number;pacing:string;compact:boolean;controls:ReactNode;onInspect:()=>void}) {
  const [inspected,setInspected]=useState<number|null>(null);
  const [history,setHistory]=useState(false);
  const start=history?1:frame>30?31:1;
  const end=Math.min(start+29,RULES.maxTicks);
  const cellHeight=compact?17:25;
  return <View style={s.panel}>
    <View style={s.header}><View style={{flex:1}}><Text style={s.title}>ROUND {round} · TICK {activeTick}/{RULES.maxTicks} · {pacing}</Text><Text style={s.legend}>Ticks {start}–{end} · × skipped · Tap for details</Text></View>{frame>30&&<Pressable accessibilityRole="button" onPress={()=>setHistory(!history)} style={s.pageButton}><Text style={s.sub}>{history?'31–50 →':'← 1–30'}</Text></Pressable>}{controls}</View>
    <View style={s.tracks}><View style={s.labels}><Text style={[s.rowLabel,{height:12}]}>TICK</Text><Text style={[s.rowLabel,{height:cellHeight,color:'#95cede'}]}>YOU</Text><Text style={[s.rowLabel,{height:cellHeight,color:'#e3a597'}]}>FOE</Text></View>
      {Array.from({length:end-start+1},(_,i)=>{
        const tick=start+i, revealed=tick<=frame&&tick<battle.frames.length;
        const rows=(['player','bot'] as const).map(side=>({side,events:castsAt(battle,tick,side,frame),charging:revealed?battle.frames[tick][side].casting:null}));
        const description=rows.map(row=>`${row.side==='player'?'You':'Opponent'}: ${row.events.length?row.events.map(e=>`${SPELLS[e.spell].name} ${e.status}${e.critical?', critical':''}`).join(', '):row.charging?`Charging ${SPELLS[row.charging.spell].name}, ${row.charging.remaining} ticks left`:'No cast'}`).join('. ');
        return <Pressable key={tick} accessibilityRole="button" disabled={!revealed} accessibilityLabel={`Tick ${tick}. ${revealed?description:'Not played'}`} onPress={()=>{onInspect();setInspected(tick);}} style={[s.column,(i+1)%5===0&&s.groupEdge,tick===frame&&s.current]}>
          <Text style={s.tick}>{i===0||tick%5===0||tick===frame?tick:'·'}</Text>
          {rows.map((row,index)=>{const e=row.events.at(-1),visual=e?spellVisual(e.spell):null;return <View key={row.side} style={[s.cell,{height:cellHeight},index===0&&s.playerCell]}>{e?<SpellIcon id={e.spell} size={cellHeight-2} opacity={e.status==='skipped'?.35:1}/>:<Text style={{fontSize:compact?12:19,color:'#8d7958'}}>{''}</Text>}{e?.status==='skipped'&&<Text style={s.skip}>×</Text>}{row.events.length>1&&<Text style={s.count}>+{row.events.length-1}</Text>}</View>;})}
        </Pressable>;
      })}
    </View>
    <Modal visible={inspected!==null} transparent animationType="fade" onRequestClose={()=>setInspected(null)}><View style={s.shade}><View accessibilityViewIsModal style={s.detail}>
      <View style={s.header}><Text style={[s.detailTitle,{flex:1}]}>Tick {inspected}</Text><Pressable accessibilityRole="button" onPress={()=>setInspected(null)} style={s.close}><Text style={s.detailName}>Close</Text></Pressable></View>
      <ScrollView contentContainerStyle={{gap:12}}>{inspected!==null&&(['player','bot'] as const).map(side=>{
        const events=castsAt(battle,inspected,side,frame), casting=battle.frames[inspected][side].casting, reshuffle=battle.frames[inspected][side].reshuffleRemaining??0;
        return <View key={side} style={{gap:5}}><Text style={s.detailTitle}>{side==='player'?'You':'Opponent'}</Text>{events.map((e,i)=><View key={i} style={s.detailRow}><SpellIcon id={e.spell} size={32} /><View style={{flex:1}}><Text style={s.detailName}>{SPELLS[e.spell].name}</Text><Text style={s.detailText}>{e.status==='skipped'?'Skipped — insufficient mana':`Cast · ${e.mana} mana${e.critical?` · Critical (${Math.round((e.critMultiplier??1.5)*100)}%)`:''}${e.repeats===2?' · Tidecaller ×2':''}`}</Text>{e.details?.map((detail,j)=><Text key={j} style={s.detailText}>{detail}</Text>)}</View></View>)}{casting&&<Text style={s.detailText}>Charging {SPELLS[casting.spell].name} · {casting.remaining} ticks remaining</Text>}{!events.length&&!casting&&<Text style={s.detailText}>{reshuffle?`Reshuffling · ${reshuffle} ticks remaining`:battle.frames[inspected-1]?.[side].reshuffleRemaining?'Reshuffle complete. Deck starts next tick.':'No spell cast.'}</Text>}</View>;
      })}{inspected!==null&&<View style={{gap:5}}><Text style={s.detailTitle}>Tick outcomes</Text>{battle.frames[inspected].manaEvents?.map((e,i)=><Text key={`m${i}`} style={[s.detailText,{color:'#70caff'}]}>{e.side==='player'?'You':'Opponent'}: {e.amount>0?'+':''}{e.amount} MP · {e.kind==='cost'?'cast cost':e.kind==='rebirth'?'Phoenix':'spell effect'}</Text>)}{battle.frames[inspected].notices?.map((n,i)=><Text key={`n${i}`} style={s.detailText}>{n.side==='player'?'You':'Opponent'}: {n.text}</Text>)}{battle.frames[inspected].damageEvents?.map((e,i)=><Text key={`d${i}`} style={s.detailText}>{e.side==='player'?'You':'Opponent'}: −{e.amount} HP · {e.kind==='dot'?'damage over time':e.kind==='cost'?'health cost':'spell damage'}{e.critical?' · critical':''}</Text>)}{battle.frames[inspected].healingEvents?.map((e,i)=><Text key={`h${i}`} style={s.detailText}>{e.side==='player'?'You':'Opponent'}: +{e.amount} HP · {e.kind==='hot'?'healing over time':'healing'}</Text>)}</View>}</ScrollView>
    </View></View></Modal>
  </View>;
}
const s=StyleSheet.create({
  panel:{borderWidth:1,borderColor:'#957344',borderRadius:5,backgroundColor:'#20170ef0',paddingHorizontal:7,paddingVertical:4,gap:3},header:{flexDirection:'row',alignItems:'center',gap:8},title:{color:'#e9d3a6',fontSize:10,fontWeight:'600'},sub:{color:'#bca989',fontSize:9},legend:{color:'#a89576',fontSize:8,marginTop:2},pageButton:{padding:5},tracks:{flexDirection:'row'},labels:{width:32},rowLabel:{fontSize:8,color:'#a08e71',textAlignVertical:'center'},column:{flex:1,minWidth:0,borderRightWidth:1,borderRightColor:'#7b603122'},groupEdge:{borderRightColor:'#b4975966'},current:{backgroundColor:'#6d572955',borderWidth:1,borderColor:'#e2bf70'},tick:{fontSize:8,color:'#b09a76',height:12,textAlign:'center'},cell:{alignItems:'center',justifyContent:'center'},playerCell:{backgroundColor:'#49778718',borderBottomWidth:1,borderBottomColor:'#9a805033'},skip:{position:'absolute',right:0,bottom:0,color:'#dfa492',fontSize:10},count:{position:'absolute',right:0,top:0,color:'#fff0bf',fontSize:7},shade:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#000b',padding:20},detail:{width:'100%',maxWidth:450,maxHeight:'95%',padding:18,borderWidth:1,borderColor:'#b4955c',borderRadius:7,backgroundColor:'#21190f',gap:14},detailTitle:{color:'#efd8a9',fontSize:17},detailRow:{flexDirection:'row',gap:14,alignItems:'center'},detailName:{color:'#eee0c6',fontSize:14},detailText:{color:'#c3ad87',fontSize:12,marginTop:4},close:{minHeight:36,paddingHorizontal:12,alignItems:'center',justifyContent:'center',backgroundColor:'#3b3422',borderWidth:1,borderColor:'#a58a55',borderRadius:4},
});
