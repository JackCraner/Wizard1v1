import {useEffect,useRef} from 'react';
import {Animated,AccessibilityInfo,Text,View} from 'react-native';
export function MergeBurst({x,y,upgraded,onDone}:{x:number;y:number;upgraded:boolean;onDone:()=>void}) {
 const progress=useRef(new Animated.Value(0)).current;
 useEffect(()=>{
  let active=true;let animation:Animated.CompositeAnimation|undefined;
  AccessibilityInfo.isReduceMotionEnabled().then(reduced=>{
   if(!active)return;
   animation=Animated.timing(progress,{toValue:1,duration:reduced?300:upgraded?1400:1000,useNativeDriver:true});
   animation.start(({finished})=>{if(finished)onDone();});
  });return()=>{active=false;animation?.stop();};
 },[]);
 return <View pointerEvents="none" style={{position:'absolute',left:x-65,top:y-65,width:130,height:130,zIndex:2000,alignItems:'center',justifyContent:'center'}}>
  <Animated.View style={{position:'absolute',width:80,height:80,borderRadius:40,borderWidth:3,borderColor:upgraded?'#fff1a0':'#ffc85f',backgroundColor:'#ffd45c33',opacity:progress.interpolate({inputRange:[0,.2,1],outputRange:[0,1,0]}),transform:[{scale:progress.interpolate({inputRange:[0,1],outputRange:[.25,1.7]})}]}} />
  {[0,1,2,3,4,5].map(i=><Animated.Text key={i} style={{position:'absolute',color:'#ffe69a',fontSize:upgraded?22:15,opacity:progress.interpolate({inputRange:[0,.15,1],outputRange:[0,1,0]}),transform:[{translateX:progress.interpolate({inputRange:[0,1],outputRange:[0,Math.cos(i*Math.PI/3)*60]})},{translateY:progress.interpolate({inputRange:[0,1],outputRange:[0,Math.sin(i*Math.PI/3)*48]})}]}}>✦</Animated.Text>)}
  <Animated.View style={{opacity:progress.interpolate({inputRange:[0,.1,.7,1],outputRange:[0,1,1,0]}),transform:[{translateY:progress.interpolate({inputRange:[0,1],outputRange:[-15,-45]})}]}}><Text accessibilityLiveRegion="polite" style={{color:'#fff3bd',fontSize:upgraded?17:15,fontWeight:'900',textShadowColor:'#9a4e00',textShadowRadius:6,textShadowOffset:{width:0,height:1},backgroundColor:'#281b10ed',paddingHorizontal:8,paddingVertical:4,borderRadius:5}}>{upgraded?'✦ UPGRADED':' +1 XP '}</Text></Animated.View>
 </View>;
}
