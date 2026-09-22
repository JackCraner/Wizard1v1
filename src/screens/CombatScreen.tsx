import { CombatResult } from './CombatResult';
import {CombatProcs} from './CombatProcs';
import {AugmentInventory} from '../components/AugmentInventory';
import { useMemo } from 'react';
import { presentedCombatFrame, continuousCombatFrame, PLAYBACK_CONFIG } from '../game/playback';
import { CombatDeck } from './CombatDeck';
import { CastBar } from './CastBar';
import { DamageNumbers, EffectBar, ImpCompanion } from './CombatFeedback';
import { CombatTimeline } from './CombatTimeline';
import { combatArt, OrnateMeter } from './CombatAssets';
import { Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { useGame } from '../useGame';
import type { CombatFrame, Fighter, Session } from '../game/model';

function Control({ label, onPress, selected, disabled }: { label: string; onPress: () => void; selected?: boolean; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected, disabled }} disabled={disabled} onPress={onPress} style={[s.control, selected && s.selected, disabled && { opacity: .4 }]}><Text style={s.text}>{label}</Text></Pressable>;
}
function Mage({ fighter, opponent, compact, finished, tick, speed, playing, highlights, onInspect, feedback }: { feedback:CombatFrame; fighter: Fighter; opponent?: boolean; compact: boolean; finished:boolean; tick:number; speed:number; playing:boolean; highlights:string[]; onInspect:()=>void }) {
  return <View style={[s.mage, opponent ? { right: '18%', top: 0 } : { left: '13%', bottom: 0 }, { width: compact ? 112 : 190, height: '100%' }]}>
    <View style={{position:'absolute',top:0,height:32,width:compact?150:210,zIndex:20}}><EffectBar fighter={fighter} compact={compact} group="debuff" highlight={highlights} onInspect={onInspect} /></View>
    <Text numberOfLines={1} style={[s.mageName,{position:'absolute',top:33}]}>{opponent ? fighter.name : 'You'} · Lv {fighter.level}</Text>
    <View style={{position:'absolute',top:44,width:'100%',gap:1}}><OrnateMeter value={fighter.health} max={fighter.maxHealth} /></View>
    <View style={{position:'absolute',top:82,bottom:24,width:'100%',overflow:'hidden'}}><Image source={combatArt.pose} accessible={false} resizeMode="contain" style={{position:'absolute',width:'180%',height:'117%',left:'-40%',top:'-9%',transform:[{scaleX:opponent?-1:1}],opacity:fighter.health>0?1:.4}} /></View>
    <View style={{position:'absolute',top:82,bottom:24,width:opponent?(compact?65:90):(compact?40:65),...(opponent?{left:'100%' as const}:{right:'100%' as const}),zIndex:10}}><EffectBar fighter={fighter} compact={compact} group="buff" highlight={highlights} onInspect={onInspect} /></View>
    <ImpCompanion fighter={fighter} onInspect={onInspect} frame={feedback} side={opponent?'bot':'player'}/>
    <CastBar fighter={fighter} compact={compact} finished={finished} tick={tick} speed={speed} playing={playing} />
  </View>;
}

export function CombatScreen({ game }: { game: ReturnType<typeof useGame> }) {
  const { battle, session, frame, finished, speed, setSpeed, setFrame, act, busy } = game;
  const { height } = useWindowDimensions();
  const compact = height < 500;
  const castingBeatPlaying=game.active&&!game.paused&&!finished&&game.beat==='cast';
  const current=useMemo(()=>battle?(game.beat==='cast'?continuousCombatFrame(battle,frame):presentedCombatFrame(battle,frame,'hold')):null,[battle,frame,game.beat]);
  if (!battle || !session || !current) return null;
  return <View style={s.root}>
    <Image accessible={false} source={combatArt.background} resizeMode="cover" style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} />
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#130e0928' }]} />
    <SafeAreaView style={{ flex: 1 }}>
    <View style={[s.page, { padding: compact ? 7 : 16, gap: compact ? 6 : 12 }]}>
      <CombatTimeline key={session.round} battle={battle} frame={frame} activeTick={current.tick} round={session.round} pacing={finished?'Complete':game.paused?'Paused':'● Combat'} compact={compact} onInspect={()=>game.setPaused(true)} controls={<View style={s.controls}><Control label="‹ Menu" onPress={()=>game.setScreen('menu')} /><Control label="‹ Tick" disabled={frame===0} onPress={()=>game.step(-1)} /><Control label={finished?'Replay':game.paused?'Play':'Pause'} onPress={()=>{if(finished)setFrame(0);game.setPaused(finished?false:!game.paused);}} /><Control label="Tick ›" disabled={finished} onPress={()=>game.step(1)} />{PLAYBACK_CONFIG.speedMultipliers.map(value => <Control key={value} label={`${value}×`} selected={speed === value} onPress={() => setSpeed(value)} />)}<Control label="Skip" disabled={finished} onPress={() => setFrame(battle.frames.length - 1)} /></View>} />
      <View style={s.field}>
        <View style={s.leftField}>
          <View style={s.arena}>
            
            <Mage feedback={current} fighter={current.player} compact={compact} finished={finished} tick={frame} speed={speed} playing={castingBeatPlaying} highlights={(current.notices??[]).filter(n=>n.side==='player').map(n=>n.status)} onInspect={()=>game.setPaused(true)} /><Mage feedback={current} fighter={current.bot} opponent compact={compact} finished={finished} tick={frame} speed={speed} playing={castingBeatPlaying} highlights={(current.notices??[]).filter(n=>n.side==='bot').map(n=>n.status)} onInspect={()=>game.setPaused(true)} />{(['player','bot'] as const).map(side=><View key={side} accessibilityLabel={side==='player'?'Your augments':'Opponent augments'} style={{position:'absolute',...(side==='player'?{left:3}:{right:3}),top:82,bottom:24,width:compact?64:84,gap:4,zIndex:26}}><Text style={s.label}>AUGMENTS</Text><ScrollView style={{flex:1}} contentContainerStyle={{padding:3}} showsVerticalScrollIndicator={false}><AugmentInventory augments={current[side].augments} compact onInspect={()=>game.setPaused(true)}/></ScrollView></View>)}<DamageNumbers frame={current} /><CombatProcs key={session.round} frame={current} speed={speed} playing={game.active&&!game.paused} compact={compact} />
            {(['player','bot'] as const).map(side=><View key={side} style={{position:'absolute',...(side==='player'?{left:'33%' as const}:{right:'33%' as const}),top:36,bottom:0,width:compact?96:140,zIndex:25}}><CombatDeck fighter={current[side]} side={side} frame={current} compact={compact} speed={speed} finished={finished} playing={castingBeatPlaying} onInspect={()=>{const wasPaused=game.paused;game.setPaused(true);return()=>game.setPaused(wasPaused);}} /></View>)}
            {!finished&&<View style={s.beatNotice}><Text numberOfLines={2} style={s.event}>{frame === 0 ? 'Spells locked · Duel begins' : current.notices?.length?[...new Set(current.notices.map(n=>`${n.side==='player'?'You':'Foe'} · ${n.text}`))].join('\n'):current.messages.join('\n')}</Text></View>}
            {finished&&<CombatResult outcome={battle.outcome} level={session.level} compact={compact}/>}
          </View>
          {finished&&<View style={{alignItems:'center'}}><Control label={session.round%2===0?"Level up →":"Return to shop →"} disabled={busy} selected onPress={()=>act({type:'next'})} /></View>}
        </View>

      </View>
      {!!game.error && <Text accessibilityRole="alert" style={s.error}>{game.error}</Text>}
    </View>
  </SafeAreaView></View>;
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#19130e' }, page: { flex: 1, overflow: 'hidden' }, text: { color: '#e9deca', fontSize: 11 }, muted: { color: '#c1b391', fontSize: 9 },
  top: { flexDirection: 'row', gap: 10 }, panel: { backgroundColor: '#21170ee6', borderWidth: 1, borderColor: '#9c7949', borderRadius: 6, padding: 8, justifyContent: 'center', gap: 5 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 7 }, statusHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 5 }, name: { color: '#eee3d2', fontSize: 12, flexShrink: 1, fontWeight: '600' }, portrait: { borderWidth: 1, borderColor: '#b19560', borderRadius: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: '#201910' }, portraitGlyph: { fontSize: 29, color: '#bacbd7' },
  meterRow: { flexDirection: 'row', gap: 5, alignItems: 'center' }, track: { flex: 1, height: 9, backgroundColor: '#101922', borderWidth: 1, borderColor: '#778291', borderRadius: 2, overflow: 'hidden' }, value: { width: 42, color: '#dbe3e8', fontSize: 9 },
  gear: { flex:1, flexDirection: 'column', gap: 5 }, gearSlot: { flex: 1, maxHeight:40, borderWidth: 1, borderColor: '#9c7949', borderRadius: 3, alignItems: 'center', justifyContent: 'center', backgroundColor: '#211911' }, gearIcon: { color: '#c9b48c', fontSize: 22 }, label: { color: '#d7c399', fontSize: 9, textAlign: 'center' },
  round: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 }, roundText: { color: '#ecdbb7', fontWeight: '600' }, menu: { color: '#afc1cd', fontSize: 10, padding: 3 },
  timeline: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 10, borderWidth: 1, borderColor: '#957344', borderRadius: 5, backgroundColor: '#20170ee8' }, controls: { flexDirection: 'row', gap: 3 }, control: { minHeight: 30, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6, borderWidth: 1, borderColor: '#9c8055', borderRadius: 4, backgroundColor: '#30261a' }, selected: { backgroundColor: '#31452b', borderColor: '#c1a56a' }, dots: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', height: 12 }, dot: { width: 8, height: 8, borderRadius: 8, borderWidth: 1, borderColor: '#7d91a2' }, dotPast: { backgroundColor: '#718291' }, dotCurrent: { backgroundColor: '#a4dbed', borderColor: '#d5f6ff', width: 12, height: 12 },
  field: { flex: 1, minHeight: 0, flexDirection: 'row', gap: 8 }, leftField: { flex: 1, minWidth: 0, gap: 7 }, arena: { flex: 1, minHeight: 0, overflow: 'hidden', backgroundColor: 'transparent', borderRadius: 7 }, bottom: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  ring: { position: 'absolute', bottom: '-20%', left: '5%', width: '90%', height: '70%', borderWidth: 2, borderColor: '#39495a', borderRadius: 300 }, innerRing: { position: 'absolute', bottom: '-7%', left: '20%', width: '60%', height: '45%', borderWidth: 1, borderColor: '#425469', borderRadius: 300 }, arenaRune: { position: 'absolute', left: '45%', bottom: '5%', color: '#405168', fontSize: 60 }, mage: { position: 'absolute', alignItems: 'center' }, mageName: { color: '#b7c7d2', fontSize: 9 }, miniTrack: { height: 5, width: '60%', backgroundColor: '#293640', marginTop: 3, overflow: 'hidden', borderRadius: 2 }, platform: { width: '100%', height: 10, borderWidth: 1, borderRadius: 30, backgroundColor: '#344352' }, beatNotice: { position: 'absolute', left: '32%', right: '32%', top: 0, alignItems: 'center' }, event: { backgroundColor: '#140e0caa', padding: 4, borderRadius: 4, color: '#d9c8a6', fontSize: 10, textAlign: 'center' },
  error: { color: '#ffb7a7', fontSize: 11 },
});
