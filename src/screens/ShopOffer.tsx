import { useEffect, useRef, type ReactNode } from 'react';
import { PanResponder, Platform, View, type StyleProp, type ViewStyle } from 'react-native';

export type ShopPointer = { x: number; y: number };
export function ShopOffer({ label, hint, style, disabled, children, onInspect, onLift, onMove, onDrop, onCancel }: {
  hint?: string; style?: StyleProp<ViewStyle>;
  label: string; disabled: boolean; children: ReactNode;
  onInspect: () => void; onLift: (p: ShopPointer) => void; onMove: (p: ShopPointer) => void;
  onDrop: (p: ShopPointer) => void; onCancel: () => void;
}) {
  const latest=useRef({disabled,onInspect,onLift,onMove,onDrop,onCancel});
  latest.current={disabled,onInspect,onLift,onMove,onDrop,onCancel};
  const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const active=useRef(false), lifted=useRef(false);
  const point=useRef({x:0,y:0});
  const clear=()=>{if(timer.current)clearTimeout(timer.current);timer.current=null;};
  const lift=()=>{if(active.current&&!latest.current.disabled&&!lifted.current){lifted.current=true;latest.current.onLift(point.current);}};
  const cancel=()=>{clear();active.current=false;lifted.current=false;latest.current.onCancel();};
  useEffect(()=>()=>{clear();},[]);
  useEffect(()=>{if(disabled)cancel();},[disabled]);
  const responder=useRef(PanResponder.create({
    onStartShouldSetPanResponder:()=>!latest.current.disabled,
    onPanResponderGrant:(e)=>{clear();active.current=true;lifted.current=false;point.current={x:e.nativeEvent.pageX,y:e.nativeEvent.pageY};timer.current=setTimeout(lift,300);},
    onPanResponderMove:(_,g)=>{if(!active.current)return;point.current={x:g.moveX,y:g.moveY};if(Math.hypot(g.dx,g.dy)>7){clear();lift();}if(lifted.current)latest.current.onMove(point.current);},
    onPanResponderRelease:()=>{clear();if(!active.current)return;active.current=false;if(lifted.current){lifted.current=false;latest.current.onDrop(point.current);}else latest.current.onInspect();},
    onPanResponderTerminate:cancel,
    onPanResponderTerminationRequest:()=>false,
  })).current;
  return <View {...responder.panHandlers} accessibilityRole="button" accessible accessibilityLabel={label}
    accessibilityHint={hint ?? 'Hold for card and keyword details. Drag into your hand to buy. Tap for accessible purchase controls.'}
    accessibilityState={{disabled}} onAccessibilityTap={()=>!disabled&&onInspect()}
    {...(Platform.OS==='web'?{tabIndex:0,onKeyDown:(e:{key:string;preventDefault:()=>void})=>{if(!disabled&&(e.key==='Enter'||e.key===' ')){e.preventDefault();onInspect();}}}:{})}
    style={[{flex:1,minWidth:0,alignItems:'center',...(Platform.OS==='web'?{touchAction:'none' as const,userSelect:'none' as const}:{})},style]}>{children}</View>;
}
