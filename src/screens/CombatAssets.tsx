import { palette } from '../theme';
import { Image, Text, View } from 'react-native';

export const combatArt = {
  background: require('../../assets/CombatBackground.png'),
  health: require('../../assets/healthBar.png'),
  ward: require('../../assets/ManaBar.png'),
};
export function OrnateMeter({ value, max }: { value: number; max: number }) {
  const ratio = max ? Math.max(0, Math.min(1, value / max)) : 0;
  return <View accessibilityLabel={`Health ${value} of ${max}`} style={{ height: 17, width: '100%', overflow: 'hidden' }}>
    {/* Clip the transparent padding in the supplied frame without altering its source. */}
    <Image accessible={false} source={combatArt.health} resizeMode="stretch" style={{ position: 'absolute', left: 0, top: '-48%', width: '100%', height: '200%' }} />
    <View style={{ position: 'absolute', left: '11%', right: '11%', top: '32%', bottom: '30%', overflow: 'hidden', borderRadius: 3, backgroundColor: '#08080888' }}><View style={{ width: `${ratio * 100}%`, height: '100%', backgroundColor: '#c73136', opacity: .85 }} /></View>
    <Text style={{ color: '#fff2d9', fontSize: 9, textAlign: 'center', lineHeight: 17, textShadowColor: palette.black, textShadowRadius: 3, textShadowOffset: { width: 1, height: 1 } }}>{value} / {max}</Text>
  </View>;
}

export function WardMeter({ value, capacity }: { value: number; capacity: number }) {
  if (value <= 0) return <View accessible={false} style={{height:13}}/>;
  // Capacity sizes the frame; remaining Ward fills it. Keep small grants readable.
  return <View style={{height:13,marginHorizontal:'8%'}}>
    <View accessible accessibilityLabel={`${value} of ${capacity} Ward`} style={{height:13,alignSelf:'center',width:90+capacity*0.4,maxWidth:'100%',overflow:'hidden'}}>
      <Image accessible={false} source={combatArt.ward} resizeMode="stretch" style={{position:'absolute',left:0,top:'-76%',width:'100%',height:'260%'}}/>
      <View style={{position:'absolute',left:'14%',right:'14%',top:'28%',bottom:'32%',backgroundColor:palette.black,overflow:'hidden',borderRadius:2}}>
        <View style={{height:'100%',width:`${Math.max(0,Math.min(100,value/Math.max(1,capacity)*100))}%`,backgroundColor:palette.ward}}/>
      </View>
      <Text style={{color:palette.white,fontSize:9,lineHeight:13,textAlign:'center',fontWeight:'800',textShadowColor:palette.black,textShadowRadius:2,textShadowOffset:{width:0,height:1}}}>{value}/{capacity}</Text>
    </View>
  </View>;
}
