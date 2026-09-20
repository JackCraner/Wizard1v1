import { CompactShop } from './CompactShop';
import { useState } from 'react';
import { Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { RULES, SPELLS } from '../game/engine';
import { EQUIPMENT } from '../game/shop';
import type { Command, EquipmentId, Session, SpellId } from '../game/model';

const serif = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' });
const visual: Record<SpellId, { color: string; symbol: string; school: string }> = {
  fireball: { color: '#eb8053', symbol: '♨', school: 'FIRE' },
  spark: { color: '#e4bf69', symbol: 'ϟ', school: 'LIGHTNING' },
  ward: { color: '#8fcb8b', symbol: '◇', school: 'NATURE' },
  bolt: { color: '#89cce5', symbol: '↯', school: 'AETHER' },
  drain: { color: '#be91e7', symbol: '◎', school: 'AFFLICTION' },
  mend: { color: '#e4d69a', symbol: '✧', school: 'HOLY' },
};
type Selection = { kind: 'shop'; id: SpellId } | { kind: 'hand'; index: number } | { kind: 'equipment'; id: EquipmentId };

function Action({ label, onPress, disabled, green, small }: { label: string; onPress: () => void; disabled?: boolean; green?: boolean; small?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: !!disabled }}
    disabled={disabled} onPress={onPress} style={({ pressed }) => [s.action, green && s.green, small && { paddingHorizontal: 12 }, disabled && s.disabled, pressed && s.pressed]}>
    <Text style={[s.actionText, small && { fontSize: 13 }]}>{label}</Text>
  </Pressable>;
}

function SpellFace({ id, small = false }: { id: SpellId; small?: boolean }) {
  const v = visual[id];
  const [faceWidth, setFaceWidth] = useState(70);
  const scale = small ? Math.min(1.4, faceWidth / 70) : 1;
  const frames = {
    fireball: require('../../assets/Fire_Border.png'),
    ward: require('../../assets/Nature_Border.png'),
    bolt: require('../../assets/Water_Border.png'),
    drain: require('../../assets/Affliction_Border.png'),
    spark: require('../../assets/Holy_Border.png'),
    mend: require('../../assets/Holy_Border.png'),
  };
  return <View onLayout={e => setFaceWidth(e.nativeEvent.layout.width)} style={{ flex: 1, overflow: 'hidden' }}>
    <Image source={frames[id]} resizeMode="stretch" accessible={false} style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} />
    <Text style={{ position: 'absolute', top: '7%', left: '8%', width: '13%', textAlign: 'center', color: '#fff0c9', fontSize: small ? 7 * scale : 11 }}>{SPELLS[id].mana}</Text>
    <View style={{ position: 'absolute', top: '19%', height: '28%', left: '20%', right: '12%', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: v.color, fontSize: small ? 24 * scale : 48 }}>{v.symbol}</Text></View>
    <View style={{ position: 'absolute', top: '51%', height: '8%', left: '9%', right: '9%', justifyContent: 'center' }}><Text numberOfLines={1} adjustsFontSizeToFit style={{ color: '#f3e2bb', fontFamily: serif, fontSize: small ? 9 * scale : 14, textAlign: 'center' }}>{SPELLS[id].name}</Text></View>
    <View style={{ position: 'absolute', top: '66%', bottom: '12%', left: '11%', right: '11%', justifyContent: 'center' }}><Text numberOfLines={small ? 2 : 4} adjustsFontSizeToFit style={{ color: '#352316', fontSize: small ? 7 * scale : 11, textAlign: 'center' }}>{small ? v.school : SPELLS[id].description}</Text></View>
  </View>;
}

export function ShopScreen({ session, busy, act, onMenu, error }: {
  session: Session; busy: boolean; act: (command: Command) => void; onMenu: () => void; error?: string;
}) {
  const [selection, setSelection] = useState<Selection | null>(null);
  const selectedSpell = selection?.kind === 'shop' ? selection.id : selection?.kind === 'hand' ? session.spells[selection.index] : undefined;
  const selectedItem = selection?.kind === 'equipment' ? EQUIPMENT[selection.id] : undefined;
  const inspect = (next: Selection) => setSelection(next);

  return <View style={{ flex: 1 }}>
    <CompactShop session={session} busy={busy} act={act} onMenu={onMenu} error={error}
      inspectSpell={id => inspect({kind: 'shop', id})} inspectItem={id => inspect({kind: 'equipment', id})}
      inspectHand={index => inspect({kind: 'hand', index})} renderCard={(id, expanded) => <SpellFace id={id} small={!expanded} />} />
    <Modal visible={!!selection} transparent animationType="fade" onRequestClose={() => setSelection(null)}>
      <View style={s.modalShade}><View accessibilityViewIsModal style={s.modalPanel}>
        <ScrollView contentContainerStyle={{ gap: 16 }}>
          {selectedSpell && <><View style={{ height: 205, width: 145, alignSelf: 'center' }}><SpellFace id={selectedSpell} /></View>
            <Text style={s.modalTitle}>{SPELLS[selectedSpell].name}</Text><Text style={s.modalBody}>{SPELLS[selectedSpell].description}</Text><Text style={s.caption}>{SPELLS[selectedSpell].mana} mana each cast</Text>
            {selection?.kind === 'shop' ? <><Action green label={`Buy ${SPELLS[selectedSpell].name} · ${SPELLS[selectedSpell].price} gold`} disabled={busy || session.gold < SPELLS[selectedSpell].price || session.spells.length >= RULES.slots}
              onPress={() => { act({ type: 'buy', spell: selectedSpell }); setSelection(null); }} />
              {(session.gold < SPELLS[selectedSpell].price || session.spells.length >= RULES.slots) && <Text style={s.caption}>{session.spells.length >= RULES.slots ? 'Your hand is full.' : 'Not enough gold.'}</Text>}</>
              : selection?.kind === 'hand' && <><Text style={s.caption}>Casting position {selection.index + 1} of {session.spells.length}</Text><View style={s.modalMoves}>
                <View style={{ flex: 1 }}><Action label="← Earlier" disabled={busy || selection.index === 0} onPress={() => { act({ type: 'move', from: selection.index, to: selection.index - 1 }); setSelection(null); }} /></View>
                <View style={{ flex: 1 }}><Action label="Later →" disabled={busy || selection.index === session.spells.length - 1} onPress={() => { act({ type: 'move', from: selection.index, to: selection.index + 1 }); setSelection(null); }} /></View>
              </View></>}
          </>}
          {selectedItem && <><Text style={s.largeItem}>{selectedItem.symbol}</Text><Text style={s.modalTitle}>{selectedItem.name}</Text><Text style={s.modalBody}>{selectedItem.description}</Text><Text style={s.caption}>Equips to your {selectedItem.slot} slot. Applies to every duel.</Text>
            <Action green label={session.equipment[selectedItem.slot] ? 'Already equipped' : `Buy ${selectedItem.name} · ${selectedItem.price} gold`}
              disabled={busy || !!session.equipment[selectedItem.slot] || session.gold < selectedItem.price}
              onPress={() => { act({ type: 'buyEquipment', item: selectedItem.id }); setSelection(null); }} />
            {session.gold < selectedItem.price && !session.equipment[selectedItem.slot] && <Text style={s.caption}>Not enough gold.</Text>}
          </>}
          <Action label="Close" onPress={() => setSelection(null)} />
        </ScrollView>
      </View></View>
    </Modal>
  </View>;
}

const s = StyleSheet.create({
  caption: { color: '#baa98b', fontSize: 11, lineHeight: 17, textAlign: 'center' },
  action: { minHeight: 44, backgroundColor: '#252924', borderWidth: 1, borderColor: '#ae8e56', borderRadius: 4, paddingHorizontal: 17, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  green: { backgroundColor: '#214a35', borderColor: '#c9a35b', minHeight: 54 },
  actionText: { color: '#f2e5c9', fontFamily: serif, fontSize: 17 },
  disabled: { opacity: .4 },
  pressed: { opacity: .8, transform: [{ scale: .98 }] },
  modalShade: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,.78)' },
  modalPanel: { width: '100%', maxWidth: 370, maxHeight: '90%', padding: 24, backgroundColor: '#211a13', borderWidth: 2, borderColor: '#ae8b50', borderRadius: 8 },
  modalTitle: { color: '#f1dfb6', fontFamily: serif, fontSize: 25, textAlign: 'center' },
  modalBody: { color: '#d8c7aa', fontSize: 14, lineHeight: 22, textAlign: 'center' },
  modalMoves: { flexDirection: 'row', gap: 10 },
  largeItem: { color: '#ddbd7b', fontSize: 70, textAlign: 'center' },
});
