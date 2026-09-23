import {createContext,useCallback,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import {AccessibilityInfo,Animated,Easing,StyleSheet,View,type ViewProps} from 'react-native';
import Svg,{Circle,Path} from 'react-native-svg';
import type {CombatFrame,CombatOrigin} from '../game/model';

type Point={x:number;y:number};
type Link={from:Point;to:Point;retrigger:boolean;key:string};
const Context=createContext({register:(_key:string,_view:View|null)=>{},reducedMotion:false});
export const anchorKey=(origin:CombatOrigin)=>`${origin.side}:${origin.kind}${origin.kind==='spell'?`:${origin.index}`:''}`;
export function CombatAnchor({id,...props}:ViewProps&{id:string}){
 const {register}=useContext(Context);
 const ref=useCallback((view:View|null)=>register(id,view),[id,register]);
 return <View {...props} ref={ref} collapsable={false}/>;
}
export const useCombatMotion=()=>useContext(Context).reducedMotion;

function Dart({link,order,speed,reducedMotion}:{link:Link;order:number;speed:number;reducedMotion:boolean}){
 const [progress,setProgress]=useState(0),value=useRef(new Animated.Value(0)).current;
 useEffect(()=>{
  value.setValue(0);if(reducedMotion){setProgress(.7);return;}
  const listener=value.addListener(({value:v})=>setProgress(v));
  const animation=Animated.sequence([Animated.delay(order*110/Math.max(1,speed)),Animated.timing(value,{toValue:1,duration:Math.max(420,1000/speed),easing:Easing.linear,useNativeDriver:false})]);
  animation.start();return()=>{animation.stop();value.removeListener(listener);};
 },[link.key,reducedMotion,speed]);
 const {from,to}=link,dx=to.x-from.x,dy=to.y-from.y,length=Math.hypot(dx,dy);
 // Bend row-to-row paths gently; same-card effects make a visible little loop.
 const control=length<5?{x:from.x+42,y:from.y-46}:{x:(from.x+to.x)/2,y:(from.y+to.y)/2-(Math.abs(dy)<40?(link.retrigger?50:28):18)};
 const at=(t:number)=>({x:(1-t)**2*from.x+2*(1-t)*t*control.x+t*t*to.x,y:(1-t)**2*from.y+2*(1-t)*t*control.y+t*t*to.y});
 const head=at(Math.min(1,progress/.72)),tail=at(Math.max(0,Math.min(1,progress/.72)-.23));
 const color=link.retrigger?'#efb4ff':'#8ffff0',opacity=reducedMotion?.6:progress<.72?1:Math.max(0,(1-progress)/.28);
 const path=`M ${from.x} ${from.y} Q ${control.x} ${control.y} ${to.x} ${to.y}`;
 return <>
  <Path d={path} stroke={color} strokeWidth={1.5} opacity={.22} fill="none"/>
  {!reducedMotion&&<Path d={`M ${tail.x} ${tail.y} L ${head.x} ${head.y}`} stroke={color} strokeWidth={7} strokeLinecap="round" opacity={opacity*.25}/>}
  <Circle cx={head.x} cy={head.y} r={4} fill="#ffffff" stroke={color} strokeWidth={2} opacity={opacity}/>
  <Circle cx={to.x} cy={to.y} r={progress>.65?6+(progress-.65)*32:4} stroke={color} strokeWidth={2} fill="none" opacity={opacity}/>
 </>;
}

/** One coordinate space for cards, Health bars and Imps, including across sides. */
export function CombatConnections({frame,speed,children}:{frame:CombatFrame;speed:number;children:ReactNode}){
 const root=useRef<View>(null),anchors=useRef(new Map<string,View>()),[links,setLinks]=useState<Link[]>([]),[reducedMotion,setReducedMotion]=useState(false),[size,setSize]=useState({width:0,height:0});
 const register=useCallback((key:string,view:View|null)=>{if(view)anchors.current.set(key,view);else anchors.current.delete(key);},[]);
 useEffect(()=>{let active=true;AccessibilityInfo.isReduceMotionEnabled().then(v=>{if(active)setReducedMotion(v);});const sub=AccessibilityInfo.addEventListener('reduceMotionChanged',setReducedMotion);return()=>{active=false;sub.remove();};},[]);
 const signature=JSON.stringify((frame.notices??[]).filter(n=>n.status==='trigger'||n.status==='retrigger'));
 useEffect(()=>{
  let cancelled=false;
  const measure=(view:View)=>new Promise<Point>(resolve=>view.measureInWindow((x,y,w,h)=>resolve({x:x+w/2,y:y+h/2})));
  const request=requestAnimationFrame(async()=>{
   if(!root.current)return;
   const origin=await new Promise<Point>(resolve=>root.current!.measureInWindow((x,y)=>resolve({x,y})));
   const next=await Promise.all((frame.notices??[]).filter(n=>n.origin&&n.index!==undefined&&(n.status==='trigger'||n.status==='retrigger')).map(async(n,i)=>{
    const from=anchors.current.get(anchorKey(n.origin!)),to=anchors.current.get(anchorKey({side:n.side,kind:'spell',index:n.status==='retrigger'?n.targetIndex:n.index}));
    if(!from||!to)return null;
    const [a,b]=await Promise.all([measure(from),measure(to)]);
    return {from:{x:a.x-origin.x,y:a.y-origin.y},to:{x:b.x-origin.x,y:b.y-origin.y},retrigger:n.status==='retrigger',key:`${frame.tick}-${signature}-${i}`};
   }));
   if(!cancelled)setLinks(next.filter((l):l is Link=>!!l));
  });
  return()=>{cancelled=true;cancelAnimationFrame(request);};
 },[frame.tick,signature,size.width,size.height]);
 return <Context.Provider value={{register,reducedMotion}}><View ref={root} collapsable={false} onLayout={e=>setSize(e.nativeEvent.layout)} style={{flex:1}}>
  {children}
  <View pointerEvents="none" style={[StyleSheet.absoluteFill,{zIndex:90}]}><Svg width={size.width} height={size.height}>{links.map((link,i)=><Dart key={link.key} link={link} order={i} speed={speed} reducedMotion={reducedMotion}/>)}</Svg></View>
 </View></Context.Provider>;
}
