import { ShopSpellPreview } from './ShopSpellPreview';
import { LiftedPreview } from './LiftedPreview';
import { liftedPreviewLayout, spellPreviewSize } from './liftedPreviewLayout';
import {ItemInventoryView,ItemIcon} from '../components/ItemInventory';
import {DomainSlots} from '../components/cards/DomainSlots';
import {cardUnderPointer,type CardBounds} from '../game/shopDrop';
import {MergeBurst} from './MergeBurst';
import botConfig from '../config/bots.json';
import { ShopOffer, type ShopPointer } from './ShopOffer';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { RULES, SPELLS, deriveStats, deckDomains, spellAddReason, canAddSpell } from '../game/engine';
import { EQUIPMENT, equipmentModifiers, rerollCost } from '../game/shop';
import type { Command, EquipmentId, Session, SpellId } from '../game/model';
import { DraggableHand } from './DraggableHand';

export function CompactShop({ session, busy, act, onMenu, onLibrary, onLeaderboard, error, inspectSpell, inspectItem, inspectHand, renderCard }: {
  session: Session; busy: boolean; act: (command: Command) => void; onMenu: () => void; onLibrary: () => void; onLeaderboard:()=>void; error?: string;
  inspectSpell: (id: SpellId,shopSlot:number) => void; inspectItem: (id: EquipmentId,shopSlot?:number) => void; inspectHand: (index: number) => void;
  renderPreview: (id: SpellId, height: number, width: number, index?:number) => ReactNode;
  renderCard: (id: SpellId, expanded?: boolean, index?:number) => ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const [rootSize, setRootSize] = useState({ width: 800, height: 360 });
  const [size, setSize] = useState({ width: 800, height: 360 });
  const [dragging, setDragging] = useState(false);
  const itemBoxRef=useRef<View>(null);
  const itemBounds=useRef({x:0,y:0,width:0,height:0});
  const [itemDrag,setItemDrag]=useState<{id:EquipmentId;shopSlot:number;x:number;y:number;over:boolean}|null>(null);
  const itemReason=(id:EquipmentId)=>busy?'Please wait':session.gold<EQUIPMENT[id].price?'Not enough gold':null;
  const overItems=(p:ShopPointer)=>{const b=itemBounds.current;return b.width>0&&p.x>=b.x&&p.x<=b.x+b.width&&p.y>=b.y&&p.y<=b.y+b.height;};
  const moveItem=(id:EquipmentId,shopSlot:number,p:ShopPointer)=>setItemDrag({id,shopSlot,x:p.x-bounds.current.rootX,y:p.y-bounds.current.rootY,over:overItems(p)});
  const [overTrash,setOverTrash]=useState(false);
  const trashRef=useRef<View>(null);
  const trashBounds=useRef({x:0,y:0,width:0,height:0});
  const hitsTrash=(x:number,y:number)=>{const b=trashBounds.current;return x>=b.x&&x<=b.x+b.width&&y>=b.y&&y<=b.y+b.height;};
  const rootRef=useRef<View>(null), handRef=useRef<View>(null);
  const bounds=useRef({rootX:0,rootY:0,x:0,y:0,width:0,height:0});
  const cardBounds=useRef<CardBounds[]>([]);
  const pendingMerge=useRef<{revision:number;target:number;xp:number;id:string;x:number;y:number}|null>(null);
  const [burst,setBurst]=useState<{key:number;x:number;y:number;upgraded:boolean}|null>(null);
  useEffect(()=>{const p=pendingMerge.current;if(!p||session.revision<=p.revision)return;pendingMerge.current=null;if(session.spells[p.target]===p.id&&session.spellXp?.[p.target]===p.xp+1)setBurst({key:session.revision,x:p.x,y:p.y,upgraded:p.xp+1===3});},[session.revision]);
  const [offerDrag,setOfferDrag]=useState<{id:SpellId;x:number;y:number;over:boolean;target?:number}|null>(null);
  const purchaseReason=(id:SpellId)=>busy?'Please wait':session.spells.length>=RULES.slots?'Your hand is full':!canAddSpell(session.spells,id)?spellAddReason(session.spells,id):session.gold<SPELLS[id].price?'Not enough gold':null;
  const targetAt=(id:SpellId,p:ShopPointer)=>{const i=cardUnderPointer(cardBounds.current,p.x,p.y);return i!==undefined&&session.spells[i]===id?i:undefined;};
  const dropReason=(id:SpellId,target?:number)=>target===undefined?purchaseReason(id):busy?'Please wait':session.gold<SPELLS[id].price?'Not enough gold':(session.spellXp?.[target]??0)>=3?'Already upgraded · drop in empty hand space to buy another':null;
  const canMergeOffer=(id:SpellId)=>!busy&&session.gold>=SPELLS[id].price&&session.spells.some((s,i)=>s===id&&(session.spellXp?.[i]??0)<3);
  const measure=()=>{
    itemBoxRef.current?.measureInWindow((x,y,width,height)=>{itemBounds.current={x,y,width,height};});
    trashRef.current?.measureInWindow((x,y,width,height)=>{trashBounds.current={x,y,width,height};});
    rootRef.current?.measureInWindow((x,y)=>{bounds.current.rootX=x;bounds.current.rootY=y;});
    handRef.current?.measureInWindow((x,y,width,height)=>{Object.assign(bounds.current,{x,y,width,height});});
  };
  const overHand=(p:ShopPointer)=>{const b=bounds.current;return p.x>=b.x&&p.x<=b.x+b.width&&p.y>=b.y&&p.y<=b.y+b.height;};
  const moveOffer=(id:SpellId,p:ShopPointer)=>setOfferDrag({id,x:p.x-bounds.current.rootX,y:p.y-bounds.current.rootY,over:overHand(p),target:targetAt(id,p)});
  const compact = size.height < 500;
  const tight = size.width < 740;
  const short = size.height < 350;
  const rollCost = rerollCost(session.equipment, session.rerolls);
  const stats = deriveStats(equipmentModifiers(session.equipment));
  const handHeight = Math.max(76, Math.min(142, size.height * .21));
  const handleDragging = useCallback((value: boolean) => { setDragging(value); if (!value) setOverTrash(false); }, []);
  const viewport = { left: insets.left + 10, top: insets.top + 10,
    right: rootSize.width - insets.right - 10, bottom: rootSize.height - insets.bottom - 10 };
  const previewSize = spellPreviewSize(viewport);
  const previewPosition = liftedPreviewLayout(offerDrag?.x ?? 0, offerDrag?.y ?? 0, previewSize.width, previewSize.height, viewport);
  const itemPreviewWidth = Math.min(238, viewport.right - viewport.left);
  const itemPreviewPosition = liftedPreviewLayout(itemDrag?.x ?? 0, itemDrag?.y ?? 0, itemPreviewWidth, 112, viewport);
  const handMessage = offerDrag
    ? dropReason(offerDrag.id, offerDrag.target) ?? (offerDrag.target !== undefined
      ? `Release to ${(session.spellXp?.[offerDrag.target] ?? 0) === 2 ? 'UPGRADE' : 'merge · +1 XP'} · ${SPELLS[offerDrag.id].price} gold`
      : offerDrag.over ? `Release to buy · ${SPELLS[offerDrag.id].price} gold` : 'Drop here to buy · release elsewhere to cancel')
    : dragging ? 'Drag to set cast order · release to place' : session.spells.length ? 'Cast order →  ·  matching copies add XP' : 'Drag a spell here to begin';

  return <View ref={rootRef} collapsable={false} onLayout={event => { setRootSize(event.nativeEvent.layout); measure(); }} style={s.root}>
    <Image accessible={false} source={require('../../assets/MainBackground.png')} resizeMode="cover" style={[StyleSheet.absoluteFill, { width: '100%', height: '100%', opacity: .24 }]} />
    <SafeAreaView style={{ flex: 1 }}>
      <View onLayout={event => setSize(event.nativeEvent.layout)} style={[s.page, { padding: compact ? 8 : 18, gap: compact ? 7 : 14 }]}>
        <View style={s.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Main menu" onPress={onMenu} style={s.nav}><Text style={s.navText}>‹</Text></Pressable>
          <View style={{ flex: 1 }}><Text style={s.eyebrow}>ROUND {String(session.round).padStart(2, '0')} · {botConfig.difficulties[session.difficulty].label.toUpperCase()}</Text><Text accessibilityRole="header" style={[s.title, tight && { fontSize: 18 }]}>The Arcane Emporium</Text></View>
          <View style={s.stats}><Text accessibilityLabel={`Health ${stats.health} of ${stats.health}`} style={s.health}>♥ {stats.health}</Text><Text accessibilityLabel={`Mana ${stats.mana} of ${stats.mana}`} style={s.mana}>◆ {stats.mana}</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel={`Leaderboard. ${session.wins} of ${session.lobby.winsToWin} wins`} onPress={onLeaderboard} style={s.nav}><Text style={s.recordText}>✦ {session.wins}/{session.lobby.winsToWin}</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={onLibrary} style={s.nav}><Text style={s.navLabel}>Spells</Text></Pressable>
          <View accessibilityLabel={`${session.gold} gold`} style={s.wallet}><Text style={s.coin}>◈</Text><Text style={s.gold}>{session.gold}</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel={`Reroll for ${rollCost} gold`} disabled={busy || session.gold < rollCost} onPress={() => act({ type: 'reroll' })} style={({ pressed }) => [s.reroll, (busy || session.gold < rollCost) && s.disabled, pressed && s.pressed]}><Text style={s.rerollText}>⟳ Reroll  ·  {rollCost} ◈</Text></Pressable>
        </View>

        <View style={[s.market, { gap: tight ? 7 : 10 }]}>
          <View style={s.spellShelf}>
            <View style={s.sectionHeader}><Text style={s.sectionTitle}>SPELLS</Text><Text style={s.sectionHint}>{tight ? 'Drag to hand ↓' : 'Drag to buy ↓ · hold to read'}</Text></View>
            <View style={s.offers}>{session.shop.map((id, shopSlot) => id === null
              ? <View key={shopSlot} accessibilityLabel={`Shop slot ${shopSlot + 1}: sold. Reroll to refill.`} style={s.sold}><Text style={s.soldMark}>✧</Text><Text style={s.soldText}>SOLD</Text><Text style={s.soldHint}>Reroll to refill</Text></View>
              : <ShopOffer key={shopSlot} label={`Inspect ${SPELLS[id].name}, ${SPELLS[id].price} gold`} disabled={busy} style={s.spellOffer}
                onInspect={() => inspectSpell(id, shopSlot)} onLift={p => { measure(); moveOffer(id, p); }} onMove={p => moveOffer(id, p)} onCancel={() => setOfferDrag(null)}
                onDrop={p => {
                  setOfferDrag(null); const target = targetAt(id, p);
                  if (!overHand(p) || dropReason(id, target)) return;
                  if (target !== undefined) { const b = cardBounds.current.find(b => b.index === target)!; pendingMerge.current = { revision: session.revision, target, id, xp: session.spellXp?.[target] ?? 0, x: b.x + b.width / 2 - bounds.current.rootX, y: b.y + b.height / 2 - bounds.current.rootY }; }
                  act({ type: 'buy', spell: id, shopSlot, ...(target === undefined ? {} : { target }) });
                }}>
                <View style={[s.cardSpace, { opacity: offerDrag?.id === id ? .3 : purchaseReason(id) && !canMergeOffer(id) ? .45 : 1 }]}><View style={s.card}>{renderCard(id)}</View></View>
                <View style={s.offerCaption}><Text numberOfLines={1} style={s.offerName}>{SPELLS[id].name}</Text><View style={[s.priceTag, canMergeOffer(id) && s.mergeTag]}><Text style={s.price}>{canMergeOffer(id) ? '+' : ''}{SPELLS[id].price} ◈</Text></View></View>
              </ShopOffer>)}</View>

          </View>

          <View style={[s.itemShelf, { width: tight ? 152 : compact ? 184 : 250 }]}>
            <View style={s.sectionHeader}><Text style={[s.sectionTitle, { color: '#a3ddcf' }]}>ITEMS</Text><Text style={s.sectionHint}>This run</Text></View>
            <View style={s.equipment}>{session.equipmentShop.map((id, shopSlot) => {
              if (id === null) return <View key={shopSlot} style={s.soldItem}><Text style={s.soldText}>✧ SOLD</Text><Text style={s.soldHint}>Reroll to refill</Text></View>;
              const item = EQUIPMENT[id];
              return <ShopOffer key={shopSlot} label={`Inspect ${item.name}, ${item.price} gold`} hint="Drag to your equipment box to buy. Tap for item details and purchase controls." disabled={busy} style={[s.item, { opacity: itemDrag?.shopSlot === shopSlot ? .35 : session.gold < item.price ? .5 : 1 }]}
                onInspect={() => inspectItem(id, shopSlot)} onLift={p => { measure(); moveItem(id, shopSlot, p); }} onMove={p => moveItem(id, shopSlot, p)} onCancel={() => setItemDrag(null)}
                onDrop={p => { setItemDrag(null); if (!overItems(p) || itemReason(id) || session.equipmentShop[shopSlot] !== id) return; act({ type: 'buyEquipment', item: id, shopSlot }); }}>
                <View pointerEvents="none"><ItemIcon id={id} size={short ? 24 : tight ? 28 : 34} /></View>
                <View style={{ flex: 1, minWidth: 0, gap: 3 }}><Text numberOfLines={1} style={s.itemName}>{item.name}</Text>{!short && <Text numberOfLines={2} style={s.itemInfo}>{item.description}</Text>}</View>
                <Text style={s.itemPrice}>{item.price}<Text style={{ fontSize: 9 }}> ◈</Text></Text>
              </ShopOffer>;
            })}</View>
            {!short && <Text style={[s.shelfFoot, { color: '#8fbcb2' }]}>DRAG TO YOUR ITEMS ↙</Text>}
          </View>
        </View>

        <View style={s.dock}>
          <View style={[s.player, { width: tight ? 106 : compact ? 124 : 172 }]}>
            <DomainSlots domains={deckDomains(session.spells)} slots={RULES.maxDomains} compact />
            <View ref={itemBoxRef} collapsable={false} onLayout={measure} accessibilityLabel="Equipment box. Drop shop items here to buy." style={[s.itemBox, itemDrag && (itemReason(itemDrag.id) ? s.blockedDrop : itemDrag.over ? s.activeDrop : s.readyDrop)]}>
              <Text accessibilityLiveRegion="polite" style={s.bagTitle}>{itemDrag ? itemReason(itemDrag.id) ?? (itemDrag.over ? 'RELEASE TO BUY' : 'DROP ITEM HERE') : 'YOUR ITEMS'}</Text>
              <ItemInventoryView inventory={session.equipment} maxVisible={compact ? 1 : 6} size={compact ? 26 : 40} onSelectItem={id => inspectItem(id)} />

            </View>
          </View>


          <View ref={handRef} collapsable={false} onLayout={measure} style={[s.handDrop, offerDrag && (dropReason(offerDrag.id, offerDrag.target) ? s.blockedDrop : offerDrag.over ? s.activeDrop : s.readyDrop)]}>
            <View style={s.handHeading}><Text style={s.sectionTitle}>YOUR HAND <Text style={s.muted}>{session.spells.length}/{RULES.slots}</Text></Text><Text accessibilityLiveRegion="polite" numberOfLines={1} style={s.handHint}>{handMessage}</Text></View>
            <DraggableHand xp={session.spellXp} onCardBounds={b => { cardBounds.current = b; }} mergeSpell={offerDrag && canMergeOffer(offerDrag.id) ? offerDrag.id : undefined} mergeTarget={offerDrag?.target !== undefined && !dropReason(offerDrag.id, offerDrag.target) ? offerDrag.target : undefined} height={handHeight} spells={session.spells} disabled={busy || !!offerDrag} renderCard={renderCard} renderPreview={(id, height, width, index) => <ShopSpellPreview id={id} height={height} width={width} xp={index === undefined ? 0 : session.spellXp?.[index]} />} onInspect={inspectHand} onMove={(from, to) => act({ type: 'move', from, to })} onDragging={handleDragging} onDragPoint={(x, y) => setOverTrash(hitsTrash(x, y))} onDrop={(index, x, y) => { setOverTrash(false); if (!hitsTrash(x, y)) return false; act({ type: 'trash', index }); return true; }} />
          </View>
          <View style={[s.roundActions, { width: tight ? 102 : 134 }]}>
            <View ref={trashRef} collapsable={false} onLayout={measure} accessibilityLabel="Trash drop target. Drag a hand card here to remove it. No gold refund." style={[s.trash, dragging && s.trashReady, dragging && overTrash && s.trashActive]}><Text style={s.trashText}>{dragging && overTrash ? 'Release to trash' : '×  Trash spell'}</Text><Text style={s.trashHint}>No gold refund</Text></View>
            <Pressable accessibilityRole="button" accessibilityLabel="Next round" disabled={busy || !session.spells.length} onPress={() => act({ type: 'fight' })} style={({ pressed }) => [s.next, (busy || !session.spells.length) && s.disabled, pressed && s.pressed]}><Text style={s.nextLabel}>{session.spells.length ? 'Battle →' : 'Buy a spell'}</Text></Pressable>
          </View>
        </View>
        {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
      </View>
    </SafeAreaView>
    {burst && <MergeBurst key={burst.key} x={burst.x} y={burst.y} upgraded={burst.upgraded} onDone={() => setBurst(null)} />}
    {itemDrag && <LiftedPreview {...itemPreviewPosition} width={itemPreviewWidth} height={112}><View style={s.itemGhost}><ItemIcon id={itemDrag.id} size={38} /><View style={{ flex: 1, gap: 4 }}><Text style={s.itemName}>{EQUIPMENT[itemDrag.id].name}</Text><Text style={s.itemInfo}>{EQUIPMENT[itemDrag.id].description}</Text><Text style={s.price}>{itemReason(itemDrag.id) ?? (itemDrag.over ? 'Release to buy' : 'Drop in your items')} · {EQUIPMENT[itemDrag.id].price} ◈</Text></View></View></LiftedPreview>}
    {offerDrag && <LiftedPreview {...previewPosition} {...previewSize}>{<ShopSpellPreview id={offerDrag.id} shop {...previewSize} />}</LiftedPreview>}
  </View>;
}

const serif = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' });
const s = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden', backgroundColor: '#0c1519' },
  page: { flex: 1, minHeight: 0, width: '100%', maxWidth: 1400, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 44 },
  nav: { minWidth: 44, height: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7 },
  navText: { color: '#e8d4ae', fontSize: 30 }, navLabel: { color: '#c6ba9e', fontSize: 12 },
  eyebrow: { color: '#a89a7e', fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },
  title: { fontFamily: serif, color: '#f5e6c6', fontSize: 23 },
  wallet: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 40, borderRadius: 10, backgroundColor: '#c49a4520' },
  coin: { color: '#ecc76f', fontSize: 17 }, gold: { color: '#ffe2a0', fontSize: 23, fontWeight: '700' },
  reroll: { height: 44, paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#7f7151', borderRadius: 9, backgroundColor: '#262b26' },
  rerollText: { color: '#ecd8a7', fontSize: 12, fontWeight: '600' },
  market: { flex: 1, minHeight: 0, flexDirection: 'row' },
  player: { gap: 5, padding: 6, borderRadius: 11, backgroundColor: '#0b131bd9', borderWidth: 1, borderColor: '#34403f' },
  record: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 32 },
  recordText: { color: '#eccf8d', fontSize: 15, fontWeight: '700' }, muted: { color: '#87958e', fontWeight: '400' },
  stats: { gap: 4 }, health: { color: '#e6a69b', fontSize: 11 }, mana: { color: '#98c8df', fontSize: 11 },
  itemBox: { flex: 1, minHeight: 54, borderWidth: 1, borderStyle: 'dashed', borderColor: '#64897e', borderRadius: 7, padding: 6, justifyContent: 'center', gap: 5, backgroundColor: '#24443c33' },
  bagTitle: { color: '#b5dace', fontSize: 9, fontWeight: '800', letterSpacing: .5 }, bagHint: { color: '#8eafa3', fontSize: 9 },
  spellShelf: { flex: 1, minWidth: 0, padding: 6, gap: 3, borderRadius: 12, backgroundColor: '#242722d9', borderWidth: 1, borderColor: '#756447' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 5, minHeight: 16 },
  sectionTitle: { color: '#e8d4a4', fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  sectionHint: { color: '#9fab9e', fontSize: 10 },
  offers: { flex: 1, minHeight: 0, flexDirection: 'row', gap: 7 },
  spellOffer: { gap: 3 },
  cardSpace: { flex: 1, minHeight: 0, width: '100%', alignItems: 'center', justifyContent: 'center' },
  card: { height: '100%', aspectRatio: 2 / 3, maxWidth: '100%', maxHeight: 240 },
  offerCaption: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3 },
  offerName: { flexShrink: 1, color: '#ede3c8', fontSize: 12, fontWeight: '600' },
  priceTag: { minWidth: 30, minHeight: 22, paddingHorizontal: 6, justifyContent: 'center', alignItems: 'center', borderRadius: 7, backgroundColor: '#131b1a', borderWidth: 1, borderColor: '#76623b' },
  price: { color: '#efcc82', fontSize: 11, fontWeight: '700' }, mergeTag: { backgroundColor: '#324736', borderColor: '#8fac75' },
  shelfFoot: { color: '#a79a7b', fontSize: 8, letterSpacing: 1, textAlign: 'center' },
  sold: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderStyle: 'dashed', borderColor: '#5b5c49', borderRadius: 8, backgroundColor: '#0b151640' },
  soldMark: { color: '#85836b', fontSize: 26 }, soldText: { color: '#99a08e', fontSize: 10, letterSpacing: 1 }, soldHint: { color: '#818a7c', fontSize: 8 },
  itemShelf: { padding: 8, gap: 6, borderRadius: 12, backgroundColor: '#172e2ddc', borderWidth: 1, borderColor: '#3e655c' },
  equipment: { flex: 1, minHeight: 0, gap: 5 },
  item: { flexDirection: 'row', gap: 7, paddingHorizontal: 6, borderRadius: 7, borderWidth: 1, borderColor: '#425b51', backgroundColor: '#122422' },
  itemName: { color: '#e3e4cc', fontSize: 11, fontWeight: '700' }, itemInfo: { color: '#a5b9ae', fontSize: 10, lineHeight: 13 }, itemPrice: { color: '#edd193', fontSize: 12, fontWeight: '700' },
  soldItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 1, borderStyle: 'dashed', borderColor: '#3e655c', borderRadius: 7 },
  dock: { zIndex: 10, flexDirection: 'row', gap: 8, overflow: 'visible' },
  handDrop: { flex: 1, minWidth: 0, borderWidth: 1, borderColor: '#586657', borderRadius: 11, backgroundColor: '#101d20ee' },
  handHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10, paddingTop: 6, gap: 10 },
  handHint: { flex: 1, textAlign: 'right', color: '#a8b9a8', fontSize: 10 },
  readyDrop: { borderColor: '#b9d28e', backgroundColor: '#2e4a3766', borderStyle: 'dashed' }, activeDrop: { borderColor: '#d4f1a1', backgroundColor: '#416642aa', borderStyle: 'solid' }, blockedDrop: { borderColor: '#a46c5b', backgroundColor: '#62372e88' },
  roundActions: { justifyContent: 'space-between', gap: 6 },
  trash: { flex: 1, minHeight: 44, justifyContent: 'center', alignItems: 'center', gap: 2, borderRadius: 8, borderWidth: 1, borderColor: '#514d43', backgroundColor: '#172023' },
  trashText: { color: '#b3a799', fontSize: 11 }, trashHint: { color: '#887f74', fontSize: 8 }, trashReady: { borderColor: '#ba8165' }, trashActive: { backgroundColor: '#743e30', borderColor: '#efb188' },
  next: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#c8b27a', borderRadius: 9, backgroundColor: '#426253' },
  nextLabel: { color: '#fff0cc', fontFamily: serif, fontSize: 19 }, disabled: { opacity: .4 }, pressed: { opacity: .75 },
  itemGhost: { flex: 1, padding: 12, gap: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: '#132c29', borderColor: '#9abda5', borderWidth: 1, borderRadius: 10 },
  error: { position: 'absolute', bottom: 8, left: 12, right: 12, backgroundColor: '#492318', color: '#ffd4b7', padding: 8, zIndex: 1100 },
});
