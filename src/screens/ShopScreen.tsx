import {ItemIcon} from '../components/ItemInventory';
import {equipmentKeywords,itemTotals} from '../game/equipment';
import { cardAt } from '../game/upgrades';
import { Leaderboard } from './Leaderboard';
import { SpellCard, KeywordBoxes, RulesText, CardPreview } from '../components/cards/SpellCard';
import { SpellDialog, type SpellSelection } from './SpellDialog';
import { CompactShop } from './CompactShop';
import { useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { EQUIPMENT } from '../game/shop';
import type { Command, EquipmentId, Session, SpellId } from '../game/model';

const serif = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' });
type Selection = SpellSelection | { kind: 'equipment'; id: EquipmentId; shopSlot?:number };

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
  const selectedItem = selection?.kind === 'equipment' ? EQUIPMENT[selection.id] : undefined;
  const inspect = (next: Selection) => setSelection(next);

  return <View style={{ flex: 1 }}>
    <CompactShop session={session} busy={busy} act={act} onMenu={onMenu} onLibrary={onLibrary} onLeaderboard={()=>setLeaderboard(true)} error={error}
      inspectSpell={(id,shopSlot) => inspect({kind: 'shop', id,shopSlot})} inspectItem={(id,shopSlot) => inspect({kind: 'equipment', id,shopSlot})}
      inspectHand={index => inspect({kind: 'hand', index})} renderCard={(id, expanded,index) => <SpellFace id={id} shop={index===undefined} xp={index===undefined?0:session.spellXp?.[index]} small={!expanded} />} renderPreview={(id, height, width,index) => <CardPreview shop={index===undefined} card={cardAt(id,index===undefined?0:session.spellXp?.[index])} height={height} width={width} />} />
    <Leaderboard lobby={session.lobby} visible={leaderboard} onClose={()=>setLeaderboard(false)} />
    {selection && selection.kind !== 'equipment' && <SpellDialog selection={selection} session={session} busy={busy} error={error} act={act} onClose={() => setSelection(null)} onSelect={setSelection} />}
    <Modal visible={selection?.kind === 'equipment'} transparent animationType="fade" onRequestClose={() => setSelection(null)}>
      <View style={s.modalShade}><View accessibilityViewIsModal style={s.modalPanel}>
        <ScrollView style={{flex:1}} contentContainerStyle={{ gap: 10 }}>
          {selectedItem && <><View style={{alignItems:'center'}}><ItemIcon id={selectedItem.id} count={session.equipment[selectedItem.id]??0} size={52}/></View><Text style={s.modalTitle}>{selectedItem.name} {'★'.repeat(selectedItem.stars)}</Text><RulesText rules={selectedItem.description} keywords={equipmentKeywords(selectedItem)} color="#e0d0ad" fontSize={13} /><KeywordBoxes keywords={equipmentKeywords(selectedItem)} />
            <Text style={s.caption}>Owned ×{session.equipment[selectedItem.id]??0} · Unlimited copies · Persists for this run</Text>
            <Text style={{color:'#efcf87',fontWeight:'700'}}>Current bonus</Text>{itemTotals(selectedItem,session.equipment[selectedItem.id]??0).map((line,i)=><Text key={i} style={{color:'#c0deac',fontSize:12}}>{line}</Text>)}
            <Text style={{color:'#efcf87',fontWeight:'700'}}>After buying one</Text>{itemTotals(selectedItem,(session.equipment[selectedItem.id]??0)+1).map((line,i)=><Text key={i} style={{color:'#c0deac',fontSize:12}}>{line}</Text>)}
            <Action green label={!session.equipmentShop.includes(selectedItem.id)?'Not in this shop':'Buy +1 '+selectedItem.name+' · '+selectedItem.price+' gold'}
              disabled={busy || !session.equipmentShop.includes(selectedItem.id) || session.gold < selectedItem.price}
              onPress={() => { act({ type: 'buyEquipment', item: selectedItem.id,shopSlot:selection?.kind==='equipment'?selection.shopSlot:undefined }); setSelection(null); }} />
            {session.gold < selectedItem.price && <Text style={s.caption}>Not enough gold.</Text>}
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
});
