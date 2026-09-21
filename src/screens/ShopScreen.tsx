import { SpellCard, KeywordBoxes, RulesText, CardPreview } from '../components/cards/SpellCard';
import { CARD_BY_ID, manaLabel, castLabel } from '../config/catalogue';
import { CompactShop } from './CompactShop';
import { useState } from 'react';
import { Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { canAddSpell, channelPower, RULES, SPELLS } from '../game/engine';
import { EQUIPMENT } from '../game/shop';
import type { Command, EquipmentId, Session, SpellId } from '../game/model';

const serif = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' });
type Selection = { kind: 'shop'; id: SpellId } | { kind: 'hand'; index: number } | { kind: 'equipment'; id: EquipmentId };

function Action({ label, onPress, disabled, green, small }: { label: string; onPress: () => void; disabled?: boolean; green?: boolean; small?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: !!disabled }}
    disabled={disabled} onPress={onPress} style={({ pressed }) => [s.action, green && s.green, small && { paddingHorizontal: 12 }, disabled && s.disabled, pressed && s.pressed]}>
    <Text style={[s.actionText, small && { fontSize: 13 }]}>{label}</Text>
  </Pressable>;
}

function SpellFace({ id, small = false }: { id: SpellId; small?: boolean }) {
  return <SpellCard {...CARD_BY_ID[id]} compact={small} />;
}

export function ShopScreen({ session, busy, act, onMenu, onLibrary, error }: {
  session: Session; busy: boolean; act: (command: Command) => void; onMenu: () => void; onLibrary: () => void; error?: string;
}) {
  const [selection, setSelection] = useState<Selection | null>(null);
  const selectedSpell = selection?.kind === 'shop' ? selection.id : selection?.kind === 'hand' ? session.spells[selection.index] : undefined;
  const domainBlocked = !!selectedSpell && !canAddSpell(session.spells, selectedSpell);
  const selectedItem = selection?.kind === 'equipment' ? EQUIPMENT[selection.id] : undefined;
  const inspect = (next: Selection) => setSelection(next);

  return <View style={{ flex: 1 }}>
    <CompactShop session={session} busy={busy} act={act} onMenu={onMenu} onLibrary={onLibrary} error={error}
      inspectSpell={id => inspect({kind: 'shop', id})} inspectItem={id => inspect({kind: 'equipment', id})}
      inspectHand={index => inspect({kind: 'hand', index})} renderCard={(id, expanded) => <SpellFace id={id} small={!expanded} />} renderPreview={(id, height, width) => <CardPreview card={CARD_BY_ID[id]} height={height} width={width} />} />
    <Modal visible={!!selection} transparent animationType="fade" onRequestClose={() => setSelection(null)}>
      <View style={s.modalShade}><View accessibilityViewIsModal style={s.modalPanel}>
        <ScrollView contentContainerStyle={{ gap: 16 }}>
          {selectedSpell && <><View style={{ height: 205, width: 145, alignSelf: 'center' }}><SpellFace id={selectedSpell} /></View>
            <Text style={s.modalTitle}>{SPELLS[selectedSpell].name}</Text><RulesText rules={CARD_BY_ID[selectedSpell].rules} keywords={CARD_BY_ID[selectedSpell].keywords} color="#d8c7aa" /><KeywordBoxes keywords={CARD_BY_ID[selectedSpell].keywords} /><Text style={s.caption}>{manaLabel(SPELLS[selectedSpell].mana)} mana · {castLabel(SPELLS[selectedSpell].castTicks)}</Text>
            {selection?.kind === 'shop' ? <><Action green label={`Buy ${SPELLS[selectedSpell].name} · ${SPELLS[selectedSpell].price} gold`} disabled={busy || domainBlocked || session.gold < SPELLS[selectedSpell].price || session.spells.length >= RULES.slots}
              onPress={() => { act({ type: 'buy', spell: selectedSpell }); setSelection(null); }} />
              {(domainBlocked || session.gold < SPELLS[selectedSpell].price || session.spells.length >= RULES.slots) && <Text style={s.caption}>{domainBlocked ? 'Your deck can contain at most 2 domains.' : session.spells.length >= RULES.slots ? 'Your hand is full.' : 'Not enough gold.'}</Text>}</>
              : selection?.kind === 'hand' && <><Text style={s.caption}>Casting position {selection.index + 1} of {session.spells.length}</Text><Action label="Trash spell · no refund" disabled={busy} onPress={() => { act({type:'trash',index:selection.index}); setSelection(null); }} />{SPELLS[selectedSpell].keywords.includes('channel') && <Text style={s.caption}>Channel X = {channelPower(session.spells, selection.index)}</Text>}<View style={s.modalMoves}>
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
