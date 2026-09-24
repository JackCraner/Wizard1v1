import {useEffect,useRef} from 'react';
import {Animated,Easing,Platform} from 'react-native';

/** Linear progress resumes at the same position without a per-frame JS listener.
 * SVG darts opt out of the native driver because they update path geometry. */
export function useFeedbackProgress(playing:boolean,duration:number,onDone?:()=>void,delay=0,native=true){
 const value=useRef(new Animated.Value(-delay/duration)).current;
 const position=useRef(-delay/duration),done=useRef(onDone);
 done.current=onDone;
 useEffect(()=>{
  if(!playing||position.current>=1)return;
  const start=position.current,started=performance.now();
  value.setValue(start);
  const animation=Animated.timing(value,{toValue:1,duration:Math.max(0,(1-start)*duration),easing:Easing.linear,useNativeDriver:native&&Platform.OS!=='web',isInteraction:false});
  animation.start(({finished})=>{if(finished){position.current=1;done.current?.();}});
  return()=>{position.current=Math.min(1,start+(performance.now()-started)/duration);animation.stop();};
 },[playing,duration,value,native]);
 return value;
}
