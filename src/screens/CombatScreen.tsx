import { SpellIcon } from '../components/cards/SpellIcon';
import { CastBar } from './CastBar';
import { DamageNumbers, EffectBar } from './CombatFeedback';
import { spellVisual, statusSummary } from '../components/cards/spellVisual';
import { CombatTimeline } from './CombatTimeline';
import { combatArt, OrnateMeter, PlayerHotbar, PortraitArt } from './CombatAssets';
import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { useGame } from '../useGame';
import type { CastEvent, Fighter, Session, SpellId } from '../game/model';
import { SPELLS } from '../game/engine';
import { EQUIPMENT, EQUIPMENT_SLOTS } from '../game/shop';

function Control({ label, onPress, selected, disabled }: { label: string; onPress: () => void; selected?: boolean; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected, disabled }} disabled={disabled} onPress={onPress} style={[s.control, selected && s.selected, disabled && { opacity: .4 }]}><Text style={s.text}>{label}</Text></Pressable>;
}
function Gear({ equipment = {}, compact }: { equipment?: Session['equipment']; compact: boolean }) {
  return <View style={s.gear}>{EQUIPMENT_SLOTS.map(slot => { const id = equipment[slot]; return <View key={slot} accessibilityLabel={`${slot}: ${id ? EQUIPMENT[id].name : 'empty'}`} style={[s.gearSlot, { height: compact ? 26 : 40 }]}><Text style={s.gearIcon}>{id ? EQUIPMENT[id].symbol : '·'}</Text></View>; })}</View>;
}
function Status({ fighter, title, compact }: { fighter: Fighter; title: string; compact: boolean }) {
  return <View style={s.status}><View style={[s.portrait, { width: compact ? 36 : 62, height: compact ? 36 : 62 }]}><PortraitArt /></View><View style={{ flex: 1, gap: 3 }}><View style={s.statusHeading}><Text numberOfLines={1} style={s.name}>{title}</Text><Text numberOfLines={1} style={[s.muted, { maxWidth: 110 }]}>{statusSummary(fighter)}</Text></View><OrnateMeter value={fighter.health} max={fighter.maxHealth} /><OrnateMeter value={fighter.mana} max={fighter.maxMana} mana /></View></View>;
}
function Mage({ fighter, opponent, compact, finished, tick, speed, playing }: { fighter: Fighter; opponent?: boolean; compact: boolean; finished:boolean; tick:number; speed:number; playing:boolean }) {
  return <View style={[s.mage, opponent ? { right: '13%', top: 0 } : { left: '13%', bottom: 0 }, { width: compact ? 112 : 190, height: '100%' }]}>
    <View style={{position:'absolute',top:0,height:32,width:compact?150:210,zIndex:20}}><EffectBar fighter={fighter} compact={compact} group="debuff" /></View>
    <Text numberOfLines={1} style={[s.mageName,{position:'absolute',top:33}]}>{opponent ? fighter.name : 'You'}</Text>
    <View style={{position:'absolute',top:44,width:'85%'}}><OrnateMeter value={fighter.health} max={fighter.maxHealth} /></View>
    <View style={{position:'absolute',top:56,bottom:24,width:'100%',overflow:'hidden'}}><Image source={combatArt.pose} accessible={false} resizeMode="contain" style={{position:'absolute',width:'180%',height:'117%',left:'-40%',top:'-9%',transform:[{scaleX:opponent?-1:1}],opacity:fighter.health>0?1:.4}} /></View>
    <View style={{position:'absolute',top:56,bottom:24,width:compact?65:90,...(opponent?{left:'100%' as const}:{right:'100%' as const}),zIndex:10}}><EffectBar fighter={fighter} compact={compact} group="buff" /></View>
    <CastBar fighter={fighter} compact={compact} finished={finished} tick={tick} speed={speed} playing={playing} />
  </View>;
}

export function CombatScreen({ game }: { game: ReturnType<typeof useGame> }) {
  const { battle, session, frame, finished, speed, setSpeed, setFrame, act, busy } = game;
  const { height, width } = useWindowDimensions();
  const compact = height < 500;
  if (!battle || !session) return null;
  const current = battle.frames[frame];
  const lastCast=current.events.filter(e=>e.side==='player').at(-1);
  const activeIndex=current.player.casting?.index ?? lastCast?.index ?? -1;
  const nextIndex=current.player.cursor;
  const skipped=lastCast?.status==='skipped';
  return <View style={s.root}>
    <Image accessible={false} source={combatArt.background} resizeMode="cover" style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} />
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#130e0928' }]} />
    <SafeAreaView style={{ flex: 1 }}>
    <View style={[s.page, { padding: compact ? 7 : 16, gap: compact ? 6 : 12 }]}>
      <View style={[s.top, { height: compact ? 64 : 108 }]}>
        <View style={[s.panel, { width: compact ? 270 : 360, padding: compact ? 5 : 8 }]}><Status fighter={current.bot} title={current.bot.name} compact={compact} /></View>
        <View style={s.round}><Text style={[s.roundText, { fontSize: compact ? 18 : 28 }]}>Round {session.round}</Text><Text style={s.muted}>{finished ? 'Duel complete' : 'Combat phase'}</Text><Pressable accessibilityRole="button" onPress={() => game.setScreen('menu')}><Text style={s.menu}>‹ Menu</Text></Pressable></View>
        <View style={[s.panel, { width: compact ? 165 : 220, padding: compact ? 5 : 8 }]}><Text style={s.label}>OPPONENT EQUIPMENT</Text><Gear compact={compact} /></View>
      </View>
      <CombatTimeline key={session.round} battle={battle} frame={frame} compact={compact} controls={<View style={s.controls}>{[1, 2, 4].map(value => <Control key={value} label={`${value}×`} selected={speed === value} onPress={() => setSpeed(value)} />)}<Control label="Skip" disabled={finished} onPress={() => setFrame(battle.frames.length - 1)} /></View>} />
      <View style={s.field}>
        <View style={s.leftField}>
          <View style={s.arena}>
            
            <Mage fighter={current.player} compact={compact} finished={finished} tick={frame} speed={speed} playing={game.active && !finished} /><Mage fighter={current.bot} opponent compact={compact} finished={finished} tick={frame} speed={speed} playing={game.active && !finished} /><DamageNumbers frame={current} />
            <View style={s.beatNotice}><Text numberOfLines={2} style={s.event}>{finished ? { victory: 'Victory', defeat: 'Defeat', draw: 'Draw' }[battle.outcome] : frame === 0 ? 'Spells locked · Duel begins' : current.messages.join('\n')}</Text></View>
          </View>
          <PlayerHotbar fighter={current.player} equipment={session.equipment} compact={compact} />
        </View>
        <View style={[s.panel, s.queue, { width: compact ? Math.min(180, width * .26) : 255 }]}>
          <Text style={s.queueTitle}>Your spell queue</Text>
          <View style={{ flex: 1, minHeight: 0, gap: 3 }}>{current.player.spells.map((id, index) => {
            const isActive = index === activeIndex;
            const label = finished ? 'Complete' : isActive ? (current.player.casting ? 'Casting · '+current.player.casting.remaining+'T' : skipped ? 'Skipped · no mana' : 'Cast') : index === nextIndex ? 'Next' : 'Queued';
            return <View key={index} accessibilityLabel={`Slot ${index + 1}: ${SPELLS[id].name}, ${label}`} style={[s.queueRow, isActive && !finished && s.activeRow]}><Text style={s.order}>{index + 1}</Text><SpellIcon id={id} size={compact?22:32} /><View style={{ flex: 1 }}><Text numberOfLines={1} adjustsFontSizeToFit style={[s.spellName, { fontSize: compact ? (current.player.spells.length > 6 ? 9 : 11) : 15 }]}>{SPELLS[id].name}</Text>{(!compact || current.player.spells.length <= 6) && <Text numberOfLines={1} style={s.queueState}>{label}</Text>}</View></View>;
          })}</View>
          {finished && <Control label="Return to shop →" disabled={busy} selected onPress={() => act({ type: 'next' })} />}
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
  gear: { flexDirection: 'row', gap: 5 }, gearSlot: { flex: 1, borderWidth: 1, borderColor: '#9c7949', borderRadius: 3, alignItems: 'center', justifyContent: 'center', backgroundColor: '#211911' }, gearIcon: { color: '#c9b48c', fontSize: 22 }, label: { color: '#d7c399', fontSize: 9, textAlign: 'center' },
  round: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 }, roundText: { color: '#ecdbb7', fontWeight: '600' }, menu: { color: '#afc1cd', fontSize: 10, padding: 3 },
  timeline: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 10, borderWidth: 1, borderColor: '#957344', borderRadius: 5, backgroundColor: '#20170ee8' }, controls: { flexDirection: 'row', gap: 3 }, control: { minHeight: 30, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 9, borderWidth: 1, borderColor: '#9c8055', borderRadius: 4, backgroundColor: '#30261a' }, selected: { backgroundColor: '#31452b', borderColor: '#c1a56a' }, dots: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', height: 12 }, dot: { width: 8, height: 8, borderRadius: 8, borderWidth: 1, borderColor: '#7d91a2' }, dotPast: { backgroundColor: '#718291' }, dotCurrent: { backgroundColor: '#a4dbed', borderColor: '#d5f6ff', width: 12, height: 12 },
  field: { flex: 1, minHeight: 0, flexDirection: 'row', gap: 8 }, leftField: { flex: 1, minWidth: 0, gap: 7 }, arena: { flex: 1, minHeight: 0, overflow: 'hidden', backgroundColor: 'transparent', borderRadius: 7 }, bottom: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  ring: { position: 'absolute', bottom: '-20%', left: '5%', width: '90%', height: '70%', borderWidth: 2, borderColor: '#39495a', borderRadius: 300 }, innerRing: { position: 'absolute', bottom: '-7%', left: '20%', width: '60%', height: '45%', borderWidth: 1, borderColor: '#425469', borderRadius: 300 }, arenaRune: { position: 'absolute', left: '45%', bottom: '5%', color: '#405168', fontSize: 60 }, mage: { position: 'absolute', alignItems: 'center' }, mageName: { color: '#b7c7d2', fontSize: 9 }, miniTrack: { height: 5, width: '60%', backgroundColor: '#293640', marginTop: 3, overflow: 'hidden', borderRadius: 2 }, platform: { width: '100%', height: 10, borderWidth: 1, borderRadius: 30, backgroundColor: '#344352' }, beatNotice: { position: 'absolute', left: '28%', right: '28%', top: '32%', alignItems: 'center' }, event: { backgroundColor: '#140e0caa', padding: 4, borderRadius: 4, color: '#d9c8a6', fontSize: 10, textAlign: 'center' },
  queue: { justifyContent: 'flex-start', minHeight: 0, gap: 5 }, queueTitle: { color: '#ece0cc', fontSize: 13, fontWeight: '600' }, queueRow: { flex: 1, minHeight: 0, maxHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 5, borderWidth: 1, borderColor: '#755c3c', borderRadius: 3, backgroundColor: '#261d14e8' }, activeRow: { borderColor: '#ebcd89', backgroundColor: '#4a3b23' }, order: { color: '#bdc9d4', fontSize: 10 }, spellGlyph: { color: '#d5bd8d' }, spellName: { color: '#e5e4dc' }, queueState: { color: '#cfb87e', fontSize: 8 }, error: { color: '#ffb7a7', fontSize: 11 },
});


