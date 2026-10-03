import {Animated,Text} from 'react-native';
import type {SpellFlight as Flight} from '../game/spellFlights';
import {DOMAIN_COLORS,palette} from '../theme';
import {useFeedbackProgress} from './useFeedbackProgress';
import {combatNumberSize} from './combatNumberSize';
export type FlightPoint={x:number;y:number};
export type PositionedFlight=Flight&{from:FlightPoint;to:FlightPoint;rack:FlightPoint;feedback:FlightPoint;feedbackWidth:number;key:string};

export function SpellFlight({flight:f,playing,speed,reducedMotion}:{flight:PositionedFlight;playing:boolean;speed:number;reducedMotion:boolean}){
 const progress=useFeedbackProgress(playing,1800/speed,undefined,0,false);
 const color=DOMAIN_COLORS[f.card.domain],direction=f.side==='player'?1:-1;
 const statusLabel=(f.card.combat?.effects??[]).filter(e=>e.kind==='status'&&e.target==='enemy').map(e=>e.status).filter(Boolean).join(' · ');
 const impact=f.offensive?f.to:{x:f.from.x,y:f.from.y-50};
 const lift={x:f.from.x+(f.offensive?direction*18:0),y:f.from.y-18};
 // The card stays legible at launch, then continuously rounds and contracts.
 // Layout and color interpolation share one pausable clock on web and native.
 const at=[0,.12,.58,.7,.78,.9,1];
 const x=progress.interpolate({inputRange:at,outputRange:[f.from.x,lift.x,impact.x,impact.x,f.rack.x,f.rack.x,f.rack.x]});
 const y=progress.interpolate({inputRange:at,outputRange:[f.from.y,lift.y,impact.y,impact.y,f.rack.y+18,f.rack.y,f.rack.y]});
 const opacity=progress.interpolate({inputRange:[0,.08,.58,.7,.78,.9,1],outputRange:f.returns?[0,1,1,0,0,.65,0]:[0,1,1,0,0,0,0]});
 const morphAt=[0,.18,.54,.7,.78,1];
 const shape=(card:number,orb:number)=>progress.interpolate({inputRange:morphAt,outputRange:f.offensive?[card,card,orb,orb,card,card]:[card,card,card,card,card,card]});
 const lettering=progress.interpolate({inputRange:[0,.18,.43,.7,.78,1],outputRange:f.offensive?[1,1,0,0,1,1]:[1,1,1,1,1,1]});
 return <>
  <Animated.View pointerEvents="none" style={{position:'absolute',left:0,top:0,opacity:reducedMotion?0:opacity,transform:[{translateX:x},{translateY:y},{rotate:progress.interpolate({inputRange:[0,.18,.54,.78,1],outputRange:['0deg',direction*6+'deg','0deg','0deg','0deg']})}]}}>
   <Animated.View testID={f.offensive?'spell-energy-body':undefined} style={{position:'absolute',left:shape(-58,-14),top:shape(-30,-14),width:shape(116,28),height:shape(60,28),borderRadius:shape(8,14),borderWidth:2,borderColor:color,overflow:'hidden',backgroundColor:progress.interpolate({inputRange:morphAt,outputRange:f.offensive?['#18232b','#18232b',color,color,'#18232b','#18232b']:['#18232b','#18232b','#18232b','#18232b','#18232b','#18232b']}),boxShadow:('0 0 22px '+color)}}>
    <Animated.View style={{width:112,padding:7,opacity:lettering}}><Text numberOfLines={2} style={{color:palette.cream,fontWeight:'900',fontSize:12,textAlign:'center'}}>{f.card.name}</Text><Text style={{color,fontSize:10,textAlign:'center'}}>{f.echo?'≈ ECHO':f.offensive?'✦':'✧ SUPPORT'}</Text></Animated.View>
   </Animated.View>
   {f.offensive&&<Animated.View style={{position:'absolute',left:-5,top:-5,width:10,height:10,borderRadius:5,backgroundColor:'#fff8e8',boxShadow:('0 0 12px '+color),opacity:progress.interpolate({inputRange:[0,.22,.54,.7,.78,1],outputRange:[0,0,.9,.9,0,0]})}}/>}
  </Animated.View>
  <Animated.View pointerEvents="none" style={{position:'absolute',left:f.feedback.x,top:f.feedback.y,width:f.feedbackWidth,alignItems:'center',opacity:reducedMotion?1:progress.interpolate({inputRange:[0,.54,.6,.86,1],outputRange:[0,0,1,1,0]}),transform:[{translateY:reducedMotion?0:progress.interpolate({inputRange:[0,.58,1],outputRange:[0,0,-4]})}]}}>
   <Text numberOfLines={1} style={{color,fontSize:9,fontWeight:'800',maxWidth:'100%',backgroundColor:'#10151eef',paddingHorizontal:4}}>{f.card.name}{f.echo?' ×2':''}</Text>
   {f.damage>0&&<Text numberOfLines={1} adjustsFontSizeToFit style={{maxWidth:'100%',color:palette.dangerText,fontWeight:'900',fontSize:combatNumberSize(f.damage,true,f.critical),textShadowColor:'#000',textShadowRadius:4}}>{f.damage>f.impDamage?'−'+(f.damage-f.impDamage):''}{f.impDamage>0?(f.damage>f.impDamage?' · ':'')+'Imp −'+f.impDamage:''}{f.critical?'!':''}</Text>}
   {f.ward>0&&<Text numberOfLines={1} adjustsFontSizeToFit style={{maxWidth:'100%',color:palette.ward,fontWeight:'900',fontSize:combatNumberSize(f.ward,true)}}>◇ −{f.ward}</Text>}
   {f.healing>0&&<Text numberOfLines={1} adjustsFontSizeToFit style={{maxWidth:'100%',color:'#a9eac2',fontWeight:'900',fontSize:combatNumberSize(f.healing,true)}}>+{f.healing}</Text>}
   {!f.damage&&!f.ward&&!f.healing&&<Text style={{color,fontSize:13,fontWeight:'900'}}>{f.offensive?(statusLabel||'✦ Impact'):'✧ Support'}</Text>}
  </Animated.View>
  <Animated.View pointerEvents="none" style={{position:'absolute',left:impact.x-12,top:impact.y-12,width:24,height:24,borderRadius:12,borderWidth:2,borderColor:color,opacity:reducedMotion?0:progress.interpolate({inputRange:[0,.56,.6,.78,1],outputRange:[0,0,.9,0,0]}),transform:[{scale:progress.interpolate({inputRange:[0,.56,.78,1],outputRange:[.5,.5,2,2]})}]}}/>
 </>;
}

