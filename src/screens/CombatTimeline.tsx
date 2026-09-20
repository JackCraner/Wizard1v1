import { useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Battle, SpellId } from '../game/model';
import { SPELLS } from '../game/engine';
import { castAt } from '../game/combatTimeline';

const icons: Record<SpellId, { glyph: string; color: string }> = {
  spark: { glyph: 'ϟ', color: '#efcb64' }, fireball: { glyph: '♨', color: '#f68a57' },
  ward: { glyph: '◇', color: '#9ad894' }, bolt: { glyph: '↯', color: '#88d6ef' },
  drain: { glyph: '◎', color: '#cc9cf2' }, mend: { glyph: '✧', color: '#eee2b1' },
};
export function CombatTimeline({ battle, frame, compact, controls }: { battle: Battle; frame: number; compact: boolean; controls: ReactNode }) {
  const [inspected, setInspected] = useState<number | null>(null);
  const [history, setHistory] = useState(false);
  const page = history ? 0 : Math.floor(Math.max(0, frame - 1) / 30);
  const start = page * 30 + 1;
  const last = battle.frames.length - 1;
  const cellHeight = compact ? 17 : 25;
  return <View style={s.panel}>
    <View style={s.header}><View style={{ flex: 1 }}><Text style={s.title}>COMBAT TIMELINE <Text style={s.sub}>· TICK {frame}</Text></Text><Text style={s.legend}>Ticks {start}–{start + 29} · × skipped · Tap a tick to inspect</Text></View>
      {frame > 30 && <Pressable accessibilityRole="button" onPress={() => setHistory(!history)} style={s.pageButton}><Text style={s.sub}>{history ? '31–60 →' : '← 1–30'}</Text></Pressable>}{controls}
    </View>
    <View style={s.tracks}>
      <View style={s.labels}><Text style={[s.rowLabel, { height: 12 }]}>TICK</Text><Text style={[s.rowLabel, { height: cellHeight, color: '#95cede' }]}>YOU</Text><Text style={[s.rowLabel, { height: cellHeight, color: '#e3a597' }]}>FOE</Text></View>
      {Array.from({ length: 30 }, (_, i) => {
        const tick = start + i;
        const revealed = tick <= frame && tick <= last;
        const current = tick === frame;
        const events = (['player', 'bot'] as const).map(side => castAt(battle, tick, side, frame));
        const description = events.map((event, index) => `${index ? 'Opponent' : 'You'}: ${event ? `${SPELLS[event.spell].name}${event.skipped ? ', skipped for insufficient mana' : ', cast'}` : 'no cast'}`).join('. ');
        return <Pressable key={tick} accessibilityRole="button" disabled={!revealed} accessibilityLabel={`Tick ${tick}${current ? ', current' : ''}. ${revealed ? description : 'Not played'}`} onPress={() => setInspected(tick)} style={[s.column, (i + 1) % 5 === 0 && s.groupEdge, current && s.current]}>
          <Text style={[s.tick, current && { color: '#ffe2a1' }]}>{i === 0 || tick % 5 === 0 || current ? tick : '·'}</Text>
          {events.map((event, row) => <View key={row} style={[s.cell, { height: cellHeight }, row === 0 && s.playerCell]}>
            <Text style={{ fontSize: compact ? 12 : 19, lineHeight: cellHeight, color: event ? icons[event.spell].color : '#645541', opacity: event?.skipped ? .3 : 1 }}>{event ? icons[event.spell].glyph : revealed ? '–' : '·'}</Text>
            {event?.skipped && <Text style={s.skip}>×</Text>}
          </View>)}
        </Pressable>;
      })}
    </View>
    <Modal visible={inspected !== null} transparent animationType="fade" onRequestClose={() => setInspected(null)}>
      <View style={s.shade}><View accessibilityViewIsModal style={s.detail}>
        <Text style={s.detailTitle}>Tick {inspected} · Simultaneous casts</Text>
        {inspected !== null && (['player', 'bot'] as const).map(side => {
          const event = castAt(battle, inspected, side, frame);
          return <View key={side} style={s.detailRow}><Text style={{ color: event ? icons[event.spell].color : '#99846a', fontSize: 30 }}>{event ? icons[event.spell].glyph : '–'}</Text><View style={{ flex: 1 }}><Text style={s.detailName}>{side === 'player' ? 'You' : 'Opponent'} · {event ? SPELLS[event.spell].name : 'No spell'}</Text><Text style={s.detailText}>{event ? event.skipped ? 'Skipped — insufficient mana' : `Cast · ${SPELLS[event.spell].mana} mana` : 'No cast this tick'}</Text></View></View>;
        })}
        <Pressable accessibilityRole="button" onPress={() => setInspected(null)} style={s.close}><Text style={s.detailName}>Close</Text></Pressable>
      </View></View>
    </Modal>
  </View>;
}
const s = StyleSheet.create({
  panel: { borderWidth: 1, borderColor: '#957344', borderRadius: 5, backgroundColor: '#20170ef0', paddingHorizontal: 7, paddingVertical: 4, gap: 3 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 }, title: { color: '#e9d3a6', fontSize: 10, fontWeight: '600' }, sub: { color: '#bca989', fontSize: 9 }, legend: { color: '#a89576', fontSize: 8, marginTop: 2 }, pageButton: { padding: 5 },
  tracks: { flexDirection: 'row' }, labels: { width: 32 }, rowLabel: { fontSize: 8, color: '#a08e71', textAlignVertical: 'center' }, column: { flex: 1, minWidth: 0, borderRightWidth: 1, borderRightColor: '#7b603122' }, groupEdge: { borderRightColor: '#b4975966' }, current: { backgroundColor: '#6d572955', borderWidth: 1, borderColor: '#e2bf70' },
  tick: { fontSize: 8, color: '#b09a76', height: 12, textAlign: 'center' }, cell: { alignItems: 'center', justifyContent: 'center' }, playerCell: { backgroundColor: '#49778718', borderBottomWidth: 1, borderBottomColor: '#9a805033' }, skip: { position: 'absolute', right: 0, bottom: 0, color: '#dfa492', fontSize: 10 },
  shade: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000b', padding: 20 }, detail: { width: '100%', maxWidth: 390, padding: 18, borderWidth: 1, borderColor: '#b4955c', borderRadius: 7, backgroundColor: '#21190f', gap: 14 }, detailTitle: { color: '#efd8a9', fontSize: 17 }, detailRow: { flexDirection: 'row', gap: 14, alignItems: 'center' }, detailName: { color: '#eee0c6', fontSize: 14 }, detailText: { color: '#c3ad87', fontSize: 12, marginTop: 4 }, close: { minHeight: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: '#3b3422', borderWidth: 1, borderColor: '#a58a55', borderRadius: 4 },
});
