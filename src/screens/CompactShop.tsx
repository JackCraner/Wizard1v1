import { ShopOffer, type ShopPointer } from './ShopOffer';
import { explainedKeywords } from '../config/catalogue';
import { useRef, useState, type ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RULES, SPELLS, deriveStats, deckDomains, canAddSpell } from '../game/engine';
import { EQUIPMENT, EQUIPMENT_SLOTS, equipmentModifiers } from '../game/shop';
import type { Command, EquipmentId, Session, SpellId } from '../game/model';
import { DraggableHand } from './DraggableHand';

export function CompactShop({ session, busy, act, onMenu, onLibrary, error, inspectSpell, inspectItem, inspectHand, renderCard, renderPreview }: {
  session: Session; busy: boolean; act: (command: Command) => void; onMenu: () => void; onLibrary: () => void; error?: string;
  inspectSpell: (id: SpellId) => void; inspectItem: (id: EquipmentId) => void; inspectHand: (index: number) => void;
  renderPreview: (id: SpellId, height: number, width: number) => ReactNode;
  renderCard: (id: SpellId, expanded?: boolean) => ReactNode;
}) {
  const [size, setSize] = useState({ width: 800, height: 360 });
  const [dragging, setDragging] = useState(false);
  const [overTrash,setOverTrash]=useState(false);
  const trashRef=useRef<View>(null);
  const trashBounds=useRef({x:0,y:0,width:0,height:0});
  const hitsTrash=(x:number,y:number)=>{const b=trashBounds.current;return x>=b.x&&x<=b.x+b.width&&y>=b.y&&y<=b.y+b.height;};
  const rootRef=useRef<View>(null), handRef=useRef<View>(null);
  const bounds=useRef({rootX:0,rootY:0,x:0,y:0,width:0,height:0});
  const [offerDrag,setOfferDrag]=useState<{id:SpellId;x:number;y:number;over:boolean}|null>(null);
  const purchaseReason=(id:SpellId)=>busy?'Please wait':session.spells.length>=RULES.slots?'Your hand is full':!canAddSpell(session.spells,id)?'Only 2 domains per deck':session.gold<SPELLS[id].price?'Not enough gold':null;
  const measure=()=>{
    trashRef.current?.measureInWindow((x,y,width,height)=>{trashBounds.current={x,y,width,height};});
    rootRef.current?.measureInWindow((x,y)=>{bounds.current.rootX=x;bounds.current.rootY=y;});
    handRef.current?.measureInWindow((x,y,width,height)=>{Object.assign(bounds.current,{x,y,width,height});});
  };
  const overHand=(p:ShopPointer)=>{const b=bounds.current;return p.x>=b.x&&p.x<=b.x+b.width&&p.y>=b.y&&p.y<=b.y+b.height;};
  const moveOffer=(id:SpellId,p:ShopPointer)=>setOfferDrag({id,x:p.x-bounds.current.rootX,y:p.y-bounds.current.rootY,over:overHand(p)});
  const previewHeight=Math.min(225,size.height*.59);
  const previewWidth=previewHeight*2/3+(offerDrag&&explainedKeywords(SPELLS[offerDrag.id].keywords).length?180:0);
  const compact = size.height < 500;
  const stats = deriveStats(equipmentModifiers(session.equipment));
  const handHeight = Math.max(62, Math.min(145, size.height * .23));
  return <View ref={rootRef} collapsable={false} onLayout={measure} style={s.root}>
    <Image accessible={false} source={require('../../assets/MainBackground.png')} resizeMode="cover" style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} />
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#100a08aa' }]} />
    <SafeAreaView style={{ flex: 1 }}>
      <View onLayout={e => setSize(e.nativeEvent.layout)} style={[s.page, { gap: compact ? 5 : 12, padding: compact ? 7 : 16 }]}>
        <View style={s.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Main menu" onPress={onMenu} style={s.menu}><Text style={s.text}>‹ Menu</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={onLibrary} style={s.menu}><Text style={s.text}>Spell library</Text></Pressable>
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
            <Text style={s.label}>DOMAINS {deckDomains(session.spells).length}/{RULES.maxDomains} · {(deckDomains(session.spells).join(' / ') || 'Choose up to 2').toUpperCase()}</Text>
            <Text style={s.label}>YOUR EQUIPMENT</Text>
            <View style={s.slots}>{EQUIPMENT_SLOTS.map(slot => {
              const id = session.equipment[slot];
              return <View key={slot} style={{ flex: 1, gap: 4 }}><Pressable accessibilityRole={id ? 'button' : undefined} accessibilityLabel={id ? `Equipped ${EQUIPMENT[id].name}` : `Empty ${slot} slot`} disabled={!id} onPress={() => id && inspectItem(id)} style={[s.slot, { height: compact ? 32 : 50 }]}><Text style={s.slotSymbol}>{id ? EQUIPMENT[id].symbol : '+'}</Text></Pressable><Text numberOfLines={1} adjustsFontSizeToFit style={s.slotName}>{slot}</Text></View>;
            })}</View>
            {!compact && <Text style={s.hint}>Build your strategy. Let your spells do the fighting.</Text>}
          </View>
          <View style={[s.board, { padding: compact ? 6 : 12, gap: compact ? 3 : 8 }]}>
            <Text style={s.label}>SPELL SHOP · DRAG TO HAND TO BUY · HOLD FOR DETAILS</Text>
            <View style={s.offers}>{session.shop.map(id => <ShopOffer key={id} label={`Inspect ${SPELLS[id].name}, ${SPELLS[id].price} gold`} disabled={busy}
              onInspect={()=>inspectSpell(id)} onLift={p=>{measure();moveOffer(id,p);}} onMove={p=>moveOffer(id,p)} onCancel={()=>setOfferDrag(null)}
              onDrop={p=>{setOfferDrag(null);if(overHand(p)&&!purchaseReason(id))act({type:'buy',spell:id});}}>
              <View style={[s.cardSpace,{opacity:offerDrag?.id===id? .35 : purchaseReason(id)? .5:1}]}><View style={s.card}>{renderCard(id)}</View></View>
              <Text style={s.cost}>◉ {SPELLS[id].price}</Text>
            </ShopOffer>)}</View>
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
          <View ref={handRef} collapsable={false} onLayout={measure} style={{ flex: 1, minWidth: 0, backgroundColor:offerDrag?(purchaseReason(offerDrag.id)?'#652b2755':offerDrag.over?'#40945c88':'#32644644'):'transparent', borderRadius:5 }}>
            <Text accessibilityLiveRegion="polite" style={s.handLabel}>{offerDrag ? (purchaseReason(offerDrag.id) ?? (offerDrag.over?`Release to buy · ${SPELLS[offerDrag.id].price} gold`:'Drop here to buy · Release elsewhere to cancel')) : `YOUR HAND (${session.spells.length}/${RULES.slots}) · Hold to enlarge · Drag to reorder`}</Text>
            <DraggableHand height={handHeight} spells={session.spells} disabled={busy || !!offerDrag} renderCard={renderCard} renderPreview={renderPreview} onInspect={inspectHand} onMove={(from,to) => act({ type: 'move', from, to })} onDragging={setDragging} onDragPoint={(x,y)=>setOverTrash(hitsTrash(x,y))} onDrop={(index,x,y)=>{setOverTrash(false);if(!hitsTrash(x,y))return false;act({type:'trash',index});return true;}} />
          </View>
          <View ref={trashRef} collapsable={false} onLayout={measure} accessibilityLabel="Trash drop target. Drag a hand card here to remove it. No gold refund." style={{width:compact?58:85,minHeight:54,alignItems:'center',justifyContent:'center',borderWidth:2,borderRadius:5,borderColor:dragging&&overTrash?'#ffbf9c':'#9b5e50',backgroundColor:dragging&&overTrash?'#8a342d':'#321e19',gap:3}}><Text style={{color:'#ffcfb8',fontSize:19}}>×</Text><Text style={{color:'#ffcfb8',fontSize:9,fontWeight:'800'}}>{dragging&&overTrash?'RELEASE':'TRASH'}</Text><Text style={{color:'#d8a58e',fontSize:7}}>No refund</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel="Next round" disabled={busy || !session.spells.length} onPress={() => act({ type: 'fight' })} style={[s.next, { width: compact ? 135 : 210 }, (busy || !session.spells.length) && s.disabled]}><Text style={[s.title, { fontSize: compact ? 17 : 23 }]}>{session.spells.length ? 'Next round →' : 'Buy a spell first'}</Text></Pressable>
        </View>
        {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
      </View>
    </SafeAreaView>
    {offerDrag && <View pointerEvents="none" style={{position:'absolute',zIndex:1000,elevation:30,left:Math.max(6,Math.min(size.width-previewWidth-6,offerDrag.x-previewHeight/3)),top:Math.max(48,Math.min(size.height-previewHeight-30,offerDrag.y-previewHeight-18)),width:previewWidth,height:previewHeight}}>{renderPreview(offerDrag.id,previewHeight,previewWidth)}</View>}
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
