import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LiftedPreview } from './LiftedPreview';
import { liftedPreviewLayout, spellPreviewSize } from './liftedPreviewLayout';
import type {CardBounds} from '../game/shopDrop';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { PanResponder, Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import type { SpellId } from '../game/model';
import { SPELLS } from '../game/engine';
import { dropIndex } from '../game/handLayout';

export function DraggableHand({ xp=[], mergeSpell, mergeTarget, onCardBounds, spells, disabled, renderCard, renderPreview, onInspect, onMove, onDrop, onDragPoint, onDragging, height = 172 }: {
  renderPreview?: (id: SpellId, height: number, width: number, index?:number) => ReactNode;
  xp?:number[]; mergeSpell?:string; mergeTarget?:number; onCardBounds?:(bounds:CardBounds[])=>void;
  height?: number; spells: SpellId[]; disabled: boolean; renderCard: (id: SpellId, expanded?: boolean, index?:number) => ReactNode;
  onDrop?: (index:number,x:number,y:number)=>boolean; onDragPoint?: (x:number,y:number)=>void;
  onInspect: (index: number) => void; onMove: (from: number, to: number) => void; onDragging: (dragging: boolean) => void;
}) {
  const { height: screenHeight } = useWindowDimensions();
  const [width, setWidth] = useState(0);
  const [drag, setDrag] = useState<{ from: number; to: number } | null>(null);
  const handRef=useRef<View>(null);
  const count = Math.max(5, spells.length);
  const cardHeight = Math.max(42, height - 16);
  const cardWidth = Math.min(94, cardHeight * 2 / 3);
  const spacing = Math.min(77, Math.max(1, (width - cardWidth - 38) / (count - 1)));
  const start = (width - (cardWidth + spacing * (count - 1))) / 2;
  const measureCards=()=>handRef.current?.measureInWindow((x,y)=>onCardBounds?.(spells.map((_,index)=>({index,x:x+start+spacing*index,y:y+6+Math.abs(index-(count-1)/2),width:cardWidth,height:cardHeight}))));
  useEffect(()=>{measureCards();},[width,height,spells.length,disabled]);
  useEffect(() => () => onDragging(false), [onDragging]);
  return <View ref={handRef} collapsable={false} onLayout={event => {setWidth(event.nativeEvent.layout.width);measureCards();}} style={[styles.hand, {height}]}>
    {width > 0 && Array.from({ length: count }, (_, index) => {
      const id = spells[index];
      const offset = index - (count - 1) / 2;
      const left = start + spacing * index;
      return id ? <DragCard key={`${index}-${id}`} id={id} index={index} left={left} top={6 + Math.abs(offset)} height={cardHeight}
        xp={xp[index]??0} mergeEligible={mergeSpell===id&&(xp[index]??0)<3} mergeTarget={mergeTarget===index}
        previewHeight={Math.min(240, screenHeight * .56)} width={cardWidth} angle={offset * 2.5} spacing={spacing} count={spells.length} disabled={disabled}
        selected={drag?.from === index} target={drag?.to === index && drag.from !== index}
        renderCard={renderCard} renderPreview={renderPreview} onInspect={onInspect} onMove={onMove} onDrop={onDrop} onDragPoint={onDragPoint}
        onDrag={(target) => { setDrag(target === null ? null : { from: index, to: target }); onDragging(target !== null); }} />
        : <View key={`empty-${index}`} pointerEvents="none" style={[styles.empty, { left, top: 6 + Math.abs(offset), height: cardHeight, width: cardWidth, transform: [{ rotate: `${offset * 2.5}deg` }] }]}><Text style={styles.emptyText}>✧</Text></View>;
    })}
    {drag && <Text pointerEvents="none" style={styles.destination}>Release to place in slot {drag.to + 1}</Text>}
  </View>;
}

function DragCard(props: {
  xp:number; mergeEligible:boolean; mergeTarget:boolean;
  id: SpellId; index: number; left: number; top: number; width: number; height: number; angle: number; spacing: number; count: number;
  renderPreview?: (id: SpellId, height: number, width: number, index?:number) => ReactNode;
  previewHeight: number;
  disabled: boolean; selected: boolean; target: boolean; renderCard: (id: SpellId, expanded?: boolean, index?:number) => ReactNode;
  onDrop?: (index:number,x:number,y:number)=>boolean; onDragPoint?: (x:number,y:number)=>void;
  onInspect: (i: number) => void; onMove: (from: number, to: number) => void; onDrag: (target: number | null) => void;
}) {
  const latest = useRef(props); latest.current = props;
  const cardRef = useRef<View>(null);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const [point, setPoint] = useState({ x: 0, y: 0 });
  const touch = useRef({ x: 0, y: 0 });
  const startY = useRef(0);
  const measure = () => cardRef.current?.measureInWindow((x, y) => setOrigin({ x, y }));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const active = useRef(false);
  const lifted = useRef(false);
  const from = useRef(props.index);
  const clearHold = () => { if (timer.current) clearTimeout(timer.current); timer.current = null; };
  const lift = () => {
    if (!active.current || latest.current.disabled) return;
    lifted.current = true;
    latest.current.onDrag(from.current);
  };
  const finish = (dx: number, cancelled: boolean, x=0, y=0) => {
    clearHold();
    if (!active.current) return;
    active.current = false;
    const p = latest.current;
    const wasLifted = lifted.current;
    lifted.current = false;

    p.onDrag(null);
    if (cancelled || p.disabled) return;
    if (wasLifted) {
      if(p.onDrop?.(from.current,x,y))return;
      const to = dropIndex(from.current, dx, p.spacing, p.count);
      if (to !== from.current) p.onMove(from.current, to);
    } else p.onInspect(p.index);
  };
  useEffect(() => () => { clearHold(); active.current = false; }, []);
  useEffect(() => { if (props.disabled) finish(0, true); }, [props.disabled]);
  const responder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => !latest.current.disabled,
    onPanResponderGrant: (event) => {
      measure();
      touch.current = { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY };
      startY.current = touch.current.y;
      setPoint(touch.current);
      clearHold(); active.current = true; lifted.current = false;
      from.current = latest.current.index;
      timer.current = setTimeout(lift, 300);
    },
    onPanResponderMove: (_, gesture) => {
      if (!active.current) return;
      if (!lifted.current && Math.hypot(gesture.dx, gesture.dy) > 6) { clearHold(); lift(); }
      if (lifted.current) {
        touch.current = { x: gesture.moveX, y: gesture.moveY };
        // Keep horizontal reordering steady; lift further if the thumb moves upward.
        setPoint({ x: gesture.moveX, y: Math.min(startY.current, gesture.moveY) });
        latest.current.onDragPoint?.(gesture.moveX,gesture.moveY);
        latest.current.onDrag(dropIndex(from.current, gesture.dx, latest.current.spacing, latest.current.count));
      }
    },
    onPanResponderRelease: (_, gesture) => finish(gesture.dx, false, touch.current.x, touch.current.y),
    onPanResponderTerminate: () => finish(0, true),
    onPanResponderTerminationRequest: () => false,
  })).current;
  const viewport = { left: insets.left + 10, top: insets.top + 10, right: screenWidth - insets.right - 10, bottom: screenHeight - insets.bottom - 10 };
  const previewSize = props.renderPreview ? spellPreviewSize(viewport) : { width: props.previewHeight * 2 / 3, height: props.previewHeight };
  const previewWidth = previewSize.width;
  const position = liftedPreviewLayout(point.x, point.y, previewWidth, previewSize.height, viewport);
  return <View ref={cardRef} collapsable={false} onLayout={measure} {...responder.panHandlers} accessible accessibilityRole="button"
    accessibilityLabel={"Slot " + (props.index + 1) + ": " + SPELLS[props.id].name + ". Inspect or reorder"}
    accessibilityHint="Hold to enlarge, then drag left or right to reorder. Tap for details."
    accessibilityState={{ disabled: props.disabled }}
    onAccessibilityTap={() => !props.disabled && props.onInspect(props.index)}
    {...(Platform.OS === 'web' ? { tabIndex: 0, onKeyDown: (event: { key: string; preventDefault: () => void }) => {
      if (!props.disabled && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); props.onInspect(props.index); }
    } } : {})}
    style={{ position: 'absolute', left: props.left, top: props.top, width: props.width, height: props.height,
      zIndex: props.selected ? 100 : props.index, overflow: 'visible',
      ...(Platform.OS === 'web' ? { touchAction: 'none' as const, userSelect: 'none' as const } : {}),
    }}>
    <View pointerEvents="none" style={{ flex: 1, opacity: props.selected ? .3 : 1,
      transform: [{ rotate: props.angle + "deg" }], borderWidth: props.target||props.mergeEligible ? 2 : 0, borderColor: props.mergeTarget?'#fff4ad':'#e9b651', backgroundColor:props.mergeTarget?'#ffc84b44':'transparent', shadowColor:'#ffce54',shadowOpacity:props.mergeTarget?1:props.mergeEligible?.6:0,shadowRadius:props.mergeTarget?12:6,shadowOffset:{width:0,height:0}, borderRadius: 5 }}>
      {props.renderCard(props.id,false,props.index)}
      <View style={{position:'absolute',bottom:-5,left:-4,right:-4,alignItems:'center'}}><Text style={{fontSize:9,fontWeight:'900',color:props.mergeTarget?'#251605':'#ffdf88',backgroundColor:props.mergeTarget?'#ffe48d':'#231a0ff2',borderWidth:1,borderColor:props.xp>0?'#ffcd55':'#766242',borderRadius:3,paddingHorizontal:3,paddingVertical:1}}>{props.mergeTarget? (props.xp===2?'UPGRADE!':'+1 XP'):props.xp>=3?'MAX ✦':props.xp+'/3 XP'}</Text></View>
      <View style={styles.badge}><Text style={styles.number}>{props.index + 1}</Text></View>
    </View>
    {props.selected && <LiftedPreview left={position.left - origin.x} top={position.top - origin.y} width={previewWidth} height={previewSize.height}>
      {props.renderPreview ? props.renderPreview(props.id, previewSize.height, previewWidth,props.index) : props.renderCard(props.id, true,props.index)}
    </LiftedPreview>}
  </View>;
}

const styles = StyleSheet.create({
  hand: { width: '100%', height: 172, overflow: 'visible', zIndex: 10 },
  empty: { position: 'absolute', height: 125, borderWidth: 1, borderColor: '#776345', borderRadius: 4, backgroundColor: '#181713', justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#716248', fontSize: 35 },
  badge: { position: 'absolute', top: 0, left: 0, width: 20, height: 20, borderRadius: 10, backgroundColor: '#31251a', borderWidth: 1, borderColor: '#c5a26b', alignItems: 'center', justifyContent: 'center' },
  number: { color: '#efdab0', fontSize: 10 },
  destination: { position: 'absolute', bottom: 1, alignSelf: 'center', color: '#f5d495', fontSize: 11 },
});
