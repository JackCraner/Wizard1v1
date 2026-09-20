import { useState, type ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RULES, SPELLS, deriveStats } from '../game/engine';
import { EQUIPMENT, EQUIPMENT_SLOTS, equipmentModifiers } from '../game/shop';
import type { Command, EquipmentId, Session, SpellId } from '../game/model';
import { DraggableHand } from './DraggableHand';

export function CompactShop({ session, busy, act, onMenu, error, inspectSpell, inspectItem, inspectHand, renderCard }: {
  session: Session; busy: boolean; act: (command: Command) => void; onMenu: () => void; error?: string;
  inspectSpell: (id: SpellId) => void; inspectItem: (id: EquipmentId) => void; inspectHand: (index: number) => void;
  renderCard: (id: SpellId, expanded?: boolean) => ReactNode;
}) {
  const [size, setSize] = useState({ width: 800, height: 360 });
  const [, setDragging] = useState(false);
  const compact = size.height < 500;
  const stats = deriveStats(equipmentModifiers(session.equipment));
  const handHeight = Math.max(62, Math.min(145, size.height * .23));
  return <View style={s.root}>
    <Image accessible={false} source={require('../../assets/MainBackground.png')} resizeMode="cover" style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} />
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#100a08aa' }]} />
    <SafeAreaView style={{ flex: 1 }}>
      <View onLayout={e => setSize(e.nativeEvent.layout)} style={[s.page, { gap: compact ? 5 : 12, padding: compact ? 7 : 16 }]}>
        <View style={s.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Main menu" onPress={onMenu} style={s.menu}><Text style={s.text}>‹ Menu</Text></Pressable>
          <Text accessibilityRole="header" style={[s.title, { fontSize: compact ? 17 : 26 }]}>SHOP · ROUND {session.round}</Text>
          <View style={s.headerRight}><Text accessibilityLabel={`${session.gold} gold`} style={s.gold}>◉ {session.gold}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Reroll for 1 gold" disabled={busy || session.gold < 1} onPress={() => act({ type: 'reroll' })} style={[s.menu, (busy || session.gold < 1) && s.disabled]}><Text style={s.text}>⟳ Reroll (1)</Text></Pressable>
          </View>
        </View>
        <View style={[s.middle, { gap: compact ? 7 : 14 }]}>
          <View style={[s.player, { width: compact ? 150 : 220, padding: compact ? 8 : 16, gap: compact ? 7 : 14 }]}>
            <View style={s.playerTop}><Text style={[s.avatar, { fontSize: compact ? 30 : 48 }]}>♙</Text><View style={{ flex: 1, gap: 5 }}>
              <Text style={s.text}>Apprentice</Text>
              <Text accessibilityLabel={`Health ${stats.health} of ${stats.health}`} style={[s.bar, { backgroundColor: '#882e2c' }]}>♥ {stats.health}/{stats.health}</Text>
              <Text accessibilityLabel={`Mana ${stats.mana} of ${stats.mana}`} style={[s.bar, { backgroundColor: '#275d7e' }]}>◈ {stats.mana}/{stats.mana}</Text>
            </View></View>
            <Text style={s.label}>YOUR EQUIPMENT</Text>
            <View style={s.slots}>{EQUIPMENT_SLOTS.map(slot => {
              const id = session.equipment[slot];
              return <View key={slot} style={{ flex: 1, gap: 4 }}><Pressable accessibilityRole={id ? 'button' : undefined} accessibilityLabel={id ? `Equipped ${EQUIPMENT[id].name}` : `Empty ${slot} slot`} disabled={!id} onPress={() => id && inspectItem(id)} style={[s.slot, { height: compact ? 32 : 50 }]}><Text style={s.slotSymbol}>{id ? EQUIPMENT[id].symbol : '+'}</Text></Pressable><Text numberOfLines={1} adjustsFontSizeToFit style={s.slotName}>{slot}</Text></View>;
            })}</View>
            {!compact && <Text style={s.hint}>Build your strategy. Let your spells do the fighting.</Text>}
          </View>
          <View style={[s.board, { padding: compact ? 6 : 12, gap: compact ? 3 : 8 }]}>
            <Text style={s.label}>SPELL SHOP</Text>
            <View style={s.offers}>{session.shop.map(id => <Pressable key={id} accessibilityRole="button" accessibilityLabel={`Inspect ${SPELLS[id].name}, ${SPELLS[id].price} gold`} onPress={() => inspectSpell(id)} style={({ pressed }) => [s.offer, pressed && s.pressed]}>
              <View style={s.cardSpace}><View style={s.card}>{renderCard(id)}</View></View>
              <Text style={s.cost}>◉ {SPELLS[id].price}</Text>
            </Pressable>)}</View>
            <Text style={s.label}>EQUIPMENT SHOP</Text>
            <View style={[s.equipment, { height: compact ? 43 : 76 }]}>{session.equipmentShop.map(id => {
              const item = EQUIPMENT[id];
              return <Pressable key={id} accessibilityRole="button" accessibilityLabel={`Inspect ${item.name}, ${item.price} gold`} onPress={() => inspectItem(id)} style={s.item}>
                <Text style={s.itemSymbol}>{item.symbol}</Text><View style={{ flex: 1 }}><Text numberOfLines={1} adjustsFontSizeToFit style={s.itemName}>{item.name}</Text><Text numberOfLines={1} adjustsFontSizeToFit style={s.itemInfo}>{item.description}</Text></View><Text style={s.cost}>{session.equipment[item.slot] ? '✓' : `◉ ${item.price}`}</Text>
              </Pressable>;
            })}</View>
          </View>
        </View>
        <View style={s.dock}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={s.handLabel}>YOUR HAND ({session.spells.length}/{RULES.slots}) · Hold to enlarge · Drag to reorder</Text>
            <DraggableHand height={handHeight} spells={session.spells} disabled={busy} renderCard={renderCard} onInspect={inspectHand} onMove={(from,to) => act({ type: 'move', from, to })} onDragging={setDragging} />
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Next round" disabled={busy} onPress={() => act({ type: 'fight' })} style={[s.next, { width: compact ? 135 : 210 }, busy && s.disabled]}><Text style={[s.title, { fontSize: compact ? 17 : 23 }]}>Next round →</Text></Pressable>
        </View>
        {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
      </View>
    </SafeAreaView>
  </View>;
}
const s = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden', backgroundColor: '#18110b' }, page: { flex: 1, minHeight: 0, width: '100%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, height: 40 }, headerRight: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  menu: { paddingHorizontal: 12, minHeight: 36, justifyContent: 'center', backgroundColor: '#1b201c', borderWidth: 1, borderColor: '#987844', borderRadius: 4 }, text: { color: '#ecdcb9', fontSize: 12 }, title: { color: '#f0dfb2', fontWeight: '600' }, gold: { color: '#eed090', fontSize: 21 },
  middle: { flex: 1, minHeight: 0, flexDirection: 'row' }, player: { borderWidth: 1, borderColor: '#a5834f', borderRadius: 5, backgroundColor: '#17120eea', alignSelf: 'flex-start' }, playerTop: { flexDirection: 'row', gap: 7, alignItems: 'center' }, avatar: { color: '#d5bc85' }, bar: { color: '#fff2dd', fontSize: 10, textAlign: 'center', borderRadius: 3, paddingVertical: 2 },
  label: { color: '#ccb68d', fontSize: 9, textAlign: 'center', letterSpacing: 1, lineHeight: 12 }, slots: { flexDirection: 'row', gap: 4 }, slot: { borderWidth: 1, borderColor: '#79613c', backgroundColor: '#11120f', alignItems: 'center', justifyContent: 'center' }, slotSymbol: { color: '#c6ab76', fontSize: 23 }, slotName: { color: '#b8a88a', fontSize: 8, textAlign: 'center', textTransform: 'capitalize' }, hint: { color: '#a49171', fontSize: 13, lineHeight: 22 },
  board: { flex: 1, minWidth: 0, minHeight: 0, borderWidth: 2, borderColor: '#a68144', borderRadius: 5, backgroundColor: '#26180fee' }, offers: { flex: 1, minHeight: 0, flexDirection: 'row', gap: 8 }, offer: { flex: 1, minWidth: 0, alignItems: 'center' }, cardSpace: { flex: 1, minHeight: 0, width: '100%', alignItems: 'center' }, card: { height: '100%', aspectRatio: 2 / 3, maxWidth: '100%' }, cost: { color: '#efd08a', fontSize: 12, textAlign: 'center', paddingVertical: 2 }, equipment: { flexDirection: 'row', gap: 8 }, item: { flex: 1, minWidth: 0, borderWidth: 1, borderColor: '#80653c', backgroundColor: '#14120f', paddingHorizontal: 7, flexDirection: 'row', alignItems: 'center', gap: 7 }, itemSymbol: { color: '#d2b478', fontSize: 24 }, itemName: { color: '#e8d8b5', fontSize: 11 }, itemInfo: { color: '#b6a485', fontSize: 9, paddingTop: 3 },
  dock: { zIndex: 10, overflow: 'visible', flexDirection: 'row', gap: 12, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#a38451', backgroundColor: '#120e0abf', paddingTop: 3 }, handLabel: { color: '#d9c7a2', fontSize: 10, textAlign: 'center', lineHeight: 14 }, next: { minHeight: 44, padding: 10, borderWidth: 1, borderColor: '#c7a060', backgroundColor: '#214e37', borderRadius: 4, alignItems: 'center', justifyContent: 'center' }, disabled: { opacity: .4 }, pressed: { opacity: .75 }, error: { position: 'absolute', bottom: 5, left: 10, right: 10, backgroundColor: '#492318', color: '#ffd4b7', padding: 8 },
});
