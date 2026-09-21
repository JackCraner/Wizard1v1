import { cardAt, canMerge, UPGRADE_XP } from '../game/upgrades';
import { Leaderboard } from './Leaderboard';
import { SpellCard, KeywordBoxes, RulesText, CardPreview } from '../components/cards/SpellCard';
import { CARD_BY_ID, manaLabel, castLabel } from '../config/catalogue';
import { CompactShop } from './CompactShop';
import { useState } from 'react';
import { Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { spellAddReason, canAddSpell, channelPower, RULES, SPELLS } from '../game/engine';
import { EQUIPMENT } from '../game/shop';
import type { Command, EquipmentId, Session, SpellId } from '../game/model';

const serif = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' });
type Selection = { kind: 'shop'; id: SpellId; shopSlot:number } | { kind: 'hand'; index: number } | { kind: 'equipment'; id: EquipmentId };

function Action({ label, onPress, disabled, green, small }: { label: string; onPress: () => void; disabled?: boolean; green?: boolean; small?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: !!disabled }}
    disabled={disabled} onPress={onPress} style={({ pressed }) => [s.action, green && s.green, small && { paddingHorizontal: 12 }, disabled && s.disabled, pressed && s.pressed]}>
    <Text style={[s.actionText, small && { fontSize: 13 }]}>{label}</Text>
  </Pressable>;
}

function SpellFace({ id, small = false, xp=0, shop=false }: { id: SpellId; small?: boolean; xp?:number; shop?:boolean }) {
  return <SpellCard {...cardAt(id,xp)} compact={small} shop={shop} />;
}

export function ShopScreen({ session, busy, act, onMenu, onLibrary, error }: {
  session: Session; busy: boolean; act: (command: Command) => void; onMenu: () => void; onLibrary: () => void; error?: string;
}) {
  const [leaderboard,setLeaderboard]=useState(false);
  const [selection, setSelection] = useState<Selection | null>(null);
  const selectedSpell = selection?.kind === 'shop' ? selection.id : selection?.kind === 'hand' ? session.spells[selection.index] : undefined;
  const selectedCard=selectedSpell?cardAt(selectedSpell,selection?.kind==='hand'?session.spellXp?.[selection.index]:0):undefined;
  const domainBlocked = !!selectedSpell && !canAddSpell(session.spells, selectedSpell);
  const selectedItem = selection?.kind === 'equipment' ? EQUIPMENT[selection.id] : undefined;
  const inspect = (next: Selection) => setSelection(next);

  return <View style={{ flex: 1 }}>
    <CompactShop session={session} busy={busy} act={act} onMenu={onMenu} onLibrary={onLibrary} onLeaderboard={()=>setLeaderboard(true)} error={error}
      inspectSpell={(id,shopSlot) => inspect({kind: 'shop', id,shopSlot})} inspectItem={id => inspect({kind: 'equipment', id})}
      inspectHand={index => inspect({kind: 'hand', index})} renderCard={(id, expanded,index) => <SpellFace id={id} shop={index===undefined} xp={index===undefined?0:session.spellXp?.[index]} small={!expanded} />} renderPreview={(id, height, width,index) => <CardPreview shop={index===undefined} card={cardAt(id,index===undefined?0:session.spellXp?.[index])} height={height} width={width} />} />
    <Leaderboard lobby={session.lobby} visible={leaderboard} onClose={()=>setLeaderboard(false)} />
    <Modal visible={!!selection} transparent animationType="fade" onRequestClose={() => setSelection(null)}>
      <View style={s.modalShade}><View accessibilityViewIsModal style={s.modalPanel}>
        {selectedSpell && <View style={{height:240,width:160,alignSelf:'center'}}><SpellFace id={selectedSpell} shop={selection?.kind==='shop'} xp={selectedCard?.xp} /></View>}
        <ScrollView style={{flex:1}} contentContainerStyle={{ gap: 10 }}>
          {selectedSpell && <>
            <Text style={s.modalTitle}>{SPELLS[selectedSpell].name}</Text><RulesText rules={selectedCard!.rules} keywords={selectedCard!.keywords} color="#d8c7aa" /><KeywordBoxes keywords={selectedCard!.keywords} /><Text style={s.caption}>{manaLabel(selectedCard!.mana)} mana · {castLabel(selectedCard!.castTicks)}</Text>
            <Text style={s.caption}>{selectedCard?.upgraded?'Upgraded · maximum level':(selectedCard?.xp??0)+'/3 XP · Consume 3 matching copies to upgrade'}</Text>
            {selectedCard && !selectedCard.upgraded && selectedCard.upgrade && <View style={{padding:10,backgroundColor:'#342817',gap:5}}><Text style={[s.caption,{color:'#f3ce77'}]}>AT 3 XP · {manaLabel(selectedCard.upgrade.mana)} mana · {castLabel(selectedCard.upgrade.castTicks)}</Text><RulesText rules={selectedCard.upgrade.rules} keywords={selectedCard.upgrade.keywords} color="#f1dfba" /></View>}
            {selection?.kind === 'shop' ? <><Action green label={`Buy ${SPELLS[selectedSpell].name} · ${SPELLS[selectedSpell].price} gold`} disabled={busy || domainBlocked || session.gold < SPELLS[selectedSpell].price || session.spells.length >= RULES.slots}
              onPress={() => { act({ type: 'buy', spell: selectedSpell,shopSlot:selection.shopSlot }); setSelection(null); }} />
              {session.spells.map((id,i)=>id===selectedSpell&&(session.spellXp?.[i]??0)<UPGRADE_XP?<Action key={i} green label={'Buy & merge into slot '+(i+1)+' · '+((session.spellXp?.[i]??0)+1)+'/3 XP · '+SPELLS[id].price+' gold'} disabled={busy||session.gold<SPELLS[id].price} onPress={()=>{act({type:'buy',spell:id,target:i,shopSlot:selection.shopSlot});setSelection(null);}} />:null)}
              {(domainBlocked || session.gold < SPELLS[selectedSpell].price || session.spells.length >= RULES.slots) && <Text style={s.caption}>{domainBlocked ? spellAddReason(session.spells,selectedSpell) : session.spells.length >= RULES.slots ? 'Your hand is full.' : 'Not enough gold.'}</Text>}</>
              : selection?.kind === 'hand' && <>{session.spells.map((id,from)=>canMerge(session.spells,session.spellXp??[],from,selection.index)?<Action key={from} green label={'Consume slot '+(from+1)+' ('+(session.spellXp?.[from]??0)+' XP) → +1 XP here'} disabled={busy} onPress={()=>{act({type:'merge',from,to:selection.index});setSelection(null);}} />:null)}<Text style={s.caption}>Casting position {selection.index + 1} of {session.spells.length}</Text><Action label="Trash spell · no refund" disabled={busy} onPress={() => { act({type:'trash',index:selection.index}); setSelection(null); }} />{SPELLS[selectedSpell].keywords.includes('channel') && <Text style={s.caption}>Channel X = {channelPower(session.spells, selection.index)}</Text>}<View style={s.modalMoves}>
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
  modalPanel: { width: '100%', maxWidth: 700, maxHeight: '94%', padding: 14, flexDirection:'row', gap:16, backgroundColor: '#211a13', borderWidth: 2, borderColor: '#ae8b50', borderRadius: 8 },
  modalTitle: { color: '#f1dfb6', fontFamily: serif, fontSize: 25, textAlign: 'center' },
  modalBody: { color: '#d8c7aa', fontSize: 14, lineHeight: 22, textAlign: 'center' },
  modalMoves: { flexDirection: 'row', gap: 10 },
  largeItem: { color: '#ddbd7b', fontSize: 70, textAlign: 'center' },
});
