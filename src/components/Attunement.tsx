import { palette, DOMAIN_COLORS } from '../theme';
import { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import {attunementRanking} from '../game/attunement';
import type { Domain } from '../config/catalogue';

const domainName = (domain: Domain) => domain[0].toUpperCase() + domain.slice(1);
const art={nature:require('../../assets/Nature_Domain.png'),water:require('../../assets/Water_Domain.png'),fire:require('../../assets/Fire_Domain.png'),holy:require('../../assets/Holy_Domain.png'),affliction:require('../../assets/Affliction_Domain.png')};

export function AttunementPanel({ spells, ages }: { spells: string[]; ages?: number[] }) {
    const [open, setOpen] = useState(false);
    const ranks = attunementRanking(spells, ages);
    return <>
        <Pressable accessibilityRole="button"
            accessibilityLabel={'Attuned domains: ' + (ranks.slice(0, 2).map(r => r.domain + ' ' + r.count).join(', ') || 'none') + '. View priority.'}
            onPress={() => setOpen(true)} style={{ gap: 3, padding:4,borderRadius:9,borderWidth:1,borderColor:'#56786d',backgroundColor:palette.shopSurface }}>
            <Text style={{ color: palette.goldMuted, fontSize: 9, fontWeight: '800',letterSpacing:.6 }}>ATTUNEMENT  ›</Text>
            <View style={{flexDirection:'row',gap:4}}>{[0,1].map(index=>{const r=ranks[index];return <View key={index} style={{flex:1,alignItems:'center',gap:1,borderRadius:5,borderWidth:1,borderColor:r?DOMAIN_COLORS[r.domain]+'88':'#496058',backgroundColor:r?DOMAIN_COLORS[r.domain]+'14':'#ffffff04',paddingVertical:3}}>
              {r?<Image accessible={false} source={art[r.domain]} style={{width:25,height:22}} resizeMode="contain"/>:<Text style={{fontSize:19,color:'#76948a'}}>◇</Text>}
              <Text numberOfLines={1} adjustsFontSizeToFit style={{color:r?DOMAIN_COLORS[r.domain]:'#99b0a7',fontSize:9,fontWeight:'800'}}>{r?domainName(r.domain):'Open'}</Text>
              {r&&<View style={{position:'absolute',right:1,top:1,borderRadius:5,backgroundColor:palette.shopSurface,paddingHorizontal:2}}><Text style={{color:'#f0ebd8',fontSize:9,fontWeight:'800'}}>{r.count}</Text></View>}
            </View>})}</View>
        </Pressable>
        <Modal transparent visible={open} onRequestClose={() => setOpen(false)}>
            <View style={{ flex: 1, backgroundColor: palette.overlay, padding: 20, justifyContent: 'center', alignItems: 'center' }}>
                <View accessibilityViewIsModal style={{ width: '100%', maxWidth: 460, maxHeight: '100%', backgroundColor: '#17242c', padding: 14, borderRadius: 12, gap: 10 }}>
                    <Text accessibilityRole="header" style={{ color: palette.parchment, fontSize: 22 }}>Domain attunement</Text>
                    <Text style={{ color: '#d0ddd9', fontSize: 13, lineHeight: 18 }}>
                        Your two most numerous domains unlock their colored effects. Ties favor the oldest spell, even after reordering.
                    </Text>
                    <ScrollView contentContainerStyle={{ gap: 8 }}>
                        {!ranks.length&&<Text style={{color:'#afc4bc'}}>Buy a spell to attune your first domain. Two domains can be active.</Text>}
                        {ranks.map((r, i) => <View key={r.domain} style={{flexDirection:'row',gap:12,alignItems:'center',padding:10,borderWidth:1,borderColor:i<2?DOMAIN_COLORS[r.domain]:'#43534e',borderRadius:9,backgroundColor:DOMAIN_COLORS[r.domain]+'10'}}><Image accessible={false} source={art[r.domain]} style={{width:42,height:42}} resizeMode="contain"/><View style={{flex:1,gap:3}}><Text style={{color:DOMAIN_COLORS[r.domain],fontSize:16,fontWeight:'800'}}>{domainName(r.domain)} <Text style={{fontSize:11}}>{i<2?'✓ ATTUNED':'DORMANT'}</Text></Text><View style={{flexDirection:'row',gap:3}}>{Array.from({length:r.count},(_,j)=><View key={j} style={{height:5,width:16,borderRadius:3,backgroundColor:DOMAIN_COLORS[r.domain]}}/>)}</View><Text style={{color:'#c2d1c9',fontSize:11}}>{r.count} {r.count===1?'spell':'spells'} · Priority {i+1}{ranks.some(other=>other.domain!==r.domain&&other.count===r.count)?' · Older spell wins tie':''}</Text></View></View>)}
                    </ScrollView>
                    <Pressable accessibilityRole="button" onPress={() => setOpen(false)} style={{ padding: 12, backgroundColor: '#344951', borderRadius: 6 }}>
                        <Text style={{ color: palette.white, textAlign: 'center' }}>Close attunement</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    </>;
}
