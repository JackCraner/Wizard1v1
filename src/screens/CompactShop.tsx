import {ItemInventoryView,ItemIcon} from '../components/ItemInventory';
import {DomainSlots} from '../components/cards/DomainSlots';
import {cardUnderPointer,type CardBounds} from '../game/shopDrop';
import {MergeBurst} from './MergeBurst';
import botConfig from '../config/bots.json';
import { ShopOffer, type ShopPointer } from './ShopOffer';
import { explainedKeywords } from '../config/catalogue';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RULES, SPELLS, deriveStats, deckDomains, spellAddReason, canAddSpell } from '../game/engine';
import { EQUIPMENT, equipmentModifiers, rerollCost } from '../game/shop';
import type { Command, EquipmentId, Session, SpellId } from '../game/model';
import { DraggableHand } from './DraggableHand';

export function CompactShop({ session, busy, act, onMenu, onLibrary, onLeaderboard, error, inspectSpell, inspectItem, inspectHand, renderCard, renderPreview }: {
  session: Session; busy: boolean; act: (command: Command) => void; onMenu: () => void; onLibrary: () => void; onLeaderboard:()=>void; error?: string;
  inspectSpell: (id: SpellId,shopSlot:number) => void; inspectItem: (id: EquipmentId,shopSlot?:number) => void; inspectHand: (index: number) => void;
  renderPreview: (id: SpellId, height: number, width: number, index?:number) => ReactNode;
  renderCard: (id: SpellId, expanded?: boolean, index?:number) => ReactNode;
}) {
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
  const previewHeight=Math.min(225,size.height*.59);
  const previewWidth=previewHeight*2/3+(offerDrag&&explainedKeywords(SPELLS[offerDrag.id].keywords).length?180:0);
  const compact = size.height < 500;
  const rollCost=rerollCost(session.equipment,session.rerolls);
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
          <Text accessibilityRole="header" style={[s.title, { fontSize: compact ? 14 : 26 }]}>SHOP · ROUND {session.round} · {botConfig.difficulties[session.difficulty].label}</Text>
          <View style={s.headerRight}><Text accessibilityLabel={`${session.gold} gold`} style={s.gold}>◉ {session.gold}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={`Reroll for ${rollCost} gold`} disabled={busy || session.gold < rollCost} onPress={() => act({ type: 'reroll' })} style={[s.menu, (busy || session.gold < rollCost) && s.disabled]}><Text style={s.text}>⟳ Reroll ({rollCost})</Text></Pressable>
          </View>
        </View>
        <View style={[s.middle, { gap: compact ? 4 : 14 }]}>
          <View style={[s.player, { width: compact ? 150 : 220, padding: compact ? 8 : 16, gap: compact ? 5 : 14 }]}>
            <View style={s.playerTop}><Text style={[s.avatar, { fontSize: compact ? 30 : 48 }]}>♙</Text><View style={{ flex: 1, gap: 5 }}>
              <Text accessibilityLabel={`${session.wins} of ${session.lobby.winsToWin} trophies`} style={[s.text,{color:'#f0d180'}]}>🏆 {session.wins}/{session.lobby.winsToWin} wins</Text>
              <Text accessibilityLabel={`Health ${stats.health} of ${stats.health}`} style={[s.bar, { backgroundColor: '#882e2c' }]}>♥ {stats.health}/{stats.health}</Text>
              <Text accessibilityLabel={`Mana ${stats.mana} of ${stats.mana}`} style={[s.bar, { backgroundColor: '#275d7e' }]}>◈ {stats.mana}/{stats.mana}</Text>
            </View></View>
            <DomainSlots domains={deckDomains(session.spells)} slots={RULES.maxDomains} compact={compact} />
            <Pressable accessibilityRole="button" onPress={onLeaderboard} style={[s.menu,{minHeight:28,alignItems:'center'}]}><Text style={s.text}>Leaderboard</Text></Pressable>
            <View ref={itemBoxRef} collapsable={false} onLayout={measure} accessibilityLabel="Equipment box. Drop shop items here to buy." style={[s.itemBox,itemDrag&&{borderColor:itemReason(itemDrag.id)?'#e78775':itemDrag.over?'#c7f49c':'#baa46c',backgroundColor:itemReason(itemDrag.id)?'#562822':itemDrag.over?'#326442':'#293522'}]}>
              <Text accessibilityLiveRegion="polite" style={s.label}>{itemDrag?(itemReason(itemDrag.id)??(itemDrag.over?`RELEASE TO BUY · ${EQUIPMENT[itemDrag.id].price} GOLD`:'DROP ITEM HERE TO BUY')):'YOUR ITEMS · DROP TO BUY'}</Text>
              <ItemInventoryView inventory={session.equipment} maxVisible={compact?3:8} size={compact?26:32} onSelectItem={id=>inspectItem(id)}/>
            </View>
            {!compact && <Text style={s.hint}>Build your strategy. Let your spells do the fighting.</Text>}
          </View>
          <View style={[s.board, { padding: compact ? 6 : 12, gap: compact ? 3 : 8 }]}>
            <Text style={s.label}>SPELL SHOP · DRAG TO HAND TO BUY · HOLD FOR DETAILS</Text>
            <View style={s.offers}>{session.shop.map((id,shopSlot) => id===null?<View key={shopSlot} accessibilityLabel={'Shop slot '+(shopSlot+1)+': sold. Reroll to refill.'} style={{flex:1,minWidth:0,alignItems:'center',justifyContent:'center',borderWidth:1,borderStyle:'dashed',borderColor:'#66543a',borderRadius:5,backgroundColor:'#17130d88',gap:5}}><Text style={{color:'#958568',fontSize:18}}>✧</Text><Text style={{color:'#bba98a',fontSize:10}}>SOLD</Text><Text style={{color:'#958568',fontSize:8}}>Reroll to refill</Text></View>:<ShopOffer key={shopSlot} label={`Inspect ${SPELLS[id].name}, ${SPELLS[id].price} gold`} disabled={busy}
              onInspect={()=>inspectSpell(id,shopSlot)} onLift={p=>{measure();moveOffer(id,p);}} onMove={p=>moveOffer(id,p)} onCancel={()=>setOfferDrag(null)}
              onDrop={p=>{
                setOfferDrag(null);const target=targetAt(id,p);
                if(!overHand(p)||dropReason(id,target))return;
                if(target!==undefined){const b=cardBounds.current.find(b=>b.index===target)!;pendingMerge.current={revision:session.revision,target,id,xp:session.spellXp?.[target]??0,x:b.x+b.width/2-bounds.current.rootX,y:b.y+b.height/2-bounds.current.rootY};}
                act({type:'buy',spell:id,shopSlot,...(target===undefined?{}:{target})});
              }}>
              <View style={[s.cardSpace,{opacity:offerDrag?.id===id? .35 : purchaseReason(id)&&!canMergeOffer(id)? .5:1}]}><View style={s.card}>{renderCard(id)}</View></View>
              <Text style={s.cost}>◉ {SPELLS[id].price}</Text>
            </ShopOffer>)}</View>
            <Text style={s.label}>ITEM SHOP · DRAG TO YOUR ITEMS · TAP FOR DETAILS</Text>
            <View style={[s.equipment, { height: compact ? 43 : 76 }]}>{session.equipmentShop.map((id,shopSlot) => {
              if(id===null)return <View key={shopSlot} style={s.item}><Text style={s.itemInfo}>SOLD · Reroll to refill</Text></View>;
              const item = EQUIPMENT[id];
              return <ShopOffer key={shopSlot} label={`Inspect ${item.name}, ${item.price} gold`} hint="Drag to your equipment box to buy. Tap for item details and purchase controls." disabled={busy} style={[s.item,{opacity:itemDrag?.shopSlot===shopSlot? .35:session.gold<item.price? .5:1}]}
                onInspect={()=>inspectItem(id,shopSlot)} onLift={p=>{measure();moveItem(id,shopSlot,p);}} onMove={p=>moveItem(id,shopSlot,p)} onCancel={()=>setItemDrag(null)}
                onDrop={p=>{setItemDrag(null);if(!overItems(p)||itemReason(id)||session.equipmentShop[shopSlot]!==id)return;act({type:'buyEquipment',item:id,shopSlot});}}>
                <ItemIcon id={id} size={compact?24:36}/><View style={{ flex: 1 }}><Text numberOfLines={1} adjustsFontSizeToFit style={s.itemName}>{item.name} {'★'.repeat(item.stars)}</Text><Text numberOfLines={1} adjustsFontSizeToFit style={s.itemInfo}>{(session.equipment[id]??0)>0?`Owned ×${session.equipment[id]} · +1 copy`:item.description}</Text></View><Text style={s.cost}>{`◉ ${item.price}`}</Text>
              </ShopOffer>;
            })}</View>
          </View>
        </View>
        <View style={s.dock}>
          <View ref={handRef} collapsable={false} onLayout={measure} style={{ flex: 1, minWidth: 0, backgroundColor:offerDrag?(dropReason(offerDrag.id,offerDrag.target)?'#652b2755':offerDrag.over?'#40945c88':'#32644644'):'transparent', borderRadius:5 }}>
            <Text accessibilityLiveRegion="polite" style={s.handLabel}>{offerDrag ? (dropReason(offerDrag.id,offerDrag.target) ?? (offerDrag.target!==undefined?'Release to '+((session.spellXp?.[offerDrag.target]??0)===2?'UPGRADE':'merge · +1 XP')+' · '+SPELLS[offerDrag.id].price+' gold':offerDrag.over?`Release to buy · ${SPELLS[offerDrag.id].price} gold`:'Drop here to buy · Release elsewhere to cancel')) : `YOUR HAND (${session.spells.length}/${RULES.slots}) · Drag shop copies onto matching cards for XP`}</Text>
            <DraggableHand xp={session.spellXp} onCardBounds={b=>{cardBounds.current=b;}} mergeSpell={offerDrag&&canMergeOffer(offerDrag.id)?offerDrag.id:undefined} mergeTarget={offerDrag?.target!==undefined&&!dropReason(offerDrag.id,offerDrag.target)?offerDrag.target:undefined} height={handHeight} spells={session.spells} disabled={busy || !!offerDrag} renderCard={renderCard} renderPreview={renderPreview} onInspect={inspectHand} onMove={(from,to) => act({ type: 'move', from, to })} onDragging={setDragging} onDragPoint={(x,y)=>setOverTrash(hitsTrash(x,y))} onDrop={(index,x,y)=>{setOverTrash(false);if(!hitsTrash(x,y))return false;act({type:'trash',index});return true;}} />
          </View>
          <View ref={trashRef} collapsable={false} onLayout={measure} accessibilityLabel="Trash drop target. Drag a hand card here to remove it. No gold refund." style={{width:compact?58:85,minHeight:54,alignItems:'center',justifyContent:'center',borderWidth:2,borderRadius:5,borderColor:dragging&&overTrash?'#ffbf9c':'#9b5e50',backgroundColor:dragging&&overTrash?'#8a342d':'#321e19',gap:3}}><Text style={{color:'#ffcfb8',fontSize:19}}>×</Text><Text style={{color:'#ffcfb8',fontSize:9,fontWeight:'800'}}>{dragging&&overTrash?'RELEASE':'TRASH'}</Text><Text style={{color:'#d8a58e',fontSize:7}}>No refund</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel="Next round" disabled={busy || !session.spells.length} onPress={() => act({ type: 'fight' })} style={[s.next, { width: compact ? 135 : 210 }, (busy || !session.spells.length) && s.disabled]}><Text style={[s.title, { fontSize: compact ? 17 : 23 }]}>{session.spells.length ? 'Next round →' : 'Buy a spell first'}</Text></Pressable>
        </View>
        {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
      </View>
    </SafeAreaView>
    {burst&&<MergeBurst key={burst.key} x={burst.x} y={burst.y} upgraded={burst.upgraded} onDone={()=>setBurst(null)} />}
    {itemDrag&&<View pointerEvents="none" style={[s.itemGhost,{left:Math.max(6,Math.min(size.width-196,itemDrag.x-95)),top:Math.max(45,Math.min(size.height-96,itemDrag.y-106))}]}>
      <ItemIcon id={itemDrag.id} size={32}/><View style={{flex:1}}><Text style={s.itemName}>{EQUIPMENT[itemDrag.id].name}</Text><Text style={s.cost}>+1 copy · {EQUIPMENT[itemDrag.id].price} gold</Text><Text style={s.itemInfo}>{itemReason(itemDrag.id)??(itemDrag.over?'Release to buy':'Drop in your items box')}</Text></View>
    </View>}
    {offerDrag && <View pointerEvents="none" style={{position:'absolute',zIndex:1000,elevation:30,left:Math.max(6,Math.min(size.width-previewWidth-6,offerDrag.x-previewHeight/3)),top:Math.max(48,Math.min(size.height-previewHeight-30,offerDrag.y-previewHeight-18)),width:previewWidth,height:previewHeight}}>{renderPreview(offerDrag.id,previewHeight,previewWidth)}</View>}
  </View>;
}
const s = StyleSheet.create({
  itemBox:{borderWidth:1,borderColor:'#79613c',borderRadius:5,padding:4,gap:4,minHeight:50,justifyContent:'center'},
  itemGhost:{position:'absolute',zIndex:1000,elevation:30,width:190,padding:10,gap:8,flexDirection:'row',alignItems:'center',backgroundColor:'#231d12',borderColor:'#e8c27a',borderWidth:2,borderRadius:7},
  root: { flex: 1, overflow: 'hidden', backgroundColor: '#18110b' }, page: { flex: 1, minHeight: 0, width: '100%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, height: 40 }, headerRight: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  menu: { paddingHorizontal: 12, minHeight: 36, justifyContent: 'center', backgroundColor: '#1b201c', borderWidth: 1, borderColor: '#987844', borderRadius: 4 }, text: { color: '#ecdcb9', fontSize: 12 }, title: { color: '#f0dfb2', fontWeight: '600' }, gold: { color: '#eed090', fontSize: 21 },
  middle: { flex: 1, minHeight: 0, flexDirection: 'row' }, player: { borderWidth: 1, borderColor: '#a5834f', borderRadius: 5, backgroundColor: '#17120eea', alignSelf: 'flex-start' }, playerTop: { flexDirection: 'row', gap: 7, alignItems: 'center' }, avatar: { color: '#d5bc85' }, bar: { color: '#fff2dd', fontSize: 10, textAlign: 'center', borderRadius: 3, paddingVertical: 2 },
  label: { color: '#ccb68d', fontSize: 9, textAlign: 'center', letterSpacing: 1, lineHeight: 12 }, slots: { flexDirection: 'row', gap: 4 }, slot: { borderWidth: 1, borderColor: '#79613c', backgroundColor: '#11120f', alignItems: 'center', justifyContent: 'center' }, slotSymbol: { color: '#c6ab76', fontSize: 23 }, slotName: { color: '#b8a88a', fontSize: 8, textAlign: 'center', textTransform: 'capitalize' }, hint: { color: '#a49171', fontSize: 13, lineHeight: 22 },
  board: { flex: 1, minWidth: 0, minHeight: 0, borderWidth: 2, borderColor: '#a68144', borderRadius: 5, backgroundColor: '#26180fee' }, offers: { flex: 1, minHeight: 0, flexDirection: 'row', gap: 8 }, offer: { flex: 1, minWidth: 0, alignItems: 'center' }, cardSpace: { flex: 1, minHeight: 0, width: '100%', alignItems: 'center' }, card: { height: '100%', aspectRatio: 2 / 3, maxWidth: '100%' }, cost: { color: '#efd08a', fontSize: 12, textAlign: 'center', paddingVertical: 2 }, equipment: { flexDirection: 'row', gap: 8 }, item: { flex: 1, minWidth: 0, borderWidth: 1, borderColor: '#80653c', backgroundColor: '#14120f', paddingHorizontal: 7, flexDirection: 'row', alignItems: 'center', gap: 7 }, itemSymbol: { color: '#d2b478', fontSize: 24 }, itemName: { color: '#e8d8b5', fontSize: 11 }, itemInfo: { color: '#b6a485', fontSize: 9, paddingTop: 3 },
  dock: { zIndex: 10, overflow: 'visible', flexDirection: 'row', gap: 12, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#a38451', backgroundColor: '#120e0abf', paddingTop: 3 }, handLabel: { color: '#d9c7a2', fontSize: 10, textAlign: 'center', lineHeight: 14 }, next: { minHeight: 44, padding: 10, borderWidth: 1, borderColor: '#c7a060', backgroundColor: '#214e37', borderRadius: 4, alignItems: 'center', justifyContent: 'center' }, disabled: { opacity: .4 }, pressed: { opacity: .75 }, error: { position: 'absolute', bottom: 5, left: 10, right: 10, backgroundColor: '#492318', color: '#ffd4b7', padding: 8 },
});
