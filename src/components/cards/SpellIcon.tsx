import { Image, Text, View } from 'react-native';
import { SPELL_ART } from './spellArt';
import { spellVisual } from './spellVisual';

// The same art is used for cards and their compact combat representation.
export function SpellIcon({id,size=24,opacity=1}:{id:string;size?:number;opacity?:number}) {
 const source=SPELL_ART[id];const visual=spellVisual(id);
 return <View style={{width:size,height:size,maxWidth:'100%',alignItems:'center',justifyContent:'center',opacity,overflow:'hidden',borderRadius:3}}>
   {source?<Image accessible={false} source={source} resizeMode="cover" style={{width:'100%',height:'100%'}}/>:<Text style={{fontSize:size*.85,color:visual.color}}>{visual.glyph}</Text>}
 </View>;
}
