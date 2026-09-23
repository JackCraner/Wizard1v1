import { AugmentGlossary } from '../components/AugmentGlossary';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AUGMENTS } from '../game/augments';
import { RULES } from '../game/engine';
import { palette, typography } from '../theme';
import type { Command, Session } from '../game/model';

const art = {
 background: require('../../assets/Level-up_background.png'),
 banner: require('../../assets/Level-Up.png'),
 frame: require('../../assets/Augment_border.png'),
};

export function AugmentChoice({ session, busy, error, act }: {
 session: Session; busy: boolean; error?: string; act: (command: Command) => void;
}) {
 const {height} = useWindowDimensions();
 const compact = height < 500;
 return <View style={{flex:1,backgroundColor:palette.black}}>
  <Image accessible={false} source={art.background} resizeMode="cover" style={[StyleSheet.absoluteFill,{width:'100%',height:'100%'}]}/>
  <View pointerEvents="none" style={[StyleSheet.absoluteFill,{backgroundColor:'#080d1980'}]}/>
  <SafeAreaView style={{flex:1,paddingHorizontal:compact?20:40,paddingVertical:compact?8:24}}>
   <View style={{width:'100%',maxWidth:1080,flex:1,alignSelf:'center',gap:compact?4:14}}>
    <View style={{alignItems:'center',gap:compact?0:4,flexDirection:compact?'row':'column',justifyContent:'center'}}>
     <View style={{alignItems:'center',justifyContent:'center'}}>
      <View pointerEvents="none" style={{position:'absolute',width:'80%',height:'45%',borderRadius:20,backgroundColor:palette.goldBorder+'33',boxShadow:'0 0 24px '+palette.goldBorder+'99'}}/>
     <Image source={art.banner} accessibilityLabel="Level up" resizeMode="contain" style={{width:compact?150:330,height:compact?42:88}}/>
     </View>
     <View style={{gap:compact?1:3,alignItems:'center'}}>
      <Text accessibilityRole="header" style={{color:palette.cream,fontFamily:typography.serif,fontSize:compact?17:28,fontWeight:'700'}}>Level {session.level}{compact ? ' · Choose one augment' : ''}</Text>
      <Text style={{color:palette.gold,fontSize:compact?11:15,fontWeight:'700'}}>+{RULES.healthPerLevel} max Health · {session.level} trophies per win</Text>
      {!compact && <Text style={{color:palette.parchmentMuted,fontSize:13}}>Choose one permanent augment</Text>}
     </View>
    </View>
    <View style={{flex:1,minHeight:0,flexDirection:'row',justifyContent:'center',gap:compact?8:18}}>
     {session.augmentOffers.map((id,slot)=>{
      const augment=AUGMENTS[id];
      const used=session.augmentRerolledSlots?.includes(slot);
      const available=Object.keys(AUGMENTS).some(candidate=>!session.augments.includes(candidate)&&!session.augmentOffers.includes(candidate));
      const rerollDisabled=busy||!!used||!available;
      return <View key={id} style={{flex:1,minWidth:0,maxWidth:330,gap:2}}>
       <View style={{flex:1,minHeight:0}}>
       <View pointerEvents="none" style={{position:'absolute',inset:'10%',borderRadius:20,backgroundColor:palette.goldBorder+'15',boxShadow:'0 0 20px '+palette.goldBorder+'66'}}/>
       <Image accessible={false} source={art.frame} resizeMode="stretch" style={[StyleSheet.absoluteFill,{width:'100%',height:'100%'}]}/>
       <View style={{flex:1,minHeight:0,marginHorizontal:'12%',marginTop:compact?34:56,marginBottom:compact?14:30,gap:compact?4:16}}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{gap:compact?6:14,paddingBottom:8}} style={{flex:1}}>
         <Text accessibilityRole="header" style={{color:palette.cream,fontFamily:typography.serif,fontSize:compact?18:25,lineHeight:compact?21:30,fontWeight:'700',textAlign:'center'}}>{augment.name}</Text>
         <View style={{height:1,backgroundColor:palette.goldBorder,opacity:.5,marginHorizontal:20}}/>
         <Text style={{color:palette.parchment,fontSize:compact?14:17,lineHeight:compact?20:25,textAlign:'center'}}>{augment.description}</Text>
         <AugmentGlossary description={augment.description}/>
        </ScrollView>
        <View style={{flexDirection:'row',gap:4}}>
        <Pressable accessibilityRole="button" accessibilityLabel={'Choose '+augment.name} disabled={busy} onPress={()=>act({type:'chooseAugment',augment:id})} style={({pressed})=>({flex:1,minHeight:44,justifyContent:'center',alignItems:'center',borderWidth:1,borderColor:palette.goldBorder,borderRadius:5,backgroundColor:pressed?palette.goldMuted:palette.gold,opacity:busy?.5:1})}>
         <Text style={{color:palette.brownSurface,fontSize:14,fontWeight:'800'}}>Choose augment</Text>
        </Pressable>
       <Pressable accessibilityRole="button" accessibilityLabel={used?'Reroll used for slot '+(slot+1):'Reroll '+augment.name+' once for free'} accessibilityState={{disabled:rerollDisabled}} disabled={rerollDisabled} onPress={()=>act({type:'rerollAugment',slot})} style={({pressed})=>({alignSelf:'center',width:44,height:44,justifyContent:'center',alignItems:'center',borderRadius:8,borderWidth:1,borderColor:palette.goldBorder,backgroundColor:pressed?palette.goldMuted:palette.brownSurface,boxShadow:rerollDisabled?'none':'0 0 10px '+palette.goldBorder+'88',opacity:rerollDisabled?.35:1})}>
        <Text style={{color:palette.gold,fontSize:28,lineHeight:32,fontWeight:'700'}}>⟳</Text>
       </Pressable>
       </View>
       </View>
       </View>
      </View>;
     })}
    </View>
    {!!error&&<Text accessibilityRole="alert" style={{color:palette.dangerText,textAlign:'center'}}>{error}</Text>}
   </View>
  </SafeAreaView>
 </View>;
}
