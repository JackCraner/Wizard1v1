import { palette, DOMAIN_COLORS, DOMAIN_INK, typography } from '../../theme';
import {ruleSections} from '../../game/cardText';
import {keywordDomain} from '../../game/attunement';
import { cardAt, UPGRADE_XP } from '../../game/upgrades';
import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { castLabel, keywordSpans, explainedKeywords, type CardDefinition } from '../../config/catalogue';
import { SPELL_ART } from './spellArt';
const colors=DOMAIN_COLORS;
const domainArt = { nature: require("../../../assets/Nature_Domain.png"), water: require("../../../assets/Water_Domain.png"), fire: require("../../../assets/Fire_Domain.png"), holy: require("../../../assets/Holy_Domain.png"), affliction: require("../../../assets/Affliction_Domain.png") };
const serif = typography.serif;
export type SpellCardProps = CardDefinition & {
    art?: ImageSourcePropType;
    compact?: boolean;
    shop?: boolean;
};
export function RulesText({ rules, keywords, card, fontSize = 12, color = palette.darkSurface }: {
    card?: Pick<CardDefinition,'combat'|'instantDomain'|'castDomain'>;
    domains?: readonly import('../../config/catalogue').Domain[];
    rules: string;
    keywords: string[];
    fontSize?: number;
    color?: string;
}) {
    const light=color===palette.darkSurface;
    return <View style={{gap:4}}>{ruleSections(rules,card).map((section,index)=>{
      const accent=section.domain?(light?DOMAIN_INK:DOMAIN_COLORS)[section.domain]:color;
      return <View key={index}>
        <Text style={{fontSize,color:accent,lineHeight:fontSize*1.3,textAlign:'center'}}>{keywordSpans(section.text.replace(/(?:Nature|Water|Fire|Holy|Affliction) attuned:\s*/gi,''),keywords).flatMap((part,i)=>part.text.split(/(\d+(?:\.\d+)?%?)/g).map((text,j)=><Text key={i+'-'+j} style={part.bold||/^\d/.test(text)?{fontWeight:'800'}:undefined}>{text}</Text>))}</Text>
      </View>;
    })}</View>;
}
export function SpellCard({ compact = false, shop = false, art, ...input }: SpellCardProps) {
    const card = input.xp !== undefined ? cardAt(input.id, input.xp) : input;
    const [size, setSize] = useState({ width: 160, height: 240 });
    const scale = size.width / 160;
    const color = colors[card.domain];
    const artwork = art ?? SPELL_ART[card.id];
    const tiny = compact && size.height < 115;
    const shopRulesSize = size.height < 160 ? 11 : Math.max(11, Math.min(14, scale * 12));
    return <View onLayout={e => setSize(e.nativeEvent.layout)} accessible accessibilityLabel={card.name + ', ' + card.domain + ', ' + card.stars + ' stars, ' + castLabel(card.castTicks) + '. ' + card.rules + (card.upgraded ? ' Upgraded.' : ' ' + (card.xp ?? 0) + ' of ' + UPGRADE_XP + ' XP.')} style={[s.card, { borderColor: card.upgraded ? '#fff0a1' : color, borderWidth: Math.max(1, 2 * scale), borderRadius: 8 * scale }]}>
  <View style={{ height: '14%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6 * scale, backgroundColor: '#10191c' }}><Text style={{ color: palette.gold, fontSize: Math.max(8, 15 * scale), letterSpacing: scale, fontWeight: '900' }}>{'★'.repeat(card.stars)}</Text>{shop && <Text style={{ color, fontSize: 9, fontWeight: '800' }}>{card.domain.toUpperCase()}</Text>}<Text style={{ color, fontSize: Math.max(9, 14 * scale), fontWeight: '900' }}>{tiny&&card.castTicks===0?'⚡':castLabel(card.castTicks)}</Text></View>
  {!shop && <View style={{ height: tiny ? '25%' : '37%', overflow: 'hidden', backgroundColor: color + '22' }}>{artwork ? <Image accessible={false} source={artwork} resizeMode="cover" style={{ width: '100%', height: '100%' }}/> : <Image accessible={false} source={domainArt[card.domain]} resizeMode="contain" style={{ width: "100%", height: "100%" }}/>}
   <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#10191cd9', paddingVertical: 2 * scale }}><Text style={{ color, fontSize: Math.max(6, 8 * scale), textAlign: 'center', letterSpacing: scale, fontWeight: '800' }}>{card.domain.toUpperCase()}{card.upgraded ? ' · UPGRADED' : ''}</Text></View>
  </View>}
  <View style={{ height: tiny ? '40%' : '15%', justifyContent: 'center', paddingHorizontal: 4 * scale, borderTopWidth: 1, borderTopColor: color + '66' }}><Text numberOfLines={2} adjustsFontSizeToFit minimumFontScale={.8} style={{ color: palette.parchment, fontFamily: serif, fontWeight: '700', fontSize: Math.max(9, 13 * scale), textAlign: 'center' }}>{card.name}</Text></View>
  <View style={{ flex: 1, backgroundColor: '#e7dfc7', paddingHorizontal: 5 * scale, paddingVertical: 3 * scale, justifyContent: 'center' }}>{tiny ? null : <RulesText card={card} rules={!shop&&size.height<200&&card.rules.length>100?card.rules.split('. ').slice(0,2).join('. ').replace(/\.$/,'')+'. Hold for full effects.':card.rules} keywords={card.keywords} fontSize={shop ? shopRulesSize : Math.max(9, Math.min(14, scale * (card.rules.length > 85 ? 10 : 12)))}/>}</View>
  {!shop && <View style={{ height: '4%', flexDirection: 'row', gap: 2, backgroundColor: '#171c19', padding: 1 }}>{[0, 1, 2].map(i => <View key={i} style={{ flex: 1, backgroundColor: i < (card.xp ?? 0) ? palette.gold : '#526050' }}/>)}</View>}
 </View>;
}
export function KeywordBoxes({ keywords, small = false }: {
    keywords: string[];
    small?: boolean;
}) {
    const items = explainedKeywords(keywords).filter(keyword=>keyword.id!=='attunement');
    if (!items.length)
        return null;
    return <View style={{ gap: small ? 3 : 6 }}>{items.map(item => <View key={item.id} style={[s.keyword, { padding: small ? 5 : 8 }]}><Text style={{ color: keywordDomain(item.name)?DOMAIN_COLORS[keywordDomain(item.name)!]:'#f2d394', fontSize: small ? 10 : 13, fontWeight: '800' }}>{item.name}</Text><Text style={{ color: '#e0d0ad', fontSize: small ? 9 : 11, lineHeight: small ? 11 : 15 }}>{item.description}</Text></View>)}</View>;
}
export function CardPreview({ card, height = 260, width, shop = false }: {
    card: CardDefinition;
    height?: number;
    width?: number;
    shop?: boolean;
}) {
    const cardWidth = height * 2 / 3;
    const hasKeywords = explainedKeywords(card.keywords).some(keyword=>keyword.id!=='attunement');
    return <View style={{ flexDirection: 'row', gap: hasKeywords ? 8 : 0, width: hasKeywords ? (width ?? cardWidth + 200) : cardWidth, height }}>
    <View style={{ width: cardWidth, height }}><SpellCard {...card} shop={shop}/></View>
    {hasKeywords && <ScrollView style={{ flex: 1, minWidth: 0 }} nestedScrollEnabled contentContainerStyle={{ paddingBottom: 4 }}><KeywordBoxes keywords={card.keywords} small/></ScrollView>}
  </View>;
}
const s = StyleSheet.create({ card: { flex: 1, overflow: 'hidden', backgroundColor: '#172326' }, keyword: { backgroundColor: '#21180ff5', borderWidth: 1, borderColor: '#93753f', borderRadius: 4 } });
