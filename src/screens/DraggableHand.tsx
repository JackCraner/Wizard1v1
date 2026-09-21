import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, PanResponder, Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import type { SpellId } from '../game/model';
import { SPELLS } from '../game/engine';
import { explainedKeywords } from '../config/catalogue';
import { dropIndex } from '../game/handLayout';

export function DraggableHand({ spells, disabled, renderCard, renderPreview, onInspect, onMove, onDrop, onDragPoint, onDragging, height = 172 }: {
  renderPreview?: (id: SpellId, height: number, width: number) => ReactNode;
  height?: number; spells: SpellId[]; disabled: boolean; renderCard: (id: SpellId, expanded?: boolean) => ReactNode;
  onDrop?: (index:number,x:number,y:number)=>boolean; onDragPoint?: (x:number,y:number)=>void;
  onInspect: (index: number) => void; onMove: (from: number, to: number) => void; onDragging: (dragging: boolean) => void;
}) {
  const { height: screenHeight } = useWindowDimensions();
  const [width, setWidth] = useState(0);
  const [drag, setDrag] = useState<{ from: number; to: number } | null>(null);
  const count = Math.max(5, spells.length);
  const cardHeight = Math.max(42, height - 24);
  const cardWidth = Math.min(94, cardHeight * 2 / 3);
  const spacing = Math.min(77, Math.max(1, (width - cardWidth - 38) / (count - 1)));
  const start = (width - (cardWidth + spacing * (count - 1))) / 2;
  useEffect(() => () => onDragging(false), [onDragging]);
  return <View onLayout={event => setWidth(event.nativeEvent.layout.width)} style={[styles.hand, {height}]}>
    {width > 0 && Array.from({ length: count }, (_, index) => {
      const id = spells[index];
      const offset = index - (count - 1) / 2;
      const left = start + spacing * index;
      return id ? <DragCard key={`${index}-${id}`} id={id} index={index} left={left} top={6 + Math.abs(offset)} height={cardHeight}
        handWidth={width} previewHeight={Math.min(240, screenHeight * .56)} width={cardWidth} angle={offset * 2.5} spacing={spacing} count={spells.length} disabled={disabled}
        selected={drag?.from === index} target={drag?.to === index && drag.from !== index}
        renderCard={renderCard} renderPreview={renderPreview} onInspect={onInspect} onMove={onMove} onDrop={onDrop} onDragPoint={onDragPoint}
        onDrag={(target) => { setDrag(target === null ? null : { from: index, to: target }); onDragging(target !== null); }} />
        : <View key={`empty-${index}`} pointerEvents="none" style={[styles.empty, { left, top: 6 + Math.abs(offset), height: cardHeight, width: cardWidth, transform: [{ rotate: `${offset * 2.5}deg` }] }]}><Text style={styles.emptyText}>✧</Text></View>;
    })}
    {drag && <Text pointerEvents="none" style={styles.destination}>Release to place in slot {drag.to + 1}</Text>}
  </View>;
}

function DragCard(props: {
  id: SpellId; index: number; left: number; top: number; width: number; height: number; angle: number; spacing: number; count: number;
  renderPreview?: (id: SpellId, height: number, width: number) => ReactNode;
  handWidth: number; previewHeight: number;
  disabled: boolean; selected: boolean; target: boolean; renderCard: (id: SpellId, expanded?: boolean) => ReactNode;
  onDrop?: (index:number,x:number,y:number)=>boolean; onDragPoint?: (x:number,y:number)=>void;
  onInspect: (i: number) => void; onMove: (from: number, to: number) => void; onDrag: (target: number | null) => void;
}) {
  const latest = useRef(props); latest.current = props;
  const offset = useRef(new Animated.Value(0)).current;
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
    offset.setValue(0);
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
    onPanResponderGrant: () => {
      clearHold(); active.current = true; lifted.current = false;
      from.current = latest.current.index;
      timer.current = setTimeout(lift, 300);
    },
    onPanResponderMove: (_, gesture) => {
      if (!active.current) return;
      if (!lifted.current && Math.abs(gesture.dx) > 6) { clearHold(); lift(); }
      if (lifted.current) {
        offset.setValue(gesture.dx);
        latest.current.onDragPoint?.(gesture.moveX,gesture.moveY);
        latest.current.onDrag(dropIndex(from.current, gesture.dx, latest.current.spacing, latest.current.count));
      }
    },
    onPanResponderRelease: (_, gesture) => finish(gesture.dx, false, gesture.moveX, gesture.moveY),
    onPanResponderTerminate: () => finish(0, true),
    onPanResponderTerminationRequest: () => false,
  })).current;
  const previewWidth = Math.min(props.handWidth - 8, props.previewHeight * 2 / 3 + (props.renderPreview && explainedKeywords(SPELLS[props.id].keywords).length > 0 ? 180 : 0));
  const previewLeft = (props.width - previewWidth) / 2;
  const minX = -props.left - previewLeft + 4;
  const maxX = props.handWidth - props.left - previewLeft - previewWidth - 4;
  const previewX = offset.interpolate({ inputRange: [minX, Math.max(minX + 1, maxX)], outputRange: [minX, Math.max(minX + 1, maxX)], extrapolate: 'clamp' });
  return <View {...responder.panHandlers} accessible accessibilityRole="button"
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
      transform: [{ rotate: props.angle + "deg" }], borderWidth: props.target ? 2 : 0, borderColor: '#ffe0a0', borderRadius: 5 }}>
      {props.renderCard(props.id)}
      <View style={styles.badge}><Text style={styles.number}>{props.index + 1}</Text></View>
    </View>
    {props.selected && <Animated.View pointerEvents="none" style={{ position: 'absolute', left: previewLeft,
      bottom: 16, width: previewWidth, height: props.previewHeight, transform: [{ translateX: previewX }],
      shadowColor: '#000', shadowOpacity: .8, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 20 }}>
      {props.renderPreview ? props.renderPreview(props.id, props.previewHeight, previewWidth) : props.renderCard(props.id, true)}
    </Animated.View>}
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




