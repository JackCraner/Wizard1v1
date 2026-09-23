import {useEffect,useRef} from 'react';
import {Animated,Easing} from 'react-native';

/** Keep the same animation position across pause, resume and speed changes. */
export function useFeedbackProgress(playing:boolean,duration:number,onDone?:()=>void,delay=0){
 const value=useRef(new Animated.Value(-delay/duration)).current;
 const position=useRef(-delay/duration),done=useRef(onDone);
 done.current=onDone;
 useEffect(()=>{const id=value.addListener(({value:v})=>{position.current=v;});return()=>value.removeListener(id);},[value]);
 useEffect(()=>{
  if(!playing||position.current>=1)return;
  const animation=Animated.timing(value,{toValue:1,duration:Math.max(0,(1-position.current)*duration),easing:Easing.linear,useNativeDriver:false});
  animation.start(({finished})=>{if(finished)done.current?.();});
  return()=>animation.stop();
 },[playing,duration,value]);
 return value;
}
