import {Text,View} from 'react-native';
import Svg,{Circle} from 'react-native-svg';
import type {Fighter} from '../game/model';
import {palette} from '../theme';

export function HealthCircle({fighter,compact}:{fighter:Fighter;compact:boolean}){
 const size=compact?76:112,r=size/2-6,circumference=2*Math.PI*r;
 const ratio=Math.max(0,Math.min(1,fighter.health/Math.max(1,fighter.maxHealth)));
 return <View accessible accessibilityLabel={`Health ${fighter.health} of ${fighter.maxHealth}, Ward ${fighter.shield}`} style={{width:size,height:size}}>
  <Svg width={size} height={size}><Circle cx={size/2} cy={size/2} r={r} fill="#17191fee" stroke="#512b32" strokeWidth={5}/><Circle cx={size/2} cy={size/2} r={r} fill="none" stroke={ratio<.25?'#ff6058':'#e78a7f'} strokeWidth={5} strokeDasharray={`${circumference*ratio} ${circumference}`} transform={`rotate(-90 ${size/2} ${size/2})`} strokeLinecap="round"/></Svg>
  <View style={{position:'absolute',inset:0,alignItems:'center',justifyContent:'center'}}><Text style={{color:palette.cream,fontSize:compact?21:30,fontWeight:'900'}}>{fighter.health}</Text><Text style={{color:'#c4b7aa',fontSize:9}}>/ {fighter.maxHealth}</Text>{fighter.shield>0&&<Text style={{color:palette.ward,fontSize:10,fontWeight:'800'}}>◇ {fighter.shield}</Text>}</View>
 </View>;
}
