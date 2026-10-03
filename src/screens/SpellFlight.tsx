import {Animated,Text} from 'react-native';
import type {SpellFlight as Flight} from '../game/spellFlights';
import {DOMAIN_COLORS,palette} from '../theme';
import {useFeedbackProgress} from './useFeedbackProgress';
import {combatNumberSize} from './combatNumberSize';
export type FlightPoint={x:number;y:number};
export type PositionedFlight=Flight&{from:FlightPoint;to:FlightPoint;rack:FlightPoint;feedback:FlightPoint;feedbackWidth:number;key:string};

export function SpellFlight({flight:f,playing,speed,reducedMotion}:{flight:PositionedFlight;playing:boolean;speed:number;reducedMotion:boolean}){
 const progress=useFeedbackProgress(playing,1800/speed);
 const color=DOMAIN_COLORS[f.card.domain],direction=f.side==='player'?1:-1;
 const impact=f.offensive?f.to:{x:f.from.x,y:f.from.y-50};
 const at=[0,.12,.46,.64,.78,1];
 const x=progress.interpolate({inputRange:at,outputRange:[f.from.x,f.from.x+(f.offensive?direction*12:0),impact.x,impact.x,impact.x,f.rack.x]});
 const y=progress.interpolate({inputRange:at,outputRange:[f.from.y,f.from.y-15,impact.y,impact.y,impact.y-25,f.rack.y]});
 const opacity=progress.interpolate({inputRange:[0,.08,.46,.64,.78,.9,1],outputRange:f.returns?[0,1,1,0,0,.65,0]:[0,1,1,0,0,0,0]});
 return <>
  <Animated.View pointerEvents="none" style={{position:'absolute',left:-58,top:-30,width:116,height:60,opacity:reducedMotion?0:opacity,transform:[{translateX:x},{translateY:y},{rotate:progress.interpolate({inputRange:[0,.46,.64,1],outputRange:['0deg',`${f.offensive?direction*12:0}deg`,'0deg','0deg']})},{scale:progress.interpolate({inputRange:[0,.12,.46,.64,.78,1],outputRange:[.85,1.05,f.offensive?.8:1.2,1.5,.45,.8]})}],borderRadius:8,borderWidth:2,borderColor:color,backgroundColor:'#18232bf5',padding:7,boxShadow:`0 0 18px ${color}88`}}>
   <Text numberOfLines={2} style={{color:palette.cream,fontWeight:'900',fontSize:12,textAlign:'center'}}>{f.card.name}</Text><Text style={{color,fontSize:10,textAlign:'center'}}>{f.echo?'≈ ECHO · ':''}{f.offensive?'✦':'✧'} {'★'.repeat(f.card.stars)}</Text>
  </Animated.View>
  <Animated.View pointerEvents="none" style={{position:'absolute',left:f.feedback.x,top:f.feedback.y,width:f.feedbackWidth,alignItems:'center',opacity:reducedMotion?1:progress.interpolate({inputRange:[0,.4,.47,.82,1],outputRange:[0,0,1,1,0]}),transform:[{translateY:reducedMotion?0:progress.interpolate({inputRange:[0,.46,1],outputRange:[0,0,-4]})}]}}>
   <Text numberOfLines={1} style={{color,fontSize:9,fontWeight:'800',maxWidth:'100%',backgroundColor:'#10151eef',paddingHorizontal:4}}>{f.card.name}{f.echo?' ×2':''}</Text>
   {f.damage>0&&<Text numberOfLines={1} adjustsFontSizeToFit style={{maxWidth:'100%',color:palette.dangerText,fontWeight:'900',fontSize:combatNumberSize(f.damage,true,f.critical),textShadowColor:'#000',textShadowRadius:4}}>{f.damage>f.impDamage?'−'+(f.damage-f.impDamage):''}{f.impDamage>0?(f.damage>f.impDamage?' · ':'')+'Imp −'+f.impDamage:''}{f.critical?'!':''}</Text>}
   {f.ward>0&&<Text numberOfLines={1} adjustsFontSizeToFit style={{maxWidth:'100%',color:palette.ward,fontWeight:'900',fontSize:combatNumberSize(f.ward,true)}}>◇ −{f.ward}</Text>}
   {f.healing>0&&<Text numberOfLines={1} adjustsFontSizeToFit style={{maxWidth:'100%',color:'#a9eac2',fontWeight:'900',fontSize:combatNumberSize(f.healing,true)}}>+{f.healing}</Text>}
   {!f.damage&&!f.ward&&!f.healing&&<Text style={{color,fontSize:13,fontWeight:'900'}}>{f.offensive?'✦ Cast':'✧ Cast'}</Text>}
  </Animated.View>
  <Animated.View pointerEvents="none" style={{position:'absolute',left:impact.x-30,top:impact.y-30,width:60,height:60,borderRadius:30,borderWidth:2,borderColor:color,opacity:reducedMotion?0:progress.interpolate({inputRange:[0,.44,.48,.7,1],outputRange:[0,0,.9,0,0]}),transform:[{scale:progress.interpolate({inputRange:[0,.44,.7,1],outputRange:[.5,.5,2,2]})}]}}/>
 </>;
}

