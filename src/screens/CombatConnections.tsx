import { combatColors, palette } from '../theme';
import {createContext,memo,useCallback,useContext,useEffect,useMemo,useRef,useState,type ReactNode} from 'react';
import {AccessibilityInfo,Animated,Platform,StyleSheet,View,type ViewProps} from 'react-native';
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

/** react-native-svg exposes different imperative prop wrappers on web/native. */
function updateShape(node:Path|Circle|null,props:Record<string,string|number>){
 if(node)node.setNativeProps((Platform.OS==='web'?{style:props}:props) as never);
}
const Dart=memo(function Dart({link,value,reducedMotion}:{link:Link;value:Animated.Value;reducedMotion:boolean}){
 const trail=useRef<Path>(null),tailShape=useRef<Path>(null),headShape=useRef<Circle>(null),impact=useRef<Circle>(null);
 const geometry=useMemo(()=>{
  const {from,to}=link,dx=to.x-from.x,dy=to.y-from.y,length=Math.hypot(dx,dy);
  const control=length<5?{x:from.x+42,y:from.y-46}:{x:(from.x+to.x)/2,y:(from.y+to.y)/2-(Math.abs(dy)<40?(link.retrigger?50:28):18)};
  return {path:`M ${from.x} ${from.y} Q ${control.x} ${control.y} ${to.x} ${to.y}`,at:(t:number)=>({x:(1-t)**2*from.x+2*(1-t)*t*control.x+t*t*to.x,y:(1-t)**2*from.y+2*(1-t)*t*control.y+t*t*to.y})};
 },[link]);
 useEffect(()=>{
  let lastPhase='';
  const draw=(v:number)=>{
   const progress=triggerJumpProgress(v,link.order,link.jumps);
   const phase=reducedMotion?'reduced':progress<0?'waiting':progress<1?'flying':v<1?'trail':'done';
   // Waiting darts and finished trails are static until their phase changes.
   if(phase!=='flying'&&phase===lastPhase)return;
   lastPhase=phase;
   const head=geometry.at(Math.max(0,Math.min(1,progress/.85))),tail=geometry.at(Math.max(0,Math.min(1,progress/.85)-.23));
   const opacity=reducedMotion?.6:progress<0?0:progress<.85?1:Math.max(0,(1-progress)/.15);
   updateShape(trail.current,{opacity:progress>=1&&v<1?.18:opacity*.65});
   updateShape(tailShape.current,{d:`M ${tail.x} ${tail.y} L ${head.x} ${head.y}`,opacity:opacity*.45});
   updateShape(headShape.current,{cx:head.x,cy:head.y,opacity});
   updateShape(impact.current,{r:progress>.85?6+(progress-.85)*60:4,opacity});
  };
  draw(0);
  const id=value.addListener(({value:v})=>draw(v));
  return()=>value.removeListener(id);
 },[link,value,reducedMotion,geometry]);
 const color=link.retrigger?combatColors.retrigger:combatColors.dart;
 return <>
  <Path ref={trail} d={geometry.path} stroke={color} strokeWidth={3} opacity={0} fill="none"/>
  {!reducedMotion&&<Path ref={tailShape} d={`M ${link.from.x} ${link.from.y} L ${link.from.x} ${link.from.y}`} stroke={color} strokeWidth={11} strokeLinecap="round" opacity={0}/>}
  <Circle ref={headShape} cx={link.from.x} cy={link.from.y} r={5} fill={palette.white} stroke={color} strokeWidth={2} opacity={0}/>
  <Circle ref={impact} cx={link.to.x} cy={link.to.y} r={4} stroke={color} strokeWidth={2} fill="none" opacity={0}/>
 </>;
});

// Independent trees run together; only descendants wait for their parent hop.
function DartSequence({links,speed,playing,reducedMotion}:{links:Link[];speed:number;playing:boolean;reducedMotion:boolean}){
 const value=useFeedbackProgress(playing&&!reducedMotion&&links.length>0,COMBAT_TICK_MS/speed,undefined,0,false);
 return <>{links.map(link=><Dart key={link.key} link={link} value={value} reducedMotion={reducedMotion}/>)}</>;
}

/** One coordinate space for cards, Health bars and Imps, including across sides. */
export function CombatConnections({frame,speed,playing,children}:{frame:CombatFrame;speed:number;playing:boolean;children:ReactNode}){
 const root=useRef<View>(null),anchors=useRef(new Map<string,View>()),[links,setLinks]=useState<Link[]>([]),[reducedMotion,setReducedMotion]=useState(false),[size,setSize]=useState({width:0,height:0});
 const register=useCallback((key:string,view:View|null)=>{if(view)anchors.current.set(key,view);else anchors.current.delete(key);},[]);
 useEffect(()=>{let active=true;AccessibilityInfo.isReduceMotionEnabled().then(v=>{if(active)setReducedMotion(v);});const sub=AccessibilityInfo.addEventListener('reduceMotionChanged',setReducedMotion);return()=>{active=false;sub.remove();};},[]);
 const schedule=useMemo(()=>triggerSchedule(frame),[frame]);
 const context=useMemo(()=>({register,reducedMotion}),[register,reducedMotion]);
 useEffect(()=>{
  let cancelled=false;
  const measure=(view:View)=>new Promise<Point>(resolve=>view.measureInWindow((x,y,w,h)=>resolve({x:x+w/2,y:y+h/2})));
  if(!schedule.length){setLinks(previous=>previous.length?[]:previous);return;}
  const request=requestAnimationFrame(async()=>{
   if(!root.current)return;
   const origin=await new Promise<Point>(resolve=>root.current!.measureInWindow((x,y)=>resolve({x,y})));
   const measurements=new Map<View,Promise<Point>>();
   const once=(view:View)=>{let point=measurements.get(view);if(!point){point=measure(view);measurements.set(view,point);}return point;};
   const next=await Promise.all(schedule.map(async({notice:n,order,jumps},i)=>{
    const from=anchors.current.get(anchorKey(n.origin!)),to=anchors.current.get(anchorKey({side:n.side,kind:'spell',index:n.status==='retrigger'?n.targetIndex:n.index}));
    if(!from||!to)return null;
    const [a,b]=await Promise.all([once(from),once(to)]);
    return {from:{x:a.x-origin.x,y:a.y-origin.y},to:{x:b.x-origin.x,y:b.y-origin.y},retrigger:n.status==='retrigger',key:`${frame.tick}-${n.triggerId??i}-${n.status}`,order,jumps};
   }));
   if(!cancelled)setLinks(next.filter((l):l is Link=>!!l));
  });
  return()=>{cancelled=true;cancelAnimationFrame(request);};
 },[schedule,frame.tick,size.width,size.height]);
 return <Context.Provider value={context}><View ref={root} collapsable={false} onLayout={e=>setSize(e.nativeEvent.layout)} style={{flex:1}}>
  {children}
  <View pointerEvents="none" style={[StyleSheet.absoluteFill,{zIndex:90}]}><Svg width={size.width} height={size.height}><DartSequence key={links.map(l=>l.key).join('|')} links={links} speed={speed} reducedMotion={reducedMotion} playing={playing}/></Svg></View>
 </View></Context.Provider>;
}
