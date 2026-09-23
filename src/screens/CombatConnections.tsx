import { combatColors, palette } from '../theme';
import {createContext,useCallback,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import {AccessibilityInfo,StyleSheet,View,type ViewProps} from 'react-native';
import Svg,{Circle,Path} from 'react-native-svg';
import {useFeedbackProgress} from './useFeedbackProgress';
import {COMBAT_TICK_MS} from '../game/playback';
import {triggerSchedule,triggerJumpProgress} from '../game/triggerAnimation';
import type {CombatFrame,CombatOrigin} from '../game/model';

type Point={x:number;y:number};
type Link={from:Point;to:Point;retrigger:boolean;key:string;order:number;jumps:number};
const Context=createContext({register:(_key:string,_view:View|null)=>{},reducedMotion:false});
export const anchorKey=(origin:CombatOrigin)=>`${origin.side}:${origin.kind}${origin.kind==='spell'?`:${origin.index}`:''}`;
export function CombatAnchor({id,...props}:ViewProps&{id:string}){
 const {register}=useContext(Context);
 const ref=useCallback((view:View|null)=>register(id,view),[id,register]);
 return <View {...props} ref={ref} collapsable={false}/>;
}
export const useCombatMotion=()=>useContext(Context).reducedMotion;

function Dart({link,progress,complete,reducedMotion}:{link:Link;progress:number;complete:boolean;reducedMotion:boolean}){
 const {from,to}=link,dx=to.x-from.x,dy=to.y-from.y,length=Math.hypot(dx,dy);
 // Bend row-to-row paths gently; same-card effects make a visible little loop.
 const control=length<5?{x:from.x+42,y:from.y-46}:{x:(from.x+to.x)/2,y:(from.y+to.y)/2-(Math.abs(dy)<40?(link.retrigger?50:28):18)};
 const at=(t:number)=>({x:(1-t)**2*from.x+2*(1-t)*t*control.x+t*t*to.x,y:(1-t)**2*from.y+2*(1-t)*t*control.y+t*t*to.y});
 const head=at(Math.max(0,Math.min(1,progress/.85))),tail=at(Math.max(0,Math.min(1,progress/.85)-.23));
 const color=link.retrigger?combatColors.retrigger:combatColors.dart,opacity=reducedMotion?.6:progress<0?0:progress<.85?1:Math.max(0,(1-progress)/.15);
 const path=`M ${from.x} ${from.y} Q ${control.x} ${control.y} ${to.x} ${to.y}`;
 return <>
  <Path d={path} stroke={color} strokeWidth={3} opacity={progress>=1&&!complete?.18:opacity*.65} fill="none"/>
  {!reducedMotion&&<Path d={`M ${tail.x} ${tail.y} L ${head.x} ${head.y}`} stroke={color} strokeWidth={11} strokeLinecap="round" opacity={opacity*.45}/>}
  <Circle cx={head.x} cy={head.y} r={5} fill={palette.white} stroke={color} strokeWidth={2} opacity={opacity}/>
  <Circle cx={to.x} cy={to.y} r={progress>.85?6+(progress-.85)*60:4} stroke={color} strokeWidth={2} fill="none" opacity={opacity}/>
 </>;
}

// Independent trees run together; only descendants wait for their parent hop.
function DartSequence({links,speed,playing,reducedMotion}:{links:Link[];speed:number;playing:boolean;reducedMotion:boolean}){
 const [progress,setProgress]=useState(0);
 const value=useFeedbackProgress(playing&&!reducedMotion,COMBAT_TICK_MS/speed);
 useEffect(()=>{const id=value.addListener(({value:v})=>setProgress(v));return()=>value.removeListener(id);},[value]);
 return <>{links.map(link=><Dart key={link.key} link={link} progress={triggerJumpProgress(progress,link.order,link.jumps)} complete={progress>=1} reducedMotion={reducedMotion}/>)}</>;
}

/** One coordinate space for cards, Health bars and Imps, including across sides. */
export function CombatConnections({frame,speed,playing,children}:{frame:CombatFrame;speed:number;playing:boolean;children:ReactNode}){
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
   const next=await Promise.all(triggerSchedule(frame).map(async({notice:n,order,jumps},i)=>{
    const from=anchors.current.get(anchorKey(n.origin!)),to=anchors.current.get(anchorKey({side:n.side,kind:'spell',index:n.status==='retrigger'?n.targetIndex:n.index}));
    if(!from||!to)return null;
    const [a,b]=await Promise.all([measure(from),measure(to)]);
    return {from:{x:a.x-origin.x,y:a.y-origin.y},to:{x:b.x-origin.x,y:b.y-origin.y},retrigger:n.status==='retrigger',key:`${frame.tick}-${signature}-${i}`,order,jumps};
   }));
   if(!cancelled)setLinks(next.filter((l):l is Link=>!!l));
  });
  return()=>{cancelled=true;cancelAnimationFrame(request);};
 },[frame.tick,signature,size.width,size.height]);
 return <Context.Provider value={{register,reducedMotion}}><View ref={root} collapsable={false} onLayout={e=>setSize(e.nativeEvent.layout)} style={{flex:1}}>
  {children}
  <View pointerEvents="none" style={[StyleSheet.absoluteFill,{zIndex:90}]}><Svg width={size.width} height={size.height}><DartSequence key={links.map(l=>l.key).join('|')} links={links} speed={speed} reducedMotion={reducedMotion} playing={playing}/></Svg></View>
 </View></Context.Provider>;
}
