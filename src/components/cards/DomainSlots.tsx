import {Image,Text,View,type ImageSourcePropType} from 'react-native';
import Svg,{Path} from 'react-native-svg';
import type {Domain} from '../../config/catalogue';
const icons:Record<Domain,ImageSourcePropType>={
 nature:require('../../../assets/Nature_Domain.png'),water:require('../../../assets/Water_Domain.png'),fire:require('../../../assets/Fire_Domain.png'),holy:require('../../../assets/Holy_Domain.png'),affliction:require('../../../assets/Affliction_Domain.png'),
};
export function DomainSlots({domains,slots=2,compact=false}:{domains:Domain[];slots?:number;compact?:boolean}) {
 const size=compact?34:46;
 return <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:4}}>
  <View><Text style={{fontSize:8,color:'#ccb68d',letterSpacing:.5}}>DOMAINS</Text><Text style={{fontSize:10,color:'#eed49a'}}>{domains.length}/{slots}</Text></View>
  {Array.from({length:slots},(_,i)=>{const domain=domains[i];return <View key={i} accessible accessibilityLabel={domain?domain.charAt(0).toUpperCase()+domain.slice(1)+' domain':'Empty domain slot '+(i+1)+'. Buy a spell to choose a domain.'} style={{width:size,height:size,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:domain?'#9f844c':'#5f523c',borderRadius:5,backgroundColor:'#0e100dcc'}}>
   {domain?<Image accessible={false} source={icons[domain]} resizeMode="contain" style={{width:'100%',height:'100%'}}/>:<Svg width={size-6} height={size-6} viewBox="0 0 32 32"><Path d="M16 2 29 16 16 30 3 16Z" fill="#29261e" stroke="#857451" strokeWidth="1"/><Path d="M16 10v12M10 16h12" stroke="#aa956c" strokeWidth="1.5"/></Svg>}
  </View>})}
 </View>;
}
