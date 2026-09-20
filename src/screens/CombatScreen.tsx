import { combatArt, OrnateMeter, PlayerHotbar, PortraitArt } from './CombatAssets';
import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { useGame } from '../useGame';
import type { Fighter, Session, SpellId } from '../game/model';
import { SPELLS } from '../game/engine';
import { EQUIPMENT, EQUIPMENT_SLOTS } from '../game/shop';

const glyph: Record<SpellId, string> = { spark: 'ϟ', fireball: '♨', ward: '◇', bolt: '↯', drain: '◎', mend: '✧' };
function Control({ label, onPress, selected, disabled }: { label: string; onPress: () => void; selected?: boolean; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected, disabled }} disabled={disabled} onPress={onPress} style={[s.control, selected && s.selected, disabled && { opacity: .4 }]}><Text style={s.text}>{label}</Text></Pressable>;
}
function Gear({ equipment = {}, compact }: { equipment?: Session['equipment']; compact: boolean }) {
  return <View style={s.gear}>{EQUIPMENT_SLOTS.map(slot => { const id = equipment[slot]; return <View key={slot} accessibilityLabel={`${slot}: ${id ? EQUIPMENT[id].name : 'empty'}`} style={[s.gearSlot, { height: compact ? 26 : 40 }]}><Text style={s.gearIcon}>{id ? EQUIPMENT[id].symbol : '·'}</Text></View>; })}</View>;
}
function Status({ fighter, title, compact }: { fighter: Fighter; title: string; compact: boolean }) {
  return <View style={s.status}><View style={[s.portrait, { width: compact ? 36 : 62, height: compact ? 36 : 62 }]}><PortraitArt /></View><View style={{ flex: 1, gap: 3 }}><View style={s.statusHeading}><Text numberOfLines={1} style={s.name}>{title}</Text><Text style={s.muted}>◇ {fighter.shield} shield</Text></View><OrnateMeter value={fighter.health} max={fighter.maxHealth} /><OrnateMeter value={fighter.mana} max={fighter.maxMana} mana /></View></View>;
}
function Mage({ fighter, opponent, compact }: { fighter: Fighter; opponent?: boolean; compact: boolean }) {
  return <View style={[s.mage, opponent ? { right: '10%', top: '2%' } : { left: '7%', bottom: '1%' }, { width: compact ? 105 : 190, height: '88%' }]}>
    <Text numberOfLines={1} style={s.mageName}>{opponent ? fighter.name : 'You'}</Text>
    <View style={{ width: '80%' }}><OrnateMeter value={fighter.health} max={fighter.maxHealth} /></View>
    <View style={{ flex: 1, width: '100%', overflow: 'hidden' }}><Image source={combatArt.pose} accessible={false} resizeMode="contain" style={{ position: 'absolute', width: '180%', height: '117%', left: '-40%', top: '-9%', transform: [{ scaleX: opponent ? -1 : 1 }], opacity: fighter.health > 0 ? 1 : .4 }} /></View>
  </View>;
}

export function CombatScreen({ game }: { game: ReturnType<typeof useGame> }) {
  const { battle, session, frame, finished, speed, setSpeed, setFrame, act, busy } = game;
  const { height, width } = useWindowDimensions();
  const compact = height < 500;
  if (!battle || !session) return null;
  const current = battle.frames[frame];
  const previous = battle.frames[Math.max(0, frame - 1)];
  const activeIndex = frame > 0 ? (frame - 1) % current.player.spells.length : -1;
  const nextIndex = frame % current.player.spells.length;
  const skipped = activeIndex >= 0 && previous.player.mana < SPELLS[current.player.spells[activeIndex]].mana;
  const startTick = Math.max(0, Math.min(frame - 4, battle.frames.length - 9));
  const ticks = battle.frames.slice(startTick, startTick + 9);
  return <View style={s.root}>
    <Image accessible={false} source={combatArt.background} resizeMode="cover" style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} />
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#130e0928' }]} />
    <SafeAreaView style={{ flex: 1 }}>
    <View style={[s.page, { padding: compact ? 7 : 16, gap: compact ? 6 : 12 }]}>
      <View style={[s.top, { height: compact ? 72 : 108 }]}>
        <View style={[s.panel, { flex: 1.65 }]}><Status fighter={current.bot} title={current.bot.name} compact={compact} /></View>
        <View style={s.round}><Text style={[s.roundText, { fontSize: compact ? 18 : 28 }]}>Round {session.round}</Text><Text style={s.muted}>{finished ? 'Duel complete' : 'Combat phase'}</Text><Pressable accessibilityRole="button" onPress={() => game.setScreen('menu')}><Text style={s.menu}>‹ Menu</Text></Pressable></View>
        <View style={[s.panel, { flex: 1 }]}><Text style={s.label}>OPPONENT EQUIPMENT</Text><Gear compact={compact} /></View>
      </View>
      <View style={[s.timeline, { height: compact ? 45 : 62 }]}>
        <View style={{ flex: 1, gap: 4 }}><Text style={s.label}>COMBAT TIMELINE · BEAT {frame} · SIMULTANEOUS CASTS</Text><View style={s.dots}>{ticks.map(t => <View key={t.tick} accessibilityLabel={`Beat ${t.tick}${t.tick === frame ? ', current' : ''}`} style={[s.dot, t.tick <= frame && s.dotPast, t.tick === frame && s.dotCurrent]} />)}</View></View>
        <View style={s.controls}>{[1, 2, 4].map(value => <Control key={value} label={`${value}×`} selected={speed === value} onPress={() => setSpeed(value)} />)}<Control label="Skip" disabled={finished} onPress={() => setFrame(battle.frames.length - 1)} /></View>
      </View>
      <View style={s.field}>
        <View style={s.leftField}>
          <View style={s.arena}>
            
            <Mage fighter={current.player} compact={compact} /><Mage fighter={current.bot} opponent compact={compact} />
            <View style={s.beatNotice}><Text numberOfLines={2} style={s.event}>{finished ? { victory: 'Victory', defeat: 'Defeat', draw: 'Draw' }[battle.outcome] : frame === 0 ? 'Spells locked · Duel begins' : current.messages.join('\n')}</Text></View>
          </View>
          <PlayerHotbar fighter={current.player} equipment={session.equipment} compact={compact} />
        </View>
        <View style={[s.panel, s.queue, { width: compact ? Math.min(180, width * .26) : 255 }]}>
          <Text style={s.queueTitle}>Your spell queue</Text>
          <View style={{ flex: 1, minHeight: 0, gap: 3 }}>{current.player.spells.map((id, index) => {
            const isActive = index === activeIndex;
            const label = finished ? 'Complete' : isActive ? (skipped ? 'Skipped · no mana' : 'Casting') : index === nextIndex ? 'Next' : 'Queued';
            return <View key={index} accessibilityLabel={`Slot ${index + 1}: ${SPELLS[id].name}, ${label}`} style={[s.queueRow, isActive && !finished && s.activeRow]}><Text style={s.order}>{index + 1}</Text><Text style={[s.spellGlyph, { fontSize: compact ? 18 : 28 }]}>{glyph[id]}</Text><View style={{ flex: 1 }}><Text numberOfLines={1} adjustsFontSizeToFit style={[s.spellName, { fontSize: compact ? (current.player.spells.length > 6 ? 9 : 11) : 15 }]}>{SPELLS[id].name}</Text>{(!compact || current.player.spells.length <= 6) && <Text numberOfLines={1} style={s.queueState}>{label}</Text>}</View></View>;
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
  round: { flex: .9, alignItems: 'center', justifyContent: 'center', gap: 3 }, roundText: { color: '#ecdbb7', fontWeight: '600' }, menu: { color: '#afc1cd', fontSize: 10, padding: 3 },
  timeline: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 10, borderWidth: 1, borderColor: '#957344', borderRadius: 5, backgroundColor: '#20170ee8' }, controls: { flexDirection: 'row', gap: 3 }, control: { minHeight: 30, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 9, borderWidth: 1, borderColor: '#9c8055', borderRadius: 4, backgroundColor: '#30261a' }, selected: { backgroundColor: '#31452b', borderColor: '#c1a56a' }, dots: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', height: 12 }, dot: { width: 8, height: 8, borderRadius: 8, borderWidth: 1, borderColor: '#7d91a2' }, dotPast: { backgroundColor: '#718291' }, dotCurrent: { backgroundColor: '#a4dbed', borderColor: '#d5f6ff', width: 12, height: 12 },
  field: { flex: 1, minHeight: 0, flexDirection: 'row', gap: 8 }, leftField: { flex: 1, minWidth: 0, gap: 7 }, arena: { flex: 1, minHeight: 0, overflow: 'hidden', backgroundColor: 'transparent', borderRadius: 7 }, bottom: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  ring: { position: 'absolute', bottom: '-20%', left: '5%', width: '90%', height: '70%', borderWidth: 2, borderColor: '#39495a', borderRadius: 300 }, innerRing: { position: 'absolute', bottom: '-7%', left: '20%', width: '60%', height: '45%', borderWidth: 1, borderColor: '#425469', borderRadius: 300 }, arenaRune: { position: 'absolute', left: '45%', bottom: '5%', color: '#405168', fontSize: 60 }, mage: { position: 'absolute', alignItems: 'center' }, mageName: { color: '#b7c7d2', fontSize: 9 }, miniTrack: { height: 5, width: '60%', backgroundColor: '#293640', marginTop: 3, overflow: 'hidden', borderRadius: 2 }, platform: { width: '100%', height: 10, borderWidth: 1, borderRadius: 30, backgroundColor: '#344352' }, beatNotice: { position: 'absolute', left: '28%', right: '28%', top: '32%', alignItems: 'center' }, event: { backgroundColor: '#140e0caa', padding: 4, borderRadius: 4, color: '#d9c8a6', fontSize: 10, textAlign: 'center' },
  queue: { justifyContent: 'flex-start', minHeight: 0, gap: 5 }, queueTitle: { color: '#ece0cc', fontSize: 13, fontWeight: '600' }, queueRow: { flex: 1, minHeight: 0, maxHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 5, borderWidth: 1, borderColor: '#755c3c', borderRadius: 3, backgroundColor: '#261d14e8' }, activeRow: { borderColor: '#ebcd89', backgroundColor: '#4a3b23' }, order: { color: '#bdc9d4', fontSize: 10 }, spellGlyph: { color: '#d5bd8d' }, spellName: { color: '#e5e4dc' }, queueState: { color: '#cfb87e', fontSize: 8 }, error: { color: '#ffb7a7', fontSize: 11 },
});

